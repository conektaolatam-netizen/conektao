

# Plan: Añadir botón "Configurar Alicia" en AliciaHeroCard

En `src/components/dashboard/AliciaHeroCard.tsx`, añadir un segundo botón junto al existente "Entrar a Alicia".

## Cambios

**Archivo: `src/components/dashboard/AliciaHeroCard.tsx`**

- Envolver los botones en un `div` con `flex gap-2 flex-wrap` (líneas 75-90 aprox.)
- Añadir un nuevo `Button` con el mismo estilo gradient (`bg-gradient-to-r from-secondary to-secondary-hover`) que navegue a `/alicia/config`
- Icono `Settings` + texto "Configurar Alicia"

```tsx
<div className="flex gap-2 flex-wrap mt-3 sm:mt-4">
  <Button ...existing "Entrar a Alicia" button... />
  <Button
    className="bg-gradient-to-r from-secondary to-secondary-hover text-secondary-foreground font-semibold px-6 py-2 rounded-xl hover:shadow-lg hover:shadow-secondary/30 transition-all"
    onClick={(e) => { e.stopPropagation(); navigate("/alicia/config"); }}
  >
    <Settings className="h-4 w-4 mr-2" />
    Configurar Alicia
  </Button>
</div>
```

