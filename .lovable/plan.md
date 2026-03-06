

# Plan: Create `system_overrides` table and persist structured overrides

## Overview

Add a new `system_overrides` table to store structured operational overrides alongside the existing `daily_overrides` JSONB system. When the `alicia-daily-override` edge function processes an instruction, it will additionally write a structured record to `system_overrides`. No backend behavior changes — this is storage-only.

## Step 1: Database migration — Create `system_overrides` table

```sql
CREATE TABLE public.system_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- disable, price_override, enable
  target_type TEXT NOT NULL,    -- product, restaurant, delivery
  target_id UUID,               -- product id or null
  value TEXT,                   -- unavailable, closed, no_delivery, or price string
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners/admins can manage overrides"
  ON public.system_overrides FOR ALL TO authenticated
  USING (public.can_manage_restaurant(restaurant_id))
  WITH CHECK (public.can_manage_restaurant(restaurant_id));

CREATE POLICY "Service role full access"
  ON public.system_overrides FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_system_overrides_restaurant ON public.system_overrides(restaurant_id);
CREATE INDEX idx_system_overrides_active ON public.system_overrides(restaurant_id, end_time);
```

Notes:
- `target_id` is UUID (not integer) to match the existing `products.id` type
- Expired records are kept for historical tracking (no auto-delete)
- RLS allows owners/admins to read/write; service role has full access for edge functions

## Step 2: Update `alicia-daily-override` edge function

After the existing `daily_overrides` JSONB update (which remains unchanged), add logic to:

1. **Expand the AI prompt** to also return structured override fields:
   - `override_type`: `disable | price_override | enable`
   - `target_type`: `product | restaurant | delivery`
   - `product_name`: extracted product name (if applicable)
   - `value`: the override value

2. **Resolve product ID** when `target_type === "product"`:
   - Query `products` table filtered by `restaurant_id` and `is_active = true`
   - Use the same token-based scoring algorithm from `validateOrder()` (token matching on name, description, category with weights +3/+5/+4, containment bonus +2, penalty -1 for extra tokens, shortest name tiebreak)
   - This reuses the proven matching logic without importing from the webhook

3. **Insert into `system_overrides`**:
   - `restaurant_id` from request
   - `type`, `target_type`, `target_id`, `value` from AI + product resolution
   - `start_time` = now
   - `end_time` = end of today (midnight local or UTC end-of-day)

4. **Return** the `system_override_id` in the response alongside the existing override data

## What does NOT change

- The existing `daily_overrides` JSONB in `whatsapp_configs` continues to be written exactly as before
- The `whatsapp-webhook` does not read `system_overrides` — behavior is unchanged
- `AliciaDailyChat.tsx` frontend remains unchanged
- No order blocking, menu filtering, or price modification happens based on `system_overrides`
- The `generate-alicia` function is not modified

## Technical details

- The product scoring logic (~20 lines) will be duplicated inline in the edge function rather than shared, following the safe-refactor-policy of isolated changes
- The AI prompt expansion adds 4 new fields to the expected JSON output; fallbacks ensure the function works even if AI returns incomplete data
- If product resolution fails (no match found), `target_id` is stored as `null` and logged

