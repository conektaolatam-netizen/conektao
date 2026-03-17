
# Plan: Ocultar Phone Number ID y Access Token en pestaña WhatsApp

Ocultar visualmente (con `hidden`) los campos **Phone Number ID (Meta)** y **Access Token (Meta)** en `AliciaConfigConnection.tsx` (líneas 32-39). La lógica de estado y guardado se mantiene intacta.

### Cambio único en `src/components/alicia-config/AliciaConfigConnection.tsx`
- Agregar `className="hidden"` a los `<div>` contenedores de los campos Phone Number ID (línea 32) y Access Token (línea 36)
