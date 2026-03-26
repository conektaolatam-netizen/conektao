

# Plan: Dirección manual + reutilizar dirección de "Tu Negocio"

## Qué cambia

En la sección de ubicación del restaurante (tanto en `AliciaConfigDelivery.tsx` como en `Step3Delivery.tsx`), reemplazar el botón único de "Capturar ubicación" por **3 opciones claras**:

```text
┌─────────────────────────────────────────────┐
│ Ubicación del restaurante                   │
│                                             │
│ ○ Usar dirección de "Tu Negocio"            │
│   → Calle 44 #5-20, Ciudad (de config)      │
│                                             │
│ ○ Capturar ubicación actual (GPS)           │
│   → [Botón capturar]                        │
│                                             │
│ ○ Escribir dirección manualmente            │
│   → [Input de dirección]                    │
│   → Se geocodifica con Nominatim al guardar │
│                                             │
│ ✅ Dirección activa: "Calle 44..."          │
│    4.711000, -74.072100                     │
└─────────────────────────────────────────────┘
```

## Comportamiento

1. **"Usar dirección de Tu Negocio"**: Toma `config.location_address` (ya guardado en `whatsapp_configs`). Lo geocodifica con Nominatim para obtener lat/lng. Si no hay dirección configurada en "Tu Negocio", la opción aparece deshabilitada con texto explicativo.

2. **"Capturar ubicación actual"**: Funciona igual que ahora (GPS del navegador + reverse geocode). Es el fallback si el usuario está físicamente en el restaurante.

3. **"Escribir dirección manualmente"**: Input de texto libre. Al guardar, se geocodifica con Nominatim para obtener coordenadas. Si falla el geocoding, se muestra un warning pero se guarda la dirección como texto (fallback legacy).

4. **Indicador visual**: Muestra claramente qué método se usó (badge: "GPS", "Manual", "Tu Negocio") junto con la dirección y coordenadas resultantes.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/alicia-config/AliciaConfigDelivery.tsx` | Agregar estado `locationMode` ("business" / "gps" / "manual"), RadioGroup para elegir, input manual, lógica de geocoding de dirección texto, badge de método usado. Recibe `config.location_address` para la opción "Tu Negocio". |
| `src/components/alicia-setup/Step3Delivery.tsx` | Mismos cambios adaptados al wizard. Recibe `data.location_address` para la opción de negocio. |

## Detalles técnicos

- **Geocoding de dirección texto**: `fetch("https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1")` → tomar `lat`, `lon` del primer resultado.
- **Estado nuevo**: `locationMode: "business" | "gps" | "manual"` se persiste en `delivery_config.restaurant_location.source` para saber qué método se usó.
- **Estructura de `restaurant_location` actualizada**:
  ```json
  { "lat": 4.711, "lng": -74.072, "address": "Calle 44 #5-20", "source": "business" }
  ```
- No hay cambios en backend (`whatsapp-webhook`) ni en `generate-alicia` — solo consumen `lat`/`lng` que seguirán existiendo igual.

