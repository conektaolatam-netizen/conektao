-- Crear productos para La Barra Crea Tu Pizza
-- Usuario: 725cb6a5-72dc-4216-9b67-5b173abea49c
-- Restaurante: 4c8b27f5-893e-4688-bcbf-7fa4526050ee

-- ENTRADAS
INSERT INTO public.products (name, description, price, category, user_id, restaurant_id, is_active) VALUES
('Nuditos De Ajo', 'Nuditos horneados en salsa de mantequilla y ajo', 10000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Camarones a las finas hierbas', 'Camarones en salsa a las finas hierbas y parmesano', 32000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Champiñones Gratinados Queso Azul', 'Champiñones con salsa de queso azul y parmesano', 29000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Burrata La Barra', 'Mozzarella de búfala, manzana caramelizada, tomates cherry salteados y pistacho', 34000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Burrata Tempura', 'Mozzarella de búfala tempurizada, jamón serrano y salsa napolitana', 38000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Brie Al Horno', 'Queso Brie al horno, miel de agave, nueces, arándanos y pecanas', 29000, 'Entradas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),

-- BEBIDAS
('Limonada Natural', 'Limonada natural refrescante', 9000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Limonada Hierbabuena', 'Limonada con hierbabuena fresca', 11000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Limonada Cerezada', 'Limonada con sabor a cereza', 12000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Limonada Coco', 'Limonada con coco', 14000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Sodificada Piña', 'Bebida gasificada sabor piña', 12000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Sodificada Frutos Rojos', 'Bebida gasificada sabor frutos rojos', 12000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Sodificada Lyche & Fresa', 'Bebida gasificada sabor lichi y fresa', 14000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Gaseosa', 'Gaseosa surtida', 7000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Agua mineral', 'Agua mineral sin gas', 6000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Agua con gas', 'Agua con gas', 6000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Agua St. Pellegrino 1L', 'Agua mineral italiana premium 1 litro', 19000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Sangría Tinto (Copa)', 'Copa de sangría de vino tinto', 24000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Sangría Blanco (Copa)', 'Copa de sangría de vino blanco', 26000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Copa de Vino', 'Copa de vino de la casa', 24000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Tinto de Verano', 'Bebida refrescante con vino tinto', 22000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Gintonic', 'Gin tonic premium', 39000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Mojito', 'Mojito cubano tradicional', 36000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Margarita', 'Margarita clásica', 34000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Piña Colada', 'Piña colada tropical', 32000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Aperol Spritz', 'Aperol Spritz italiano', 25000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Vino Reservado', 'Vino reservado selección especial', 63000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Vino Frontera', 'Vino Frontera', 80000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Vino Gato Negro', 'Vino Gato Negro', 85000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Vino Casillero del Diablo', 'Vino Casillero del Diablo premium', 140000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Vino Tío Pepe', 'Vino Tío Pepe selección especial', 225000, 'Bebidas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),

-- PIZZAS
('Crea Tu Pizza Personal', 'Base napolitana con 6 toppings a elección', 29000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Crea Tu Pizza Mediana', 'Base napolitana con 6 toppings a elección', 46000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Margarita Personal', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry', 19000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Margarita Mediana', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry', 32000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Hawaiana Personal', 'Napolitana, mozzarella, jamón y piña', 21000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Hawaiana Mediana', 'Napolitana, mozzarella, jamón y piña', 34000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Pollo & Champiñones Personal', 'Napolitana, mozzarella, pollo, queso azul y champiñones al ajillo', 24000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Pollo & Champiñones Mediana', 'Napolitana, mozzarella, pollo, queso azul y champiñones al ajillo', 36000, 'Pizzas', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),

-- COCINA ITALIANA
('Spaghetti Alla Bolognese', 'Pasta fresca, salsa bolognesa y parmesano', 36000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Fettuccine Carbonara', 'Salsa carbonara, tocineta crocante, aceite de oliva y parmesano', 39000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Fettuccine Con Camarones', 'Salsa Alfredo, camarones y parmesano', 44000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Spaghetti A Los Cuatro Quesos', 'Queso azul, gorgonzola, mozzarella, parmesano y salsa de champiñones', 39000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Spaghetti Al Teléfono', 'Salsa napolitana, mozzarella de búfala y parmesano', 41000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Ravioles Del Chef', 'Salsa blanca, parmigiana y queso azul', 46000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Lasagna', 'Salsa de quesos, ricotta, albahaca y bolognesa o mixta', 41000, 'Cocina Italiana', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),

-- SÁNDWICHES Y ESPECIALIDADES
('Hamburguesa Italiana', 'Carne angus, tocineta, rúgula, papas a la francesa y queso cheddar', 34000, 'Especialidades', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Brocheta di Manzo', 'Carne y pollo, pimentón, cebolla, papas francesas y ensalada caprese', 35000, 'Especialidades', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Langostinos Parrillados', 'Langostinos a la parrilla con nuditos de ajo', 48000, 'Especialidades', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Brioche al Camarón', 'Camarón tempura, rúgula, queso philadelphia, tomate cherry, pan brioche y papas', 39000, 'Sándwiches', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Brioche Pollo', 'Pollo en salsa blanca, champiñones, rúgula, queso azul, pan brioche y papas', 34000, 'Sándwiches', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Pan Francés & Bondiola de Cerdo', 'Pan francés, bondiola en reducción de cerveza y queso mozzarella', 34000, 'Sándwiches', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),

-- PIZZAS DULCES
('Cocada', 'Arequipe, crema inglesa, coco caramelizado y helado de vainilla', 17000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Lemon Crust', 'Crema de limón, trozos de galleta y ralladura de limón', 17000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Hersheys & Malvaviscos', 'Chocolate, malvaviscos flameados, trozos de galleta y Hersheys', 27000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Dubai Chocolate', 'Chocolate, crema de pistacho, knafeh, pistachos tostados, chocolate blanco', 34000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Caneleta', 'Chocolate, azúcar y canela espolvoreada, helado de vainilla y crema chantilly', 22000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Arándanos & Stracciatella', 'Arándanos caramelizados y queso stracciatella', 28000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Arequipe', 'Arequipe, helado de vainilla y crema chantilly', 17000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Frutos del Bosque', 'Frutos del bosque caramelizados, helado de vainilla y crema chantilly', 18000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Nutella', 'Nutella, helado de vainilla y crema chantilly', 21000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Nutella & Fresas', 'Nutella, queso, fresas y azúcar pulverizada (masa gruesa)', 28000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true),
('Arequipe & Stracciatella', 'Arequipe y queso stracciatella', 28000, 'Pizzas Dulces', '725cb6a5-72dc-4216-9b67-5b173abea49c', '4c8b27f5-893e-4688-bcbf-7fa4526050ee', true);