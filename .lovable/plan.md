
## Diagnóstico Final y Plan de Implementación: Memoria de Cliente en Alicia

### Estado Actual Confirmado

**¿Qué existe hoy?**
- `whatsapp_orders`: guarda `customer_phone`, `customer_name`, `delivery_address` por pedido. Es la única fuente de historial.
- `whatsapp_conversations`: guarda `customer_name` en su columna pero se **resetea** en cada nuevo pedido (per el fix anterior — `getConversation()` borra `current_order` pero mantiene `customer_name` si ya estaba en la fila).
- El hook ya existe en línea 683: `NOMBRE DEL CLIENTE YA CONOCIDO: "${customerName}". Úsalo. NO vuelvas a pedirlo` — pero `freshCustomerName` solo viene de `whatsapp_conversations.customer_name`, que puede estar vacío o ser de otro pedido.
- **No existe tabla de perfiles de clientes WhatsApp.** El `customers` que existe es para facturación electrónica (documento, NIT, email), completamente distinto.
- **No existe historial de direcciones** — solo la más reciente en cada `whatsapp_orders`.

**¿Qué pasa hoy con cliente recurrente?**
- Alicia vuelve a pedir nombre y dirección siempre, aunque el cliente ya haya pedido 10 veces antes. El historial de pedidos pasados nunca se lee para enriquecer el contexto.

---

### Lo que se toca (mínimo quirúrgico)

**1 tabla nueva:** `wa_customer_profiles`  
**1 función nueva:** `getOrCreateWaCustomer(phone, rid)` dentro del edge function  
**1 upsert nuevo:** al guardar pedido (`saveOrder`) → actualiza perfil  
**1 inyección de contexto:** antes de llamar `buildPrompt()` en el flujo normal

**No se toca:**
- Prompt central de personalidad
- Lógica de confirmación (`saveOrder`, tags, estados)
- Envío de email
- Cálculo de precios / empaque
- Tablas existentes (sin ALTER a `whatsapp_orders` ni `whatsapp_conversations`)

---

### Tabla Nueva: `wa_customer_profiles`

```sql
CREATE TABLE public.wa_customer_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  addresses jsonb DEFAULT '[]'::jsonb,  -- [{address, label, last_used_at}]
  last_order_at timestamptz,
  total_orders integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, phone)
);

-- RLS: solo backend (service role)
ALTER TABLE public.wa_customer_profiles ENABLE ROW LEVEL SECURITY;
```

La columna `addresses` es un array JSONB con estructura:
```json
[
  {"address": "Balcones del Vergel Torre 5 Apto 401", "label": null, "last_used_at": "2026-02-18T15:00:00Z"},
  {"address": "Wakari Torre 1 Apto 1404", "label": "Mamá", "last_used_at": "2026-02-17T20:00:00Z"}
]
```

Ordenadas por `last_used_at` descendente: `[0]` = última usada, `[1]` = anterior.

---

### Lógica Nueva en Edge Function

**Función `getOrCreateWaCustomer(phone, rid)`:**
```typescript
async function getOrCreateWaCustomer(phone: string, rid: string) {
  const { data } = await supabase
    .from("wa_customer_profiles")
    .select("*")
    .eq("restaurant_id", rid)
    .eq("phone", phone)
    .maybeSingle();
  
  if (data) return data;
  
  // Inicializar desde historial de pedidos previos
  const { data: pastOrders } = await supabase
    .from("whatsapp_orders")
    .select("customer_name, delivery_address, created_at")
    .eq("restaurant_id", rid)
    .eq("customer_phone", phone)
    .not("delivery_address", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);
  
  const name = pastOrders?.[0]?.customer_name || null;
  const addresses = [];
  const seen = new Set<string>();
  for (const o of (pastOrders || [])) {
    if (o.delivery_address && !seen.has(o.delivery_address)) {
      seen.add(o.delivery_address);
      addresses.push({ address: o.delivery_address, label: null, last_used_at: o.created_at });
    }
  }
  
  const { data: created } = await supabase
    .from("wa_customer_profiles")
    .upsert({ restaurant_id: rid, phone, name, addresses, total_orders: pastOrders?.length || 0 }, { onConflict: "restaurant_id,phone" })
    .select().single();
  
  return created;
}
```

**Upsert en `saveOrder()` al final (después de guardar el pedido):**
```typescript
// Actualizar perfil del cliente WA
if (order.delivery_address) {
  // Leer perfil actual, añadir dirección si no existe, actualizar last_used_at
  const { data: profile } = await supabase.from("wa_customer_profiles")...
  // upsert con addresses actualizado
}
```

**Inyección de contexto en el flujo normal (línea ~2117):**
```typescript
// ANTES de buildPrompt()
const waCustomer = await getOrCreateWaCustomer(from, rId);
const customerMemoryCtx = buildCustomerMemoryContext(waCustomer);
// customerMemoryCtx se añade al final del sistema prompt de Alicia
```

**Función `buildCustomerMemoryContext(customer)`:**
Genera el bloque de texto a inyectar según el caso:

- **Caso A — tiene nombre + 1 dirección:**
  ```
  MEMORIA CLIENTE RECURRENTE:
  - Nombre conocido: "Laura" → Ya tienes su nombre. NO lo pidas.
  - Dirección guardada: "Balcones del Vergel Torre 5 Apto 401" (última usada)
  - Cuando llegue el paso de dirección, pregunta: "¿Te lo envío a Balcones del Vergel Torre 5 Apto 401 como la última vez o es otra?"
  - Si confirma → úsala. Si dice otra → pídela y el sistema la guarda.
  - NO hagas más preguntas de las necesarias.
  ```

- **Caso B — tiene nombre + 2+ direcciones:**
  ```
  MEMORIA CLIENTE RECURRENTE:
  - Nombre conocido: "Laura" → Ya tienes su nombre. NO lo pidas.
  - Direcciones guardadas:
    1. "Balcones del Vergel Torre 5 Apto 401" (última usada)
    2. "Wakari Torre 1 Apto 1404"
  - Pregunta: "¿A dónde te lo envío: Balcones del Vergel o Wakari? Si es otra, me la mandas."
  - Máximo 2 opciones. NO listar más.
  ```

- **Caso C — tiene solo nombre, sin dirección:**
  ```
  MEMORIA CLIENTE RECURRENTE:
  - Nombre conocido: "Laura" → Ya tienes su nombre. NO lo pidas.
  - Sin dirección guardada → pedirla normalmente cuando corresponda.
  ```

- **Caso D — cliente nuevo:** no se añade nada al prompt (flujo normal).

---

### Flujo Completo con Memoria

```text
1. Mensaje llega de phone X
2. getConversation() → conv fresca (ya implementado)
3. getOrCreateWaCustomer() → lee historial de whatsapp_orders
4. buildCustomerMemoryContext() → genera bloque de texto
5. buildPrompt() recibe: freshCustomerName + customerMemoryCtx al final
6. Alicia responde SIN pedir lo que ya sabe
7. Al confirmar pedido: saveOrder() hace upsert en wa_customer_profiles
   → añade/actualiza dirección, actualiza total_orders, last_order_at
```

---

### Puntos Críticos de Seguridad

- `getOrCreateWaCustomer()` es llamada SOLO en el bloque de procesamiento normal (después del bloqueo IDEMPOTENCY, antes de `callAI`). No se llama en confirmación ni en email, no afecta esos flujos.
- El upsert de `saveOrder()` usa `try/catch` separado — si falla, el pedido ya está guardado y el email ya fue enviado. El perfil del cliente nunca bloquea la operación principal.
- RLS: tabla con service role only → el edge function usa service role, ningún cliente puede leerla/modificarla directamente.
- El `DEDUP GUARD 2` (30s, ya implementado) no interactúa con esta tabla.

---

### Archivos a Modificar

- `supabase/functions/whatsapp-webhook/index.ts`:
  1. Añadir `getOrCreateWaCustomer()` (función nueva, ~30 líneas)
  2. Añadir `buildCustomerMemoryContext()` (función nueva, ~25 líneas)
  3. Añadir upsert de perfil al final de `saveOrder()` (~15 líneas)
  4. Llamar `getOrCreateWaCustomer()` antes de `buildPrompt()` en el flujo principal (~3 líneas)
  5. Pasar `customerMemoryCtx` como parámetro adicional al final del prompt

### Migración de Base de Datos

- Crear tabla `wa_customer_profiles` con RLS habilitado (service role only)
- No modificar tablas existentes

### Escenarios Validados

| Escenario | Resultado Esperado |
|---|---|
| Cliente nuevo | Flujo normal, sin cambios |
| Cliente con 1 pedido previo | Alicia saluda por nombre, propone dirección anterior |
| Cliente con 2+ pedidos / 2 direcciones | Ofrece elegir entre las 2 últimas |
| Cliente confirma misma dirección | Upsert actualiza `last_used_at` |
| Cliente da nueva dirección | Se agrega al array `addresses`, sin borrar anteriores |
| Fallo en upsert de perfil | Pedido ya confirmado, email ya enviado, fallo silencioso |
| Cliente pide en pickup (recoger) | Solo nombre, sin lógica de dirección |
