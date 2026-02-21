-- Remap product categories for cloned restaurant using name matching
UPDATE products AS target
SET category_id = new_cats.id
FROM products AS source
JOIN categories AS old_cat ON source.category_id = old_cat.id AND old_cat.restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755'
JOIN categories AS new_cats ON new_cats.name = old_cat.name AND new_cats.restaurant_id = '993aa350-1a22-4abe-ae30-54fc9c2ef256'
WHERE target.restaurant_id = '993aa350-1a22-4abe-ae30-54fc9c2ef256'
  AND source.restaurant_id = '899cb7a7-7de1-47c7-a684-f24658309755'
  AND target.name = source.name;
