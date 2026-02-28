
-- =============================================
-- SISTEMA ALICIA VENDEDORES — Tabla independiente
-- =============================================

CREATE TABLE public.vendedores_agente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  ciudad TEXT,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  codigo_vendedor TEXT UNIQUE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'certificado', 'activo')),
  fecha_certificacion TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.vendedores_agente ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all vendors
CREATE POLICY "Authenticated users can view vendedores"
  ON public.vendedores_agente FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: authenticated admins can insert/update
CREATE POLICY "Authenticated users can insert vendedores"
  ON public.vendedores_agente FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update vendedores"
  ON public.vendedores_agente FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: service role (webhook) can do everything via service_role key
CREATE POLICY "Service role full access vendedores"
  ON public.vendedores_agente FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- Auto-generate vendor code on certification
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_vendor_code()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_initials TEXT;
  v_random TEXT;
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Only generate when estado changes to 'certificado' and no code yet
  IF NEW.estado = 'certificado' AND (OLD.estado IS DISTINCT FROM 'certificado') AND NEW.codigo_vendedor IS NULL THEN
    -- Extract initials from nombre (first letter of first two words)
    v_initials := UPPER(
      COALESCE(LEFT(split_part(NEW.nombre, ' ', 1), 1), 'X') ||
      COALESCE(NULLIF(LEFT(split_part(NEW.nombre, ' ', 2), 1), ''), 'X')
    );
    
    -- Generate unique code with retry
    LOOP
      v_random := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      v_code := 'CNK-' || v_initials || v_random;
      
      SELECT EXISTS (SELECT 1 FROM public.vendedores_agente WHERE codigo_vendedor = v_code) INTO v_exists;
      EXIT WHEN NOT v_exists;
    END LOOP;
    
    NEW.codigo_vendedor := v_code;
    NEW.fecha_certificacion := COALESCE(NEW.fecha_certificacion, now());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_vendor_code
  BEFORE UPDATE ON public.vendedores_agente
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vendor_code();

-- Also handle INSERT with estado = 'certificado' directly
CREATE TRIGGER trg_generate_vendor_code_insert
  BEFORE INSERT ON public.vendedores_agente
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vendor_code();
