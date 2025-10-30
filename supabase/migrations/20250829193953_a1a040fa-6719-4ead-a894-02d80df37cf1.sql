-- Ensure robust persistence of POS table states and automatic seeding/reset

-- 1) Helper to seed default table states for a restaurant
CREATE OR REPLACE FUNCTION public.seed_table_states(p_restaurant_id uuid, p_count int DEFAULT 24)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.table_states (restaurant_id, table_number, status, guest_count, current_order, order_total)
  SELECT p_restaurant_id, gs, 'libre', 0, '[]'::jsonb, 0
  FROM generate_series(1, p_count) gs
  ON CONFLICT (restaurant_id, table_number) DO NOTHING;
END;
$$;

-- 2) Trigger to seed tables when a restaurant is created
CREATE OR REPLACE FUNCTION public.seed_table_states_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_table_states(NEW.id, 24);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_tables_on_restaurant ON public.restaurants;
CREATE TRIGGER seed_tables_on_restaurant
AFTER INSERT ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.seed_table_states_trigger();

-- 3) Backfill: ensure all existing restaurants have table states
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.restaurants LOOP
    PERFORM public.seed_table_states(r.id, 24);
  END LOOP;
END $$;

-- 4) After a sale is completed for a table, free the table and clear its order
CREATE OR REPLACE FUNCTION public.reset_table_on_sale_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Free only when sale is effectively closed
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

DROP TRIGGER IF EXISTS free_table_after_sale ON public.sales;
CREATE TRIGGER free_table_after_sale
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.reset_table_on_sale_trigger();

-- 5) Safety: keep realtime + unique index (fix syntax)
ALTER TABLE public.table_states REPLICA IDENTITY FULL;

-- Check if table is already in publication before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'table_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.table_states;
  END IF;
END $$;