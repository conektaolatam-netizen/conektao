

## Carga de Menu con IA — Completar flujo end-to-end

### Que ya existe

- Edge function `menu-onboarding-parse` que envia imagenes a Gemini y retorna JSON estructurado (categorias, productos, precios, confianza)
- Componente `MenuOnboardingUpload` que sube imagenes a storage y llama a la edge function
- Componente `MenuOnboardingReview` que muestra resultados editables con advertencias de baja confianza
- Tabla `menu_import_sessions` para tracking
- Tabla `products` con columnas: name, description, price, category_id, user_id, restaurant_id, sku, is_active
- Tabla `categories` con columnas: name, user_id, restaurant_id

### Que falta

El flujo actual termina en "debug JSON". Nunca inserta en `products` ni `categories`. Ademas:

1. No hay advertencia visible de que la informacion fue extraida por IA
2. No hay logica de creacion de categorias (find-or-create)
3. No hay insercion de productos tras confirmacion
4. No se actualiza `menu_import_sessions` con el resultado final
5. El componente `AliciaConfigMenu` no tiene boton para importar menu con IA
6. No acepta PDFs (solo imagenes)

---

### Plan de implementacion

#### 1. Agregar advertencia IA en MenuOnboardingReview

Antes del listado de productos, mostrar un banner amarillo/naranja:

```
"Esta informacion fue extraida por IA. Revisala cuidadosamente antes de guardar."
```

Con icono de AlertTriangle y fondo amarillo suave.

#### 2. Crear funcion `saveMenuToDatabase` en MenuOnboardingFlow

Cuando el usuario confirma en la pantalla de review, ejecutar:

1. Para cada `section` en los datos confirmados:
   - Buscar o crear la categoria en `categories` (match por nombre, case-insensitive)
   - Guardar el `category_id` resultante

2. Para cada `item` en cada seccion:
   - Insertar en `products` con:
     - `name`: nombre del producto
     - `description`: descripcion extraida
     - `price`: precio de la primera variante (o variante "Normal")
     - `category_id`: la categoria encontrada/creada
     - `user_id`: usuario actual
     - `restaurant_id`: desde profile
     - `sku`: auto-generado (primeras letras + timestamp)
     - `is_active`: true
   - Si tiene multiples variantes (tamanos), crear un producto por variante con nombre compuesto: "Producto (Tamano)"

3. Actualizar `menu_import_sessions`:
   - `status` -> 'completed'
   - `final_data` -> datos confirmados
   - `products_created` -> conteo
   - `categories_created` -> conteo
   - `completed_at` -> now()

4. Mostrar toast de exito: "X productos creados en Y categorias"

#### 3. Integrar en AliciaConfigMenu

Agregar boton "Importar menu con IA" en el componente AliciaConfigMenu que abre un Dialog con el flujo MenuOnboardingFlow embebido. Al completar, recargar la lista de productos.

#### 4. Aceptar PDFs

Modificar `MenuOnboardingUpload` para aceptar `application/pdf` ademas de imagenes. El edge function ya recibe URLs, asi que solo necesita cambiar el `accept` del input y el filtro de validacion.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/onboarding/MenuOnboardingReview.tsx` | Agregar banner de advertencia IA antes del listado |
| `src/components/onboarding/MenuOnboardingFlow.tsx` | Implementar `saveMenuToDatabase()` en `onComplete` — crear categorias + productos en Supabase |
| `src/components/onboarding/MenuOnboardingUpload.tsx` | Aceptar PDFs (`accept="image/*,.pdf"`) |
| `src/components/alicia-config/AliciaConfigMenu.tsx` | Agregar boton "Importar menu con IA" con Dialog que embebe el flujo |
| `src/pages/MenuOnboardingTest.tsx` | Conectar a la logica real de guardado en vez de solo mostrar JSON |

### Archivos que NO se tocan

- Edge function `menu-onboarding-parse` (ya funciona correctamente con Gemini)
- Esquema de BD (tablas `products`, `categories`, `menu_import_sessions` ya tienen todas las columnas necesarias)
- Webhook de WhatsApp
- Flujo de La Barra en produccion

### Flujo completo del usuario

```text
1. Dueno entra a configuracion de Alicia > tab Menu
2. Click "Importar menu con IA"
3. Sube fotos o PDF del menu
4. Sistema sube a storage, envia a Gemini
5. Gemini extrae productos, precios, categorias
6. UI muestra resultados editables
7. Banner amarillo: "Extraido por IA. Revisa antes de guardar."
8. Dueno edita nombres, corrige precios, elimina duplicados
9. Click "Confirmar X productos"
10. Sistema crea categorias + productos en BD
11. Toast: "12 productos creados en 4 categorias"
12. Menu se refleja inmediatamente en Alicia y POS
```
