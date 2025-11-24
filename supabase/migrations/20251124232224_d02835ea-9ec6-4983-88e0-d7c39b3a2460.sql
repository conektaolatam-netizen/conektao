-- Tabla de clientes para CRM y facturación
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('NIT', 'CC', 'CE', 'PPN')),
  document_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_regime TEXT CHECK (tax_regime IN ('simplificado', 'comun', 'gran_contribuyente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, document_number)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_customers_document ON public.customers(restaurant_id, document_number);
CREATE INDEX idx_customers_email ON public.customers(restaurant_id, email);

-- Tabla de configuración de cuentas bancarias del negocio
CREATE TABLE IF NOT EXISTS public.business_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('nequi', 'daviplata', 'bancolombia', 'banco_bogota', 'otro')),
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  last_four_digits TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de facturas emitidas
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('electronica', 'simple', 'pos')),
  total_amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_voucher_url TEXT,
  ai_validation_status TEXT CHECK (ai_validation_status IN ('pending', 'approved', 'rejected', 'manual_review')),
  ai_validation_notes TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  sent_to_email BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(restaurant_id, invoice_number)
);

-- Índice para búsquedas
CREATE INDEX idx_invoices_restaurant ON public.invoices(restaurant_id, created_at DESC);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);

-- Tabla de validaciones de pago con IA
CREATE TABLE IF NOT EXISTS public.payment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  voucher_url TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('pending', 'approved', 'rejected', 'manual_review')),
  validation_details JSONB,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para customers
CREATE POLICY "Users can access customers in their restaurant"
ON public.customers
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Políticas RLS para business_payment_accounts
CREATE POLICY "Users can view payment accounts in their restaurant"
ON public.business_payment_accounts
FOR SELECT
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Only owners and admins can manage payment accounts"
ON public.business_payment_accounts
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Políticas RLS para invoices
CREATE POLICY "Users can access invoices in their restaurant"
ON public.invoices
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Políticas RLS para payment_validations
CREATE POLICY "Users can access payment validations in their restaurant"
ON public.payment_validations
FOR ALL
USING (
  invoice_id IN (
    SELECT id FROM public.invoices 
    WHERE restaurant_id IN (
      SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_payment_accounts_updated_at
BEFORE UPDATE ON public.business_payment_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();