

# Plan: Alinear Horarios con `operating_hours` y eliminar `time_estimates`

## 1. Migración DB: Eliminar columna `time_estimates`

```sql
ALTER TABLE public.whatsapp_configs DROP COLUMN IF EXISTS time_estimates;
```

Esto eliminará el campo legacy. No afecta ninguna lógica funcional (generate-alicia ni whatsapp-webhook lo usan).

## 2. Actualizar `AliciaConfigSchedule.tsx`

Reescribir el componente para cubrir todos los campos de `operating_hours`:

**Nuevos campos a agregar en la UI:**
- **Días de servicio** (`days`): Selector visual de botones togglables (lunes-domingo), mismo estilo que el onboarding
- **Inicio/fin de atención** (`schedule_start`, `schedule_end`): Dos inputs tipo `time`, misma presentación que open/close
- **Días pico** (`peak_days`): Selector visual de botones togglables igual que `days`
- **Horario pico** (`peak_hour_start`, `peak_hour_end`): Dos inputs tipo `time`
- **Zona horaria** (`timezone`): Input de texto (ej: "UTC-5")
- **Tiempo de domicilio** (`delivery_travel`): Input de texto (ej: "~25min")

**Cambios a campos existentes:**
- Renombrar label "Horario de atención" → "Horario de apertura y cierre"

**Se mantiene sin cambios:** pre-orders, may_extend, tiempos de preparación (weekday/weekend/peak)

**handleSave** hará spread de todos los campos en `operating_hours`, preservando campos existentes con `...h`.

## 3. Limpiar `Step7Schedule.tsx` (onboarding wizard)

- Eliminar lectura de `data.time_estimates`
- Mover `weekday`, `weekend`, `peak` a leer/escribir desde `operating_hours`
- Eliminar `time_estimates` del payload de `onSave`
- Agregar `delivery_travel` dentro de `operating_hours`

## 4. Lo que NO se toca

- `generate-alicia/index.ts` — sin cambios
- `whatsapp-webhook/index.ts` — sin cambios
- `isPeakNow()` — sin cambios
- `AliciaConfigPage.tsx` — sin cambios (checkFields sigue con `operating_hours`)
- Lógica del bot — sin cambios

## Secciones de la UI resultante (orden)

1. Días de servicio (botones togglables)
2. Horario de apertura y cierre (open_time / close_time)
3. Inicio y fin de atención (schedule_start / schedule_end)
4. Zona horaria (timezone)
5. Pre-pedidos (accept_pre_orders + pre_order_message)
6. ¿Se extienden? (may_extend)
7. Días pico (peak_days - botones togglables)
8. Horario pico (peak_hour_start / peak_hour_end)
9. Tiempos estimados de preparación (weekday / weekend / peak_waiting_time)
10. Tiempo estimado de domicilio (delivery_travel)

