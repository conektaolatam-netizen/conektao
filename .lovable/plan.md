

# Plan: Add time info to delivery/pickup override messages

## What changes

Create a helper function `buildServiceBlockMessage` that reads the override's `end_time`, converts it to local time using the restaurant's timezone, and generates a message like:
- "Lo siento, hoy no tenemos servicio de domicilio hasta las 6:00 PM 🚫 ¿Te gustaría recogerlo en el local?"  
- "Lo siento, hoy no tenemos servicio de domicilio 🚫 Solo estamos manejando pedidos para recoger en el local. ¿Te gustaría recogerlo?" (when it's all day / no end time before closing)

This mirrors how closure overrides show "Abriremos nuevamente a las X" vs "cerrado por hoy".

## Technical approach

### New helper function (near line 366, after `isPickupDisabledOverride`)

```typescript
function buildServiceBlockMessage(
  overrides: any[], 
  serviceType: "delivery" | "pickup", 
  config: any
): string {
  const isDelivery = serviceType === "delivery";
  const override = overrides.find(o => 
    isDelivery 
      ? (o.type === "disable" && o.value === "no_delivery")
      : (o.type === "disable" && (o.target_type === "pickup" || (o.target_type === "delivery" && o.value === "no_pickup")))
  );
  
  const serviceName = isDelivery ? "domicilio" : "recogida";
  const altService = isDelivery ? "recoger en el local" : "domicilio";
  const altQuestion = isDelivery ? "¿Te gustaría recogerlo en el local?" : "¿Te gustaría pedirlo a domicilio?";
  
  if (override?.end_time) {
    const tz = config?.operating_hours?.timezone || "UTC-5";
    const offset = parseTimezoneOffset(tz);
    const endLocal = new Date(new Date(override.end_time).getTime() + offset * 3600000);
    const endH = endLocal.getHours();
    const endM = endLocal.getMinutes();
    // Format as 12h
    const suffix = endH >= 12 ? "PM" : "AM";
    const h12 = endH % 12 || 12;
    const endStr = endM > 0 ? `${h12}:${String(endM).padStart(2,"0")} ${suffix}` : `${h12} ${suffix}`;
    
    // Check if end_time is before restaurant closing → show return time
    const schedEnd = config?.operating_hours?.schedule_end || config?.operating_hours?.close_time;
    if (schedEnd) {
      const [seH, seM] = schedEnd.split(":").map(Number);
      if (endH * 60 + endM >= seH * 60 + (seM || 0)) {
        return `Lo siento, hoy no tenemos servicio de ${serviceName} 🚫 Solo estamos manejando pedidos para ${altService}. ${altQuestion}`;
      }
    }
    return `Lo siento, no tenemos servicio de ${serviceName} hasta las ${endStr} 🚫 ${altQuestion}`;
  }
  
  return `Lo siento, hoy no tenemos servicio de ${serviceName} 🚫 Solo estamos manejando pedidos para ${altService}. ${altQuestion}`;
}
```

### Replace all 6 hardcoded delivery/pickup block messages

Replace the hardcoded strings at these locations with calls to `buildServiceBlockMessage(overrides, "delivery"|"pickup", config)`:

1. **Line 2867** — confirmation delivery block
2. **Line 2877** — confirmation pickup block  
3. **Line 3361** — order parsing delivery block
4. **Line 3369** — order parsing pickup block
5. **Line 3425** — mid-conversation delivery intercept
6. **Line 3430** — mid-conversation pickup intercept

The `config` variable is available in all these contexts (it's loaded earlier in the flow).

### Also update `buildOverridePromptBlock` (lines 392-397)

Add time info to the prompt block so the AI also knows when the service returns:

```typescript
if (isDeliveryDisabledOverride(overrides)) {
  const delOv = overrides.find(o => o.type === "disable" && o.value === "no_delivery");
  const timeNote = delOv?.end_time ? ` (hasta que el sistema indique lo contrario)` : "";
  block += `\nSERVICIO DE DOMICILIO NO DISPONIBLE HOY (SISTEMA)${timeNote}: NO ofrezcas domicilio...\n`;
}
```

## Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — add helper + replace 6 message strings + update prompt block

## What is NOT touched
- Price override logic
- Product unavailability logic
- Restaurant closure logic
- `alicia-daily-override` function

