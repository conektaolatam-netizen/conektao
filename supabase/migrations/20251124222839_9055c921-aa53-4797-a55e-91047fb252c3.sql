-- FASE 1: REESTRUCTURACIÓN DE LA BASE DE DATOS
-- 1.1. Agregar campo is_compound a la tabla ingredients
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS is_compound BOOLEAN DEFAULT FALSE;

-- 1.2. Crear tabla ingredient_recipes para ingredientes compuestos
CREATE TABLE IF NOT EXISTS public.ingredient_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compound_ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  base_ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL,
  yield_amount NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'gramos',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 1.3. Crear tabla internal_productions para tracking de producción
CREATE TABLE IF NOT EXISTS public.internal_productions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  compound_ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_produced NUMERIC NOT NULL,
  production_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.ingredient_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_productions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ingredient_recipes
CREATE POLICY "Users can access recipes in their restaurant"
ON public.ingredient_recipes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.ingredients i
    JOIN public.profiles pr ON i.user_id = pr.id
    WHERE i.id = ingredient_recipes.compound_ingredient_id
    AND pr.restaurant_id = (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Políticas RLS para internal_productions
CREATE POLICY "Users can manage productions in their restaurant"
ON public.internal_productions
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid() 
  AND restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ingredient_recipes_compound ON public.ingredient_recipes(compound_ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_recipes_base ON public.ingredient_recipes(base_ingredient_id);
CREATE INDEX IF NOT EXISTS idx_internal_productions_compound ON public.internal_productions(compound_ingredient_id);
CREATE INDEX IF NOT EXISTS idx_internal_productions_restaurant ON public.internal_productions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_internal_productions_date ON public.internal_productions(production_date);

-- Trigger para actualizar updated_at en ingredient_recipes
CREATE TRIGGER update_ingredient_recipes_updated_at
BEFORE UPDATE ON public.ingredient_recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en internal_productions
CREATE TRIGGER update_internal_productions_updated_at
BEFORE UPDATE ON public.internal_productions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.ingredient_recipes IS 'Almacena las recetas internas de ingredientes compuestos (ej: piña melada hecha con piña + azúcar + canela)';
COMMENT ON TABLE public.internal_productions IS 'Registra la producción interna de ingredientes compuestos';
COMMENT ON COLUMN public.ingredients.is_compound IS 'Indica si el ingrediente es compuesto (producido internamente) o simple (comprado)';
COMMENT ON COLUMN public.ingredient_recipes.yield_amount IS 'Cantidad total que produce esta receta (ej: 3kg de piña melada)';
COMMENT ON COLUMN public.ingredient_recipes.quantity_needed IS 'Cantidad del ingrediente base necesaria para producir el yield_amount';