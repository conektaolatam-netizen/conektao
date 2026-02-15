

## Blindaje completo del prompt de ALICIA

### Problemas detectados (analisis linea por linea)

**1. CRITICO: No hay categorias semanticas para busqueda**
Cuando alguien pide "algo de mar", ALICIA no encuentra nada porque los productos no tienen tags de busqueda. Los items de mar estan dispersos sin agrupacion:
- Pizza de Camarones (linea 714)
- Camarones a las Finas Hierbas (linea 694, entrada)
- Fettuccine Con Camarones (linea 744)
- Brioche al Camaron (linea 758)
- Langostinos Parrillados (linea 755)
- Pizza de Pulpo (linea 729)
- Pizza de Anchoas (linea 728)
- Adicion Camarones y Pulpo (lineas 787, 796)

No hay ninguna instruccion que le diga a ALICIA: "si piden algo de mar, mariscos o pescado, estos son los productos".

**2. CRITICO: Temperature 0.85 es demasiado alta**
Linea 924: `temperature: 0.85` genera creatividad excesiva. Para un sistema de pedidos donde la precision es vital, deberia ser 0.3-0.5. Esto explica que invente precios, tamanios y productos.

**3. CRITICO: max_tokens 400 puede truncar pedidos**
Linea 925: `max_tokens: 400` es insuficiente para pedidos grandes con JSON. Un pedido de 5+ items con desglose + JSON de confirmacion puede superar 400 tokens y cortarse a la mitad, generando JSON invalido.

**4. ALTO: No hay validacion post-IA de precios**
La funcion `parseOrder` (linea 937) extrae el JSON pero nunca valida que los precios coincidan con el menu real. Si la IA pone un precio incorrecto, se guarda y se cobra mal.

**5. ALTO: Empaque no se valida programaticamente**
El prompt dice "SIEMPRE incluye empaques" pero no hay logica en el codigo que verifique que el JSON del pedido incluya packaging_cost > 0 para delivery/takeaway.

**6. ALTO: Falta disambiguation de productos similares**
Hay multiples "Camarones" (pizza, entrada, pasta, adicion, brioche) y multiples "Burrata" (tiene regla pero es insuficiente). No hay regla para cuando alguien dice "quiero camarones" sin especificar.

**7. MEDIO: El prompt es demasiado largo (+800 lineas de texto)**
Gemini 2.5 Flash pierde atencion en prompts largos. Las reglas criticas estan enterradas entre informacion menos importante. Las reglas de precios estan en la linea 832+, muy lejos del menu (654-830).

**8. MEDIO: No hay "mapa mental" del menu**
No existe un resumen de categorias al inicio del menu que le diga a ALICIA: "Tenemos: pizzas, pastas, entradas, hamburguesas, mariscos, bebidas, postres". Esto haria que nunca diga "no tenemos X" cuando si existe.

**9. BAJO: Adiciones duplican nombres de productos**
"Camarones: $10.000" en adiciones vs "Pizza de Camarones: $38.000/$52.000" puede confundir a la IA sobre cual es cual.

---

### Plan de correccion

#### Cambio 1: Reestructurar el menu con categorias semanticas y mapa mental

Agregar al inicio del menu un bloque de "INDICE" que le diga a ALICIA que categorias tiene:

```text
INDICE DEL MENU (consulta esto PRIMERO antes de decir que algo no existe):
- MARISCOS/MAR: Pizza Camarones, Pizza Pulpo, Pizza Anchoas, Camarones Finas Hierbas (entrada), Fettuccine con Camarones, Brioche al Camaron, Langostinos Parrillados
- CARNES: Hamburguesa Italiana, Brocheta di Manzo, Bondiola
- PIZZAS: 25+ variedades en Personal y Mediana
- PASTAS: Spaghetti, Fettuccine, Ravioles, Lasagna
- ENTRADAS: Nuditos, Burrata, Brie, Champiñones
- POSTRES: 11 pizzas dulces
- BEBIDAS: Limonadas, Sodificadas, Cocteles, Sangria, Cervezas, Vinos
```

Agregar tags de busqueda a items del menu:

```text
- Camarones: $38.000 / $52.000 (MARISCOS - salsa Alfredo, mozzarella, camarones salteados al ajillo)
```

#### Cambio 2: Reducir temperature a 0.4 y subir max_tokens a 800

```typescript
temperature: 0.4,  // Precision sobre creatividad
max_tokens: 800,   // Suficiente para pedidos grandes con JSON
```

#### Cambio 3: Agregar validacion post-IA de precios y empaques

Crear una funcion `validateOrder` que despues de `parseOrder`:
1. Compare cada item.unit_price contra el menu real del prompt
2. Verifique que items de delivery tengan packaging_cost > 0
3. Recalcule el total y corrija si no cuadra
4. Agregue empaques faltantes automaticamente

```typescript
function validateOrder(order: any, deliveryType: string): { corrected: boolean; order: any; issues: string[] } {
  const issues: string[] = [];
  // Mapa de precios conocidos para La Barra
  const priceMap: Record<string, Record<string, number>> = {
    "Margarita": { personal: 21000, mediana: 35000 },
    "Hawaiana": { personal: 24000, mediana: 37000 },
    // ... todos los productos
  };
  // Validar cada item
  // Agregar empaque si falta en delivery
  // Recalcular total
}
```

#### Cambio 4: Agregar reglas de disambiguation explicitas

Agregar al prompt reglas para nombres ambiguos:

```text
DISAMBIGUATION (cuando el cliente no especifica):
- "Camarones" sin contexto -> preguntar: "Te refieres a la pizza de camarones, los camarones de entrada, el fettuccine con camarones o el brioche al camaron?"
- "Algo de mar/mariscos" -> mostrar TODAS las opciones de mar del indice
- "Burrata" sin "pizza" -> preguntar (regla existente)
- "Carbonara" -> Fettuccine Carbonara $39.000
- "Bolognese/Bolonesa" -> Spaghetti Alla Bolognese $39.000
```

#### Cambio 5: Agregar regla anti-negacion de existencia

```text
REGLA CRITICA - NUNCA digas que algo no existe sin verificar:
- ANTES de decir "no manejamos eso" o "no tenemos eso", revisa el INDICE DEL MENU completo
- Si el cliente pide algo con palabras diferentes (ej: "mariscos", "de mar", "seafood"), busca en el indice por categoria
- Si genuinamente no existe, sugiere lo mas parecido del menu
```

#### Cambio 6: Compactar reglas duplicadas en el prompt

Hay reglas repetidas en multiples lugares:
- "No inventes tamanios" aparece 3 veces (lineas 493, 834-835, 873)
- "Admite ser IA" aparece 3 veces (lineas 424, 504-506, 881-883)
- "No pidas info repetida" aparece 2 veces (lineas 448-449, 627-630)

Consolidar en una sola seccion "REGLAS INQUEBRANTABLES" al final del prompt (posicion de mayor peso para el LLM).

---

### Archivos a modificar

```text
supabase/functions/whatsapp-webhook/index.ts
  - buildLaBarraPrompt: Reestructurar menu con indice y tags semanticos
  - buildLaBarraPrompt: Agregar reglas de disambiguation
  - buildLaBarraPrompt: Consolidar reglas duplicadas
  - buildDynamicPrompt: Mismas mejoras para multi-tenant
  - callAI: temperature 0.85 -> 0.4, max_tokens 400 -> 800
  - Agregar funcion validateOrder() con mapa de precios
  - En el flujo POST: llamar validateOrder despues de parseOrder
```

### Resultado esperado

- ALICIA nunca dira "no tenemos mariscos" porque tendra un indice de categorias
- Los precios seran validados por codigo, no solo por el prompt
- Los empaques se agregaran automaticamente si la IA los olvida
- La temperature baja eliminara la creatividad que genera precios inventados
- max_tokens mayor evitara pedidos truncados
- Las reglas consolidadas tendran mayor peso al estar al final del prompt

