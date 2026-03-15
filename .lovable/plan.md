

# Plan: Proteger `/alicia-dashboard` con contraseña

## Qué se hará

Crear un componente `PasswordGate` que muestra un formulario de contraseña antes de permitir acceso al dashboard. La contraseña será `Vendemospizzas25`. Una vez ingresada correctamente, se guarda en `sessionStorage` para no pedirla de nuevo en la misma sesión.

## Cambios

### 1. Crear `src/components/PasswordGate.tsx`
- Input de contraseña + botón "Entrar"
- Valida contra `Vendemospizzas25`
- Si es correcta, guarda flag en `sessionStorage` y renderiza `children`
- Si es incorrecta, muestra error
- Al recargar la pestaña se mantiene el acceso (sessionStorage)

### 2. Modificar `src/App.tsx`
- Envolver la ruta `/alicia-dashboard` con `<PasswordGate>`:
```tsx
<Route path="/alicia-dashboard" element={
  <PasswordGate>
    <WhatsAppDashboard />
  </PasswordGate>
} />
```

## Nota de seguridad
Esta es una protección básica del lado del cliente (la contraseña está en el código fuente). Es suficiente para evitar acceso casual pero no es seguridad robusta. Si en el futuro necesitas protección real, se puede mover la validación a una Edge Function.

