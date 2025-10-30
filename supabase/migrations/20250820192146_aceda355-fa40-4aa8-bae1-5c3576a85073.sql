-- Fix recursive RLS policy on profiles table
DROP POLICY IF EXISTS "Only owners and admins can create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON profiles;

-- Create a security definer function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(user_id uuid, target_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND restaurant_id = target_restaurant_id 
    AND role IN ('owner', 'admin')
  );
$$;

-- Recreate policies without recursion
CREATE POLICY "Users can view profiles in their restaurant" 
ON profiles 
FOR SELECT 
USING (
  id = auth.uid() OR 
  restaurant_id IN (
    SELECT restaurant_id 
    FROM profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Only owners and admins can create profiles" 
ON profiles 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND 
  public.is_owner_or_admin(auth.uid(), restaurant_id)
);