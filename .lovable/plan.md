

# Plan: Extended Hours per Day with Full Backend Logic

## Summary

Replace the "¿A veces se extienden del horario?" toggle with an expandable "Opciones de horario extendido" section. When enabled, the user selects specific days and configures alternate open/close and service start/end times. The backend will use these extended hours instead of the normal ones on matching days.

## New Fields in `operating_hours` (JSONB)

```text
may_extend: boolean (unchanged)
extended_days: string[]              // e.g. ["viernes", "sabado"]
extended_open_time: string           // e.g. "07:00"
extended_close_time: string          // e.g. "23:00"
extended_schedule_start: string      // e.g. "12:00"
extended_schedule_end: string        // e.g. "23:00"
```

No DB migration needed — these are new keys inside the existing JSONB column.

## Files to Change

### 1. `src/components/alicia-config/AliciaConfigSchedule.tsx`
- Rename the `mayExtend` toggle label to "Opciones de horario extendido"
- When `mayExtend` is true, show:
  - Day selector (reuse `DaySelector` with `ALL_DAYS` options) for `extended_days`
  - Two time inputs: extended open/close
  - Two time inputs: extended service start/end
- Add state for the 5 new fields, initialize from `h.extended_*`
- Include all 5 new fields in `handleSave`

### 2. `supabase/functions/whatsapp-webhook/index.ts`

#### Helper function: `getEffectiveHours(hours)`
Create a small helper that checks if today is an extended day and returns the effective open/close/schedule_start/schedule_end:
```text
function getEffectiveHours(hours, currentDay):
  if hours.may_extend AND currentDay in extended_days:
    return {
      open_time: extended_open_time || open_time,
      close_time: extended_close_time || close_time,
      schedule_start: extended_schedule_start || schedule_start,
      schedule_end: extended_schedule_end || schedule_end
    }
  else:
    return { open_time, close_time, schedule_start, schedule_end }
```

#### Update `checkRestaurantAvailability` (lines 207-399)
- After computing `currentDay` (line 231), call `getEffectiveHours(hours, currentDay)` to get the effective times
- Use `effective.open_time` / `effective.close_time` in Priority 4 (lines 335-351)
- Use `effective.schedule_start` / `effective.schedule_end` as initial values in Priority 5 (lines 354-355)

#### Update `isRestaurantOpen` (lines 145-163)
- Call `getEffectiveHours` using the current day to resolve `open_time`, `close_time`, `schedule_start` so pre-order logic uses extended values on extended days

### 3. `supabase/functions/generate-alicia/index.ts`
- In the schedule block section, if `may_extend` and `extended_days` exist, include the extended schedule info in the generated prompt so the AI knows about the alternate hours.

## How It Works (Example)

Normal: open 08:00-22:00, service 15:40-22:00
Extended (Fri/Sat): open 07:00-23:00, service 12:00-23:00

On Friday: the system uses 07:00-23:00 for open/close and 12:00-23:00 for service. Pre-orders work between 07:00-12:00 if `accept_pre_orders` is true. All override logic (system_overrides, daily_overrides) continues to layer on top as before.

On Wednesday: normal hours apply (08:00-22:00, service 15:40-22:00).

