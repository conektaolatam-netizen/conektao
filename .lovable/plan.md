
# Rediseno UX - Programacion Semanal con Dias Colapsables y Domingo Asistido por IA

## Problema actual
El panel muestra los 7 dias como tabs en la parte superior y el contenido se reemplaza al hacer clic. No se puede ver de un vistazo que dias ya estan programados ni comparar entre ellos. Todo se ve igual, incluyendo el domingo que deberia ser diferente.

## Nueva experiencia propuesta

### Estructura: Lista vertical de dias colapsables
En lugar de tabs horizontales, cada dia sera un boton/fila colapsable (estilo acordeon):

```text
+------------------------------------------+
| Lun 3   | Soleado 21C | 19 activas | [v] |  <-- clic para expandir
|------------------------------------------|
|  (contenido colapsado: areas + staff)     |
+------------------------------------------+
| Mar 4   | Parcial 19C | 19 activas | [v] |
+------------------------------------------+
| Mie 5   | Nublado 17C | 20 activas | [v] |
+------------------------------------------+
| ...                                       |
+------------------------------------------+
| Sab 8   | Soleado 22C | 24 activas | [v] |
+------------------------------------------+
| Dom 9   | SIN PROGRAMAR - IA disponible   |  <-- visualmente diferente
|  [Sparkles] Programar con IA              |
+------------------------------------------+
```

### Lunes a Sabado: dias ya programados
- Cada fila muestra: dia, clima, cantidad de staff activo, indicador de trafico
- Al hacer clic se expande y muestra el detalle (areas con nombres, descansos, insight de IA) exactamente como se ve hoy
- Se puede tener mas de un dia abierto a la vez
- El contenido expandido es identico al actual (areas coloreadas, nombres, insight con glow border)

### Domingo: programacion asistida por IA
El domingo se muestra visualmente distinto (borde con glow turquesa/naranja, fondo ligeramente diferente) indicando que aun no esta programado.

Al hacer clic en "Programar con IA":
1. Se expande mostrando una **propuesta de la IA** (staff pre-asignado basado en el insight del domingo: "Domingo familiar, pico 12-3 PM")
2. La propuesta muestra las mismas areas con nombres asignados, pero cada nombre tiene un boton "X" para quitarlo
3. Hay un boton "+ Agregar" en cada area para anadir staff de los disponibles
4. Un insight de IA explica por que propuso esa distribucion
5. Boton "Confirmar programacion" al final que "guarda" y convierte el domingo en un dia programado normal

### Interaccion del domingo con IA
- La propuesta inicial usa los mismos datos que ya existen en `weekSchedule[6]` (domingo)
- El usuario puede quitar personas (X), moverlas a descanso, o agregar desde una lista
- La IA muestra un mensaje contextual: "Propongo 7 meseras para el pico del mediodia. Despues de las 4 PM puedes liberar 2."
- Al confirmar, el domingo pasa a verse como los demas dias (programado, colapsable)

## Detalles tecnicos

### Cambios en StaffSchedulePanel.tsx

1. **Estado**: Reemplazar `selectedDay` (single index) por `expandedDays` (Set de indices abiertos) y `sundayConfirmed` (boolean) y `sundayStaff` (array editable)

2. **Layout**: Cambiar de tabs + contenido unico a lista vertical de `Collapsible` components (ya existe en el proyecto: `@radix-ui/react-collapsible`)

3. **Dia colapsable (Lun-Sab)**: Cada fila es un `Collapsible` con:
   - Trigger: fila compacta con dia, clima, badge de trafico, conteo staff
   - Content: el mismo contenido actual (areas + staff + insight + descansos)

4. **Domingo especial**: 
   - Mientras `sundayConfirmed === false`: muestra UI de edicion con glow border, propuesta IA, botones X en cada nombre, botones + agregar, boton confirmar
   - Mientras `sundayConfirmed === true`: se comporta como los demas dias

5. **Estado editable del domingo**: `sundayStaff` se inicializa con los datos de `weekSchedule[6].staff` y se puede modificar (quitar/agregar) antes de confirmar

6. **Animaciones**: Usar `framer-motion` + `AnimatePresence` para expandir/colapsar suavemente (ya se usa en el componente)

### Archivos a modificar
- `src/components/crepes-demo/schedule/StaffSchedulePanel.tsx` - refactor completo del layout y logica

### Sin dependencias nuevas
Todo se construye con componentes existentes: Collapsible de Radix, framer-motion, AIGlowBorder.
