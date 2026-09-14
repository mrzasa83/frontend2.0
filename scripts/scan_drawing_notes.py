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
    """Group words into lines by vertical overlap, then sort left to right."""
    lines = []
    for w in sorted(words, key=lambda w: (w['y0'], w['x0'])):
        placed = False
        for ln in lines:
            if abs(ln['y0'] - w['y0']) <= tol:
                ln['words'].append(w)
                ln['y0'] = min(ln['y0'], w['y0'])
                ln['y1'] = max(ln['y1'], w['y1'])
                ln['x0'] = min(ln['x0'], w['x0'])
                ln['x1'] = max(ln['x1'], w['x1'])
                placed = True
                break
        if not placed:
            lines.append({'y0': w['y0'], 'y1': w['y1'], 'x0': w['x0'],
                          'x1': w['x1'], 'words': [w]})
    for ln in lines:
        ln['words'].sort(key=lambda w: w['x0'])
        ln['text'] = ' '.join(w['text'] for w in ln['words'])
    lines.sort(key=lambda l: l['y0'])
    return lines


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

# "8." / "10." / "(7)" / "7." where the number sits in a leader triangle.
NOTE_START = re.compile(r'^\(?(\d{1,2})\)?[.)]\s+(.*\S)\s*$')
NOTES_ANCHOR = re.compile(r'^NOTES?\s*:?\s*$', re.I)


def extract_notes_from_lines(lines):
    """
    Numbered note lines, each with its own bounding box.

    A continuation line (one that doesn't start with a number) is appended to
    the note above it — drawing notes wrap, and the sample's note 1 runs the
    full width of the sheet.
    """
    notes = []
    for ln in lines:
        m = NOTE_START.match(ln['text'])
        if m:
            notes.append({
                'number': m.group(1),
                'text': m.group(2),
                'x0': ln['x0'], 'y0': ln['y0'], 'x1': ln['x1'], 'y1': ln['y1'],
            })
        elif notes and not NOTES_ANCHOR.match(ln['text']):
            # Continuation only if it is roughly aligned with, and just below,
            # the note it would join — otherwise unrelated title-block text
            # gets swallowed.
            prev = notes[-1]
            close_below = 0 < (ln['y0'] - prev['y1']) < 14
            aligned = abs(ln['x0'] - prev['x0']) < 40
            if close_below and aligned:
                prev['text'] += ' ' + ln['text']
                prev['x1'] = max(prev['x1'], ln['x1'])
                prev['y1'] = max(prev['y1'], ln['y1'])
    return notes


def find_notes_block(lines):
    """
    Notes near a NOTES: anchor, or every numbered line if there is no anchor.

    With an anchor, only lines within a band around it are considered. Drawings
    are full of numbers that look like list items (dimensions, zone callouts,
    title-block fields) and taking every match on a D-size sheet produces
    mostly rubbish.
    """
    anchors = [ln for ln in lines if NOTES_ANCHOR.match(ln['text'])]
    if not anchors:
        return extract_notes_from_lines(lines), False

    anchor = anchors[0]
    # Notes run upward from the anchor; allow a little below for layouts that
    # put the heading on top.
    band = [ln for ln in lines
            if (anchor['y0'] - 420) <= ln['y0'] <= (anchor['y1'] + 120)
            and ln['x0'] < anchor['x0'] + 700]
    found = extract_notes_from_lines(band)
    if not found:
        found = extract_notes_from_lines(lines)
    return found, True


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
