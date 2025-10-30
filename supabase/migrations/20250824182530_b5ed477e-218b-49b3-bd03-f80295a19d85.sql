-- Crear enum para tipos de cuenta
CREATE TYPE account_type AS ENUM ('restaurant', 'supplier');

-- Crear enum para cobertura de envío
CREATE TYPE shipping_coverage AS ENUM ('national', 'local', 'cities');

-- Crear enum para estado de pedidos
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Crear enum para estado de pagos
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Agregar tipo de cuenta al perfil
ALTER TABLE public.profiles 
ADD COLUMN account_type account_type DEFAULT 'restaurant';

-- Crear tabla de configuración de proveedores
CREATE TABLE public.supplier_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  shipping_coverage shipping_coverage NOT NULL DEFAULT 'local',
  shipping_cities TEXT[], -- Lista de ciudades cuando coverage es 'cities'
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 8.00, -- Comisión del 8%
  delivery_time_min INTEGER, -- Tiempo mínimo de entrega en horas
  delivery_time_max INTEGER, -- Tiempo máximo de entrega en horas
  minimum_order_amount DECIMAL(12,2) DEFAULT 0,
  accepts_cash_on_delivery BOOLEAN DEFAULT false,
  accepts_bank_transfer BOOLEAN DEFAULT true,
  bank_account_info JSONB, -- Información bancaria encriptada
  is_active BOOLEAN DEFAULT true,
  verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verification_documents JSONB, -- URLs de documentos de verificación
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de productos de proveedor (extendida)
ALTER TABLE public.supplier_products 
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS dimensions JSONB, -- {length, width, height}
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS maximum_quantity INTEGER,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available', -- available, out_of_stock, discontinued
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Crear tabla de pedidos entre restaurantes y proveedores
CREATE TABLE public.supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT concat('SO-', EXTRACT(year FROM now()), '-', lpad((EXTRACT(doy FROM now()))::text, 3, '0'::text), '-', lpad((floor((random() * (10000)::double precision)))::text, 4, '0'::text)),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ordered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL, -- 8% de comisión
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  delivery_address TEXT NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de items de pedidos de proveedor
CREATE TABLE public.supplier_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.supplier_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de chat de soporte
CREATE TABLE public.support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT concat('TICKET-', EXTRACT(year FROM now()), '-', lpad((floor((random() * (100000)::double precision)))::text, 5, '0'::text)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL, -- 'payment', 'delivery', 'product', 'technical', 'other'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
  assigned_to UUID REFERENCES auth.users(id), -- ID del agente asignado
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER, -- 1-5 stars
  satisfaction_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de mensajes de chat de soporte
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file'
  file_url TEXT,
  is_internal BOOLEAN DEFAULT false, -- Mensajes internos entre agentes
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla de transacciones y pagos
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL DEFAULT concat('TXN-', EXTRACT(year FROM now()), '-', lpad((floor((random() * (1000000)::double precision)))::text, 6, '0'::text)),
  order_id UUID REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  supplier_amount DECIMAL(12,2) NOT NULL, -- amount - commission_amount
  payment_method TEXT NOT NULL,
  payment_provider TEXT, -- 'stripe', 'paypal', etc.
  external_transaction_id TEXT, -- ID de la pasarela de pago
  status payment_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  released_to_supplier_at TIMESTAMPTZ, -- Cuándo se libera el dinero al proveedor
  metadata JSONB, -- Datos adicionales de la pasarela
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.supplier_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para supplier_settings
CREATE POLICY "Users can manage their own supplier settings" ON public.supplier_settings
FOR ALL USING (user_id = auth.uid());

-- Políticas RLS para supplier_orders
CREATE POLICY "Suppliers can view their orders" ON public.supplier_orders
FOR SELECT USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Restaurants can view their orders" ON public.supplier_orders
FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Restaurants can create orders" ON public.supplier_orders
FOR INSERT WITH CHECK (
  ordered_by = auth.uid() AND 
  restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Suppliers can update order status" ON public.supplier_orders
FOR UPDATE USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

-- Políticas RLS para supplier_order_items
CREATE POLICY "Users can access order items for their orders" ON public.supplier_order_items
FOR ALL USING (
  order_id IN (
    SELECT id FROM supplier_orders 
    WHERE supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
    OR restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR ordered_by = auth.uid()
  )
);

-- Políticas RLS para support_chats
CREATE POLICY "Users can manage their own support chats" ON public.support_chats
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Support agents can view all chats" ON public.support_chats
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Políticas RLS para support_messages
CREATE POLICY "Users can manage messages in their chats" ON public.support_messages
FOR ALL USING (
  chat_id IN (SELECT id FROM support_chats WHERE user_id = auth.uid())
);

CREATE POLICY "Support agents can manage all messages" ON public.support_messages
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Políticas RLS para payment_transactions
CREATE POLICY "Suppliers can view their transactions" ON public.payment_transactions
FOR SELECT USING (supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Restaurants can view their transactions" ON public.payment_transactions
FOR SELECT USING (restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- Índices para mejor rendimiento
CREATE INDEX idx_supplier_settings_user_id ON public.supplier_settings(user_id);
CREATE INDEX idx_supplier_orders_supplier_id ON public.supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_restaurant_id ON public.supplier_orders(restaurant_id);
CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(status);
CREATE INDEX idx_supplier_orders_created_at ON public.supplier_orders(created_at);
CREATE INDEX idx_support_chats_user_id ON public.support_chats(user_id);
CREATE INDEX idx_support_chats_status ON public.support_chats(status);
CREATE INDEX idx_support_messages_chat_id ON public.support_messages(chat_id);
CREATE INDEX idx_payment_transactions_supplier_id ON public.payment_transactions(supplier_id);
CREATE INDEX idx_payment_transactions_restaurant_id ON public.payment_transactions(restaurant_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Triggers para updated_at
CREATE TRIGGER update_supplier_settings_updated_at
    BEFORE UPDATE ON public.supplier_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_orders_updated_at
    BEFORE UPDATE ON public.supplier_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_chats_updated_at
    BEFORE UPDATE ON public.support_chats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();