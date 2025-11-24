-- Add allow_sales_without_stock configuration to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS allow_sales_without_stock boolean DEFAULT false;

COMMENT ON COLUMN restaurants.allow_sales_without_stock IS 'Permite realizar ventas sin validar stock de ingredientes. Si está activo, muestra advertencias pero no bloquea la venta';
