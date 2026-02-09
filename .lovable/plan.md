

# Ajuste del flujo conversacional de ALICIA

## Que cambia
Se reemplaza la conversacion simulada en el chat de ALICIA (archivo `AliciaExperience.tsx`) por el nuevo flujo de 9 pasos que refleja una interaccion real, humana y progresiva.

## Flujo actual vs nuevo

| Paso | Actual | Nuevo |
|------|--------|-------|
| 1 | ALICIA saluda primero (bot inicia) | Cliente inicia la conversacion |
| 2 | Cliente dice que quiere almorzar | ALICIA saluda calido, pide ubicacion |
| 3 | ALICIA recomienda de inmediato | Cliente envia direccion |
| 4 | Cliente pide bebida | ALICIA confirma sucursal + envia menu |
| 5 | ALICIA resume pedido con precios | ALICIA recomienda segun hora/zona |
| 6 | Cliente confirma | Cliente elige su pedido |
| 7 | ALICIA confirma envio | ALICIA celebra y resume pedido |
| 8 | - | Cliente indica pago contra entrega |
| 9 | - | ALICIA confirma preparacion + seguimiento final |

## Mensajes exactos del nuevo flujo

1. **Cliente**: "Hola, quiero pedir algo para almorzar"
2. **ALICIA**: Saludo calido + pide ubicacion (sin recomendar aun)
3. **Cliente**: "Calle 93 con 15, en Chicó"
4. **ALICIA**: Confirma sucursal Zona T + envia link del menu
5. **ALICIA**: Recomienda Crepe Pollo Trufa Mexicana, Limonada de Coco, Helado Cafe Vietnamita (basado en hora/zona)
6. **Cliente**: "Me antoja el Crepe Mar Encocado, la limonada y el helado"
7. **ALICIA**: Celebra eleccion + resume pedido + pregunta confirmacion
8. **Cliente**: "Si, contra entrega por favor"
9. **ALICIA**: Confirma pedido, tiempo estimado, forma de pago
10. **ALICIA**: Mensaje de seguimiento final personalizado con nombre

## Detalles tecnicos

- **Archivo**: `src/components/crepes-demo/AliciaExperience.tsx`
- **Cambio**: Solo el array `aliciaConversation` (lineas 15-50)
- **Timing**: Se ajusta el delay entre mensajes. Los mensajes consecutivos de ALICIA (pasos 4-5 y 9-10) tendran un delay menor (800ms) para simular que son parte del mismo turno
- **Sin cambios en**: integraciones, logica de reproduccion, estilos, componentes de voz, avatar, ni metricas de impacto
- Maximo 1 emoji por mensaje de ALICIA, tono natural colombiano

