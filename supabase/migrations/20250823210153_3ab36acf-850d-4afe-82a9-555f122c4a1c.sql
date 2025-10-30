-- Update RLS policies to allow sharing data within the same restaurant

-- Drop existing restrictive policies for products
DROP POLICY IF EXISTS "Users can view products in their restaurant" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;

-- Create new policies that allow restaurant-wide access
CREATE POLICY "Users can view products in their restaurant" 
ON public.products 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p_current
  JOIN profiles p_owner ON p_owner.id = products.user_id
  WHERE p_current.id = auth.uid() 
  AND p_current.restaurant_id = p_owner.restaurant_id
));

CREATE POLICY "Users can insert products in their restaurant" 
ON public.products 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update products in their restaurant" 
ON public.products 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles p_current
  JOIN profiles p_owner ON p_owner.id = products.user_id
  WHERE p_current.id = auth.uid() 
  AND p_current.restaurant_id = p_owner.restaurant_id
));

CREATE POLICY "Users can delete products in their restaurant" 
ON public.products 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles p_current
  JOIN profiles p_owner ON p_owner.id = products.user_id
  WHERE p_current.id = auth.uid() 
  AND p_current.restaurant_id = p_owner.restaurant_id
));

-- Update inventory policies to match
DROP POLICY IF EXISTS "Users can only see their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can access inventory in their restaurant" ON public.inventory;

CREATE POLICY "Users can access inventory in their restaurant" 
ON public.inventory 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p_current
  JOIN profiles p_owner ON p_owner.id = inventory.user_id
  WHERE p_current.id = auth.uid() 
  AND p_current.restaurant_id = p_owner.restaurant_id
))
WITH CHECK (user_id = auth.uid());

-- Update inventory movements policies
DROP POLICY IF EXISTS "Users can only see their own inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Users can access inventory movements in their restaurant" ON public.inventory_movements;

CREATE POLICY "Users can access inventory movements in their restaurant" 
ON public.inventory_movements 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM products p
  JOIN profiles pr ON p.user_id = pr.id
  JOIN profiles p_current ON p_current.restaurant_id = pr.restaurant_id
  WHERE p.id = inventory_movements.product_id 
  AND p_current.id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM products p
  JOIN profiles pr ON p.user_id = pr.id
  JOIN profiles p_current ON p_current.restaurant_id = pr.restaurant_id
  WHERE p.id = inventory_movements.product_id 
  AND p_current.id = auth.uid()
));

-- Update sales policies to share within restaurant
DROP POLICY IF EXISTS "Users can view sales in their restaurant" ON public.sales;

CREATE POLICY "Users can view sales in their restaurant" 
ON public.sales 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p_current
  JOIN profiles p_owner ON p_owner.id = sales.user_id
  WHERE p_current.id = auth.uid() 
  AND p_current.restaurant_id = p_owner.restaurant_id
));

-- Update cash registers to be shared within restaurant
DROP POLICY IF EXISTS "Users can view cash registers in their restaurant" ON public.cash_registers;

CREATE POLICY "Users can view cash registers in their restaurant" 
ON public.cash_registers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.restaurant_id = cash_registers.restaurant_id
));

CREATE POLICY "Users can update cash registers in their restaurant" 
ON public.cash_registers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.restaurant_id = cash_registers.restaurant_id
));