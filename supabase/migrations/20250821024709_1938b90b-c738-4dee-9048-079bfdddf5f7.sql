-- Create toppings table
CREATE TABLE public.toppings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_toppings junction table
CREATE TABLE public.product_toppings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  topping_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, topping_id)
);

-- Create sale_item_toppings for tracking toppings in sales
CREATE TABLE public.sale_item_toppings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_item_id UUID NOT NULL,
  topping_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_item_toppings ENABLE ROW LEVEL SECURITY;

-- RLS policies for toppings
CREATE POLICY "Users can only see their own toppings" 
ON public.toppings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can access toppings in their restaurant" 
ON public.toppings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.restaurant_id = toppings.restaurant_id
));

-- RLS policies for product_toppings
CREATE POLICY "Users can manage product toppings" 
ON public.product_toppings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM products 
  WHERE products.id = product_toppings.product_id 
  AND products.user_id = auth.uid()
));

CREATE POLICY "Users can access product toppings in their restaurant" 
ON public.product_toppings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM products p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.id = product_toppings.product_id 
  AND pr.restaurant_id = (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
));

-- RLS policies for sale_item_toppings
CREATE POLICY "Users can manage sale item toppings" 
ON public.sale_item_toppings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  WHERE si.id = sale_item_toppings.sale_item_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Users can access sale item toppings in their restaurant" 
ON public.sale_item_toppings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  JOIN profiles p ON s.user_id = p.id
  WHERE si.id = sale_item_toppings.sale_item_id 
  AND p.restaurant_id = (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
));

-- Add update triggers
CREATE TRIGGER update_toppings_updated_at
  BEFORE UPDATE ON public.toppings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create inventory entries for toppings when they are created
CREATE OR REPLACE FUNCTION public.create_topping_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Create inventory entry for the topping
  INSERT INTO public.inventory (
    product_id,
    current_stock,
    min_stock,
    user_id,
    unit
  ) VALUES (
    NEW.id, -- Use topping ID as product_id for inventory tracking
    0, -- Start with 0 stock
    0, -- Min stock 0
    NEW.user_id,
    'unidades'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_topping_inventory_trigger
  AFTER INSERT ON public.toppings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_topping_inventory();