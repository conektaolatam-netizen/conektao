

# Plan: Fix de Idempotencia para Múltiples Pedidos en la Misma Conversación

## Problema

Hay **dos puntos** donde la idempotencia bloquea pedidos legítimos:

1. **Línea 2323 (IDEMPOTENCY check en confirmación):** Cuando el usuario confirma un nuevo pedido, el sistema busca órdenes existentes con `status IN ('received', 'confirmed')` en la misma `conversation_id`. Si encuentra alguna (del pedido anterior), bloquea y responde "Ya quedó confirmado" sin crear la nueva orden ni enviar correo.

2. **Línea 1382 (DEDUP GUARD 1 en `saveOrder`):** Misma lógica dentro de `saveOrder()`. Encuentra la orden anterior y retorna su ID sin insertar la nueva.

El problema raíz: el archivado automático (línea 1371) solo mueve a `completed` las órdenes con `created_at` > 2 minutos. Si el cliente hace un nuevo pedido dentro de esos 2 minutos, o si la orden anterior nunca fue archivada por timing, ambos checks la encuentran y bloquean.

## Solución

Modificar ambos checks para que solo detecten duplicados **recientes** (ventana de 30 segundos), no órdenes históricas de la misma conversación. Esto mantiene protección contra webhooks duplicados de Meta (que llegan en < 5s) pero permite nuevos pedidos legítimos.

## Cambios en `supabase/functions/whatsapp-webhook/index.ts`

### Cambio 1 — Línea 2323: Check de idempotencia en confirmación

**Antes:**
```javascript
const { data: existingEvent } = await supabase
  .from("whatsapp_orders")
  .select("id")
  .eq("conversation_id", conv.id)
  .eq("restaurant_id", rId)
  .in("status", ["received", "confirmed"])
  .limit(1)
  .maybeSingle();
```

**Después:**
```javascript
const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
const { data: existingEvent } = await supabase
  .from("whatsapp_orders")
  .select("id")
  .eq("conversation_id", conv.id)
  .eq("restaurant_id", rId)
  .in("status", ["received", "confirmed"])
  .gt("created_at", thirtySecsAgo)
  .limit(1)
  .maybeSingle();
```

Añadir `.gt("created_at", thirtySecsAgo)` — solo considera duplicado si la orden fue creada en los últimos 30 segundos (suficiente para atrapar webhooks duplicados de Meta, pero no bloquea pedidos nuevos).

### Cambio 2 — Línea 1382: DEDUP GUARD 1 en `saveOrder()`

**Antes:**
```javascript
const { data: existingOrder } = await supabase
  .from("whatsapp_orders")
  .select("id, email_sent, status")
  .eq("conversation_id", cid)
  .eq("restaurant_id", rid)
  .in("status", ["received", "confirmed"])
  .limit(1)
  .maybeSingle();
```

**Después:**
```javascript
const thirtySecsAgoDedup = new Date(Date.now() - 30 * 1000).toISOString();
const { data: existingOrder } = await supabase
  .from("whatsapp_orders")
  .select("id, email_sent, status")
  .eq("conversation_id", cid)
  .eq("restaurant_id", rid)
  .in("status", ["received", "confirmed"])
  .gt("created_at", thirtySecsAgoDedup)
  .limit(1)
  .maybeSingle();
```

Mismo patrón: ventana de 30 segundos.

### Cambio 3 — Línea 1371: Ampliar ventana de archivado

**Antes:**
```javascript
.lt("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
```

**Después:**
```javascript
.lt("created_at", new Date(Date.now() - 30 * 1000).toISOString())
```

Reducir de 2 minutos a 30 segundos para que las órdenes anteriores se archiven más rápido, liberando el camino para nuevos pedidos.

## Qué NO se toca

- DEDUP GUARD 2 (línea 1423) — ya usa ventana de 30 segundos, está bien
- La lógica de `retry-failed-emails` — no afectada
- El POST-CONFIRMATION handler (línea 2480) — el reset a `none` después de 2 horas sigue igual
- La estructura de la tabla `whatsapp_orders` — sin cambios
- El flujo de email — intacto

## Por qué 30 segundos

- Meta envía webhooks duplicados típicamente en < 5 segundos
- 30 segundos da margen amplio contra race conditions
- Un humano no puede completar un nuevo pedido legítimo en < 30 segundos (necesita conversar, elegir productos, confirmar)
- El DEDUP GUARD 2 (por teléfono + tiempo) ya cubre la misma ventana de 30s como fallback

## Sección técnica

Los tres cambios son quirúrgicos — solo se añade un filtro temporal `.gt("created_at", ...)` a las queries existentes y se ajusta la ventana de archivado. No cambia la firma de ninguna función, no se agregan columnas, no se modifica ningún otro archivo.

