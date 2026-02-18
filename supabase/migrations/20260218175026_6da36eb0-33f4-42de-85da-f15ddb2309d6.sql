
-- ============================================================
-- wa_customer_profiles: memoria persistente de clientes WhatsApp
-- Solo accesible via service_role (edge function). Sin RLS permisivas.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wa_customer_profiles (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   uuid        NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone           text        NOT NULL,
  name            text,
  addresses       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- Estructura de cada dirección:
  -- { "address": "...", "label": null|"Casa"|"Mamá", "last_used_at": "ISO8601" }
  last_order_at   timestamptz,
  total_orders    integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, phone)
);

-- RLS habilitado — sin políticas para usuarios normales → solo service_role puede operar
ALTER TABLE public.wa_customer_profiles ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.update_wa_customer_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wa_customer_profiles_updated_at
  BEFORE UPDATE ON public.wa_customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wa_customer_profiles_updated_at();

-- Índice para búsqueda rápida por phone dentro de un restaurante
CREATE INDEX IF NOT EXISTS idx_wa_customer_profiles_restaurant_phone
  ON public.wa_customer_profiles (restaurant_id, phone);
