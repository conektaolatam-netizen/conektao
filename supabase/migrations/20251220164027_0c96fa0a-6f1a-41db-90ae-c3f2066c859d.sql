
-- 1. Crear enum para roles de aplicación
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla de roles de usuario (separada de profiles por seguridad)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'employee',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE (user_id, restaurant_id, role)
);

-- 3. Crear tabla de alertas para el dueño (acciones críticas)
CREATE TABLE IF NOT EXISTS public.owner_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    triggered_by UUID REFERENCES auth.users(id),
    triggered_by_name TEXT,
    alert_type TEXT NOT NULL, -- 'invoice_void', 'item_void', 'large_discount', 'cash_discrepancy', 'suspicious_activity'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    related_table TEXT,
    related_record_id UUID,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Agregar columnas a audit_logs para mejor tracking
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id),
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_generated BOOLEAN DEFAULT false;

-- 5. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_alerts ENABLE ROW LEVEL SECURITY;

-- 6. Función SECURITY DEFINER para verificar roles (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _restaurant_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
          AND is_active = true
          AND (restaurant_id = _restaurant_id OR _restaurant_id IS NULL)
    )
$$;

-- 7. Función para verificar si es dueño del restaurante
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE id = _restaurant_id AND owner_id = _user_id
    )
$$;

-- 8. Función para obtener el owner_id de un restaurante
CREATE OR REPLACE FUNCTION public.get_restaurant_owner(_restaurant_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT owner_id FROM public.restaurants WHERE id = _restaurant_id LIMIT 1
$$;

-- 9. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles in their restaurant"
ON public.user_roles FOR SELECT
USING (public.is_restaurant_owner(auth.uid(), restaurant_id));

CREATE POLICY "Owners can manage roles in their restaurant"
ON public.user_roles FOR ALL
USING (public.is_restaurant_owner(auth.uid(), restaurant_id));

-- 10. Políticas RLS para owner_alerts
CREATE POLICY "Owners can view their alerts"
ON public.owner_alerts FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their alerts"
ON public.owner_alerts FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "System can insert alerts"
ON public.owner_alerts FOR INSERT
WITH CHECK (true);

-- 11. Función para registrar acciones y generar alertas
CREATE OR REPLACE FUNCTION public.log_action_with_alert(
    p_user_id UUID,
    p_restaurant_id UUID,
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_is_sensitive BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id UUID;
    v_user_name TEXT;
    v_user_role TEXT;
    v_owner_id UUID;
    v_alert_type TEXT;
    v_alert_title TEXT;
    v_alert_severity TEXT;
BEGIN
    -- Obtener info del usuario
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
    SELECT role::TEXT INTO v_user_role FROM public.user_roles 
    WHERE user_id = p_user_id AND restaurant_id = p_restaurant_id AND is_active = true LIMIT 1;
    
    -- Registrar en audit_logs
    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, 
        old_values, new_values, restaurant_id, 
        user_name, user_role, is_sensitive
    ) VALUES (
        p_user_id, p_action, p_table_name, p_record_id,
        p_old_values, p_new_values, p_restaurant_id,
        v_user_name, v_user_role, p_is_sensitive
    ) RETURNING id INTO v_audit_id;
    
    -- Si es acción sensible, generar alerta al dueño
    IF p_is_sensitive THEN
        -- Obtener owner del restaurante
        SELECT owner_id INTO v_owner_id FROM public.restaurants WHERE id = p_restaurant_id;
        
        -- Determinar tipo y severidad de alerta
        CASE 
            WHEN p_action ILIKE '%void%' OR p_action ILIKE '%anular%' THEN
                v_alert_type := 'invoice_void';
                v_alert_title := 'Factura o ítem anulado';
                v_alert_severity := 'high';
            WHEN p_action ILIKE '%delete%' OR p_action ILIKE '%eliminar%' THEN
                v_alert_type := 'record_deleted';
                v_alert_title := 'Registro eliminado';
                v_alert_severity := 'medium';
            WHEN p_action ILIKE '%discount%' OR p_action ILIKE '%descuento%' THEN
                v_alert_type := 'large_discount';
                v_alert_title := 'Descuento aplicado';
                v_alert_severity := 'medium';
            WHEN p_action ILIKE '%cash%' OR p_action ILIKE '%caja%' THEN
                v_alert_type := 'cash_discrepancy';
                v_alert_title := 'Movimiento de caja sospechoso';
                v_alert_severity := 'high';
            ELSE
                v_alert_type := 'suspicious_activity';
                v_alert_title := 'Actividad inusual detectada';
                v_alert_severity := 'medium';
        END CASE;
        
        -- Crear alerta para el dueño
        INSERT INTO public.owner_alerts (
            restaurant_id, owner_id, triggered_by, triggered_by_name,
            alert_type, severity, title, description,
            related_table, related_record_id, metadata
        ) VALUES (
            p_restaurant_id, v_owner_id, p_user_id, v_user_name,
            v_alert_type, v_alert_severity, v_alert_title,
            'Acción: ' || p_action || ' por ' || COALESCE(v_user_name, 'Usuario desconocido'),
            p_table_name, p_record_id,
            jsonb_build_object('audit_id', v_audit_id, 'old_values', p_old_values, 'new_values', p_new_values)
        );
        
        -- Marcar audit como alerta generada
        UPDATE public.audit_logs SET alert_generated = true WHERE id = v_audit_id;
    END IF;
    
    RETURN v_audit_id;
END;
$$;

-- 12. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_restaurant_id ON public.user_roles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_owner_alerts_owner_id ON public.owner_alerts(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_alerts_restaurant_id ON public.owner_alerts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_owner_alerts_unread ON public.owner_alerts(owner_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive ON public.audit_logs(restaurant_id, is_sensitive) WHERE is_sensitive = true;
