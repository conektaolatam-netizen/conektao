-- Add missing cost_price to products so AI cost updates and creator can save it
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric;

-- Optional: keep updated_at consistent when product changes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;