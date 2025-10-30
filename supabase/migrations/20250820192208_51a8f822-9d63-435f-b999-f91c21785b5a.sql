-- Fix the function search path warning
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(user_id uuid, target_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND restaurant_id = target_restaurant_id 
    AND role IN ('owner', 'admin')
  );
$$;