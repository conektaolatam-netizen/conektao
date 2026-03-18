-- Step 1: Add a temporary jsonb column
ALTER TABLE whatsapp_configs ADD COLUMN promoted_products_new jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate data from text[] to jsonb
UPDATE whatsapp_configs 
SET promoted_products_new = CASE
  WHEN promoted_products IS NULL OR array_length(promoted_products, 1) IS NULL THEN '[]'::jsonb
  ELSE (
    SELECT jsonb_agg(elem::jsonb)
    FROM unnest(promoted_products) AS elem
  )
END;

-- Step 3: Drop old column and rename new one
ALTER TABLE whatsapp_configs DROP COLUMN promoted_products;
ALTER TABLE whatsapp_configs RENAME COLUMN promoted_products_new TO promoted_products;