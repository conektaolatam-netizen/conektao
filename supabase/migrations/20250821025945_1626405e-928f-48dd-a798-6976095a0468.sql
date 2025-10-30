-- Remove all categories except "Todos"
DELETE FROM categories 
WHERE name != 'Todos' AND user_id IS NULL;

-- Keep only one "Todos" category if there are duplicates
DELETE FROM categories a USING categories b 
WHERE a.id > b.id AND a.name = 'Todos' AND a.user_id IS NULL;