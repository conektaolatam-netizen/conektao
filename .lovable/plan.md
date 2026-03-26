

# Plan: Optimización SEO de la página Welcome de Conektao

## Resumen

Reescribir la página `Welcome.tsx` y `index.html` para posicionar Conektao como **"sistema operativo con IA para restaurantes"** en Google. Se mantiene el diseño visual actual (fondo negro, gradientes naranja/teal, animaciones) pero se reestructura todo el contenido con jerarquía SEO correcta, texto indexable y schema markup.

## Archivos a modificar

### 1. `index.html` — Meta tags SEO
- **Title**: `Conektao — Sistema operativo con inteligencia artificial para restaurantes | POS, inventario y IA`
- **Meta description**: `Software todo en uno para restaurantes, cafeterías y panaderías en Colombia. POS inteligente, control de inventario, food cost automático, marketplace de proveedores y ALICIA: chatbot IA por WhatsApp.`
- **lang**: cambiar `en` → `es`
- **OG tags**: actualizar title/description/image
- **Agregar schema markup** (JSON-LD): SoftwareApplication + FAQPage

### 2. `src/pages/Welcome.tsx` — Reestructura completa de contenido

Se reemplaza el contenido manteniendo la misma estructura visual (secciones, cards, animaciones, formulario de contacto). Los cambios son **solo de texto y estructura de headings**:

#### Hero Section
- **H1**: `Conektao — Sistema operativo con inteligencia artificial para restaurantes`
- **Subtítulo** (p): incluye keywords "software para restaurantes", "cafeterías", "panaderías", "Colombia"
- CTAs: sin cambios

#### Sección Features → "El software todo en uno para administrar restaurantes" (H2)
- Reorganizar las 7 feature cards con textos SEO:
  - **POS inteligente para restaurantes** (H3) — facturación electrónica, gestión de mesas, control de caja, reportes de ventas
  - **Control de inventario y food cost automático** (H3) — control de ingredientes, costeo automático, food cost restaurante
  - **Facturas IA** (H3) — escaneo OCR de facturas de proveedores, inventario automático
  - **Gestión de personal** (H3) — nómina, geolocalización, bonificaciones
  - **Análisis del negocio con IA** (H3) — margen por plato, análisis de ventas
  - **Control de caja inteligente** (H3) — cierre asistido, conciliación automática
  - **Documentos digitales** (H3) — almacenamiento inteligente

#### Sección IA → "Inteligencia artificial para administrar tu restaurante" (H2)
- ConektAI y ContAI con textos que incluyan keywords de IA para restaurantes

#### Sección ALICIA (nueva sección expandida) → "Alicia: la asistente de inteligencia artificial para restaurantes" (H2)
- Texto descriptivo con keywords: chatbot WhatsApp restaurante, automatizar pedidos
- Lista de capacidades: responder clientes, tomar pedidos, recomendar productos, enviar al POS
- Sub-heading: "Automatiza pedidos de WhatsApp con inteligencia artificial" (H3)

#### Sección Marketplace → "Marketplace de proveedores para restaurantes" (H2)
- Keywords: proveedores gastronómicos, comprar insumos restaurante
- Simulación visual sin cambios

#### Nueva sección: "Plataforma completa para restaurantes, cafeterías y panaderías" (H2)
- Párrafo con keywords long-tail: sistema para cafeterías, sistema para panaderías, sistema para bares

#### Nueva sección FAQ (antes del contacto)
- H2: "Preguntas frecuentes sobre software para restaurantes"
- Preguntas con accordions (componente existente):
  1. ¿Qué software es mejor para restaurantes?
  2. ¿Qué POS usan los restaurantes en Colombia?
  3. ¿Cómo controlar inventario en un restaurante?
  4. ¿Cómo calcular el food cost?
  5. ¿Cómo automatizar pedidos por WhatsApp?
  6. ¿Qué es un sistema operativo para restaurantes?

#### Footer
- Cambiar `© 2024` → `© 2025` y agregar texto: "Software para restaurantes en Colombia y Latinoamérica"

### 3. `index.html` — Schema markup JSON-LD

```text
- SoftwareApplication schema (name, description, applicationCategory, operatingSystem, offers)
- FAQPage schema con las 6 preguntas
```

## Lo que NO cambia

- Diseño visual, animaciones, gradientes, fondo negro
- Formulario de contacto y lógica Supabase
- Auth modal
- Navegación a `/alicia`
- Simulaciones animadas de Marketplace y AI Analysis

## Complejidad

Media-alta por el volumen de texto a reescribir, pero es trabajo mecánico sin lógica nueva.

## Impacto SEO esperado

- H1/H2/H3 correctamente jerarquizados con keywords principales
- ~30 keywords long-tail distribuidas naturalmente en texto indexable
- Schema markup para rich snippets en Google
- FAQ schema para aparecer en "People also ask"
- Meta tags optimizados para CTR en resultados de búsqueda

