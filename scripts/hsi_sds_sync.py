#!/usr/bin/env python3
"""
hsi_sds_sync.py — mirror the HSI (Encompass) SDS catalogue into MySQL.

WHY A SCRIPT AND NOT AN API ROUTE
    The USML feature hit exactly this: the container could not reach ecfr.gov,
    and the data had to be pulled on a workstation instead. `*.azurewebsites.net`
    through the plant firewall has the same odds, so this runs either place —
    on englnx01 from cron, or on a laptop that can see both the internet and
    apceng03. Same script, same result.

    It also runs with no third-party packages: urllib and the mysql CLI only.
    No pip, no PyPI reachability problem behind a TLS-intercepting proxy.

USAGE
    # look at what the API returns, touch nothing
    ./hsi_sds_sync.py --probe

    # dry run: fetch, parse, print what would change
    ./hsi_sds_sync.py --dry-run

    # real sync
    ./hsi_sds_sync.py

    # no API access yet? feed it a JSON export instead
    ./hsi_sds_sync.py --from-file materials.json

ENVIRONMENT
    HSI_BASE_URL   default https://encompass-public-api-dev.azurewebsites.net
    HSI_USER       API account (separate from a normal Encompass login)
    HSI_PASSWORD
    HSI_API_KEY    if the API uses a key header instead of basic auth
    MYSQL_HOST     default apceng03
    MYSQL_DB       default node_app
    MYSQL_USER
    MYSQL_PASSWORD

⚠ THE ADAPTER BLOCK BELOW IS UNVERIFIED.
    The Swagger UI at /swagger/ui/index is JavaScript-rendered, so the endpoint
    paths and response field names here are the conventional Swashbuckle
    shapes, NOT the real contract. Run --probe first: it dumps the raw JSON of
    one material so the mapping can be corrected against reality. Everything
    outside the adapter block is independent of how the API happens to spell
    things.
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

# =============================================================
# ADAPTER BLOCK — the only part that should need editing once
# the real spec is in hand.
# =============================================================

BASE_URL = os.environ.get(
    'HSI_BASE_URL', 'https://encompass-public-api-dev.azurewebsites.net'
).rstrip('/')

# Candidate list endpoints, tried in order until one returns JSON.
# Swashbuckle 5 (which the /swagger/ui/index path implies) usually publishes
# its spec at /swagger/docs/v1 — --probe fetches that too.
LIST_ENDPOINTS = [
    '/api/materials',
    '/api/material',
    '/api/sds/materials',
]

# Per-material detail; {id} is substituted with whatever ID_FIELD yielded.
DETAIL_ENDPOINTS = [
    '/api/materials/{id}',
    '/api/material/{id}',
]

# Ingredients may be inline on the detail payload or a separate call.
INGREDIENT_ENDPOINTS = [
    '/api/materials/{id}/ingredients',
    '/api/materials/{id}/properties',
]

# Response field name -> our column. Each entry is a list of names to try, so a
# spelling difference is a one-line edit rather than a code change.
FIELD_MAP = {
    'hsi_material_number': ['materialNumber', 'material_number', 'materialNo', 'number'],
    'hsi_material_id':     ['id', 'materialId', 'material_id', 'guid'],
    'product_name':        ['productName', 'product_name', 'name'],
    'material_description':['materialDescription', 'material_description', 'description'],
    'manufacturer':        ['materialManufacturer', 'manufacturer', 'manufacturerName'],
    'product_numbers':     ['productNumbers', 'product_numbers', 'productNumber'],
    'principal_cas':       ['principalCasNumber', 'principal_cas', 'casNumber'],
    'synonyms':            ['synonyms', 'synonym'],
    'revision_date':       ['revisionDate', 'revision_date'],
    'is_archived':         ['isArchived', 'archived', 'activeArchived', 'status'],
}

INGREDIENT_FIELD_MAP = {
    'chemical_name': ['chemicalName', 'chemical_name', 'name'],
    'cas_number':    ['casNumber', 'cas_number', 'cas'],
    'pct_stated':    ['statedPercent', 'stated', 'statedPct', 'percent'],
    'pct_min':       ['minPercent', 'min', 'minPct'],
    'pct_max':       ['maxPercent', 'max', 'maxPct'],
    'trade_secret':  ['tradeSecret', 'trade_secret', 'isTradeSecret'],
}

# Where the ingredient rows hang off a material detail payload, if inline.
INGREDIENT_CONTAINERS = ['ingredients', 'properties.ingredients', 'composition']

# =============================================================
# Generic helpers — API-shape independent below this line.
# =============================================================


def log(msg):
    print(msg, file=sys.stderr)


def auth_headers():
    h = {'Accept': 'application/json', 'User-Agent': 'frontend2.0-hsi-sync/1.0'}
    key = os.environ.get('HSI_API_KEY')
    if key:
        h['Ocp-Apim-Subscription-Key'] = key
        h['X-API-Key'] = key
    user = os.environ.get('HSI_USER')
    pw = os.environ.get('HSI_PASSWORD')
    if user and pw:
        token = base64.b64encode(f'{user}:{pw}'.encode()).decode()
        h['Authorization'] = f'Basic {token}'
    return h


def fetch(path, timeout=45):
    """GET a path, return parsed JSON. Returns None on any failure."""
    url = path if path.startswith('http') else f'{BASE_URL}{path}'
    req = urllib.request.Request(url, headers=auth_headers())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode('utf-8', errors='replace')
        return json.loads(body)
    except urllib.error.HTTPError as e:
        log(f'  HTTP {e.code} on {url}')
        if e.code in (401, 403):
            log('  -> auth rejected. HSI API credentials are separate from a '
                'normal Encompass login; ask the account manager.')
        return None
    except urllib.error.URLError as e:
        log(f'  unreachable: {url} ({e.reason})')
        log('  -> if this is the container, the egress path to azurewebsites.net '
            'is blocked. Run this from a workstation instead.')
        return None
    except json.JSONDecodeError:
        log(f'  non-JSON response from {url}')
        return None


def dig(obj, names):
    """First present value among `names`, supporting dotted paths."""
    for name in names:
        cur = obj
        ok = True
        for part in name.split('.'):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok and cur is not None:
            return cur
    return None


def as_list(payload):
    """Unwrap the usual envelope shapes into a plain list."""
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for k in ('items', 'results', 'data', 'materials', 'value'):
            if isinstance(payload.get(k), list):
                return payload[k]
    return []


# ---------- CAS + percentage parsing (mirrors lib/ehs/casNumber.ts) ----------

def normalize_cas(raw):
    digits = re.sub(r'[^0-9]', '', str(raw or ''))
    if not (5 <= len(digits) <= 10):
        return ''
    first = digits[:-3].lstrip('0')
    if not first:
        return ''
    return f'{first}-{digits[-3:-1]}-{digits[-1]}'


def valid_cas(cas):
    cas = normalize_cas(cas)
    if not cas:
        return False
    d = cas.replace('-', '')
    check, body = int(d[-1]), d[:-1]
    total = sum(int(body[len(body) - 1 - i]) * (i + 1) for i in range(len(body)))
    return total % 10 == check


def parse_percent(stated):
    """'59 - 64%' -> (59.0, 64.0). Threshold tests use the max."""
    s = str(stated or '').strip()
    if not s:
        return (None, None)
    nums = [float(n) for n in re.findall(r'\d+(?:\.\d+)?', s)]
    if not nums:
        return (None, None)
    if len(nums) >= 2:
        return (min(nums[0], nums[1]), max(nums[0], nums[1]))
    n = nums[0]
    if re.search(r'[<≤]', s):
        return (0.0, n)
    if re.search(r'[>≥]', s):
        return (n, 100.0)
    return (n, n)


def parse_archived(v):
    """HSI shows this as the word Active or Archived, or as a bool."""
    if isinstance(v, bool):
        return 1 if v else 0
    s = str(v or '').strip().lower()
    return 1 if s in ('archived', 'true', '1', 'inactive') else 0


def parse_date(v):
    """Accept 11/30/2025 or an ISO timestamp; emit YYYY-MM-DD or None."""
    s = str(v or '').strip()
    if not s:
        return None
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})', s)
    if m:
        mo, d, y = m.groups()
        return f'{y}-{int(mo):02d}-{int(d):02d}'
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    return m.group(0) if m else None


# ---------- shaping ----------

def shape_material(raw):
    out = {}
    for col, names in FIELD_MAP.items():
        out[col] = dig(raw, names)
    out['hsi_material_number'] = str(out.get('hsi_material_number') or '').strip()
    out['is_archived'] = parse_archived(out.get('is_archived'))
    out['revision_date'] = parse_date(out.get('revision_date'))
    if isinstance(out.get('product_numbers'), list):
        out['product_numbers'] = ', '.join(str(x) for x in out['product_numbers'])
    if isinstance(out.get('synonyms'), list):
        out['synonyms'] = ', '.join(str(x) for x in out['synonyms'])
    out['raw_json'] = json.dumps(raw, separators=(',', ':'))[:60000]
    return out


def shape_ingredients(material_number, rows):
    shaped = []
    for i, r in enumerate(rows or []):
        if not isinstance(r, dict):
            continue
        cas_raw = str(dig(r, INGREDIENT_FIELD_MAP['cas_number']) or '').strip()
        cas = normalize_cas(cas_raw)
        if cas_raw and not cas:
            log(f'    ! {material_number}: unparseable CAS "{cas_raw}"')
        elif cas and not valid_cas(cas):
            # Worth surfacing: a transposed digit can land on a real substance.
            log(f'    ! {material_number}: CAS {cas} fails its check digit')

        stated = dig(r, INGREDIENT_FIELD_MAP['pct_stated'])
        pmin = dig(r, INGREDIENT_FIELD_MAP['pct_min'])
        pmax = dig(r, INGREDIENT_FIELD_MAP['pct_max'])
        if pmin is None or pmax is None:
            fmin, fmax = parse_percent(stated)
            pmin = pmin if pmin is not None else fmin
            pmax = pmax if pmax is not None else fmax

        ts = dig(r, INGREDIENT_FIELD_MAP['trade_secret'])
        shaped.append({
            'hsi_material_number': material_number,
            'chemical_name': str(dig(r, INGREDIENT_FIELD_MAP['chemical_name']) or '').strip(),
            'cas_number': cas,
            'cas_raw': cas_raw,
            'pct_stated': str(stated or '').strip(),
            'pct_min': pmin,
            'pct_max': pmax,
            'trade_secret': 1 if ts in (True, 1, 'true', 'True', 'Y') else 0,
            'seq': i,
        })
    return shaped


# ---------- MySQL via the CLI ----------

def sql_lit(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace('\\', '\\\\').replace("'", "\\'")
    return f"'{s}'"


def run_sql(statements, dry_run=False):
    script = '\n'.join(statements)
    if dry_run:
        print(script)
        return True
    cmd = [
        'mysql',
        f"-h{os.environ.get('MYSQL_HOST', 'apceng03')}",
        f"-u{os.environ.get('MYSQL_USER', '')}",
        os.environ.get('MYSQL_DB', 'node_app'),
    ]
    env = dict(os.environ)
    if os.environ.get('MYSQL_PASSWORD'):
        env['MYSQL_PWD'] = os.environ['MYSQL_PASSWORD']
    try:
        p = subprocess.run(cmd, input=script.encode(), env=env,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if p.returncode != 0:
            log(f'mysql failed: {p.stderr.decode(errors="replace")[:600]}')
            return False
        return True
    except FileNotFoundError:
        log('mysql client not found — install mariadb-client or use --dry-run.')
        return False


def upsert_statements(materials, ingredients_by_material):
    out = ['START TRANSACTION;']
    for m in materials:
        cols = ['hsi_material_number', 'hsi_material_id', 'product_name',
                'material_description', 'manufacturer', 'product_numbers',
                'principal_cas', 'synonyms', 'revision_date', 'is_archived',
                'ingredients_known', 'raw_json']
        ings = ingredients_by_material.get(m['hsi_material_number'], [])
        m['ingredients_known'] = 1 if ings else 0
        vals = ', '.join(sql_lit(m.get(c)) for c in cols)
        updates = ', '.join(
            f'{c} = VALUES({c})' for c in cols if c != 'hsi_material_number'
        )
        out.append(
            f"INSERT INTO ehs_sds_materials ({', '.join(cols)}, synced_at) "
            f"VALUES ({vals}, NOW()) "
            f"ON DUPLICATE KEY UPDATE {updates}, synced_at = NOW();"
        )
        # Ingredients are replaced wholesale — a revised SDS can drop a row,
        # and an upsert would leave the dropped one behind looking current.
        out.append(
            'DELETE FROM ehs_sds_ingredients WHERE hsi_material_number = '
            f"{sql_lit(m['hsi_material_number'])};"
        )
        for ing in ings:
            icols = ['hsi_material_number', 'chemical_name', 'cas_number', 'cas_raw',
                     'pct_stated', 'pct_min', 'pct_max', 'trade_secret', 'seq']
            ivals = ', '.join(sql_lit(ing.get(c)) for c in icols)
            out.append(
                f"INSERT INTO ehs_sds_ingredients ({', '.join(icols)}) VALUES ({ivals});"
            )
    out.append('COMMIT;')
    return out


# ---------- modes ----------

def probe():
    """Show what the API actually returns, so the adapter can be corrected."""
    print('=== spec ===')
    for p in ('/swagger/docs/v1', '/swagger/v1/swagger.json'):
        spec = fetch(p)
        if spec:
            paths = sorted((spec.get('paths') or {}).keys())
            print(f'{p}: {len(paths)} paths')
            for path in paths[:60]:
                print(f'  {path}')
            break
    else:
        print('no spec retrieved at the usual paths')

    print('\n=== list endpoints ===')
    for ep in LIST_ENDPOINTS:
        payload = fetch(ep)
        if payload is None:
            print(f'{ep}: no')
            continue
        items = as_list(payload)
        print(f'{ep}: {len(items)} items')
        if items:
            print('  first item, raw:')
            print(json.dumps(items[0], indent=2)[:3000])
            break


def collect(from_file=None):
    if from_file:
        with open(from_file) as fh:
            return as_list(json.load(fh))
    for ep in LIST_ENDPOINTS:
        payload = fetch(ep)
        items = as_list(payload)
        if items:
            log(f'{ep}: {len(items)} materials')
            return items
    log('No list endpoint returned anything. Run --probe.')
    return []


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--probe', action='store_true',
                    help='dump the spec and one raw material, change nothing')
    ap.add_argument('--dry-run', action='store_true',
                    help='print the SQL instead of running it')
    ap.add_argument('--from-file', help='read materials from a JSON export')
    ap.add_argument('--limit', type=int, default=0, help='stop after N materials')
    args = ap.parse_args()

    if args.probe:
        probe()
        return 0

    raw_items = collect(args.from_file)
    if args.limit:
        raw_items = raw_items[:args.limit]
    if not raw_items:
        return 1

    materials, ingredients_by_material = [], {}
    for raw in raw_items:
        m = shape_material(raw)
        num = m['hsi_material_number']
        if not num:
            log(f'  skipping a record with no material number: {str(raw)[:120]}')
            continue

        # Ingredients inline if they came with the record, else a second call.
        rows = dig(raw, INGREDIENT_CONTAINERS)
        if rows is None and not args.from_file:
            ident = m.get('hsi_material_id') or num
            for ep in INGREDIENT_ENDPOINTS:
                got = fetch(ep.replace('{id}', urllib.parse.quote(str(ident))))
                if got is not None:
                    rows = as_list(got) or dig(got, INGREDIENT_CONTAINERS)
                    if rows:
                        break

        ingredients_by_material[num] = shape_ingredients(num, rows or [])
        materials.append(m)

    log(f'{len(materials)} materials, '
        f'{sum(len(v) for v in ingredients_by_material.values())} ingredient rows')
    blank = [m['hsi_material_number'] for m in materials
             if not ingredients_by_material.get(m['hsi_material_number'])]
    if blank:
        log(f'{len(blank)} with no ingredient data (these screen as Review, '
            f'never as a pass): {", ".join(blank[:12])}'
            + (' …' if len(blank) > 12 else ''))

    ok = run_sql(upsert_statements(materials, ingredients_by_material),
                 dry_run=args.dry_run)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
