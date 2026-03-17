

# Plan: Productos desplegables y eliminables en la pestaña Menú

## Resumen

Modificar `AliciaConfigMenu.tsx` para que cada categoría sea un acordeón desplegable que muestre sus productos, con opción de eliminar (soft delete: `is_active = false`).

## Cambios

### Único archivo: `src/components/alicia-config/AliciaConfigMenu.tsx`

**1. Cambiar estructura de datos**

En lugar de solo contar productos por categoría, almacenar los productos completos agrupados:

```typescript
interface ProductItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface CategoryWithProducts {
  name: string;
  products: ProductItem[];
}
```

La query actual ya trae `id, name, category_id, categories(name)` — se añade `price, description` al select.

**2. Agrupar productos completos por categoría**

En `loadProducts()`, agrupar en un `Record<string, ProductItem[]>` en vez de `Record<string, number>`.

**3. UI: Acordeón por categoría**

Usar `Collapsible` (ya existe en el proyecto) para cada categoría:
- **Header clickeable**: nombre de categoría + badge con count + chevron
- **Contenido expandible**: lista de productos con nombre, precio y botón eliminar

**4. Eliminar producto (soft delete)**

Botón con icono `Trash2` por producto. Al hacer click:
- Diálogo de confirmación con `AlertDialog` (ya existe)
- Ejecuta `supabase.from("products").update({ is_active: false }).eq("id", productId)`
- Recarga la lista con `loadProducts()`
- Toast de confirmación

**5. Formato de precio**

Helper simple para mostrar precio formateado (ej: `$12.50`).

### Sin cambios en

- Lógica de importación de menú
- Edge functions
- Base de datos (no requiere migración, usa `is_active` existente)
- Ningún otro componente

