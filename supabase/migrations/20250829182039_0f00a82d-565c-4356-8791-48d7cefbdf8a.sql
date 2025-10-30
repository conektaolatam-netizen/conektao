-- Crear todos los productos para La Barra Crea Tu Pizza usando category_id
WITH category_ids AS (
  SELECT id, name FROM categories WHERE user_id = '725cb6a5-72dc-4216-9b67-5b173abea49c'
)
INSERT INTO public.products (name, description, price, category_id, user_id, is_active) 
SELECT * FROM (
  -- ENTRADAS
  SELECT 'Nuditos De Ajo', 'Nuditos horneados en salsa de mantequilla y ajo', 10000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Camarones a las finas hierbas', 'Camarones en salsa a las finas hierbas y parmesano', 32000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Champiñones Gratinados Queso Azul', 'Champiñones con salsa de queso azul y parmesano', 29000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Burrata La Barra', 'Mozzarella de búfala, manzana caramelizada, tomates cherry salteados y pistacho', 34000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Burrata Tempura', 'Mozzarella de búfala tempurizada, jamón serrano y salsa napolitana', 38000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Brie Al Horno', 'Queso Brie al horno, miel de agave, nueces, arándanos y pecanas', 29000, (SELECT id FROM category_ids WHERE name = 'Entradas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  
  -- BEBIDAS  
  UNION ALL SELECT 'Limonada Natural', 'Limonada natural refrescante', 9000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Limonada Hierbabuena', 'Limonada con hierbabuena fresca', 11000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Limonada Cerezada', 'Limonada con sabor a cereza', 12000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Limonada Coco', 'Limonada con coco', 14000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Sodificada Piña', 'Bebida gasificada sabor piña', 12000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Sodificada Frutos Rojos', 'Bebida gasificada sabor frutos rojos', 12000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Sodificada Lyche & Fresa', 'Bebida gasificada sabor lichi y fresa', 14000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Gaseosa', 'Gaseosa surtida', 7000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Agua mineral', 'Agua mineral sin gas', 6000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Agua con gas', 'Agua con gas', 6000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Agua St. Pellegrino 1L', 'Agua mineral italiana premium 1 litro', 19000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Sangría Tinto (Copa)', 'Copa de sangría de vino tinto', 24000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Sangría Blanco (Copa)', 'Copa de sangría de vino blanco', 26000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Copa de Vino', 'Copa de vino de la casa', 24000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Tinto de Verano', 'Bebida refrescante con vino tinto', 22000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Gintonic', 'Gin tonic premium', 39000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Mojito', 'Mojito cubano tradicional', 36000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Margarita', 'Margarita clásica', 34000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Piña Colada', 'Piña colada tropical', 32000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Aperol Spritz', 'Aperol Spritz italiano', 25000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Vino Reservado', 'Vino reservado selección especial', 63000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Vino Frontera', 'Vino Frontera', 80000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Vino Gato Negro', 'Vino Gato Negro', 85000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Vino Casillero del Diablo', 'Vino Casillero del Diablo premium', 140000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Vino Tío Pepe', 'Vino Tío Pepe selección especial', 225000, (SELECT id FROM category_ids WHERE name = 'Bebidas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  
  -- PIZZAS
  UNION ALL SELECT 'Crea Tu Pizza Personal', 'Base napolitana con 6 toppings a elección', 29000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Crea Tu Pizza Mediana', 'Base napolitana con 6 toppings a elección', 46000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Margarita Personal', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry', 19000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Margarita Mediana', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry', 32000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Hawaiana Personal', 'Napolitana, mozzarella, jamón y piña', 21000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Hawaiana Mediana', 'Napolitana, mozzarella, jamón y piña', 34000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Pollo & Champiñones Personal', 'Napolitana, mozzarella, pollo, queso azul y champiñones al ajillo', 24000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Pollo & Champiñones Mediana', 'Napolitana, mozzarella, pollo, queso azul y champiñones al ajillo', 36000, (SELECT id FROM category_ids WHERE name = 'Pizzas'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  
  -- COCINA ITALIANA
  UNION ALL SELECT 'Spaghetti Alla Bolognese', 'Pasta fresca, salsa bolognesa y parmesano', 36000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Fettuccine Carbonara', 'Salsa carbonara, tocineta crocante, aceite de oliva y parmesano', 39000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Fettuccine Con Camarones', 'Salsa Alfredo, camarones y parmesano', 44000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Spaghetti A Los Cuatro Quesos', 'Queso azul, gorgonzola, mozzarella, parmesano y salsa de champiñones', 39000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Spaghetti Al Teléfono', 'Salsa napolitana, mozzarella de búfala y parmesano', 41000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Ravioles Del Chef', 'Salsa blanca, parmigiana y queso azul', 46000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Lasagna', 'Salsa de quesos, ricotta, albahaca y bolognesa o mixta', 41000, (SELECT id FROM category_ids WHERE name = 'Cocina Italiana'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  
  -- ESPECIALIDADES Y SÁNDWICHES
  UNION ALL SELECT 'Hamburguesa Italiana', 'Carne angus, tocineta, rúgula, papas a la francesa y queso cheddar', 34000, (SELECT id FROM category_ids WHERE name = 'Especialidades'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Brocheta di Manzo', 'Carne y pollo, pimentón, cebolla, papas francesas y ensalada caprese', 35000, (SELECT id FROM category_ids WHERE name = 'Especialidades'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Langostinos Parrillados', 'Langostinos a la parrilla con nuditos de ajo', 48000, (SELECT id FROM category_ids WHERE name = 'Especialidades'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Brioche al Camarón', 'Camarón tempura, rúgula, queso philadelphia, tomate cherry, pan brioche y papas', 39000, (SELECT id FROM category_ids WHERE name = 'Sándwiches'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Brioche Pollo', 'Pollo en salsa blanca, champiñones, rúgula, queso azul, pan brioche y papas', 34000, (SELECT id FROM category_ids WHERE name = 'Sándwiches'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Pan Francés & Bondiola de Cerdo', 'Pan francés, bondiola en reducción de cerveza y queso mozzarella', 34000, (SELECT id FROM category_ids WHERE name = 'Sándwiches'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  
  -- PIZZAS DULCES
  UNION ALL SELECT 'Cocada', 'Arequipe, crema inglesa, coco caramelizado y helado de vainilla', 17000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Lemon Crust', 'Crema de limón, trozos de galleta y ralladura de limón', 17000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Hersheys & Malvaviscos', 'Chocolate, malvaviscos flameados, trozos de galleta y Hersheys', 27000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Dubai Chocolate', 'Chocolate, crema de pistacho, knafeh, pistachos tostados, chocolate blanco', 34000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Caneleta', 'Chocolate, azúcar y canela espolvoreada, helado de vainilla y crema chantilly', 22000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Arándanos & Stracciatella', 'Arándanos caramelizados y queso stracciatella', 28000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Arequipe', 'Arequipe, helado de vainilla y crema chantilly', 17000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Frutos del Bosque', 'Frutos del bosque caramelizados, helado de vainilla y crema chantilly', 18000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Nutella', 'Nutella, helado de vainilla y crema chantilly', 21000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Nutella & Fresas', 'Nutella, queso, fresas y azúcar pulverizada (masa gruesa)', 28000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
  UNION ALL SELECT 'Arequipe & Stracciatella', 'Arequipe y queso stracciatella', 28000, (SELECT id FROM category_ids WHERE name = 'Pizzas Dulces'), '725cb6a5-72dc-4216-9b67-5b173abea49c', true
) AS productos;