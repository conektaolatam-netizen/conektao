import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System prompt for Alicia Vendedores ──
const SYSTEM_PROMPT = `Eres Alicia, la asistente IA de Conektao. Estás hablando con un vendedor potencial que quiere aprender a vender tu servicio a restaurantes en Colombia.

Contexto sobre ti:
- Te conectas al WhatsApp del restaurante y atiendes pedidos 24/7 automáticamente.
- Aumentas el ticket promedio hasta un 15% sugiriendo complementos inteligentes.
- Organizas cada pedido y lo envías al correo del dueño automáticamente.
- El dueño no necesita hacer nada — tú trabajas sola.
- El vendedor gana comisión por cada restaurante que conecte contigo.

Reglas:
- Responde en máximo 3 oraciones cortas.
- Tono cálido, directo, profesional colombiano.
- Si preguntan por "ticket promedio": es el valor promedio que gasta cada cliente por pedido.
- Si preguntan por comisiones: el vendedor gana un porcentaje recurrente mensual por cada restaurante activo.
- Si preguntan por precio: Conektao tiene planes desde $99.000 COP/mes. Tú no cobras extra — vienes incluida.
- No inventes datos. Si no sabes algo, di "eso lo verás en los siguientes niveles del entrenamiento".
- Usa emojis con moderación (máximo 1 por mensaje).
- Si el usuario dice su nombre y ciudad, regístralo como vendedor potencial.`;

serve(async (req) => {
  // ── CORS preflight ──
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Webhook verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VENDEDORES_VERIFY_TOKEN") || Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[vendedores-webhook] Verification OK");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── Process incoming messages (POST) ──
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages || value.messages.length === 0) {
      return new Response(JSON.stringify({ status: "no_messages" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = value.messages[0];
    const from = message.from; // sender phone number
    const msgBody = message.text?.body || "";
    const phoneNumberId = value.metadata?.phone_number_id;

    console.log(`[vendedores-webhook] From: ${from}, Msg: ${msgBody}`);

    // ── Init Supabase client ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Upsert vendedor in DB ──
    const { data: existingVendedor } = await supabase
      .from("vendedores_agente")
      .select("id, nombre, estado")
      .eq("whatsapp", from)
      .maybeSingle();

    if (!existingVendedor) {
      // Register new potential vendor
      await supabase.from("vendedores_agente").insert({
        nombre: from, // will be updated later when they provide their name
        whatsapp: from,
        estado: "pendiente",
      });
    }

    // ── Call AI gateway ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: msgBody },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[vendedores-webhook] AI error:", aiRes.status, errText);
      // Send fallback message
      await sendWhatsAppMessage(phoneNumberId, from, "Disculpa, tengo un problema técnico. Intenta de nuevo en un momento. 🙏");
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "No pude responder en este momento.";

    // ── Send reply via WhatsApp ──
    await sendWhatsAppMessage(phoneNumberId, from, reply);

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[vendedores-webhook] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 200, // Always 200 to Meta
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Send WhatsApp message using vendedores-specific credentials ──
async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
  const token = Deno.env.get("WHATSAPP_VENDEDORES_TOKEN");
  const fallbackPhoneId = Deno.env.get("WHATSAPP_VENDEDORES_PHONE_ID");
  const pid = phoneNumberId || fallbackPhoneId;

  if (!token || !pid) {
    console.error("[vendedores-webhook] Missing WHATSAPP_VENDEDORES_TOKEN or PHONE_ID");
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v22.0/${pid}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[vendedores-webhook] WhatsApp send error:", res.status, errText);
  }
}
