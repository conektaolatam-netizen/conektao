
## Diagnóstico exacto

### Bug 1: Status visual en dashboard
**Causa raíz:** En `whatsapp_orders`, el campo `status` se inserta como `"received"` y **nunca se actualiza** en todo el flujo. Solo `whatsapp_conversations.order_status` cambia a `"confirmed"` → `"emailed"`. El `OrdersPanel` lee `whatsapp_orders.status`, por eso todos los pedidos aparecen siempre como "Nuevo" (status = `received`) aunque el email ya se haya enviado.

### Bug 2: Comprobante de transferencia no llega al email
**Causa raíz:** El `payment_proof_url` se guarda en `whatsapp_conversations` (línea 2377) y se usa al construir el HTML del email. Sin embargo, el campo **no se guarda en `whatsapp_orders`**, por lo que si se necesita reenviar el email o hacer auditoría, el comprobante no está ligado al pedido. Además, en el flujo de confirmación (línea 2097), se lee `conv.payment_proof_url` del objeto obtenido *antes* del batching de 4 segundos — puede haber casos donde la imagen llega en el mismo mensaje de confirmación y `freshConv` no se usa para leer el proof actualizado.

---

## Cambios mínimos planeados

### Cambio 1: Migración SQL — agregar `payment_proof_url` a `whatsapp_orders`

```sql
ALTER TABLE public.whatsapp_orders
ADD COLUMN IF NOT EXISTS payment_proof_url text;
```

Esto permite:
- Guardar el comprobante ligado al pedido (auditoría)
- El email siempre puede recuperarlo desde el pedido, independientemente del estado de la conversación

### Cambio 2: `supabase/functions/whatsapp-webhook/index.ts` — 3 cambios quirúrgicos

**2a. En `saveOrder()` — actualizar `whatsapp_orders.status` cuando email_sent = true:**

Actualmente:
```typescript
await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
```

Cambio:
```typescript
await supabase.from("whatsapp_orders").update({ email_sent: true, status: "confirmed" }).eq("id", saved.id);
await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
```

Cuando el email falla pero la conversación queda `confirmed`, también actualizar el status del pedido a `confirmed` (sin `email_sent`):
```typescript
// En el path donde no se envía el email (EMAIL_SKIP):
await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", saved.id);
```

Este cambio aplica en los **3 lugares** donde `email_sent: true` se setea: `saveOrder()` (línea ~1422), el email-retry en `saveOrder()` (línea ~1345), y el second confirmation path (línea ~1682).

**2b. En `saveOrder()` — guardar `payment_proof_url` en el insert y actualizarlo:**

En el `INSERT` de `whatsapp_orders` (línea ~1379), agregar:
```typescript
payment_proof_url: paymentProofUrl || null,
```

**2c. En el flujo de confirmación (línea ~2097) — usar `freshConv.payment_proof_url` en lugar de `conv.payment_proof_url`:**

Actualmente:
```typescript
const storedProof = conv.payment_proof_url || null;
```

Cambio:
```typescript
const storedProof = paymentProofUrl || freshConv?.payment_proof_url || conv.payment_proof_url || null;
```

Esta línea ya existe en línea 2409 para el path normal — aplicar la misma lógica al path de confirmación afirmativa (línea 2097).

### Cambio 3: `src/components/alicia-dashboard/OrdersPanel.tsx` — mapear status correctamente

El `STATUS_CONFIG` ya tiene `confirmed` mapeado a "Confirmado" (✅ existe). El dashboard también ya tiene `email_sent` en el tipo `Order`. El único ajuste es agregar un indicador visual cuando `email_sent = true` para diferenciarlo visualmente y filtrar los "completados" correctamente.

Actualmente `activeOrders` incluye todo lo que no es `"completed"`. Agregar que pedidos con `email_sent = true` muestren badge especial o se ordenen al final de activos — sin cambiar el flujo de botones.

---

## Archivos a modificar

```text
supabase/functions/whatsapp-webhook/index.ts  ← 3 cambios quirúrgicos
src/components/alicia-dashboard/OrdersPanel.tsx ← ajuste visual menor
```

```text
Migración SQL:
ALTER TABLE whatsapp_orders ADD COLUMN payment_proof_url text;
```

## Flujo resultante

```text
Cliente confirma pedido
       │
       ▼
whatsapp_conversations.order_status = "confirmed"     (ya funciona)
whatsapp_orders.status = "confirmed"                  ← NUEVO
       │
       ▼
Email enviado exitosamente
       │
       ▼
whatsapp_conversations.order_status = "emailed"       (ya funciona)
whatsapp_orders.status = "confirmed"                  ← NUEVO (no cambia a "emailed")
whatsapp_orders.email_sent = true                     (ya funciona)
whatsapp_orders.payment_proof_url = [url]             ← NUEVO

Dashboard lee whatsapp_orders.status = "confirmed"
→ Muestra badge: "Confirmado ✅" en verde
```

## Lo que NO se toca
- Flujo conversacional de Alicia
- Lógica de confirmación afirmativa
- Prompt central
- Envío de emails
- `buildOrderEmailHtml`
- Lógica de deduplicación
- Flujo de empaques y precios
