/* =============================================================
   TARGET: MSSQL (Paradigm PDMLIV on APCERPLV02) -- NOT the MySQL primary

   Raw Material Traceability — working queries
   Test work order: -354516-01-000

   Supersedes explore_raw_material_traceability_4.sql sections 21
   and 22, which did not run. Two bugs, both mine:

   1. "Types don't match between the anchor and the recursive part
      in column Visited".

      A recursive CTE requires every column to have EXACTLY the
      same type, length and collation on both sides of the UNION
      ALL — SQL Server will not widen or coerce the way it does
      elsewhere. Two columns broke that rule:

        BatchSerial   anchor had a bare LTRIM(RTRIM(...)) over a
                      char(20), giving varchar(20); the recursive
                      side produced the same thing but compared
                      against values already cast to varchar(40).

        RootWorkOrder anchor was CAST(@WorkOrder AS VARCHAR(40)),
                      recursive was a bare i.BatchSerial —
                      varchar(20) against varchar(40).

      Collation is the other half of it, and this server has form:
      a column collation change in Aug 2026 caused
      Latin1_General_CI_AI vs Latin1_General_BIN conflicts on
      column-to-column text joins. A recursive CTE is exactly that
      comparison, so every character column below is now both CAST
      to an explicit length AND given COLLATE DATABASE_DEFAULT on
      both sides.

   2. A correctness bug the error was hiding.

      The recursion descended on EVERY issued batch, including
      purchased lots. 'TRAN_SOURCE LIKE ''%5508-0104''' can match
      an unrelated work order whose number happens to end in those
      characters, inventing material that was never issued. Work-
      order batches start with a dash ('-354590-02-100'); supplier
      lots do not ('G011595160', '5508-0104', '4WA5N.1'). The
      recursion is now gated on that, which also stops it probing
      a 15,200-row table once per purchased lot.

   Run one section at a time. No GO separators. All read-only.
   ============================================================= */

SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;


/* -------------------------------------------------------------
   A. NON-CONCISE  — every material issued, through all sub levels
   -------------------------------------------------------------
   @IncludeSub = 0 stops at the top work order (dialog unticked).

   Work orders are matched by SUFFIX so the base job and its
   S-splits come back together — see round 4: lot -354589-01-100
   is issued under -354516-01-000 and under S0..S3 of it, and the
   printed report shows the split's quantity.
   ------------------------------------------------------------- */
DECLARE @WorkOrder  VARCHAR(40) = '-354516-01-000';
DECLARE @IncludeSub BIT = 1;

;WITH Issues AS (
    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE))     AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS TranSource,
        CAST(@WorkOrder                      AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS ParentSource,
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS BatchSerial,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        CAST(0 AS INT) AS Lvl,
        CAST('|' + @WorkOrder + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WorkOrder
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')

    UNION ALL

    SELECT
        CAST(LTRIM(RTRIM(t.TRAN_SOURCE))     AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        CAST(i.BatchSerial                   AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        t.DATA0017_PTR, t.QUANTITY, t.TDATE,
        t.LOC_PTR, t.WHSE_PTR, t.UNIT_PTR, t.RKEY,
        i.Lvl + 1,
        CAST(i.Visited + i.BatchSerial + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT
    FROM Issues i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
         LIKE '%' + i.BatchSerial
    WHERE @IncludeSub = 1
      AND i.Lvl < 10
      -- only a work-order-style batch can have issues of its own
      AND i.BatchSerial LIKE '-%'
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
      AND i.Visited NOT LIKE '%|' + i.BatchSerial + '|%'
)
SELECT
    i.Lvl,
    i.ParentSource                         AS IssuedFrom,
    i.TranSource                           AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    i.BatchSerial,
    i.QUANTITY                             AS Quantity,
    i.TDATE                                AS IssueDate,
    i.WHSE_PTR, i.LOC_PTR,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    lot.EXPIRED_DATE                       AS ExpDate
FROM Issues i
LEFT JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
LEFT JOIN DATA0020 lot
       ON lot.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT = i.BatchSerial
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
ORDER BY i.Lvl, i.TranSource, InventoryPart
OPTION (MAXRECURSION 32);


/* -------------------------------------------------------------
   B. CONCISE — purchased leaves only, deduped
   -------------------------------------------------------------
   Drops the columns that vary per issue (work order, split, date,
   quantity) so repeat issues of one lot collapse to a single row.
   Should return four rows for this job.
   ------------------------------------------------------------- */
DECLARE @WO2 VARCHAR(40) = '-354516-01-000';

;WITH Issues2 AS (
    SELECT
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT AS BatchSerial,
        t.DATA0017_PTR, t.LOC_PTR,
        CAST(0 AS INT) AS Lvl,
        CAST('|' + @WO2 + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT AS Visited
    FROM DATA0153 t
    WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WO2
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')

    UNION ALL

    SELECT
        CAST(LTRIM(RTRIM(t.BATCH_SERIAL_NO)) AS VARCHAR(40))
            COLLATE DATABASE_DEFAULT,
        t.DATA0017_PTR, t.LOC_PTR,
        i.Lvl + 1,
        CAST(i.Visited + i.BatchSerial + '|' AS VARCHAR(4000))
            COLLATE DATABASE_DEFAULT
    FROM Issues2 i
    JOIN DATA0153 t
      ON LTRIM(RTRIM(t.TRAN_SOURCE)) COLLATE DATABASE_DEFAULT
         LIKE '%' + i.BatchSerial
    WHERE i.Lvl < 10
      AND i.BatchSerial LIKE '-%'
      AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                        'Stock To Work Center')
      AND i.Visited NOT LIKE '%|' + i.BatchSerial + '|%'
)
SELECT DISTINCT
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    i.BatchSerial,
    lot.EXPIRED_DATE                       AS ExpDate
FROM Issues2 i
JOIN DATA0017 d17 ON d17.RKEY = i.DATA0017_PTR
LEFT JOIN DATA0020 lot
       ON lot.INVENTORY_POINTER = i.DATA0017_PTR
      AND LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT = i.BatchSerial
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE d17.P_M = 'P'
ORDER BY InventoryPart, i.BatchSerial
OPTION (MAXRECURSION 32);


/* -------------------------------------------------------------
   C. THIS PART ONLY  — sub levels off
   -------------------------------------------------------------
   The dialog's third state. Same as A with @IncludeSub = 0, kept
   separate so it can be run without editing a variable.
   ------------------------------------------------------------- */
DECLARE @WO3 VARCHAR(40) = '-354516-01-000';

SELECT
    LTRIM(RTRIM(t.TRAN_SOURCE))            AS IssuedToWorkOrder,
    LTRIM(RTRIM(d17.INV_PART_NUMBER))      AS InventoryPart,
    LTRIM(RTRIM(d17.INV_PART_DESCRIPTION)) AS Description,
    d17.P_M                                AS PurchasedOrMade,
    LTRIM(RTRIM(t.BATCH_SERIAL_NO))        AS BatchSerial,
    t.QUANTITY                             AS Quantity,
    t.TDATE                                AS IssueDate,
    t.WHSE_PTR, t.LOC_PTR,
    LTRIM(RTRIM(po.PO_NUMBER))             AS PONumber,
    LTRIM(RTRIM(supp.SUPPLIER_NAME))       AS SupplierName,
    lot.EXPIRED_DATE                       AS ExpDate
FROM DATA0153 t
LEFT JOIN DATA0017 d17 ON d17.RKEY = t.DATA0017_PTR
LEFT JOIN DATA0020 lot
       ON lot.INVENTORY_POINTER = t.DATA0017_PTR
      AND LTRIM(RTRIM(lot.BATCH_NO)) COLLATE DATABASE_DEFAULT
        = LTRIM(RTRIM(t.BATCH_SERIAL_NO)) COLLATE DATABASE_DEFAULT
LEFT JOIN DATA0070 po   ON po.RKEY = lot.PO_PTR
LEFT JOIN DATA0023 supp ON supp.RKEY = po.SUPPLIER_POINTER
WHERE LTRIM(RTRIM(t.TRAN_SOURCE)) LIKE '%' + @WO3
  AND LTRIM(RTRIM(t.TRAN_TYPE)) IN ('Stock To Work Order',
                                    'Stock To Work Center')
ORDER BY IssuedToWorkOrder, InventoryPart, t.TDATE;
