

# Diagnóstico y Fix: Caso Andrés López + Empaques en Comanda

## Diagnóstico Confirmado

**Por qué no se envió el email ni la comanda:**

La conversación de WhatsApp tiene un constraint UNIQUE en `(restaurant_id, customer_phone)`. Esto significa que Andrés López siempre usa el mismo `conversation_id` (`4116474e...`). Su pedido anterior del 15 de febrero sigue en estado `confirmed` bajo ese mismo conversation_id.

Cuando Alicia intentó guardar el nuevo pedido, la funcion `saveOrder()` ejecutó el **DEDUP GUARD 1** (linea 1368):
- Busca pedidos existentes con ese `conversation_id` en estado `received` o `confirmed`
- Encontró el pedido viejo del 15 de febrero (status: `confirmed`)
- Retornó inmediatamente sin crear orden nueva, sin email, sin comanda

Adicionalmente, el indice unico `idx_whatsapp_orders_conv_active` en `(conversation_id, restaurant_id)` WHERE status NOT IN ('cancelled','duplicate') tambien bloquearía el INSERT.

**Conclusion:** El sistema trata al cliente repetido como duplicado. Esto es incorrecto.

---

## Plan de Cambios (3 archivos, cirugía fina)

### 1. Modificar `saveOrder()` en `whatsapp-webhook/index.ts`

**DEDUP GUARD 1 (lineas 1368-1406):** Antes de buscar duplicados, archivar pedidos anteriores de esa conversacion que ya fueron procesados. Cambiar pedidos con status `confirmed` que tengan mas de 2 minutos de antiguedad a status `completed`, para que no bloqueen nuevos pedidos.

```
-- Pseudologica:
UPDATE whatsapp_orders 
SET status = 'completed' 
WHERE conversation_id = cid 
  AND restaurant_id = rid 
  AND status = 'confirmed' 
  AND created_at < (now() - interval '2 minutes')
```

Despues de eso, el DEDUP GUARD 1 solo encontrará pedidos genuinamente duplicados (mismo webhook procesado dos veces en segundos).

**DEDUP GUARD 2 (linea 1409-1423):** Ya tiene ventana de 30 segundos -- esto esta bien y no se toca.

### 2. Migración SQL: Eliminar indice unico restrictivo

```sql
DROP INDEX IF EXISTS idx_whatsapp_orders_conv_active;

-- Reemplazar con indice no-unico para performance
CREATE INDEX idx_whatsapp_orders_conv_lookup 
ON whatsapp_orders (conversation_id, restaurant_id, status);
```

El indice unico era la segunda barrera que impedía insertar un nuevo pedido para el mismo conversation_id. Un indice regular mantiene el rendimiento de las consultas sin bloquear pedidos legítimos.

### 3. Visualización de empaques en email y dashboard

**En `buildOrderEmailHtml()` (linea 1308):** Despues de renderizar los items del pedido, agregar filas adicionales para empaques cuando `packaging_cost > 0`:

```
Pizza Siciliana    1    $38,000    $38,000
  Empaque x1                       $2,000
```

**En `OrdersPanel.tsx` (lineas 233-248):** Debajo de cada item que tenga `packaging_cost > 0`, agregar una linea visible de empaque en vez del texto pequeno actual (`+emp`):

```
1x Pizza Siciliana         $38,000
   Empaque                  $2,000
```

---

## Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/whatsapp-webhook/index.ts` | Archivar pedidos viejos antes de DEDUP GUARD 1 + empaques en email HTML |
| `src/components/alicia-dashboard/OrdersPanel.tsx` | Empaques como linea visible independiente |
| SQL Migration | Reemplazar indice unico por indice regular |

## Lo que NO se toca

- Personalidad de Alicia
- Calculo de totales/precios
- Flujo de confirmación
- Logica de idempotencia del webhook (30s)
- Ningún otro archivo

## Verificacion post-fix

- Andrés López podrá hacer pedidos nuevos sin bloqueo
- Cada pedido nuevo genera order_id, email y comanda
- Empaques visibles como linea separada en email y dashboard
- Pedidos duplicados por webhook siguen bloqueados (30s window)

