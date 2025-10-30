-- Agregar campos para tipo de empleado y salario por hora
ALTER TABLE public.profiles 
ADD COLUMN employee_type TEXT DEFAULT 'fixed' CHECK (employee_type IN ('fixed', 'hourly')),
ADD COLUMN hourly_rate NUMERIC DEFAULT NULL;

-- Comentario: 
-- employee_type: 'fixed' para empleados fijos con salario mensual, 'hourly' para empleados por turno
-- hourly_rate: tarifa por hora para empleados por turno (NULL para empleados fijos)