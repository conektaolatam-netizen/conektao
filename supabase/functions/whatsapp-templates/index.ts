import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API = "https://graph.facebook.com/v22.0";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    if (!accessToken) throw new Error("WHATSAPP_ACCESS_TOKEN not configured");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET: List templates
    if (req.method === "GET" || action === "list") {
      const wabaId = url.searchParams.get("waba_id");
      if (!wabaId) throw new Error("waba_id required");

      const res = await fetch(`${GRAPH_API}/${wabaId}/message_templates?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (data.error) {
        console.error("Meta API error:", data.error);
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ templates: data.data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create template or generate with AI
    const body = await req.json();

    if (action === "generate") {
      // AI generates template from natural language
      const { description, language = "es" } = body;
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
            {
              role: "system",
              content: `Eres un experto en WhatsApp Business API. El usuario describe en lenguaje natural qué plantilla quiere. Debes generar una plantilla válida para la API de Meta.

REGLAS:
- El nombre de plantilla solo puede contener letras minúsculas, números y guiones bajos. Máximo 512 caracteres.
- Las variables se escriben como {{1}}, {{2}}, etc. (números secuenciales).
- Categorías válidas: MARKETING, UTILITY, AUTHENTICATION
- El body no puede tener más de 1024 caracteres.
- Responde SOLO con JSON válido, sin texto adicional.

Formato de respuesta:
{
  "name": "nombre_de_la_plantilla",
  "category": "MARKETING|UTILITY|AUTHENTICATION",
  "language": "${language}",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Texto del header (opcional)"
    },
    {
      "type": "BODY",
      "text": "Texto del body con {{1}} variables {{2}}",
      "example": {
        "body_text": [["valor1", "valor2"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Texto del footer (opcional)"
    }
  ],
  "preview_text": "Un resumen corto de para qué sirve esta plantilla"
}

Si el header o footer no son necesarios, omítelos del array de components.`
            },
            {
              role: "user",
              content: description,
            },
          ],
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos segundos" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiRes.json();
      const raw = aiData.choices?.[0]?.message?.content || "";
      
      // Extract JSON from response (may be wrapped in markdown code blocks)
      let jsonStr = raw;
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      
      try {
        const template = JSON.parse(jsonStr.trim());
        return new Response(JSON.stringify({ template }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse AI response:", raw);
        return new Response(JSON.stringify({ error: "La IA generó una respuesta inválida, intenta de nuevo" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "create") {
      // Submit template to Meta
      const { waba_id, template } = body;
      if (!waba_id || !template) throw new Error("waba_id and template required");

      const res = await fetch(`${GRAPH_API}/${waba_id}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(template),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Meta create template error:", data.error);
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, id: data.id, status: data.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { waba_id, template_name } = body;
      if (!waba_id || !template_name) throw new Error("waba_id and template_name required");

      const res = await fetch(`${GRAPH_API}/${waba_id}/message_templates?name=${template_name}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-templates error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
