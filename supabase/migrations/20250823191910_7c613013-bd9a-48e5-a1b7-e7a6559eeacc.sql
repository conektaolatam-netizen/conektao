-- 🔧 FIX: Corregir RLS policies para que empleados vean productos del mismo restaurante

-- Primero, verificar la política actual de productos
DROP POLICY IF EXISTS "Users can view products in their restaurant" ON public.products;

-- Crear nueva política más clara para productos
CREATE POLICY "Users can view products in their restaurant" 
ON public.products 
FOR SELECT 
USING (
  -- El usuario puede ver productos si está en el mismo restaurante que el creador del producto
  EXISTS (
    SELECT 1 
    FROM public.profiles p_current
    JOIN public.profiles p_owner ON (p_owner.id = products.user_id)
    WHERE p_current.id = auth.uid() 
    AND p_current.restaurant_id = p_owner.restaurant_id
  )
);

-- También corregir la política de categorías para incluir JOIN de restaurantes
DROP POLICY IF EXISTS "Users can access categories in their restaurant" ON public.categories;

CREATE POLICY "Users can access categories in their restaurant" 
ON public.categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p_current
    JOIN public.profiles p_owner ON (p_owner.id = categories.user_id)
    WHERE p_current.id = auth.uid() 
    AND p_current.restaurant_id = p_owner.restaurant_id
  )
);

-- Mejorar política de inventario para empleados del mismo restaurante
DROP POLICY IF EXISTS "Users can access inventory in their restaurant" ON public.inventory;

CREATE POLICY "Users can access inventory in their restaurant" 
ON public.inventory 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p_current
    JOIN public.profiles p_owner ON (p_owner.id = inventory.user_id)
    WHERE p_current.id = auth.uid() 
    AND p_current.restaurant_id = p_owner.restaurant_id
  )
);