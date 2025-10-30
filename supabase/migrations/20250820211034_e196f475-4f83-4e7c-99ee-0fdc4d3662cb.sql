-- Fix function search path security issue
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;