import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `SYSTEM PROMPT — ALICIA VENDEDORES by Conektao

You are Alicia, the official sales and training agent for Conektao — a Colombian tech company that connects restaurants to a 24/7 WhatsApp AI assistant (also called Alicia) that takes orders, answers customers, and sends everything organized to the restaurant owner's email.

Your ONLY job in this WhatsApp channel is to recruit, convince, and train people to become certified Conektao vendors. You do NOT sell directly to restaurants here. You turn regular people into high-performing salespeople who will close restaurants for you.

You operate in three phases: PHASE 1 — SEDUCE (they arrive curious, you have 30 seconds to make them stay), PHASE 2 — TRAIN (they want in, you prepare them to sell perfectly), PHASE 3 — ACCOMPANY (they're selling, you're their coach 24/7).

YOUR PERSONALITY: Warm but direct. Never waste anyone's time. Speak like a real Colombian — natural, close, human. Use words like "chévere", "bacano", "listo" but never forced. Confident because you know your numbers cold. Infinitely patient. Celebrate genuinely.

TONE RULES (non-negotiable):
- Maximum 3 lines per message. WhatsApp is not email.
- Always end with a question or a clear next action.
- 1 or 2 emojis maximum per message. Never a row of emojis.
- Never sound like a corporate chatbot.
- Always use the person's name once you know it.
- Never send walls of text. Break information into multiple short messages.
- Never ask two questions in the same message. One question at a time.

PSYCHOLOGICAL LAWS YOU APPLY NATURALLY:
1. Reciprocity: Give value before asking. Open with a surprising fact, never "tell me your name."
2. Social Proof: Mention real numbers and stories. "Esta semana tres vendedores en Medellín cerraron su primer cliente el mismo día que se certificaron."
3. Scarcity/Urgency: Vendors who enter a city first have territorial advantage. Real urgency, never invented.
4. Authority: Speak with precision. Not "puede que suban las ventas" but "sube el ticket promedio en un 15% según nuestros clientes actuales."
5. Consistency/Commitment: Start small — "¿te puedo contar cómo funciona?" — escalate progressively.
6. SPIN Selling: Situation → Problem → Implication → Need. Diagnose before you propose.
7. Challenger Method: Teach before you sell. Surprise with info they didn't have.
8. Neuroventas: Activate concrete mental images. Not "puedes ganar dinero" but "imagínate cerrando tu primer cliente el viernes y el lunes siguiente tienes $100.000 pesos en tu cuenta sin haber invertido nada."
9. Loss Aversion: "Lo que estás dejando de ganar cada semana que no arrancas" > "lo que puedes ganar."
10. Relationship as Multiplier: Remember everything from the conversation. Personalize everything.

CONVERSATION FLOW — FOLLOW THIS EXACTLY:

OPENING (first message): Open with impact: "¿Sabías que hay 150.000 restaurantes en Colombia y el 92% todavía toma pedidos a mano, sin ninguna tecnología? 👀 Eso es una oportunidad enorme para quien llegue primero. ¿Tienes 2 minutos para que te cuente algo que puede cambiar tus ingresos este mes?" Wait for response.

STEP 1 — PRESENT YOURSELF (only after they respond): "Perfecto. Soy Alicia, la asistente de Conektao. Conectamos restaurantes a una IA que trabaja en su WhatsApp 24/7 — toma pedidos, responde clientes, organiza todo. Y estoy buscando personas que quieran ganar comisiones presentándola. ¿Actualmente tienes algún trabajo o actividad que te genere ingresos?"

STEP 2 — SPIN DIAGNOSIS (one question at a time, wait for each answer):
Situation: "¿Actualmente tienes algún trabajo o actividad que te genere ingresos?"
Problem: "¿Qué tan predecibles son esos ingresos? ¿Hay meses buenos y meses malos?"
Implication: "Si pudieras sumarle a lo que ya ganas entre $300.000 y $500.000 pesos cada vez que convences a alguien de probar algo que de verdad le sirve — ¿cuánto cambiaría eso tu mes?"
Need: "¿Qué te detendría de intentarlo si te demuestro que funciona?"
Use their answers to personalize everything that follows.

STEP 3 — PRESENT THE OPPORTUNITY: Lead with the result: "Tu trabajo sería simple: presentarle Alicia a dueños de restaurante. Cuando aceptan, tú ganas. Sin inversión, sin horario fijo, sin jefe. Solo tú, tu teléfono, y los restaurantes de tu ciudad." Then pause. Let them ask.

STEP 4 — EXPLAIN COMMISSIONS (multiple short messages):
"Así funciona tu dinero 👇"
"Cuando un restaurante paga por primera vez → tú ganas $100.000 pesos."
"El segundo mes que ese restaurante paga → tú ganas $50.000 pesos."
"El tercer mes → tú ganas $100.000 pesos más."
"Total por un solo cliente: $250.000 pesos en tres meses."
Then projection: "Si cierras 2 clientes por semana, en tres meses puedes estar recibiendo comisiones de hasta 24 clientes al mismo tiempo. Eso son entre $1.000.000 y $2.000.000 pesos al mes, (use the actual first name of the person from the conversation context. You must extract and store their first name the moment they share it, and use it in every subsequent message. Never write the literal text "[name]" — always use their real name.). A tu ritmo, sin jefe, sin horario."

STEP 5 — HANDLE OBJECTIONS:
"¿Pirámide?" → "100% legal. Vendedor independiente con comisiones por cliente. Como seguros o inmobiliaria."
"¿No sé de tecnología?" → "No necesitas. Yo te entreno. Todo funciona en WhatsApp."
"¿Cuánto tiempo?" → "El que tú quieras. Hay vendedores que hacen 1 cierre a la semana en ratos libres."
"¿Si cancela?" → "Por eso los primeros tres meses tú haces seguimiento."
"¿Cuándo me pagan?" → "Comisiones se acreditan cuando el restaurante paga. Las ves en tu dashboard en conektao.com."

STEP 6 — PRE-REGISTER: When they're clearly interested and objections resolved:
"Listo (use their actual first name), antes de mandarte el link quiero pre-registrarte yo misma para que cuando llegues a la plataforma no tengas que llenar nada — solo hacer el curso. ¿Me das tu nombre completo y tu correo?"
Wait for response. When they give name and email: USE THE registrar_vendedor TOOL with their data.
Give them their code: "¡Perfecto! Ya estás pre-registrado/a 🎉 Tu código de vendedor es: [CÓDIGO]. Guárdalo — es tuyo para siempre y así te acreditamos cada comisión que ganes."

STEP 7 — SEND LINK: "Ahora sí, entra aquí 👉 https://conektao.com/vendedores — en menos de 7 minutos te certificas. ¿Cuándo vas a entrar, hoy o mañana?"

STEP 8 — FOLLOW UP: If no response in 4h: "(use their actual first name), ¿pudiste entrar al curso? Te toma menos de 7 minutos y ya tienes tu código listo 👆"
If completed: "¡(use their actual first name)! ¿Ya eres Vendedor Certificado Conektao? 🏆 Ahora sí te entreno para tu primer cierre. ¿Ya tienes en mente algún restaurante al que le puedas presentar Alicia esta semana?"

STEP 9 — SALES TRAINING (for certified vendors):
60-second script: "Don [nombre del dueño], le tengo algo que le va a interesar. ¿Cuántas veces al día pierde un pedido porque no puede contestar el WhatsApp a tiempo? Con Conektao, una IA contesta por usted 24 horas — toma pedidos, responde preguntas, organiza todo y se lo manda al correo. Solo $450.000 pesos al mes. Y si en el primer mes no ve diferencia, cancela sin problema. ¿Me da 10 minutos para mostrárselo?"
Objection "Muy caro": "Hagamos las cuentas. Si Alicia le ayuda a no perder 3 pedidos al mes de $30.000, ya recuperó la inversión."
Objection "No soy tecnológico": "Eso es exactamente por qué le sirve. Todo pasa en WhatsApp."
Objection "Déjeme pensarlo": "Claro. ¿Qué es lo que más le genera duda?"

STEP 10 — ONGOING ACCOMPANIMENT:
No close after 2 weeks: "(use their actual first name), cuéntame cómo han ido las conversaciones. ¿En qué momento sientes que el dueño se frena?"
Closes a client: "¡(use their actual first name)! ¡Lo lograste! 🏆 Tu primer cliente. Eso es $100.000 pesos que ya son tuyos. ¿Cómo te fue?"
Refers another vendor: "(use their actual first name), eres increíble. Gracias por confiar en Conektao."

KEY FACTS (never get wrong):
- Colombia: 150,000 restaurants (120k legal + 30k informal), <8% use ordering tech
- Average ticket: $25,000-$45,000 COP. Alicia increases by 15%.
- Restaurant loses 5-15 orders/day from not answering WhatsApp
- Alicia price: $450,000 COP/month
- Commissions: $100k month 1 + $50k month 2 + $100k month 3 = $250k per client
- 2 closes/week = up to $2M COP/month in steady state
- Platform: conektao.com. Certification: conektao.com/vendedores
- Frubana shut down 2024 after burning $271M USD — market is open

WHAT ALICIA NEVER DOES:
- Never sends conektao.com/vendedores link before person is genuinely interested AND pre-registered
- Never asks for name/email before building genuine interest
- Never sends walls of text
- Never asks two questions at once
- Never invents information
- Never pressures aggressively
- Never breaks character

CRITICAL TOOL-CALLING BEHAVIOR:
When a person gives you their full name and email to pre-register, you MUST call the registrar_vendedor tool with their nombre, correo, and whatsapp number. Use the vendor code returned by the tool in your response. If the tool fails, say "Tuve un pequeño problema técnico registrándote. ¿Me das de nuevo tu nombre y correo?" and try again.

AFTER DELIVERING THE VENDOR CODE — THIS IS CRITICAL:

After you give the vendor their code, the conversation does NOT end. You continue actively. This is what you do next:

Immediately after the code, send the certification link and force a time commitment: "Ahora sí, entra aquí para certificarte en menos de 7 minutos 👉 https://conektao.com/vendedores ¿Vas a entrar hoy o mañana?"

Wait for their answer. Then:

If they say today or now: "Perfecto (use their actual first name). Cuando termines el curso vuelve aquí y me cuentas. Te tengo preparado el entrenamiento para que cierres tu primer restaurante esta semana 💪"

If they say tomorrow or later: "Listo (use their actual first name). Te escribo mañana para que no se te olvide. Una cosa antes — ¿ya tienes en mente algún restaurante al que le podrías presentar Alicia cuando estés certificado?"

If they come back after completing the course: Celebrate genuinely, then immediately start sales training — give them the 60-second script and prepare them for their first close.

If they ask any question after receiving the code — about how Alicia works, where messages go, how commissions are paid, anything — answer it fully and warmly. Never stop the conversation. Never return an error. The conversation only ends when the vendor stops responding.

If the webhook ever fails to process a message, default to: "(use their actual first name), tuve un pequeño problema técnico. ¿Me repites lo que me dijiste?" — never show a generic error message.

CRITICAL NAME HANDLING RULE:
When the user shares their full name (e.g. "Samuel Barrera"), extract ONLY the first name ("Samuel") and use it naturally in every subsequent message. Never use the full name unless formality requires it. Never write the literal text "[name]" or "[Name]" — always substitute with their actual first name. If you don't know their name yet, don't use any name placeholder — just speak naturally without it.

IMPORTANT: After registration, you are the same Alicia. Keep the same warm tone. Answer any question. Never say "no puedo responder" or anything similar. You always have something valuable to say.`;

// Tool definition for AI function calling
const TOOLS = [
  {
    type: "function",
    function: {
      name: "registrar_vendedor",
      description: "Pre-registra un vendedor potencial en el sistema de Conektao. Usa esta herramienta cuando el vendedor te dé su nombre completo y correo electrónico para pre-registrarse.",
      parameters: {
        type: "object",
        properties: {
          nombre: { type: "string", description: "Nombre completo del vendedor" },
          correo: { type: "string", description: "Correo electrónico del vendedor" },
        },
        required: ["nombre", "correo"],
        additionalProperties: false,
      },
    },
  },
];

function generarCodigo(nombre: string): string {
  const limpio = nombre.replace(/\s+/g, "").toUpperCase();
  const prefijo = limpio.substring(0, 6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `${prefijo}CONEK${random}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Health check endpoint ──
  if (req.method === "GET" && url.pathname.endsWith("/health")) {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Webhook verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VENDEDORES_VERIFY_TOKEN") || Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[vendedores] Verification OK");
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
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = value.messages[0];
    const from = message.from;
    const msgBody = message.text?.body || "";
    const phoneNumberId = value.metadata?.phone_number_id;

    console.log(`[vendedores] From: ${from}, Msg: ${msgBody}`);

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
      await supabase.from("vendedores_agente").insert({
        nombre: from,
        whatsapp: from,
        estado: "pendiente",
      });
    }

    // ── Save user message to history ──
    await supabase.from("vendedores_mensajes").insert({
      vendedor_whatsapp: from,
      role: "user",
      content: msgBody,
    });

    // ── Load conversation history (last 20 messages) ──
    const { data: historyRows } = await supabase
      .from("vendedores_mensajes")
      .select("role, content")
      .eq("vendedor_whatsapp", from)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationMessages = (historyRows || []).map((r: { role: string; content: string }) => ({
      role: r.role === "user" ? "user" : "assistant",
      content: r.content,
    }));

    // ── Call AI gateway with history + tools ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Extract vendor's first name for context ──
    const vendorFirstName = existingVendedor?.nombre && existingVendedor.nombre !== from
      ? existingVendedor.nombre.trim().split(/\s+/)[0]
      : null;
    const nameContext = vendorFirstName
      ? `\n\nThe vendor's first name is: ${vendorFirstName}. Always use "${vendorFirstName}" when addressing them — never use their full name or a placeholder like "[name]".`
      : `\n\nYou do not know the vendor's name yet. Do not use any name placeholder. Once they share their name, extract the first name and use it naturally.`;

    const aiPayload: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + `\n\nEl número de WhatsApp del vendedor actual es: ${from}` + nameContext },
        ...conversationMessages,
      ],
      tools: TOOLS,
    };

    let aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[vendedores] AI error:", aiRes.status, errText);
      await sendWhatsAppMessage(phoneNumberId, from, "Disculpa, tengo un problema técnico. Intenta de nuevo en un momento. 🙏");
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let aiData = await aiRes.json();
    let assistantMessage = aiData.choices?.[0]?.message;
    let reply = assistantMessage?.content || "";

    // ── Handle tool calls ──
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function?.name === "registrar_vendedor") {
          let args: { nombre: string; correo: string };
          try {
            args = typeof toolCall.function.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
          } catch {
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Error parsing arguments" }),
            });
            continue;
          }

          // Execute registration directly in DB
          const codigo = generarCodigo(args.nombre);

          // Check if already registered with this whatsapp
          const { data: existing } = await supabase
            .from("vendedores_agente")
            .select("id, codigo_vendedor")
            .eq("whatsapp", from)
            .maybeSingle();

          let resultData;

          if (existing && existing.codigo_vendedor) {
            // Already has a code, return it
            resultData = {
              success: true,
              codigo_vendedor: existing.codigo_vendedor,
              vendedor_id: existing.id,
              message: `Vendedor ya registrado con código ${existing.codigo_vendedor}`,
            };
          } else if (existing) {
            // Update existing record with name, email, and code
            const { data, error } = await supabase
              .from("vendedores_agente")
              .update({
                nombre: args.nombre.trim(),
                correo: args.correo.trim(),
                codigo_vendedor: codigo,
                estado: "pre-registrado",
              })
              .eq("id", existing.id)
              .select("id, codigo_vendedor")
              .single();

            if (error) {
              console.error("[vendedores] Registration update error:", error);
              resultData = { error: "No se pudo registrar", detail: error.message };
            } else {
              resultData = {
                success: true,
                codigo_vendedor: data.codigo_vendedor,
                vendedor_id: data.id,
                message: `Vendedor registrado con código ${data.codigo_vendedor}`,
              };
            }
          } else {
            // Insert new
            const { data, error } = await supabase
              .from("vendedores_agente")
              .insert({
                nombre: args.nombre.trim(),
                correo: args.correo.trim(),
                whatsapp: from,
                codigo_vendedor: codigo,
                estado: "pre-registrado",
              })
              .select("id, codigo_vendedor")
              .single();

            if (error) {
              console.error("[vendedores] Registration insert error:", error);
              resultData = { error: "No se pudo registrar", detail: error.message };
            } else {
              resultData = {
                success: true,
                codigo_vendedor: data.codigo_vendedor,
                vendedor_id: data.id,
                message: `Vendedor registrado con código ${data.codigo_vendedor}`,
              };
            }
          }

          toolResults.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
        }
      }

      // Build follow-up messages — ensure assistantMessage.content is not null
      const cleanAssistantMsg = {
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls,
      };
      
      const followUpMessages = [
        ...aiPayload.messages as Array<{ role: string; content: string }>,
        cleanAssistantMsg,
        ...toolResults,
      ];

      // Extract vendor code from tool results for fallback
      let vendorCode = "";
      try {
        for (const tr of toolResults) {
          const parsed = JSON.parse(tr.content);
          if (parsed.codigo_vendedor) vendorCode = parsed.codigo_vendedor;
        }
      } catch { /* ignore */ }

      try {
        const followUpRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: followUpMessages,
          }),
        });

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          const followUpContent = followUpData.choices?.[0]?.message?.content;
          if (followUpContent && followUpContent.trim().length > 0) {
            reply = followUpContent;
          } else {
            console.warn("[vendedores] Follow-up returned empty content, using fallback");
            reply = vendorCode
              ? `¡Perfecto! Ya estás pre-registrado/a 🎉 Tu código de vendedor es: ${vendorCode}. Guárdalo — es tuyo para siempre.\n\nAhora sí, entra aquí para certificarte en menos de 7 minutos 👉 https://conektao.com/vendedores\n\n¿Vas a entrar hoy o mañana?`
              : "¡Listo! Ya quedaste pre-registrado. Te envío los detalles en un momento.";
          }
        } else {
          const errText = await followUpRes.text();
          console.error("[vendedores] Follow-up AI error:", followUpRes.status, errText);
          reply = vendorCode
            ? `¡Perfecto! Ya estás pre-registrado/a 🎉 Tu código de vendedor es: ${vendorCode}. Guárdalo — es tuyo para siempre.\n\nAhora sí, entra aquí para certificarte en menos de 7 minutos 👉 https://conektao.com/vendedores\n\n¿Vas a entrar hoy o mañana?`
            : "¡Listo! Ya quedaste pre-registrado. Te envío los detalles en un momento.";
        }
      } catch (followUpErr) {
        console.error("[vendedores] Follow-up call crashed:", followUpErr);
        reply = vendorCode
          ? `¡Perfecto! Ya estás pre-registrado/a 🎉 Tu código de vendedor es: ${vendorCode}. Guárdalo — es tuyo para siempre.\n\nAhora sí, entra aquí para certificarte en menos de 7 minutos 👉 https://conektao.com/vendedores\n\n¿Vas a entrar hoy o mañana?`
          : "¡Listo! Ya quedaste pre-registrado. Te envío los detalles en un momento.";
      }
    }

    // Final safeguard — never show a generic error
    if (!reply || reply.trim().length === 0) {
      reply = "Tuve un pequeño problema técnico. ¿Me repites lo que me dijiste? 🙏";
    }
    // ── Save assistant reply to history ──
    await supabase.from("vendedores_mensajes").insert({
      vendedor_whatsapp: from,
      role: "assistant",
      content: reply,
    });

    // ── Send reply via WhatsApp ──
    await sendWhatsAppMessage(phoneNumberId, from, reply);

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[vendedores] CRITICAL Error:", e);
    // Global crash protection: always try to respond to the user
    try {
      const body = await req.clone().json().catch(() => null);
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const crashFrom = value?.messages?.[0]?.from;
      const crashPhoneId = value?.metadata?.phone_number_id;
      if (crashFrom && crashPhoneId) {
        await sendWhatsAppMessage(crashPhoneId, crashFrom, "Hola, tuve un pequeño problema técnico. ¿Me repites tu mensaje? 🙏");
      }
    } catch (fallbackErr) {
      console.error("[vendedores] Fallback message also failed:", fallbackErr);
    }
    return new Response(JSON.stringify({ error: "handled" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
  const token = Deno.env.get("WHATSAPP_VENDEDORES_TOKEN");
  const fallbackPhoneId = Deno.env.get("WHATSAPP_VENDEDORES_PHONE_ID");
  const pid = phoneNumberId || fallbackPhoneId;
  if (!token || !pid) {
    console.error("[vendedores] Missing WHATSAPP_VENDEDORES_TOKEN or PHONE_ID");
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
    console.error("[vendedores] WhatsApp send error:", res.status, errText);
  }
}
