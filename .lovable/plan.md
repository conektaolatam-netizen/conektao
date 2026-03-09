

# Plan: Add product_name, category_name, and category_id columns to system_overrides

## Problem
The `system_overrides` table only stores `target_id` (product UUID) and `value`, making it hard to read in the dashboard without joining to products/categories. The user wants to see the product name and category info directly in the table.

## Changes

### 1. Database migration — add 3 columns

```sql
ALTER TABLE public.system_overrides
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS category_name text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
```

All nullable, no breaking changes.

### 2. `supabase/functions/alicia-daily-override/index.ts` — populate new columns on insert

In the insert block (~line 134-146), after resolving the product match, capture `match.name` and `match.category_name`, then query for `category_id`. Add these to the insert payload:

```js
product_name: match?.name || parsed.product_name || null,
category_name: match?.category_name || null,
category_id: matchedCategoryId || null,
```

To get `category_id`, query the product's `category_id` from the products table (already fetched at line 109-113, just need to include `category_id` in the select).

### 3. No other files change

- `whatsapp-webhook/index.ts` — reads `system_overrides` but doesn't need these columns for logic
- `AliciaDailyChat.tsx` — interacts via `system_override_id` only, no change needed

