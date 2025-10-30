-- Create a function to generate monthly invoice documents
CREATE OR REPLACE FUNCTION generate_monthly_invoice_document(
  p_year INT,
  p_month INT,
  p_restaurant_id UUID
) RETURNS UUID AS $$
DECLARE
  monthly_sales CURSOR FOR 
    SELECT s.*, si.*, p.name as product_name
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    JOIN profiles pr ON s.user_id = pr.id
    WHERE pr.restaurant_id = p_restaurant_id
      AND EXTRACT(YEAR FROM s.created_at) = p_year
      AND EXTRACT(MONTH FROM s.created_at) = p_month
    ORDER BY s.created_at DESC;
  
  monthly_total NUMERIC := 0;
  monthly_count INT := 0;
  document_id UUID;
  document_content JSONB;
  sales_data JSONB := '[]'::jsonb;
  current_sale RECORD;
BEGIN
  -- Calculate monthly totals
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COUNT(s.id)
  INTO monthly_total, monthly_count
  FROM sales s
  JOIN profiles pr ON s.user_id = pr.id
  WHERE pr.restaurant_id = p_restaurant_id
    AND EXTRACT(YEAR FROM s.created_at) = p_year
    AND EXTRACT(MONTH FROM s.created_at) = p_month;
  
  -- Prepare sales data
  FOR current_sale IN monthly_sales LOOP
    sales_data := sales_data || jsonb_build_object(
      'sale_id', current_sale.id,
      'total_amount', current_sale.total_amount,
      'payment_method', current_sale.payment_method,
      'table_number', current_sale.table_number,
      'created_at', current_sale.created_at,
      'product_name', current_sale.product_name,
      'quantity', current_sale.quantity,
      'unit_price', current_sale.unit_price,
      'subtotal', current_sale.subtotal
    );
  END LOOP;
  
  -- Create document content
  document_content := jsonb_build_object(
    'type', 'monthly_invoice_summary',
    'year', p_year,
    'month', p_month,
    'total_amount', monthly_total,
    'total_invoices', monthly_count,
    'sales_data', sales_data,
    'generated_at', NOW(),
    'restaurant_id', p_restaurant_id
  );
  
  -- Insert into business_documents
  INSERT INTO business_documents (
    restaurant_id,
    document_type,
    title,
    content,
    metadata,
    created_at
  ) VALUES (
    p_restaurant_id,
    'monthly_invoice_summary',
    'Resumen Facturas ' || 
      CASE p_month
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN 'Febrero'  
        WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
      END || ' ' || p_year,
    document_content::text,
    jsonb_build_object(
      'year', p_year,
      'month', p_month,
      'total_amount', monthly_total,
      'total_invoices', monthly_count,
      'auto_generated', true
    ),
    NOW()
  ) RETURNING id INTO document_id;
  
  RETURN document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly document generation (runs on 1st of each month at midnight)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 0 1 * *', -- At 00:00 on day-of-month 1
  $$
  DO $$
  DECLARE
    restaurant RECORD;
    prev_month INT;
    prev_year INT;
  BEGIN
    -- Calculate previous month
    IF EXTRACT(MONTH FROM NOW()) = 1 THEN
      prev_month := 12;
      prev_year := EXTRACT(YEAR FROM NOW()) - 1;
    ELSE
      prev_month := EXTRACT(MONTH FROM NOW()) - 1;
      prev_year := EXTRACT(YEAR FROM NOW());
    END IF;
    
    -- Generate documents for all restaurants
    FOR restaurant IN SELECT id FROM restaurants LOOP
      PERFORM generate_monthly_invoice_document(prev_year, prev_month, restaurant.id);
    END LOOP;
  END $$;
  $$
);