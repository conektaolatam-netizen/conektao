
# Plan: Rediseño Integral del Dashboard Gerente de Sucursal

## Visión General

El nuevo dashboard del Gerente de Sucursal de Crepes & Waffles será **"Los ojos de un estratega profesional de datos sobre cada sucursal"** - una herramienta de gerencia asistida por IA que transforma datos complejos en decisiones accionables.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    DASHBOARD GERENTE DE SUCURSAL                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │     🌤️ IA DE CONDICIONES (Módulo Estrella)                 │    │
│  │  ┌───────────────┬───────────────┬───────────────┐          │    │
│  │  │    CLIMA      │  CALENDARIO   │   NOTICIAS    │          │    │
│  │  │  "Día lluvio- │  "Mañana es   │  "Final       │          │    │
│  │  │   so: domici- │   festivo:    │   Liga BetPlay│          │    │
│  │  │   lios +40%"  │   ventas +25%"│   92% impacto"│          │    │
│  │  └───────────────┴───────────────┴───────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┬───────────────────────────────┐    │
│  │    💬 CONEKTAO AI           │      📊 AUDITORÍA            │    │
│  │   Chat contextual           │   Estado sucursal: 82%       │    │
│  │   conectado a datos         │   • Personal: alertas        │    │
│  │   reales del negocio        │   • Errores: patrones        │    │
│  │                             │   • Rotación productos       │    │
│  └─────────────────────────────┴───────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Módulos a Implementar

### 1. IA de Condiciones (Módulo Principal)
La sección más importante y visible del dashboard. Analiza factores externos que afectan las ventas.

**Componentes:**
- **Clima del Día** - API OpenWeatherMap (gratis 1000 llamadas/día)
  - Muestra condición actual y pronóstico
  - Recomendaciones automáticas basadas en histórico:
    - "Día lluvioso → Domicilios +40%, preparar empaques"
    - "Día soleado → Mesas llenas, reforzar meseros"

- **Calendario Festivos** - API Tallyfy (gratis)
  - Detecta festivos de Colombia automáticamente
  - "Mañana es festivo → Ventas proyectadas +25%"
  - "Próximo puente: preparar inventario adicional"

- **Noticias Relevantes** - API NewsAPI o WorldNewsAPI
  - Busca eventos deportivos, conciertos, protestas
  - "Final Liga BetPlay hoy - 92% probabilidad de afectar ventas"
  - "Concierto en Movistar Arena - zona con tráfico pesado"

### 2. Conektao AI (Chat Contextual)
Chat de IA conectado a Gemini que accede a datos reales de la sucursal específica.

**Capacidades:**
- Responde preguntas sobre ventas del día, semana, mes
- Analiza rendimiento de productos
- Compara con otras sucursales
- Usa factores externos (clima, eventos) en sus análisis

### 3. Auditoría (Ojos sobre la Sucursal)
Panel de estado y alertas inteligentes SIN mencionar inventario.

**Métricas:**
- **Estado General**: Porcentaje de salud (ej: 82%)
- **Personal**: 
  - Puntualidad promedio
  - "Empleados llegando 12 min tarde en promedio esta semana"
- **Errores Detectados**:
  - Patrones de errores en productos específicos
  - "2 errores recurrentes en Crepe Stroganoff - revisar receta"
- **Rotación de Productos**:
  - Productos que no se están vendiendo
  - "Impulsar productos con pollo hoy - ventas 30% abajo"

---

## Arquitectura Técnica

### Edge Functions Nuevas

**1. `crepes-conditions-ai` (Nueva)**
```text
Entrada: { city: "Bogotá", branch_id: "zona-t" }
Proceso:
  1. Llama a OpenWeatherMap API (clima actual y pronóstico)
  2. Llama a API de festivos Colombia (próximos 7 días)
  3. Llama a NewsAPI (noticias de la ciudad + deportes)
  4. Envía todo a Gemini para análisis contextual
  5. Genera recomendaciones específicas
Salida: {
  weather: { condition, temp, recommendation },
  calendar: { isHoliday, nextHoliday, recommendation },
  news: { events[], impactProbability, recommendation }
}
```

**2. `crepes-branch-audit` (Nueva)**
```text
Entrada: { branch_id: "zona-t" }
Proceso:
  1. Analiza datos simulados de personal
  2. Detecta patrones de errores
  3. Analiza rotación de productos
  4. Calcula estado general
Salida: {
  overallScore: 82,
  staffAlerts: [...],
  errorPatterns: [...],
  productRotation: { underperforming: [...], recommendation }
}
```

**3. `crepes-chat-ai` (Nueva - basada en conektao-ai)**
```text
Chat contextual con datos simulados de la sucursal específica
```

### Componentes React Nuevos

1. **ConditionsAIPanel.tsx** - Panel principal con clima, calendario, noticias
2. **WeatherCard.tsx** - Tarjeta de clima con recomendaciones
3. **CalendarCard.tsx** - Tarjeta de festivos/eventos
4. **NewsImpactCard.tsx** - Tarjeta de noticias con probabilidad de impacto
5. **ConektaoChat.tsx** - Chat de IA contextual
6. **AuditPanel.tsx** - Panel de auditoría con estado y alertas
7. **ProductRotationCard.tsx** - Recomendaciones de productos a impulsar
8. **BranchManagerDashboard.tsx** - Actualización completa del layout

---

## Diseño Visual

### Paleta de Colores
- **Principal**: Café Crepes (#5C4033, #8B7355)
- **Acento IA**: Gradiente naranja/cian de Conektao
- **Estados**: Verde (bueno), Ámbar (atención), Rojo (crítico)
- **Fondos**: Crema/bone (#F5F0E8, #FAF6F1)

### Estética
- Estilo Apple/visionOS con glassmorphism sutil
- Animaciones suaves con Framer Motion
- Tarjetas flotantes con sombras elegantes
- Micro-animaciones en iconos de IA
- Bordes con glow sutil en secciones de IA

### Layout Responsivo
```text
Desktop (lg+):
┌─────────────────────────────────────────────┐
│           IA DE CONDICIONES (full width)    │
├─────────────────────┬───────────────────────┤
│    CONEKTAO AI      │      AUDITORÍA        │
│      (50%)          │        (50%)          │
└─────────────────────┴───────────────────────┘

Mobile:
┌─────────────────────┐
│  IA DE CONDICIONES  │
├─────────────────────┤
│    CONEKTAO AI      │
├─────────────────────┤
│     AUDITORÍA       │
└─────────────────────┘
```

---

## APIs Externas

### 1. OpenWeatherMap (Clima)
- **Plan**: Free (1000 llamadas/día)
- **Endpoint**: `api.openweathermap.org/data/2.5/weather`
- **Datos**: Temperatura, condición, humedad, pronóstico

### 2. Tallyfy Holidays API (Festivos Colombia)
- **Plan**: Gratuito
- **Endpoint**: `tallyfy.com/national-holidays/api/CO/2026.json`
- **Datos**: Festivos oficiales de Colombia

### 3. NewsAPI o WorldNewsAPI (Noticias)
- **Plan**: Free tier disponible
- **Endpoint**: `newsapi.org/v2/top-headlines?country=co`
- **Datos**: Noticias locales, deportes, eventos

---

## Datos Simulados para Demo

Dado que esto es una demo para convencer al CEO, todos los datos serán simulados pero realistas:

**Sucursal Zona T - Bogotá:**
- Ventas del día: $4,250,000 COP
- Personal: 8 empleados activos
- Pedidos: 127 completados
- Estado: 82%

**Alertas de Personal:**
- "Promedio llegada: 12 min tarde esta semana"
- "María González: 3 ausencias este mes"

**Patrones de Errores:**
- "Crepe Stroganoff: 5 errores en preparación (revisar receta)"
- "Waffle Nutella: 2 devoluciones por presentación"

**Rotación de Productos:**
- "Productos con pollo: -30% vs semana pasada"
- "Helado pistacho: menor rotación del mes"
- Recomendación: "Hoy impulsar: Crepe de Pollo, Helado Pistacho"

---

## Archivos a Crear/Modificar

### Nuevos Archivos
1. `supabase/functions/crepes-conditions-ai/index.ts`
2. `supabase/functions/crepes-branch-audit/index.ts`
3. `supabase/functions/crepes-chat-ai/index.ts`
4. `src/components/crepes-demo/conditions/ConditionsAIPanel.tsx`
5. `src/components/crepes-demo/conditions/WeatherCard.tsx`
6. `src/components/crepes-demo/conditions/CalendarCard.tsx`
7. `src/components/crepes-demo/conditions/NewsImpactCard.tsx`
8. `src/components/crepes-demo/audit/AuditPanel.tsx`
9. `src/components/crepes-demo/audit/StaffAlertsCard.tsx`
10. `src/components/crepes-demo/audit/ErrorPatternsCard.tsx`
11. `src/components/crepes-demo/audit/ProductRotationCard.tsx`
12. `src/components/crepes-demo/chat/ConektaoChat.tsx`

### Archivos a Modificar
1. `src/components/crepes-demo/BranchManagerDashboard.tsx` - Rediseño completo
2. `supabase/config.toml` - Agregar nuevas funciones

---

## Flujo de Usuario

1. **Gerente abre el dashboard** → Ve inmediatamente IA de Condiciones
2. **Panel de Clima** muestra: "Día lluvioso en Bogotá - Domicilios +40%"
3. **Panel de Calendario** muestra: "Mañana festivo - Preparar inventario extra"
4. **Panel de Noticias** muestra: "Final Millonarios hoy 8pm - 87% impacto zona norte"
5. **Sección Auditoría** muestra: "Estado 82% - 2 alertas de personal"
6. **Sección Chat** permite preguntas libres sobre datos de la sucursal
7. **Rotación Productos**: "Impulsar hoy: productos con pollo y helado pistacho"

---

## Resultado Esperado

Un dashboard que al verlo, el CEO de Crepes & Waffles piense:

> "Esto es exactamente lo que necesitamos. Un gerente con esta herramienta toma mejores decisiones que uno sin ella. Cada sucursal tendría un estratega de datos 24/7."

El diseño será tan impactante visualmente y tan útil funcionalmente que no habrá duda de que Conektao entiende el negocio de restaurantes a nivel enterprise.
