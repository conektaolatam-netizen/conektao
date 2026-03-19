-- 1. Keep only the row with the highest setup_step per restaurant_id (tie-break by latest created_at)
DELETE FROM public.whatsapp_configs
WHERE id NOT IN (
  SELECT DISTINCT ON (restaurant_id) id
  FROM public.whatsapp_configs
  ORDER BY restaurant_id, setup_step DESC NULLS LAST, created_at DESC
);

-- 2. Add unique constraint to prevent future duplicates
ALTER TABLE public.whatsapp_configs
ADD CONSTRAINT whatsapp_configs_restaurant_id_unique UNIQUE (restaurant_id);