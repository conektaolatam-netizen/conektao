
# Plan: Auditoria y Correccion Total del Catalogo de Alicia WhatsApp

## Resumen del Problema

Alicia esta usando precios incorrectos porque la tabla `products` en Supabase tiene datos desactualizados. De los ~100 productos activos, la mayoria tiene precios por debajo del valor real. Ademas, faltan productos del listado oficial y la tabla no tiene columna `is_recommended`.

## Discrepancias Detectadas

Se encontraron **diferencias de precio en practicamente todos los productos**. Ejemplos criticos:

| Producto | Precio BD Actual | Precio Oficial |
|----------|-----------------|----------------|
| Gaseosa | $7.000 | $8.000 |
| Hamburguesa Italiana | $34.000 | $38.000 |
| Langostinos Parrillados | $48.000 | $52.000 |
| Mojito | $36.000 | $40.000 |
| Piña Colada | $32.000 | $38.000 |
| Fettuccine Con Camarones | $44.000 | $46.000 |
| Todas las pizzas | Incorrectas | Deben actualizarse |
| Todas las pizzas dulces | Incorrectas | Deben actualizarse |

## Pasos de Implementacion

### Paso 1: Agregar columna `is_recommended` a la tabla products
- Migracion SQL para agregar la columna boolean con default `false`
- Esto permite que Alicia marque productos recomendados con estrella

### Paso 2: Crear categorias faltantes
- Las categorias "Entradas", "Cocina Italiana" y "Pizzas Dulces" ya existen en la BD pero algunos productos los referenciaban con IDs diferentes
- Verificar que todos los category_id apuntan correctamente

### Paso 3: Desactivar TODOS los productos actuales de La Barra
- `UPDATE products SET is_active = false WHERE user_id IN (perfiles de La Barra)`
- Esto garantiza que no queden productos fantasma activos

### Paso 4: Insertar/Actualizar los 109 productos oficiales
- Para cada producto del listado oficial:
  - Si existe por nombre exacto (case-insensitive) y misma categoria: UPDATE precio, descripcion, is_recommended, is_active=true
  - Si no existe: INSERT nuevo registro
- Productos con multiples tamaños (Sangria Tinto copa/jarra/jarra grande) se manejan como registros separados con nombres diferenciados

### Paso 5: Limpiar duplicados
- Verificar que no queden dos productos activos con el mismo nombre en la misma categoria
- Conservar el registro mas reciente en caso de duplicados

### Paso 6: Manejo especial de Sangrias
- Sangria Tinto tiene 3 precios: $26.000 / $57.000 / $86.000
- Sangria Blanco tiene 3 precios: $28.000 / $60.000 / $92.000
- Se crearan como: "Sangria Tinto Copa", "Sangria Tinto Jarra", "Sangria Tinto Jarra Grande" (igual para Blanco)
- Esto requiere confirmacion del usuario sobre los nombres de los tamaños

### Paso 7: Manejo de Tapas Españolas
- El listado incluye 3 variantes de tapas, se crearan como productos separados con nombres descriptivos

### Paso 8: Verificar que `buildMenuFromProducts` refleja los cambios
- La funcion ya lee dinamicamente de la BD, no requiere cambios en codigo
- Los precios se actualizaran automaticamente en el proximo mensaje de Alicia

### Paso 9: Verificar `validateOrder`
- La funcion ya valida precios contra BD en tiempo real
- Con los precios correctos, las validaciones seran correctas automaticamente

## Lo que NO se modifica
- El flujo conversacional de Alicia (personalidad, pasos, confirmaciones)
- La funcion `buildMenuFromProducts` (ya funciona correctamente)
- La funcion `validateOrder` (ya funciona correctamente)
- El historial de pedidos antiguos
- La logica de empaques y domicilios

## Detalles Tecnicos

### Archivos a modificar
- **Migracion SQL**: Agregar columna `is_recommended` a `products`
- **Operaciones de datos**: UPDATE/INSERT en tabla `products` (109 registros)
- **No se modifica**: `supabase/functions/whatsapp-webhook/index.ts`

### Pregunta pendiente
- Las Sangrias tienen 3 precios cada una. Necesito saber como nombrar los tamaños (Copa/Jarra/Jarra Grande, o Vaso/Media/Completa, etc.)
- La linea del listado `)| 39000 | Tapas Españolas | no` parece un error de formato. Confirmar si son 3 variantes de tapas o una sola.
