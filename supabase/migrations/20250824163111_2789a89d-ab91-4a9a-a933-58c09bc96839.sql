-- Add idempotency key to prevent duplicate sales inserts
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Ensure uniqueness when provided (allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS sales_idempotency_key_unique
ON public.sales (idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- Clean up today's duplicate sales by keeping the first per near-identical group
-- Also remove related sale_items for the duplicated sales to avoid orphan rows
WITH dups AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(table_number, -1), total_amount, lower(payment_method), date_trunc('second', created_at)
      ORDER BY id
    ) AS rn
  FROM public.sales
  WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'
), to_delete AS (
  SELECT id FROM dups WHERE rn > 1
)
DELETE FROM public.sale_items si
USING to_delete td
WHERE si.sale_id = td.id;

WITH dups AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(table_number, -1), total_amount, lower(payment_method), date_trunc('second', created_at)
      ORDER BY id
    ) AS rn
  FROM public.sales
  WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'
)
DELETE FROM public.sales s
USING dups d
WHERE s.id = d.id AND d.rn > 1;