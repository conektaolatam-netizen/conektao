
-- =============================================
-- PASO 1: Enriquecer tabla restaurants
-- =============================================
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- =============================================
-- PASO 2: Agregar restaurant_id a 6 tablas críticas
-- =============================================

-- products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id);

-- =============================================
-- PASO 3: Migrar datos históricos (user_id -> restaurant_id via profiles)
-- =============================================

UPDATE public.products SET restaurant_id = (
  SELECT restaurant_id FROM public.profiles WHERE profiles.id = products.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

UPDATE public.categories SET restaurant_id = (
  SELECT restaurant_id FROM public.profiles WHERE profiles.id = categories.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

UPDATE public.inventory SET restaurant_id = (
  SELECT restaurant_id FROM public.profiles WHERE profiles.id = inventory.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

UPDATE public.sales SET restaurant_id = (
  SELECT restaurant_id FROM public.profiles WHERE profiles.id = sales.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

UPDATE public.notifications SET restaurant_id = (
  SELECT restaurant_id FROM public.profiles WHERE profiles.id = notifications.user_id
) WHERE restaurant_id IS NULL AND user_id IS NOT NULL;

-- =============================================
-- PASO 4: Índices de performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant ON public.inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_restaurant ON public.sales(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON public.notifications(restaurant_id);

-- =============================================
-- PASO 5: Índice único para mapeo WhatsApp -> negocio
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_configs_phone 
  ON public.whatsapp_configs(whatsapp_phone_number_id);

-- =============================================
-- PASO 6: Sincronizar datos de La Barra
-- =============================================

UPDATE public.restaurants
SET whatsapp_number = (
  SELECT wc.whatsapp_phone_number_id FROM public.whatsapp_configs wc WHERE wc.restaurant_id = restaurants.id LIMIT 1
),
contact_email = (
  SELECT wc.order_email FROM public.whatsapp_configs wc WHERE wc.restaurant_id = restaurants.id LIMIT 1
),
is_active = true
WHERE EXISTS (SELECT 1 FROM public.whatsapp_configs wc WHERE wc.restaurant_id = restaurants.id);
