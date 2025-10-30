-- Update RLS policies on products so staff can see owner products within same restaurant
-- 1) Drop conflicting restrictive policies
DROP POLICY IF EXISTS "Users can access products in their restaurant" ON public.products;
DROP POLICY IF EXISTS "Users can only see their own products" ON public.products;

-- Ensure RLS is enabled (noop if already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2) Create clear, scoped policies
-- Allow SELECT to any authenticated user in the same restaurant as the product owner
CREATE POLICY "Users can view products in their restaurant"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p_current
    JOIN public.profiles p_owner ON p_owner.id = public.products.user_id
    WHERE p_current.id = auth.uid()
      AND p_current.restaurant_id = p_owner.restaurant_id
  )
);

-- Allow inserts only for the current user (they create their own products)
CREATE POLICY "Users can insert their own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow updates only by the row owner
CREATE POLICY "Users can update their own products"
ON public.products
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow deletes only by the row owner
CREATE POLICY "Users can delete their own products"
ON public.products
FOR DELETE
TO authenticated
USING (user_id = auth.uid());