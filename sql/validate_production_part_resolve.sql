/* ───────────────────────────────────────────────────────────────────────────
   Validates resolveProductionPart() in lib/products/partSearch.ts.

   The point being checked: DATA0050.CUSTOMER_PART_NUMBER holds the APC number
   on a PRODUCTION row (RKEY = PRODUCTION_PART_PTR) and the CUSTOMER's number
   on a SALES row (a child pointing back at it). Only the production row
   carries BOM_PTR and PROD_ROUTE_PTR, so a card built from a customer number
   comes back with no BOM and no route.

   Read-only. Edit the three numbers in @Try if you want other examples.
   ─────────────────────────────────────────────────────────────────────────── */
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

DECLARE @Try TABLE (AskedFor VARCHAR(60));
INSERT INTO @Try (AskedFor) VALUES
    ('76237'),      -- APC number  — expect a production row WITH bom + route
    ('03KW905'),    -- customer number for the same product — must resolve to 76237
    ('76443');      -- the gold standard itself

/* Q1 — what each number actually points at, before any resolving.
        Expect: 76237 and 76443 land on production rows that have BOM and
        route pointers; 03KW905 lands on a sales row with neither. That row
        with HasBom=0 / HasRoute=0 is the bug, shown directly. */
SELECT
    t.AskedFor,
    d50.RKEY,
    LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER))  AS StoredNumber,
    LTRIM(RTRIM(d50.CUSTOMER_PART_DESC))    AS Description,
    CASE WHEN d50.RKEY = d50.PRODUCTION_PART_PTR
         THEN 'PRODUCTION' ELSE 'SALES' END AS RowKind,
    d50.PRODUCTION_PART_PTR,
    CASE WHEN ISNULL(d50.BOM_PTR, 0)        > 0 THEN 1 ELSE 0 END AS HasBom,
    CASE WHEN ISNULL(d50.PROD_ROUTE_PTR, 0) > 0 THEN 1 ELSE 0 END AS HasRoute
FROM @Try t
JOIN DATA0050 d50 WITH (NOLOCK)
  ON LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
     = t.AskedFor COLLATE DATABASE_DEFAULT
  OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
     LIKE (t.AskedFor + ' %')               COLLATE DATABASE_DEFAULT
ORDER BY t.AskedFor, RowKind, d50.RKEY;


/* Q2 — the resolver itself, run over all three numbers.
        Expect one row per input, every one of them PRODUCTION, with
        HasBom = 1 and HasRoute = 1, and 03KW905 resolving to APC 76237
        with MatchedOn = 'customer'. */
SELECT
    t.AskedFor,
    r.ProdPartRKEY,
    r.RawPartNumber,
    r.ProdPartNum       AS ResolvedApcPart,
    r.SalesPartNum      AS CustomerPart,
    r.MatchedOn,
    r.HasBom,
    r.HasRoute
FROM @Try t
OUTER APPLY (
    SELECT TOP 1
        prod.RKEY                                 AS ProdPartRKEY,
        LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER))   AS RawPartNumber,
        CASE
            WHEN prod.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN
                CASE WHEN CHARINDEX(' ', prod.CUSTOMER_PART_NUMBER) > 0
                     THEN SUBSTRING(prod.CUSTOMER_PART_NUMBER, 2, CHARINDEX(' ', prod.CUSTOMER_PART_NUMBER) - 2)
                     ELSE SUBSTRING(prod.CUSTOMER_PART_NUMBER, 2, LEN(prod.CUSTOMER_PART_NUMBER)) END
            WHEN prod.CUSTOMER_PART_NUMBER LIKE 'R%' THEN LEFT(prod.CUSTOMER_PART_NUMBER, 6)
            ELSE
                CASE WHEN CHARINDEX(' ', prod.CUSTOMER_PART_NUMBER) > 0
                     THEN LEFT(prod.CUSTOMER_PART_NUMBER, CHARINDEX(' ', prod.CUSTOMER_PART_NUMBER) - 1)
                     ELSE prod.CUSTOMER_PART_NUMBER END
        END                                       AS ProdPartNum,
        LTRIM(RTRIM(child.CUSTOMER_PART_NUMBER))  AS SalesPartNum,
        CASE
            WHEN LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
                 = t.AskedFor COLLATE DATABASE_DEFAULT THEN 'apc-exact'
            WHEN LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
                 LIKE (t.AskedFor + ' %') COLLATE DATABASE_DEFAULT THEN 'apc-suffixed'
            ELSE 'customer'
        END                                       AS MatchedOn,
        CASE WHEN ISNULL(prod.BOM_PTR, 0)        > 0 THEN 1 ELSE 0 END AS HasBom,
        CASE WHEN ISNULL(prod.PROD_ROUTE_PTR, 0) > 0 THEN 1 ELSE 0 END AS HasRoute
    FROM DATA0050 prod WITH (NOLOCK)
    LEFT JOIN DATA0050 child WITH (NOLOCK)
           ON child.PRODUCTION_PART_PTR = prod.RKEY
          AND child.RKEY <> prod.PRODUCTION_PART_PTR
    WHERE prod.RKEY = prod.PRODUCTION_PART_PTR
      AND (
            LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              = t.AskedFor COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              LIKE (t.AskedFor + ' %') COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(child.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              = t.AskedFor COLLATE DATABASE_DEFAULT
          )
    ORDER BY
        CASE
            WHEN LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
                 = t.AskedFor COLLATE DATABASE_DEFAULT THEN 0
            WHEN LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
                 LIKE (t.AskedFor + ' %') COLLATE DATABASE_DEFAULT THEN 1
            ELSE 2
        END,
        LEN(LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER))),
        prod.CUSTOMER_PART_NUMBER
) r
ORDER BY t.AskedFor;


/* Q3 — the level-1 BOM of each resolved production part, side by side.
        This is the list the compare pairs on, so it should show L-/C-/S-/P-
        style numbers on BOTH 76237 and 76443. If 76237 comes back empty here
        the two products genuinely do not share a structure, and the pairing
        rule is not the problem. */
SELECT
    t.AskedFor,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS BomPartNumber,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS BomPartDesc,
    LTRIM(RTRIM(d17.P_M))                  AS P_or_M,
    d26.QTY_BOM
FROM @Try t
CROSS APPLY (
    SELECT TOP 1 prod.RKEY, prod.BOM_PTR
    FROM DATA0050 prod WITH (NOLOCK)
    LEFT JOIN DATA0050 child WITH (NOLOCK)
           ON child.PRODUCTION_PART_PTR = prod.RKEY
          AND child.RKEY <> prod.PRODUCTION_PART_PTR
    WHERE prod.RKEY = prod.PRODUCTION_PART_PTR
      AND (
            LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              = t.AskedFor COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              LIKE (t.AskedFor + ' %') COLLATE DATABASE_DEFAULT
         OR LTRIM(RTRIM(child.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
              = t.AskedFor COLLATE DATABASE_DEFAULT
          )
    ORDER BY LEN(LTRIM(RTRIM(prod.CUSTOMER_PART_NUMBER)))
) p
-- BOM_PTR points at DATA0025 (the BOM header); the lines hang off it by
-- PARENT_NODE_INVENT, not by a BOM_PTR column on DATA0026.
JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY               = p.BOM_PTR
JOIN DATA0026 d26 WITH (NOLOCK) ON d26.PARENT_NODE_INVENT = d25.RKEY
JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY               = d26.INVENTORY_PTR
ORDER BY t.AskedFor, d17.INV_PART_NUMBER;
