-- Fix critical security vulnerability: Profiles table publicly readable
-- This ensures only authenticated users can access profile data

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON public.profiles;

-- Create secure policies that require authentication
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Owners and admins can view profiles in their restaurant" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id != auth.uid() 
  AND is_owner_or_admin(auth.uid(), restaurant_id)
);

-- Also fix other critical security issues found in the scan

-- Fix sales table - only allow authenticated users to see sales in their restaurant
DROP POLICY IF EXISTS "Users can view sales in their restaurant" ON public.sales;

CREATE POLICY "Users can view sales in their restaurant" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.restaurant_id = ( 
      SELECT profiles_1.restaurant_id
      FROM profiles profiles_1
      WHERE profiles_1.id = sales.user_id
    )
  )) OR (user_id = auth.uid())
);

-- Fix restaurants table - only allow authenticated users associated with the restaurant
DROP POLICY IF EXISTS "Users can view their own restaurant" ON public.restaurants;

CREATE POLICY "Users can view their own restaurant" 
ON public.restaurants 
FOR SELECT 
TO authenticated
USING (
  (owner_id = auth.uid()) OR (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.restaurant_id = restaurants.id
  ))
);

-- Fix restaurant_invitations table - only allow authenticated users in the restaurant
DROP POLICY IF EXISTS "Users can view invitations in their restaurant" ON public.restaurant_invitations;

CREATE POLICY "Users can view invitations in their restaurant" 
ON public.restaurant_invitations 
FOR SELECT 
TO authenticated
USING (
  restaurant_id IN ( 
    SELECT profiles.restaurant_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Fix suppliers table - only allow authenticated users in the restaurant
DROP POLICY IF EXISTS "Users can access suppliers in their restaurant" ON public.suppliers;

CREATE POLICY "Users can access suppliers in their restaurant" 
ON public.suppliers 
FOR ALL
TO authenticated
USING (
  (restaurant_id IS NULL) OR (restaurant_id IN ( 
    SELECT profiles.restaurant_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ))
);