-- Create a function to generate monthly invoice documents
CREATE OR REPLACE FUNCTION generate_monthly_invoice_document(
  p_year INT,
  p_month INT,
  p_restaurant_id UUID
) RETURNS UUID AS $$
DECLARE
  monthly_total NUMERIC := 0;
  monthly_count INT := 0;
  document_id UUID;
  document_content JSONB;
  sales_data JSONB := '[]'::jsonb;
BEGIN
  -- Calculate monthly totals and get sales data
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COUNT(s.id),
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'sale_id', s.id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'table_number', s.table_number,
        'created_at', s.created_at,
        'customer_email', mask_customer_email(s.customer_email)
      )
    ), '[]'::jsonb)
  INTO monthly_total, monthly_count, sales_data
  FROM sales s
  JOIN profiles pr ON s.user_id = pr.id
  WHERE pr.restaurant_id = p_restaurant_id
    AND EXTRACT(YEAR FROM s.created_at) = p_year
    AND EXTRACT(MONTH FROM s.created_at) = p_month;
  
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