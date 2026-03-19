

# Plan: Validación Backend de Domicilios

## Resumen

Agregar validación backend en `whatsapp-webhook/index.ts` para que el costo de domicilio y la detección de zonas gratuitas sea determinista (no dependa del LLM). Sin modificar flujos existentes.

## Cambios (un solo archivo)

**Archivo: `supabase/functions/whatsapp-webhook/index.ts`**

### 1. Nueva función: `validateDeliveryZone`

Función pura que recibe la dirección del cliente y el `delivery_config`, y retorna:

```text
{
  isFreeZone: boolean;
  deliveryCost: number;       // 0 si gratis, N si hay costo fijo
  paidNote: string | null;    // mensaje para zonas no gratuitas sin costo fijo
}
```

Lógica:
- Si `delivery_config.enabled === false` → no aplica (se maneja aparte)
- Normaliza dirección a minúsculas y sin acentos
- Itera `free_zones[]`, hace match case-insensitive + sin acentos contra la dirección
- Si match → `{ isFreeZone: true, deliveryCost: 0, paidNote: null }`
- Si no match:
  - Si `delivery_cost > 0` → `{ isFreeZone: false, deliveryCost: delivery_cost, paidNote: null }`
  - Si `delivery_cost` es 0/null → `{ isFreeZone: false, deliveryCost: 0, paidNote: paid_delivery_note }`

### 2. Modificar `validateOrder` — inyectar costo de domicilio

Después de la validación de precios/empaques existente (sin tocarla), agregar un bloque al final que:

- Solo actúa si `delivery_type` contiene "domicilio"/"delivery" Y hay `delivery_address`
- Llama `validateDeliveryZone(order.delivery_address, config.delivery_config)`
- Si `deliveryCost > 0`:
  - Agrega campo `order.delivery_cost = deliveryCost`
  - Suma al total: `order.total += deliveryCost`
  - Registra en `issues[]`: "DOMICILIO: Costo $X aplicado (zona no gratuita)"
- Si zona gratuita:
  - `order.delivery_cost = 0`
  - Registra: "DOMICILIO: Zona gratuita detectada"
- Si no gratuita y sin costo fijo:
  - `order.delivery_cost = 0`
  - `order.delivery_note = paidNote`
  - Registra: "DOMICILIO: Zona no gratuita, pago al domiciliario"

Para esto, `validateOrder` necesita recibir `config` como parámetro adicional (actualmente solo recibe `products`).

### 3. Modificar `buildOrderSummary` — mostrar costo de domicilio

Si `order.delivery_cost > 0`:
- Agregar línea "Domicilio: $X.XXX" al desglose
- Sumar al total mostrado

Si `order.delivery_note` existe (zona no gratuita, pago externo):
- Agregar nota al bloque de domicilio: ej. "El domicilio se paga directamente al domiciliario"

### 4. Bloqueo de domicilio si `enabled === false`

En los dos puntos donde ya se valida `isDeliveryDisabledOverride` (líneas ~3020 y ~3592), agregar condición adicional:

```text
if (isOrderDelivery && !config.delivery_config?.enabled) {
  // Bloquear igual que override, con mensaje:
  // "No tenemos servicio de domicilio disponible"
}
```

Esto usa el mismo patrón de bloqueo existente (responder + return), sin cambiar la estructura.

### 5. Actualizar las dos llamadas a `validateOrder`

Pasar `config` como tercer argumento en las dos invocaciones existentes:
- Línea ~3092: `validateOrder(resolvedOrder, effectiveConfirmProds, config)`
- Línea ~3621: `validateOrder(parsed.order, effectiveProducts, config)`

### 6. Persistencia en `saveOrder` — campo `delivery_cost` en el JSON

El campo `delivery_cost` ya quedará dentro del objeto `order` que se guarda en `whatsapp_orders.items`/`current_order`. No requiere cambio de schema, solo fluye naturalmente con el JSON.

## Lo que NO se toca

- System prompt / generación de Alicia
- Flujo de sugerencias
- Service overrides existentes
- Estructura de tags de pedido
- Historial de conversación
- Lógica de confirmación
- Schema de base de datos

## Detalle técnico: normalización de texto

```text
function normalizeText(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}
```

Match: `normalizeText(address).includes(normalizeText(zone))`

