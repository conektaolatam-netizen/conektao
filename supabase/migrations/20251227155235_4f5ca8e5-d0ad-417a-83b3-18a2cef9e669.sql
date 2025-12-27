-- Función que crea alertas automáticamente para acciones sensibles en audit_logs
CREATE OR REPLACE FUNCTION public.notify_owner_on_sensitive_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_alert_title text;
  v_alert_description text;
  v_severity text;
BEGIN
  -- Solo procesar acciones sensibles
  IF NEW.is_sensitive = false OR NEW.is_sensitive IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar que hay restaurant_id
  IF NEW.restaurant_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener owner del restaurante
  SELECT owner_id INTO v_owner_id
  FROM public.restaurants
  WHERE id = NEW.restaurant_id;
  
  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Configurar alerta según tipo de acción
  CASE NEW.action
    WHEN 'TABLE_CLEARED' THEN
      v_severity := 'high';
      v_alert_title := format('Mesa %s anulada con productos', 
        COALESCE((NEW.old_values->>'table_number')::text, '?'));
      v_alert_description := format('%s anuló mesa %s con %s productos. Total: $%s. Motivo: %s',
        COALESCE(NEW.user_name, 'Usuario'),
        COALESCE((NEW.old_values->>'table_number')::text, '?'),
        COALESCE((NEW.old_values->>'item_count')::text, '0'),
        COALESCE((NEW.old_values->>'order_total')::text, '0'),
        COALESCE((NEW.old_values->>'reason')::text, 'Sin motivo especificado')
      );
    WHEN 'INVOICE_VOID' THEN
      v_severity := 'critical';
      v_alert_title := 'Factura anulada';
      v_alert_description := format('%s anuló una factura. %s',
        COALESCE(NEW.user_name, 'Usuario'),
        COALESCE(NEW.old_values->>'reason', '')
      );
    WHEN 'LARGE_DISCOUNT' THEN
      v_severity := 'high';
      v_alert_title := 'Descuento grande aplicado';
      v_alert_description := format('%s aplicó un descuento significativo',
        COALESCE(NEW.user_name, 'Usuario')
      );
    WHEN 'CASH_ADJUSTMENT' THEN
      v_severity := 'high';
      v_alert_title := 'Ajuste de caja';
      v_alert_description := format('%s realizó un ajuste de caja',
        COALESCE(NEW.user_name, 'Usuario')
      );
    ELSE
      v_severity := 'medium';
      v_alert_title := format('Acción sensible: %s', NEW.action);
      v_alert_description := format('Acción realizada por %s en %s',
        COALESCE(NEW.user_name, 'Usuario'),
        COALESCE(NEW.table_name, 'sistema')
      );
  END CASE;
  
  -- Insertar alerta para el dueño
  INSERT INTO public.owner_alerts (
    restaurant_id,
    owner_id,
    triggered_by,
    triggered_by_name,
    alert_type,
    severity,
    title,
    description,
    related_table,
    related_record_id,
    metadata
  ) VALUES (
    NEW.restaurant_id,
    v_owner_id,
    NEW.user_id,
    NEW.user_name,
    NEW.action,
    v_severity,
    v_alert_title,
    v_alert_description,
    NEW.table_name,
    NEW.record_id,
    jsonb_build_object(
      'audit_id', NEW.id,
      'old_values', NEW.old_values,
      'new_values', NEW.new_values,
      'action', NEW.action
    )
  );
  
  RETURN NEW;
END;
$$;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_notify_owner_sensitive_action ON public.audit_logs;

-- Crear trigger que se dispara cuando se inserta un registro sensible en audit_logs
CREATE TRIGGER trigger_notify_owner_sensitive_action
AFTER INSERT ON public.audit_logs
FOR EACH ROW
WHEN (NEW.is_sensitive = true)
EXECUTE FUNCTION public.notify_owner_on_sensitive_action();