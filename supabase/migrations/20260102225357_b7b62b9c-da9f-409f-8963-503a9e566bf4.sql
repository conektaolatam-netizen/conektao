-- =====================================================
-- PHASE 3B: LINK ENVAGAS USER + CREATE ROLE
-- =====================================================

-- 1. Link envagas user profile to GAS tenant
UPDATE public.profiles 
SET restaurant_id = 'e7a93c00-0000-4000-a000-000000000001'
WHERE id = 'fa248d70-61c9-4b57-a9f1-ffdae00ed50d';

-- 2. Set correct owner_id on Envagas restaurant
UPDATE public.restaurants 
SET owner_id = 'fa248d70-61c9-4b57-a9f1-ffdae00ed50d'
WHERE id = 'e7a93c00-0000-4000-a000-000000000001';

-- 3. Create gerencia_gas role for the user
INSERT INTO public.user_roles (user_id, restaurant_id, role, is_active)
VALUES (
  'fa248d70-61c9-4b57-a9f1-ffdae00ed50d',
  'e7a93c00-0000-4000-a000-000000000001',
  'gerencia_gas',
  true
) ON CONFLICT (user_id, restaurant_id, role) DO NOTHING;

-- 4. Create helper function to check GAS roles
CREATE OR REPLACE FUNCTION public.has_gas_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;