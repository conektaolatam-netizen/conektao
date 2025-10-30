-- Create cash register table for daily cash management
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_cash NUMERIC,
  final_cash NUMERIC,
  cash_difference NUMERIC,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, date)
);

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Create policies for cash registers
CREATE POLICY "Users can view cash registers in their restaurant" 
ON public.cash_registers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND restaurant_id = cash_registers.restaurant_id
));

CREATE POLICY "Users can create cash registers for their restaurant" 
ON public.cash_registers 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND restaurant_id IN (
    SELECT restaurant_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Only owners and admins can update cash registers" 
ON public.cash_registers 
FOR UPDATE 
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Employees can only update opening balance if not already set and register not closed
CREATE POLICY "Employees can set opening balance" 
ON public.cash_registers 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND opening_balance = 0 
  AND NOT is_closed
);

-- Create cash payments table for tracking cash payments
CREATE TABLE public.cash_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for cash payments
CREATE POLICY "Users can view cash payments in their restaurant" 
ON public.cash_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM cash_registers cr
  JOIN profiles p ON cr.restaurant_id = p.restaurant_id
  WHERE cr.id = cash_payments.cash_register_id
  AND p.id = auth.uid()
));

CREATE POLICY "Users can create cash payments" 
ON public.cash_payments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cash_registers cr
    JOIN profiles p ON cr.restaurant_id = p.restaurant_id
    WHERE cr.id = cash_register_id
    AND p.id = auth.uid()
    AND NOT cr.is_closed
  )
);

-- Add trigger for updating timestamps
CREATE TRIGGER update_cash_registers_updated_at
BEFORE UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();