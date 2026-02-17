import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ==================== CONFIGURATION ====================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GLOBAL_WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const GLOBAL_WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";
const WA_API_VERSION = "v22.0";
const LA_BARRA_RESTAURANT_ID = "899cb7a7-7de1-47c7-a684-f24658309755";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
console.log("WA Token starts with:", GLOBAL_WA_TOKEN.substring(0, 10), "length:", GLOBAL_WA_TOKEN.length);
console.log("WA Phone ID:", GLOBAL_WA_PHONE_ID);

// ==================== UTILITY FUNCTIONS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Human-like typing delay based on message length */
function humanDelay(text: string): number {
  const len = text.length;
  if (len < 50) return 2000 + Math.random() * 1000;
  if (len < 150) return 3000 + Math.random() * 2000;
  return 4000 + Math.random() * 2000;
}

/** Get current Colombia time info */
function getColombiaTime() {
  const now = new Date();
  const co = new Date(now.getTime() + (-5 * 60 + now.getTimezoneOffset()) * 60000);
  const h = co.getHours();
  const m = co.getMinutes();
  const d = co.getDay();
  const peak = (d === 5 || d === 6) && h >= 18 && h <= 22;
  const weekend = d === 5 || d === 6;
  return { hour: h, minute: m, day: d, peak, weekend, decimal: h + m / 60 };
}

// ==================== MEDIA HANDLING ====================

/** Download media from WhatsApp, upload to Supabase Storage, return public URL */
async function downloadAndUploadMedia(
  mediaId: string,
  token: string,
  folder: string,
  defaultMime: string,
): Promise<string | null> {
  try {
    // Step 1: Get media URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!metaRes.ok) {
      console.error(`Media meta error (${folder}):`, await metaRes.text());
      return null;
    }
    const metaData = await metaRes.json();
    if (!metaData.url) return null;

    // Step 2: Download the binary
    const dlRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!dlRes.ok) {
      console.error(`Media download error (${folder}):`, await dlRes.text());
      return null;
    }
    const blob = await dlRes.blob();
    const mime = metaData.mime_type || defaultMime;

    // Determine file extension from MIME
    let ext = "bin";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
    else if (mime.includes("mp4")) ext = "m4a";
    else if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("webp")) ext = "webp";

    const fileName = `${folder}/${Date.now()}-${mediaId}.${ext}`;

    // Step 3: Upload to Supabase Storage
    const { error } = await supabase.storage.from("whatsapp-media").upload(fileName, blob, {
      contentType: mime,
      upsert: true,
    });
    if (error) {
      console.error(`Storage upload error (${folder}):`, error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("whatsapp-media").getPublicUrl(fileName);
    console.log(`${folder} uploaded:`, urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    console.error(`Media handling failed (${folder}):`, e);
    return null;
  }
}

/** Transcribe audio using Lovable AI Gateway (Gemini) */
async function transcribeAudio(audioUrl: string): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for audio transcription");
      return null;
    }

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) return null;
    const audioBlob = await audioRes.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = audioBlob.type || "audio/ogg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un transcriptor de audio. Tu ÚNICA tarea es transcribir exactamente lo que dice la persona. Devuelve SOLO el texto transcrito. Si no entiendes, responde: NO_ENTENDIDO",
          },
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: { data: base64Audio, format: mimeType.includes("mp4") ? "m4a" : "ogg" },
              },
              { type: "text", text: "Transcribe este audio de WhatsApp." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Transcription AI error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content?.trim();
    if (!transcription || transcription === "NO_ENTENDIDO") return null;
    return transcription;
  } catch (e) {
    console.error("Transcription failed:", e);
    return null;
  }
}

// ==================== WHATSAPP API ====================

/** Split long text into human-like message chunks */
function splitIntoHumanChunks(text: string): string[] {
  if (text.length <= 200) return [text];
  const parts = text.split(/\n\n+/).filter((p) => p.trim());
  if (parts.length >= 2 && parts.length <= 4) return parts.map((p) => p.trim());
  const lines = text.split(/\n/).filter((p) => p.trim());
  if (lines.length >= 2) {
    const mid = Math.ceil(lines.length / 2);
    return [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")].filter((p) => p.trim());
  }
  return [text];
}

/** Send a plain text message via WhatsApp Cloud API */
async function sendWA(phoneId: string, token: string, to: string, text: string, addHumanDelay = false) {
  const chunks = splitIntoHumanChunks(text);

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];

    /* if (addHumanDelay) {
      const delay = i === 0 ? humanDelay(c) : 1500 + Math.random() * 1000;
      console.log(`⏳ Human delay: ${Math.round(delay)}ms before chunk ${i + 1}/${chunks.length}`);
      await sleep(delay);
    }*/

    // Handle WA 4096 char limit per message
    let rem = c;
    while (rem.length > 0) {
      let segment: string;
      if (rem.length <= 4000) {
        segment = rem;
        rem = "";
      } else {
        let s = rem.lastIndexOf("\n", 4000);
        if (s < 2000) s = rem.lastIndexOf(". ", 4000);
        if (s < 2000) s = 4000;
        segment = rem.substring(0, s);
        rem = rem.substring(s).trim();
      }

      const r = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: segment } }),
      });
      if (!r.ok) console.error("WA send error:", await r.text());
    }
  }
}

/** Send an interactive button message via WhatsApp Cloud API */
async function sendWAInteractive(
  phoneId: string,
  token: string,
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  addHumanDelay = false,
) {
  if (addHumanDelay) {
    const delay = humanDelay(bodyText);
    console.log(`⏳ Human delay: ${Math.round(delay)}ms before interactive message`);
    await sleep(delay);
  }

  // WhatsApp limits: max 3 buttons, body max 1024 chars, button title max 20 chars
  const trimmedBody = bodyText.substring(0, 1024);
  const trimmedButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title.substring(0, 20) },
  }));

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: trimmedBody },
      action: { buttons: trimmedButtons },
    },
  };

  console.log(`📱 Sending interactive buttons to ${to}:`, buttons.map((b) => b.title).join(", "));
  const r = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error("WA interactive error:", errText);
    // Fallback to plain text if interactive fails
    console.log("⚠️ Falling back to plain text message");
    await sendWA(
      phoneId,
      token,
      to,
      bodyText + "\n\nResponde:\n1️⃣ Confirmar\n2️⃣ Agregar más\n3️⃣ Cancelar",
      addHumanDelay,
    );
  }
}

/** Mark message as read */
async function markRead(phoneId: string, token: string, msgId: string) {
  await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: msgId }),
  });
}

// ==================== CONVERSATION MANAGEMENT ====================

/** Get or create a conversation record */
async function getConversation(rid: string, phone: string) {
  const { data: ex } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("restaurant_id", rid)
    .eq("customer_phone", phone)
    .maybeSingle();
  if (ex) return ex;
  const { data: cr, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ restaurant_id: rid, customer_phone: phone, messages: [], order_status: "none" })
    .select()
    .single();
  if (error) throw error;
  return cr;
}

// ==================== AI PROMPT BUILDING ====================

function buildPrompt(
  products: any[],
  promoted: string[],
  greeting: string,
  name: string,
  order: any,
  status: string,
  config?: any,
) {
  const prom =
    promoted.length > 0 ? `\nPRODUCTOS RECOMENDADOS HOY:\n${promoted.map((p: string) => `⭐ ${p}`).join("\n")}` : "";
  let ctx = status !== "none" && order ? `\n\nPEDIDO ACTUAL:\n${JSON.stringify(order)}\nEstado: ${status}` : "";
  if (status === "confirmed" && config?._confirmed_at) {
    const minutesSince = Math.floor((Date.now() - new Date(config._confirmed_at).getTime()) / 60000);
    ctx += `\nTiempo desde confirmación: ${minutesSince} minutos`;
  }

  const { hour: h, day: d, peak, weekend: we } = getColombiaTime();
  const isLaBarra = config?.restaurant_id === LA_BARRA_RESTAURANT_ID;

  if (isLaBarra) {
    return buildLaBarraPrompt(prom, ctx, peak, we, greeting, name, order, status);
  }

  if (config?.setup_completed && config?.restaurant_name) {
    return buildDynamicPrompt(config, products, promoted, prom, ctx, peak, we, h, d, greeting, order, status);
  }

  // Fallback
  return buildLaBarraPrompt(prom, ctx, peak, we, greeting, name, order, status);
}

function buildDynamicPrompt(
  config: any,
  products: any[],
  promoted: string[],
  prom: string,
  ctx: string,
  peak: boolean,
  we: boolean,
  h: number,
  d: number,
  greeting: string,
  order: any,
  status: string,
): string {
  const personality = config.personality_rules || {};
  const delivery = config.delivery_config || {};
  const payment = config.payment_config || {};
  const packaging = config.packaging_rules || [];
  const hours = config.operating_hours || {};
  const times = config.time_estimates || {};
  const escalation = config.escalation_config || {};
  const customRules = config.custom_rules || [];
  const salesRules = config.sales_rules || {};
  const tone = personality.tone || "casual_professional";
  const assistantName = personality.name || "Alicia";
  const dailyOverrides = config.daily_overrides || [];

  // Schedule
  let scheduleBlock = "";
  const openTime = hours.open_time ? parseFloat(hours.open_time.replace(":", ".")) : null;
  const closeTime = hours.close_time ? parseFloat(hours.close_time.replace(":", ".")) : null;

  if (openTime !== null && closeTime !== null) {
    const currentDecimal = h + new Date().getMinutes() / 60;
    const prepStart = hours.preparation_start || hours.open_time;

    if (currentDecimal < openTime) {
      scheduleBlock = `ESTADO: Cerrado. Abrimos a las ${hours.open_time}.`;
      if (hours.accept_pre_orders) {
        scheduleBlock += ` Puedes tomar el pedido: "${hours.pre_order_message || `Empezamos a preparar a las ${prepStart}`}"`;
      }
    } else if (currentDecimal >= closeTime) {
      scheduleBlock = `ESTADO: Cerrando. Horario: ${hours.open_time} - ${hours.close_time}.${hours.may_extend ? " A veces nos extendemos." : ""}`;
    } else {
      scheduleBlock = `ESTADO: ABIERTOS. ${hours.open_time} - ${hours.close_time}.`;
    }
  }

  // Daily overrides
  let overridesBlock = "";
  if (dailyOverrides.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const active = dailyOverrides.filter((o: any) => !o.expires || o.expires >= today);
    if (active.length > 0) {
      overridesBlock = "\nCAMBIOS DE HOY:\n" + active.map((o: any) => `- ${o.instruction || o.value}`).join("\n");
    }
  }

  // Menu
  let menuBlock = "";
  if (config.menu_data?.length > 0) {
    let indexBlock = "=== ÍNDICE DEL MENÚ ===\n";
    for (const cat of config.menu_data) {
      const itemNames = (cat.items || [])
        .filter((i: any) => i.name)
        .map((i: any) => i.name)
        .join(", ");
      if (itemNames) indexBlock += `- ${(cat.name || "").toUpperCase()}: ${itemNames}\n`;
    }
    indexBlock += "=== FIN ÍNDICE ===\n\nREGLA: ANTES de decir 'no tenemos eso', revisa el índice completo.\n\n";

    menuBlock = indexBlock + "=== MENÚ CON PRECIOS ===\n\n";
    for (const cat of config.menu_data) {
      menuBlock += `${(cat.name || "").toUpperCase()}:\n`;
      for (const item of cat.items || []) {
        if (!item.name) continue;
        const rec = item.is_recommended ? "⭐ " : "";
        if (item.sizes?.length > 0) {
          const sizeStr = item.sizes
            .map((s: any) => `${s.name} $${(s.price || 0).toLocaleString("es-CO")}`)
            .join(" / ");
          menuBlock += `- ${rec}${item.name}: ${sizeStr}\n`;
        } else {
          menuBlock += `- ${rec}${item.name}: $${(item.price || 0).toLocaleString("es-CO")}${item.description ? ` (${item.description})` : ""}\n`;
        }
      }
      menuBlock += "\n";
    }
    menuBlock += "=== FIN MENÚ ===\n";
  } else if (products?.length > 0) {
    menuBlock =
      "=== PRODUCTOS ===\n" +
      products
        .map(
          (p) => `- ${p.name}: $${(p.price || 0).toLocaleString("es-CO")}${p.description ? ` (${p.description})` : ""}`,
        )
        .join("\n") +
      "\n=== FIN ===\n";
  }

  // Delivery
  let deliveryBlock = "";
  if (delivery.enabled) {
    const freeZones = (delivery.free_zones || []).join(", ");
    deliveryBlock = freeZones
      ? `DOMICILIO GRATIS: ${freeZones}. ${delivery.paid_delivery_note || "Otras zonas se pagan aparte."} Si insisten → ---CONSULTA_DOMICILIO---`
      : `DOMICILIO: ${delivery.paid_delivery_note || "Se paga al domiciliario."} Si insisten → ---CONSULTA_DOMICILIO---`;
  } else {
    deliveryBlock = `Solo recogida. ${delivery.pickup_only_details || ""}`;
  }

  // Payment
  const methods = (payment.methods || []).join(", ");
  let paymentBlock = `PAGO: ${methods || "efectivo"}.`;
  if (payment.bank_details) paymentBlock += ` Datos: ${payment.bank_details}.`;
  if (payment.require_proof) paymentBlock += " Pedir foto del comprobante.";

  // Packaging
  const packagingBlock =
    packaging.length > 0
      ? "EMPAQUES (domicilio/llevar):\n" +
        packaging.map((p: any) => `- ${p.type}: +$${(p.cost || 0).toLocaleString("es-CO")}`).join("\n")
      : "";

  // Time estimates
  const timeBlock = times.weekday
    ? `TIEMPOS: Semana ${times.weekday}. Finde ${times.weekend || times.weekday}. Pico ${times.peak || times.weekday}. Actual: ${peak ? `PICO ${times.peak || "~30min"}` : we ? `Finde ${times.weekend || "~20min"}` : `Semana ${times.weekday}`}`
    : "";

  // Escalation
  const escalationBlock = escalation.human_phone
    ? `ESCALAMIENTO: Si insiste en persona → "${escalation.escalation_message || `Comunícate al ${escalation.human_phone}`}". Solo ---ESCALAMIENTO--- para temas técnicos.`
    : "";

  // Custom rules
  const rulesBlock = customRules.length > 0 ? "REGLAS:\n" + customRules.map((r: string) => `- ${r}`).join("\n") : "";

  // Tone
  let toneBlock = "";
  if (tone === "very_casual") toneBlock = "Habla MUY casual, como una amiga. Usa jerga local.";
  else if (tone === "formal") toneBlock = "Habla profesional. Trato de usted.";
  else toneBlock = "Habla cercana y profesional. Natural, cálida pero con respeto.";

  const menuLinkBlock = config.menu_link ? `\nCARTA: ${config.menu_link}` : "";

  return `Eres ${assistantName}, trabajas en "${config.restaurant_name}"${config.location_address ? ` en ${config.location_address}` : ""}. Eres una IA que atiende por WhatsApp. No lo digas espontáneamente, pero si preguntan, admítelo: "Sí, soy IA, pero te atiendo como la mejor mesera 😊".

${scheduleBlock}
${overridesBlock}

TRATO AL CLIENTE:
- PROHIBIDO: "mi amor", "mi vida", "cariño", "corazón", "cielo", "linda", "hermosa", "papi", "mami", "reina", "rey". NUNCA apodos cariñosos
- Cuando sepas el nombre → úsalo: "Claro, María" o "Listo, señor Carlos"
- Si NO sabes el nombre → tutea con amabilidad: "Claro, con gusto te ayudo"
- Sé paciente. NUNCA respondas con agresividad ni impaciencia
- NUNCA inventes información sobre el negocio

REGLAS DE FORMATO:
- Primera letra MAYÚSCULA siempre. NO punto final. Mensajes CORTOS (1-2 líneas). Máximo 1 emoji cada 2-3 mensajes
- ${toneBlock}
- Varía: "dale", "listo", "va", "claro", "bueno", "perfecto", "con gusto", "por supuesto"
- PROHIBIDO: "oki", "cositas ricas", "delicias", signos dobles (!!)
- Si preguntan si eres bot → admítelo. NUNCA niegues ser IA

${config.restaurant_description ? `NEGOCIO: ${config.restaurant_description}` : ""}
UBICACIÓN: ${config.location_details || config.location_address || "Consulta con el equipo"}

VENTA: Máximo ${salesRules.max_suggestions_per_order || 1} sugerencia por pedido. Si dice "no" → cero insistencia
CONTEXTO: Lee historial COMPLETO. Si ya dieron info, NO la pidas de nuevo. Max 2 veces la misma pregunta
FORMATO: NUNCA asteriscos, negritas, markdown. NUNCA "la comunicación puede fallar"

AUDIOS: "[Audio transcrito]:" → responde natural. "[Audio no transcrito]" → "No te escuché, me lo escribes?"
STICKERS: Responde simpático y redirige al pedido

SALUDO: "${greeting}"
${menuLinkBlock}

${menuBlock}
${prom}
${rulesBlock}
${packagingBlock}
${deliveryBlock}
${timeBlock}
${paymentBlock}
${escalationBlock}

FLUJO (un paso por mensaje, NO te saltes pasos):
1. Saluda y pregunta qué quiere
2. Anota cada producto. Después de cada uno pregunta: "Algo más?"
3. Cuando diga "no", "eso es todo", "nada más" → pregunta: recoger o domicilio
4. Si domicilio → pide nombre y dirección. Si recoger → pide solo nombre
5. Indica datos de pago
6. Presenta resumen COMPLETO (productos + empaques + total) y pregunta: "Todo bien con el pedido?"
7. Cuando el cliente confirme (sí, dale, listo, va, ok, correcto, etc.) → ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- + despedida cálida
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

CONFIRMACIÓN (REGLA CRÍTICA):
- Solo pide confirmación UNA VEZ, después del resumen final con TODOS los datos completos
- NUNCA preguntes "confirmamos?" mientras el cliente aún está pidiendo productos
- Cualquier respuesta afirmativa confirma el pedido
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas

MODIFICACIONES (solo pedidos ya confirmados):
- CAMBIO (<25 min) → ---CAMBIO_PEDIDO---{json}---FIN_CAMBIO---
- CAMBIO (>25 min) → "Ya lo preparamos, te lo mandamos como lo pediste"
- ADICIÓN → ---ADICION_PEDIDO---{json items nuevos + nuevo total}---FIN_ADICION---

REGLAS INQUEBRANTABLES:
1. PRECIOS: NUNCA inventes. Verifica en el menú
2. TAMAÑOS: Solo los del menú
3. PRODUCTOS: NUNCA digas que no existe sin revisar TODO el menú
4. EMPAQUES: Obligatorios en domicilio/llevar
5. DESGLOSE: producto + precio + empaque + total. Números DEBEN cuadrar
6. DIRECCIÓN: Cuando la den, GRÁBALA. DEBE aparecer en el JSON
7. IDENTIDAD: Si preguntan si eres bot → admítelo
8. FRUSTRACIÓN: Cliente frustrado → pasa al humano: "${escalation.human_phone || "administrador"}"
9. VERDAD: NUNCA inventes información sobre el negocio, sedes o productos

CONFIRMACIÓN FINAL: ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---. NUNCA muestres JSON al cliente.
${ctx}`;
}

function buildLaBarraPrompt(
  prom: string,
  ctx: string,
  peak: boolean,
  we: boolean,
  greeting: string,
  name: string,
  order: any,
  status: string,
): string {
  const { hour: currentHour, minute: currentMin, decimal: currentDecimal } = getColombiaTime();

  let scheduleBlock = "";
  if (currentDecimal < 15) {
    const hoursUntilOpen = Math.floor(15.5 - currentDecimal);
    const minsUntilOpen = Math.round((15.5 - currentDecimal - hoursUntilOpen) * 60);
    scheduleBlock = `ESTADO: NO hemos abierto. Abrimos 3:00 PM. Puedes tomar pedido: "Empezamos a preparar a las 3:30 pm". ${hoursUntilOpen > 2 ? `Faltan ~${hoursUntilOpen}h${minsUntilOpen > 0 ? ` ${minsUntilOpen}min` : ""}` : ""}`;
  } else if (currentDecimal >= 23) {
    scheduleBlock = `ESTADO: Cerrando. Horario 3PM-11PM. "Escríbenos mañana desde las 3 pm"`;
  } else {
    scheduleBlock = `ESTADO: ABIERTOS. 3:00 PM - 11:00 PM. Atendiendo normalmente.`;
  }

  return `Eres Alicia, trabajas en "La Barra Crea Tu Pizza" en Ibagué. Eres IA que atiende por WhatsApp. Eres amable, paciente y respetuosa. Si preguntan si eres bot → admítelo: "Sí, soy una asistente virtual, pero te atiendo con todo el gusto del mundo 😊".

HORARIO: Abrimos TODOS LOS DÍAS 3:00 PM - 11:00 PM (a veces nos extendemos). NUNCA digas otra hora.
Antes de las 3 PM → toma pedido y di "a partir de las 3:30 pm empezamos a preparar"
${scheduleBlock}

HISTORIA: Fundador Santiago Cuartas Hernández. Durante la pandemia, el mejor pizzero de Italia les enseñó la receta ganadora de masa italiana. Santiago emprendió a los 16 con apoyo de su mamá.

SEDES OFICIALES: La Samaria y El Vergel. AMBAS son sedes oficiales de La Barra. NUNCA digas que El Vergel no es oficial.
La Estación es una franquicia vendida que ya no cumple nuestros estándares (en proceso legal). Si se quejan de La Estación → empatía, explica que es franquicia que ya no maneja nuestros estándares, invita a sedes oficiales (La Samaria o El Vergel).

TRATO AL CLIENTE (REGLAS OBLIGATORIAS):
- PROHIBIDO TOTALMENTE: "mi amor", "mi vida", "cariño", "corazón", "cielo", "linda", "hermosa", "papi", "mami", "reina", "rey". NUNCA uses apodos cariñosos
- Cuando sepas el nombre del cliente → úsalo: "Claro, María" o "Listo, señor Carlos"
- Si NO sabes el nombre → tutea con amabilidad: "Claro, con gusto te ayudo"
- Sé paciente. Si el cliente no entiende o repite → explica con calma, NUNCA con agresividad ni impaciencia
- Tono: cercano y profesional. Como una mesera amable que trata bien a todos, no como una amiga íntima
- Si el cliente dice algo ambiguo → pregunta con amabilidad, no asumas

REGLAS DE FORMATO:
- Primera letra MAYÚSCULA siempre. NO punto final. Mensajes CORTOS (1-2 líneas)
- Varía: "Dale", "Listo", "Claro que sí", "Con mucho gusto", "Por supuesto", "Va"
- PROHIBIDO: "oki", "cositas ricas", "delicias", signos dobles (!!), "mi amor", "cariño"
- Máximo 1 emoji cada 2-3 mensajes. NO abuses de emojis
- Si preguntan si eres bot → ADMÍTELO. NUNCA niegues ser IA

REGLA DE VERDAD: NUNCA inventes información. Si no sabes algo → di "no tengo esa info, déjame consultar". NUNCA digas que una sede no es oficial si lo es. NUNCA contradigas datos del negocio.

EJEMPLOS:
Bien: "Claro que sí, te anoto eso con mucho gusto" | "Listo, una pepperoni mediana. Algo más?" | "Con gusto, María"
Mal: "Sí qué, mi amor?" | "Dale cariño" | "El Vergel no es sede oficial"

APERTURA: "Hola! Qué gusto tenerte por acá 😊 Ya sabes qué quieres o te envío la carta?"
SEDES PARA ENVÍO: La Samaria (44 con 5ta) y El Vergel. Ambas disponibles

VENTA: Sugiere UN complemento natural. Si dice "no" → SE ACABÓ. Cero insistencia. Máximo 1 sugerencia por pedido
CONTEXTO CONVERSACIONAL (REGLA CRÍTICA):
- Lee SIEMPRE el historial COMPLETO antes de responder. Si el cliente ya dio su nombre, dirección o cualquier dato → NO lo pidas de nuevo
- Si dice "ya te lo dije" o "ya te di mi nombre" → BUSCA en los mensajes anteriores y úsalo. NUNCA digas "no lo encuentro"
- El cliente puede dar nombre y dirección en mensajes separados. DEBES recordar AMBOS
- ${name ? `NOMBRE DEL CLIENTE YA CONOCIDO: "${name}". Úsalo. NO vuelvas a pedirlo` : "Nombre del cliente: aún no proporcionado"}
FORMATO: NUNCA asteriscos, negritas, markdown. Máximo 1 emoji cada 2-3 mensajes

AUDIOS: "[Audio transcrito]:" → responde natural. "[Audio no transcrito]" → "No te escuché, me lo escribes?"
STICKERS: Responde simpático y redirige al pedido

SALUDO: "${greeting}"
CARTA: https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk

=== ÍNDICE DEL MENÚ ===
MARISCOS/MAR: Pizza Camarones, Pizza Pulpo, Pizza Anchoas, Camarones Finas Hierbas (entrada), Fettuccine con Camarones, Brioche al Camarón, Langostinos Parrillados
CARNES: Hamburguesa Italiana, Brocheta di Manzo, Pan Francés & Bondiola, Pizza Colombiana de la Tata
PIZZAS SALADAS: 25+ variedades en Personal (4 porc) y Mediana (6 porc). SOLO esos tamaños
PASTAS: Spaghetti Bolognese, Fettuccine Carbonara, Fettuccine Camarones, Spaghetti 4 Quesos, al Teléfono, Ravioles, Lasagna
ENTRADAS: Nuditos de Ajo, Camarones Finas Hierbas, Champiñones Gratinados, Burrata La Barra, Burrata Tempura, Brie al Horno
SÁNDWICHES: Brioche al Camarón, Brioche Pollo, Pan Francés & Bondiola
POSTRES: 11 pizzas dulces (Cocada, Lemon Crust, Hershey's, Dubai Chocolate, etc.)
BEBIDAS: Limonadas, Sodificadas, Cócteles, Sangría, Cervezas, Vinos, Gaseosa, Agua
TAPAS: Tapas Españolas (3 sabores)
=== FIN ÍNDICE ===

ANTI-NEGACIÓN: ANTES de decir "no tenemos eso" → revisa índice. Si piden "mariscos" → busca en MARISCOS/MAR

DISAMBIGUATION:
- "Camarones" → preguntar: pizza, entrada, fettuccine o brioche?
- "Burrata" → preguntar: entrada Burrata La Barra, Burrata Tempura, o Pizza Prosciutto & Burrata?
- "Pasta" → preguntar cuál: Carbonara, Camarones, Bolognese, 4 Quesos, al Teléfono, Ravioles, Lasagna

=== MENÚ OFICIAL (COP) ===

LIMONADAS:
- Natural $9.000 | Hierbabuena $12.000 | Cerezada $14.000 | ⭐ Coco $16.000

SODIFICADAS:
- Piña $14.000 | Frutos Rojos $14.000 | Lyche & Fresa $16.000

CÓCTELES:
- Gintonic $42.000 | ⭐ Mojito $40.000 | Margarita $38.000 | ⭐ Piña Colada $38.000 | Aperol Spritz $28.000

SANGRÍA:
- ⭐ Tinto: Copa $26.000 / 500ml $57.000 / 1Lt $86.000
- Blanco: Copa $28.000 / 500ml $60.000 / 1Lt $92.000
- Copa De Vino $26.000 | Tinto De Verano $25.000

CERVEZAS:
- Club Colombia $12.000 | Corona $16.000 | Stella Artois $16.000 | Artesanal $16.000

BEBIDAS:
- Gaseosa $8.000 | Agua $6.000 | Agua con gas $6.000 | St. Pellegrino 1L $19.000

ENTRADAS:
- Nuditos De Ajo $10.000
- Camarones Finas Hierbas $35.000
- Champiñones Gratinados $33.000
- Burrata La Barra $38.000
- Burrata Tempura $40.000
- Brie Al Horno $32.000

TAPAS ESPAÑOLAS: Chorizo Español | Piquillo con Queso | Aceitunas Marinadas → 1 tapa $15.000 | 2 tapas $26.000 | 3 tapas $35.000

PIZZAS SALADAS (Personal / Mediana):
- Margarita $25.000 / $35.000
- Pepperoni $28.000 / $39.000
- Hawaiana $28.000 / $39.000
- Calzone $30.000 / $42.000
- Capricciosa $30.000 / $42.000
- Stracciatella $30.000 / $42.000
- ⭐ Camarones $34.000 / $48.000
- Pulpo $34.000 / $48.000
- Anchoas $30.000 / $42.000
- Porchetta $30.000 / $42.000
- Diavola $30.000 / $42.000
- Valenciana $32.000 / $44.000
- Parmesana $30.000 / $42.000
- Higos y Queso Azul $30.000 / $42.000
- Dátiles $30.000 / $42.000
- Siciliana $30.000 / $42.000
- ⭐ Española $34.000 / $48.000
- ⭐ La Barra $34.000 / $48.000
- Colombiana de la Tata $30.000 / $42.000
- Turca $30.000 / $42.000
- Huerto $30.000 / $42.000
- Alpes $30.000 / $42.000
- Prosciutto & Burrata $34.000 / $48.000

PIZZAS DULCES (Personal / Mediana):
- Cocada $24.000 / $34.000
- ⭐ Lemon Crust $24.000 / $34.000
- ⭐ Hershey's Pizza $24.000 / $34.000
- ⭐ Dubai Chocolate $26.000 / $36.000
- Canelate $24.000 / $34.000
- Arándanos y Queso $24.000 / $34.000
- Arequipe y Maní $24.000 / $34.000
- Frutos Rojos y Brownie $24.000 / $34.000
- Nutella & Oreo $24.000 / $34.000
- 3 Leches $24.000 / $34.000
- Maracumango $24.000 / $34.000

PASTAS:
- Spaghetti Bolognese $39.000
- Fettuccine Carbonara $39.000
- Fettuccine con Camarones $44.000
- Spaghetti 4 Quesos $39.000
- Spaghetti al Teléfono $39.000
- Ravioles $39.000
- Lasagna $39.000

OTROS:
- Hamburguesa Italiana $39.000
- Brocheta di Manzo $39.000
- Langostinos Parrillados $52.000
- Brioche al Camarón $42.000
- Brioche Pollo $38.000
- Pan Francés & Bondiola $38.000
=== FIN MENÚ ===

EMPAQUES (domicilio/llevar, van SÍ O SÍ):
- Pizza/postre: $2.000 | Pasta/entrada/sándwich/hamburguesa: $3.000 | Bebida: $1.000

${prom}

DOMICILIO: 
- DOMICILIO GRATIS ($0): SOLO estos conjuntos → Ática, Foret, Wakari, Antigua, Salento, Fortaleza, Mallorca, Mangle
- CUALQUIER otra dirección: el domicilio NO es gratis. Dile: "El domicilio se paga directamente al domiciliario cuando llegue"

PAGO: Efectivo (contra entrega o en local). Cuenta Bancolombia Ahorros 718-000042-16, a nombre de LA BARRA CREA TU PIZZA, con NIT 901684302. Si transferencia → pedir comprobante

TIEMPOS (solo si preguntan): Semana ~15-20min. Finde ~20-30min. ${peak ? "Ahora HORA PICO: ~25-35min" : ""}

FLUJO (un paso por mensaje, NO te saltes pasos):
1. Saluda y pregunta qué quiere
2. Anota cada producto. Después de cada uno pregunta: "Algo más?" (NO preguntes "confirmamos?" aquí)
3. Cuando diga "no", "eso es todo", "nada más" → pregunta: recoger o domicilio
4. Si domicilio → pide dirección. Si NO tienes el nombre aún → pídelo. Si YA lo tienes (revisa historial y contexto) → NO lo pidas de nuevo
5. Indica datos de pago
6. Presenta resumen COMPLETO (productos + empaques + total) y pregunta: "Todo bien con el pedido?"
7. Cuando el cliente confirme (sí, dale, listo, va, ok, correcto, etc.) → ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- + despedida cálida
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

CONFIRMACIÓN (REGLA CRÍTICA):
- Solo pide confirmación UNA VEZ, después del resumen final con TODOS los datos completos
- NUNCA preguntes "confirmamos?" mientras el cliente aún está pidiendo productos
- NUNCA pidas confirmación si falta info (dirección, nombre, tipo de entrega)
- Cualquier respuesta afirmativa del cliente (sí, dale, listo, va, ok, perfecto, correcto) confirma el pedido
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas ni sugerencias
- Ejemplo: "Listo, pedido confirmado! Ya lo estamos preparando. Gracias por pedir en La Barra 🍕"

POST-CONFIRMACIÓN:
- Si el cliente escribe después de confirmar y no es gratitud ni pregunta → déjalo pasar a la IA normal
- NO sigas la conversación del pedido anterior

MODIFICACIONES (solo pedidos ya confirmados):
- CAMBIO (<25 min) → ---CAMBIO_PEDIDO---{json}---FIN_CAMBIO---
- CAMBIO (>25 min) → "Ya lo preparamos, te lo mandamos como lo pediste"
- ADICIÓN → ---ADICION_PEDIDO---{json items nuevos + nuevo total}---FIN_ADICION---

REGLAS INQUEBRANTABLES:
1. PRECIOS: NUNCA inventes. Verifica en el menú
2. TAMAÑOS: Solo Personal y Mediana. NO inventes otros
3. PRODUCTOS: NUNCA digas que no existe sin revisar TODO el menú
4. EMPAQUES: Obligatorios en domicilio/llevar
5. DESGLOSE: producto + precio + empaque + total. Números DEBEN cuadrar
6. DIRECCIÓN: Cuando la den, GRÁBALA. DEBE aparecer en el JSON
7. IDENTIDAD: Si preguntan si eres bot → admítelo
8. FRUSTRACIÓN → pasa al humano: "3146907745"
9. VERDAD: NUNCA inventes información sobre el negocio, sedes o productos

CONFIRMACIÓN FINAL: ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---. NUNCA muestres JSON al cliente.
${ctx}`;
}

// ==================== PRICE VALIDATION (LA BARRA) ====================

const LA_BARRA_PRICES: Record<string, Record<string, number>> = {
  Margarita: { personal: 25000, mediana: 35000 },
  Pepperoni: { personal: 28000, mediana: 39000 },
  Hawaiana: { personal: 28000, mediana: 39000 },
  Calzone: { personal: 30000, mediana: 42000 },
  Capricciosa: { personal: 30000, mediana: 42000 },
  Stracciatella: { personal: 30000, mediana: 42000 },
  Camarones: { personal: 34000, mediana: 48000 },
  Pulpo: { personal: 34000, mediana: 48000 },
  Anchoas: { personal: 30000, mediana: 42000 },
  Porchetta: { personal: 30000, mediana: 42000 },
  Diavola: { personal: 30000, mediana: 42000 },
  Valenciana: { personal: 32000, mediana: 44000 },
  Parmesana: { personal: 30000, mediana: 42000 },
  "Higos y Queso Azul": { personal: 30000, mediana: 42000 },
  Dátiles: { personal: 30000, mediana: 42000 },
  Siciliana: { personal: 30000, mediana: 42000 },
  Española: { personal: 34000, mediana: 48000 },
  "La Barra": { personal: 34000, mediana: 48000 },
  "Colombiana de la Tata": { personal: 30000, mediana: 42000 },
  Turca: { personal: 30000, mediana: 42000 },
  Huerto: { personal: 30000, mediana: 42000 },
  Alpes: { personal: 30000, mediana: 42000 },
  "Prosciutto & Burrata": { personal: 34000, mediana: 48000 },
  Cocada: { personal: 24000, mediana: 34000 },
  "Lemon Crust": { personal: 24000, mediana: 34000 },
  "Hershey's Pizza": { personal: 24000, mediana: 34000 },
  "Dubai Chocolate": { personal: 26000, mediana: 36000 },
  Canelate: { personal: 24000, mediana: 34000 },
  "Arándanos y Queso": { personal: 24000, mediana: 34000 },
  "Arequipe y Maní": { personal: 24000, mediana: 34000 },
  "Frutos Rojos y Brownie": { personal: 24000, mediana: 34000 },
  "Nutella & Oreo": { personal: 24000, mediana: 34000 },
  "3 Leches": { personal: 24000, mediana: 34000 },
  Maracumango: { personal: 24000, mediana: 34000 },
  "Spaghetti Alla Bolognese": { unico: 39000 },
  "Fettuccine Alla Carbonara": { unico: 39000 },
  "Fettuccine con Camarones": { unico: 44000 },
  "Spaghetti 4 Quesos": { unico: 39000 },
  "Spaghetti al Teléfono": { unico: 39000 },
  Ravioles: { unico: 39000 },
  Lasagna: { unico: 39000 },
  "Hamburguesa Italiana": { unico: 39000 },
  "Brocheta di Manzo": { unico: 39000 },
  "Langostinos Parrillados": { unico: 52000 },
  "Brioche al Camarón": { unico: 42000 },
  "Brioche Pollo": { unico: 38000 },
  "Pan Francés & Bondiola De Cerdo": { unico: 38000 },
  "Nuditos De Ajo": { unico: 10000 },
  "Camarones a las Finas Hierbas": { unico: 35000 },
  "Champiñones Gratinados Queso Azul": { unico: 33000 },
  "Burrata La Barra": { unico: 38000 },
  "Burrata Tempura": { unico: 40000 },
  "Brie Al Horno": { unico: 32000 },
};

/** Get packaging cost by product name */
function getPackagingCost(itemName: string): number {
  const n = itemName.toLowerCase();
  // Pizza/postre keywords
  if (
    n.includes("pizza") ||
    n.includes("margarita") ||
    n.includes("hawaiana") ||
    n.includes("pepperoni") ||
    n.includes("calzone") ||
    n.includes("capricciosa") ||
    n.includes("stracciatella") ||
    n.includes("pulpo") ||
    n.includes("anchoas") ||
    n.includes("porchetta") ||
    n.includes("diavola") ||
    n.includes("valenciana") ||
    n.includes("parmesana") ||
    n.includes("higos") ||
    n.includes("dátiles") ||
    n.includes("siciliana") ||
    n.includes("española") ||
    n.includes("la barra") ||
    n.includes("tata") ||
    n.includes("turca") ||
    n.includes("huerto") ||
    n.includes("alpes") ||
    n.includes("camarones") ||
    (n.includes("burrata") && n.includes("prosciutto")) ||
    n.includes("cocada") ||
    n.includes("lemon") ||
    n.includes("hershey") ||
    n.includes("dubai") ||
    n.includes("canelate") ||
    n.includes("arándanos") ||
    n.includes("arequipe") ||
    n.includes("frutos") ||
    n.includes("nutella")
  )
    return 2000;
  // Pasta/sandwich/entrada
  if (
    n.includes("spaghetti") ||
    n.includes("fettuccine") ||
    n.includes("ravioles") ||
    n.includes("lasagna") ||
    n.includes("pasta") ||
    n.includes("carbonara") ||
    n.includes("bolognese") ||
    n.includes("teléfono") ||
    n.includes("quesos") ||
    n.includes("hamburguesa") ||
    n.includes("brioche") ||
    n.includes("brocheta") ||
    n.includes("bondiola") ||
    n.includes("langostinos") ||
    n.includes("sandwich") ||
    n.includes("nuditos") ||
    n.includes("champiñones") ||
    n.includes("brie") ||
    n.includes("burrata") ||
    n.includes("tapas")
  )
    return 3000;
  // Beverages
  if (
    n.includes("limonada") ||
    n.includes("sodificada") ||
    n.includes("gaseosa") ||
    n.includes("agua") ||
    n.includes("coca") ||
    n.includes("cerveza") ||
    n.includes("vino") ||
    n.includes("copa")
  )
    return 1000;
  return 2000;
}

/** Validate and correct order prices/packaging for La Barra */
function validateOrder(order: any, isLaBarra: boolean): { order: any; corrected: boolean; issues: string[] } {
  if (!isLaBarra || !order?.items) return { order, corrected: false, issues: [] };

  const issues: string[] = [];
  let corrected = false;
  const isDelivery =
    (order.delivery_type || "").toLowerCase().includes("delivery") ||
    (order.delivery_type || "").toLowerCase().includes("domicilio");

  for (const item of order.items) {
    const itemName = item.name || "";

    // Price validation
    for (const [productName, prices] of Object.entries(LA_BARRA_PRICES)) {
      if (
        itemName.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(itemName.toLowerCase())
      ) {
        const declaredPrice = item.unit_price || 0;
        const validPrices = Object.values(prices);
        if (declaredPrice > 0 && !validPrices.includes(declaredPrice)) {
          const closest = validPrices.reduce((a: number, b: number) =>
            Math.abs(b - declaredPrice) < Math.abs(a - declaredPrice) ? b : a,
          );
          issues.push(
            `PRECIO CORREGIDO: ${itemName} de $${declaredPrice.toLocaleString()} a $${closest.toLocaleString()}`,
          );
          item.unit_price = closest;
          corrected = true;
        }
        break;
      }
    }

    // Packaging validation for delivery
    if (isDelivery && (!item.packaging_cost || item.packaging_cost <= 0)) {
      const pkg = getPackagingCost(itemName);
      item.packaging_cost = pkg;
      issues.push(`Empaque faltante para ${itemName}: +$${pkg}`);
      corrected = true;
    }
  }

  // Recalculate totals
  let subtotal = 0;
  let packagingTotal = 0;
  for (const item of order.items) {
    subtotal += (item.unit_price || 0) * (item.quantity || 1);
    packagingTotal += (item.packaging_cost || 0) * (item.quantity || 1);
  }
  const calculatedTotal = subtotal + packagingTotal;
  if (order.total !== calculatedTotal) {
    issues.push(`TOTAL CORREGIDO: de $${(order.total || 0).toLocaleString()} a $${calculatedTotal.toLocaleString()}`);
    corrected = true;
  }
  order.subtotal = subtotal;
  order.packaging_total = packagingTotal;
  order.total = calculatedTotal;

  if (issues.length > 0) console.log("🔧 ORDER CORRECTIONS:", issues.join("; "));
  return { order, corrected, issues };
}

// ==================== AI INTEGRATION ====================

/** Call AI for response generation */
async function callAI(sys: string, msgs: any[], temperature = 0.4) {
  const m = msgs.slice(-30).map((x: any) => ({
    role: x.role === "customer" ? "user" : "assistant",
    content: x.content,
  }));
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, ...m],
      temperature,
      max_tokens: 800,
    }),
  });
  if (!r.ok) {
    const e = await r.text();
    console.error("AI err:", e);
    throw new Error(e);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu mensaje. ¿Podrías repetirlo?";
}

// ==================== ORDER PARSING ====================

function parseOrder(txt: string) {
  const m = txt.match(/---PEDIDO_CONFIRMADO---\s*([\s\S]*?)\s*---FIN_PEDIDO---/);
  if (!m) {
    // Safety net: detect raw JSON with order structure
    const jsonMatch = txt.match(/\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?"total"\s*:\s*\d+[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const recovered = JSON.parse(jsonMatch[0]);
        if (recovered.items && recovered.total) {
          console.log("⚠️ SAFETY NET: Recovered order from raw JSON");
          return {
            order: recovered,
            clean:
              txt
                .replace(jsonMatch[0], "")
                .replace(/```json\s*/g, "")
                .replace(/```/g, "")
                .trim() || "✅ Pedido registrado! 🍽️",
          };
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }
  try {
    return {
      order: JSON.parse(m[1].trim()),
      clean: txt.replace(/---PEDIDO_CONFIRMADO---[\s\S]*?---FIN_PEDIDO---/, "").trim(),
    };
  } catch {
    return null;
  }
}

function parseOrderModification(txt: string): { type: "addition" | "change"; order: any; clean: string } | null {
  const addMatch = txt.match(/---ADICION_PEDIDO---\s*([\s\S]*?)\s*---FIN_ADICION---/);
  if (addMatch) {
    try {
      return {
        type: "addition",
        order: JSON.parse(addMatch[1].trim()),
        clean: txt.replace(/---ADICION_PEDIDO---[\s\S]*?---FIN_ADICION---/, "").trim(),
      };
    } catch {
      /* ignore */
    }
  }
  const changeMatch = txt.match(/---CAMBIO_PEDIDO---\s*([\s\S]*?)\s*---FIN_CAMBIO---/);
  if (changeMatch) {
    try {
      return {
        type: "change",
        order: JSON.parse(changeMatch[1].trim()),
        clean: txt.replace(/---CAMBIO_PEDIDO---[\s\S]*?---FIN_CAMBIO---/, "").trim(),
      };
    } catch {
      /* ignore */
    }
  }
  return null;
}

// ==================== ORDER PERSISTENCE & EMAIL ====================

/** Build order email HTML */
function buildOrderEmailHtml(order: any, phone: string, isDelivery: boolean, paymentProofUrl?: string | null): string {
  const items = (order.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:10px 12px;text-align:center;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.quantity}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${(i.unit_price || 0).toLocaleString("es-CO")}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`,
    )
    .join("");

  const deliverySection = isDelivery
    ? `<div style="background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(255,107,53,0.10));padding:14px 16px;border-radius:10px;margin:12px 0;border-left:4px solid #00D4AA;"><p style="margin:0;font-weight:bold;color:#00D4AA;">🏍️ DOMICILIO</p><p style="margin:6px 0 0;font-size:16px;color:#fff;">📍 ${order.delivery_address || "No proporcionada"}</p></div>`
    : `<div style="background:rgba(255,107,53,0.10);padding:14px 16px;border-radius:10px;margin:12px 0;border-left:4px solid #FF6B35;"><p style="margin:0;font-weight:bold;color:#FF6B35;">🏪 Recoger en local</p></div>`;

  const rawPayment = (order.payment_method || "").toLowerCase();
  const isEfectivo = rawPayment.includes("efectivo") || rawPayment.includes("cash") || rawPayment.includes("contra");

  let paymentSection = "";
  if (isEfectivo) {
    paymentSection = `<div style="padding:14px 16px;background:rgba(0,212,170,0.12);border-radius:10px;border-left:4px solid #00D4AA;margin-top:12px;"><p style="margin:0;font-weight:bold;color:#00D4AA;">💵 Pago en Efectivo</p><p style="margin:4px 0 0;color:#b0b0b0;font-size:13px;">${isDelivery ? "Paga al domiciliario" : "Paga al recoger"}</p></div>`;
  } else if (paymentProofUrl) {
    paymentSection = `<div style="padding:14px 16px;background:rgba(0,212,170,0.12);border-radius:10px;border-left:4px solid #00D4AA;margin-top:12px;"><p style="margin:0 0 8px;font-weight:bold;color:#00D4AA;">💳 Comprobante</p><img src="${paymentProofUrl}" style="max-width:100%;border-radius:8px;border:1px solid #333;" alt="Comprobante"/></div>`;
  } else {
    paymentSection = `<div style="padding:14px 16px;background:rgba(255,107,53,0.10);border-radius:10px;border-left:4px solid #FF6B35;margin-top:12px;"><p style="margin:0;font-weight:bold;color:#FF6B35;">💳 ${order.payment_method || "No especificado"}</p><p style="margin:4px 0 0;color:#b0b0b0;font-size:13px;">Pendiente comprobante</p></div>`;
  }

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;">
    <div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:28px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">CONEKTAO</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Nuevo Pedido por WhatsApp</p>
    </div>
    <div style="padding:24px;">
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <div style="background:#111;padding:12px 16px;border-radius:10px;flex:1;border:1px solid #1a1a1a;"><p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;">Cliente</p><p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:600;">👤 ${order.customer_name || "Cliente"}</p></div>
        <div style="background:#111;padding:12px 16px;border-radius:10px;flex:1;border:1px solid #1a1a1a;"><p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;">Teléfono</p><p style="margin:4px 0 0;color:#fff;font-size:16px;">📱 +${phone}</p></div>
      </div>
      ${deliverySection}
      <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1a1a1a;">
        <thead><tr style="background:#151515;"><th style="padding:10px 12px;text-align:left;color:#00D4AA;font-size:12px;text-transform:uppercase;">Producto</th><th style="padding:10px 12px;color:#00D4AA;font-size:12px;">Cant.</th><th style="padding:10px 12px;text-align:right;color:#00D4AA;font-size:12px;">Precio</th><th style="padding:10px 12px;text-align:right;color:#00D4AA;font-size:12px;">Subtotal</th></tr></thead>
        <tbody>${items}</tbody>
        <tfoot><tr><td colspan="3" style="padding:14px 12px;text-align:right;font-weight:bold;font-size:18px;color:#fff;border-top:2px solid #00D4AA;">TOTAL:</td><td style="padding:14px 12px;text-align:right;font-weight:bold;font-size:20px;color:#00D4AA;border-top:2px solid #00D4AA;">$${(order.total || 0).toLocaleString("es-CO")}</td></tr></tfoot>
      </table>
      ${paymentSection}
      ${order.observations ? `<div style="margin-top:12px;padding:12px 16px;background:#111;border-radius:10px;border:1px solid #1a1a1a;"><p style="margin:0;color:#888;font-size:11px;">Observaciones</p><p style="margin:4px 0 0;color:#e0e0e0;">📝 ${order.observations}</p></div>` : ""}
    </div>
    <div style="padding:16px 24px;background:#050505;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:11px;">Powered by <span style="background:linear-gradient(135deg,#FF6B35,#00D4AA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold;">CONEKTAO</span></p></div>
  </div>`;
}

/** Send email via Resend */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const rk = Deno.env.get("RESEND_API_KEY");
  if (!rk) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "CONEKTAO Pedidos <onboarding@resend.dev>", to: [to], subject, html }),
  });
  const body = await res.text();
  console.log("Resend:", res.status, body);
  return res.ok;
}

/** Save order to DB and send confirmation email */
async function saveOrder(
  rid: string,
  cid: string,
  phone: string,
  order: any,
  config: any,
  paymentProofUrl?: string | null,
) {
  // Dedup guard
  const twoMinAgo = new Date(Date.now() - 120 * 1000).toISOString();
  const { data: recentDup } = await supabase
    .from("whatsapp_orders")
    .select("id")
    .eq("customer_phone", phone)
    .eq("restaurant_id", rid)
    .gt("created_at", twoMinAgo)
    .limit(1)
    .maybeSingle();
  if (recentDup) {
    console.log(`⚠️ DEDUP: Skipping duplicate order for ${phone}`);
    return;
  }

  const rawType = (order.delivery_type || "pickup").toLowerCase();
  const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
  const deliveryType = isDelivery ? "delivery" : "pickup";

  const { data: saved, error } = await supabase
    .from("whatsapp_orders")
    .insert({
      restaurant_id: rid,
      conversation_id: cid,
      customer_phone: phone,
      customer_name: order.customer_name || "Cliente WhatsApp",
      items: order.items || [],
      total: order.total || 0,
      delivery_type: deliveryType,
      delivery_address: order.delivery_address || null,
      status: "received",
      email_sent: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Save order err:", error);
    return;
  }

  await supabase
    .from("whatsapp_conversations")
    .update({ order_status: "confirmed", current_order: order })
    .eq("id", cid);

  if (!config.order_email) return;

  const html = buildOrderEmailHtml(order, phone, isDelivery, paymentProofUrl);
  const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
  const sent = await sendEmail(config.order_email, subject, html);
  if (sent) await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
}

/** Save order modification and notify via email */
async function saveOrderModification(
  rid: string,
  cid: string,
  phone: string,
  modification: any,
  modType: "addition" | "change",
  config: any,
  originalOrder: any,
) {
  const updatedOrder =
    modType === "change"
      ? modification
      : {
          ...originalOrder,
          items: [...(originalOrder?.items || []), ...(modification.items || [])],
          total: modification.total || originalOrder?.total,
        };

  await supabase.from("whatsapp_conversations").update({ current_order: updatedOrder }).eq("id", cid);

  const { data: existingOrder } = await supabase
    .from("whatsapp_orders")
    .select("id, items, total")
    .eq("conversation_id", cid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingOrder) {
    const newItems =
      modType === "change"
        ? modification.items
        : [...((existingOrder.items as any[]) || []), ...(modification.items || [])];
    await supabase
      .from("whatsapp_orders")
      .update({ items: newItems, total: modification.total || updatedOrder.total })
      .eq("id", existingOrder.id);
  }

  if (!config.order_email) return;

  const isAddition = modType === "addition";
  const emoji = isAddition ? "➕" : "⚠️";
  const label = isAddition ? "ADICIÓN" : "CAMBIO";
  const color = isAddition ? "#00D4AA" : "#FF6B35";

  const itemsHtml = (modification.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:8px 12px;text-align:center;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.quantity}</td><td style="padding:8px 12px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid ${color}33;">
    <div style="background:linear-gradient(135deg,${color},${color}99);padding:20px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:20px;">${emoji} ${label} DE PEDIDO</h1></div>
    <div style="padding:20px;">
      <p style="color:#fff;font-size:15px;">👤 ${modification.customer_name || "Cliente"} · 📱 +${phone}</p>
      ${!isAddition ? `<div style="background:#2a0a0a;border:1px solid #FF4444;border-radius:10px;padding:14px;margin-bottom:16px;"><p style="margin:0;color:#FF4444;font-weight:bold;">⚠️ El cliente cambió productos del pedido original</p></div>` : ""}
      <h3 style="color:${color};">${isAddition ? "Productos adicionales:" : "Pedido actualizado:"}</h3>
      <table style="width:100%;border-collapse:collapse;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1a1a1a;">
        <thead><tr style="background:#151515;"><th style="padding:8px 12px;text-align:left;color:${color};font-size:12px;">Producto</th><th style="padding:8px 12px;color:${color};font-size:12px;">Cant.</th><th style="padding:8px 12px;text-align:right;color:${color};font-size:12px;">Precio</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="margin-top:16px;text-align:right;"><span style="color:#888;">Nuevo Total: </span><span style="color:${color};font-size:22px;font-weight:bold;">$${(modification.total || 0).toLocaleString("es-CO")}</span></div>
    </div>
    <div style="padding:12px 24px;background:#050505;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:11px;">Powered by <span style="background:linear-gradient(135deg,#FF6B35,#00D4AA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold;">CONEKTAO</span></p></div>
  </div>`;

  await sendEmail(
    config.order_email,
    `${emoji} ${label} - ${modification.customer_name || "Cliente"} - $${(modification.total || 0).toLocaleString("es-CO")}`,
    html,
  );
}

/** Send escalation email to admin */
async function escalate(config: any, phone: string, reason: string, conversationMessages?: any[]) {
  if (!config.order_email) return;

  let conversationHtml = "";
  if (conversationMessages?.length) {
    conversationHtml = `<div style="margin-top:16px;padding:12px;background:#111;border-radius:8px;border:1px solid #333;">
      <p style="color:#FF6B35;font-weight:bold;margin:0 0 8px;">💬 Últimos mensajes:</p>
      ${conversationMessages
        .slice(-15)
        .map((m: any) => {
          const isC = m.role === "customer";
          return `<p style="margin:4px 0;padding:6px 10px;border-radius:6px;background:${isC ? "#1a2a1a" : "#1a1a2a"};color:#eee;font-size:13px;"><strong style="color:${isC ? "#00D4AA" : "#FF6B35"};">${isC ? "👤 Cliente" : "🤖 Alicia"}:</strong> ${m.content?.substring(0, 200) || ""}</p>`;
        })
        .join("")}
    </div>`;
  }

  const html = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;">
    <div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:20px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:20px;">🚨 ALICIA necesita autorización</h1></div>
    <div style="padding:20px;color:#eee;">
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;"><strong style="color:#FF6B35;">📱 Cliente:</strong> +${phone}</p>
        <p style="margin:0 0 8px;"><strong style="color:#FF6B35;">📝 Situación:</strong></p>
        <p style="margin:0;color:#ccc;line-height:1.5;">${reason}</p>
      </div>
      ${conversationHtml}
      <div style="margin-top:16px;padding:12px;background:#1a2a1a;border-radius:8px;border:1px solid #00D4AA33;">
        <p style="color:#00D4AA;font-weight:bold;margin:0 0 4px;">💡 ¿Qué hacer?</p>
        <p style="color:#ccc;margin:0;font-size:13px;">Comunícate con el cliente al +${phone} para resolver.</p>
      </div>
    </div>
    <div style="padding:12px;text-align:center;border-top:1px solid #1a1a1a;"><p style="color:#666;font-size:11px;margin:0;">ALICIA by CONEKTAO</p></div>
  </div>`;

  await sendEmail(config.order_email, `⚠️ ALICIA necesita tu ayuda - Cliente +${phone}`, html);
}

// ==================== SALES NUDGE SYSTEM ====================

/** AI-powered follow-up for stalled/abandoned conversations */
async function runSalesNudgeCheck() {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Stalled conversations (ALICIA was last to speak, not recently nudged)
    const { data: dyingConvs } = await supabase
      .from("whatsapp_conversations")
      .select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at")
      .not("order_status", "in", '("none","confirmed","followup_sent","nudge_sent")')
      .lt("updated_at", twoMinAgo);

    // Abandoned conversations (client messages without response)
    const { data: abandonedConvs } = await supabase
      .from("whatsapp_conversations")
      .select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at")
      .not("order_status", "eq", "confirmed")
      .lt("updated_at", twoMinAgo);

    // Filter: 3+ consecutive customer messages at end without assistant response
    const reallyAbandoned = (abandonedConvs || []).filter((conv: any) => {
      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      if (msgs.length < 3) return false;
      let count = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "customer") count++;
        else break;
      }
      return count >= 3;
    });

    if (reallyAbandoned.length > 0) {
      console.log(`🚨 ABANDONED CONVERSATIONS DETECTED: ${reallyAbandoned.length} with 3+ unanswered messages`);
    }

    // Merge lists (dedup by id)
    const allConvs = [...(dyingConvs || [])];
    const existingIds = new Set(allConvs.map((c: any) => c.id));
    for (const ac of reallyAbandoned) {
      if (!existingIds.has(ac.id)) {
        allConvs.push(ac);
        existingIds.add(ac.id);
      }
    }

    if (allConvs.length === 0) return { nudged: 0, abandoned_detected: reallyAbandoned.length };

    let nudgedCount = 0;
    for (const conv of allConvs) {
      // ===== FREQUENCY GUARD: Max 1 nudge per 10 minutes =====
      if (conv.last_nudge_at && new Date(conv.last_nudge_at).toISOString() > tenMinAgo) {
        console.log(`⏭️ NUDGE SKIP: ${conv.customer_phone} was nudged ${Math.round((Date.now() - new Date(conv.last_nudge_at).getTime()) / 60000)}min ago (min 10min)`);
        continue;
      }

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      const lastMsg = msgs[msgs.length - 1];

      // Count consecutive unanswered customer messages
      let consecutiveCustomerMsgs = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "customer") consecutiveCustomerMsgs++;
        else break;
      }
      const isConvAbandoned = consecutiveCustomerMsgs >= 3;

      if (isConvAbandoned) {
        console.log(
          `🚨 NUDGE RESCUE: ${conv.customer_phone} has ${consecutiveCustomerMsgs} unanswered messages. Force-processing...`,
        );
      } else {
        if (!lastMsg || lastMsg.role !== "assistant") continue;
        if (lastMsg.is_nudge) continue;
      }

      // Get WA credentials
      const { data: waConfig } = await supabase
        .from("whatsapp_configs")
        .select(
          "whatsapp_phone_id, whatsapp_token, whatsapp_access_token, restaurant_name, greeting_message, promoted_products, menu_data, setup_completed, restaurant_id, delivery_config, payment_config, packaging_rules, operating_hours, time_estimates, escalation_config, custom_rules, sales_rules, personality_rules, location_address, location_details, restaurant_description, menu_link, daily_overrides",
        )
        .eq("restaurant_id", conv.restaurant_id)
        .maybeSingle();

      const phoneId = waConfig?.whatsapp_phone_id || GLOBAL_WA_PHONE_ID;
      const waToken =
        waConfig?.whatsapp_access_token && waConfig.whatsapp_access_token !== "ENV_SECRET"
          ? waConfig.whatsapp_access_token
          : GLOBAL_WA_TOKEN;

      if (!phoneId || !waToken) continue;

      // Generate contextual follow-up
      const closerPrompt = isConvAbandoned
        ? `Eres Alicia. El cliente envió VARIOS mensajes sin respuesta (error técnico). Retoma naturalmente.
REGLAS: Discúlpate BREVEMENTE ("Perdona la demora"). Lee los últimos mensajes y RESPONDE a lo que preguntaron. NO pidas confirmación. NO markdown. NO "asistente virtual". Max 1 emoji. Mensaje corto.
PEDIDO: ${conv.current_order ? JSON.stringify(conv.current_order) : "Revisa conversación"}
Cliente: ${conv.customer_name || "no proporcionado"}`
        : `Eres Alicia. El cliente dejó de responder hace unos minutos. Haz seguimiento natural.
REGLAS: Mensaje MUY corto (1-2 líneas). Natural, como mesera amigable. NO pidas confirmación. Solo pregunta si siguen ahí o necesitan algo. NO markdown. Max 1 emoji.
PEDIDO: ${conv.current_order ? JSON.stringify(conv.current_order) : "Revisa conversación"}
Cliente: ${conv.customer_name || "no proporcionado"}`;

      const nudgeMsg = await callAI(closerPrompt, msgs.slice(-10), 0.6);
      const cleanNudge = nudgeMsg
        .replace(/---[A-Z_]+---[\s\S]*?---[A-Z_]+---/g, "")
        .replace(/\*+/g, "")
        .trim();

      console.log(`💬 AI NUDGE: ${conv.customer_phone} → "${cleanNudge}"`);

      // UPDATE last_nudge_at BEFORE sending to prevent parallel duplicates
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_nudge_at: new Date().toISOString(),
          order_status: "nudge_sent",
        })
        .eq("id", conv.id);

      await sendWA(phoneId, waToken, conv.customer_phone, cleanNudge, true);

      msgs.push({ role: "assistant", content: cleanNudge, timestamp: new Date().toISOString(), is_nudge: true });
      await supabase
        .from("whatsapp_conversations")
        .update({ messages: msgs.slice(-30) })
        .eq("id", conv.id);
      nudgedCount++;
    }
    return { nudged: nudgedCount };
  } catch (e) {
    console.error("Sales nudge error:", e);
    return { nudged: 0, error: String(e) };
  }
}

// ==================== ADMIN ENDPOINTS ====================

async function handleAdminAction(url: URL, req: Request): Promise<Response | null> {
  const action = url.searchParams.get("action");
  if (!action) return null;

  switch (action) {
    case "subscribe_waba": {
      const wabaId = url.searchParams.get("waba_id") || "1203273002014817";
      const callbackUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
      const subRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${wabaId}/subscribed_apps`, {
        method: "POST",
        headers: { Authorization: `Bearer ${GLOBAL_WA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ override_callback_uri: callbackUrl, verify_token: VERIFY_TOKEN }),
      });
      const subData = await subRes.json();
      const checkRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${wabaId}/subscribed_apps`, {
        headers: { Authorization: `Bearer ${GLOBAL_WA_TOKEN}` },
      });
      const checkData = await checkRes.json();
      return new Response(JSON.stringify({ subscribe_result: subData, current_subscriptions: checkData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "send_escalation_email": {
      const phone = url.searchParams.get("phone") || "";
      const reason = url.searchParams.get("reason") || "Escalamiento manual";
      const { data: cfgData } = await supabase.from("whatsapp_configs").select("*").limit(1).maybeSingle();
      if (!cfgData)
        return new Response(JSON.stringify({ error: "No config" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { data: convData } = await supabase
        .from("whatsapp_conversations")
        .select("messages")
        .eq("customer_phone", phone)
        .maybeSingle();
      await escalate(cfgData, phone, reason, convData?.messages || []);
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "reset_conv": {
      const phone = url.searchParams.get("phone") || "";
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ order_status: "none", current_order: null, messages: [], payment_proof_url: null })
        .eq("customer_phone", phone);
      return new Response(JSON.stringify({ reset: !error, error }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "resend_order_email": {
      const orderId = url.searchParams.get("order_id") || "";
      const { data: orderData, error: oErr } = await supabase
        .from("whatsapp_orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (oErr || !orderData)
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { data: cfgData } = await supabase
        .from("whatsapp_configs")
        .select("order_email")
        .eq("restaurant_id", orderData.restaurant_id)
        .maybeSingle();
      if (!cfgData?.order_email)
        return new Response(JSON.stringify({ error: "No email config" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const isDelivery = orderData.delivery_type === "delivery";
      const html = buildOrderEmailHtml(orderData as any, orderData.customer_phone, isDelivery);
      const sent = await sendEmail(
        cfgData.order_email,
        `🍕 [REENVÍO] Pedido - ${orderData.customer_name} - $${(orderData.total || 0).toLocaleString("es-CO")}`,
        html,
      );
      return new Response(JSON.stringify({ sent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "update_email": {
      const email = url.searchParams.get("email") || "";
      const { error } = await supabase
        .from("whatsapp_configs")
        .update({ order_email: email })
        .eq("id", "5ab1a230-f503-4573-8b04-79628bdc4a7c");
      return new Response(JSON.stringify({ updated: !error, email }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "check_nudges": {
      const result = await runSalesNudgeCheck();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "send_message": {
      const phone = url.searchParams.get("phone") || "";
      const message = url.searchParams.get("message") || "";
      if (!phone || !message)
        return new Response(JSON.stringify({ error: "phone and message required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      await sendWA(GLOBAL_WA_PHONE_ID, GLOBAL_WA_TOKEN, phone, message);
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("customer_phone", phone)
        .maybeSingle();
      if (conv) {
        const msgs = conv.messages || [];
        msgs.push({ role: "assistant", content: message, ts: new Date().toISOString() });
        await supabase.from("whatsapp_conversations").update({ messages: msgs }).eq("id", conv.id);
      }
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    default:
      return null;
  }
}

// ==================== MAIN WEBHOOK HANDLER ====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // Handle admin actions
  const adminResponse = await handleAdminAction(url, req);
  if (adminResponse) return adminResponse;

  // GET: Webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }

  // POST: Incoming messages
  if (req.method === "POST") {
    // Check stale pending confirmations
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: staleConvs } = await supabase
        .from("whatsapp_conversations")
        .select("id, customer_phone, restaurant_id, pending_since")
        .in("order_status", ["pending_confirmation", "pending_button_confirmation"])
        .lt("pending_since", fiveMinAgo);

      if (staleConvs?.length) {
        for (const stale of staleConvs) {
          console.log(`⚠️ FOLLOW-UP: Stale pending for ${stale.customer_phone}`);
          const followUpMsg =
            "Hola! Vi que estábamos armando tu pedido pero no alcancé a recibir tu confirmación. Si quieres confirmarlo, escríbeme: confirmar pedido 😊";
          await sendWA(GLOBAL_WA_PHONE_ID, GLOBAL_WA_TOKEN, stale.customer_phone, followUpMsg);
          const { data: staleConv } = await supabase
            .from("whatsapp_conversations")
            .select("messages")
            .eq("id", stale.id)
            .single();
          const staleMsgs = Array.isArray(staleConv?.messages) ? staleConv.messages : [];
          staleMsgs.push({ role: "assistant", content: followUpMsg, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: staleMsgs.slice(-30), order_status: "followup_sent", pending_since: null })
            .eq("id", stale.id);
        }
      }
    } catch (e) {
      console.error("Follow-up check error:", e);
    }

    // Run sales nudge check
    await runSalesNudgeCheck();

    try {
      const body = await req.json();
      const value = body.entry?.[0]?.changes?.[0]?.value;
      if (!value?.messages?.length)
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      const msg = value.messages[0];
      const phoneId = value.metadata?.phone_number_id;
      const from = msg.from;

      // ===== MESSAGE TYPE HANDLING =====
      let text = msg.text?.body || msg.button?.text || "";
      let paymentProofUrl: string | null = null;
      let buttonReplyId: string | null = null;

      if (msg.type === "interactive" && msg.interactive?.button_reply) {
        // Interactive button reply
        buttonReplyId = msg.interactive.button_reply.id;
        text = msg.interactive.button_reply.title || "";
        console.log(`🔘 Button reply from ${from}: id="${buttonReplyId}" title="${text}"`);
      } else if (msg.type === "image") {
        const mediaId = msg.image?.id;
        text = msg.image?.caption || "Te envié una foto del comprobante de pago";
        if (mediaId) {
          paymentProofUrl = await downloadAndUploadMedia(mediaId, GLOBAL_WA_TOKEN, "payment-proofs", "image/jpeg");
        }
      } else if (msg.type === "audio") {
        const audioId = msg.audio?.id;
        if (audioId) {
          try {
            const audioUrl = await downloadAndUploadMedia(audioId, GLOBAL_WA_TOKEN, "audio-messages", "audio/ogg");
            if (audioUrl) {
              const transcription = await transcribeAudio(audioUrl);
              text = transcription
                ? `[Audio transcrito]: ${transcription}`
                : "[El cliente envió un audio que no se pudo transcribir]";
              if (transcription) console.log(`Audio transcribed for ${from}: "${transcription}"`);
            } else {
              text = "[El cliente envió un audio]";
            }
          } catch (e) {
            console.error("Audio processing error:", e);
            text = "[El cliente envió un audio]";
          }
        } else {
          text = "[El cliente envió un audio]";
        }
      } else if (msg.type === "sticker") {
        text = "[El cliente envió un sticker 😄]";
      } else if (msg.type === "reaction") {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Msg from ${from}: "${text}" (type: ${msg.type})`);
      if (!text.trim())
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // ===== GET CONFIG =====
      let config: any = null;
      let token = GLOBAL_WA_TOKEN;
      let pid = phoneId || GLOBAL_WA_PHONE_ID;

      const { data: cd } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("whatsapp_phone_number_id", phoneId)
        .eq("is_active", true)
        .maybeSingle();
      if (cd) {
        config = cd;
        if (cd.whatsapp_access_token && cd.whatsapp_access_token !== "ENV_SECRET") token = cd.whatsapp_access_token;
      } else {
        const { data: fb } = await supabase
          .from("whatsapp_configs")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (fb) {
          config = fb;
          if (fb.whatsapp_access_token && fb.whatsapp_access_token !== "ENV_SECRET") token = fb.whatsapp_access_token;
        }
      }

      if (!config) {
        await sendWA(pid, token, from, "Lo siento, este número aún no está configurado. 🙏");
        return new Response(JSON.stringify({ status: "no_config" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await markRead(pid, token, msg.id);
      const rId = config.restaurant_id;
      const conv = await getConversation(rId, from);

      // ===== HANDLE AFFIRMATIVE CONFIRMATION =====
      const lowerTextTrim = text.toLowerCase().trim().replace(/[.,!?¿¡]+/g, "").trim();
      const isAffirmative = /^(si|sí|confirmar|confirmar pedido|confirmo|dale|listo|va|claro|ok|okey|okay|por favor|porfavor|perfecto|de una|deuna|eso|asi|así|correcto|bien|todo bien|vamos|adelante|manda|envía|envia|ya|eso es|hecho|sale)$/i.test(lowerTextTrim);
      if (
        isAffirmative &&
        conv.current_order &&
        (conv.order_status === "pending_confirmation" ||
          conv.order_status === "pending_button_confirmation" ||
          conv.order_status === "active")
      ) {
        const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
        convMsgs.push({ role: "customer", content: text, timestamp: new Date().toISOString(), wa_message_id: msg.id });
        const isLaBarra = config.restaurant_id === LA_BARRA_RESTAURANT_ID || !config.setup_completed;
        const validated = validateOrder(conv.current_order, isLaBarra);
        await saveOrder(rId, conv.id, from, validated.order, config, conv.payment_proof_url);
        const confirmations = [
          "Pedido confirmado! Ya lo estamos preparando con todo el cariño 🍕",
          "Listo! Tu pedido ya está en camino a la cocina 🍕",
          "Confirmado! Ya empezamos a prepararlo con mucho amor 🤗",
        ];
        const resp = confirmations[Math.floor(Math.random() * confirmations.length)];
        convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
        await supabase
          .from("whatsapp_conversations")
          .update({
            messages: convMsgs.slice(-30),
            order_status: "confirmed",
            current_order: validated.order,
            pending_since: null,
          })
          .eq("id", conv.id);
        await sendWA(pid, token, from, resp, true);
        return new Response(JSON.stringify({ status: "confirmed_via_text" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ===== PENDING CONFIRMATION: handle cancel or pass to AI =====
      if (
        (conv.order_status === "pending_confirmation" || conv.order_status === "pending_button_confirmation") &&
        conv.current_order
      ) {
        const lowerText = text.toLowerCase().trim().replace(/[.,!?¿¡]+/g, "").trim();
        const cancelPatterns = /^(no|cancel|cancelar|no quiero|dejalo|déjalo|nada|olvida)/i;
        if (cancelPatterns.test(lowerText)) {
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });
          const resp = "Listo, cancelé el pedido. Si cambias de opinión, me escribes con mucho gusto 😊";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({
              messages: convMsgs.slice(-30),
              order_status: "none",
              current_order: null,
              pending_since: null,
            })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "cancelled_via_text" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Not cancel, not affirmative (already handled above) — fall through to AI
      }

      // ===== POST-CONFIRMATION: New message after order was confirmed =====
      if (conv.order_status === "confirmed") {
        const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
        // Check if confirmation was recent (within 2 hours)
        const lastAssistant = [...convMsgs].reverse().find((m: any) => m.role === "assistant");
        const lastAssistantTime = lastAssistant?.timestamp ? new Date(lastAssistant.timestamp).getTime() : 0;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

        if (lastAssistantTime > twoHoursAgo) {
          // Recent confirmation — check if it's a modification request or a new order
          const lowerText = text.toLowerCase().trim();
          const isModification = /cambi|modific|quita|agrega|añad|cancel/i.test(lowerText);

          if (!isModification) {
            // Check if it's a gratitude message — respond warmly without resetting
            const isGratitude = /gracia|thank|chever|genial|perfecto|excelente|buenísimo/i.test(lowerText);
            // Check if it's a follow-up question about their order
            const isFollowUp = /cuánto|cuanto|demora|tiempo|llega|lleg[oó]|sale|dónde|donde|estado|seguimiento|rastreo|ya sal/i.test(lowerText);

            convMsgs.push({
              role: "customer",
              content: text,
              timestamp: new Date().toISOString(),
              wa_message_id: msg.id,
            });

            if (isGratitude) {
              // Warm farewell — don't reset, don't offer new order
              const farewells = [
                "Con mucho gusto! Que disfrutes tu pedido 🤗",
                "A ti! Buen provecho y aquí estamos cuando quieras 😊",
                "De nada! Que lo disfruten mucho 🤗",
                "Un placer atenderte! Buen provecho 😊",
              ];
              const resp = farewells[Math.floor(Math.random() * farewells.length)];
              convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
              await supabase
                .from("whatsapp_conversations")
                .update({ messages: convMsgs.slice(-30) })
                .eq("id", conv.id);
              await sendWA(pid, token, from, resp, true);
              return new Response(JSON.stringify({ status: "post_confirmation_gratitude" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            if (isFollowUp) {
              // Follow-up question about existing order — answer naturally, don't reset
              const followUpResp = conv.current_order?.delivery_method === "delivery"
                ? "Tu pedido ya está en preparación! Normalmente tarda entre 30-45 minutos en llegar 🛵"
                : "Tu pedido ya está en preparación! Te avisamos cuando esté listo 🍕";
              convMsgs.push({ role: "assistant", content: followUpResp, timestamp: new Date().toISOString() });
              await supabase
                .from("whatsapp_conversations")
                .update({ messages: convMsgs.slice(-30) })
                .eq("id", conv.id);
              await sendWA(pid, token, from, followUpResp, true);
              return new Response(JSON.stringify({ status: "post_confirmation_followup" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Not gratitude, not follow-up, not modification — let AI handle naturally
            // Don't reset immediately, fall through to normal AI processing
          }
          // If modification, fall through to normal AI processing which handles ---CAMBIO--- and ---ADICION--- tags
        } else {
          // Old confirmation (>2 hours) — reset to fresh conversation
          await supabase
            .from("whatsapp_conversations")
            .update({
              order_status: "none",
              current_order: null,
            })
            .eq("id", conv.id);
          // Fall through to normal processing as new conversation
        }
      }

      // ===== NORMAL MESSAGE PROCESSING =====
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, description, category_id")
        .eq("restaurant_id", rId)
        .eq("is_active", true)
        .order("name");
      const { data: rest } = await supabase.from("restaurants").select("id, name").eq("id", rId).single();
      const rName = rest?.name || "Restaurante";

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      const currentWaMessageId = msg.id;
      msgs.push({
        role: "customer",
        content: text,
        timestamp: new Date().toISOString(),
        has_image: !!paymentProofUrl,
        wa_message_id: currentWaMessageId,
      });

      // === MESSAGE BATCHING ===
      await supabase
        .from("whatsapp_conversations")
        .update({ messages: msgs.slice(-30) })
        .eq("id", conv.id);

      console.log(`⏳ MESSAGE BATCH: Waiting 4s for ${from}... (wa_id: ${currentWaMessageId})`);
      await sleep(4000);

      const { data: freshConv } = await supabase
        .from("whatsapp_conversations")
        .select("messages, order_status, current_order, customer_name, payment_proof_url, updated_at")
        .eq("id", conv.id)
        .single();

      const freshMsgs = Array.isArray(freshConv?.messages) ? freshConv.messages : msgs;

      // Dedup by wa_message_id
      const lastCustomerMsg = [...freshMsgs].reverse().find((m: any) => m.role === "customer");
      if (lastCustomerMsg?.wa_message_id && lastCustomerMsg.wa_message_id !== currentWaMessageId) {
        console.log(`⏭️ BATCH SKIP: Newer message found for ${from}. Safety net...`);
        await sleep(5000);
        const { data: safetyCheck } = await supabase
          .from("whatsapp_conversations")
          .select("messages")
          .eq("id", conv.id)
          .single();
        const safetyMsgs = Array.isArray(safetyCheck?.messages) ? safetyCheck.messages : [];
        const lastMsgAfterWait = safetyMsgs[safetyMsgs.length - 1];

        if (lastMsgAfterWait?.role === "assistant") {
          console.log(`✅ SAFETY NET OK: Assistant responded for ${from}`);
          return new Response(JSON.stringify({ status: "batched_safe" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`🚨 SAFETY NET TRIGGERED: No response after 8s for ${from}. Emergency processing...`);
      }

      // Merge consecutive customer messages for AI
      const mergedMsgs: any[] = [];
      const trailingCustomerTexts: string[] = [];
      for (let i = freshMsgs.length - 1; i >= 0; i--) {
        if (freshMsgs[i].role === "customer") trailingCustomerTexts.unshift(freshMsgs[i].content);
        else break;
      }
      const nonTrailingCount = freshMsgs.length - trailingCustomerTexts.length;
      for (let i = 0; i < nonTrailingCount; i++) mergedMsgs.push(freshMsgs[i]);
      if (trailingCustomerTexts.length > 1) {
        console.log(`📦 BATCH MERGED: ${trailingCustomerTexts.length} messages from ${from}`);
      }
      mergedMsgs.push({
        role: "customer",
        content: trailingCustomerTexts.join("\n"),
        timestamp: new Date().toISOString(),
      });

      // Store payment proof
      if (paymentProofUrl) {
        await supabase.from("whatsapp_conversations").update({ payment_proof_url: paymentProofUrl }).eq("id", conv.id);
      }

      // Build prompt and call AI
      const freshOrderStatus = freshConv?.order_status || conv.order_status;
      const freshCurrentOrder = freshConv?.current_order || conv.current_order;
      const freshCustomerName = freshConv?.customer_name || conv.customer_name;
      const configWithTime = {
        ...config,
        _confirmed_at: freshOrderStatus === "confirmed" ? freshConv?.updated_at || conv.updated_at : null,
      };
      const sys = buildPrompt(
        prods || [],
        config.promoted_products || [],
        config.greeting_message || "Hola! Bienvenido 👋",
        rName,
        freshCurrentOrder,
        freshOrderStatus,
        configWithTime,
      );
      const ai = await callAI(sys, mergedMsgs);

      const parsed = parseOrder(ai);
      const modification = !parsed ? parseOrderModification(ai) : null;
      let resp = ai;
      const storedProof = paymentProofUrl || freshConv?.payment_proof_url || conv.payment_proof_url || null;

      if (parsed) {
        // ORDER DETECTED BY AI → Save order data and wait for "confirmar pedido" text
        const isLaBarra =
          config.restaurant_id === LA_BARRA_RESTAURANT_ID || !config.setup_completed || !config.restaurant_name;
        const validated = validateOrder(parsed.order, isLaBarra);
        if (validated.corrected) parsed.order = validated.order;
        resp = parsed.clean || "Pedido registrado! 🍽️";

        // Store order and set pending confirmation status
        freshMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
        await supabase
          .from("whatsapp_conversations")
          .update({
            messages: freshMsgs.slice(-30),
            customer_name: parsed.order.customer_name || freshCustomerName,
            current_order: parsed.order,
            order_status: "pending_confirmation",
            pending_since: new Date().toISOString(),
          })
          .eq("id", conv.id);

        // Send summary text only (no buttons)
        await sendWA(pid, token, from, resp, true);

        return new Response(JSON.stringify({ status: "pending_confirmation" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (modification) {
        resp =
          modification.clean || (modification.type === "addition" ? "✅ Adición registrada!" : "✅ Cambio registrado!");
        await saveOrderModification(
          rId,
          conv.id,
          from,
          modification.order,
          modification.type,
          config,
          freshCurrentOrder,
        );
      }

      // Handle special tags
      if (resp.includes("---ESCALAMIENTO---")) {
        resp = resp.replace(/---ESCALAMIENTO---/g, "").trim();
        const reason =
          resp.length > 10 ? `Alicia respondió: "${resp.substring(0, 300)}"` : "Cliente necesita atención humana";
        await escalate(config, from, reason, freshMsgs);
      }
      if (resp.includes("---CONSULTA_DOMICILIO---")) {
        resp = resp.replace(/---CONSULTA_DOMICILIO---/g, "").trim();
        await escalate(config, from, "Cliente pregunta costo domicilio", freshMsgs);
      }

      // Update conversation
      freshMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
      // Only parseOrder() sets pending_confirmation — no auto-detection
      const baseStatus =
        freshOrderStatus === "nudge_sent" || freshOrderStatus === "followup_sent" ? "active" : freshOrderStatus;
      const newOrderStatus = baseStatus;

      await supabase
        .from("whatsapp_conversations")
        .update({
          messages: freshMsgs.slice(-30),
          customer_name: freshCustomerName,
          current_order: freshCurrentOrder,
          order_status: newOrderStatus,
        })
        .eq("id", conv.id);

      await sendWA(pid, token, from, resp, true);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Enhanced error handling with admin notification
      console.error("🔥 CRITICAL ERROR:", {
        error: e?.message || String(e),
        stack: e?.stack || "no stack",
        timestamp: new Date().toISOString(),
      });

      try {
        const body2 = await req
          .clone()
          .json()
          .catch(() => null);
        const from2 = body2?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "unknown";

        const { data: failConv } = await supabase
          .from("whatsapp_conversations")
          .select("id, messages, restaurant_id")
          .eq("customer_phone", from2)
          .maybeSingle();
        if (failConv) {
          const failMsgs = Array.isArray(failConv.messages) ? failConv.messages : [];
          failMsgs.push({
            role: "system_error",
            content: `Error: ${e?.message || "unknown"}`,
            timestamp: new Date().toISOString(),
          });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: failMsgs.slice(-30) })
            .eq("id", failConv.id);

          const { data: errConfig } = await supabase
            .from("whatsapp_configs")
            .select("order_email")
            .eq("restaurant_id", failConv.restaurant_id)
            .maybeSingle();
          if (errConfig?.order_email) {
            await sendEmail(
              errConfig.order_email,
              `⚠️ Error procesando mensaje de +${from2}`,
              `<p>Un mensaje de <b>+${from2}</b> no pudo ser procesado.</p><p>Error: ${e?.message || "unknown"}</p><p>Revisa el dashboard de Alicia.</p>`,
            );
          }
        }
      } catch (innerErr) {
        console.error("Failed to save error state:", innerErr);
      }

      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
