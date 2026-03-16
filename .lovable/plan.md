

# Plan: Mover botón "Configurar Alicia" dentro del TabsList

Mover el `Button` que está fuera del `TabsList` hacia dentro, justo después del último `TabsTrigger`. Eliminar el wrapper `div` con `flex justify-between` ya que no será necesario.

## Cambio en `src/pages/WhatsAppDashboard.tsx` (líneas 335-363)

- Quitar el `div` wrapper con `flex items-center justify-between`
- Mover el `Button` dentro del `TabsList`, después del tab "Bloqueados"
- Mantener el mismo estilo del botón

