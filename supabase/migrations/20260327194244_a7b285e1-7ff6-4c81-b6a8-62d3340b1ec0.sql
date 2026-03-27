
-- Tabla principal de combos
CREATE TABLE public.product_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  calculated_price NUMERIC NOT NULL DEFAULT 0,
  override_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ítems que componen cada combo
CREATE TABLE public.product_combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.product_combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fraction NUMERIC NOT NULL DEFAULT 1,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_combo_items_combo ON public.product_combo_items(combo_id);
CREATE INDEX idx_combo_items_product ON public.product_combo_items(product_id);
CREATE INDEX idx_combos_restaurant ON public.product_combos(restaurant_id);

-- RLS
ALTER TABLE public.product_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read combos" ON public.product_combos
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Owner/admin manage combos" ON public.product_combos
  FOR ALL TO authenticated
  USING (public.can_manage_restaurant(restaurant_id))
  WITH CHECK (public.can_manage_restaurant(restaurant_id));

CREATE POLICY "Authenticated read combo items" ON public.product_combo_items
  FOR SELECT TO authenticated
  USING (combo_id IN (SELECT id FROM public.product_combos WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )));

CREATE POLICY "Owner/admin manage combo items" ON public.product_combo_items
  FOR ALL TO authenticated
  USING (combo_id IN (SELECT id FROM public.product_combos WHERE public.can_manage_restaurant(restaurant_id)))
  WITH CHECK (combo_id IN (SELECT id FROM public.product_combos WHERE public.can_manage_restaurant(restaurant_id)));

-- Función para recalcular el precio de un combo
CREATE OR REPLACE FUNCTION public.recalculate_combo_price(p_combo_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(p.price * ci.fraction * ci.quantity), 0)
  INTO v_total
  FROM product_combo_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.combo_id = p_combo_id;

  UPDATE product_combos SET calculated_price = v_total, updated_at = now()
  WHERE id = p_combo_id;

  RETURN v_total;
END;
$$;

-- Trigger: cuando cambia el precio de un producto, recalcular todos sus combos
CREATE OR REPLACE FUNCTION public.recalculate_combos_on_product_price_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    PERFORM recalculate_combo_price(ci.combo_id)
    FROM product_combo_items ci
    WHERE ci.product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_combos_on_product_price
AFTER UPDATE OF price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.recalculate_combos_on_product_price_change();

-- Trigger: recalcular al insertar/eliminar combo items
CREATE OR REPLACE FUNCTION public.recalculate_combo_on_item_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_combo_price(OLD.combo_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_combo_price(NEW.combo_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_recalc_combo_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.product_combo_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_combo_on_item_change();

-- Función de precio efectivo
CREATE OR REPLACE FUNCTION public.combo_effective_price(p_combo_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(override_price, calculated_price)
  FROM product_combos WHERE id = p_combo_id;
$$;
