-- ================================================================
-- MIGRACIÓN: Sistema Robusto de Facturas IA con Auditoría
-- ================================================================

-- 1. Agregar tipo de inventario a ingredients (receta vs suministro)
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS inventory_type TEXT DEFAULT 'ingrediente_receta' 
  CHECK (inventory_type IN ('ingrediente_receta', 'suministro_operativo', 'activo_menor'));

-- 2. Tabla de eventos de auditoría para facturas IA
CREATE TABLE IF NOT EXISTS public.receipt_audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  
  -- Tipo de evento
  event_type TEXT NOT NULL CHECK (event_type IN (
    'name_changed_from_ai',
    'quantity_changed_significant', 
    'unit_changed_magnitude',
    'items_not_mapped_pattern',
    'manual_fallback_used',
    'low_confidence_accepted',
    'payment_method_unusual'
  )),
  
  -- Severidad
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Detalles del evento
  item_original_name TEXT,
  item_modified_name TEXT,
  original_value JSONB,
  modified_value JSONB,
  confidence_score INTEGER,
  change_percentage NUMERIC,
  
  -- Evidencia
  receipt_url TEXT,
  notes TEXT,
  
  -- Metadatos
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_receipt_audit_events_restaurant ON public.receipt_audit_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_receipt_audit_events_severity ON public.receipt_audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_receipt_audit_events_created ON public.receipt_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_audit_events_not_reviewed ON public.receipt_audit_events(is_reviewed) WHERE is_reviewed = FALSE;

-- 4. Tabla para documentos manuales cuando IA falla
CREATE TABLE IF NOT EXISTS public.manual_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Datos del documento
  supplier_name TEXT,
  document_date DATE DEFAULT CURRENT_DATE,
  total_amount NUMERIC,
  
  -- Items en formato JSON
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  
  -- Evidencia
  receipt_url TEXT,
  notes TEXT,
  
  -- Razón del fallback
  fallback_reason TEXT CHECK (fallback_reason IN ('low_confidence', 'handwritten', 'user_requested', 'ai_error')),
  
  -- Pago
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_details JSONB,
  
  -- Metadatos
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. RLS para receipt_audit_events
ALTER TABLE public.receipt_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit events from their restaurant"
ON public.receipt_audit_events
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create audit events for their restaurant"
ON public.receipt_audit_events
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 6. RLS para manual_receipts
ALTER TABLE public.manual_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manual receipts from their restaurant"
ON public.manual_receipts
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create manual receipts for their restaurant"
ON public.manual_receipts
FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update manual receipts from their restaurant"
ON public.manual_receipts
FOR UPDATE
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 7. Trigger para updated_at en manual_receipts
CREATE OR REPLACE FUNCTION public.update_manual_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_manual_receipts_updated_at ON public.manual_receipts;
CREATE TRIGGER update_manual_receipts_updated_at
BEFORE UPDATE ON public.manual_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_manual_receipts_updated_at();