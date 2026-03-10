

# Plan: Encapsulated Restaurant Availability Check with Early Blocking

## Summary

Create a `checkRestaurantAvailability()` function that runs before the normal bot flow. It checks overrides, operating days, open/close times, and schedule_start/schedule_end — in priority order — and returns either an early-block message or allows the flow to continue. Replace `preparation_start` logic with `schedule_start`/`schedule_end`.

## File: `supabase/functions/whatsapp-webhook/index.ts`

### Change 1: New `checkRestaurantAvailability()` function (~after line 194)

```typescript
function checkRestaurantAvailability(
  config: any,
  activeOverrides: any[],
  dailyOverrides: any[]
): { blocked: boolean; message: string } {
  const hours = config?.operating_hours || {};
  const tz = hours.timezone || "UTC-5";
  const offset = parseTimezoneOffset(tz);
  const now = getRestaurantTime(offset);
  const nowH = now.getHours();
  const nowM = now.getMinutes();
  const nowMinutes = nowH * 60 + nowM;

  const dayMap: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3,
    jueves: 4, viernes: 5, sabado: 6, sábado: 6,
  };
  const currentDay = now.getDay();

  const fmt12 = (t: string): string => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${(m || 0).toString().padStart(2, "0")} ${suffix}`;
  };

  // --- Priority 1: system_overrides (restaurant closed) ---
  if (isRestaurantClosedOverride(activeOverrides)) {
    // Find the override to check end_time for reopen hint
    const closedOverride = activeOverrides.find(
      o => o.type === "disable" && o.target_type === "restaurant" && o.value === "closed"
    );
    if (closedOverride?.end_time) {
      const endLocal = new Date(new Date(closedOverride.end_time).getTime() + offset * 3600000);
      const endH = endLocal.getHours();
      const endM = endLocal.getMinutes();
      const endStr = fmt12(`${endH}:${endM}`);
      // Check if end_time is before end-of-day (i.e., temporary closure)
      const endMinutes = endH * 60 + endM;
      if (endMinutes > nowMinutes) {
        return { blocked: true, message: `El restaurante está cerrado en este momento.\nAbriremos nuevamente a las ${endStr}. ¡Te esperamos! 🙏` };
      }
    }
    return { blocked: true, message: "Hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏" };
  }

  // --- Priority 2: daily_overrides (restaurant closed) ---
  const todayStr = getRestaurantDate(offset);
  const activeDailyClosures = (dailyOverrides || []).filter((o: any) => {
    if (o.type !== "schedule_change") return false;
    if (!/closed/i.test(o.value || "")) return false;
    if (o.expires && o.expires < todayStr) return false;
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

  if (activeDailyClosures.length > 0) {
    const closure = activeDailyClosures[0];
    if (closure.until_hour) {
      return { blocked: true, message: `El restaurante está cerrado en este momento.\nAbriremos nuevamente a las ${fmt12(closure.until_hour)}. ¡Te esperamos! 🙏` };
    }
    return { blocked: true, message: "Hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏" };
  }

  // --- Priority 3: Check valid day ---
  const days = hours.days;
  if (Array.isArray(days) && days.length > 0) {
    const dayOpen = days.some((d: string) => dayMap[d.toLowerCase()] === currentDay);
    if (!dayOpen) {
      const dayNames = days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
      return { blocked: true, message: `Hoy el restaurante no está abierto.\nNuestros días de atención son: ${dayNames}. ¡Te esperamos! 🙏` };
    }
  }

  // --- Priority 4: open_time / close_time ---
  if (hours.open_time && hours.close_time) {
    const openMin = timeToMinutes(hours.open_time);
    const closeMin = timeToMinutes(hours.close_time);

    if (nowMinutes < openMin) {
      return { blocked: true, message: `El restaurante aún no está abierto.\nAbrimos a las ${fmt12(hours.open_time)}. ¡Te esperamos! 🙏` };
    }
    if (nowMinutes >= closeMin) {
      return { blocked: true, message: `El restaurante ya cerró por hoy.\nNuestro horario es de ${fmt12(hours.open_time)} a ${fmt12(hours.close_time)}. ¡Te esperamos mañana! 🙏` };
    }
  }

  // --- Priority 5: schedule_start / schedule_end (with override support) ---
  // Check overrides first for schedule_start/schedule_end
  let effectiveScheduleStart = hours.schedule_start || null;
  let effectiveScheduleEnd = hours.schedule_end || null;

  // daily_overrides can override schedule_start/schedule_end
  for (const o of (dailyOverrides || [])) {
    if (o.expires && o.expires < todayStr) continue;
    if (o.type === "schedule_change" && o.schedule_start) effectiveScheduleStart = o.schedule_start;
    if (o.type === "schedule_change" && o.schedule_end) effectiveScheduleEnd = o.schedule_end;
  }

  // system_overrides can override schedule_start/schedule_end (highest priority)
  for (const o of activeOverrides) {
    if (o.type === "schedule_start") effectiveScheduleStart = o.value;
    if (o.type === "schedule_end") effectiveScheduleEnd = o.value;
  }

  if (effectiveScheduleStart) {
    const schedStartMin = timeToMinutes(effectiveScheduleStart);
    if (nowMinutes < schedStartMin) {
      return { blocked: true, message: `El restaurante ya está abierto, pero comenzamos a atender pedidos a las ${fmt12(effectiveScheduleStart)}. ¡Te esperamos! 🙏` };
    }
  }

  if (effectiveScheduleEnd) {
    const schedEndMin = timeToMinutes(effectiveScheduleEnd);
    if (nowMinutes >= schedEndMin) {
      const startLabel = effectiveScheduleStart || hours.open_time || "";
      return { blocked: true, message: `Ya no estamos recibiendo pedidos por hoy.\nNuestro horario de atención es de ${fmt12(startLabel)} a ${fmt12(effectiveScheduleEnd)}. ¡Te esperamos mañana! 🙏` };
    }
  }

  return { blocked: false, message: "" };
}
```

### Change 2: Call the function as early return (~line 2953)

Replace the comment block (lines 2953-2956) with:

```typescript
// ── RESTAURANT AVAILABILITY CHECK: Block early if closed ──
const availability = checkRestaurantAvailability(config, activeOverrides, config.daily_overrides || []);
if (availability.blocked) {
  tlog("info", rId, `Restaurant blocked: ${availability.message.substring(0, 60)}`);
  const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
  convMsgs.push({ role: "customer", content: text, timestamp: new Date().toISOString() });
  convMsgs.push({ role: "assistant", content: availability.message, timestamp: new Date().toISOString() });
  await supabase.from("whatsapp_conversations")
    .update({ messages: convMsgs.slice(-30), order_status: "none", current_order: null })
    .eq("id", conv.id);
  await sendWA(pid, token, from, availability.message, true);
  return new Response(JSON.stringify({ status: "restaurant_unavailable" }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

### Change 3: Update `buildDynamicPrompt` schedule block (~lines 894-912)

Replace `preparation_start` references with `schedule_start`/`schedule_end`:

```typescript
// Schedule
let scheduleBlock = "";
if (hours.open_time && hours.close_time) {
  const { hour, minute } = getRestaurantTimeInfo(config);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);
  const schedStart = hours.schedule_start || hours.open_time;
  const schedEnd = hours.schedule_end || hours.close_time;

  if (currentMinutes < openMinutes) {
    scheduleBlock = `ESTADO: Cerrado. Abrimos a las ${hours.open_time}.`;
    if (hours.accept_pre_orders) {
      scheduleBlock += ` Puedes tomar el pedido: "${hours.pre_order_message || `Empezamos a atender a las ${schedStart}`}"`;
    }
  } else if (currentMinutes >= closeMinutes) {
    scheduleBlock = `ESTADO: Cerrando. Horario: ${hours.open_time} - ${hours.close_time}.${hours.may_extend ? " A veces nos extendemos." : ""}`;
  } else {
    scheduleBlock = `ESTADO: ABIERTOS. ${hours.open_time} - ${hours.close_time}. Atención: ${schedStart} - ${schedEnd}.`;
  }
}
```

### Change 4: Update `isRestaurantOpen` (~lines 137-154)

Replace `preparation_start` with `schedule_start`:

```typescript
function isRestaurantOpen(config: any): { isOpen: boolean; preOrderMessage: string } {
  const hours = config?.operating_hours || {};
  if (!hours.open_time || !hours.close_time) {
    console.error("⚠️ isRestaurantOpen: missing open_time or close_time, defaulting to CLOSED");
    return { isOpen: false, preOrderMessage: "" };
  }

  const { hour, minute } = getRestaurantTimeInfo(config);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const schedStart = hours.schedule_start || hours.open_time;
  const preOrderMessage = hours.pre_order_message || `Tomamos tu pedido, pero empezamos a atender a las ${schedStart}`;

  return { isOpen, preOrderMessage };
}
```

## What is NOT modified
- Database tables / schema
- `validateOrder` logic
- Override creation (`alicia-daily-override`)
- Confirmation flow hard-block (line 2665)
- UTC normalization
- `daily_overrides` / `system_overrides` structure

## Technical notes
- The `fmt12` helper converts "HH:mm" to "H:MM AM/PM" for user-friendly messages
- `schedule_start`/`schedule_end` overrides are resolved with the documented priority: system_overrides > daily_overrides > operating_hours
- The `reopenHint` logic (line 3048-3058) remains as a safety net for stale conversation history
- The early-return saves the customer message + bot response to conversation history so the dashboard shows the interaction

