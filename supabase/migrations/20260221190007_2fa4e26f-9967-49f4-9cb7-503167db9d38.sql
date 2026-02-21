INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  restaurant_id,
  is_active,
  permissions,
  account_type,
  created_at,
  updated_at
) VALUES (
  '725cb6a5-72dc-4216-9b67-5b173abea49c',
  'labarracreatupizza@gmail.com',
  'La Barra Crea Tu Pizza El Vergel',
  'owner',
  '899cb7a7-7de1-47c7-a684-f24658309755',
  true,
  '{"all_modules": true, "manage_sales": true, "view_reports": true, "manage_employees": true, "manage_inventory": true}'::jsonb,
  'restaurant',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;