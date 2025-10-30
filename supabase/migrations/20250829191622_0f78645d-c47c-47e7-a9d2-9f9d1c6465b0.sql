-- First, find the user ID for labarracreatupizza@gmail.com
DO $$
DECLARE
    target_user_id uuid;
    personal_category_id uuid;
    mediana_category_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE email = 'labarracreatupizza@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User labarracreatupizza@gmail.com not found';
    END IF;

    -- Delete the 8 specific pizzas (Margarita, Hawaiana, Pollo & Champiñones in personal and mediana)
    DELETE FROM products 
    WHERE user_id = target_user_id 
    AND name IN ('Margarita Personal', 'Margarita Mediana', 'Hawaiana Personal', 'Hawaiana Mediana', 
                'Pollo & Champiñones Personal', 'Pollo & Champiñones Mediana');

    -- Create new categories for Personal and Medium pizzas
    INSERT INTO categories (name, description, user_id)
    VALUES 
        ('Pizzas Personales', 'Pizzas individuales', target_user_id),
        ('Pizzas Medianas', 'Pizzas medianas', target_user_id);
    
    -- Get the category IDs
    SELECT id INTO personal_category_id FROM categories WHERE name = 'Pizzas Personales' AND user_id = target_user_id;
    SELECT id INTO mediana_category_id FROM categories WHERE name = 'Pizzas Medianas' AND user_id = target_user_id;

    -- Insert Personal Pizzas
    INSERT INTO products (name, description, price, category_id, user_id, is_active) VALUES
    ('Margarita', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry.', 19000, personal_category_id, target_user_id, true),
    ('Hawaiana', 'Salsa napolitana, queso mozzarella, jamón, piña.', 21000, personal_category_id, target_user_id, true),
    ('Pollo & Champiñones', 'Napolitana, mozzarella, pollo, queso azul, champiñones al ajillo.', 24000, personal_category_id, target_user_id, true),
    ('Pepperoni', 'Napolitana, mozzarella, pepperoni, parmesano.', 29000, personal_category_id, target_user_id, true),
    ('Del Huerto', 'Napolitana, mozzarella, queso azul, rúgula, tomate cherry, champiñón, salsa César, parmesano.', 32000, personal_category_id, target_user_id, true),
    ('Camarones', 'Salsa Alfredo, mozzarella, camarones salteados al ajillo.', 35000, personal_category_id, target_user_id, true),
    ('La Capricciosa', 'Crema parmigiana, mozzarella, tomates cherry, jamón prosciutto, champiñones, aceitunas, alcachofas y oliva.', 32000, personal_category_id, target_user_id, true),
    ('Colombiana de la Tata', 'Salsa criolla, bondiola, cebolla morada, maíz, reducción de cerveza.', 28000, personal_category_id, target_user_id, true),
    ('Alpes', '4 quesos: parmigiana, mozzarella, gouda y azul.', 29000, personal_category_id, target_user_id, true),
    ('La Turca', 'Dátiles caramelizados, queso azul, chorizo, tocineta, rúgula, pera, parmesano, aceite al peperoncino.', 36000, personal_category_id, target_user_id, true),
    ('A la Española', 'Napolitana, mozzarella, pecorino, chorizo español, peperoncino.', 32000, personal_category_id, target_user_id, true),
    ('Siciliana', 'Chorizo español, salame, peperoni, pimentón, cebolla.', 32000, personal_category_id, target_user_id, true),
    ('Dátiles', 'Dátiles, tocineta, queso azul, parmesano.', 33000, personal_category_id, target_user_id, true),
    ('La Barra', 'Queso azul, manzana caramelizada, rúgula, jamón prosciutto, nueces, miel de peperoncino.', 32000, personal_category_id, target_user_id, true),
    ('Stracciatella', 'Tomate seco, peperoni, rúgula, stracciatella.', 35000, personal_category_id, target_user_id, true),
    ('Anchoas', 'Salame, pimentón, anchoas.', 36000, personal_category_id, target_user_id, true),
    ('Valencia', 'Chorizo español, prosciutto, aceitunas, queso azul, dátiles.', 36000, personal_category_id, target_user_id, true),
    ('Parmesana', 'Pepperoni, queso azul, perejil al ajillo, parmesano tostado.', 34000, personal_category_id, target_user_id, true),
    ('Higos', 'Higos caramelizados, pollo, queso gorgonzola, rúgula, balsámico y pistacho.', 34000, personal_category_id, target_user_id, true),
    ('Calzone', 'Mozzarella, philadelphia, champiñón y jamón.', 29000, personal_category_id, target_user_id, true);

    -- Insert Medium Pizzas
    INSERT INTO products (name, description, price, category_id, user_id, is_active) VALUES
    ('Margarita', 'Napolitana, mozzarella, boconccinos, albahaca y tomate cherry.', 32000, mediana_category_id, target_user_id, true),
    ('Hawaiana', 'Salsa napolitana, queso mozzarella, jamón, piña.', 34000, mediana_category_id, target_user_id, true),
    ('Pollo & Champiñones', 'Napolitana, mozzarella, pollo, queso azul, champiñones al ajillo.', 36000, mediana_category_id, target_user_id, true),
    ('Pepperoni', 'Napolitana, mozzarella, pepperoni, parmesano.', 42000, mediana_category_id, target_user_id, true),
    ('Del Huerto', 'Napolitana, mozzarella, queso azul, rúgula, tomate cherry, champiñón, salsa César, parmesano.', 45000, mediana_category_id, target_user_id, true),
    ('Camarones', 'Salsa Alfredo, mozzarella, camarones salteados al ajillo.', 49000, mediana_category_id, target_user_id, true),
    ('La Capricciosa', 'Crema parmigiana, mozzarella, tomates cherry, jamón prosciutto, champiñones, aceitunas, alcachofas y oliva.', 48000, mediana_category_id, target_user_id, true),
    ('Colombiana de la Tata', 'Salsa criolla, bondiola, cebolla morada, maíz, reducción de cerveza.', 44000, mediana_category_id, target_user_id, true),
    ('Alpes', '4 quesos: parmigiana, mozzarella, gouda y azul.', 46000, mediana_category_id, target_user_id, true),
    ('La Turca', 'Dátiles caramelizados, queso azul, chorizo, tocineta, rúgula, pera, parmesano, aceite al peperoncino.', 49000, mediana_category_id, target_user_id, true),
    ('Porchetta', 'Especial del chef.', 49000, mediana_category_id, target_user_id, true),
    ('A la Española', 'Napolitana, mozzarella, pecorino, chorizo español, peperoncino.', 46000, mediana_category_id, target_user_id, true),
    ('Siciliana', 'Chorizo español, salame, peperoni, pimentón, cebolla.', 46000, mediana_category_id, target_user_id, true),
    ('Dátiles', 'Dátiles, tocineta, queso azul, parmesano.', 47000, mediana_category_id, target_user_id, true),
    ('La Barra', 'Queso azul, manzana caramelizada, rúgula, jamón prosciutto, nueces, miel de peperoncino.', 46000, mediana_category_id, target_user_id, true),
    ('Prosciutto & Burrata', 'Jamón prosciutto y burrata.', 49000, mediana_category_id, target_user_id, true),
    ('Stracciatella', 'Tomate seco, peperoni, rúgula, stracciatella.', 49000, mediana_category_id, target_user_id, true),
    ('Anchoas', 'Salame, pimentón, anchoas.', 49000, mediana_category_id, target_user_id, true),
    ('Pulpo', 'Pizza con pulpo.', 49000, mediana_category_id, target_user_id, true),
    ('Valencia', 'Chorizo español, prosciutto, aceitunas, queso azul, dátiles.', 49000, mediana_category_id, target_user_id, true),
    ('Parmesana', 'Pepperoni, queso azul, perejil al ajillo, parmesano tostado.', 48000, mediana_category_id, target_user_id, true),
    ('Higos', 'Higos caramelizados, pollo, queso gorgonzola, rúgula, balsámico y pistacho.', 48000, mediana_category_id, target_user_id, true);

END $$;