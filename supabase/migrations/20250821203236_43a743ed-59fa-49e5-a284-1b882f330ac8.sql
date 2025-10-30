-- Eliminar todas las ventas y datos asociados al correo morethanacai@gmail.com

-- Primero eliminar los toppings de los items de venta
DELETE FROM public.sale_item_toppings 
WHERE sale_item_id IN (
  SELECT si.id 
  FROM public.sale_items si
  JOIN public.sales s ON si.sale_id = s.id
  WHERE s.customer_email = 'morethanacai@gmail.com'
);

-- Luego eliminar los items de venta
DELETE FROM public.sale_items 
WHERE sale_id IN (
  SELECT id FROM public.sales 
  WHERE customer_email = 'morethanacai@gmail.com'
);

-- Finalmente eliminar las ventas
DELETE FROM public.sales 
WHERE customer_email = 'morethanacai@gmail.com';