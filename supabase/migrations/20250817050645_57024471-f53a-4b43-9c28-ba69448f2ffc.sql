-- Update existing tables to link to user profiles
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to ensure users only see their own data
DROP POLICY IF EXISTS "Authenticated users can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Authenticated users can manage inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can manage sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create user-specific RLS policies
CREATE POLICY "Users can only see their own products" 
ON public.products FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only see their own categories" 
ON public.categories FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only see their own inventory" 
ON public.inventory FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only see their own sales" 
ON public.sales FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- For sale_items, check through the sale relationship
CREATE POLICY "Users can only see their own sale items" 
ON public.sale_items FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  )
);

-- For inventory_movements, check through the product relationship
CREATE POLICY "Users can only see their own inventory movements" 
ON public.inventory_movements FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = inventory_movements.product_id 
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = inventory_movements.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Update triggers to include user_id in inventory operations
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    INSERT INTO public.inventory_movements (
      product_id, 
      movement_type, 
      quantity, 
      reference_type, 
      reference_id,
      notes
    ) VALUES (
      NEW.product_id, 
      'OUT', 
      NEW.quantity, 
      'SALE', 
      NEW.sale_id,
      'Venta automática'
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;