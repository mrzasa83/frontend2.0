/* ───────────────────────────────────────────────────────────────────────────
   Is BOM_PART actually there?

   A level-0 card is a DATA0050 row, so its part number is the APC number
   (76443) and carries no C-/B- prefix. The number that says what KIND of
   assembly it is lives on the card's BOM part, reached:

       DATA0050.BOM_PTR -> DATA0025.RKEY -> DATA0017.INV_PART_NUMBER

   That is HEADER_SQL's BOM_PART, captured as gold_standard_cards.bom_number
   and used to pair the level-0 cards. Two products that are really alike show
   the same C-#####-01/NN there.

   Read-only. Edit @Try for other parts.
   ─────────────────────────────────────────────────────────────────────────── */
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

DECLARE @Try TABLE (AskedFor VARCHAR(60));
INSERT INTO @Try (AskedFor) VALUES
    ('76443'),      -- the gold standard
    ('76237');      -- the like part


/* Q1 — the BOM part behind each one.
        Expect a row per part with BomPart reading C-76443-01/NN and
        C-76237-01/NN, and HasBomPart = 1 on both. A HasBomPart of 0 is the
        case the compare now warns about: the pair is still made, but nothing
        confirms the two are the same kind of assembly. */
SELECT
    t.AskedFor,
    d50.RKEY                                  AS ProdPartRKEY,
    LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER))    AS ApcPartNumber,
    LTRIM(RTRIM(d50.CUSTOMER_PART_DESC))      AS Description,
    d50.BOM_PTR,
    d25.RKEY                                  AS BomHeaderRKEY,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))         AS BomPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION))    AS BomPartDesc,
    LTRIM(RTRIM(d17.P_M))                     AS P_or_M,
    CASE WHEN LTRIM(RTRIM(ISNULL(d17.INV_PART_NUMBER, ''))) <> ''
         THEN 1 ELSE 0 END                    AS HasBomPart
FROM @Try t
JOIN DATA0050 d50 WITH (NOLOCK)
      ON d50.RKEY = d50.PRODUCTION_PART_PTR
     AND ( LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
             = t.AskedFor COLLATE DATABASE_DEFAULT
        OR LTRIM(RTRIM(d50.CUSTOMER_PART_NUMBER)) COLLATE DATABASE_DEFAULT
             LIKE (t.AskedFor + ' %') COLLATE DATABASE_DEFAULT )
LEFT JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY = d50.BOM_PTR
LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d25.INVENTORY_PTR
ORDER BY t.AskedFor;


/* Q2 — how often BOM_PART is missing across ALL production parts.
        One row. If MissingBomPart is a large share of the total, the level-0
        check will warn constantly and the rule needs rethinking rather than
        the data needing fixing. */
SELECT
    COUNT(*)                                               AS ProductionParts,
    SUM(CASE WHEN ISNULL(d50.BOM_PTR, 0) = 0
             THEN 1 ELSE 0 END)                            AS NoBomPointer,
    SUM(CASE WHEN LTRIM(RTRIM(ISNULL(d17.INV_PART_NUMBER, ''))) = ''
             THEN 1 ELSE 0 END)                            AS MissingBomPart,
    SUM(CASE WHEN LTRIM(RTRIM(ISNULL(d17.INV_PART_NUMBER, ''))) <> ''
             THEN 1 ELSE 0 END)                            AS HasBomPart
FROM DATA0050 d50 WITH (NOLOCK)
LEFT JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY = d50.BOM_PTR
LEFT JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d25.INVENTORY_PTR
WHERE d50.RKEY = d50.PRODUCTION_PART_PTR;


/* Q3 — what the BOM part numbers look like, by prefix.
        Confirms the C-/B-/L-/S-/P- shape the pairing rule assumes, and shows
        anything that does not fit it. A prefix with a big count that the rule
        does not handle is worth knowing about before trusting a clean result.
        (SQL Server 2008-safe: no window functions, no CTE needed.) */
SELECT
    LEFT(LTRIM(RTRIM(d17.INV_PART_NUMBER)),
         CASE WHEN CHARINDEX('-', LTRIM(RTRIM(d17.INV_PART_NUMBER))) > 1
              THEN CHARINDEX('-', LTRIM(RTRIM(d17.INV_PART_NUMBER))) - 1
              ELSE 0 END)                        AS BomPartPrefix,
    COUNT(*)                                     AS Parts,
    MIN(LTRIM(RTRIM(d17.INV_PART_NUMBER)))       AS ExampleLow,
    MAX(LTRIM(RTRIM(d17.INV_PART_NUMBER)))       AS ExampleHigh
FROM DATA0050 d50 WITH (NOLOCK)
JOIN DATA0025 d25 WITH (NOLOCK) ON d25.RKEY = d50.BOM_PTR
JOIN DATA0017 d17 WITH (NOLOCK) ON d17.RKEY = d25.INVENTORY_PTR
WHERE d50.RKEY = d50.PRODUCTION_PART_PTR
  AND LTRIM(RTRIM(ISNULL(d17.INV_PART_NUMBER, ''))) <> ''
GROUP BY
    LEFT(LTRIM(RTRIM(d17.INV_PART_NUMBER)),
         CASE WHEN CHARINDEX('-', LTRIM(RTRIM(d17.INV_PART_NUMBER))) > 1
              THEN CHARINDEX('-', LTRIM(RTRIM(d17.INV_PART_NUMBER))) - 1
              ELSE 0 END)
ORDER BY Parts DESC;
