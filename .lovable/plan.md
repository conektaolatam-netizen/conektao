

# Plan: Extend & Stabilize Daily Override System

## Summary

Add `start_hour` support, fix time-based filtering in the webhook prompt, and auto-clean expired overrides from the JSONB field. All timestamps remain UTC-normalized.

## Files to modify

1. `supabase/functions/alicia-daily-override/index.ts`
2. `supabase/functions/whatsapp-webhook/index.ts`
3. `src/components/alicia-setup/AliciaDailyChat.tsx`

---

## 1. Fix timezone helpers (alicia-daily-override)

Current helpers use `getTimezoneOffset()` which depends on server timezone. Replace all helpers with pure arithmetic based on the restaurant's offset only:

```typescript
function getRestaurantTime(offsetHours: number): Date {
  const nowUTC = Date.now();
  return new Date(nowUTC + offsetHours * 3600000);
}

function getRestaurantDate(offsetHours: number): string {
  return getRestaurantTime(offsetHours).toISOString().split("T")[0];
}

function localToUTC(localDate: Date, offsetHours: number): Date {
  return new Date(localDate.getTime() - offsetHours * 3600000);
}

function getRestaurantEndOfDayUTC(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  local.setUTCHours(23, 59, 59, 999);
  return localToUTC(local, offsetHours).toISOString();
}

function getLocalHourAsUTC(offsetHours: number, hourStr: string): string {
  const local = getRestaurantTime(offsetHours);
  const [h, m] = hourStr.split(":").map(Number);
  local.setUTCHours(h, m || 0, 0, 0);
  return localToUTC(local, offsetHours).toISOString();
}

function getLocalNowAsUTC(): string {
  return new Date().toISOString(); // now is already UTC
}
```

## 2. Add `start_hour` to AI parser prompt (alicia-daily-override)

Update the JSON format to include `start_hour`:

```json
{
  "start_hour": "HH:mm or null",
  "until_hour": "HH:mm or null"
}
```

Add examples:
- "abre desde las 9pm" → `start_hour: "21:00"`, `until_hour: null`
- "pizza a 37000 desde las 8pm hasta las 9pm" → `start_hour: "20:00"`, `until_hour: "21:00"`
- "no hay domicilio hasta las 6pm" → `start_hour: null`, `until_hour: "18:00"`
- "se acabó la pepperoni" → both null

## 3. Compute start_time and end_time (alicia-daily-override)

Replace current logic (~line 153-155, 168-169):

```typescript
const startTimeUTC = parsed.start_hour
  ? getLocalHourAsUTC(tzOffset, parsed.start_hour)
  : new Date().toISOString();

const endTimeUTC = parsed.until_hour
  ? getLocalHourAsUTC(tzOffset, parsed.until_hour)
  : getRestaurantEndOfDayUTC(tzOffset);

// Edge case: if end <= start, assume next day
if (new Date(endTimeUTC) <= new Date(startTimeUTC)) {
  const adjusted = new Date(endTimeUTC);
  adjusted.setDate(adjusted.getDate() + 1);
  endTimeUTC = adjusted.toISOString();
}
```

Use `startTimeUTC` in the system_overrides insert for `start_time`, and `endTimeUTC` for `end_time`.

Also embed `start_hour` and `until_hour` in the daily_overrides JSONB object so the webhook and dashboard can filter by hour.

## 4. Fix webhook prompt filtering (whatsapp-webhook ~line 915-924)

Replace date-only filter with time-aware filter:

```typescript
// Daily overrides
let overridesBlock = "";
if (dailyOverrides.length > 0) {
  const tzOffset = parseTimezoneOffset(hours?.timezone || "UTC-5");
  const today = getRestaurantDate(tzOffset);
  const nowLocal = getRestaurantTime(tzOffset);
  const nowMinutes = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();

  const active = dailyOverrides.filter((o: any) => {
    if (o.expires && o.expires < today) return false;
    if (o.start_hour) {
      const [sh, sm] = o.start_hour.split(":").map(Number);
      if (nowMinutes < sh * 60 + (sm || 0)) return false;
    }
    if (o.until_hour) {
      const [uh, um] = o.until_hour.split(":").map(Number);
      if (nowMinutes > uh * 60 + (um || 0)) return false;
    }
    return true;
  });

  if (active.length > 0) {
    overridesBlock = "\nCAMBIOS DE HOY:\n" + active.map((o: any) => `- ${o.instruction || o.value}`).join("\n");
  }

  // Auto-clean expired overrides from JSONB
  const cleaned = dailyOverrides.filter((o: any) => {
    if (o.expires && o.expires < today) return false;
    if (o.until_hour && o.expires === today) {
      const [uh, um] = o.until_hour.split(":").map(Number);
      if (nowMinutes > uh * 60 + (um || 0)) return false;
    }
    return true;
  });
  if (cleaned.length !== dailyOverrides.length) {
    // Fire-and-forget cleanup
    supabase.from("whatsapp_configs")
      .update({ daily_overrides: cleaned })
      .eq("restaurant_id", restaurant_id)
      .then(() => console.log("Cleaned expired daily_overrides"));
  }
}
```

Need to add the same `getRestaurantTime`, `getRestaurantDate`, and `parseTimezoneOffset` helpers to the webhook (or reuse from `_shared`). These helpers likely already exist in the webhook — will verify and reuse.

## 5. Dashboard auto-clean (AliciaDailyChat.tsx)

Update `fetchOverrides` to filter by hour and persist cleanup:

```typescript
const fetchOverrides = async () => {
  const { data } = await supabase
    .from("whatsapp_configs")
    .select("daily_overrides, operating_hours")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (data?.daily_overrides) {
    const today = new Date().toISOString().split("T")[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    
    const all = data.daily_overrides as unknown as Override[];
    const active = all.filter((o) => {
      if (o.expires && o.expires < today) return false;
      if (o.start_hour) {
        const [sh, sm] = o.start_hour.split(":").map(Number);
        if (nowMinutes < sh * 60 + (sm || 0)) return false; // not started yet — keep but don't show? Actually keep showing, just mark
      }
      if (o.until_hour && o.expires === today) {
        const [uh, um] = o.until_hour.split(":").map(Number);
        if (nowMinutes > uh * 60 + (um || 0)) return false;
      }
      return true;
    });

    // Persist cleanup if stale entries removed
    if (active.length !== all.length) {
      // Also expire system_overrides for removed entries
      const removed = all.filter(o => !active.includes(o));
      for (const r of removed) {
        if (r.system_override_id) {
          await supabase.from("system_overrides")
            .update({ end_time: new Date().toISOString() })
            .eq("id", r.system_override_id);
        }
      }
      await supabase.from("whatsapp_configs")
        .update({ daily_overrides: active } as any)
        .eq("restaurant_id", restaurantId);
    }
    setOverrides(active);
  }
};
```

Update the `Override` interface to include `start_hour` and `until_hour`.

## 6. Not modified

- `validateOrder`, `applyOverridesToProducts`, `productResolver`, `system_overrides` table logic — untouched. They already use `start_time <= now()` and `end_time >= now()`.

