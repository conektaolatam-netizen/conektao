-- Drop all existing permissive RLS policies
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow all operations on inventory_movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;

-- Create secure RLS policies for business-critical data (authenticated users only)
CREATE POLICY "Authenticated users can manage inventory" 
ON public.inventory FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory movements" 
ON public.inventory_movements FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sale items" 
ON public.sale_items FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage sales" 
ON public.sales FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Keep categories and products publicly readable for menu display
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage categories" 
ON public.categories FOR INSERT, UPDATE, DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage products" 
ON public.products FOR INSERT, UPDATE, DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);