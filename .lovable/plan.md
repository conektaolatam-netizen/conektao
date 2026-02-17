
## Plan: Arreglo definitivo de la imagen de ALICIA

### Problema raiz
La imagen PNG tiene fondo **blanco**, y la pagina tiene fondo **oscuro/negro**. Cada intento anterior agrego efectos CSS (drop-shadow, blur divs) que empeoraron el problema en lugar de resolverlo.

### Solucion (2 pasos simples)

**Paso 1 - Reemplazar la imagen**
Copiar la nueva imagen que subiste al proyecto, reemplazando `src/assets/alicia-avatar.png`.

**Paso 2 - CSS sin trucos**
Modificar `AliciaHero.tsx` para:
- Eliminar el `div` con `bg-background rounded-full blur-2xl` (ese es el "cuadrado" que se ve)
- Aplicar `mix-blend-mode: multiply` a la imagen -- esto hace que el fondo blanco del PNG se vuelva **invisible** contra el fondo oscuro de la pagina, sin necesidad de editar la imagen
- Cero efectos: sin drop-shadow, sin blur, sin divs extra

### Resultado esperado
- ALICIA se integra limpiamente con el fondo oscuro
- No hay cuadrados, bordes ni efectos visibles
- Las olas del fondo NO pasan por encima de ella
- La animacion `alicia-breathing` se mantiene

### Detalle tecnico

```text
ANTES:
  div.relative
    div.absolute (bg-background blur-2xl)  <-- ESTO CAUSA EL CUADRADO
    img (sin blend mode)                   <-- FONDO BLANCO VISIBLE

DESPUES:
  div.mb-10
    img (mix-blend-mode: multiply)         <-- BLANCO DESAPARECE, LIMPIO
```
