#!/usr/bin/env python3
"""
check_sql_placeholders.py — catch INSERT statements whose column list and
placeholder list have drifted apart.

Adding a column to an INSERT and forgetting the matching `?` is a silent edit:
it type-checks, it lints, and it fails only when that code path runs against a
real database. Adding PFAS as a fourth compliance category touched five INSERTs
and broke two of them exactly this way.

Scans .ts/.tsx for INSERT INTO ... (cols) VALUES (?, ?, ...) and compares the
counts. Multi-row VALUES and non-placeholder expressions are skipped rather
than guessed at.

Exit code 1 if any mismatch is found, so it can gate a deploy.
"""
import os
import re
import sys

INSERT = re.compile(
    r'INSERT\s+(?:IGNORE\s+)?INTO\s+[`"]?(\w+)[`"]?\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)',
    re.I | re.S)


def check(path, text, findings):
    for m in INSERT.finditer(text):
        table, cols_raw, vals_raw = m.group(1), m.group(2), m.group(3)
        cols = [c.strip() for c in cols_raw.split(',') if c.strip()]
        vals = [v.strip() for v in vals_raw.split(',') if v.strip()]
        # Only compare when every value is a bare placeholder; anything else
        # (NOW(), a literal, a sub-select) is deliberate and not a drift.
        if not vals or not all(v == '?' for v in vals):
            continue
        if len(cols) != len(vals):
            line = text[:m.start()].count('\n') + 1
            findings.append((path, line, table, len(cols), len(vals),
                             [c for c in cols]))


def main():
    roots = sys.argv[1:] or ['app', 'lib', 'scripts']
    findings = []
    scanned = 0
    for root in roots:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames
                           if d not in ('node_modules', '.next', '.git')]
            for fn in filenames:
                if not fn.endswith(('.ts', '.tsx')):
                    continue
                p = os.path.join(dirpath, fn)
                scanned += 1
                check(p, open(p, encoding='utf-8', errors='replace').read(), findings)

    print(f'Scanned {scanned} files for INSERT column/placeholder drift.\n')
    for path, line, table, ncols, nvals, cols in findings:
        print(f'  {path}:{line}')
        print(f'    INSERT INTO {table}: {ncols} columns but {nvals} placeholders')
        print(f'    columns: {", ".join(cols)}\n')
    if not findings:
        print('No mismatches.')
    return 1 if findings else 0


if __name__ == '__main__':
    sys.exit(main())
