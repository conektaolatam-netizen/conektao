-- Drop and recreate RLS policies for receipts bucket
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'receipts' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create table to store product-ingredient associations learned from receipts
CREATE TABLE IF NOT EXISTS public.ingredient_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  confidence_level INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by_ai BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(user_id, product_name, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.ingredient_product_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mappings"
ON public.ingredient_product_mappings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings"
ON public.ingredient_product_mappings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings"
ON public.ingredient_product_mappings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings"
ON public.ingredient_product_mappings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_product_mappings_user_product 
ON public.ingredient_product_mappings(user_id, product_name);

CREATE INDEX IF NOT EXISTS idx_ingredient_product_mappings_restaurant 
ON public.ingredient_product_mappings(restaurant_id);