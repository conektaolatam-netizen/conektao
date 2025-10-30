-- Corregir funciones para evitar search_path warnings
CREATE OR REPLACE FUNCTION public.create_kitchen_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.kitchen_notifications (
    restaurant_id,
    kitchen_order_id,
    type,
    message
  ) VALUES (
    NEW.restaurant_id,
    NEW.id,
    'new_order',
    CONCAT('Nueva comanda #', NEW.order_number, ' - Mesa ', COALESCE(NEW.table_number::text, 'N/A'))
  );
  
  RETURN NEW;
END;
$$;