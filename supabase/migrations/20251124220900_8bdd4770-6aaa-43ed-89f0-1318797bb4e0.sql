-- Add expiry_date field to ingredients table
ALTER TABLE public.ingredients
ADD COLUMN IF NOT EXISTS expiry_date date;

-- Drop existing function if exists and recreate with quantity return
DROP FUNCTION IF EXISTS public.check_product_ingredients_available(uuid, integer);

CREATE OR REPLACE FUNCTION public.check_product_ingredients_available(
  p_product_id uuid, 
  p_quantity integer DEFAULT 1
)
RETURNS TABLE(
  is_available boolean,
  max_units integer,
  limiting_ingredient_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  ingredient_record RECORD;
  min_units integer := 999999;
  limiting_ingredient text := '';
BEGIN
  -- Check each ingredient requirement
  FOR ingredient_record IN 
    SELECT 
      pi.ingredient_id,
      pi.quantity_needed,
      i.current_stock,
      i.name as ingredient_name
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON i.id = pi.ingredient_id
    WHERE pi.product_id = p_product_id
  LOOP
    -- Calculate how many units can be made with this ingredient
    DECLARE
      possible_units integer;
    BEGIN
      possible_units := FLOOR(ingredient_record.current_stock / ingredient_record.quantity_needed);
      
      IF possible_units < min_units THEN
        min_units := possible_units;
        limiting_ingredient := ingredient_record.ingredient_name;
      END IF;
    END;
  END LOOP;
  
  -- If no ingredients defined, return infinite availability
  IF min_units = 999999 THEN
    min_units := 999999;
    limiting_ingredient := NULL;
  END IF;
  
  RETURN QUERY SELECT 
    (min_units >= p_quantity) as is_available,
    min_units as max_units,
    limiting_ingredient as limiting_ingredient_name;
END;
$function$;

-- Create function to calculate product cost based on ingredients
CREATE OR REPLACE FUNCTION public.calculate_product_cost(p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_cost numeric := 0;
BEGIN
  SELECT COALESCE(SUM(i.cost_per_unit * pi.quantity_needed), 0)
  INTO total_cost
  FROM public.product_ingredients pi
  JOIN public.ingredients i ON i.id = pi.ingredient_id
  WHERE pi.product_id = p_product_id;
  
  RETURN total_cost;
END;
$function$;

-- Create table for future inventory alerts (preparado para futuro)
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('low_stock', 'expiring_soon', 'suspicious_usage')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS on inventory_alerts
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for inventory_alerts
CREATE POLICY "Users can view alerts in their restaurant"
ON public.inventory_alerts
FOR SELECT
USING (
  ingredient_id IN (
    SELECT i.id 
    FROM ingredients i
    JOIN profiles p ON i.user_id = p.id
    WHERE p.restaurant_id = (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Add waste_detected field to ingredient_movements for future use
ALTER TABLE public.ingredient_movements
ADD COLUMN IF NOT EXISTS waste_detected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_code text;