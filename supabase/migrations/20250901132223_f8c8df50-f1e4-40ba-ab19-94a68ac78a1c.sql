-- Add tip configuration to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS tip_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_tip_percentage DECIMAL(4,2) DEFAULT 10.00;

-- Update existing restaurants to have default tip settings
UPDATE public.restaurants 
SET tip_enabled = false, default_tip_percentage = 10.00 
WHERE tip_enabled IS NULL;