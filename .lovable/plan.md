`.

<lov-plan>

# Plan: Flujo de Reservas por WhatsApp + Generación ICS

## Resumen

Implementar el flujo completo de reservas en el webhook de WhatsApp: detección de intención, recolección de datos guiada por IA, validación de disponibilidad en backend, persistencia en la tabla `reservations`, generación de archivo `.ics`, envío por WhatsApp (documento) al cliente y por email (adjunto) al restaurante. Si `reservation_config.enabled = false`, el bot rechaza educadamente.

## Arquitectura

```text
Cliente WhatsApp
    │
    ▼
[Intent Detection] ─── "reservar", "mesa", "reserva" ───►
    │
    ▼
[Check enabled?] ── false ──► "No aceptamos reservas por el momento"
    │ true
    ▼
[Prompt AI con flujo reserva] ──► Recolecta: fecha, hora, # personas, nombre
    │
    ▼
[Parse tag ---RESERVA_CONFIRMADA---{json}---FIN_RESERVA---]
    │
    ▼
[Backend Validation] ──► slot disponible? horarios? capacidad? anticipación?
    │
    ▼
[Insert en `reservations` table]
    │
    ▼
[Generar .ics] ──► Upload a whatsapp-media bucket
    │
    ├──► Enviar .ics por WA como documento al cliente
    └──► Enviar email con .ics adjunto al restaurante (Brevo)
```

## Cambios

### Archivo 1: `supabase/functions/whatsapp-webhook/index.ts`

**Cambio A — Detección de intención de reserva (antes de la sección NORMAL MESSAGE PROCESSING, ~línea 3399)**

Agregar un bloque que detecte intención de reserva usando regex:
```
/\b(reservar?|reservaci[oó]n|mesa para|quiero (una )?mesa|apartar mesa|booking)\b/i
```

Si matchea:
- Cargar `config.reservation_config`
- Si `enabled !== true` → responder "En este momento no estamos aceptando reservas por WhatsApp" y retornar
- Si `enabled === true` → inyectar `conv.reservation_flow = true` en la conversación (via campo `order_status = "reservation_flow"`) y dejar que el AI fluya con instrucciones de reserva

**Cambio B — Instrucciones de reserva en el prompt (dentro de `buildCoreSystemPrompt` o como hint inyectado)**

Cuando `reservation_flow = true`, agregar al prompt un bloque de instrucciones:
```
FLUJO DE RESERVA (activo):
1. Pregunta para cuántas personas
2. Pregunta la fecha deseada
3. Pregunta la hora deseada  
4. Pide el nombre
5. Confirma los datos y genera el tag:
   ---RESERVA_CONFIRMADA---{"customer_name":"...","party_size":N,"date":"YYYY-MM-DD","time":"HH:MM","notes":"..."}---FIN_RESERVA---
```

Esto se inyecta como sufijo al prompt, similar a `reopenHint`.

**Cambio C — Parser de tag `---RESERVA_CONFIRMADA---` (después de `parseOrder`)**

Nueva función `parseReservation(text)` que extrae el JSON del tag de reserva, similar a `parseOrder()`.

**Cambio D — Validación backend de reserva (después del parser)**

Cuando se detecta el tag:
1. Validar que `reservation_config.enabled === true`
2. Validar que el día de la semana está en `available_days`
3. Validar que la hora está entre `available_hours.start` y `available_hours.end`
4. Validar `party_size <= max_party_size`
5. Validar anticipación mínima (`min_advance_hours`)
6. Validar anticipación máxima (`max_advance_days`)
7. Contar reservas existentes en ese slot → validar `< max_per_slot`
8. Validar que la fecha no está en `blocked_dates`

Si falla validación → responder con el motivo específico.

**Cambio E — Persistencia y envío ICS**

Si la validación pasa:
1. Insertar en tabla `reservations` (status = "confirmed")
2. Generar string ICS con `VCALENDAR`/`VEVENT` (incluir `DTSTART` con TZID del restaurante, duración del slot, nombre del cliente, etc.)
3. Subir el `.ics` al bucket `whatsapp-media` como `reservations/{rid}/{timestamp}.ics`
4. Enviar al cliente vía WhatsApp como documento (`type: document`, `link: publicUrl`, `filename: "Reserva_NombreCliente.ics"`)
5. Enviar email al restaurante (`config.order_email`) con HTML de notificación + attachment ICS (Brevo soporta `attachment: [{content: base64, name: "reserva.ics"}]`)
6. Responder al cliente con confirmación

**Cambio F — Funciones auxiliares nuevas**

- `generateICS(reservation, config)`: genera string ICS estándar
- `parseReservation(text)`: extrae JSON del tag
- `validateReservation(data, config)`: valida disponibilidad
- `sendWADocument(phoneId, token, to, documentUrl, filename, caption)`: envía documento por WA API

### Archivo 2: `supabase/config.toml`

No requiere cambios — el webhook ya tiene `verify_jwt = false`.

### Archivo 3: UI — Sin cambios

La UI de configuración de reservas ya existe en `AliciaConfigReservations.tsx`. La tabla `reservations` ya existe. No se requieren cambios en UI.

## Lo que NO se modifica

- Flujo de pedidos (tags `PEDIDO_CONFIRMADO`, `CAMBIO_PEDIDO`, `ADICION_PEDIDO`)
- Lógica de sugerencias/upselling
- Service overrides
- Validación de precios/empaques
- Confirmación de pedidos
- Email de pedidos
- SaveOrder / nudge system
- Cualquier tabla existente

## Resultado esperado

- Cliente escribe "quiero reservar" → Alicia inicia flujo de reserva
- Recolecta datos paso a paso (personas, fecha, hora, nombre)
- Backend valida disponibilidad real antes de confirmar
- Se inserta en `reservations` como `confirmed`
- Cliente recibe `.ics` por WhatsApp
- Restaurante recibe email con notificación + `.ics` adjunto
- Si `enabled = false` → "No aceptamos reservas por WhatsApp en este momento"
- Si el slot está lleno → "Lo siento, ese horario ya está completo"

