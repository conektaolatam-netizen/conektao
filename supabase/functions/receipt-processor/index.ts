import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 402 (payment required) or non-rate-limit errors
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Lovable AI key not configured" }), {
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

      const chatResponse = await retryWithBackoff(async () => {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
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

        if (response.status === 429) {
          const error: any = new Error('Rate limit exceeded');
          error.status = 429;
          throw error;
        }

        if (response.status === 402) {
          const error: any = new Error('Payment required');
          error.status = 402;
          throw error;
        }

        if (!response.ok) {
          throw new Error(`AI Gateway error: ${response.status}`);
        }

        return response;
      });

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

    // Process image with Lovable AI Gateway with retry
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    
    const response = await retryWithBackoff(async () => {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
6. CRÍTICO: Asigna un campo "confidence_score" (0-100) a cada item extraído

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
      "matched_ingredient": "nombre del ingrediente existente si aplica",
      "confidence_score": numero (0-100)
    }
  ],
  "questions": [],
  "auto_suggestions": {
    "inventory_updates": [
      {
        "ingredient_name": "nombre",
        "new_stock_to_add": numero,
        "unit_cost": numero,
        "suggestion": "Agregar X kg/g/ml/L al inventario de Y",
        "confidence_score": numero (0-100)
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
                  text: "PROCESA ESTA FACTURA RÁPIDAMENTE. Extrae todos los INGREDIENTES y prepara las actualizaciones automáticas de inventario. Incluye confidence_score para cada item."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            },
          ],
          max_completion_tokens: 900,
        }),
        signal: controller.signal,
      });

      if (aiResponse.status === 429) {
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
      }

      if (aiResponse.status === 402) {
        const error: any = new Error('Payment required');
        error.status = 402;
        throw error;
      }

      if (!aiResponse.ok) {
        throw new Error(`AI Gateway error: ${aiResponse.status}`);
      }

      return aiResponse;
    }).catch((err) => {
      console.error("AI request failed:", err);
      clearTimeout(timeout);
      throw err;
    });
    
    clearTimeout(timeout);

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
            confirmation_message: `✅ Factura procesada correctamente!\n\n📦 ACTUALIZACIONES DE INVENTARIO DE INGREDIENTES SUGERIDAS:\n${extractedData.auto_suggestions.inventory_updates.map((item) => `• ${item.suggestion} ${item.confidence_score < 90 ? '⚠️ Verificar' : ''}`).join("\n")}\n\n💰 ¿Esta compra fue pagada en EFECTIVO desde la caja registradora?\n\n🔄 Confirma para actualizar automáticamente el inventario de ingredientes (con precio promedio ponderado) y registrar el pago si corresponde.`,
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
  } catch (error: any) {
    console.error("Error in receipt-processor:", error);
    
    // Handle specific error types
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'Sistema ocupado procesando muchas facturas. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT',
        type: 'error'
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        error: 'Servicio de IA temporalmente no disponible. Por favor contacta soporte.',
        code: 'PAYMENT_REQUIRED',
        type: 'error'
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
