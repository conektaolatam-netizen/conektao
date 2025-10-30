-- Crear enum para roles del sistema
CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'employee');

-- Crear enum para tipos de registro
CREATE TYPE public.clock_type AS ENUM ('clock_in', 'clock_out');

-- Tabla de restaurantes/empresas (multi-tenant)
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_radius INTEGER DEFAULT 100, -- Radio en metros
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de perfiles de usuarios extendida
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de registros de entrada/salida
CREATE TABLE public.time_clock_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  clock_type clock_type NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_valid_location BOOLEAN DEFAULT false,
  device_info JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para restaurants
CREATE POLICY "Users can view their own restaurant" 
ON public.restaurants 
FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.restaurant_id = restaurants.id
  )
);

CREATE POLICY "Only owners can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owners can update their restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (owner_id = auth.uid());

-- Políticas RLS para profiles
CREATE POLICY "Users can view profiles in their restaurant" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Only owners and admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND restaurant_id = profiles.restaurant_id
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Políticas RLS para time_clock_records
CREATE POLICY "Users can view time records in their restaurant" 
ON public.time_clock_records 
FOR SELECT 
USING (
  employee_id = auth.uid() OR
  restaurant_id IN (
    SELECT restaurant_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Employees can create their own time records" 
ON public.time_clock_records 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

-- Función para actualizar timestamps
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para calcular distancia entre coordenadas
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
$$ LANGUAGE plpgsql;

-- Función para validar ubicación de registro
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
$$ LANGUAGE plpgsql SECURITY DEFINER;