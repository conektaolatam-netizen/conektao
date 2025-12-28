-- ============================================
-- FASE 1: FUNCIÓN ATÓMICA PARA PROCESAR VENTAS
-- Garantiza que todo se ejecuta o nada (transacción)
-- ============================================

CREATE OR REPLACE FUNCTION public.process_sale_atomic(
  p_restaurant_id uuid,
  p_user_id uuid,
  p_total_amount numeric,
  p_payment_method text,
  p_items jsonb,
  p_table_number integer DEFAULT NULL,
  p_tip_amount numeric DEFAULT 0,
  p_customer_email text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id uuid;
  v_existing_sale_id uuid;
BEGIN
  -- 1. IDEMPOTENCIA: Si ya existe una venta con esta key, retornarla sin duplicar
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_sale_id
    FROM public.sales
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;
    
    IF v_existing_sale_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_existing_sale_id,
        'duplicate', true,
        'message', 'Venta ya procesada (idempotencia)'
      );
    END IF;
  END IF;

  -- 2. CREAR LA VENTA
  INSERT INTO public.sales (
    user_id,
    total_amount,
    payment_method,
    table_number,
    customer_email,
    status,
    idempotency_key
  ) VALUES (
    p_user_id,
    p_total_amount,
    p_payment_method,
    p_table_number,
    p_customer_email,
    'completed',
    p_idempotency_key
  )
  RETURNING id INTO v_sale_id;

  -- 3. INSERTAR ITEMS DE LA VENTA
  INSERT INTO public.sale_items (
    sale_id,
    product_id,
    quantity,
    unit_price,
    subtotal
  )
  SELECT 
    v_sale_id,
    (item->>'product_id')::uuid,
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    (item->>'subtotal')::numeric
  FROM jsonb_array_elements(p_items) AS item;

  -- 4. LIBERAR LA MESA (si aplica)
  IF p_table_number IS NOT NULL AND p_restaurant_id IS NOT NULL THEN
    UPDATE public.table_states
    SET 
      status = 'libre',
      guest_count = 0,
      current_order = '[]'::jsonb,
      order_total = 0,
      kitchen_order_sent = false,
      pending_command_reminder = false,
      updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND table_number = p_table_number;
  END IF;

  -- 5. RETORNAR RESULTADO EXITOSO
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'duplicate', false,
    'message', 'Venta procesada correctamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'sale_id', NULL,
    'duplicate', false,
    'message', SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;

-- ============================================
-- FASE 5: ÍNDICES PARA ALTO TRÁFICO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_user_created 
ON public.sales (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_idempotency_key 
ON public.sales (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_table_states_restaurant_table 
ON public.table_states (restaurant_id, table_number);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_restaurant_status 
ON public.kitchen_orders (restaurant_id, status) 
WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_date 
ON public.audit_logs (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_owner_alerts_unread 
ON public.owner_alerts (owner_id, is_read, created_at DESC) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
ON public.sale_items (sale_id);

-- Habilitar replica identity para realtime
ALTER TABLE public.table_states REPLICA IDENTITY FULL;

-- Agregar a publicación realtime (ignorar si ya existe)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.table_states;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;