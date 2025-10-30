-- Fix security warnings: Set proper search path for functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_restaurant(target_restaurant_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND restaurant_id = target_restaurant_id 
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;