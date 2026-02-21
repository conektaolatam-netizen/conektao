

## Diagnostico de las 6 fallas criticas

### 1. "Pedido listo" — Alicia dice que pueden pasar sin confirmacion

**Donde falla:** La regla ya existe parcialmente en el prompt de La Barra (linea 916-917), pero es generica. No hay una prohibicion explicita de frases como "ya puedes pasar", "tu pedido esta listo". Ademas, la respuesta post-confirmacion hardcodeada de follow-up (linea 2554) dice "Te avisamos cuando este listo" para pickup, lo cual es correcto, pero la IA puede generar frases como "ya esta listo" por su cuenta.

**Que se modifica:** Agregar regla explicita al prompt de La Barra (linea ~916) y al prompt dinamico: "PROHIBIDO decir: 'ya puedes pasar', 'tu pedido esta listo', 'ya esta listo', 'puedes venir'. Si tipo = recoger, responde: 'Te avisamos cuando este listo para recoger'. NUNCA asumas que un pedido esta listo."

**Riesgo:** Cero. Solo es una regla de texto en el prompt.

### 2. Datafono — se ofrece sin restriccion

**Donde falla:** `payment_config.methods` incluye `["transferencia", "efectivo", "datafono"]`. El prompt dinamico (linea 657-658) los lista todos: `PAGO: transferencia, efectivo, datafono`. El prompt de La Barra (linea 938) solo menciona efectivo y transferencia, pero el LLM puede ver "datafono" en el config e inferirlo. Ademas, no existe campo `delivery_with_card_terminal` en el config.

**Que se modifica:**
- Agregar regla en prompt La Barra: "Datafono NO se ofrece proactivamente. Si el cliente lo pide: 'No siempre podemos llevar datafono, te confirmo disponibilidad'. Metodos a ofrecer: efectivo o transferencia."
- En prompt dinamico: filtrar "datafono" de la lista visible; solo mencionarlo si el cliente lo pide, con caveat.

**Riesgo:** Cero. Solo reglas de prompt.

### 3. Comprobante de transferencia no llega al email

**Donde falla:** Bug critico en linea 2387. El codigo referencia `freshConv` que NO esta declarado en ese scope:

```text
const storedProof = paymentProofUrl || freshConv?.payment_proof_url || conv.payment_proof_url || null;
```

`freshConv` se declara en linea 2626 (despues del batching), pero la confirmacion ocurre en lineas 2293-2431 (antes del batching). Esto causa un error de Temporal Dead Zone (TDZ) cuando `paymentProofUrl` es null (la mayoria de los casos, cuando la imagen se envio en un mensaje anterior).

Resultado: el proof nunca se pasa a `saveOrder`, y TODOS los pedidos tienen `payment_proof_url: null` en la BD (confirmado por query).

**Que se modifica:** Reemplazar linea 2387 con una consulta fresca a `whatsapp_conversations` para obtener el `payment_proof_url` actualizado, antes de llamar a `saveOrder`. Asi:

```typescript
// Fetch fresh proof from DB (image may have been saved in a previous message)
const { data: proofCheck } = await supabase
  .from("whatsapp_conversations")
  .select("payment_proof_url")
  .eq("id", conv.id)
  .single();
const storedProof = paymentProofUrl || proofCheck?.payment_proof_url || conv.payment_proof_url || null;
```

**Riesgo:** Bajo. Solo agrega una query de lectura antes de saveOrder.

### 4. Estados del dashboard — todo queda como "received"

**Donde falla:** La BD muestra TODOS los pedidos con `status: "received"` a pesar de que `email_sent: true`. El codigo de la ultima correccion (actualizar status a "confirmed") esta presente en el archivo, pero hay un conflicto en el dedup guard (lineas 1454-1461): busca pedidos con `.eq("status", "received")`. Si el status se actualizo a "confirmed", el dedup guard no los encuentra, y crea un DUPLICADO en vez de actualizar.

Ademas, las ordenes existentes en BD (anteriores al deploy) nunca fueron migradas — siguen como "received".

**Que se modifica:**
- Cambiar el dedup guard para buscar cualquier status (no solo "received"): `.in("status", ["received", "confirmed"])`.
- Ejecutar un UPDATE masivo para corregir ordenes existentes: `UPDATE whatsapp_orders SET status = 'confirmed' WHERE email_sent = true AND status = 'received'`.

**Riesgo:** Bajo. Solo amplia el filtro de dedup y corrige datos historicos.

### 5. Calculo — validacion doble

**Donde falla:** Ya existe `validateOrder()` (lineas 1136-1238) que recalcula precios y totales desde la BD. Sin embargo, no hay guardia contra totales negativos ni contra omision de items.

**Que se modifica:** Agregar en `validateOrder`:
- Guardia: `if (calculatedTotal <= 0) { issues.push("Total negativo/cero corregido"); calculatedTotal = subtotal; }`
- Guardia: items sin precio se ignoran o escalan.

**Riesgo:** Cero. Proteccion adicional.

### 6. Historial y pedidos duplicados ligados a numeros distintos

**Diagnostico:** La BD muestra dos pares de duplicados del 18 de Feb:
- Carolina Madrigal (573118014362): dos pedidos identicos de $119,000 separados por 7 segundos
- Diana Galindo (573162131254): dos pedidos identicos de $38,000 separados por 6 segundos

Esto es por el dedup time window de 30 segundos (linea 1496) que deberia atraparlos, pero el segundo pedido puede haber llegado por una ruta diferente (confirmacion backend vs AI parsing). NO hay pedidos ligados a numeros incorrectos — los duplicados son del MISMO numero.

**Que se modifica:** Agregar `payment_method` al OrdersPanel para mejor visibilidad. El dedup guard ya funciona correctamente con 30s window; los duplicados del 18 Feb pudieron haber sido creados por rutas paralelas (webhook duplicado de Meta). Agregar log adicional para rastrear.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/whatsapp-webhook/index.ts` | Fix TDZ bug (linea 2387), reglas prompt "pedido listo" y "datafono", guardia total negativo, ampliar dedup guard |
| `src/components/alicia-dashboard/OrdersPanel.tsx` | Agregar `payment_method` visible, mostrar proof como imagen clickeable |
| Migracion SQL | UPDATE masivo para corregir ordenes existentes con status "received" + email_sent = true |

## Lo que NO se toca

- Flujo de confirmacion determinista
- Logica de batching/deduplicacion (solo se amplia el filtro)
- `buildOrderEmailHtml` (ya soporta proof)
- Logica de emails
- Personalidad base de Alicia

