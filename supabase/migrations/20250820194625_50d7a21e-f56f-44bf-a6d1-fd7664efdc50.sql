
-- 1) Función segura para verificar si un usuario es owner o admin de un establecimiento
-- Nota: SECURITY DEFINER y search_path = public para evitar recursión y problemas de permisos.
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(p_user_id uuid, p_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner boolean := false;
  v_is_admin boolean := false;
BEGIN
  -- Owner: validamos contra la tabla restaurants (no consulta profiles)
  SELECT (r.owner_id = p_user_id)
    INTO v_is_owner
  FROM public.restaurants r
  WHERE r.id = p_restaurant_id;

  -- Admin/Owner vía profiles. Esta consulta corre con SECURITY DEFINER,
  -- por lo que no dispara recursión en políticas.
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    WHERE pr.id = p_user_id
      AND pr.restaurant_id = p_restaurant_id
      AND pr.role IN ('owner','admin')
  )
  INTO v_is_admin;

  RETURN COALESCE(v_is_owner, false) OR COALESCE(v_is_admin, false);
END;
$$;

-- Opcional: controlar permisos de ejecución (dependiendo de tu configuración)
REVOKE ALL ON FUNCTION public.is_owner_or_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner_or_admin(uuid, uuid) TO anon, authenticated;

-- 2) Rehacer políticas de profiles evitando recursión y desbloqueando creación del perfil del propietario

-- Eliminar políticas existentes para perfiles
DROP POLICY IF EXISTS "Only owners and admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON public.profiles;

-- Asegurar que RLS está habilitado (por claridad)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: ver tu propio perfil o, si eres owner/admin del establecimiento, ver perfiles de tu establecimiento
CREATE POLICY "Profiles - select own or by owner/admin"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_owner_or_admin(auth.uid(), restaurant_id)
  );

-- INSERT (1): El propietario puede crear SU PROPIO perfil para su establecimiento recién creado,
-- validando owner_id en restaurants (no depende de profiles, evita recursión)
CREATE POLICY "Profiles - owner can create own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND restaurant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

-- INSERT (2): Owners/Admins pueden crear perfiles de otros (empleados, etc.) dentro de su establecimiento
-- Requiere created_by = auth.uid() y validación vía función segura
CREATE POLICY "Profiles - owner/admin can create profiles in their restaurant"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_owner_or_admin(auth.uid(), restaurant_id)
  );

-- UPDATE (1): Cada usuario puede actualizar su propio perfil
CREATE POLICY "Profiles - user can update own"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- UPDATE (2): Owners/Admins pueden actualizar perfiles de su establecimiento
CREATE POLICY "Profiles - owner/admin can update in restaurant"
  ON public.profiles
  FOR UPDATE
  USING (public.is_owner_or_admin(auth.uid(), restaurant_id))
  WITH CHECK (public.is_owner_or_admin(auth.uid(), restaurant_id));
