# Core-Top / Core-Bottom Layer Table (DP-100 parity)

Recreates the legacy DP-100 OUTPUT per-layer screen inside the Next.js app:
Layer, Type, Polarity, and X/Y Scale, split into Core-Top and Core-Bottom.

## Data source
Genesis job matrix (canonical — same source the legacy DP-100 screen used).

## Backend (Python)
- `genesis_client.py` — `get_layer_matrix(job)`: one COM `get_layer_info` pass
  over discovered layers; parses `type` + `polarity` from `$COMANS`. Defensive:
  empty fields fall back to name-based defaults in the UI.
- `server.py`
  - `/api/acquire` and `/api/layers/{job}` now also return `layer_info[]`
    (`{name, type, polarity, row}`) alongside the existing `layers[]`.
  - `/api/output` accepts `layer_overrides[]` and, before the legacy
    `output_ldi_files` script, applies per-layer polarity (`set_layer_polarity`)
    and scale (`sel_resize`) via COM — only when they differ from Genesis
    defaults. Streams "Applied: L#… [pol=…, scale=…]" progress lines.

## Frontend
- `lib/ldi-client.ts` — `LayerInfo`, `LayerOverride` types; `layer_info` on
  acquire/layers results; `startOutput` forwards `layerOverrides`.
- `app/api/ldi/output/route.ts` — threads `layerOverrides` to the backend.
- `app/page.tsx`
  - Routing helpers: odd→Top, even→Bottom, cap layers follow base parity,
    named plots route by top/bot keyword, else Other. Type shorthand maps
    signal→sig, power_ground/mixed→p'g, drill/rout→pth. Polarity defaults
    signal→NEG, plane→POS when the matrix is silent.
  - Flat toggle grid replaced by a two-column Core-Top / Core-Bottom table
    (+ Other section shown only when needed). Each row: checkbox, L#, Layer,
    Type badge, POS/NEG toggle, editable X/Y scale (default 1.0000).

## Verify against a live job
- COMANS field names for `get_layer_info` vary slightly by Genesis build;
  confirm `type`/`polarity` populate on a known 18-layer job.
- Confirm `sel_resize` anchor/scale semantics match how DP-100 historically
  applied artwork scale (vs a comp-based op) on your build.
