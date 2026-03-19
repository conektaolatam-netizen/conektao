

# Plan: Prompt dinámico para domicilios + interceptación mid-conversation

## Resumen

Hacer que el paso 3 del flujo conversacional se adapte dinámicamente según la disponibilidad de domicilios, y agregar interceptación mid-conversation cuando el cliente pide domicilio y no está disponible (por config o por override).

## Cambios (2 archivos)

### Archivo 1: `supabase/functions/whatsapp-webhook/index.ts`

**Cambio A — Paso 3 dinámico en `buildCoreSystemPrompt` (línea ~1056)**

Agregar un parámetro `deliveryAvailable: boolean` a la firma de `buildCoreSystemPrompt`. Usar este valor para construir el paso 3 condicionalmente:

```text
// Línea 1111 actual:
3. ${sf.step3}, Cuando diga "no"... → pregunta: recoger o domicilio

// Nuevo:
if (deliveryAvailable):
  3. ${sf.step3}, Cuando diga "no"... → pregunta: recoger o domicilio
else:
  3. Cuando diga "no"... → indícale que el pedido es para recoger en el local y pídele el nombre
```

También adaptar el paso 4 condicionalmente:
- Si `deliveryAvailable = false`: `4. Pide solo el nombre` (sin mencionar dirección)
- Si `deliveryAvailable = true`: mantener paso 4 actual

**Cambio B — Calcular `deliveryAvailable` en `buildPrompt` (línea ~1158)**

En la función `buildPrompt`, antes de llamar a `buildCoreSystemPrompt`, calcular:

```text
const deliveryAvailable = config?.delivery_config?.enabled !== false 
  && !isDeliveryDisabledOverride(activeOverrides);
```

Para esto, `buildPrompt` necesita recibir `activeOverrides` como parámetro adicional.

Pasar `deliveryAvailable` a `buildCoreSystemPrompt`.

**Cambio C — Actualizar la llamada a `buildPrompt` (línea ~3602)**

Pasar `activeOverrides` como nuevo parámetro:

```text
buildPrompt(effectiveProducts, ..., config, customerName, activeOverrides)
```

**Cambio D — Interceptación mid-conversation ampliada (línea ~3734)**

Actualmente la interceptación mid-conversation solo actúa cuando hay un `isDeliveryDisabledOverride`. Agregar la condición `config?.delivery_config?.enabled === false`:

```text
if ((isDeliveryDisabledOverride(activeOverrides) || config?.delivery_config?.enabled === false) 
    && /domicilio|delivery/i.test(lastCustomerText)) {
```

Esto ya existe en los bloques de orden (líneas 3088 y 3660), pero falta en el interceptor mid-conversation (línea 3736).

### Archivo 2: `supabase/functions/generate-alicia/index.ts`

**Cambio E — Paso 3 dinámico en el prompt generado**

En `buildCoreSystemPrompt` de generate-alicia (línea ~67), aplicar la misma lógica condicional. Como generate-alicia no tiene contexto de overrides en tiempo real, usar solo `delivery_config.enabled` del config para determinar el paso 3 del prompt pre-generado.

Agregar parámetro `deliveryAvailable?: boolean` y adaptar pasos 3 y 4.

## Lo que NO se modifica

- Flujo de sugerencias / upselling
- Lógica de pedidos / JSON
- Service overrides existentes
- Validación de zonas gratuitas
- Validación de costo de domicilio
- Lógica de guardado de pedidos
- Schema de base de datos

## Resultado

- Si `delivery_config.enabled = false` o hay override activo de `no_delivery`: el bot nunca ofrece domicilio en el paso 3
- Si el cliente insiste con "quiero domicilio": el backend intercepta y responde "Solo tenemos pedidos para recoger en el local"
- Si domicilio está disponible: comportamiento actual sin cambios

