#!/usr/bin/env python3
"""
mysql56_audit.py — find things the primary MySQL server (5.6.35) cannot run.

The primary database is MySQL 5.6.35. That is a much older server than the
MSSQL side, and the two are easy to confuse when writing queries: the Paradigm
queries run on SQL Server, where CTEs and window functions are fine, while
anything going through queryPrimary()/execPrimary() hits 5.6, where they are
syntax errors.

Checks, and why each one matters on 5.6:

  JSON type            added in 5.7.8. The parser stops at the word JSON.
  JSON functions       JSON_EXTRACT / JSON_VALUE / -> / ->> are 5.7+.
  CTE (WITH ...)       added in 8.0. 5.6 reads WITH as a syntax error.
  Window functions     OVER (...) added in 8.0.
  Index > 767 bytes    old InnoDB cap. utf8mb4 is 4 bytes/char, so any indexed
                       VARCHAR over 191 characters needs a prefix length.
  Generated columns    added in 5.7.
  utf8mb4_0900_*       an 8.0 collation.
  DATETIME precision   DATETIME(n)/TIMESTAMP(n) exist in 5.6, but are worth
                       flagging so nobody assumes microsecond defaults.
  ALTER ... ALGORITHM  INSTANT is 8.0.

Usage:
    ./mysql56_audit.py                 # audit sql/ and the TS query strings
    ./mysql56_audit.py --sql-only
    ./mysql56_audit.py path [path ...]

Exit code is 1 when any blocking finding is reported, so it can gate a deploy.
"""

import os
import re
import sys

# utf8mb4: 4 bytes per character.
#
# InnoDB has TWO separate limits and they are easy to conflate:
#
#   PER COLUMN   767 bytes for an index part, under the COMPACT/REDUNDANT row
#                format that 5.6 defaults to. Raised to 3072 by
#                innodb_large_prefix=ON with Barracuda + DYNAMIC.
#                => a single utf8mb4 column can index 191 characters.
#
#   PER INDEX    3072 bytes total across all parts, regardless.
#
# A composite index of two VARCHAR(190) columns is 1520 bytes total and is
# FINE: each part is 760 bytes, under the per-column cap, and the total is
# under 3072. Only a single wide column breaks the 767 rule. Checking the
# total against 767 flags working tables as broken.
BYTES_PER_CHAR = 4
COLUMN_BYTE_LIMIT = 767
INDEX_BYTE_LIMIT = 3072
MAX_INDEXED_CHARS = COLUMN_BYTE_LIMIT // BYTES_PER_CHAR  # 191

BLOCKING = 'BLOCK'
WARNING = 'WARN'

# (severity, label, compiled regex, advice)
PATTERNS = [
    (BLOCKING, 'JSON data type',
     re.compile(r'^\s*[`"\w]+\s+JSON\b', re.I | re.M),
     'Use LONGTEXT. MariaDB aliases JSON to LONGTEXT anyway.'),
    (BLOCKING, 'JSON function',
     re.compile(r'\bJSON_(EXTRACT|VALUE|QUERY|OBJECT|ARRAY|SET|INSERT|REPLACE|CONTAINS|VALID|UNQUOTE|LENGTH|KEYS|TABLE)\s*\(', re.I),
     'Added in 5.7. Parse the text in the app layer until the server moves.'),
    (BLOCKING, 'JSON path operator',
     re.compile(r'(?<![-<>=!])->>?\s*[\'"]\$'),
     'The -> and ->> operators are 5.7+.'),
    (BLOCKING, 'Common table expression',
     re.compile(r'^\s*WITH\s+[`"\w]+\s+AS\s*\(', re.I | re.M),
     'CTEs are MySQL 8.0. Rewrite as a derived table or a temp table. '
     '(Fine on the MSSQL side — check which server this query runs against.)'),
    (BLOCKING, 'Window function',
     re.compile(r'\b(ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|NTILE|FIRST_VALUE|LAST_VALUE)\s*\(\s*\)\s*OVER\b', re.I),
     'Window functions are MySQL 8.0. Use a self-join or a user variable.'),
    (BLOCKING, 'Generated column',
     # Only the full GENERATED ALWAYS AS form. Matching a bare VIRTUAL or
     # STORED fires on any seed file whose data happens to contain the word —
     # the contract-clause seed has "VIRTUAL" inside clause prose.
     re.compile(r'\bGENERATED\s+ALWAYS\s+AS\s*\(', re.I),
     'Generated columns are 5.7+. Compute the value on write.'),
    (BLOCKING, '8.0-only collation',
     re.compile(r'utf8mb4_0900_\w+', re.I),
     'Use utf8mb4_unicode_ci or utf8mb4_general_ci.'),
    (BLOCKING, 'INSTANT DDL',
     re.compile(r'ALGORITHM\s*=\s*INSTANT', re.I),
     'ALGORITHM=INSTANT is 8.0.'),
    (WARNING, 'CHECK constraint',
     re.compile(r'^\s*(CONSTRAINT\s+\S+\s+)?CHECK\s*\(', re.I | re.M),
     'Parsed but silently ignored on 5.6 — it will not enforce anything.'),
    (WARNING, 'Fractional-second type',
     re.compile(r'\b(DATETIME|TIMESTAMP|TIME)\s*\(\s*[1-6]\s*\)', re.I),
     'Supported in 5.6, but confirm the client library round-trips it.'),
]

# CREATE TABLE parsing for the index-width check.
RE_CREATE = re.compile(
    r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\((.*?)\)\s*ENGINE',
    re.I | re.S)
RE_COLUMN = re.compile(
    r'^\s*[`"]?(\w+)[`"]?\s+(VARCHAR|CHAR)\s*\(\s*(\d+)\s*\)', re.I)
RE_INDEX_HEAD = re.compile(
    r'^\s*(?:(UNIQUE|PRIMARY|FULLTEXT|SPATIAL)\s+)?(?:KEY|INDEX)\s*'
    r'[`"]?(\w*)[`"]?\s*\(', re.I)
RE_PK_HEAD = re.compile(r'^\s*PRIMARY\s+KEY\s*\(', re.I)

# ALTER TABLE t ADD [UNIQUE|FULLTEXT] INDEX|KEY name (cols)
# Indexes added this way are just as capable of blowing the 767-byte cap, and
# they are easier to miss: alter_po_index_performance.sql tells the reader to
# ignore duplicate-key errors on re-run, so a "key too long" error looks like
# the expected noise and the index silently never gets created.
RE_ALTER_INDEX = re.compile(
    r'ALTER\s+TABLE\s+[`"]?(\w+)[`"]?\s+ADD\s+'
    r'(?:(UNIQUE|FULLTEXT|SPATIAL)\s+)?(?:INDEX|KEY)\s+[`"]?(\w+)[`"]?\s*\(',
    re.I)


def balanced_body(text: str, open_pos: int):
    """Text between the paren at open_pos and its match, nesting-aware.

    A prefix length is itself parenthesised — manufacturer(100) — so a regex
    that stops at the first ')' reads the column at its full declared width and
    reports a false positive on an index that is already prefixed.
    """
    depth = 0
    for i in range(open_pos, len(text)):
        if text[i] == '(':
            depth += 1
        elif text[i] == ')':
            depth -= 1
            if depth == 0:
                return text[open_pos + 1:i]
    return ''


def split_top_level(body: str):
    """Split a CREATE TABLE body on commas that aren't inside parentheses."""
    parts, depth, cur = [], 0, []
    for ch in body:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(''.join(cur))
            cur = []
        else:
            cur.append(ch)
    if cur:
        parts.append(''.join(cur))
    return parts


def strip_comments(sql: str) -> str:
    sql = re.sub(r'/\*.*?\*/', '', sql, flags=re.S)
    sql = re.sub(r'^\s*--.*$', '', sql, flags=re.M)
    sql = re.sub(r'\s--\s.*$', '', sql, flags=re.M)
    return sql


# table -> {column: declared_char_length}, built across every .sql file.
COLUMN_WIDTHS: dict = {}


def collect_column_widths(sql: str):
    clean = strip_comments(sql)
    for table, body in RE_CREATE.findall(clean):
        widths = COLUMN_WIDTHS.setdefault(table.lower(), {})
        for part in split_top_level(body):
            m = RE_COLUMN.match(part)
            if m:
                widths[m.group(1).lower()] = int(m.group(3))


def check_alter_indexes(sql: str, path: str, findings: list):
    clean = strip_comments(sql)
    for m in RE_ALTER_INDEX.finditer(clean):
        table, kind, name = m.group(1), (m.group(2) or '').upper(), m.group(3)
        if kind == 'FULLTEXT':
            continue  # no per-part byte cap
        cols = balanced_body(clean, m.end() - 1)
        widths = COLUMN_WIDTHS.get(table.lower(), {})
        line = clean[:m.start()].count('\n') + 1
        total = 0
        for col in cols.split(','):
            col = col.strip()
            sub = re.match(r'[`"]?(\w+)[`"]?\s*\(\s*(\d+)\s*\)', col)
            bare = re.match(r'[`"]?(\w+)[`"]?', col)
            if sub:
                cname, chars = sub.group(1), int(sub.group(2))
            elif bare and bare.group(1).lower() in widths:
                cname, chars = bare.group(1), widths[bare.group(1).lower()]
            else:
                continue
            col_bytes = chars * BYTES_PER_CHAR
            total += col_bytes
            if col_bytes > COLUMN_BYTE_LIMIT:
                findings.append((
                    BLOCKING, path, line,
                    'ALTER adds an index part over the 767-byte per-column cap',
                    f'{table}.{name}: {cname} is {chars} chars = {col_bytes} '
                    f'bytes in utf8mb4. This fails with error 1071 on 5.6 — and '
                    f'if the script says to ignore duplicate-key errors, the '
                    f'failure looks like expected noise and the index is never '
                    f'created. Add a prefix length (max {MAX_INDEXED_CHARS}).'))
        if total > INDEX_BYTE_LIMIT:
            findings.append((
                BLOCKING, path, line, 'ALTER adds an index over the 3072-byte cap',
                f'{table}.{name} = {total} bytes.'))


def check_index_widths(sql: str, path: str, findings: list):
    clean = strip_comments(sql)
    for table, body in RE_CREATE.findall(clean):
        widths = {}
        index_defs = []
        for part in split_top_level(body):
            m = RE_COLUMN.match(part)
            if m:
                widths[m.group(1).lower()] = int(m.group(3))
                continue
            m = RE_PK_HEAD.match(part)
            if m:
                index_defs.append(('PRIMARY', balanced_body(part, m.end() - 1)))
                continue
            m = RE_INDEX_HEAD.match(part)
            if m:
                kind = (m.group(1) or '').upper()
                if kind == 'FULLTEXT':
                    continue  # FULLTEXT has no prefix-byte limit
                index_defs.append((m.group(2) or 'PRIMARY',
                                   balanced_body(part, m.end() - 1)))

        for name, cols in index_defs:
            total = 0
            detail = []
            for col in cols.split(','):
                col = col.strip()
                sub = re.match(r'[`"]?(\w+)[`"]?\s*\(\s*(\d+)\s*\)', col)
                bare = re.match(r'[`"]?(\w+)[`"]?', col)
                if sub:
                    chars, cname = int(sub.group(2)), sub.group(1)
                    detail.append(f'{cname}({chars})')
                elif bare and bare.group(1).lower() in widths:
                    cname = bare.group(1)
                    chars = widths[cname.lower()]
                    detail.append(f'{cname}={chars}')
                else:
                    continue  # INT and friends: negligible width
                col_bytes = chars * BYTES_PER_CHAR
                total += col_bytes
                # Per-column cap: the one that actually bites on 5.6 defaults.
                if col_bytes > COLUMN_BYTE_LIMIT:
                    findings.append((
                        BLOCKING, path, 0,
                        'Index part over the 767-byte per-column cap',
                        f'{table}.{name}: {cname} is {chars} chars '
                        f'= {col_bytes} bytes in utf8mb4. Add a prefix length; '
                        f'{MAX_INDEXED_CHARS} is the most a single utf8mb4 '
                        f'column can index under COMPACT row format.'))
            # Whole-index cap: 3072 bytes, independent of row format.
            if total > INDEX_BYTE_LIMIT:
                findings.append((
                    BLOCKING, path, 0, 'Index over the 3072-byte total cap',
                    f'{table}.{name} ({", ".join(detail)}) = {total} bytes.'))


def check_patterns(text: str, path: str, findings: list):
    clean = strip_comments(text)
    for severity, label, rx, advice in PATTERNS:
        for m in rx.finditer(clean):
            line = clean[:m.start()].count('\n') + 1
            findings.append((severity, path, line, label, advice))


def extract_mysql_queries(ts: str):
    """
    Template literals passed to the MySQL helpers. Anything reaching
    queryPrimary/execPrimary/queryMySQL runs on 5.6; queryMSSQL does not.
    """
    out = []
    for m in re.finditer(r'\b(queryPrimary|execPrimary|queryMySQL)\b\s*(?:<[^>]*>)?\s*\(',
                         ts):
        tail = ts[m.end():m.end() + 4000]
        lit = re.search(r'`([^`]*)`', tail)
        if lit:
            out.append((ts[:m.start()].count('\n') + 1, lit.group(1)))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    sql_only = '--sql-only' in sys.argv
    roots = args or ['sql', 'lib', 'app']

    findings = []
    sql_files = ts_files = 0
    sql_texts = []

    for root in roots:
        if os.path.isfile(root):
            paths = [root]
        else:
            paths = []
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames
                               if d not in ('node_modules', '.next', '.git')]
                paths += [os.path.join(dirpath, f) for f in filenames]

        for path in sorted(paths):
            if path.endswith('.sql'):
                sql_files += 1
                text = open(path, encoding='utf-8', errors='replace').read()
                sql_texts.append((path, text))
            elif path.endswith(('.ts', '.tsx')) and not sql_only:
                ts_files += 1
                text = open(path, encoding='utf-8', errors='replace').read()
                for line, q in extract_mysql_queries(text):
                    sub = []
                    check_patterns(q, f'{path}:~{line}', sub)
                    findings += sub

    # Two passes: every CREATE TABLE is read first so an ALTER in one file can
    # be resolved against a column declared in another.
    for _, text in sql_texts:
        collect_column_widths(text)
    for path, text in sql_texts:
        check_patterns(text, path, findings)
        check_index_widths(text, path, findings)
        check_alter_indexes(text, path, findings)

    print(f'Scanned {sql_files} .sql files'
          + ('' if sql_only else f' and {ts_files} .ts/.tsx files')
          + ' against MySQL 5.6.\n')

    blocking = [f for f in findings if f[0] == BLOCKING]
    warnings = [f for f in findings if f[0] == WARNING]

    for label, group in (('BLOCKING', blocking), ('WARNING', warnings)):
        if not group:
            continue
        print(f'--- {label} ({len(group)}) ---')
        for sev, path, line, what, advice in group:
            where = f'{path}:{line}' if line else path
            print(f'  {where}\n    {what}\n    -> {advice}')
        print()

    if not findings:
        print('Nothing found. Everything here should run on 5.6.35.')
    return 1 if blocking else 0


if __name__ == '__main__':
    sys.exit(main())
