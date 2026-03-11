

# Plan: Backend enforcement for delivery/pickup overrides

## Problem
Delivery and pickup overrides rely entirely on the AI "remembering" from conversation context. Once the AI loses context (or the override expires mid-conversation), it stops enforcing the restriction. Closure and price overrides work because they have **backend hard blocks** — delivery/pickup do not.

## Solution: Two changes, both in `supabase/functions/whatsapp-webhook/index.ts`

### Change 1: Inject delivery/pickup override info into the system prompt

In `buildOverridePromptBlock()` (line 370-387), add blocks for delivery and pickup overrides so the AI is explicitly told not to offer these services:

```typescript
// After the price changes block:
if (overrides.some(o => o.type === "disable" && o.target_type === "delivery")) {
  block += "\nSERVICIO DE DOMICILIO NO DISPONIBLE HOY (SISTEMA): NO ofrezcas domicilio. Solo recogida en el local.\n";
}
if (overrides.some(o => o.type === "disable" && o.target_type === "pickup")) {
  block += "\nRECOGIDA NO DISPONIBLE HOY (SISTEMA): NO ofrezcas recogida. Solo domicilio.\n";
}
```

### Change 2: Backend hard block when order is detected with restricted delivery_type

At line ~3333 where `parsed` order is detected, add a backend check **before** building the summary. If the order has `delivery_type = "delivery"` and there's an active delivery override, reject it with a message. Same for pickup:

```typescript
if (parsed) {
  // ── Backend enforce delivery/pickup overrides BEFORE building summary ──
  const orderDeliveryType = (parsed.order.delivery_type || "").toLowerCase();
  const isOrderDelivery = /domicilio|delivery/.test(orderDeliveryType);
  const isOrderPickup = /pickup|recog/.test(orderDeliveryType) || (!isOrderDelivery);

  if (isOrderDelivery && isDeliveryDisabledOverride(activeOverrides)) {
    const noDelivResp = "Lo siento, hoy no tenemos servicio de domicilio 🚫 ¿Te gustaría cambiarlo a recoger en el local?";
    freshMsgs.push({ role: "assistant", content: noDelivResp, timestamp: new Date().toISOString() });
    await supabase.from("whatsapp_conversations").update({ messages: freshMsgs.slice(-30) }).eq("id", conv.id);
    await sendWA(pid, token, from, noDelivResp, true);
    return new Response(JSON.stringify({ status: "delivery_blocked" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (isOrderPickup && isPickupDisabledOverride(activeOverrides)) {
    const noPickResp = "Lo siento, hoy no tenemos servicio de recogida 🚫 ¿Te gustaría cambiarlo a domicilio?";
    freshMsgs.push({ role: "assistant", content: noPickResp, timestamp: new Date().toISOString() });
    await supabase.from("whatsapp_conversations").update({ messages: freshMsgs.slice(-30) }).eq("id", conv.id);
    await sendWA(pid, token, from, noPickResp, true);
    return new Response(JSON.stringify({ status: "pickup_blocked" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ... existing validateOrder + buildOrderSummary logic continues
}
```

### Change 3: Add `isPickupDisabledOverride` helper (next to `isDeliveryDisabledOverride` at line 358)

```typescript
function isPickupDisabledOverride(overrides: any[]): boolean {
  return overrides.some(o => o.type === "disable" && o.target_type === "pickup");
}
```

### Change 4: Add pickup check at confirmation time (line ~2860)

After the existing delivery check at confirmation, add the same for pickup:

```typescript
// ── Check if pickup is disabled by override ──
const isPickupType = /recog|pickup/i.test(deliveryTypeCheck) || !/domicilio|delivery/i.test(deliveryTypeCheck);
if (isPickupType && isPickupDisabledOverride(confirmOverrides)) {
  const noPickupResp = "Lo siento, hoy no tenemos servicio de recogida 🚫 ¿Te gustaría cambiarlo a domicilio?";
  convMsgs.push({ role: "assistant", content: noPickupResp, timestamp: new Date().toISOString() });
  await supabase.from("whatsapp_conversations").update({ messages: convMsgs.slice(-30), order_status: "pending_confirmation", pending_since: new Date().toISOString() }).eq("id", conv.id);
  await sendWA(pid, token, from, noPickupResp, true);
  return new Response(JSON.stringify({ status: "pickup_disabled_override" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

## Summary

This creates a **dual-layer enforcement** for delivery/pickup (matching how closure and price overrides already work):
1. **Prompt layer**: AI is told not to offer the service
2. **Backend hard block**: Even if AI ignores/forgets, the order is rejected before summary is built

### Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — 4 localized edits

