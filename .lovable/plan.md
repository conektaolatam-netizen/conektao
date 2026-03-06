

# Plan: Synchronize override removal between daily_overrides and system_overrides

## Problem
When a user clicks the trash icon, `AliciaDailyChat.tsx` removes the override from `whatsapp_configs.daily_overrides` directly via Supabase client. The corresponding `system_overrides` record remains active.

## Approach
The simplest and safest fix is two changes:

### 1. Store `system_override_id` in the daily_override object (edge function)
When `alicia-daily-override` creates a new override, it already returns `system_override_id`. We need to embed this ID inside the `newOverride` object stored in `daily_overrides` JSONB, so we can reference it later during removal.

In `alicia-daily-override/index.ts`, move the `system_overrides` insert **before** writing to `daily_overrides`, then add `system_override_id` to the `newOverride` object.

### 2. Expire `system_overrides` record on removal (frontend)
In `AliciaDailyChat.tsx` → `removeOverride()`, before updating `daily_overrides`, check if the removed override has a `system_override_id`. If so, update `system_overrides` to set `end_time = now()` for that specific record.

```typescript
const removeOverride = async (id: string) => {
  const toRemove = overrides.find((o) => o.id === id);
  const updated = overrides.filter((o) => o.id !== id);
  
  // Expire matching system_override
  if (toRemove?.system_override_id) {
    await supabase
      .from("system_overrides")
      .update({ end_time: new Date().toISOString() })
      .eq("id", toRemove.system_override_id);
  }
  
  await supabase
    .from("whatsapp_configs")
    .update({ daily_overrides: updated })
    .eq("restaurant_id", restaurantId);
  
  setOverrides(updated);
  toast.success("Instrucción eliminada");
};
```

### 3. Update Override interface
Add `system_override_id?: string` to the `Override` interface in `AliciaDailyChat.tsx`.

## Files modified

| File | Change |
|------|--------|
| `supabase/functions/alicia-daily-override/index.ts` | Reorder: insert `system_overrides` first, then embed its ID in the `newOverride` object before saving to `daily_overrides` |
| `src/components/alicia-setup/AliciaDailyChat.tsx` | Add `system_override_id` to interface; expire matching `system_overrides` record in `removeOverride()` |

## What does NOT change
- AI parsing/classification logic
- `validateOrder` or order flow
- `whatsapp-webhook` override enforcement logic
- `system_overrides` records are never deleted, only expired

