#!/usr/bin/env python3
"""
scan_drawing_notes.py — pull the numbered NOTES block off a product drawing PDF.

Same shape as scan_po_clauses.py, and for the same reason: it shells out to the
poppler-utils and tesseract binaries the Docker image already installs, so no
PyPI reachability is needed at build time behind the TLS-intercepting proxy.

    pdfinfo    page count and page size
    pdftotext  text layer, with -bbox-layout for word coordinates
    pdftoppm   rasterize (OCR, and cropping the note image)
    tesseract  OCR

WHAT MAKES THIS DIFFERENT FROM THE PO SCANNER
    The PO scanner only needed to know *whether* a clause number appeared. Here
    the position matters: the operator wants "A8, page 2" so they can find the
    note on the sheet, and a cropped image of it. That rules out plain
    pdftotext, which discards coordinates. -bbox-layout emits XML with a
    bounding box per word, which is what the zone reference is computed from.

NOTES BLOCKS, AS THEY ACTUALLY APPEAR
    Drafting convention numbers notes from the bottom up: the block sits above
    a "NOTES:" heading with item 1 directly above it and the highest number at
    the top. Usually top-left of sheet 1, but not reliably — the sample that
    prompted this feature has it bottom-left of sheet 2. So every page is
    searched for the anchor rather than assuming a location.

    Notes are extracted INDIVIDUALLY, not as one block. The same workmanship
    note recurs across hundreds of parts, and one-row-per-note is what makes
    the "which parts carry this note" listing possible.

ZONE REFERENCES ARE A DERIVED GUESS
    A drawing grid labels columns with numbers increasing right-to-left and
    rows with letters increasing bottom-to-top, so the bottom-right cell is A1.
    The number of divisions depends on the sheet size and is not recorded
    anywhere in the PDF. This infers it from page dimensions against standard
    ASME sheet sizes. When that inference is wrong the zone label is wrong, so
    the caller stores the raw bbox alongside it and the zone can be recomputed
    without re-reading the PDF.

OCR IS OPT-IN
    A page with no text layer returns status "needs_ocr" and stops. The caller
    asks the user, then re-runs with --allow-ocr. OCR on a D-size drawing is
    slow and error-prone, and silently OCR-ing would put mangled text in front
    of an approver with no signal that it needs a harder look.

Emits JSON on stdout. Usage:
    scan_drawing_notes.py <pdf> [--allow-ocr] [--page N] [--grid COLSxROWS]
    scan_drawing_notes.py <pdf> --crop PAGE,X0,Y0,X1,Y1 --out FILE.png
"""

import sys
import os
import re
import json
import shutil
import subprocess
import tempfile
import hashlib
import xml.etree.ElementTree as ET


def emit(obj):
    print(json.dumps(obj))
    sys.exit(0)


def fail(msg, **extra):
    out = {"status": "error", "message": msg, "pages": 0, "notes": []}
    out.update(extra)
    emit(out)


def run(cmd, timeout=180):
    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                           timeout=timeout)
        return p.stdout.decode('utf-8', errors='replace')
    except Exception:
        return ''


def have(binary):
    return shutil.which(binary) is not None


# ---------------------------------------------------------------- page info

def pdf_info(path):
    """(page_count, width_pts, height_pts)."""
    out = run(['pdfinfo', path], timeout=60)
    pages = 0
    w = h = 0.0
    m = re.search(r'^Pages:\s+(\d+)', out, re.M)
    if m:
        pages = int(m.group(1))
    m = re.search(r'^Page size:\s+([\d.]+)\s+x\s+([\d.]+)', out, re.M)
    if m:
        w, h = float(m.group(1)), float(m.group(2))
    return pages, w, h


# ------------------------------------------------------------ word geometry

def page_words(path, page_no):
    """
    [{text, x0, y0, x1, y1}] for one page, from pdftotext -bbox-layout.

    Coordinates are in points with the origin at the TOP-left, which is the
    opposite of the drawing grid's bottom-up row lettering — flipped in
    zone_for_bbox rather than here, so the bbox stored in the database matches
    what a PDF tool would report.
    """
    xml = run(['pdftotext', '-bbox-layout', '-f', str(page_no), '-l', str(page_no),
               path, '-'], timeout=180)
    if not xml.strip():
        return []
    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        return []
    ns = {'x': 'http://www.w3.org/1999/xhtml'}
    words = []
    for w in root.iter():
        if not w.tag.endswith('word'):
            continue
        try:
            words.append({
                'text': (w.text or '').strip(),
                'x0': float(w.attrib['xMin']), 'y0': float(w.attrib['yMin']),
                'x1': float(w.attrib['xMax']), 'y1': float(w.attrib['yMax']),
            })
        except (KeyError, ValueError):
            continue
    _ = ns
    return [w for w in words if w['text']]


def group_lines(words, tol=3.0):
    """
    Group words into text lines.

    Two passes. First by vertical overlap, then — the part that matters on a
    drawing — each row is SPLIT wherever a large horizontal gap falls between
    consecutive words.

    Without that split, two columns of notes printed side by side merge into a
    single line because they share a vertical position. On a real sheet that
    produced:

        "NOTES CONTINUED:   NOTES, UNLESS OTHERWISE SPECIFIED:"
        "9 IDENTIFICATION MARKING   1. APPLICABLE STANDARDS/..."

    and notes 1, 2 and 9 were simply lost — note 1 no longer began its line, so
    it never matched as a note start. A drawing sheet is a 2-D canvas, not a
    page of prose, so horizontal proximity has to be enforced, not assumed.

    The gap threshold scales with glyph height so it holds at any text size,
    with a floor above the multi-space alignment used inside a line.
    """
    rows = []
    for w in sorted(words, key=lambda w: (w['y0'], w['x0'])):
        for r in rows:
            if abs(r['y0'] - w['y0']) <= tol:
                r['words'].append(w)
                r['y0'] = min(r['y0'], w['y0'])
                r['y1'] = max(r['y1'], w['y1'])
                break
        else:
            rows.append({'y0': w['y0'], 'y1': w['y1'], 'words': [w]})

    heights = sorted(w['y1'] - w['y0'] for w in words) or [8.0]
    median_h = heights[len(heights) // 2] or 8.0
    gap_limit = max(24.0, median_h * 3.0)

    out = []
    for r in rows:
        ws = sorted(r['words'], key=lambda w: w['x0'])
        run = [ws[0]]
        for prev, cur in zip(ws, ws[1:]):
            if cur['x0'] - prev['x1'] > gap_limit:
                out.append(_mk_line(run))
                run = [cur]
            else:
                run.append(cur)
        out.append(_mk_line(run))

    out.sort(key=lambda l: (l['y0'], l['x0']))
    return out


def _mk_line(ws):
    return {
        'x0': min(w['x0'] for w in ws), 'x1': max(w['x1'] for w in ws),
        'y0': min(w['y0'] for w in ws), 'y1': max(w['y1'] for w in ws),
        'words': ws, 'text': ' '.join(w['text'] for w in ws),
    }


# ------------------------------------------------------------------- zoning

# (width, height) in points for standard ASME sheets, portrait; matched either
# orientation. cols/rows are the grid divisions printed in the margins.
SHEET_GRIDS = [
    (612.0,  792.0,  4, 4),    # A  (8.5 x 11)
    (792.0,  1224.0, 4, 4),    # B  (11 x 17)
    (1224.0, 1584.0, 8, 4),    # C  (17 x 22)
    (1584.0, 2448.0, 8, 4),    # D  (22 x 34)
    (2448.0, 3168.0, 16, 8),   # E  (34 x 44)
]


def infer_grid(width, height):
    """
    (cols, rows) for a page size. Falls back to 8x4, the most common large-format
    layout, when nothing matches within tolerance.
    """
    if not width or not height:
        return 8, 4
    a, b = sorted((width, height))
    best = None
    for sw, sh, cols, rows in SHEET_GRIDS:
        sa, sb = sorted((sw, sh))
        err = abs(sa - a) / sa + abs(sb - b) / sb
        if err < 0.08 and (best is None or err < best[0]):
            best = (err, cols, rows)
    return (best[1], best[2]) if best else (8, 4)


def zone_for_bbox(x0, y0, x1, y1, page_w, page_h, cols, rows):
    """
    Grid reference for a box, e.g. "A8".

    Columns are numbered from the RIGHT edge (1 at right, increasing leftward)
    and rows lettered from the BOTTOM (A at bottom), so the bottom-right cell is
    A1 and a note in the bottom-left of an 8-column sheet lands in A8.

    The box centre decides the cell — a note block spanning two columns still
    gets one sensible reference rather than a range.
    """
    if not page_w or not page_h:
        return ''
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0

    # pdftotext y grows downward; the grid letters grow upward.
    y_from_bottom = page_h - cy

    col_w = page_w / float(cols)
    row_h = page_h / float(rows)

    col_from_right = int((page_w - cx) // col_w) + 1
    col_from_right = max(1, min(cols, col_from_right))

    row_idx = int(y_from_bottom // row_h)
    row_idx = max(0, min(rows - 1, row_idx))

    letter = chr(ord('A') + row_idx) if row_idx < 26 else 'Z'
    return f'{letter}{col_from_right}'


# ------------------------------------------------------------ note matching

# A note that carries its own period: "8. SOLDERING SHALL BE..."
NOTE_START_STRICT = re.compile(r'^\(?(\d{1,2})\)?[.)]\s+(\S.*?)\s*$')

# A note number with the period optional. Flagged ("delta") notes are drawn
# inside a triangle and usually have NO trailing period — on the sample drawing
# notes 5, 6 and 9 are all bare numbers. This pattern is only ever applied
# inside a column already established as a notes block, and only when the
# number continues the expected sequence, because on its own it would match
# half the dimensions on the sheet.
NOTE_START_LOOSE = re.compile(r'^\(?(\d{1,2})\)?[.)]?\s+(\S.*?)\s*$')

# Headings that introduce a notes block. Deliberately not anchored to the end
# of the line: real drawings write "NOTES, UNLESS OTHERWISE SPECIFIED:" and
# "NOTES CONTINUED:" far more often than a bare "NOTES:". The length cap keeps
# a sentence that merely starts with the word from qualifying.
NOTES_ANCHOR = re.compile(r'^NOTES?\b[\s,:]', re.I)


def is_anchor(text):
    t = (text or '').strip()
    if t.upper().rstrip(':') in ('NOTE', 'NOTES'):
        return True
    return bool(NOTES_ANCHOR.match(t)) and len(t) <= 70


def cluster_columns(lines, tol=25.0):
    """
    Group candidate note lines into columns by their left edge.

    Drawings routinely run notes in two or more columns — the sample continues
    into a second column headed "NOTES CONTINUED:". Treating the page as one
    stream interleaves them by vertical position and scrambles the numbering.
    """
    cols = []
    for ln in sorted(lines, key=lambda l: l['x0']):
        for c in cols:
            if abs(c['x0'] - ln['x0']) <= tol:
                c['lines'].append(ln)
                c['x0'] = min(c['x0'], ln['x0'])
                break
        else:
            cols.append({'x0': ln['x0'], 'lines': [ln]})
    for c in cols:
        c['lines'].sort(key=lambda l: l['y0'])
    return cols


def build_notes(col_lines, x0, direction, expect_first=None):
    """
    Walk one column top to bottom, turning lines into notes.

    A line opens a new note when it carries its own number and period, or when
    it is a bare number that continues the sequence. Everything else is a
    continuation of the note above — which is what keeps the lettered
    sub-clauses ("A. DRAWING INTERPRETATION: ASME Y14.100") attached to their
    parent instead of being read as separate notes.
    """
    notes = []
    expected = expect_first
    for ln in col_lines:
        text = ln['text']
        opened = False

        m = NOTE_START_STRICT.match(text)
        if m:
            num = int(m.group(1))
            body = m.group(2)
            opened = True
        else:
            m = NOTE_START_LOOSE.match(text)
            # Bare number: only trusted when it is the next one in sequence.
            if m and expected is not None and int(m.group(1)) == expected:
                num, body, opened = int(m.group(1)), m.group(2), True

        if opened:
            notes.append({
                'number': str(num), 'text': body,
                'x0': ln['x0'], 'y0': ln['y0'], 'x1': ln['x1'], 'y1': ln['y1'],
            })
            expected = num + direction
            continue

        if not notes:
            continue

        prev = notes[-1]
        gap = ln['y0'] - prev['y1']
        # Continuations sit just below and are indented at least as far as the
        # note's own text — never to the LEFT of it, which is how a stray line
        # from a neighbouring block gets rejected.
        if -2 < gap < 22 and ln['x0'] >= x0 - 4:
            prev['text'] += ' ' + text
            prev['x1'] = max(prev['x1'], ln['x1'])
            prev['y1'] = max(prev['y1'], ln['y1'])
    return notes


def find_notes_block(lines):
    """
    Locate the numbered notes on a page and return them individually.

    Approach: find the columns that contain numbered lines, keep the ones that
    either sit under a NOTES heading or are long enough to be a block in their
    own right, then read each column in its own numbering direction.

    The earlier version assumed a single column of bottom-up notes in a fixed
    band around a bare "NOTES:" heading. That is one real layout, but a drawing
    with "NOTES, UNLESS OTHERWISE SPECIFIED:" over a top-down list in two
    columns matched none of it.
    """
    anchors = [ln for ln in lines if is_anchor(ln['text'])]
    seeds = [ln for ln in lines if NOTE_START_STRICT.match(ln['text'])]
    if not seeds:
        return [], False

    kept = []
    for col in cluster_columns(seeds):
        near = [a for a in anchors if abs(a['x0'] - col['x0']) <= 80]
        # Either introduced by a heading, or long enough that a run of numbered
        # lines in one column is not a coincidence.
        if near or len(col['lines']) >= 3:
            col['anchor'] = min(near, key=lambda a: a['y0']) if near else None
            kept.append(col)
    if not kept:
        return [], False

    all_notes = []
    for col in sorted(kept, key=lambda c: c['x0']):
        nums = [int(NOTE_START_STRICT.match(l['text']).group(1)) for l in col['lines']]
        # Numbering direction, read off the column itself rather than assumed:
        # some drawings run 1..n downward, others stack 1 at the bottom.
        direction = 1
        if len(nums) >= 2 and nums[-1] < nums[0]:
            direction = -1

        # Widen from the seed lines to every line in the column's vertical
        # span, so continuations and bare flagged notes come along too.
        top = min(l['y0'] for l in col['lines'])
        bottom = max(l['y1'] for l in col['lines'])
        if col.get('anchor'):
            top = min(top, col['anchor']['y1'])
            # Reach well past the last seed: a flagged note can close the list.
            bottom += 160
        band = [l for l in lines
                if top - 4 <= l['y0'] <= bottom
                and col['x0'] - 6 <= l['x0'] < col['x0'] + 620
                and not is_anchor(l['text'])]
        band.sort(key=lambda l: l['y0'])

        first_expected = nums[0] if nums else None
        all_notes += build_notes(band, col['x0'], direction, first_expected)

    # A continuation column can consist ENTIRELY of flagged notes — bare
    # numbers in triangles with no period — in which case it contains no strict
    # seed and the clustering above never sees it. The sample drawing's "NOTES
    # CONTINUED:" column holds only note 9 and was silently dropped.
    #
    # So any heading not already accounted for gets its own pass, reading
    # downward and accepting numbers that continue the sequence found so far.
    seen_nums = [int(n['number']) for n in all_notes]
    for a in anchors:
        if any(abs(a['x0'] - c['x0']) <= 80 for c in kept):
            continue
        right = a['x0'] + 900
        for other in kept:
            if other['x0'] > a['x0'] + 40:
                right = min(right, other['x0'] - 10)
        band = [l for l in lines
                if l['y0'] > a['y1'] - 2
                and a['x0'] - 6 <= l['x0'] < right
                and not is_anchor(l['text'])]
        band.sort(key=lambda l: (l['y0'], l['x0']))
        if not band:
            continue
        # Stop before a large vertical gap: the heading's column ends where the
        # notes end, and the rest of the sheet is below it.
        trimmed = [band[0]]
        for prev, cur in zip(band, band[1:]):
            if cur['y0'] - prev['y1'] > 60:
                break
            trimmed.append(cur)
        expect = (max(seen_nums) + 1) if seen_nums else None
        all_notes += build_notes(trimmed, a['x0'], 1, expect)

    # One column may continue another's numbering ("NOTES CONTINUED"), so
    # dedupe on the number and keep the first, richer reading.
    seen = set()
    out = []
    for n in sorted(all_notes, key=lambda n: int(n['number'])):
        if n['number'] in seen:
            continue
        seen.add(n['number'])
        out.append(n)
    return out, bool(anchors)


# --------------------------------------------------------- title block bits

RE_REV_DATE = re.compile(
    r'RELEASED\s*/\s*([A-Z][a-z]{2}\.?\s+\d{1,2}[, ]+\d{4})', re.I)
RE_SHEET = re.compile(r'SHEET\s+(\d+)\s+OF\s+(\d+)', re.I)
# Drawing numbers here look like 10-769046-032N — digits, dashes, optional
# trailing letter. Deliberately narrow; a loose pattern picks up dimensions.
RE_DWG_NO = re.compile(r'\b(\d{2}-\d{4,7}-\d{2,4}[A-Z]?)\b')

MONTHS = {m: i + 1 for i, m in enumerate(
    ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
     'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}


def parse_release_date(s):
    m = re.match(r'([A-Za-z]{3})\.?\s+(\d{1,2})[, ]+(\d{4})', s.strip())
    if not m:
        return ''
    mon = MONTHS.get(m.group(1).lower())
    if not mon:
        return ''
    return f'{m.group(3)}-{mon:02d}-{int(m.group(2)):02d}'


def title_block(lines, page_w, page_h):
    """
    Drawing number, rev and release date from the bottom strip of the sheet.

    Confined to the bottom ~18% because that is where the title block lives; a
    whole-page search finds the same patterns in the body of the drawing.
    """
    out = {'drawing_number': '', 'drawing_rev': '', 'drawing_rev_date': '',
           'sheet_label': ''}
    if not page_h:
        return out
    strip = [ln for ln in lines if ln['y0'] > page_h * 0.82]
    text = '\n'.join(ln['text'] for ln in strip)

    m = RE_DWG_NO.search(text)
    if m:
        out['drawing_number'] = m.group(1)
    m = RE_SHEET.search(text)
    if m:
        out['sheet_label'] = f'SHEET {m.group(1)} OF {m.group(2)}'
    m = RE_REV_DATE.search(text)
    if m:
        out['drawing_rev_date'] = parse_release_date(m.group(1))

    # Rev: a lone capital letter in the bottom-right corner, which is where the
    # rev box sits. 'I', 'O', 'Q' and 'S' are skipped — drafting standards omit
    # them, so a bare one is almost certainly something else.
    corner = [ln for ln in strip if ln['x0'] > page_w * 0.55] if page_w else strip
    for ln in reversed(corner):
        for w in ln['words']:
            t = w['text'].strip()
            if len(t) == 1 and t.isalpha() and t.isupper() and t not in 'IOQS':
                out['drawing_rev'] = t
                break
        if out['drawing_rev']:
            break
    return out


# ------------------------------------------------------------ normalisation

def normalize_note(text):
    """
    Canonical form for dedup hashing.

    Case-folded, whitespace collapsed, and the characters OCR most often
    confuses or drops removed, so the same note read off two drawings — one via
    the text layer, one via OCR — lands on the same hash. Digits and decimal
    points are PRESERVED: ".050 max" and ".060 max" must not collide.
    """
    t = (text or '').lower()
    t = re.sub(r'\s+', ' ', t)
    t = t.replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    t = re.sub(r'[,;:"\'`]', '', t)
    t = re.sub(r'\s*-\s*', '-', t)
    return t.strip(' .')


def text_hash(text):
    return hashlib.sha1(normalize_note(text).encode('utf-8')).hexdigest()


# ------------------------------------------------------------------ the OCR

def ocr_page_lines(path, page_no, workdir, dpi=300):
    """
    OCR one page into pseudo-lines with boxes, via tesseract TSV.

    Coordinates come back in pixels at `dpi`, converted to points so the zone
    computation and the stored bbox mean the same thing either way.
    """
    if not (have('pdftoppm') and have('tesseract')):
        return []
    prefix = os.path.join(workdir, f'p{page_no}')
    run(['pdftoppm', '-f', str(page_no), '-l', str(page_no), '-r', str(dpi),
         '-png', path, prefix], timeout=300)
    png = None
    for name in sorted(os.listdir(workdir)):
        if name.startswith(f'p{page_no}-') and name.endswith('.png'):
            png = os.path.join(workdir, name)
            break
    if not png:
        return []
    tsv = run(['tesseract', png, 'stdout', '--psm', '6', 'tsv'], timeout=420)
    try:
        os.remove(png)
    except OSError:
        pass

    scale = 72.0 / float(dpi)
    words = []
    for row in tsv.splitlines()[1:]:
        cols = row.split('\t')
        if len(cols) < 12:
            continue
        txt = cols[11].strip()
        if not txt:
            continue
        try:
            left, top, w, h = (int(cols[6]), int(cols[7]),
                               int(cols[8]), int(cols[9]))
        except ValueError:
            continue
        words.append({
            'text': txt,
            'x0': left * scale, 'y0': top * scale,
            'x1': (left + w) * scale, 'y1': (top + h) * scale,
        })
    return group_lines(words)


# -------------------------------------------------------------------- crop

def crop_note(path, page_no, box, out_file, dpi=200, pad=6.0):
    """
    Render the region around a note to PNG.

    pdftoppm crops in pixels at the render resolution, so the point-space box
    is scaled up and padded slightly to avoid shaving the glyphs.
    """
    if not have('pdftoppm'):
        return False, 'pdftoppm not available'
    x0, y0, x1, y1 = box
    s = dpi / 72.0
    px = int(max(0, (x0 - pad) * s))
    py = int(max(0, (y0 - pad) * s))
    pw = int(max(1, (x1 - x0 + 2 * pad) * s))
    ph = int(max(1, (y1 - y0 + 2 * pad) * s))

    with tempfile.TemporaryDirectory() as wd:
        prefix = os.path.join(wd, 'crop')
        run(['pdftoppm', '-f', str(page_no), '-l', str(page_no), '-r', str(dpi),
             '-png', '-x', str(px), '-y', str(py), '-W', str(pw), '-H', str(ph),
             path, prefix], timeout=180)
        made = [f for f in sorted(os.listdir(wd)) if f.endswith('.png')]
        if not made:
            return False, 'crop produced no image'
        os.makedirs(os.path.dirname(out_file) or '.', exist_ok=True)
        shutil.move(os.path.join(wd, made[0]), out_file)
    return True, ''


# -------------------------------------------------------------------- main

def scan(path, allow_ocr=False, only_page=None, grid=None):
    if not os.path.exists(path):
        fail(f'file not found: {path}')
    if not have('pdftotext'):
        fail('poppler-utils not installed (need pdftotext). '
             'Docker: apt-get install poppler-utils. RHEL: dnf install poppler-utils.')

    pages, page_w, page_h = pdf_info(path)
    if not pages:
        fail('could not read the PDF (pdfinfo reported no pages)')

    cols, rows = grid if grid else infer_grid(page_w, page_h)
    page_list = [only_page] if only_page else list(range(1, pages + 1))

    results = []
    ocr_used = False
    empty_pages = []

    for pno in page_list:
        lines = group_lines(page_words(path, pno))
        method = 'text'

        if not lines:
            empty_pages.append(pno)
            if not allow_ocr:
                continue
            with tempfile.TemporaryDirectory() as wd:
                lines = ocr_page_lines(path, pno, wd)
            if not lines:
                continue
            method = 'ocr'
            ocr_used = True

        notes, anchored = find_notes_block(lines)
        if not notes:
            continue
        tb = title_block(lines, page_w, page_h)

        for n in notes:
            results.append({
                'note_number': n['number'],
                'text': n['text'],
                'text_hash': text_hash(n['text']),
                'page': pno,
                'zone': zone_for_bbox(n['x0'], n['y0'], n['x1'], n['y1'],
                                      page_w, page_h, cols, rows),
                'bbox': [round(n['x0'], 2), round(n['y0'], 2),
                         round(n['x1'], 2), round(n['y1'], 2)],
                'page_width': round(page_w, 2),
                'page_height': round(page_h, 2),
                'extraction_method': method,
                'anchored': anchored,
                **tb,
            })

    # Nothing found and pages had no text layer at all -> OCR is the only way
    # left, and that is the user's call to make, not this script's.
    if not results and empty_pages and not allow_ocr:
        emit({
            'status': 'needs_ocr',
            'message': (f'{len(empty_pages)} page(s) have no text layer, so the '
                        f'notes cannot be read without OCR. OCR is slower and '
                        f'its output usually needs correcting before approval.'),
            'pages': pages, 'ocr_pages': len(empty_pages), 'notes': [],
            'grid': [cols, rows],
        })

    emit({
        'status': 'ok' if results else 'empty',
        'message': '' if results else 'No numbered notes block found.',
        'pages': pages,
        'page_width': round(page_w, 2),
        'page_height': round(page_h, 2),
        'grid': [cols, rows],
        'ocr_used': ocr_used,
        'notes': results,
    })


def main():
    args = sys.argv[1:]
    if not args:
        fail('usage: scan_drawing_notes.py <pdf> [--allow-ocr] [--page N] '
             '[--grid COLSxROWS] | <pdf> --crop PAGE,X0,Y0,X1,Y1 --out FILE.png')
    path = args[0]

    def opt(name):
        return args[args.index(name) + 1] if name in args and args.index(name) + 1 < len(args) else None

    if '--crop' in args:
        spec = opt('--crop')
        out_file = opt('--out')
        if not spec or not out_file:
            fail('--crop PAGE,X0,Y0,X1,Y1 requires --out FILE.png')
        try:
            parts = [float(v) for v in spec.split(',')]
            page_no = int(parts[0])
            box = parts[1:5]
        except (ValueError, IndexError):
            fail('--crop expects PAGE,X0,Y0,X1,Y1')
        ok, err = crop_note(path, page_no, box, out_file)
        emit({'status': 'ok' if ok else 'error', 'message': err,
              'image_path': out_file if ok else ''})

    grid = None
    g = opt('--grid')
    if g:
        m = re.match(r'^(\d+)x(\d+)$', g)
        if m:
            grid = (int(m.group(1)), int(m.group(2)))

    page = opt('--page')
    scan(path, allow_ocr='--allow-ocr' in args,
         only_page=int(page) if page and page.isdigit() else None,
         grid=grid)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:  # never let a traceback reach the caller as stdout
        fail(str(e))
