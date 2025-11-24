-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'gramos',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC,
  user_id UUID REFERENCES auth.users(id),
  restaurant_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_ingredients relationship table (recipe components)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- Create ingredient_movements table for tracking
CREATE TABLE IF NOT EXISTS public.ingredient_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
  quantity NUMERIC NOT NULL,
  reference_type TEXT, -- 'PURCHASE', 'SALE', 'ADJUSTMENT'
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ingredients
CREATE POLICY "Users can access ingredients in their restaurant"
  ON public.ingredients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p_current
      JOIN public.profiles p_owner ON p_owner.id = ingredients.user_id
      WHERE p_current.id = auth.uid()
      AND p_current.restaurant_id = p_owner.restaurant_id
    )
  )
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for product_ingredients
CREATE POLICY "Users can access product ingredients in their restaurant"
  ON public.product_ingredients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.profiles pr ON p.user_id = pr.id
      WHERE p.id = product_ingredients.product_id
      AND pr.restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- RLS Policies for ingredient_movements
CREATE POLICY "Users can access ingredient movements in their restaurant"
  ON public.ingredient_movements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ingredients i
      JOIN public.profiles pr ON i.user_id = pr.id
      WHERE i.id = ingredient_movements.ingredient_id
      AND pr.restaurant_id = (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Function to check if product has enough ingredients
CREATE OR REPLACE FUNCTION public.check_product_ingredients_available(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ingredient_record RECORD;
BEGIN
  -- Check each ingredient requirement
  FOR ingredient_record IN 
    SELECT 
      pi.ingredient_id,
      pi.quantity_needed,
      i.current_stock,
      i.name as ingredient_name
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON i.id = pi.ingredient_id
    WHERE pi.product_id = p_product_id
  LOOP
    -- If any ingredient doesn't have enough stock, return false
    IF ingredient_record.current_stock < (ingredient_record.quantity_needed * p_quantity) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  -- All ingredients available
  RETURN TRUE;
END;
$$;

-- Function to deduct ingredients when sale is made
CREATE OR REPLACE FUNCTION public.deduct_ingredients_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ingredient_record RECORD;
BEGIN
  -- For each ingredient in the product
  FOR ingredient_record IN 
    SELECT 
      pi.ingredient_id,
      pi.quantity_needed,
      i.name as ingredient_name
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON i.id = pi.ingredient_id
    WHERE pi.product_id = NEW.product_id
  LOOP
    -- Deduct the ingredient stock
    UPDATE public.ingredients
    SET 
      current_stock = current_stock - (ingredient_record.quantity_needed * NEW.quantity),
      updated_at = NOW()
    WHERE id = ingredient_record.ingredient_id;
    
    -- Record the movement
    INSERT INTO public.ingredient_movements (
      ingredient_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes
    ) VALUES (
      ingredient_record.ingredient_id,
      'OUT',
      ingredient_record.quantity_needed * NEW.quantity,
      'SALE',
      NEW.sale_id,
      CONCAT('Venta - Producto: ', (SELECT name FROM products WHERE id = NEW.product_id))
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically deduct ingredients when sale_item is created
CREATE TRIGGER deduct_ingredients_after_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_ingredients_on_sale();

-- Update trigger for ingredients updated_at
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON public.product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON public.product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_movements_ingredient ON public.ingredient_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON public.ingredients(restaurant_id);