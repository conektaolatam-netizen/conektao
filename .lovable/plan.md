

# Plan: Mover "Productos Estrella" a pestaña Sugerencias y eliminar pestaña Estrella

## Archivos a modificar

### 1. `src/components/alicia-config/AliciaConfigUpselling.tsx`

Integrar la funcionalidad de productos estrella directamente dentro de este componente:

- Agregar imports: `Input`, `Badge`, `Star`, `X`, `Plus`
- Agregar estado local para productos estrella (`products`, `newProduct`, `savingStarProducts`) leyendo de `config.promoted_products`
- Insertar la sección de productos estrella **entre** el selector de `max_suggestions_per_order` y el bloque de "Momentos y comportamiento" (dentro del `state.enabled` conditional)
- La sección tendrá el mismo input, badges y empty state que tiene actualmente `AliciaConfigStarProducts`
- Botón "Guardar" de productos estrella independiente, llamando `onSave("promoted_products", products)`
- Visualmente: subsección con label "Productos destacados", misma estética (badges naranja con estrella)

### 2. `src/pages/AliciaConfigPage.tsx`

- Eliminar import de `AliciaConfigStarProducts`
- Eliminar entrada `{ id: "star", ... }` del array `SECTIONS`
- Eliminar `case "star"` del `renderContent()` switch
- Eliminar `Star` del import de lucide (si no se usa en otro lugar — verificar; se usa en SECTIONS pero al eliminarlo ya no se necesita)
- La sección "upselling" ahora valida completitud con `checkFields: ["suggest_configs", "promoted_products"]` para cubrir ambos campos

### Sin cambios en
- Backend, edge functions, base de datos
- `AliciaConfigStarProducts.tsx` — se puede dejar el archivo (no rompe nada) o eliminarlo; lo eliminaremos para limpieza
- Todas las demás pestañas permanecen intactas

