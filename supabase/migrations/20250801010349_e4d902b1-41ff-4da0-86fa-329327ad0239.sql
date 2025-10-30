-- Corregir advertencias de seguridad configurando search_path en las funciones

-- Actualizar función para actualizar timestamp con search_path seguro
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql'
SET search_path = '';

-- Actualizar función para actualizar inventario con search_path seguro
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory 
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW()
    WHERE product_id = NEW.product_id;
    
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
      'Venta automática'
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = '';