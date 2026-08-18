#!/usr/bin/env python3
"""
scan_po_clauses.py — extract FAR/DFAR-style clause references from a PO PDF.

Strategy (per the module design):
  1. Text-extract every page first (fast, exact).
  2. OCR only pages that have little/no extractable text (image-based scans).
  3. Find clause-number patterns in the combined text.

Emits JSON on stdout:
  {
    "status": "ok" | "error",
    "message": "...",
    "pages": <int>,
    "ocr_pages": <int>,
    "clauses": [ {"number": "52.204-21", "standard_hint": "FAR"}, ... ]
  }

Clause-number detection is deliberately broad; the Node side matches these
against the contract_clauses catalog and the user accepts/rejects. Patterns:
  FAR      52.204-21         (2-3 digit part . 3 digit . 1-2 digit, opt alt)
  DFARS   252.204-7012       (3 digit . 3 digit . 4 digit)
  agency  C-204-H002, etc.   (letter-prefixed, kept as-is)
"""
import sys, json, re

def log_err(msg):
    print(json.dumps({"status": "error", "message": msg,
                      "pages": 0, "ocr_pages": 0, "clauses": []}))
    sys.exit(0)   # exit 0 so the Node side reads our JSON rather than a crash

# Clause-number regexes. Order matters: DFARS (7xxx) before FAR so the longer
# tail wins. Case-insensitive; we normalize whitespace first.
FAR_RE   = re.compile(r'\b(2?5\d)\.(\d{3})-(\d{1,4})\b')          # 52.xxx-xx / 252.xxx-xxxx
ALT_RE   = re.compile(r'\b(2?5\d\.\d{3}-\d{1,4})\s*(?:ALT|ALTERNATE)\s*([IVX]+)\b', re.I)
AGENCY_RE = re.compile(r'\b([A-Z]{1,4}-\d{2,4}-[A-Z]?\d{2,4})\b')  # e.g. C-204-H002, NAVSEA-ish

def standard_hint(num: str) -> str:
    if num.startswith('252') or num.startswith('253'): return 'DFAR'
    if num.startswith('52') or num.startswith('53'): return 'FAR'
    return ''

def extract(path: str):
    pages_text = []
    ocr_pages = 0
    total_pages = 0

    # --- Pass 1: text layer via pdfplumber ---
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            total_pages = len(pdf.pages)
            for pg in pdf.pages:
                t = pg.extract_text() or ''
                pages_text.append(t)
    except Exception as e:
        # pdfplumber unavailable/failed — try pypdf as a lighter fallback
        try:
            from pypdf import PdfReader
            r = PdfReader(path)
            total_pages = len(r.pages)
            pages_text = [(p.extract_text() or '') for p in r.pages]
        except Exception as e2:
            log_err(f"text extraction failed: {e}; {e2}")

    # --- Pass 2: OCR pages that came back (near-)empty ---
    need_ocr = [i for i, t in enumerate(pages_text) if len((t or '').strip()) < 20]
    if need_ocr:
        try:
            from pdf2image import convert_from_path
            import pytesseract
            for i in need_ocr:
                try:
                    imgs = convert_from_path(path, first_page=i + 1, last_page=i + 1, dpi=200)
                    if imgs:
                        pages_text[i] = pytesseract.image_to_string(imgs[0]) or ''
                        ocr_pages += 1
                except Exception:
                    continue  # skip a page that won't OCR
        except Exception:
            # OCR libs not installed — proceed with whatever text we have.
            pass

    full = '\n'.join(pages_text)
    # normalize spacing around dots/dashes that OCR sometimes mangles
    norm = re.sub(r'\s*([.\-])\s*', r'\1', full)

    found = {}
    for m in FAR_RE.finditer(norm):
        num = f"{m.group(1)}.{m.group(2)}-{m.group(3)}"
        found.setdefault(num, standard_hint(num))
    for m in AGENCY_RE.finditer(full):
        num = m.group(1).strip()
        found.setdefault(num, '')

    clauses = [{"number": k, "standard_hint": v} for k, v in sorted(found.items())]
    return {
        "status": "ok", "message": "",
        "pages": total_pages, "ocr_pages": ocr_pages,
        "clauses": clauses,
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        log_err("usage: scan_po_clauses.py <pdf_path>")
    path = sys.argv[1]
    try:
        print(json.dumps(extract(path)))
    except Exception as e:
        log_err(str(e))
