

# Plan: Añadir botón "Configurar Alicia" junto a las tabs

## Cambio

En `src/pages/WhatsAppDashboard.tsx`, añadir un `Button` al lado del `TabsList` que navegue a `/alicia/config` usando `useNavigate`. El botón tendrá un icono de `Settings` y el texto "Configurar Alicia".

## Detalle

- Importar `useNavigate` (ya está `react-router-dom` en uso) y `Settings` de lucide-react.
- Envolver `TabsList` y el nuevo botón en un `div` con `flex items-center justify-between` para que el botón quede a la derecha de las tabs.
- El botón usará estilo `ghost` o similar con el mismo look glassmorphic de las tabs.

## Archivo: `src/pages/WhatsAppDashboard.tsx`

Líneas ~332-352: modificar el contenedor de tabs para incluir el botón:

```tsx
<div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2">
  <TabsList className="alicia-glass rounded-2xl p-1 w-auto">
    {/* ...tabs existentes sin cambios... */}
  </TabsList>
  <Button
    variant="ghost"
    onClick={() => navigate("/alicia/config")}
    className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
  >
    <Settings className="w-4 h-4" />
    Configurar Alicia
  </Button>
</div>
```

Agregar `useNavigate` hook al inicio del componente y `Settings` al import de lucide-react.

