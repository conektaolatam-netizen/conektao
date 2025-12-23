-- RPC para limpiar mesa de forma ATÓMICA con auditoría
CREATE OR REPLACE FUNCTION public.clear_table_order(
  p_table_number integer,
  p_restaurant_id uuid,
  p_user_id uuid,
  p_user_name text DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table_state record;
  v_order_total numeric;
  v_item_count integer;
  v_result jsonb;
BEGIN
  -- Buscar estado actual de la mesa
  SELECT * INTO v_table_state
  FROM table_states
  WHERE restaurant_id = p_restaurant_id 
    AND table_number = p_table_number
  FOR UPDATE; -- Lock para evitar race conditions
  
  -- Si no existe la mesa, crear registro vacío
  IF v_table_state IS NULL THEN
    INSERT INTO table_states (restaurant_id, table_number, status, current_order, order_total)
    VALUES (p_restaurant_id, p_table_number, 'libre', '[]'::jsonb, 0);
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Mesa ya estaba libre',
      'cleared_order_id', null,
      'cleared_at', now()
    );
  END IF;
  
  -- Si la mesa ya está libre y sin orden
  IF v_table_state.status = 'libre' AND 
     (v_table_state.current_order IS NULL OR 
      v_table_state.current_order = '[]'::jsonb OR
      jsonb_array_length(v_table_state.current_order) = 0) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Mesa ya estaba libre',
      'cleared_order_id', null,
      'cleared_at', now()
    );
  END IF;
  
  -- Calcular totales antes de limpiar para auditoría
  v_order_total := COALESCE(v_table_state.order_total, 0);
  v_item_count := CASE 
    WHEN v_table_state.current_order IS NOT NULL 
    THEN jsonb_array_length(v_table_state.current_order)
    ELSE 0 
  END;
  
  -- Registrar en audit_logs si había items
  IF v_item_count > 0 THEN
    INSERT INTO audit_logs (
      restaurant_id,
      user_id,
      user_name,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      is_sensitive
    ) VALUES (
      p_restaurant_id,
      p_user_id,
      COALESCE(p_user_name, 'Usuario'),
      'TABLE_CLEARED',
      'table_states',
      v_table_state.id::text,
      jsonb_build_object(
        'table_number', p_table_number,
        'order_total', v_order_total,
        'item_count', v_item_count,
        'items', v_table_state.current_order,
        'reason', p_reason
      ),
      jsonb_build_object(
        'table_number', p_table_number,
        'order_total', 0,
        'item_count', 0,
        'status', 'libre'
      ),
      true
    );
  END IF;
  
  -- Limpiar la mesa - OPERACIÓN ATÓMICA
  UPDATE table_states
  SET 
    status = 'libre',
    current_order = '[]'::jsonb,
    order_total = 0,
    guest_count = 0,
    kitchen_order_sent = false,
    pending_command_reminder = false,
    updated_at = now()
  WHERE restaurant_id = p_restaurant_id 
    AND table_number = p_table_number;
  
  -- Retornar resultado exitoso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Mesa limpiada correctamente',
    'cleared_order_id', v_table_state.id,
    'cleared_at', now(),
    'previous_total', v_order_total,
    'previous_item_count', v_item_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'cleared_order_id', null,
    'cleared_at', null
  );
END;
$$;