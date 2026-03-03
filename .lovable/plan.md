

## Plan: Safe Refactor — Operating Hours JSON Structure

### Changes (5 surgical edits, no other logic touched)

#### 1. Top-level constant (line ~55 area)
Add `FINAL_ORDER_STATUSES` constant at the top of the file:
```ts
const FINAL_ORDER_STATUSES = ["confirmed", "emailed", "sent"];
```

#### 2. `getColombiaTime()` (lines 64-77) — Structured peak hours
Remove the hardcoded `(d === 5 || d === 6) && h >= 18 && h <= 22` peak logic. Instead, return only `hour, minute, day, weekend, decimal` — no more `peak` in the return value. Add a new helper function `isPeakNow(hours: any)` that reads `peak_days`, `peak_hour_start`, `peak_hour_end` from the operating_hours object:
- Maps day names ("Lunes"→1, "Martes"→2, … "Domingo"→0) to JS day numbers
- Parses `peak_hour_start`/`peak_hour_end` (e.g. "6PM" → 18, "10PM" → 22)
- Falls back to `peak = false` with a warning log if fields are missing/invalid

#### 3. `isRestaurantOpen()` (lines 86-100) — Safety fallback
Change the missing-config fallback from `{ isOpen: true }` to `{ isOpen: false }` with a console error log. No other logic changes — open/close comparison stays identical.

#### 4. `buildDynamicPrompt()` schedule block (lines 749-767)
Replace references to `hours.schedule` (if any exist — currently it uses `open_time`/`close_time` directly, so this is already correct). The `scheduleBlock` construction remains unchanged since it already reads `open_time` and `close_time`. The `peak` boolean passed into this function will now come from `isPeakNow()` instead of `getColombiaTime()`.

#### 5. `getConversation()` (line 355) — Use constant
Replace `const closedStatuses = ["confirmed", "emailed", "sent"]` with `FINAL_ORDER_STATUSES`.

#### 6. All call sites of `getColombiaTime()` that destructure `peak`
Update to call `isPeakNow(config?.operating_hours)` separately. The main call site is around line 689 where `peak` is destructured — it will instead call `const peak = isPeakNow(config?.operating_hours || {})`.

### What is NOT modified
- Financial/totals logic
- Packaging logic
- Order flow / saveOrder / validateOrder
- AI prompt structure (only the schedule status text, unchanged)
- Database schema
- Multi-tenant behavior
- Conversation handling
- Pre-order logic (unchanged, still uses `open_time`/`close_time`)

### New helper: `isPeakNow(hours)`
```ts
function isPeakNow(hours: any): boolean {
  try {
    const { peak_days, peak_hour_start, peak_hour_end } = hours || {};
    if (!peak_days?.length || !peak_hour_start || !peak_hour_end) return false;
    const dayMap: Record<string, number> = {
      domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
      jueves: 4, viernes: 5, sabado: 6, sábado: 6,
    };
    const { day, hour } = getColombiaTime();
    const isDay = peak_days.some((d: string) => dayMap[d.toLowerCase()] === day);
    if (!isDay) return false;
    const parseH = (s: string) => {
      const m = s.match(/(\d+)\s*(AM|PM)?/i);
      if (!m) return -1;
      let h = parseInt(m[1]);
      if (m[2]?.toUpperCase() === "PM" && h < 12) h += 12;
      if (m[2]?.toUpperCase() === "AM" && h === 12) h = 0;
      return h;
    };
    const start = parseH(peak_hour_start);
    const end = parseH(peak_hour_end);
    if (start < 0 || end < 0) return false;
    return hour >= start && hour <= end;
  } catch (e) {
    console.warn("⚠️ isPeakNow failed, defaulting to false:", e);
    return false;
  }
}
```

This produces identical behavior for `peak_days: ["Viernes","Sabado"], peak_hour_start: "6PM", peak_hour_end: "10PM"` as the old `(d===5||d===6) && h>=18 && h<=22`.

