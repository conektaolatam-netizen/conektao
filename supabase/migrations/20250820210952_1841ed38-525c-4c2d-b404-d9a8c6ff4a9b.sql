-- Add unit field to inventory table
ALTER TABLE public.inventory ADD COLUMN unit TEXT DEFAULT 'unidades';

-- Update the automatic inventory deduction trigger to be more robust
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update inventory stock
    UPDATE public.inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
    -- Create inventory movement record
    INSERT INTO public.inventory_movements (
      product_id, 
      movement_type, 
      quantity, 
      reference_type, 
      reference_id,
      notes
    ) VALUES (
      NEW.product_id, 
      'OUT', 
      NEW.quantity, 
      'SALE', 
      NEW.sale_id,
      CONCAT('Venta - Factura ID: ', NEW.sale_id)
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for automatic inventory updates on sales
DROP TRIGGER IF EXISTS trigger_update_inventory_on_sale ON public.sale_items;
CREATE TRIGGER trigger_update_inventory_on_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_sale();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);

-- Update existing inventory records to have units if they don't have them
UPDATE public.inventory SET unit = 'unidades' WHERE unit IS NULL;