

# Plan: Rename `target_id` → `product_id` in `system_overrides`

## Database Migration

```sql
ALTER TABLE public.system_overrides RENAME COLUMN target_id TO product_id;
```

Single column rename, no data loss, no breaking constraints.

## Code Changes

### 1. `supabase/functions/alicia-daily-override/index.ts` (~line 149)
- Change `target_id: targetId` → `product_id: targetId`

### 2. `supabase/functions/whatsapp-webhook/index.ts` (~lines 174-187)
- In `getDisabledProductIds()`: change `o.target_id` references → `o.product_id`
- In `getPriceOverrides()`: change `o.target_id` references → `o.product_id`

### 3. `src/integrations/supabase/types.ts`
- Auto-updated by the migration tool (no manual edit needed)

## No other files affected
All other `system_overrides` interactions use `id` or other columns, not `target_id`.

