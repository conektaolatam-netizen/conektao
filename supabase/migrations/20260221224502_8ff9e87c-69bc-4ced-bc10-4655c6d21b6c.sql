-- Drop the global unique constraint on category name (it should be unique per restaurant, not globally)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add a composite unique constraint per restaurant
ALTER TABLE public.categories ADD CONSTRAINT categories_name_restaurant_unique UNIQUE (name, restaurant_id);
