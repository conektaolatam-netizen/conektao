-- Crear tabla para comandas (órdenes enviadas a cocina)
CREATE TABLE public.kitchen_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  user_id UUID NOT NULL, -- quien envió la comanda
  table_number INTEGER,
  order_number TEXT NOT NULL DEFAULT CONCAT('CMD-', EXTRACT(year FROM now()), '-', lpad((EXTRACT(doy FROM now()))::text, 3, '0'), '-', lpad((floor((random() * 10000)::double precision))::text, 4, '0')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  total_items INTEGER NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'normal', -- normal, high, urgent
  estimated_time INTEGER, -- minutos estimados
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para items de comandas
CREATE TABLE public.kitchen_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kitchen_order_id UUID NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC,
  special_instructions TEXT, -- observaciones del producto
  status TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para notificaciones de cocina
CREATE TABLE public.kitchen_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  kitchen_order_id UUID NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'new_order', -- new_order, order_ready, order_cancelled
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kitchen_orders
CREATE POLICY "Users can manage kitchen orders in their restaurant" 
ON public.kitchen_orders 
FOR ALL 
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create kitchen orders for their restaurant" 
ON public.kitchen_orders 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Políticas RLS para kitchen_order_items
CREATE POLICY "Users can manage kitchen order items in their restaurant" 
ON public.kitchen_order_items 
FOR ALL 
USING (kitchen_order_id IN (
  SELECT id FROM public.kitchen_orders 
  WHERE restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
));

-- Políticas RLS para kitchen_notifications
CREATE POLICY "Users can manage kitchen notifications in their restaurant" 
ON public.kitchen_notifications 
FOR ALL 
USING (restaurant_id IN (
  SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_kitchen_orders_updated_at
  BEFORE UPDATE ON public.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear notificación cuando se crea una nueva comanda
CREATE OR REPLACE FUNCTION public.create_kitchen_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kitchen_notifications (
    restaurant_id,
    kitchen_order_id,
    type,
    message
  ) VALUES (
    NEW.restaurant_id,
    NEW.id,
    'new_order',
    CONCAT('Nueva comanda #', NEW.order_number, ' - Mesa ', COALESCE(NEW.table_number::text, 'N/A'))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear notificación automáticamente
CREATE TRIGGER create_kitchen_notification_trigger
  AFTER INSERT ON public.kitchen_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_kitchen_notification();

-- Agregar columna para observaciones en table_states si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_states' 
    AND column_name = 'pending_command_reminder'
  ) THEN
    ALTER TABLE public.table_states 
    ADD COLUMN pending_command_reminder BOOLEAN DEFAULT false;
  END IF;
END $$;