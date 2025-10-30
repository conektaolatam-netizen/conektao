-- Harden functions: set stable search_path for security
CREATE OR REPLACE FUNCTION public.seed_table_states(p_restaurant_id uuid, p_count int DEFAULT 24)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.table_states (restaurant_id, table_number, status, guest_count, current_order, order_total)
  SELECT p_restaurant_id, gs, 'libre', 0, '[]'::jsonb, 0
  FROM generate_series(1, p_count) gs
  ON CONFLICT (restaurant_id, table_number) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_table_states_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.seed_table_states(NEW.id, 24);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_table_on_sale_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rest_id uuid;
BEGIN
  IF NEW.table_number IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT restaurant_id INTO rest_id FROM public.profiles WHERE id = NEW.user_id;
  IF rest_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('completed','paid','closed') THEN
    UPDATE public.table_states
    SET status = 'libre',
        guest_count = 0,
        current_order = '[]'::jsonb,
        order_total = 0,
        updated_at = NOW()
    WHERE restaurant_id = rest_id AND table_number = NEW.table_number;
  END IF;

  RETURN NEW;
END;
$$;