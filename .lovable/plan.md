

# Plan: Support custom end time for daily overrides (UTC-normalized)

## Problem
Currently all overrides expire at local midnight (23:59:59). The owner should be able to say "cerrado hasta las 5pm" or "precio de la pizza a 35000 hasta las 8pm" and have the override expire at that specific hour instead.

## Changes

### 1. AI parser prompt — extract `until_hour` field

In `supabase/functions/alicia-daily-override/index.ts` (lines 59-74), update the system prompt to include a new `until_hour` field in the JSON format:

```json
{
  ...existing fields...,
  "until_hour": "HH:mm o null si no se indica hora específica"
}
```

Add examples:
- "cerrado hasta las 5pm" → `"until_hour": "17:00"`
- "no hay domicilio hasta las 6" → `"until_hour": "18:00"`
- "pizza hawaiana a 20000 hasta las 8pm" → `"until_hour": "20:00"`
- "se acabó la pepperoni" (no hour) → `"until_hour": null`

### 2. New helper function — convert local hour to UTC ISO string

Add a function `getLocalHourAsUTC(offsetHours, hourStr)` that:
1. Takes the restaurant's UTC offset and an "HH:mm" string
2. Gets today's restaurant date
3. Builds a local datetime at that hour
4. Converts to UTC for DB storage
5. Falls back to end-of-day if the parsed hour is already past

```typescript
function getLocalHourAsUTC(offsetHours: number, hourStr: string): string {
  const local = getRestaurantTime(offsetHours);
  const [h, m] = hourStr.split(":").map(Number);
  local.setHours(h, m || 0, 0, 0);
  // Convert local back to UTC
  const utc = new Date(local.getTime() - (offsetHours * 60 + new Date().getTimezoneOffset()) * 60000);
  return utc.toISOString();
}
```

### 3. Use `until_hour` to compute `end_time` (line ~141)

Replace the current hardcoded end-of-day:

```typescript
const endOfDayUTC = getRestaurantEndOfDayUTC(tzOffset);
```

With:

```typescript
const endTimeUTC = parsed.until_hour
  ? getLocalHourAsUTC(tzOffset, parsed.until_hour)
  : getRestaurantEndOfDayUTC(tzOffset);
```

Use `endTimeUTC` in both the `system_overrides` insert (`end_time`) and optionally in the daily override instruction text.

### 4. Update instruction text to reflect the hour

The AI-generated `instruction` field should already mention the hour naturally (e.g., "Hoy NO hay domicilio hasta las 6pm"). The prompt examples guide this. No extra logic needed — the AI parser handles it in the `instruction` field.

## Files changed
- `supabase/functions/alicia-daily-override/index.ts` — prompt update, new helper, end_time logic

## No other files change
- `whatsapp-webhook` already filters by `end_time > now()`, so time-limited overrides will automatically stop being enforced when the hour passes.
- `AliciaDailyChat.tsx` — no change needed, displays `instruction` text as-is.

