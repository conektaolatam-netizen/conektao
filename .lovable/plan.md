

# Plan: Cambiar Panel de Impacto a Porcentajes

## Objetivo
Reemplazar los números absolutos en COP por rangos de porcentajes basados en estadísticas de industria verificadas.

## Cambios en AliciaImpactPanel.tsx

### Estructura actual (a reemplazar)
- Total: $40.710M COP
- Ventas adicionales: $32.400M
- Upselling: $4.680M
- Ahorro comisiones: $2.160M
- Ahorro call center: $1.470M

### Nueva estructura (porcentajes)
```text
┌─────────────────────────────────────────────────┐
│  IMPACTO PROYECTADO                             │
│  (Basado en +1,200 negocios verificados)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  CONVERSIÓN                                     │
│  +67% - 133%  (chat a pedido completado)        │
│                                                 │
│  TICKET PROMEDIO                                │
│  +15%  (por recomendaciones inteligentes)       │
│                                                 │
│  UPSELLING                                      │
│  +14%  (revenue adicional por sugerencias)      │
│                                                 │
│  ABANDONO                                       │
│  -29% - 34%  (recuperación de carritos)         │
│                                                 │
│  CALL CENTER                                    │
│  -70% - 80%  (reducción de costos operativos)   │
│                                                 │
│  COMISIONES TERCEROS                            │
│  -15% - 30%  (ahorro vs Rappi/iFood)            │
│                                                 │
└─────────────────────────────────────────────────┘

Fuentes: Conferbot 2024, Marketing LTB 2025, 
         IBM/Gartner 2024, Gallabox 2025
```

## Beneficios del cambio
1. No prometemos cifras absolutas que no controlamos
2. Cada métrica tiene su fuente verificable
3. Crepes & Waffles puede calcular con sus propios números
4. Más profesional y menos "vendedor"

## Archivos a modificar
- `src/components/crepes-demo/AliciaImpactPanel.tsx` - Reemplazar stats por porcentajes con fuentes

## Diseño visual
- Mantener la estética actual (gradientes café/hueso)
- Cada métrica con icono representativo
- Fuentes citadas al final del panel
- Rangos mostrados con formato claro (+X% - Y%)

