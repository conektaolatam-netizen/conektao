

# Plan: Edge Function `retry-failed-emails`

## Problema
Cuando `saveOrder()` falla al enviar email, el pedido queda con `email_sent = false`. El retry actual solo se activa si el cliente vuelve a escribir. Si no escribe, el restaurante nunca recibe el correo.

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/retry-failed-emails/index.ts` | **Crear** |
| `supabase/config.toml` | Agregar `[functions.retry-failed-emails] verify_jwt = false` |

**No se crea migración SQL para pg_cron.** Como indicaste, pg_cron requiere configuración manual en Supabase Dashboard con las URLs y keys reales. La migración no funcionaría automáticamente.

## Edge Function: `retry-failed-emails/index.ts`

### Flujo

1. CORS preflight handler
2. Conectar a Supabase con `SUPABASE_SERVICE_ROLE_KEY`
3. Query: `whatsapp_orders` WHERE `email_sent = false`, `status = 'confirmed'`, `created_at >= now() - 4 hours`, LIMIT 20
4. Si no hay resultados → `{ processed: 0, sent: 0, skipped: 0, failed: 0 }`
5. Para cada pedido:
   - Buscar `order_email` en `whatsapp_configs` (cacheado por `restaurant_id`)
   - Si no hay email → log `RETRY_SKIP_NO_EMAIL` → skip
   - Construir HTML idéntico al de `buildOrderEmailHtml()` del webhook + banner `[REENVÍO AUTOMÁTICO]`
   - Subject: `🍕 [REENVÍO] Pedido - {customer_name} - ${total}`
   - Enviar via Brevo (`BREVO_API_KEY`, from `pedidos@conektao.com`, name `Alicia - Conektao`)
   - Si OK → update `email_sent = true` → log `RETRY_OK`
   - Si falla → log `RETRY_FAIL` → continuar (no crashear)
6. Responder `{ processed, sent, skipped, failed }`

### HTML del email

Copia exacta de `buildOrderEmailHtml()` del webhook (items, empaques, delivery, pago, comprobante) + un banner amarillo al final:

```
⚠️ [REENVÍO AUTOMÁTICO] — Este correo fue reenviado porque el envío original falló.
```

### Manejo de errores

- Error en query → return 500 con mensaje
- Error Brevo 5xx por pedido individual → log + continuar al siguiente
- Error fatal → return 500

## config.toml

Agregar al final:

```toml
[functions.retry-failed-emails]
verify_jwt = false
```

## Activación del cron (manual post-deploy)

Dos opciones como indicaste:

**Opción A — pg_cron en Supabase Dashboard:**
1. Activar extensión `pg_cron` en Database → Extensions
2. Ejecutar en SQL Editor:
```sql
SELECT cron.schedule(
  'retry-failed-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/retry-failed-emails',
    headers := '{"Authorization": "Bearer TU-SERVICE-ROLE-KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

**Opción B — Botón manual** en el dashboard de Conektao.

## Lo que NO se toca

- `whatsapp-webhook/index.ts` — intacto
- Ningún otro edge function
- Ninguna tabla existente
- Ningún flujo de confirmación

## Sección técnica

- La función reutiliza la estructura HTML exacta del webhook para consistencia visual
- Config cache evita queries repetidos al mismo `restaurant_id`
- Límite de 20 pedidos por ejecución para no saturar Brevo
- Ventana de 4 horas evita reprocesar pedidos viejos
- `verify_jwt = false` porque será llamado por pg_cron sin token de usuario

