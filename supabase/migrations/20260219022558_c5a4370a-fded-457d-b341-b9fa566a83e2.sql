
-- Agregar campo requires_packaging a products con default seguro
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS requires_packaging boolean NOT NULL DEFAULT false;

-- Marcar bebidas PREPARADAS por La Barra como requires_packaging = true
-- (limonadas, sodificadas, cócteles, sangrías, tinto de verano)
UPDATE public.products
SET requires_packaging = true
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755'
)
AND is_active = true
AND (
  name ILIKE '%limonada%' OR
  name ILIKE '%sodificada%' OR
  name ILIKE '%aperol%' OR
  name ILIKE '%mojito%' OR
  name ILIKE '%sangria%' OR
  name ILIKE '%sangrĺa%' OR
  name ILIKE '%tinto de verano%' OR
  name ILIKE '%cóctel%' OR
  name ILIKE '%coctel%'
);

-- Asegurar que bebidas embotelladas/enlatadas NO requieren empaque (ya está en false por default)
-- pero lo dejamos explícito para bebidas conocidas
UPDATE public.products
SET requires_packaging = false
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755'
)
AND (
  name ILIKE '%gaseosa%' OR
  name ILIKE '%coca-cola%' OR
  name ILIKE '%agua%' OR
  name ILIKE '%corona%' OR
  name ILIKE '%stella%' OR
  name ILIKE '%cerveza%' OR
  name ILIKE '%vino%' OR
  name ILIKE '%pellegrino%' OR
  name ILIKE '%artesanal%'
);
