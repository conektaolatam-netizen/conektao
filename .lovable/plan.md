

## Plan: Update isPeakNow to 24-Hour Format + Optional Peak Logic

### Single surgical edit — `isPeakNow()` function (lines 82-109)

Replace the AM/PM parsing logic with simple 24-hour `"HH:mm"` parsing. The function already handles missing fields correctly (line 85 returns `false`), which satisfies the "optional peak" requirement.

**What changes:**
- Remove `parseH()` inner function that handles AM/PM conversion
- Replace with a `parse24` helper that splits on `:` and returns the hour (and optionally minute for minute-level precision)
- Use minute-based comparison (`h*60+m`) for accuracy with times like `18:30`
- Empty strings for `peak_hour_start`/`peak_hour_end` already trigger the early `return false` on line 85 (falsy check)

**New `isPeakNow`:**
```ts
function isPeakNow(hours: any): boolean {
  try {
    const { peak_days, peak_hour_start, peak_hour_end } = hours || {};
    if (!peak_days?.length || !peak_hour_start || !peak_hour_end) return false;
    const dayMap: Record<string, number> = {
      domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
      jueves: 4, viernes: 5, sabado: 6, sábado: 6,
    };
    const { day, hour, minute } = getColombiaTime();
    const isDay = peak_days.some((d: string) => dayMap[d.toLowerCase()] === day);
    if (!isDay) return false;
    const parse24 = (s: string): number => {
      const parts = s.split(":");
      const h = parseInt(parts[0]);
      const m = parts.length > 1 ? parseInt(parts[1]) : 0;
      if (isNaN(h) || isNaN(m)) return -1;
      return h * 60 + m;
    };
    const start = parse24(peak_hour_start);
    const end = parse24(peak_hour_end);
    if (start < 0 || end < 0) return false;
    const now = hour * 60 + minute;
    return now >= start && now <= end;
  } catch (e) {
    console.warn("⚠️ isPeakNow failed, defaulting to false:", e);
    return false;
  }
}
```

### What is NOT modified
- `getColombiaTime()` — unchanged
- `isRestaurantOpen()` — unchanged
- `FINAL_ORDER_STATUSES` — unchanged
- `buildDynamicPrompt()` — unchanged
- Financial/packaging/order/conversation logic — unchanged
- Call site at line 724 — unchanged (`isPeakNow(config?.operating_hours || {})`)

### Behavior verification
- `peak_hour_start: "18:00", peak_hour_end: "22:00"` → identical to old `"6PM"/"10PM"` (18*60=1080, 22*60=1320)
- Empty strings or missing `peak_days` → `peak = false`, no errors, no logs
- Malformed value like `"abc"` → `parse24` returns -1 → `peak = false`
- Adds minute-level precision (e.g. `"18:30"` now works correctly)

