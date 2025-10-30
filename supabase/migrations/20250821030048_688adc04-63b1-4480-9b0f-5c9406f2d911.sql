-- First, update products to use NULL category (or create a general category)
UPDATE products SET category_id = NULL 
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE name != 'Todos' AND user_id IS NULL
);

-- Now remove all categories except "Todos"  
DELETE FROM categories 
WHERE name != 'Todos' AND user_id IS NULL;