/*
  Why a sales order line's "customer part" is really the APC part number.

  DATA0050 holds BOTH kinds of row, and CUSTOMER_PART_NUMBER means a different
  thing on each:

    production row   RKEY = PRODUCTION_PART_PTR  (it points at itself)
                     CUSTOMER_PART_NUMBER = the APC number   e.g. 76542
                     CUSTOMER_PART_DESC   = often the customer's number

    sales row        PRODUCTION_PART_PTR -> the production row's RKEY
                     CUSTOMER_PART_NUMBER = the CUSTOMER's number
                                                             e.g. 14100047+01

  DATA0060.CUST_PART_PTR appears to land on the PRODUCTION row, so the original
  query returned 76542 and nothing in Products matched it, because Products is
  keyed on the customer number.

  These confirm it before the query is changed. Read-only throughout.
*/

-- ---------------------------------------------------------------------------
-- Q1. Every DATA0050 row in the 76542 family, both kinds side by side.
--     Expect one self-pointing production row (76542) and one or more sales
--     rows carrying the real customer numbers.
-- ---------------------------------------------------------------------------
SELECT  d.RKEY,
        d.PRODUCTION_PART_PTR,
        CASE WHEN d.RKEY = d.PRODUCTION_PART_PTR THEN 'PRODUCTION' ELSE 'sales' END AS RowKind,
        LTRIM(RTRIM(d.CUSTOMER_PART_NUMBER)) AS CustomerPartNumber,
        LTRIM(RTRIM(d.CUSTOMER_PART_DESC))   AS CustomerPartDesc,
        LTRIM(RTRIM(d.CP_REV))               AS Rev,
        d.CUSTOMER_PTR,
        LTRIM(RTRIM(c.CUSTOMER_NAME))        AS CustomerName
FROM    DATA0050 d WITH (NOLOCK)
LEFT JOIN DATA0010 c WITH (NOLOCK) ON c.RKEY = d.CUSTOMER_PTR
WHERE   d.PRODUCTION_PART_PTR IN (
            SELECT p.RKEY FROM DATA0050 p WITH (NOLOCK)
            WHERE p.RKEY = p.PRODUCTION_PART_PTR
              AND LTRIM(RTRIM(p.CUSTOMER_PART_NUMBER)) LIKE '76542%'
        )
ORDER BY RowKind DESC, d.RKEY;


-- ---------------------------------------------------------------------------
-- Q2. What the open order lines for that family actually point at.
--     RowKind on the pointed-at row is the answer: if it says PRODUCTION,
--     CUST_PART_PTR is landing on the production row and that is the bug.
-- ---------------------------------------------------------------------------
SELECT  LTRIM(RTRIM(SO.SALES_ORDER))          AS SalesOrder,
        LTRIM(RTRIM(SO.ITEM_NBR))             AS Item,
        SO.CUST_PART_PTR,
        CASE WHEN CP.RKEY = CP.PRODUCTION_PART_PTR THEN 'PRODUCTION' ELSE 'sales' END AS PointsAt,
        LTRIM(RTRIM(CP.CUSTOMER_PART_NUMBER)) AS PointedAtPartNumber,
        LTRIM(RTRIM(CP.CUSTOMER_PART_DESC))   AS PointedAtDesc,
        LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER)) AS ProductionPartNumber,
        LTRIM(RTRIM(CUST.CUSTOMER_NAME))      AS Customer,
        SO.PARTS_ORDERED, SO.PARTS_SHIPPED
FROM    DATA0060 SO WITH (NOLOCK)
LEFT JOIN DATA0050 CP   WITH (NOLOCK) ON CP.RKEY = SO.CUST_PART_PTR
LEFT JOIN DATA0050 PP   WITH (NOLOCK) ON PP.RKEY = CP.PRODUCTION_PART_PTR
LEFT JOIN DATA0010 CUST WITH (NOLOCK) ON CUST.RKEY = SO.CUSTOMER_PTR
WHERE   SO.STATUS < 3
    AND LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER)) LIKE '76542%'
ORDER BY SalesOrder, Item;


-- ---------------------------------------------------------------------------
-- Q3. Across the WHOLE open book: which kind of row does CUST_PART_PTR hit?
--     Decides whether the fix has to handle both directions or just one.
--     The corrected query handles both either way, but this says what is
--     normal.
-- ---------------------------------------------------------------------------
SELECT  CASE
            WHEN CP.RKEY IS NULL THEN '(no row)'
            WHEN CP.RKEY = CP.PRODUCTION_PART_PTR THEN 'PRODUCTION'
            ELSE 'sales'
        END AS PointsAt,
        COUNT(*) AS Lines
FROM    DATA0060 SO WITH (NOLOCK)
LEFT JOIN DATA0050 CP WITH (NOLOCK) ON CP.RKEY = SO.CUST_PART_PTR
WHERE   SO.STATUS < 3
GROUP BY CASE
            WHEN CP.RKEY IS NULL THEN '(no row)'
            WHEN CP.RKEY = CP.PRODUCTION_PART_PTR THEN 'PRODUCTION'
            ELSE 'sales'
         END;


-- ---------------------------------------------------------------------------
-- Q4. The corrected shape, on the 76542 family only.
--     Both numbers on every line: the APC part to tie to Products, and the
--     customer's own number. SalesPartSource says which fallback supplied it.
-- ---------------------------------------------------------------------------
SELECT  LTRIM(RTRIM(SO.SALES_ORDER)) AS SalesOrder,
        LTRIM(RTRIM(SO.ITEM_NBR))    AS Item,
        CASE
            WHEN PP.CUSTOMER_PART_NUMBER LIKE 'Z%' THEN
                 SUBSTRING(PP.CUSTOMER_PART_NUMBER, 2,
                     CASE WHEN CHARINDEX(' ', PP.CUSTOMER_PART_NUMBER) > 0
                          THEN CHARINDEX(' ', PP.CUSTOMER_PART_NUMBER) - 2
                          ELSE LEN(PP.CUSTOMER_PART_NUMBER) END)
            WHEN PP.CUSTOMER_PART_NUMBER LIKE 'R%' THEN LEFT(PP.CUSTOMER_PART_NUMBER, 6)
            WHEN CHARINDEX(' ', PP.CUSTOMER_PART_NUMBER) > 0 THEN
                 LEFT(PP.CUSTOMER_PART_NUMBER, CHARINDEX(' ', PP.CUSTOMER_PART_NUMBER) - 1)
            ELSE LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER))
        END AS ApcPart,
        COALESCE(
            CASE WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR
                 THEN LTRIM(RTRIM(CP.CUSTOMER_PART_NUMBER)) END,
            LTRIM(RTRIM(SPC.CUSTOMER_PART_NUMBER)),
            LTRIM(RTRIM(SPA.CUSTOMER_PART_NUMBER))
        ) AS CustomerPart,
        CASE
            WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR THEN 'pointer was a sales row'
            WHEN SPC.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'sales row, same customer'
            WHEN SPA.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'sales row, any customer'
            ELSE 'none found'
        END AS SalesPartSource,
        LTRIM(RTRIM(PP.CUSTOMER_PART_DESC)) AS ProductionDesc,
        LTRIM(RTRIM(CUST.CUSTOMER_NAME))    AS Customer
FROM    DATA0060 SO WITH (NOLOCK)
LEFT JOIN DATA0050 CP   WITH (NOLOCK) ON CP.RKEY = SO.CUST_PART_PTR
LEFT JOIN DATA0050 PP   WITH (NOLOCK) ON PP.RKEY = CP.PRODUCTION_PART_PTR
OUTER APPLY (
    SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
    FROM DATA0050 sp WITH (NOLOCK)
    WHERE sp.PRODUCTION_PART_PTR = PP.RKEY AND sp.RKEY <> PP.RKEY
      AND sp.CUSTOMER_PTR = SO.CUSTOMER_PTR
    ORDER BY sp.RKEY DESC
) SPC
OUTER APPLY (
    SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
    FROM DATA0050 sp WITH (NOLOCK)
    WHERE sp.PRODUCTION_PART_PTR = PP.RKEY AND sp.RKEY <> PP.RKEY
    ORDER BY sp.RKEY DESC
) SPA
LEFT JOIN DATA0010 CUST WITH (NOLOCK) ON CUST.RKEY = SO.CUSTOMER_PTR
WHERE   SO.STATUS < 3
    AND LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER)) LIKE '76542%'
ORDER BY SalesOrder, Item;
