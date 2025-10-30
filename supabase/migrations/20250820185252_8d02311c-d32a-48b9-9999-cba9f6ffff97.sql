-- Corregir funciones para establecer search_path seguro
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lng1 DECIMAL, 
  lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Radio de la tierra en metros
  lat_rad1 DECIMAL;
  lat_rad2 DECIMAL;
  delta_lat DECIMAL;
  delta_lng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  lat_rad1 := radians(lat1);
  lat_rad2 := radians(lat2);
  delta_lat := radians(lat2 - lat1);
  delta_lng := radians(lng2 - lng1);
  
  a := sin(delta_lat/2) * sin(delta_lat/2) + 
       cos(lat_rad1) * cos(lat_rad2) * 
       sin(delta_lng/2) * sin(delta_lng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corregir función de validación de ubicación
CREATE OR REPLACE FUNCTION public.validate_clock_location(
  restaurant_id_param UUID,
  user_lat DECIMAL,
  user_lng DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  restaurant_lat DECIMAL;
  restaurant_lng DECIMAL;
  allowed_radius INTEGER;
  distance DECIMAL;
BEGIN
  SELECT latitude, longitude, location_radius 
  INTO restaurant_lat, restaurant_lng, allowed_radius
  FROM public.restaurants 
  WHERE id = restaurant_id_param;
  
  IF restaurant_lat IS NULL OR restaurant_lng IS NULL THEN
    RETURN false;
  END IF;
  
  distance := public.calculate_distance(restaurant_lat, restaurant_lng, user_lat, user_lng);
  
  RETURN distance <= allowed_radius;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;