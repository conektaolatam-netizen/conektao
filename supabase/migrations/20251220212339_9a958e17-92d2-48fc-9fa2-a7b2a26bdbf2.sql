-- Insertar categorías faltantes y obtener IDs directamente
DO $$
DECLARE
  user_id_val UUID := 'ec74ccc5-8888-480a-bf16-3891cb10d74d';
  cat_entradas UUID;
  cat_pizza_p UUID := '5598137a-b211-40ad-9a41-2f657b5f0da2';
  cat_pizza_m UUID := '4985c348-69e5-4395-9bd2-d3d5cf228967';
  cat_tapas UUID := '82aa15a0-98e1-424f-a59f-7166d4975c1f';
  cat_italiana UUID;
  cat_buon UUID := '91b2a4b1-d51b-4ac1-aad1-e33a635976f3';
  cat_sandwich UUID := '137a1ee8-253e-4520-b3a5-c958c23c31d7';
  cat_vinos_b UUID := 'd4c5ba8a-4abe-4760-9369-98c830376490';
  cat_dulces UUID;
BEGIN
  -- Crear/obtener categorías faltantes
  INSERT INTO categories (name, user_id, description) VALUES ('Entradas', user_id_val, 'Entradas') 
  ON CONFLICT DO NOTHING RETURNING id INTO cat_entradas;
  IF cat_entradas IS NULL THEN SELECT id INTO cat_entradas FROM categories WHERE name = 'Entradas' AND user_id = user_id_val; END IF;
  
  INSERT INTO categories (name, user_id, description) VALUES ('Cocina Italiana', user_id_val, 'Pastas') 
  ON CONFLICT DO NOTHING RETURNING id INTO cat_italiana;
  IF cat_italiana IS NULL THEN SELECT id INTO cat_italiana FROM categories WHERE name = 'Cocina Italiana' AND user_id = user_id_val; END IF;
  
  INSERT INTO categories (name, user_id, description) VALUES ('Pizzas Dulces', user_id_val, 'Postres') 
  ON CONFLICT DO NOTHING RETURNING id INTO cat_dulces;
  IF cat_dulces IS NULL THEN SELECT id INTO cat_dulces FROM categories WHERE name = 'Pizzas Dulces' AND user_id = user_id_val; END IF;

  -- ENTRADAS
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Nuditos De Ajo', 10000, 'Deliciosos nuditos horneados en salsa de mantequilla y ajo', user_id_val, cat_entradas, true),
  ('Camarones a las finas hierbas', 32000, 'Camarones en reducción con finas hierbas en canasta de parmesano', user_id_val, cat_entradas, true),
  ('Champiñones Gratinados Queso Azul', 29000, '5 champiñones bañados en salsa de queso azul con parmesano', user_id_val, cat_entradas, true),
  ('Burrata La Barra', 34000, 'Mozzarella de búfala, manzanas caramelizadas, tomates cherry y pistacho', user_id_val, cat_entradas, true),
  ('Burrata Tempura', 38000, 'Mozzarella de búfala tempurizada, jamón serrano y salsa napolitana', user_id_val, cat_entradas, true),
  ('Brie Al Horno', 29000, 'Queso Brie al horno con miel de agave, nueces pecanas, pera y arándanos', user_id_val, cat_entradas, true);

  -- PIZZAS PERSONAL
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Pepperoni Personal', 29000, 'Napolitana, mozzarella, pepperoni, parmesano', user_id_val, cat_pizza_p, true),
  ('Del huerto Personal', 32000, 'Napolitana, mozzarella, queso azul, rúgula, tomate cherry, champiñón', user_id_val, cat_pizza_p, true),
  ('Camarones Personal', 35000, 'Salsa Alfredo, mozzarella, camarones salteados al ajillo', user_id_val, cat_pizza_p, true),
  ('La Capricciosa Personal', 32000, 'Crema parmigiana, mozzarella, tomates cherry, jamón prosciutto, champiñones, aceitunas', user_id_val, cat_pizza_p, true),
  ('Colombiana de la Tata Personal', 28000, 'Salsa criolla, bondiola de cerdo, mozzarella, cebolla morada, maíz', user_id_val, cat_pizza_p, true),
  ('Alpes Personal', 29000, '4 quesos: crema parmigiana, mozzarella, gouda y queso azul', user_id_val, cat_pizza_p, true),
  ('La Turca Personal', 36000, 'Napolitana, mozzarella, dátiles, queso azul, pistachos, rúgula, chorizo español, tocineta', user_id_val, cat_pizza_p, true),
  ('A la española Personal', 32000, 'Napolitana, mozzarella, pecorino, chorizo español, peperoncino', user_id_val, cat_pizza_p, true),
  ('Siciliana Personal', 32000, 'Napolitana, mozzarella, chorizo español, salame italiano, pepperoni, pimentón', user_id_val, cat_pizza_p, true),
  ('Dátiles Personal', 33000, 'Napolitana, mozzarella, dátiles, tocineta, queso azul y parmesano', user_id_val, cat_pizza_p, true),
  ('La Barra Personal', 32000, 'Napolitana, mozzarella, queso azul, manzana caramelizada, rúgula, prosciutto, pecanas', user_id_val, cat_pizza_p, true),
  ('Stracciatella Personal', 35000, 'Napolitana, mozzarella, tomate seco, pepperoni, rúgula y stracciatella', user_id_val, cat_pizza_p, true),
  ('Anchoas Personal', 36000, 'Napolitana, mozzarella, salame, pimentón y anchoas', user_id_val, cat_pizza_p, true),
  ('Valencia Personal', 36000, 'Napolitana, mozzarella, chorizo español, prosciutto, aceitunas, queso azul, dátiles', user_id_val, cat_pizza_p, true),
  ('Parmesana Personal', 34000, 'Napolitana, mozzarella, pepperoni, queso azul, perejil al ajillo, parmesano', user_id_val, cat_pizza_p, true),
  ('Higos Personal', 34000, 'Napolitana, mozzarella, higos caramelizados, pollo en gorgonzola, rúgula, pistacho', user_id_val, cat_pizza_p, true),
  ('Calzone Personal', 29000, 'Napolitana, mozzarella, queso Philadelphia, champiñón y jamón', user_id_val, cat_pizza_p, true);

  -- PIZZAS MEDIANA
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Pepperoni Mediana', 42000, 'Napolitana, mozzarella, pepperoni, parmesano', user_id_val, cat_pizza_m, true),
  ('Del huerto Mediana', 45000, 'Napolitana, mozzarella, queso azul, rúgula, tomate cherry, champiñón', user_id_val, cat_pizza_m, true),
  ('Camarones Mediana', 49000, 'Salsa Alfredo, mozzarella, camarones salteados al ajillo', user_id_val, cat_pizza_m, true),
  ('La Capricciosa Mediana', 48000, 'Crema parmigiana, mozzarella, tomates cherry, jamón prosciutto, champiñones', user_id_val, cat_pizza_m, true),
  ('Colombiana de la Tata Mediana', 44000, 'Salsa criolla, bondiola de cerdo, mozzarella, cebolla morada, maíz', user_id_val, cat_pizza_m, true),
  ('Alpes Mediana', 46000, '4 quesos: crema parmigiana, mozzarella, gouda y queso azul', user_id_val, cat_pizza_m, true),
  ('La Turca Mediana', 49000, 'Napolitana, mozzarella, dátiles, queso azul, pistachos, chorizo español, tocineta', user_id_val, cat_pizza_m, true),
  ('Porchetta Mediana', 49000, 'Salsa napolitana, porchetta italiana, piña a la parrilla y stracciatella', user_id_val, cat_pizza_m, true),
  ('A la española Mediana', 46000, 'Napolitana, mozzarella, pecorino, chorizo español, peperoncino', user_id_val, cat_pizza_m, true),
  ('Siciliana Mediana', 46000, 'Napolitana, mozzarella, chorizo español, salame italiano, pepperoni, pimentón', user_id_val, cat_pizza_m, true),
  ('Dátiles Mediana', 47000, 'Napolitana, mozzarella, dátiles, tocineta, queso azul y parmesano', user_id_val, cat_pizza_m, true),
  ('La Barra Mediana', 46000, 'Napolitana, mozzarella, queso azul, manzana caramelizada, rúgula, prosciutto', user_id_val, cat_pizza_m, true),
  ('Prosciutto & Burrata Mediana', 49000, 'Napolitana, mozzarella, prosciutto, rúgula y burrata', user_id_val, cat_pizza_m, true),
  ('Stracciatella Mediana', 49000, 'Napolitana, mozzarella, tomate seco, pepperoni, rúgula y stracciatella', user_id_val, cat_pizza_m, true),
  ('Anchoas Mediana', 49000, 'Napolitana, mozzarella, salame, pimentón y anchoas', user_id_val, cat_pizza_m, true),
  ('Pulpo Mediana', 49000, 'Napolitana, mozzarella, pulpo al ajillo, tomate parrillado y stracciatella', user_id_val, cat_pizza_m, true),
  ('Valencia Mediana', 49000, 'Napolitana, mozzarella, chorizo español, prosciutto, aceitunas, queso azul, dátiles', user_id_val, cat_pizza_m, true),
  ('Parmesana Mediana', 48000, 'Napolitana, mozzarella, pepperoni, queso azul, perejil al ajillo, parmesano', user_id_val, cat_pizza_m, true),
  ('Higos Mediana', 48000, 'Napolitana, mozzarella, higos caramelizados, pollo en gorgonzola, rúgula', user_id_val, cat_pizza_m, true);

  -- TAPAS ESPAÑOLAS
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Tapas Españolas', 36000, 'Pan francés con queso Philadelphia. 4 tapas variadas a elegir', user_id_val, cat_tapas, true);

  -- COCINA ITALIANA
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Spaghetti Alla Bolognese', 36000, 'Pasta fresca en salsa bolognesa con parmesano rallado', user_id_val, cat_italiana, true),
  ('Fettuccine Carbonara', 39000, 'Pasta en salsa carbonara con tocineta crocante y parmesano', user_id_val, cat_italiana, true),
  ('Fettuccine Con Camarones', 44000, 'Pasta en salsa Alfredo con camarones y parmesano', user_id_val, cat_italiana, true),
  ('Spaghetti A Los Cuatro Quesos', 39000, 'Pasta con queso azul, gorgonzola, mozzarella, parmesano y champiñones', user_id_val, cat_italiana, true),
  ('Spaghetti Al Teléfono', 41000, 'Pasta en salsa napolitana con mozzarella de búfala y parmesano', user_id_val, cat_italiana, true),
  ('Ravioles Del Chef', 46000, 'Ravioles de carne en salsa blanca con parmigiana y queso azul', user_id_val, cat_italiana, true),
  ('Lasagna', 41000, 'Lasagna bolognese o mixta en salsa de quesos, ricotta y albahaca', user_id_val, cat_italiana, true);

  -- BUON APPETITO (Hamburguesas y carnes)
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Hamburguesa Italiana', 34000, '150gr de carne angus, tocineta, rúgula, papas a la francesa y cheddar', user_id_val, cat_buon, true),
  ('Brocheta di manzo', 35000, 'Carne de res y pollo con pimentón y cebolla, papas y ensalada caprese', user_id_val, cat_buon, true),
  ('Langostinos Parrillados', 48000, 'Brocheta de langostinos a la parrilla con nuditos de ajo', user_id_val, cat_buon, true);

  -- SANDWICHES
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Brioche al camarón', 39000, 'Camarón tempura, rúgula, queso Philadelphia, tomate cherry y papas', user_id_val, cat_sandwich, true),
  ('Brioche pollo', 34000, 'Pollo en salsa blanca, champiñones, rúgula, queso azul y papas', user_id_val, cat_sandwich, true),
  ('Pan Francés & Bondiola De Cerdo', 34000, 'Pan francés, bondiola en reducción de cerveza y mozzarella', user_id_val, cat_sandwich, true);

  -- VINOS BOTELLA
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Reservado Botella', 63000, 'Vino de la casa recomendado', user_id_val, cat_vinos_b, true),
  ('Frontera Botella', 80000, 'Vino tinto Frontera', user_id_val, cat_vinos_b, true),
  ('Gato Negro Botella', 85000, 'Vino tinto Gato Negro', user_id_val, cat_vinos_b, true),
  ('Casillero Del Diablo Botella', 140000, 'Vino tinto Casillero Del Diablo', user_id_val, cat_vinos_b, true),
  ('Tio Pepe Botella', 225000, 'Vino Tío Pepe', user_id_val, cat_vinos_b, true);

  -- PIZZAS DULCES
  INSERT INTO products (name, price, description, user_id, category_id, is_active) VALUES
  ('Cocada Dulce', 17000, 'Arequipe y crema inglesa, coco caramelizado y helado de vainilla', user_id_val, cat_dulces, true),
  ('Lemon Crust Dulce', 17000, 'Crema de limón, trozos de galleta y ralladura de limón', user_id_val, cat_dulces, true),
  ('Hersheys & Malvaviscos', 27000, 'Chocolate, malvaviscos flameados, trozos de galleta y Hersheys', user_id_val, cat_dulces, true),
  ('Dubai Chocolate', 34000, 'Chocolate, crema de pistacho, knafeh, pistachos tostados y chocolate blanco', user_id_val, cat_dulces, true),
  ('Canelate Dulce', 22000, 'Chocolate, azúcar y canela, helado de vainilla y crema chantilly', user_id_val, cat_dulces, true),
  ('Arándanos & Stracciatella', 28000, 'Arándanos caramelizados y queso stracciatella', user_id_val, cat_dulces, true),
  ('Arequipe Dulce', 17000, 'Arequipe, helado de vainilla y crema chantilly', user_id_val, cat_dulces, true),
  ('Frutos Del Bosque Dulce', 18000, 'Frutos del bosque caramelizados, helado y crema chantilly', user_id_val, cat_dulces, true),
  ('Nutella Dulce', 21000, 'Nutella, helado de vainilla y crema chantilly', user_id_val, cat_dulces, true),
  ('Nutella & Fresas', 28000, 'Nutella, queso, fresas y azúcar pulverizada (masa gruesa)', user_id_val, cat_dulces, true),
  ('Arequipe & Stracciatella', 28000, 'Arequipe y queso stracciatella', user_id_val, cat_dulces, true);
END $$;