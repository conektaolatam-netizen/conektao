import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getMimeType(base64String: string): string {
  // Detect MIME type from base64 string header
  if (base64String.startsWith('/9j/')) return 'image/jpeg';
  if (base64String.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64String.startsWith('R0lGOD')) return 'image/gif';
  if (base64String.startsWith('UklGR')) return 'image/webp';
  // Default to jpeg for invoices/receipts
  return 'image/jpeg';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const deepSeekApiKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!deepSeekApiKey) {
      return new Response(JSON.stringify({ error: "DeepSeek API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { imageBase64, userId, conversationId, userMessage, receiptUrl } = await req.json();

    // If this is a conversation message, handle it
    if (userMessage && conversationId) {
      console.log("Processing conversation message:", userMessage);

      // Check if user is confirming inventory update
      if (
        userMessage.toLowerCase().includes("sí") ||
        userMessage.toLowerCase().includes("confirmo") ||
        userMessage.toLowerCase().includes("acepto") ||
        userMessage.toLowerCase().includes("confirmar") ||
        userMessage.toLowerCase().includes("aprobar")
      ) {
        // User confirmed - proceed with inventory update
        return new Response(
          JSON.stringify({
            type: "inventory_confirmed",
            message: "✅ ¡Perfecto! Actualizando inventario de ingredientes automáticamente...",
            action: "update_inventory",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const chatResponse = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deepSeekApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `Eres un asistente experto en facturas de proveedores de restaurantes. 

CONTEXTO: El usuario está revisando una factura que ya procesé para actualizar su INVENTARIO DE INGREDIENTES.

INSTRUCCIONES:
1. Si pregunta por ingredientes específicos, ayúdale a identificarlos
2. Si no logra ver algo, pregunta detalles específicos: "¿Puedes decirme qué ingrediente es el segundo de la lista y cuánto costó?"
3. Si hay dudas sobre cantidades o precios, pide confirmación exacta
4. Para inventario, pregunta: "¿Cuántos kg/L llegaron de [ingrediente] y cuál fue el costo unitario?"
5. Mantén respuestas cortas y específicas
6. Si confirma datos, responde: "Perfecto, actualizando inventario de ingredientes con esos datos"`,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          max_completion_tokens: 150,
        }),
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        console.error("DeepSeek chat error:", errText);
        return new Response(
          JSON.stringify({
            type: "chat_response",
            message:
              "Lo siento, hubo un problema técnico al procesar tu mensaje. ¿Puedes intentar de nuevo o reformular?",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const chatData = await chatResponse.json();
      const aiResponse =
        chatData?.choices?.[0]?.message?.content || "He recibido tu mensaje. ¿Podrías darme más detalles?";

      return new Response(
        JSON.stringify({
          type: "chat_response",
          message: aiResponse,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Otherwise, process the receipt image
    if (!imageBase64 || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing receipt image for user:", userId);

    // Get user's existing ingredients for context
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("name, cost_per_unit, unit")
      .eq("user_id", userId)
      .eq("is_active", true);

    const ingredientContext = ingredients?.map((i) => `${i.name} (${i.unit})`).join(", ") || "No ingredients found";

    // Process image with DeepSeek Vision
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepSeekApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Eres un experto procesador de facturas de proveedores para restaurantes. PRIORIDAD: Velocidad y precisión en la identificación de INGREDIENTES.

INGREDIENTES EXISTENTES DEL USUARIO: ${ingredientContext}

INSTRUCCIONES CRÍTICAS:
1. Extrae TODA la información visible con máxima velocidad
2. Identifica INGREDIENTES (materias primas: carnes, vegetales, lácteos, bebidas, etc.) NO productos terminados
3. Usa nombres de ingredientes existentes cuando sea similar
4. Para dudas menores, haz suposiciones inteligentes y pregunta solo lo crítico
5. Asigna automáticamente unidades lógicas (kg para carnes/vegetales, L para líquidos, unidades para items contables)

FORMATO JSON OBLIGATORIO:
{
  "success": true,
  "confidence": 85-100,
  "supplier_name": "nombre del proveedor",
  "invoice_number": "número factura",
  "date": "YYYY-MM-DD",
  "currency": "COP",
  "subtotal": numero,
  "tax": numero,
  "total": numero,
  "items": [
    {
      "description": "nombre exacto del ingrediente",
      "quantity": numero,
      "unit": "kg/g/ml/L/unidades",
      "unit_price": numero,
      "subtotal": numero,
      "matched_ingredient": "nombre del ingrediente existente si aplica"
    }
  ],
  "questions": [],
  "auto_suggestions": {
    "inventory_updates": [
      {
        "ingredient_name": "nombre",
        "new_stock_to_add": numero,
        "unit_cost": numero,
        "suggestion": "Agregar X kg/g/ml/L al inventario de Y"
      }
    ]
  }
}

SOLO pregunta si:
- No puedes leer texto crítico (proveedor, total)
- Hay ambigüedad en cantidades principales
- Ingredientes completamente ilegibles`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "PROCESA ESTA FACTURA RÁPIDAMENTE. Extrae todos los INGREDIENTES y prepara las actualizaciones automáticas de inventario.",
              },
              { 
                type: "image_url", 
                image_url: { url: `data:${getMimeType(imageBase64)};base64,${imageBase64}` }
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    }).catch((err) => {
      console.error("DeepSeek request failed:", err);
      return null as any;
    });
    clearTimeout(timeout);

    if (!response || !response.ok) {
      const errText = response ? await response.text() : "No response";
      console.error("DeepSeek vision error:", errText);
      return new Response(
        JSON.stringify({
          type: "questions",
          questions: [
            "No pude interpretar claramente la imagen de la factura. ¿Puedes subir una foto más nítida o confirmar proveedor y total?",
          ],
          partial_data: null,
          conversation_id: crypto.randomUUID(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const aiContent = data?.choices?.[0]?.message?.content || "";

    console.log("AI Response:", aiContent);

    // Parse the JSON response
    let extractedData;
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({
          type: "questions",
          questions: ["No pude extraer datos estructurados. ¿Puedes confirmar proveedor, número de factura y total?"],
          partial_data: null,
          conversation_id: crypto.randomUUID(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // If there are questions, return them for user clarification
    if (extractedData.questions && extractedData.questions.length > 0) {
      return new Response(
        JSON.stringify({
          type: "questions",
          questions: extractedData.questions,
          partial_data: extractedData,
          conversation_id: crypto.randomUUID(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if we need user confirmation for inventory updates
    if (extractedData.success && extractedData.confidence > 75) {
      if (extractedData.auto_suggestions?.inventory_updates?.length > 0) {
        return new Response(
          JSON.stringify({
            type: "confirmation_needed",
            data: extractedData,
            confirmation_message: `✅ Factura procesada correctamente!\n\n📦 ACTUALIZACIONES DE INVENTARIO DE INGREDIENTES SUGERIDAS:\n${extractedData.auto_suggestions.inventory_updates.map((item) => `• ${item.suggestion}`).join("\n")}\n\n💰 ¿Esta compra fue pagada en EFECTIVO desde la caja registradora?\n\n🔄 Confirma para actualizar automáticamente el inventario de ingredientes (con precio promedio ponderado) y registrar el pago si corresponde.`,
            conversation_id: crypto.randomUUID(),
            payment_required: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // If extraction was successful but confidence is low, ask for confirmation
    if (extractedData.success && extractedData.confidence <= 85) {
      return new Response(
        JSON.stringify({
          type: "low_confidence",
          data: extractedData,
          questions: [
            "La calidad de la imagen no es óptima. ¿Podrías tomar una foto más clara o confirmar los ingredientes extraídos?",
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Return extracted data for frontend to handle
    return new Response(
      JSON.stringify({
        type: "confirmation_needed",
        data: extractedData,
        confirmation_message: `✅ Factura procesada!\n\nConfirma para actualizar inventario de ingredientes.`,
        conversation_id: crypto.randomUUID(),
        payment_required: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in receipt-processor:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
