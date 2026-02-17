

## Plan: Eliminar efectos de luz y movimiento detras de ALICIA

### Problema
En `AliciaLanding.tsx` hay 3 divs animados (lineas 14-47) con gradientes radiales, animaciones `wave1/wave2/wave3` y blur que crean las luces de colores en movimiento detras de toda la pagina, incluyendo detras de la foto de ALICIA.

### Solucion
Eliminar completamente el bloque de "Background waves" (el `div` contenedor y sus 3 hijos animados) de `AliciaLanding.tsx`. Esto deja la pagina con fondo limpio `bg-background` (negro/oscuro) sin luces ni movimiento.

### Archivo a modificar
- `src/pages/AliciaLanding.tsx` -- eliminar lineas 14-47 (el div con clase `absolute inset-0` y sus 3 hijos con animaciones wave)

### Resultado esperado
- Fondo completamente limpio y oscuro
- Sin luces de colores
- Sin animaciones de movimiento
- ALICIA se ve limpia sobre fondo negro puro
- El resto de la pagina (nav, secciones, footer) no cambia
