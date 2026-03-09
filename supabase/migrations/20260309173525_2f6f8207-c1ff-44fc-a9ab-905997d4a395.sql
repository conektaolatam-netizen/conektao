ALTER TABLE public.system_overrides
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS category_name text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);