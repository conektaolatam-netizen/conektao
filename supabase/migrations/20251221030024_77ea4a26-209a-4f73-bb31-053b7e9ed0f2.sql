-- Tabla para eventos sospechosos del POS (para auditorIA)
CREATE TABLE IF NOT EXISTS public.pos_suspicious_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    order_id UUID NULL,
    sale_id UUID NULL REFERENCES public.sales(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    user_role TEXT,
    table_number INTEGER,
    has_items BOOLEAN DEFAULT false,
    items_count INTEGER DEFAULT 0,
    order_total NUMERIC(12,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_pos_suspicious_events_restaurant ON public.pos_suspicious_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_pos_suspicious_events_type ON public.pos_suspicious_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pos_suspicious_events_user ON public.pos_suspicious_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_suspicious_events_date ON public.pos_suspicious_events(created_at);

-- Habilitar RLS
ALTER TABLE public.pos_suspicious_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Restaurant staff can insert suspicious events"
ON public.pos_suspicious_events
FOR INSERT
TO authenticated
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Owner and admin can view suspicious events"
ON public.pos_suspicious_events
FOR SELECT
TO authenticated
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Añadir columna kitchen_order_sent a table_states si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'table_states' 
        AND column_name = 'kitchen_order_sent'
    ) THEN
        ALTER TABLE public.table_states ADD COLUMN kitchen_order_sent BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE public.pos_suspicious_events IS 'Registro de eventos sospechosos en el POS para análisis de auditorIA';
COMMENT ON COLUMN public.pos_suspicious_events.event_type IS 'Tipo de evento: EXIT_ORDER_WITHOUT_SENDING_KITCHEN_ORDER, PAYMENT_ATTEMPT_WITHOUT_KITCHEN_ORDER, etc.';
