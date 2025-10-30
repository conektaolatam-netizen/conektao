-- Helper function to avoid RLS joins and allow employees to see products from their restaurant
CREATE OR REPLACE FUNCTION public.user_restaurant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT restaurant_id FROM public.profiles WHERE id = _user_id;
$$;

-- Replace SELECT policy on products to use the helper function instead of joins
DROP POLICY IF EXISTS "Users can view products in their restaurant" ON public.products;

CREATE POLICY "Users can view products in their restaurant"
ON public.products
FOR SELECT
USING (
  public.user_restaurant_id(auth.uid()) IS NOT NULL
  AND public.user_restaurant_id(auth.uid()) = public.user_restaurant_id(user_id)
);
