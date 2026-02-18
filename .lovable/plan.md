
## Diagnóstico: Clientes Recurrentes Bloqueando Email

### Problema Identificado

**La causa raíz está en `getConversation()` (línea 287-302).**

La función busca una conversación por `restaurant_id + customer_phone`. Si ya existe una conversación para ese número (de un pedido anterior de hoy o de días anteriores), la reutiliza. Esto significa:

- Cliente pide a las 12pm → conversación creada, `order_status = "emailed"`
- Cliente pide a las 2pm → `getConversation()` devuelve la MISMA conversación con `order_status = "emailed"`
- El bloque de IDEMPOTENCY (línea 1700-1724) detecta `order_status === "emailed"` + `current_order` existente → **bloquea el flujo completo antes de llegar a confirmación**

El bloqueo no es en el email directamente, sino en el flujo de conversación que nunca llega a `saveOrder()`.

### Problema Secundario: DEDUP por Teléfono en 2 Minutos (Línea 1079-1092)

```typescript
// ── DEDUP GUARD 2: time-based fallback (2 min window)
const { data: recentDup } = await supabase
  .from("whatsapp_orders")
  .select("id")
  .eq("customer_phone", phone)      // ← por teléfono
  .eq("restaurant_id", rid)
  .gt("created_at", twoMinAgo)      // ← solo últimos 2 min
  .limit(1)
  .maybeSingle();
if (recentDup) {
  return recentDup.id;  // ← bloquea sin enviar email
}
```

Este guard existe para deduplicar dobles-webhooks de Meta (Meta puede enviar el mismo mensaje 2 veces en milisegundos). Es válido para eso. Pero si el cliente genuinamente hace 2 pedidos en menos de 2 minutos, también los bloquea. Sin embargo, el caso más crítico es el primero.

### Solución: 3 Cambios Quirúrgicos

**Cambio 1 — `getConversation()`: Resetear conversación al detectar cliente que vuelve a pedir**

La lógica correcta es: si la conversación existente está en estado `confirmed`, `emailed`, o `sent`, significa que el pedido anterior ya está cerrado. Un nuevo mensaje de este cliente debe iniciar un flujo fresco.

```typescript
async function getConversation(rid: string, phone: string) {
  const { data: ex } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("restaurant_id", rid)
    .eq("customer_phone", phone)
    .maybeSingle();
  
  if (ex) {
    // Si el pedido anterior ya está cerrado (confirmed/emailed/sent)
    // → resetear a estado 'none' para permitir nuevo pedido
    const closedStatuses = ["confirmed", "emailed", "sent"];
    if (closedStatuses.includes(ex.order_status)) {
      const { data: reset } = await supabase
        .from("whatsapp_conversations")
        .update({
          order_status: "none",
          current_order: null,
          pending_since: null,
          payment_proof_url: null,
        })
        .eq("id", ex.id)
        .select()
        .single();
      console.log(`🔄 CONV_RESET: Phone ${phone} returning after closed order → fresh state`);
      return reset || ex;
    }
    return ex;
  }
  
  // Nueva conversación
  const { data: cr, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ restaurant_id: rid, customer_phone: phone, messages: [], order_status: "none" })
    .select()
    .single();
  if (error) throw error;
  return cr;
}
```

**Cambio 2 — IDEMPOTENCY check (línea 1700): Ajustar para no bloquear si ya fue reseteada**

El reset en `getConversation()` garantiza que `conv.order_status` nunca sea `confirmed/emailed` al iniciar un nuevo pedido. El bloque de idempotency existente es correcto — solo actúa si `current_order` existe, que tras el reset será `null`.

**Cambio 3 — DEDUP GUARD 2: Acortar ventana de 120s a 30s**

120 segundos es demasiado amplio. Meta re-envía webhooks en menos de 5 segundos. 30 segundos es suficiente para deduplicar dobles-webhooks sin bloquear pedidos legítimos consecutivos.

```typescript
const thirtySecAgo = new Date(Date.now() - 30 * 1000).toISOString();
// en lugar de 120 * 1000
```

### Archivos a Modificar

- `supabase/functions/whatsapp-webhook/index.ts`
  - `getConversation()` (línea 287-302): agregar lógica de reset de conversación cerrada
  - DEDUP GUARD 2 (línea 1080): cambiar ventana de 120s a 30s

### Idempotencia Final (Correcto)

| Escenario | Comportamiento |
|---|---|
| Cliente pide 12pm → email enviado | `order_status = "emailed"` |
| Cliente dice "gracias" → mismo pedido | IDEMPOTENCY actúa correctamente (current_order existe) |
| Cliente vuelve a las 2pm → nuevo pedido | `getConversation()` detecta "emailed" → resetea → flujo fresco → email nuevo |
| Mismo webhook de Meta llega 2 veces (< 30s) | DEDUP GUARD 2 bloquea duplicado |
| Cliente pide 3 veces en 20 min | 3 pedidos distintos → 3 emails |
| "Sí confirmar" enviado 2 veces mismo pedido | IDEMPOTENCY por `conversation_id + status=received` bloquea solo 1 |

### Lo que NO cambia

- Prompt de Alicia
- Personalidad
- Flujo de confirmación
- Lógica de email
- Cálculo de precios
- Base de datos (sin migraciones)
- Lógica de pago
- Estados de conversación
- Tags internos
