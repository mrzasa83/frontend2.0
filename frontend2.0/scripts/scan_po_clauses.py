#!/usr/bin/env python3
"""
scan_po_clauses.py — extract FAR/DFAR-style clause references from a PO PDF.

Strategy (per the module design):
  1. Text-extract every page first (fast, exact).
  2. OCR only pages that have little/no extractable text (image-based scans).

IMPORTANT — no third-party Python packages are required. This uses the
poppler-utils and tesseract-ocr *binaries* that the container installs via apt:

    pdfinfo    page count
    pdftotext  per-page text layer
    pdftoppm   rasterize a page for OCR
    tesseract  OCR the rasterized page

Optional Python libraries (pdfplumber / pypdf) are used only as a fallback if
the poppler binaries are missing. This keeps the Docker build independent of
PyPI reachability, which matters behind a TLS-intercepting corporate proxy.

Emits JSON on stdout:
  {
    "status": "ok" | "error",
    "message": "...",
    "pages": <int>,
    "ocr_pages": <int>,
    "clauses": [ {"number": "52.204-21", "standard_hint": "FAR"}, ... ]
  }
"""
import sys, os, json, re, shutil, subprocess, tempfile

def emit(obj):
    print(json.dumps(obj))
    sys.exit(0)

def log_err(msg):
    emit({"status": "error", "message": msg, "pages": 0, "ocr_pages": 0, "clauses": []})

# Clause-number regexes.
FAR_RE    = re.compile(r'\b(2?5\d)\.(\d{3})-(\d{1,4})\b')          # 52.xxx-xx / 252.xxx-xxxx
AGENCY_RE = re.compile(r'\b([A-Z]{1,4}-\d{2,4}-[A-Z]?\d{2,4})\b')  # e.g. C-204-H002

def standard_hint(num: str) -> str:
    if num.startswith('252') or num.startswith('253'): return 'DFAR'
    if num.startswith('52') or num.startswith('53'): return 'FAR'
    return ''

def run(cmd, timeout=120):
    """Run a command, return stdout text ('' on any failure)."""
    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                           timeout=timeout)
        return p.stdout.decode('utf-8', errors='replace')
    except Exception:
        return ''

def have(binary):
    return shutil.which(binary) is not None

# ---------- page count ----------
def page_count(path):
    if have('pdfinfo'):
        out = run(['pdfinfo', path], timeout=60)
        m = re.search(r'^Pages:\s+(\d+)', out, re.M)
        if m:
            return int(m.group(1))
    # fallback to python libs
    try:
        from pypdf import PdfReader
        return len(PdfReader(path).pages)
    except Exception:
        pass
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return len(pdf.pages)
    except Exception:
        pass
    return 0

# ---------- text layer ----------
def page_text_binary(path, page_no):
    return run(['pdftotext', '-layout', '-f', str(page_no), '-l', str(page_no), path, '-'], timeout=120)

def all_text_python(path):
    """Fallback: whole-document page texts via python libs."""
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return [(pg.extract_text() or '') for pg in pdf.pages]
    except Exception:
        pass
    try:
        from pypdf import PdfReader
        return [(p.extract_text() or '') for p in PdfReader(path).pages]
    except Exception:
        pass
    return []

# ---------- OCR ----------
def ocr_page(path, page_no, workdir):
    """Rasterize one page and OCR it. Returns text ('' if unavailable)."""
    if not (have('pdftoppm') and have('tesseract')):
        return ''
    prefix = os.path.join(workdir, f'pg{page_no}')
    run(['pdftoppm', '-f', str(page_no), '-l', str(page_no), '-r', '200', '-png', path, prefix], timeout=180)
    # pdftoppm names files like prefix-1.png / prefix-01.png depending on page count
    png = None
    for name in sorted(os.listdir(workdir)):
        if name.startswith(f'pg{page_no}-') and name.endswith('.png'):
            png = os.path.join(workdir, name)
            break
    if not png:
        return ''
    txt = run(['tesseract', png, 'stdout'], timeout=240)
    try:
        os.remove(png)
    except Exception:
        pass
    return txt

def extract(path):
    if not os.path.exists(path):
        log_err(f"file not found: {path}")

    total = page_count(path)
    pages_text = []
    ocr_pages = 0

    if have('pdftotext') and total:
        pages_text = [page_text_binary(path, i + 1) for i in range(total)]
    else:
        pages_text = all_text_python(path)
        total = total or len(pages_text)

    if not pages_text and not total:
        log_err("could not read the PDF — no PDF text tooling available "
                "(expected poppler-utils' pdftotext, or the pdfplumber/pypdf python packages)")

    # OCR the pages that came back (near-)empty.
    need_ocr = [i for i, t in enumerate(pages_text) if len((t or '').strip()) < 20]
    if need_ocr and have('pdftoppm') and have('tesseract'):
        with tempfile.TemporaryDirectory() as wd:
            for i in need_ocr:
                t = ocr_page(path, i + 1, wd)
                if t.strip():
                    pages_text[i] = t
                    ocr_pages += 1

    # Scan page by page so every hit carries the page it was found on.
    found = {}       # number -> standard hint
    pages_of = {}    # number -> ordered list of 1-based page numbers
    for idx, page_text in enumerate(pages_text):
        page_no = idx + 1
        # OCR/extraction sometimes spaces out the dots and dashes in a clause number.
        norm = re.sub(r'\s*([.\-])\s*', r'\1', page_text or '')
        for m in FAR_RE.finditer(norm):
            num = f"{m.group(1)}.{m.group(2)}-{m.group(3)}"
            found.setdefault(num, standard_hint(num))
            pages_of.setdefault(num, [])
            if page_no not in pages_of[num]:
                pages_of[num].append(page_no)
        for m in AGENCY_RE.finditer(page_text or ''):
            num = m.group(1).strip()
            found.setdefault(num, '')
            pages_of.setdefault(num, [])
            if page_no not in pages_of[num]:
                pages_of[num].append(page_no)

    return {
        "status": "ok", "message": "",
        "pages": total, "ocr_pages": ocr_pages,
        "clauses": [
            {"number": k, "standard_hint": v, "pages": pages_of.get(k, [])}
            for k, v in sorted(found.items())
        ],
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        log_err("usage: scan_po_clauses.py <pdf_path>")
    try:
        emit(extract(sys.argv[1]))
    except Exception as e:
        log_err(str(e))
