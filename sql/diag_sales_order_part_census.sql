/*
  Two remaining risks in the corrected sales-order query, quantified.

  Q3 of the previous diagnostic settled the main question: all 2,441 open
  lines have CUST_PART_PTR pointing at the PRODUCTION row, never a sales row.
  So the customer's own number ALWAYS has to come from a sales child row, and
  these measure how reliably that resolves.

  Risk 1: no sales row at all under the production part, so no customer number.
  Risk 2: several sales rows for the SAME customer, where the query takes the
          highest RKEY and could be taking a superseded one.

  Read-only throughout.
*/

-- ---------------------------------------------------------------------------
-- Q1. How the customer part number resolves across the whole open book.
--     'customer-match' is the good case. 'any-sales-row' means the production
--     part has sales rows but none for this order's customer, so the number
--     shown belongs to somebody else's revision of the part. 'none' means no
--     customer number could be found at all.
-- ---------------------------------------------------------------------------
SELECT  CASE
            WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR THEN 'pointer was a sales row'
            WHEN SPC.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'customer-match'
            WHEN SPA.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'any-sales-row'
            ELSE 'none'
        END AS PartSource,
        COUNT(*)                                  AS Lines,
        COUNT(DISTINCT PP.RKEY)                   AS ProductionParts
FROM    DATA0060 SO WITH (NOLOCK)
LEFT JOIN DATA0050 CP WITH (NOLOCK) ON CP.RKEY = SO.CUST_PART_PTR
LEFT JOIN DATA0050 PP WITH (NOLOCK) ON PP.RKEY = CP.PRODUCTION_PART_PTR
OUTER APPLY (
    SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
    FROM DATA0050 sp WITH (NOLOCK)
    WHERE sp.PRODUCTION_PART_PTR = PP.RKEY AND sp.RKEY <> PP.RKEY
      AND sp.CUSTOMER_PTR = SO.CUSTOMER_PTR
) SPC
OUTER APPLY (
    SELECT TOP 1 sp.CUSTOMER_PART_NUMBER
    FROM DATA0050 sp WITH (NOLOCK)
    WHERE sp.PRODUCTION_PART_PTR = PP.RKEY AND sp.RKEY <> PP.RKEY
) SPA
WHERE   SO.STATUS < 3
GROUP BY CASE
            WHEN CP.RKEY <> CP.PRODUCTION_PART_PTR THEN 'pointer was a sales row'
            WHEN SPC.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'customer-match'
            WHEN SPA.CUSTOMER_PART_NUMBER IS NOT NULL THEN 'any-sales-row'
            ELSE 'none'
         END
ORDER BY Lines DESC;


-- ---------------------------------------------------------------------------
-- Q2. Production parts on the open book carrying MORE THAN ONE sales row for
--     the SAME customer.
--     Where this returns rows, "newest RKEY wins" is a guess. If the numbers
--     differ between those rows, the list may be showing a superseded one and
--     the tie-break needs a better rule than the key order.
-- ---------------------------------------------------------------------------
SELECT  LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER))  AS ProductionPart,
        sp.CUSTOMER_PTR,
        LTRIM(RTRIM(c.CUSTOMER_NAME))          AS CustomerName,
        COUNT(*)                               AS SalesRows,
        COUNT(DISTINCT LTRIM(RTRIM(sp.CUSTOMER_PART_NUMBER))) AS DistinctNumbers,
        MIN(LTRIM(RTRIM(sp.CUSTOMER_PART_NUMBER))) AS Example1,
        MAX(LTRIM(RTRIM(sp.CUSTOMER_PART_NUMBER))) AS Example2
FROM    DATA0050 sp WITH (NOLOCK)
JOIN    DATA0050 PP WITH (NOLOCK)
        ON PP.RKEY = sp.PRODUCTION_PART_PTR AND sp.RKEY <> PP.RKEY
LEFT JOIN DATA0010 c WITH (NOLOCK) ON c.RKEY = sp.CUSTOMER_PTR
WHERE   PP.RKEY IN (
            SELECT DISTINCT CP.PRODUCTION_PART_PTR
            FROM DATA0060 SO WITH (NOLOCK)
            JOIN DATA0050 CP WITH (NOLOCK) ON CP.RKEY = SO.CUST_PART_PTR
            WHERE SO.STATUS < 3
        )
GROUP BY LTRIM(RTRIM(PP.CUSTOMER_PART_NUMBER)), sp.CUSTOMER_PTR, LTRIM(RTRIM(c.CUSTOMER_NAME))
HAVING  COUNT(*) > 1
ORDER BY DistinctNumbers DESC, SalesRows DESC;
