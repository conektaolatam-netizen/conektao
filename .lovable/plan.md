

# Plan: Sistema de Domicilios con Validación Real por Distancia

## Resumen

Reemplazar el sistema conversacional de domicilios por validación real basada en geocoding y distancia, con tres modos de precio (fijo, dinámico, cobra el domiciliario), manteniendo backward compatibility.

---

## Componentes del cambio

### 1. Secret: API Key de Geocoding

Usar **Nominatim (OpenStreetMap)** para geocoding. Es gratuito, no requiere API key, y ya se usa en el proyecto (`LocationPicker.tsx` usa `nominatim.openstreetmap.org`). Esto elimina la necesidad de agregar Google Maps o Mapbox.

Si la precisión no es suficiente en producción, se puede migrar a Google Maps después sin cambiar la arquitectura.

### 2. Backend: `validateDeliveryZone` en `whatsapp-webhook/index.ts`

Reemplazar la función actual (text matching) por una nueva que:

1. **Geocode** la dirección del cliente usando Nominatim (`https://nominatim.openstreetmap.org/search`)
2. **Lea** `restaurant_location` (lat/lng) del `delivery_config`
3. **Calcule** distancia usando Haversine (ya existe `calculate_distance` en DB, pero lo haremos en código para evitar round-trip)
4. **Compare** con `delivery_radius_km`
5. **Calcule precio** según `delivery_pricing_mode`:
   - `fixed` → usa `delivery_cost`
   - `dynamic` → `base_fee + (distance_km * price_per_km)`
   - `courier_collects` → precio 0, devuelve `paid_delivery_note`

Nueva firma:
```text
async function validateDeliveryZone(address, deliveryConfig):
  → { available: boolean, distance_km: number|null, price: number|null, 
      message: string|null, isFreeZone: boolean }
```

**Backward compatibility**: Si no hay `restaurant_location` o `delivery_radius_km`, caer al comportamiento actual (text matching de free_zones + costo fijo).

### 3. Integración en `validateOrder`

Cambiar la llamada en `validateOrder` (~línea 1714) para usar la versión async de `validateDeliveryZone`. Si la dirección está fuera del radio:
- Marcar `order.delivery_blocked = true`
- Guardar el mensaje de rechazo
- El flujo principal detectará esto y responderá al cliente con el mensaje de cobertura

### 4. Inyección en prompt

El cálculo de precio ya se inyecta en `buildOrderSummary`. Se agrega el campo `distance_km` al order para que el resumen pueda mostrar "Distancia: X km" si se desea.

**El precio NUNCA lo calcula la IA** — siempre viene del backend ya calculado.

### 5. UI: `AliciaConfigDelivery.tsx`

Rediseñar el formulario para incluir:

```text
┌─────────────────────────────────────┐
│ ¿Haces domicilios?  [Switch]       │
│                                     │
│ Ubicación del restaurante           │
│ [Capturar ubicación] / lat, lng     │
│ (Reutiliza LocationPicker)          │
│                                     │
│ Radio de cobertura (km)             │
│ [Input numérico: delivery_radius_km]│
│                                     │
│ Tipo de cobro del domicilio         │
│ ○ Precio fijo                       │
│ ○ Precio dinámico por distancia     │
│ ○ Lo cobra el domiciliario          │
│                                     │
│ [Campos condicionales por modo]     │
│                                     │
│ Zonas con domicilio gratis          │
│ [Chips + input existente]           │
│                                     │
│ [Guardar]                           │
└─────────────────────────────────────┘
```

**Campos condicionales**:
- `fixed`: Input "Costo del domicilio"
- `dynamic`: Inputs "Precio base" + "Precio por km"
- `courier_collects`: Input "Mensaje que Alicia dirá al cliente"

### 6. UI: `Step3Delivery.tsx` (wizard)

Actualizar el wizard de onboarding con los mismos campos nuevos (ubicación, radio numérico, selector de pricing mode).

### 7. Estructura final de `delivery_config`

```json
{
  "enabled": true,
  "delivery_radius_km": 6,
  "restaurant_location": { "lat": 4.7110, "lng": -74.0721 },
  "delivery_pricing_mode": "dynamic",
  "base_fee": 3000,
  "price_per_km": 1200,
  "delivery_cost": null,
  "paid_delivery_note": "El domicilio se paga directamente al domiciliario",
  "free_zones": ["Centro", "Chapinero"],
  "escalation_tag": "---CONSULTA_DOMICILIO---"
}
```

Campos legacy (`radius` texto, `delivery_cost` sin modo) siguen funcionando si los nuevos no están presentes.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Nueva `validateDeliveryZone` async con geocoding + Haversine + pricing modes. Ajuste en `validateOrder` para manejar resultado async y bloqueo por fuera de cobertura. |
| `src/components/alicia-config/AliciaConfigDelivery.tsx` | Rediseño completo: LocationPicker, radio numérico, selector de pricing mode, campos condicionales |
| `src/components/alicia-setup/Step3Delivery.tsx` | Mismos campos nuevos adaptados al wizard |
| `supabase/functions/generate-alicia/index.ts` | Actualizar `buildBusinessConfigPrompt` para incluir radio real y pricing mode en el prompt generado |

---

## Riesgos y mitigaciones

- **Nominatim rate limit** (1 req/s): Aceptable para flujo de pedidos. Si crece, migrar a Google Maps con API key.
- **Geocoding falla**: Fallback al comportamiento actual (text matching). Nunca bloquear un pedido por fallo de geocoding.
- **Configs antiguas sin `restaurant_location`**: La función detecta que no hay datos y usa lógica legacy.

