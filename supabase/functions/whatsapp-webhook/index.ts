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
  customerName?: string,
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
    return buildLaBarraPrompt(prom, ctx, peak, we, greeting, customerName || "", order, status, products);
  }

  if (config?.setup_completed && config?.restaurant_name) {
    return buildDynamicPrompt(config, products, promoted, prom, ctx, peak, we, h, d, greeting, order, status);
  }

  // Fallback
  return buildLaBarraPrompt(prom, ctx, peak, we, greeting, customerName || "", order, status, products);
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
6. Presenta resumen COMPLETO (productos + empaques + total), pregunta: "¿Me confirmas tu pedido para empezarlo a preparar? Responde: 'Sí, confirmar' o escribe qué quieres cambiar." Y SIEMPRE incluye el tag ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- al final del mensaje (invisible para el cliente)
7. El sistema guarda el pedido y espera confirmación del cliente automáticamente
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

IMPORTANTE SOBRE EL TAG:
- El tag ---PEDIDO_CONFIRMADO--- va en el PASO 6 (al presentar el resumen), NO después de que confirmen
- SIEMPRE inclúyelo al final del mensaje del resumen, el sistema lo oculta automáticamente
- Si NO incluyes el tag, el pedido NO se guardará y se perderá

CONFIRMACIÓN (REGLA CRÍTICA - ANTI-LOOP):
- Solo pide confirmación UNA VEZ, después del resumen final con TODOS los datos completos
- NUNCA preguntes "confirmamos?" mientras el cliente aún está pidiendo productos
- PROHIBIDO repetir el resumen si ya lo presentaste
- PROHIBIDO preguntar confirmación si ya la pediste (order_status = pending_confirmation)
- Palabras afirmativas válidas: "sí", "si", "dale", "listo", "ok", "perfecto", "de una", "sisas", "hagale", "hágale", "va", "vamos", "hecho", "correcto", "claro", emojis ✅👍🔥
- Si el cliente dice "cambiar", "modificar", "agregar", "corregir" → NO confirmes, vuelve al flujo de edición
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas
- Mensajes cortos. 1 sola pregunta por mensaje. NUNCA repitas bloques largos.

MODIFICACIONES (solo pedidos ya confirmados):
...
REGLAS INQUEBRANTABLES:
1. PRECIOS: NUNCA inventes. Verifica en el menú
2. TAMAÑOS: Solo los del menú
3. PRODUCTOS: NUNCA digas que no existe sin revisar TODO el menú
4. EMPAQUES: Obligatorios en domicilio/llevar
5. VARIANTES OBLIGATORIAS: Si un producto existe en múltiples versiones en la base de datos (ej: Personal Y Mediana), JAMÁS asumas cuál quiere el cliente. Pregunta siempre: "¿La deseas Personal o Mediana?" Solo cuando el cliente pida el nombre sin especificar variante. Si el producto tiene UNA SOLA versión, NO preguntes.
5. DESGLOSE: producto + precio + empaque + total. Números DEBEN cuadrar
6. DIRECCIÓN: Cuando la den, GRÁBALA. DEBE aparecer en el JSON
7. IDENTIDAD: Si preguntan si eres bot → admítelo
8. FRUSTRACIÓN: Cliente frustrado → pasa al humano: "${escalation.human_phone || "administrador"}"
9. VERDAD: NUNCA inventes información sobre el negocio, sedes o productos

RECUERDA: ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- va en el RESUMEN (paso 6), NO después de la confirmación. NUNCA muestres JSON al cliente.
${ctx}`;
}

function buildMenuFromProducts(products: any[]): string {
  if (!products || products.length === 0) return "MENÚ: No disponible en este momento";
  const pizzaSizes: Record<string, { desc: string, personal?: number, mediana?: number, cat: string }> = {};
  const otherProducts: { name: string, desc: string, price: number, cat: string }[] = [];
  for (const p of products) {
    const cat = p.category_name || "Otros", name = (p.name || "").trim(), desc = (p.description || "").trim(), price = Number(p.price);
    const pm = name.match(/^(.+?)\s+Personal$/i), mm = name.match(/^(.+?)\s+Mediana$/i);
    if (pm && cat.toLowerCase().includes("pizza")) { const b = pm[1].trim(); if (!pizzaSizes[b]) pizzaSizes[b] = { desc, cat }; pizzaSizes[b].personal = price; }
    else if (mm && cat.toLowerCase().includes("pizza")) { const b = mm[1].trim(); if (!pizzaSizes[b]) pizzaSizes[b] = { desc, cat }; pizzaSizes[b].mediana = price; }
    else otherProducts.push({ name, desc, price, cat });
  }
  let menu = "=== MENÚ OFICIAL (COP) ===\nINSTRUCCIÓN: COPIA la descripción EXACTA del menú. NO inventes.\n\n";
  const salPizzas = Object.entries(pizzaSizes).filter(([,i]) => !i.cat.toLowerCase().includes("dulce")).sort((a,b) => a[0].localeCompare(b[0]));
  const dulcePizzas = Object.entries(pizzaSizes).filter(([,i]) => i.cat.toLowerCase().includes("dulce")).sort((a,b) => a[0].localeCompare(b[0]));
  if (salPizzas.length > 0) { menu += "🍕 PIZZAS DE SAL:\n"; for (const [n, i] of salPizzas) menu += `${n} | ${i.desc} | ${i.personal ? `$${i.personal.toLocaleString("es-CO")}` : "—"} | ${i.mediana ? `$${i.mediana.toLocaleString("es-CO")}` : "—"}\n`; menu += "\n"; }
  if (dulcePizzas.length > 0) { menu += "🍫 PIZZAS DULCES:\n"; for (const [n, i] of dulcePizzas) menu += `${n} | ${i.desc} | $${(i.personal || i.mediana || 0).toLocaleString("es-CO")}\n`; menu += "\n"; }
  const groups: Record<string, typeof otherProducts> = {};
  for (const p of otherProducts) { if (!groups[p.cat]) groups[p.cat] = []; groups[p.cat].push(p); }
  for (const [cat, items] of Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0]))) {
    menu += `📋 ${cat.toUpperCase()}:\n`;
    for (const item of items.sort((a,b) => a.name.localeCompare(b.name))) menu += `${item.name} | ${item.desc || "—"} | $${item.price.toLocaleString("es-CO")}\n`;
    menu += "\n";
  }
  return menu + "=== FIN MENÚ ===";
}

function buildLaBarraPrompt(
  prom: string,
  ctx: string,
  peak: boolean,
  we: boolean,
  greeting: string,
  customerName: string,
  order: any,
  status: string,
  products?: any[],
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
- ${customerName ? `NOMBRE DEL CLIENTE YA CONOCIDO: "${customerName}". Úsalo. NO vuelvas a pedirlo` : "Nombre del cliente: aún no proporcionado"}
FORMATO: NUNCA asteriscos, negritas, markdown. Máximo 1 emoji cada 2-3 mensajes

AUDIOS: "[Audio transcrito]:" → responde natural. "[Audio no transcrito]" → "No te escuché, me lo escribes?"
STICKERS: Responde simpático y redirige al pedido

SALUDO: "${greeting}"
CARTA: https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk

${products && products.length > 0 ? buildMenuFromProducts(products) : "MENÚ: consulta la carta"}

REGLA ANTI-ALUCINACIÓN DE PRODUCTOS (CRÍTICA, INQUEBRANTABLE):
- SOLO puedes ofrecer productos que aparecen en el MENÚ OFICIAL listado arriba en este prompt
- Cuando el cliente pregunte por un producto → BUSCA en la tabla del MENÚ OFICIAL y USA la descripción EXACTA que aparece ahí
- NUNCA escribas una descripción de tu propia cosecha. COPIA textualmente la columna "Descripción" del menú
- NUNCA uses precios que no estén en el MENÚ OFICIAL. El precio SIEMPRE viene de la tabla del menú, jamás de tu memoria
- Ejemplo correcto: si piden "Parmesana" → busca en la tabla → copia nombre, descripción y precio EXACTOS que aparecen en la tabla
- Si un producto existe en el menú con nombre similar → ofrécelo. NO digas "no tenemos"
- Si realmente NO está en el menú → di "No lo veo en nuestra carta" y sugiere alternativas QUE SÍ EXISTAN en el menú
- NUNCA JAMÁS inventes nombres de productos que no están en el menú
- NUNCA JAMÁS inventes precios. Solo usa los precios del MENÚ OFICIAL arriba
- Búsqueda flexible: ignora mayúsculas, tildes, "pizza de", "la", singular/plural

DISAMBIGUATION:
- "Camarones" → preguntar: pizza, entrada, fettuccine o brioche?
- "Burrata" → preguntar: entrada Burrata La Barra, Burrata Tempura, o Pizza Prosciutto & Burrata?
- "Pasta" → preguntar cuál de las disponibles en el menú

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
6. Presenta resumen COMPLETO (productos + empaques + total), pregunta: "¿Me confirmas tu pedido para empezarlo a preparar? Responde: 'Sí, confirmar' o escribe qué quieres cambiar." Y SIEMPRE incluye el tag ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- al final del mensaje (invisible para el cliente)
7. El sistema guarda el pedido y espera confirmación del cliente automáticamente
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

IMPORTANTE SOBRE EL TAG:
- El tag ---PEDIDO_CONFIRMADO--- va en el PASO 6 (al presentar el resumen), NO después de que confirmen
- SIEMPRE inclúyelo al final del mensaje del resumen, el sistema lo oculta automáticamente
- Si NO incluyes el tag, el pedido NO se guardará y se perderá

CONFIRMACIÓN (REGLA CRÍTICA - ANTI-LOOP):
- Solo pide confirmación UNA VEZ, después del resumen final con TODOS los datos completos
- NUNCA preguntes "confirmamos?" mientras el cliente aún está pidiendo productos
- NUNCA pidas confirmación si falta info (dirección, nombre, tipo de entrega)
- PROHIBIDO repetir el resumen si ya lo presentaste
- PROHIBIDO preguntar confirmación si ya la pediste (order_status = pending_confirmation)
- Palabras afirmativas válidas: "sí", "si", "dale", "listo", "ok", "perfecto", "de una", "sisas", "hagale", "hágale", "va", "vamos", "hecho", "correcto", "claro", emojis ✅👍🔥
- Si el cliente dice "cambiar", "modificar", "agregar", "corregir" → NO confirmes, vuelve al flujo de edición
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas ni sugerencias
- Mensajes cortos. 1 sola pregunta por mensaje. NUNCA repitas bloques largos.

POST-CONFIRMACIÓN:
- Si el cliente escribe después de confirmar y no es gratitud ni pregunta → déjalo pasar a la IA normal
- NO sigas la conversación del pedido anterior

MODIFICACIONES (solo pedidos ya confirmados):
- CAMBIO (<25 min) → ---CAMBIO_PEDIDO---{json}---FIN_CAMBIO---
- CAMBIO (>25 min) → "Ya lo preparamos, te lo mandamos como lo pediste"
- ADICIÓN → ---ADICION_PEDIDO---{json items nuevos + nuevo total}---FIN_ADICION---

REGLAS INQUEBRANTABLES:
1. PRECIOS: NUNCA inventes. Verifica en el menú
2. TAMAÑOS: Solo Personal (4 porciones) y Mediana (6 porciones). NO existen otros tamaños. NUNCA digas 8 porciones
3. PRODUCTOS: NUNCA digas que no existe sin revisar TODO el menú
4. EMPAQUES: Obligatorios en domicilio/llevar
5. DESGLOSE: producto + precio + empaque + total. Números DEBEN cuadrar
6. DIRECCIÓN: Cuando la den, GRÁBALA. DEBE aparecer en el JSON
7. IDENTIDAD: Si preguntan si eres bot → admítelo
8. FRUSTRACIÓN → pasa al humano: "3146907745"
9. VERDAD: NUNCA inventes información sobre el negocio, sedes o productos
10. VARIANTES OBLIGATORIAS: Si un producto existe en múltiples versiones en la base de datos (ej: Personal Y Mediana), JAMÁS asumas cuál quiere el cliente. Pregunta siempre de forma directa: "¿La deseas Personal o Mediana?" SOLO cuando el cliente pida el nombre del producto SIN especificar la variante. Si el producto tiene UNA SOLA versión disponible, NO preguntes. Esta regla aplica ANTES de calcular cualquier precio.

RECUERDA: ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- va en el RESUMEN (paso 6), NO después de la confirmación. NUNCA muestres JSON al cliente.
${ctx}`;
}

// ==================== PRICE VALIDATION (DYNAMIC) ====================

/** Build price map dynamically from products loaded from DB */
function buildPriceMap(products: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of products) {
    if (p.name && p.price) {
      map[p.name.toLowerCase()] = Number(p.price);
    }
  }
  return map;
}

function getPackagingCost(itemName: string): number {
  const n = itemName.toLowerCase();
  const pasta = ["spaghetti","fettuccine","ravioles","lasagna","pasta","carbonara","bolognese","teléfono","quesos","hamburguesa","brioche","brocheta","bondiola","langostinos","sandwich","nuditos","champiñones","brie","burrata","tapas"];
  const drink = ["limonada","sodificada","gaseosa","agua","coca","cerveza","vino","copa"];
  if (drink.some(k => n.includes(k))) return 1000;
  if (pasta.some(k => n.includes(k))) return 3000;
  return 2000;
}

/** Validate and correct order prices/packaging for La Barra */
function validateOrder(order: any, isLaBarra: boolean, products?: any[]): { order: any; corrected: boolean; issues: string[] } {
  if (!isLaBarra || !order?.items) return { order, corrected: false, issues: [] };

  const priceMap = products ? buildPriceMap(products) : {};
  const issues: string[] = [];
  let corrected = false;
  const isDelivery =
    (order.delivery_type || "").toLowerCase().includes("delivery") ||
    (order.delivery_type || "").toLowerCase().includes("domicilio");

  for (const item of order.items) {
    const itemName = item.name || "";
    const itemLower = itemName.toLowerCase();

    // Price validation using dynamic price map from DB
    if (Object.keys(priceMap).length > 0) {
      // Find best matching product by fuzzy name match
      let bestMatch: string | null = null;
      let bestPrice = 0;
      for (const [prodName, price] of Object.entries(priceMap)) {
        if (
          itemLower.includes(prodName) ||
          prodName.includes(itemLower) ||
          // Normalize: remove "personal", "mediana", etc. for comparison
          itemLower.replace(/\s*(personal|mediana|dulce)\s*/gi, "").trim() === prodName.replace(/\s*(personal|mediana|dulce)\s*/gi, "").trim()
        ) {
          bestMatch = prodName;
          bestPrice = price;
          // Prefer exact or longer match
          if (prodName === itemLower) break;
        }
      }
      if (bestMatch && bestPrice > 0) {
        const declaredPrice = item.unit_price || 0;
        if (declaredPrice > 0 && declaredPrice !== bestPrice) {
          issues.push(
            `PRECIO CORREGIDO: ${itemName} de $${declaredPrice.toLocaleString()} a $${bestPrice.toLocaleString()}`,
          );
          item.unit_price = bestPrice;
          corrected = true;
        }
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
    // Safety net 1: detect raw JSON with order structure
    const jsonMatch = txt.match(/\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?"total"\s*:\s*\d+[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const recovered = JSON.parse(jsonMatch[0]);
        if (recovered.items && recovered.total) {
          console.log("⚠️ SAFETY NET JSON: Recovered order from raw JSON");
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

    // Safety net 2: detect text-based order summary with prices (e.g. "$32.000", "Total: $60.000")
    // This catches when the AI presents a summary without the tag
    const hasMultiplePrices = (txt.match(/\$[\d.,]+/g) || []).length >= 2;
    const hasTotalKeyword = /total[:\s]*\$[\d.,]+/i.test(txt);
    const hasConfirmQuestion = /todo bien|confirm|está bien|correcto\?|de acuerdo/i.test(txt);
    
    if (hasMultiplePrices && hasTotalKeyword && hasConfirmQuestion) {
      console.log("⚠️ SAFETY NET TEXT: Detected text-based order summary without tag. Extracting...");
      
      // Extract items from bullet points or lines with prices
      const items: any[] = [];
      const lines = txt.split("\n");
      for (const line of lines) {
        const itemMatch = line.match(/[*•\-]?\s*(.+?):\s*\$?([\d.,]+)/);
        if (itemMatch) {
          const name = itemMatch[1].trim();
          const price = parseInt(itemMatch[2].replace(/[.,]/g, ""));
          // Skip lines that are subtotal/total/empaque summary lines
          if (/^(sub)?total|^empaque/i.test(name)) continue;
          if (price > 0 && name.length > 1) {
            items.push({ name, quantity: 1, unit_price: price, packaging_cost: 0 });
          }
        }
      }
      
      // Extract total
      const totalMatch = txt.match(/total[:\s]*\$?([\d.,]+)/i);
      const total = totalMatch ? parseInt(totalMatch[1].replace(/[.,]/g, "")) : 0;
      
      if (items.length > 0 && total > 0) {
        const order = { items, total, subtotal: total, packaging_total: 0, delivery_type: "pickup", delivery_address: null, customer_name: "", payment_method: "efectivo", observations: "" };
        
        // Try to extract delivery info from text
        if (/domicilio|delivery/i.test(txt)) order.delivery_type = "delivery";
        const addrMatch = txt.match(/(?:direcci[oó]n|para|hacia)[:\s]*(.+?)(?:\n|$)/i);
        if (addrMatch) order.delivery_address = addrMatch[1].trim();
        
        // Extract customer name if present
        const nameMatch = txt.match(/(?:nombre|cliente)[:\s]*(.+?)(?:\n|,|$)/i);
        if (nameMatch) order.customer_name = nameMatch[1].trim();
        
        console.log(`⚠️ SAFETY NET TEXT: Recovered ${items.length} items, total $${total}`);
        return { order, clean: txt };
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

function buildOrderEmailHtml(order: any, phone: string, isDelivery: boolean, paymentProofUrl?: string | null): string {
  const items = (order.items || []).map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.quantity}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${(i.unit_price||0).toLocaleString("es-CO")}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${((i.unit_price||0)*(i.quantity||1)).toLocaleString("es-CO")}</td></tr>`).join("");
  const rawPay = (order.payment_method||"").toLowerCase();
  const isEfectivo = /efectivo|cash|contra/.test(rawPay);
  const delSec = isDelivery ? `<div style="background:rgba(0,212,170,0.15);padding:12px;border-radius:8px;margin:10px 0;border-left:4px solid #00D4AA;"><b style="color:#00D4AA;">🏍️ DOMICILIO</b><br/><span style="color:#fff;">📍 ${order.delivery_address||"No proporcionada"}</span></div>` : `<div style="background:rgba(255,107,53,0.1);padding:12px;border-radius:8px;margin:10px 0;border-left:4px solid #FF6B35;"><b style="color:#FF6B35;">🏪 Recoger en local</b></div>`;
  const paySec = isEfectivo ? `<div style="padding:12px;background:rgba(0,212,170,0.12);border-radius:8px;border-left:4px solid #00D4AA;margin-top:10px;"><b style="color:#00D4AA;">💵 Efectivo</b> - ${isDelivery?"Paga al domiciliario":"Paga al recoger"}</div>` : paymentProofUrl ? `<div style="padding:12px;background:rgba(0,212,170,0.12);border-radius:8px;margin-top:10px;"><b style="color:#00D4AA;">💳 Comprobante</b><br/><img src="${paymentProofUrl}" style="max-width:100%;border-radius:8px;"/></div>` : `<div style="padding:12px;background:rgba(255,107,53,0.1);border-radius:8px;margin-top:10px;"><b style="color:#FF6B35;">💳 ${order.payment_method||"Pendiente"}</b></div>`;
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid #1a1a1a;"><div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:20px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:20px;">CONEKTAO</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Nuevo Pedido WhatsApp</p></div><div style="padding:20px;"><div style="display:flex;gap:8px;margin-bottom:12px;"><div style="background:#111;padding:10px;border-radius:8px;flex:1;"><small style="color:#888;">Cliente</small><p style="margin:4px 0 0;color:#fff;">👤 ${order.customer_name||"Cliente"}</p></div><div style="background:#111;padding:10px;border-radius:8px;flex:1;"><small style="color:#888;">Teléfono</small><p style="margin:4px 0 0;color:#fff;">📱 +${phone}</p></div></div>${delSec}<table style="width:100%;border-collapse:collapse;margin-top:12px;background:#111;border-radius:8px;border:1px solid #1a1a1a;"><thead><tr style="background:#151515;"><th style="padding:8px;text-align:left;color:#00D4AA;font-size:11px;">Producto</th><th style="padding:8px;color:#00D4AA;font-size:11px;">Cant.</th><th style="padding:8px;text-align:right;color:#00D4AA;font-size:11px;">Precio</th><th style="padding:8px;text-align:right;color:#00D4AA;font-size:11px;">Subtotal</th></tr></thead><tbody>${items}</tbody><tfoot><tr><td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;color:#fff;border-top:2px solid #00D4AA;">TOTAL:</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px;color:#00D4AA;border-top:2px solid #00D4AA;">$${(order.total||0).toLocaleString("es-CO")}</td></tr></tfoot></table>${paySec}${order.observations?`<div style="margin-top:10px;padding:10px;background:#111;border-radius:8px;"><small style="color:#888;">Obs.</small><p style="margin:4px 0 0;color:#e0e0e0;">📝 ${order.observations}</p></div>`:""}</div><div style="padding:12px;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:10px;">Powered by CONEKTAO</p></div></div>`;
}

/** Send email via Brevo — uses pedidos@conektao.com verified domain */
async function sendEmail(to: string, subject: string, html: string, fromOverride?: string): Promise<boolean> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) { console.error("EMAIL_SKIP: BREVO_API_KEY not set"); return false; }
  const fromEmail = fromOverride || "pedidos@conektao.com";
  const fromName = "CONEKTAO Pedidos";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  const body = await res.text();
  console.log(`Brevo [${fromEmail} → ${to}]: status=${res.status} body=${body}`);
  if (!res.ok) {
    console.error(`EMAIL_FAIL { from: "${fromEmail}", to: "${to}", status: ${res.status}, body: "${body}" }`);
  }
  return res.ok;
}

/** Save order to DB and send confirmation email — EMAIL NEVER BLOCKS CONFIRMATION */
async function saveOrder(
  rid: string,
  cid: string,
  phone: string,
  order: any,
  config: any,
  paymentProofUrl?: string | null,
) {
  // ── DEDUP GUARD 1: by conversation_id ──────────────────────────────────────
  const { data: existingOrder } = await supabase
    .from("whatsapp_orders")
    .select("id, email_sent")
    .eq("conversation_id", cid)
    .eq("restaurant_id", rid)
    .eq("status", "received")
    .limit(1)
    .maybeSingle();

  if (existingOrder) {
    console.log(`⚠️ DEDUP: Order already exists for conversation ${cid} (order ${existingOrder.id})`);
    // Email was not sent on previous attempt → retry now (non-blocking)
    if (!existingOrder.email_sent && config.order_email) {
      console.log(`📧 EMAIL_RETRY: Retrying email for existing order ${existingOrder.id}`);
      const rawType = (order.delivery_type || "pickup").toLowerCase();
      const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
      const html = buildOrderEmailHtml(order, phone, isDelivery, paymentProofUrl);
      const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
      try {
        const sent = await sendEmail(config.order_email, subject, html);
        if (sent) {
          await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", existingOrder.id);
          await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
          console.log(`📧 EMAIL_RETRY_OK { order_id: "${existingOrder.id}" }`);
        } else {
          console.log(`📧 EMAIL_RETRY_FAIL { order_id: "${existingOrder.id}" }`);
        }
      } catch (emailErr) {
        console.error(`📧 EMAIL_RETRY_ERROR { order_id: "${existingOrder.id}", err: "${emailErr}" }`);
      }
    }
    return existingOrder.id;
  }

  // ── DEDUP GUARD 2: time-based fallback (2 min window) ─────────────────────
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
    console.log(`⚠️ DEDUP_TIME: Skipping duplicate order for ${phone} (within 2min)`);
    return recentDup.id;
  }

  const rawType = (order.delivery_type || "pickup").toLowerCase();
  const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
  const deliveryType = isDelivery ? "delivery" : "pickup";

  // ── STEP 1: Insert order in DB ─────────────────────────────────────────────
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
    console.error(`💾 DB_INSERT_FAIL { phone: "${phone}", error: "${error.message}" }`);
    return null;
  }
  console.log(`💾 DB_INSERT_OK { order_id: "${saved.id}", phone: "${phone}", total: ${order.total} }`);

  // ── STEP 2: IMMEDIATELY mark conversation as confirmed (BEFORE email attempt) ──
  // This ensures the order stays confirmed even if email fails
  await supabase
    .from("whatsapp_conversations")
    .update({ order_status: "confirmed", current_order: order, pending_since: null })
    .eq("id", cid);
  console.log(`✅ CONV_STATUS_CONFIRMED { conv_id: "${cid}" }`);

  // ── STEP 3: Send email (NON-BLOCKING — failure never reverts confirmation) ──
  if (!config.order_email) {
    console.log(`📧 EMAIL_SKIP: No order_email configured for restaurant ${rid}`);
    return saved.id;
  }

  try {
    const html = buildOrderEmailHtml(order, phone, isDelivery, paymentProofUrl);
    const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
    const sent = await sendEmail(config.order_email, subject, html);
    if (sent) {
      // Only update email_sent + status, never revert to unconfirmed
      await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
      await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
      console.log(`📧 EMAIL_SEND_OK { order_id: "${saved.id}", to: "${config.order_email}" }`);
    } else {
      // Email failed — order STAYS confirmed, just not "emailed"
      console.log(`📧 EMAIL_SEND_FAIL { order_id: "${saved.id}", to: "${config.order_email}" } — order confirmed regardless`);
    }
  } catch (emailErr) {
    // Email exception — order STAYS confirmed
    console.error(`📧 EMAIL_EXCEPTION { order_id: "${saved.id}", err: "${emailErr}" } — order confirmed regardless`);
  }

  return saved.id;
}

async function saveOrderModification(rid: string, cid: string, phone: string, modification: any, modType: "addition"|"change", config: any, originalOrder: any) {
  const updatedOrder = modType === "change" ? modification : { ...originalOrder, items: [...(originalOrder?.items||[]),...(modification.items||[])], total: modification.total||originalOrder?.total };
  await supabase.from("whatsapp_conversations").update({ current_order: updatedOrder }).eq("id", cid);
  const { data: existingOrder } = await supabase.from("whatsapp_orders").select("id, items, total").eq("conversation_id", cid).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingOrder) {
    const newItems = modType === "change" ? modification.items : [...((existingOrder.items as any[])||[]),...(modification.items||[])];
    await supabase.from("whatsapp_orders").update({ items: newItems, total: modification.total||updatedOrder.total }).eq("id", existingOrder.id);
  }
  if (!config.order_email) return;
  const isAdd = modType === "addition", emoji = isAdd?"➕":"⚠️", label = isAdd?"ADICIÓN":"CAMBIO", color = isAdd?"#00D4AA":"#FF6B35";
  const itemsHtml = (modification.items||[]).map((i:any) => `<tr><td style="padding:8px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:8px;text-align:center;color:#e0e0e0;">${i.quantity}</td><td style="padding:8px;text-align:right;color:#e0e0e0;">$${((i.unit_price||0)*(i.quantity||1)).toLocaleString("es-CO")}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid ${color}33;"><div style="background:linear-gradient(135deg,${color},${color}99);padding:16px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:18px;">${emoji} ${label} DE PEDIDO</h1></div><div style="padding:16px;"><p style="color:#fff;">👤 ${modification.customer_name||"Cliente"} · 📱 +${phone}</p>${!isAdd?`<div style="background:#2a0a0a;border:1px solid #FF4444;border-radius:8px;padding:10px;margin-bottom:12px;"><p style="margin:0;color:#FF4444;">⚠️ Productos cambiados</p></div>`:""}<table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;border:1px solid #1a1a1a;"><thead><tr style="background:#151515;"><th style="padding:8px;text-align:left;color:${color};font-size:11px;">Producto</th><th style="padding:8px;color:${color};font-size:11px;">Cant.</th><th style="padding:8px;text-align:right;color:${color};font-size:11px;">Precio</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="margin-top:12px;text-align:right;"><span style="color:${color};font-size:20px;font-weight:bold;">$${(modification.total||0).toLocaleString("es-CO")}</span></div></div><div style="padding:10px;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:10px;">CONEKTAO</p></div></div>`;
  await sendEmail(config.order_email, `${emoji} ${label} - ${modification.customer_name||"Cliente"} - $${(modification.total||0).toLocaleString("es-CO")}`, html);
}

async function escalate(config: any, phone: string, reason: string, conversationMessages?: any[]) {
  if (!config.order_email) return;
  const convHtml = conversationMessages?.length ? `<div style="margin-top:12px;padding:10px;background:#111;border-radius:8px;">${conversationMessages.slice(-10).map((m:any) => `<p style="margin:4px 0;padding:4px 8px;border-radius:4px;background:${m.role==="customer"?"#1a2a1a":"#1a1a2a"};color:#eee;font-size:12px;"><b style="color:${m.role==="customer"?"#00D4AA":"#FF6B35"};">${m.role==="customer"?"👤":"🤖"}</b> ${(m.content||"").substring(0,150)}</p>`).join("")}</div>` : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid #1a1a1a;"><div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:16px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:18px;">🚨 ALICIA necesita autorización</h1></div><div style="padding:16px;color:#eee;"><div style="background:#1a1a1a;border-radius:8px;padding:12px;margin-bottom:12px;"><p style="margin:0 0 6px;"><b style="color:#FF6B35;">📱</b> +${phone}</p><p style="margin:0;color:#ccc;">${reason}</p></div>${convHtml}<div style="margin-top:12px;padding:10px;background:#1a2a1a;border-radius:8px;"><p style="color:#00D4AA;margin:0;">💡 Comunícate con el cliente al +${phone}</p></div></div></div>`;
  await sendEmail(config.order_email, `⚠️ ALICIA - Cliente +${phone}`, html);
}

// ==================== SALES NUDGE SYSTEM ====================

async function runSalesNudgeCheck() {
  try {
    const twoMinAgo = new Date(Date.now() - 2*60*1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10*60*1000).toISOString();
    const { data: dyingConvs } = await supabase.from("whatsapp_conversations").select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at").not("order_status", "in", '("none","confirmed","followup_sent","nudge_sent")').lt("updated_at", twoMinAgo);
    const { data: abandonedConvs } = await supabase.from("whatsapp_conversations").select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at").not("order_status", "eq", "confirmed").lt("updated_at", twoMinAgo);
    const reallyAbandoned = (abandonedConvs||[]).filter((c:any) => { const m = Array.isArray(c.messages)?c.messages:[]; if(m.length<3)return false; let count=0; for(let i=m.length-1;i>=0;i--){if(m[i].role==="customer")count++;else break;} return count>=3; });
    const allConvs = [...(dyingConvs||[])]; const existingIds = new Set(allConvs.map((c:any)=>c.id));
    for(const ac of reallyAbandoned){if(!existingIds.has(ac.id)){allConvs.push(ac);existingIds.add(ac.id);}}
    if(allConvs.length===0)return{nudged:0};
    let nudgedCount=0;
    for(const conv of allConvs){
      if(conv.last_nudge_at && new Date(conv.last_nudge_at).toISOString()>tenMinAgo)continue;
      const msgs=Array.isArray(conv.messages)?conv.messages:[];
      const lastMsg=msgs[msgs.length-1];
      let consecutiveCustomerMsgs=0; for(let i=msgs.length-1;i>=0;i--){if(msgs[i].role==="customer")consecutiveCustomerMsgs++;else break;}
      const isConvAbandoned=consecutiveCustomerMsgs>=3;
      if(!isConvAbandoned){if(!lastMsg||lastMsg.role!=="assistant"||lastMsg.is_nudge)continue;}
      const { data: waConfig } = await supabase.from("whatsapp_configs").select("whatsapp_phone_id, whatsapp_access_token, restaurant_id").eq("restaurant_id", conv.restaurant_id).maybeSingle();
      const phoneId=waConfig?.whatsapp_phone_id||GLOBAL_WA_PHONE_ID;
      const waToken=waConfig?.whatsapp_access_token&&waConfig.whatsapp_access_token!=="ENV_SECRET"?waConfig.whatsapp_access_token:GLOBAL_WA_TOKEN;
      if(!phoneId||!waToken)continue;
      const closerPrompt=isConvAbandoned?`Eres Alicia. El cliente envió mensajes sin respuesta. Discúlpate BREVEMENTE y responde. NO markdown. Max 1 emoji. Corto.\nPEDIDO: ${conv.current_order?JSON.stringify(conv.current_order):"N/A"}\nCliente: ${conv.customer_name||"?"}`:`Eres Alicia. Cliente dejó de responder. Seguimiento MUY corto. NO markdown. Max 1 emoji.\nPEDIDO: ${conv.current_order?JSON.stringify(conv.current_order):"N/A"}`;
      const nudgeMsg=await callAI(closerPrompt,msgs.slice(-10),0.6);
      const cleanNudge=nudgeMsg.replace(/---[A-Z_]+---[\s\S]*?---[A-Z_]+---/g,"").replace(/\*+/g,"").trim();
      await supabase.from("whatsapp_conversations").update({last_nudge_at:new Date().toISOString(),order_status:"nudge_sent"}).eq("id",conv.id);
      await sendWA(phoneId,waToken,conv.customer_phone,cleanNudge,true);
      msgs.push({role:"assistant",content:cleanNudge,timestamp:new Date().toISOString(),is_nudge:true});
      await supabase.from("whatsapp_conversations").update({messages:msgs.slice(-30)}).eq("id",conv.id);
      nudgedCount++;
    }
    return{nudged:nudgedCount};
  }catch(e){console.error("Sales nudge error:",e);return{nudged:0};}
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

    case "resend_recent_orders": {
      // Reenvía emails de todos los pedidos recientes al correo configurado en whatsapp_configs
      let bodyResend: any = {};
      try { bodyResend = await req.clone().json(); } catch(_) {}
      const daysBack = parseInt(url.searchParams.get("days") || "7");
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
      const resendRestaurantId = bodyResend.restaurant_id;

      // Read configured order_email from whatsapp_configs (respects the actual config)
      let overrideTo = bodyResend.override_email || null;
      if (!overrideTo && resendRestaurantId) {
        const { data: cfgRow } = await supabase
          .from("whatsapp_configs")
          .select("order_email")
          .eq("restaurant_id", resendRestaurantId)
          .maybeSingle();
        overrideTo = cfgRow?.order_email || null;
      }
      if (!overrideTo) overrideTo = "conektaolatam@gmail.com"; // final fallback

      const ordersQuery = supabase
        .from("whatsapp_orders")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (resendRestaurantId) ordersQuery.eq("restaurant_id", resendRestaurantId);

      const { data: recentOrders } = await ordersQuery;
      if (!recentOrders?.length)
        return new Response(JSON.stringify({ sent: 0, message: "No orders found in period" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      let sentCount = 0;
      const results: any[] = [];
      for (const order of recentOrders) {
        try {
          const isDelivery = order.delivery_type === "delivery";
          const html = buildOrderEmailHtml(order as any, order.customer_phone, isDelivery);
          const dateStr = new Date(order.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota" });
          const subject = `🍕 [${dateStr}] ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
          const sent = await sendEmail(overrideTo, subject, html);
          if (sent) sentCount++;
          results.push({ order_id: order.id, customer: order.customer_name, total: order.total, sent, date: order.created_at });
        } catch (e: any) {
          results.push({ order_id: order.id, error: e?.message });
        }
      }
      return new Response(JSON.stringify({ sent: sentCount, total: recentOrders.length, to: overrideTo, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "save_manual_order": {
      // Inserta un pedido manual y envía email — para conversaciones donde current_order quedó null
      // POST body: { conversation_id, customer_phone, customer_name, items, total, delivery_type, delivery_address, payment_method, restaurant_id }
      let body: any = {};
      try { body = await req.clone().json(); } catch(_) {}
      const rid = body.restaurant_id || "899cb7a7-7de1-47c7-a684-f24658309755";
      const cid = body.conversation_id;
      const phone = body.customer_phone;
      if (!cid || !phone)
        return new Response(JSON.stringify({ error: "conversation_id and customer_phone required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      const order = {
        customer_name: body.customer_name || "Cliente",
        items: body.items || [],
        total: body.total || 0,
        subtotal: body.subtotal || body.total || 0,
        delivery_type: body.delivery_type || "delivery",
        delivery_address: body.delivery_address || null,
        payment_method: body.payment_method || "Efectivo",
        observations: body.observations || null,
        packaging_total: body.packaging_total || 0,
      };

      // Insert order
      const { data: saved, error: insErr } = await supabase
        .from("whatsapp_orders")
        .insert({
          restaurant_id: rid,
          conversation_id: cid,
          customer_phone: phone,
          customer_name: order.customer_name,
          items: order.items,
          total: order.total,
          delivery_type: order.delivery_type === "delivery" ? "delivery" : "pickup",
          delivery_address: order.delivery_address,
          status: "received",
          email_sent: false,
        })
        .select().single();

      if (insErr)
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // Update conversation to confirmed
      await supabase.from("whatsapp_conversations")
        .update({ order_status: "confirmed", current_order: order, pending_since: null })
        .eq("id", cid);

      // Send email
      const { data: cfg } = await supabase.from("whatsapp_configs")
        .select("order_email").eq("restaurant_id", rid).maybeSingle();

      let emailSent = false;
      if (cfg?.order_email) {
        const isDelivery = order.delivery_type === "delivery";
        const html = buildOrderEmailHtml(order, phone, isDelivery);
        const dateStr = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        const subject = `🍕 Pedido ${isDelivery?"Domicilio":"Recoger"} - ${order.customer_name} - $${order.total.toLocaleString("es-CO")}`;
        emailSent = await sendEmail(cfg.order_email, subject, html);
        if (emailSent) {
          await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
          await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
        }
      }

      return new Response(JSON.stringify({ order_id: saved.id, email_sent: emailSent, to: cfg?.order_email }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

      // ===== BLOCKED NUMBER CHECK =====
      const { data: blockedEntry } = await supabase
        .from("whatsapp_blocked_numbers")
        .select("id")
        .eq("restaurant_id", rId)
        .eq("phone_number", from)
        .maybeSingle();

      if (blockedEntry) {
        console.log(`🚫 BLOCKED: Message from ${from} ignored (blocked number)`);
        return new Response(JSON.stringify({ status: "blocked" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // ===== END BLOCKED NUMBER CHECK =====

      const conv = await getConversation(rId, from);

      // ===== HANDLE AFFIRMATIVE CONFIRMATION =====
      const lowerTextTrim = text.toLowerCase().trim().replace(/[.,!?¿¡]+/g, "").trim();
      
      // --- EMAIL RETRY: If confirmed but email never sent, retry before anything else ---
      if (conv.order_status === "confirmed" && conv.current_order) {
        const { data: pendingOrder } = await supabase
          .from("whatsapp_orders")
          .select("id, email_sent")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingOrder && !pendingOrder.email_sent) {
          console.log(`📧 EMAIL_PENDING_RETRY: order_id=${pendingOrder.id} - retrying email`);
          const orderData: any = conv.current_order;
          const isDelivery = (orderData?.delivery_type === "delivery");
          const html = buildOrderEmailHtml(orderData, from, isDelivery);
          const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${orderData?.customer_name || "Cliente"} - $${(orderData?.total || 0).toLocaleString("es-CO")}`;
          const retried = await sendEmail(config.order_email, subject, html);
          if (retried) {
            await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", pendingOrder.id);
            await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", conv.id);
            console.log(`📧 EMAIL_RETRY_SUCCESS: order_id=${pendingOrder.id} → emailed`);
            // Update conv locally for the rest of this request
            conv.order_status = "emailed";
          } else {
            console.log(`📧 EMAIL_RETRY_FAIL: order_id=${pendingOrder.id} - will retry on next message`);
          }
        }
      }

      // --- IDEMPOTENCY: If already confirmed/emailed, never re-confirm ---
      if (
        (conv.order_status === "confirmed" || conv.order_status === "emailed") &&
        conv.current_order
      ) {
        // Check if user is trying to confirm again
        const affirmativeWords = /(si|sí|confirmar|confirmo|dale|listo|ok|perfecto|de una|sisas|hagale|hágale|va|claro|bueno|hecho|correcto|✅|👍)/i;
        if (affirmativeWords.test(lowerTextTrim)) {
          console.log(`🔁 IDEMPOTENCY: Already ${conv.order_status} for ${from}. Skipping re-confirm.`);
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({ role: "customer", content: text, timestamp: new Date().toISOString(), wa_message_id: msg.id });
          const resp = "Ya quedó confirmado ✅ Tu pedido está en preparación";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: convMsgs.slice(-30) })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "already_confirmed_idempotent" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Not affirmative on confirmed order — fall through to post-confirmation handling below
      }

      // --- ROBUST CONFIRMATION DETECTION ---
      // Instead of exact match, detect affirmative INTENT even with extra text like "en efectivo sí"
      const affirmativeKeywords = /\b(si|sí|confirmar|confirmo|dale|listo|va|claro|ok|okey|okay|perfecto|de una|deuna|correcto|bien|todo bien|vamos|adelante|manda|envía|envia|ya|eso es|hecho|sale|sisas|hagale|hágale|sii|siii|siiii|sep|sepp|aja|ajá|venga|bueno|va pues|hagámosle|confirmado)\b/i;
      const negativeKeywords = /\b(no|cancel|cancelar|no quiero|dejalo|déjalo|nada|olvida|cambiar|cambio|modificar|quitar|quita|agregar|corregir)\b/i;
      const emojiAffirmative = /[✅👍🔥]/.test(text);
      const isAffirmative = !negativeKeywords.test(lowerTextTrim) && (affirmativeKeywords.test(lowerTextTrim) || emojiAffirmative);
      
      // ── BACKEND DETERMINISTIC CONFIRMATION ─────────────────────────────────────
      // The LLM ONLY converses. The backend decides to confirm.
      // If user is affirmative AND there's a valid order (either in conv or in DB fallback):
      if (
        isAffirmative &&
        (conv.order_status === "pending_confirmation" ||
          conv.order_status === "pending_button_confirmation" ||
          conv.order_status === "active")
      ) {
        // ── RESOLVE ORDER: from conv OR from DB fallback (tag-failure protection) ──
        let resolvedOrder = conv.current_order;
        
        if (!resolvedOrder) {
          // Gemini may have failed to output the tag — look for the most recent DB order
          const { data: lastDbOrder } = await supabase
            .from("whatsapp_orders")
            .select("*")
            .eq("conversation_id", conv.id)
            .eq("restaurant_id", rId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (lastDbOrder && lastDbOrder.status !== "confirmed") {
            resolvedOrder = { items: lastDbOrder.items, total: lastDbOrder.total, delivery_type: lastDbOrder.delivery_type, delivery_address: lastDbOrder.delivery_address, customer_name: lastDbOrder.customer_name, payment_method: "efectivo" };
            console.log(`🔄 FALLBACK_ORDER: Resolved order from DB for conv ${conv.id}, total: ${lastDbOrder.total}`);
          }
        }

        if (!resolvedOrder) {
          // No order found anywhere — user said "yes" but there's nothing to confirm
          // This happens when they say something affirmative before ordering
          console.log(`⚠️ CONFIRM_NO_ORDER { phone: "${from}", status: "${conv.order_status}" } — falling through to AI`);
          // Do NOT return here — fall through to normal AI processing
        } else {
          console.log(`✅ CONFIRM_DETECTED { phone: "${from}", status: "${conv.order_status}", matched_phrase: "${lowerTextTrim}" }`);
          
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({ role: "customer", content: text, timestamp: new Date().toISOString(), wa_message_id: msg.id });
          
          // ── IDEMPOTENCY: Check for existing confirmed order ────────────────
          const { data: existingEvent } = await supabase
            .from("whatsapp_orders")
            .select("id")
            .eq("conversation_id", conv.id)
            .eq("restaurant_id", rId)
            .eq("status", "received")
            .limit(1)
            .maybeSingle();
          
          if (existingEvent) {
            console.log(`🔁 IDEMPOTENCY: Order already exists for conversation ${conv.id}. Skipping duplicate.`);
            const resp = "Ya quedó confirmado ✅ Tu pedido está en preparación";
            convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({ messages: convMsgs.slice(-30), order_status: "confirmed", pending_since: null })
              .eq("id", conv.id);
            await sendWA(pid, token, from, resp, true);
            return new Response(JSON.stringify({ status: "confirmed_idempotent" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ── PRICE SNAPSHOT: Re-validate prices from DB at confirmation time ──
          const isLaBarra = config.restaurant_id === LA_BARRA_RESTAURANT_ID || !config.setup_completed;
          const { data: restaurantProfiles } = await supabase.from("profiles").select("id").eq("restaurant_id", rId);
          const profileIds = (restaurantProfiles || []).map((p: any) => p.id);
          const { data: confirmProds } = profileIds.length > 0
            ? await supabase.from("products").select("id, name, price, categories(name)").in("user_id", profileIds).eq("is_active", true)
            : { data: [] };
          const validated = validateOrder(resolvedOrder, isLaBarra, confirmProds || []);
          
          // ── STEP 1: CONFIRM IMMEDIATELY (email is async, never blocks) ──────
          const storedProof = conv.payment_proof_url || null;
          await saveOrder(rId, conv.id, from, validated.order, config, storedProof);
          console.log(`💾 ORDER_SAVED { conv=${conv.id}, phone: "${from}" }`);

          // Build confirmation message with payment info
          const orderData = typeof validated.order === 'object' ? validated.order : {};
          const customerName = (orderData as any)?.customer_name || '';
          const deliveryType = (orderData as any)?.delivery_type || '';
          const paymentMethod = (orderData as any)?.payment_method || '';
          const isDelivery = /domicilio|delivery/i.test(deliveryType);
          
          let paymentInstruction = '';
          if (isDelivery) {
            if (paymentMethod && /transferencia|nequi|daviplata/i.test(paymentMethod)) {
              paymentInstruction = '\n\n💳 Envíame el comprobante de pago cuando lo tengas';
            } else {
              paymentInstruction = '\n\n💵 Pagas al domiciliario cuando llegue';
            }
          }
          const nameGreeting = customerName ? `, ${customerName}` : '';
          const resp = `Listo${nameGreeting} ✅ Pedido confirmado!\n\nYa lo estamos preparando 🍕\n📩 Pedido enviado a cocina${paymentInstruction}`;
          
          // Save assistant message + final redundant state update
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
          
          console.log(`FINAL_STATE { conv_id: "${conv.id}", status: "confirmed", phone: "${from}" }`);
          
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "confirmed_via_backend" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // resolvedOrder null -> user said yes without an active order -> fall through to AI
      }

      // ===== PENDING CONFIRMATION: handle cancel or pass to AI =====
      if (
        (conv.order_status === "pending_confirmation" || conv.order_status === "pending_button_confirmation") &&
        conv.current_order
      ) {
        const lowerText = text.toLowerCase().trim().replace(/[.,!?¿¡]+/g, "").trim();
        // Detect "quiero cambiar/modificar/agregar" → reset to active, not cancel
        const changePatterns = /^(cambiar|cambiar algo|modificar|agregar|corregir|quiero cambiar|quiero modificar|quiero agregar|cambio)/i;
        if (changePatterns.test(lowerText)) {
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });
          const resp = "Listo, cuéntame qué quieres cambiar y lo ajusto 😊";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({
              messages: convMsgs.slice(-30),
              order_status: "active",
              pending_since: null,
            })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "change_requested" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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

      // ===== POST-CONFIRMATION: New message after order was confirmed/emailed =====
      if (conv.order_status === "confirmed" || conv.order_status === "emailed") {
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
      // Products are linked via user_id -> profiles.restaurant_id, not directly
      const { data: restProfiles } = await supabase.from("profiles").select("id").eq("restaurant_id", rId);
      const restProfileIds = (restProfiles || []).map((p: any) => p.id);
      const { data: prods } = restProfileIds.length > 0
        ? await supabase
            .from("products")
            .select("id, name, price, description, category_id, categories(name)")
            .in("user_id", restProfileIds)
            .eq("is_active", true)
            .order("name")
        : { data: [] };
      
      console.log(`📋 Products loaded for restaurant ${rId}: ${(prods || []).length} products found`);
      // Flatten category name for prompt building
      const prodsWithCategory = (prods || []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name || "Otros",
      }));
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
        prodsWithCategory || [],
        config.promoted_products || [],
        config.greeting_message || "Hola! Bienvenido 👋",
        rName,
        freshCurrentOrder,
        freshOrderStatus,
        configWithTime,
        freshCustomerName || "",
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
        const validated = validateOrder(parsed.order, isLaBarra, prodsWithCategory);
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
