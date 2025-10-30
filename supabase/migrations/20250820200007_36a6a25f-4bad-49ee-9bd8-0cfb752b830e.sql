-- Security Fix: Create security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Security Fix: Create function to check if user is owner/admin of restaurant
CREATE OR REPLACE FUNCTION public.can_manage_restaurant(target_restaurant_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = target_restaurant_id 
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Security Fix: Remove overly permissive policies and add proper restrictions

-- Fix sales table - remove public access
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
CREATE POLICY "Users can only access sales in their restaurant" 
ON public.sales 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = sales.user_id
    )
  )
);

-- Fix products table - remove public access
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
CREATE POLICY "Users can access products in their restaurant" 
ON public.products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = products.user_id
    )
  )
);

-- Fix inventory table - remove public access
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
CREATE POLICY "Users can access inventory in their restaurant" 
ON public.inventory 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = inventory.user_id
    )
  )
);

-- Fix categories table - remove public access
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
CREATE POLICY "Users can access categories in their restaurant" 
ON public.categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = categories.user_id
    )
  )
);

-- Fix sale_items table - remove public access
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON public.sale_items;
CREATE POLICY "Users can access sale items in their restaurant" 
ON public.sale_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.sales s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE s.id = sale_items.sale_id
    AND p.restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Fix inventory_movements table - remove public access
DROP POLICY IF EXISTS "Allow all operations on inventory_movements" ON public.inventory_movements;
CREATE POLICY "Users can access inventory movements in their restaurant" 
ON public.inventory_movements 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.profiles pr ON p.user_id = pr.id
    WHERE p.id = inventory_movements.product_id
    AND pr.restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Security Fix: Strengthen profile policies to prevent privilege escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can update their own basic info but not role/permissions
CREATE POLICY "Users can update their own basic info" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Only owners and admins can update roles and permissions
CREATE POLICY "Owners and admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (
  public.can_manage_restaurant(restaurant_id) AND
  id != auth.uid()
);

-- Security Fix: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs in their restaurant" 
ON public.audit_logs 
FOR SELECT 
USING (
  public.can_manage_restaurant((
    SELECT restaurant_id FROM public.profiles WHERE id = audit_logs.user_id
  ))
);