

## Plan: Remap waiting times from `operating_hours` instead of `time_estimates`

Two surgical one-line edits — change how `times` is constructed so it reads from the new keys inside `operating_hours`.

### Change 1: `supabase/functions/whatsapp-webhook/index.ts` (line 776)

**Before:**
```ts
const times = config.time_estimates || {};
```

**After:**
```ts
const times = { weekday: hours.weekday_waiting_time, weekend: hours.weekend_waiting_time, peak: hours.peak_waiting_time };
```

### Change 2: `supabase/functions/generate-alicia/index.ts` (line 114)

**Before:**
```ts
const times = config.time_estimates || {};
```

**After:**
```ts
const times = { weekday: hours.weekday_waiting_time, weekend: hours.weekend_waiting_time, peak: hours.peak_waiting_time };
```

### What stays the same
- The `timeBlock` string template in both files — unchanged
- All fallbacks (`|| times.weekday`, `|| "~30min"`, `|| "~20min"`) — unchanged
- Peak detection, weekend detection, open/close logic — unchanged
- No DB changes, no order flow changes

### Result
`times.weekday`, `times.weekend`, `times.peak` now resolve from `operating_hours.weekday_waiting_time`, `weekend_waiting_time`, `peak_waiting_time` respectively. Same variable names, same downstream usage, different source.

