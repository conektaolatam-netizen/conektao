-- Create gas_flowmeter_readings table for IoT sensor data
CREATE TABLE public.gas_flowmeter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Meter identification
  meter_id TEXT NOT NULL,           -- 'M1_PUERTO_SALGAR', 'M2_IBAGUE', 'M3_PIPETAS'
  meter_location TEXT NOT NULL,     -- 'Puerto Salgar', 'Ibagué Estacionario', 'Llenado Pipetas'
  
  -- Reading data
  reading_type TEXT NOT NULL,       -- 'carga_enviada', 'carga_recibida', 'pipeta_llenada'
  volume_liters NUMERIC NOT NULL,
  volume_kg NUMERIC,
  temperature NUMERIC,
  pressure NUMERIC,
  
  -- Traceability
  batch_code TEXT,
  vehicle_plate TEXT,
  driver_name TEXT,
  driver_id UUID,
  
  -- For pipetas
  cylinder_serial TEXT,
  client_id UUID REFERENCES public.gas_clients(id),
  
  -- IoT metadata
  device_id TEXT,
  signal_quality INTEGER,
  
  -- Timestamps
  reading_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Merma detection
  expected_volume NUMERIC,
  variance_liters NUMERIC,
  variance_percent NUMERIC,
  is_anomaly BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.gas_flowmeter_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view flowmeter readings for their tenant"
ON public.gas_flowmeter_readings FOR SELECT
USING (
  tenant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert flowmeter readings for their tenant"
ON public.gas_flowmeter_readings FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_gas_flowmeter_readings_tenant ON public.gas_flowmeter_readings(tenant_id);
CREATE INDEX idx_gas_flowmeter_readings_meter ON public.gas_flowmeter_readings(meter_id);
CREATE INDEX idx_gas_flowmeter_readings_reading_at ON public.gas_flowmeter_readings(reading_at DESC);
CREATE INDEX idx_gas_flowmeter_readings_batch ON public.gas_flowmeter_readings(batch_code);
CREATE INDEX idx_gas_flowmeter_readings_driver ON public.gas_flowmeter_readings(driver_name);

-- Insert 7 days of historical simulation data
-- Note: This will be executed by the edge function seed-gas-flowmeter-demo