-- Actualizar función log_action_with_alert para incluir edit_sale
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
    v_description TEXT;
BEGIN
    -- Obtener info del usuario
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
    SELECT role::TEXT INTO v_user_role FROM public.user_roles 
    WHERE user_id = p_user_id AND restaurant_id = p_restaurant_id AND is_active = true LIMIT 1;
    
    -- Registrar en audit_logs
    INSERT INTO public.audit_logs (
        user_id, action, table_name, record_id, 
        old_values, new_values, restaurant_id, 
        user_name, user_role, is_sensitive, alert_generated
    ) VALUES (
        p_user_id, p_action, p_table_name, p_record_id,
        p_old_values, p_new_values, p_restaurant_id,
        v_user_name, v_user_role, p_is_sensitive, p_is_sensitive
    ) RETURNING id INTO v_audit_id;
    
    -- Si es acción sensible, generar alerta al dueño
    IF p_is_sensitive THEN
        -- Obtener owner del restaurante
        SELECT owner_id INTO v_owner_id FROM public.restaurants WHERE id = p_restaurant_id;
        
        -- Determinar tipo, severidad y descripción de alerta
        CASE 
            WHEN p_action ILIKE '%void%' OR p_action ILIKE '%anular%' THEN
                v_alert_type := 'invoice_void';
                v_alert_title := '⚠️ Factura o ítem anulado';
                v_alert_severity := 'high';
                v_description := 'Anulación realizada por ' || COALESCE(v_user_name, 'Usuario desconocido');
            WHEN p_action ILIKE '%delete%' OR p_action ILIKE '%eliminar%' THEN
                v_alert_type := 'record_deleted';
                v_alert_title := '🗑️ Venta eliminada';
                v_alert_severity := 'high';
                v_description := 'Venta eliminada por ' || COALESCE(v_user_name, 'Usuario desconocido') || '. Monto: $' || COALESCE((p_old_values->>'total_amount')::TEXT, '0');
            WHEN p_action ILIKE '%edit_sale%' OR p_action ILIKE '%editar%' THEN
                v_alert_type := 'sale_modified';
                v_alert_title := '✏️ Venta modificada';
                v_alert_severity := 'high';
                v_description := 'Venta modificada por ' || COALESCE(v_user_name, 'Usuario desconocido') || '. Diferencia: $' || COALESCE((p_new_values->>'difference')::TEXT, '0');
            WHEN p_action ILIKE '%discount%' OR p_action ILIKE '%descuento%' THEN
                v_alert_type := 'large_discount';
                v_alert_title := '💰 Descuento aplicado';
                v_alert_severity := 'medium';
                v_description := 'Descuento aplicado por ' || COALESCE(v_user_name, 'Usuario desconocido');
            WHEN p_action ILIKE '%cash%' OR p_action ILIKE '%caja%' THEN
                v_alert_type := 'cash_discrepancy';
                v_alert_title := '💵 Movimiento de caja sospechoso';
                v_alert_severity := 'high';
                v_description := 'Discrepancia detectada por ' || COALESCE(v_user_name, 'Usuario desconocido');
            ELSE
                v_alert_type := 'suspicious_activity';
                v_alert_title := '🔍 Actividad inusual';
                v_alert_severity := 'medium';
                v_description := 'Actividad detectada por ' || COALESCE(v_user_name, 'Usuario desconocido');
        END CASE;
        
        -- Crear alerta para el dueño (solo si existe owner)
        IF v_owner_id IS NOT NULL THEN
            INSERT INTO public.owner_alerts (
                restaurant_id, owner_id, triggered_by, triggered_by_name,
                alert_type, severity, title, description,
                related_table, related_record_id, metadata
            ) VALUES (
                p_restaurant_id, v_owner_id, p_user_id, v_user_name,
                v_alert_type, v_alert_severity, v_alert_title, v_description,
                p_table_name, p_record_id, 
                jsonb_build_object(
                    'action', p_action,
                    'old_values', p_old_values,
                    'new_values', p_new_values,
                    'audit_log_id', v_audit_id
                )
            );
        END IF;
    END IF;
    
    RETURN v_audit_id;
END;
$$;