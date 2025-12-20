-- Actualizar productos sin categoría - ENTRADAS (usando categoría existente)
UPDATE products SET category_id = 'dccd5abb-c334-40ef-bcde-2009366ec941'
WHERE user_id = 'ec74ccc5-8888-480a-bf16-3891cb10d74d' AND category_id IS NULL 
AND name IN ('Nuditos De Ajo', 'Camarones a las finas hierbas', 'Champiñones Gratinados Queso Azul', 'Burrata La Barra', 'Burrata Tempura', 'Brie Al Horno');

-- COCINA ITALIANA
UPDATE products SET category_id = 'c632ef75-83d5-4ea2-8e7a-5155ab87ecbe'
WHERE user_id = 'ec74ccc5-8888-480a-bf16-3891cb10d74d' AND category_id IS NULL 
AND name IN ('Spaghetti Alla Bolognese', 'Fettuccine Carbonara', 'Fettuccine Con Camarones', 'Spaghetti A Los Cuatro Quesos', 'Spaghetti Al Teléfono', 'Ravioles Del Chef', 'Lasagna');

-- PIZZAS DULCES  
UPDATE products SET category_id = 'f49b2abb-a1b8-4032-9282-068746cdb052'
WHERE user_id = 'ec74ccc5-8888-480a-bf16-3891cb10d74d' AND category_id IS NULL;