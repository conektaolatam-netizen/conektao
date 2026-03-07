

# Plan: Normalize timezone across all Edge Functions

## Summary

Create shared timezone helpers and apply them across 6 edge functions, replacing `getColombiaTime()` and raw `new Date().toISOString().split("T")[0]` patterns with config-driven timezone logic read from `whatsapp_configs.operating_hours.timezone`.

## Shared Helper: `getRestaurantTimezone`

Two pure utility functions to add at the top of each edge function that needs them (Deno edge functions can't share files, so they'll be inlined):

```typescript
/** Parse "UTC-5", "UTC+1" etc. into offset hours */
function parseTimezoneOffset(tz: string): number {
  if (!tz) return -5; // safe default: Colombia
  const match = tz.match(/^UTC([+-]?\d+)$/i);
  return match ? parseInt(match[1]) : -5;
}

/** Get current Date shifted to restaurant's local timezone */
function getRestaurantTime(offsetHours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + (offsetHours * 60 + now.getTimezoneOffset()) * 60000);
}

/** Get "YYYY-MM-DD" in restaurant's timezone */
function getRestaurantDate(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  return local.toISOString().split("T")[0];
}

/** Get end-of-day in restaurant's timezone, returned as UTC ISO string */
function getRestaurantEndOfDayUTC(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  // Set to 23:59:59.999 local
  local.setHours(23, 59, 59, 999);
  // Convert back to UTC by reversing the offset
  const utc = new Date(local.getTime() - (offsetHours * 60 + new Date().getTimezoneOffset()) * 60000);
  return utc.toISOString();
}
```

## Changes by file

### 1. `whatsapp-webhook/index.ts`

**Already has** `config.operating_hours` loaded. Changes:

- **Replace `getColombiaTime()`** with a new `getRestaurantTimeInfo(config)` that reads `config.operating_hours.timezone` and uses `getRestaurantTime(offset)`:

```typescript
function getRestaurantTimeInfo(config: any) {
  const tz = config?.operating_hours?.timezone || "UTC-5";
  const offset = parseTimezoneOffset(tz);
  const local = getRestaurantTime(offset);
  const h = local.getHours();
  const m = local.getMinutes();
  const d = local.getDay();
  return { hour: h, minute: m, day: d, weekend: d === 5 || d === 6, decimal: h + m / 60 };
}
```

- **5 call sites** of `getColombiaTime()` change to `getRestaurantTimeInfo(config)`:
  - `isPeakNow()` (line 90) — pass config instead of just hours
  - `isRestaurantOpen()` (line 125) — already receives config
  - `buildPrompt()` (line 814) — already has config
  - `buildDynamicPrompt()` (line 878) — already has config
  
- **1 date literal** at line 899: `new Date().toISOString().split("T")[0]` → `getRestaurantDate(parseTimezoneOffset(config?.operating_hours?.timezone || "UTC-5"))`

- **Keep** `getColombiaTime()` function body but rename to `getRestaurantTimeInfo(config)`. The old function is removed.

### 2. `alicia-daily-override/index.ts`

**Two bugs to fix:**

- Line 102: `const today = new Date().toISOString().split("T")[0]` — uses UTC date
- Line 136-137: `endOfDay.setUTCHours(23, 59, 59, 999)` — expires at 7 PM Colombia time

**Changes:**

- Add `parseTimezoneOffset`, `getRestaurantTime`, `getRestaurantDate`, `getRestaurantEndOfDayUTC` helpers
- Before using date logic, fetch timezone from `whatsapp_configs`:

```typescript
const { data: tzConfig } = await supabase
  .from("whatsapp_configs")
  .select("operating_hours")
  .eq("restaurant_id", restaurant_id)
  .maybeSingle();

const offset = parseTimezoneOffset(tzConfig?.operating_hours?.timezone);
const today = getRestaurantDate(offset);
```

- Replace `endOfDay` calculation:

```typescript
const endOfDayUTC = getRestaurantEndOfDayUTC(offset);
```

### 3. `ai-daily-analysis/index.ts`

- Line 112: `const today = new Date().toISOString().split('T')[0]` — UTC date for sales query
- Line 274: `reset_date` uses UTC date

**Changes:**

- Add helpers + fetch timezone from `whatsapp_configs` using `restaurantId` (already available at line 79)
- Replace `today` with `getRestaurantDate(offset)`

### 4. `ai-daily-recommendations/index.ts`

- Lines 86-88: `todayStr`, `yesterdayStr`, `lastWeekStr` all use UTC dates

**Changes:**

- Add helpers + fetch timezone
- Calculate date strings using restaurant timezone:

```typescript
const offset = parseTimezoneOffset(tzConfig?.operating_hours?.timezone);
const localNow = getRestaurantTime(offset);
const todayStr = getRestaurantDate(offset);
// yesterday/lastWeek: shift localNow by days, then format
```

### 5. `conektao-ai/index.ts`

- Line 113: `const today = new Date().toISOString().split("T")[0]` — used for cash register and kitchen order queries

**Changes:**

- Add helpers + fetch timezone from `whatsapp_configs` using `restaurantId` (available at line 84)
- Replace `today` with `getRestaurantDate(offset)`

### 6. `daily-close-receipts/index.ts`

- Line 37: `const targetDate = closeDate || new Date().toISOString().split('T')[0]`

**Changes:**

- Add helpers + fetch timezone from `whatsapp_configs` using `restaurantId`
- Only apply timezone correction when `closeDate` is not provided (caller may pass explicit date)

## What does NOT change

| Item | Reason |
|------|--------|
| Database storage format | Still UTC |
| `src/lib/date.ts` / `getLocalDayRange()` | Frontend uses browser timezone — correct |
| `AliciaDailyChat.tsx` | Frontend component, no change needed |
| `system_overrides` queries | Use `start_time`/`end_time` UTC comparison — correct |
| `validateOrder` | Not touched |
| `saveOrder` | Not touched |
| `business-analysis/index.ts` | Receives date from caller, no self-generated date |
| `update-inventory-from-receipt` | Uses document dates from receipt data, not business-day logic |
| `seed-*` functions | Demo data, not business logic |
| `admin-ai-analytics` | Admin analytics, cross-restaurant — UTC is acceptable |

## Safety

- Default offset is `-5` (Colombia) if `timezone` field is missing — backward compatible
- All changes are additive (new helper functions) + surgical replacements of date patterns
- No function signatures change
- No DB schema changes needed (`operating_hours` JSON already has the `timezone` field)

## Files modified

| File | Lines added | Lines changed |
|------|-------------|---------------|
| `supabase/functions/whatsapp-webhook/index.ts` | ~25 (helpers) | ~10 (call sites) |
| `supabase/functions/alicia-daily-override/index.ts` | ~25 (helpers + tz fetch) | ~5 |
| `supabase/functions/ai-daily-analysis/index.ts` | ~25 (helpers + tz fetch) | ~3 |
| `supabase/functions/ai-daily-recommendations/index.ts` | ~25 (helpers + tz fetch) | ~5 |
| `supabase/functions/conektao-ai/index.ts` | ~25 (helpers + tz fetch) | ~3 |
| `supabase/functions/daily-close-receipts/index.ts` | ~25 (helpers + tz fetch) | ~2 |

