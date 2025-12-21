-- 1. CREAR TABLA tip_adjustments para trazabilidad y métricas de IA
CREATE TABLE IF NOT EXISTS public.tip_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  default_tip_percent NUMERIC NOT NULL DEFAULT 0,
  suggested_tip_amount NUMERIC NOT NULL DEFAULT 0,
  previous_tip_amount NUMERIC NOT NULL DEFAULT 0,
  new_tip_amount NUMERIC NOT NULL DEFAULT 0,
  final_tip_percent NUMERIC NOT NULL DEFAULT 0,
  reason_type TEXT NOT NULL CHECK (reason_type IN ('NO_TIP', 'LOWER_TIP', 'HIGHER_TIP', 'DISCOUNT', 'SERVICE_ISSUE', 'ERROR', 'OTHER')),
  reason_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_tip_adjustments_restaurant ON public.tip_adjustments(restaurant_id);
CREATE INDEX idx_tip_adjustments_sale ON public.tip_adjustments(sale_id);
CREATE INDEX idx_tip_adjustments_waiter ON public.tip_adjustments(waiter_id);
CREATE INDEX idx_tip_adjustments_created ON public.tip_adjustments(created_at);
CREATE INDEX idx_tip_adjustments_reason ON public.tip_adjustments(reason_type);

-- Habilitar RLS
ALTER TABLE public.tip_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view tip adjustments in their restaurant"
ON public.tip_adjustments
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create tip adjustments in their restaurant"
ON public.tip_adjustments
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  )
);

-- 2. AGREGAR CAMPOS FALTANTES A restaurants (si no existen)
DO $$
BEGIN
  -- allow_tip_edit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'allow_tip_edit'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN allow_tip_edit BOOLEAN DEFAULT true;
  END IF;

  -- require_reason_if_decrease
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'require_reason_if_decrease'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN require_reason_if_decrease BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 3. COMENTARIO: El bug de subscription_settings se arreglará en el código usando onConflict en el upsert