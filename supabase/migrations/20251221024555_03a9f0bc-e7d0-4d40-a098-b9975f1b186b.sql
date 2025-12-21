-- Tabla para historial de eventos de cocina (cambios de estado, anulaciones)
CREATE TABLE IF NOT EXISTS kitchen_order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  kitchen_order_id UUID NOT NULL REFERENCES kitchen_orders(id) ON DELETE CASCADE,
  order_id UUID,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_user_id UUID,
  changed_by_name TEXT,
  reason_type TEXT,
  reason_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_kitchen_order_events_restaurant_id ON kitchen_order_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_events_kitchen_order_id ON kitchen_order_events(kitchen_order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_events_created_at ON kitchen_order_events(created_at DESC);

-- Añadir columna waiter_id a kitchen_orders si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_orders' AND column_name = 'waiter_id') THEN
    ALTER TABLE kitchen_orders ADD COLUMN waiter_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_orders' AND column_name = 'cancelled_at') THEN
    ALTER TABLE kitchen_orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_orders' AND column_name = 'cancelled_by') THEN
    ALTER TABLE kitchen_orders ADD COLUMN cancelled_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kitchen_orders' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE kitchen_orders ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE kitchen_order_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kitchen_order_events
CREATE POLICY "Users can view kitchen order events from their restaurant" 
ON kitchen_order_events 
FOR SELECT 
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert kitchen order events for their restaurant" 
ON kitchen_order_events 
FOR INSERT 
WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  )
);

-- Habilitar realtime para kitchen_order_events
ALTER TABLE kitchen_order_events REPLICA IDENTITY FULL;

-- Agregar kitchen_order_events a la publicación de realtime (si no existe ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'kitchen_order_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_order_events;
  END IF;
END $$;