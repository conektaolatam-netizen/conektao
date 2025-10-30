BEGIN;

-- Fix recursive SELECT policy on profiles by using a SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON public.profiles;

CREATE POLICY "Users can view profiles in their restaurant"
ON public.profiles
FOR SELECT
USING (
  (id = auth.uid()) OR public.is_owner_or_admin(auth.uid(), restaurant_id)
);

COMMIT;