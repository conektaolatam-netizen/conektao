-- Crear perfiles para usuarios que no los tienen
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_active,
  permissions,
  created_at,
  updated_at
)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'full_name', split_part(auth.users.email, '@', 1), 'Usuario'),
  'employee'::user_role,
  true,
  '{}'::jsonb,
  now(),
  now()
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.id
WHERE profiles.id IS NULL
ON CONFLICT (id) DO NOTHING;