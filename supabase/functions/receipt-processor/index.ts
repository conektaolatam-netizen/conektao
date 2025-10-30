import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { imageBase64, userId, conversationId, userMessage, receiptUrl } = await req.json();

    // If this is a conversation message, handle it
    if (userMessage && conversationId) {
      console.log('Processing conversation message:', userMessage);
      
      // Check if user is confirming inventory update
      if (userMessage.toLowerCase().includes('sí') || userMessage.toLowerCase().includes('confirmo') || userMessage.toLowerCase().includes('acepto') || userMessage.toLowerCase().includes('confirmar') || userMessage.toLowerCase().includes('aprobar')) {
        // User confirmed - proceed with inventory update
        return new Response(
          JSON.stringify({ 
            type: 'inventory_confirmed',
            message: '✅ ¡Perfecto! Actualizando inventario automáticamente...',
            action: 'update_inventory'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente experto en facturas de restaurantes. 

CONTEXTO: El usuario está revisando una factura que ya procesé.

INSTRUCCIONES:
1. Si pregunta por productos específicos, ayúdale a identificarlos
2. Si no logra ver algo, pregunta detalles específicos: "¿Puedes decirme qué producto es el segundo de la lista y cuánto costó?"
3. Si hay dudas sobre cantidades o precios, pide confirmación exacta
4. Para inventario, pregunta: "¿Cuántas unidades llegaron de [producto] y cuál fue el costo unitario?"
5. Mantén respuestas cortas y específicas
6. Si confirma datos, responde: "Perfecto, actualizando inventario con esos datos"`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_completion_tokens: 150,
        }),
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        console.error('OpenAI chat error:', errText);
        return new Response(
          JSON.stringify({ 
            type: 'chat_response',
            message: 'Lo siento, hubo un problema técnico al procesar tu mensaje. ¿Puedes intentar de nuevo o reformular?' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const chatData = await chatResponse.json();
      const aiResponse = chatData?.choices?.[0]?.message?.content || 'He recibido tu mensaje. ¿Podrías darme más detalles?';

      return new Response(
        JSON.stringify({ 
          type: 'chat_response',
          message: aiResponse 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise, process the receipt image
    if (!imageBase64 || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing receipt image for user:', userId);

    // Get user's existing products for context
    const { data: products } = await supabase
      .from('products')
      .select('name, cost_price, sku')
      .eq('user_id', userId);

    const productContext = products?.map(p => `${p.name} (${p.sku || 'N/A'})`).join(', ') || 'No products found';

    // Process image with OpenAI Vision (use a vision-capable model and robust error handling)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto procesador de facturas para restaurantes. PRIORIDAD: Velocidad y precisión.

PRODUCTOS EXISTENTES DEL USUARIO: ${productContext}

INSTRUCCIONES CRÍTICAS:
1. Extrae TODA la información visible con máxima velocidad
2. Usa nombres de productos existentes cuando sea similar
3. Para dudas menores, haz suposiciones inteligentes y pregunta solo lo crítico
4. Asigna automáticamente unidades lógicas (kg para carnes/vegetales, L para líquidos, unidades para items contables)

FORMATO JSON OBLIGATORIO:
{
  "success": true,
  "confidence": 85-100,
  "supplier_name": "nombre del proveedor",
  "invoice_number": "número factura",
  "date": "YYYY-MM-DD",
  "currency": "MXN",
  "subtotal": numero,
  "tax": numero,
  "total": numero,
  "items": [
    {
      "description": "nombre exacto del producto",
      "quantity": numero,
      "unit": "kg/L/unidades",
      "unit_price": numero,
      "subtotal": numero,
      "matched_product": "nombre del producto existente si aplica"
    }
  ],
  "questions": [],
  "auto_suggestions": {
    "inventory_updates": [
      {
        "product_name": "nombre",
        "new_stock_to_add": numero,
        "unit_cost": numero,
        "suggestion": "Agregar X unidades al inventario de Y"
      }
    ]
  }
}

SOLO pregunta si:
- No puedes leer texto crítico (proveedor, total)
- Hay ambigüedad en cantidades principales
- Productos completamente ilegibles`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'PROCESA ESTA FACTURA RÁPIDAMENTE. Extrae todos los datos y prepara las actualizaciones automáticas de inventario.' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
      signal: controller.signal,
    }).catch((err) => {
      console.error('OpenAI request failed:', err);
      return null as any;
    });
    clearTimeout(timeout);

    if (!response || !response.ok) {
      const errText = response ? await response.text() : 'No response';
      console.error('OpenAI vision error:', errText);
      return new Response(
        JSON.stringify({
          type: 'questions',
          questions: ['No pude interpretar claramente la imagen de la factura. ¿Puedes subir una foto más nítida o confirmar proveedor y total?'],
          partial_data: null,
          conversation_id: crypto.randomUUID()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data?.choices?.[0]?.message?.content || '';

    console.log('AI Response:', aiContent);

    // Parse the JSON response
    let extractedData;
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // No fallar con 500; pedir confirmación al usuario para mantener UX fluida
      return new Response(
        JSON.stringify({
          type: 'questions',
          questions: ['No pude extraer datos estructurados. ¿Puedes confirmar proveedor, número de factura y total?'],
          partial_data: null,
          conversation_id: crypto.randomUUID()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If there are questions, return them for user clarification
    if (extractedData.questions && extractedData.questions.length > 0) {
      return new Response(
        JSON.stringify({
          type: 'questions',
          questions: extractedData.questions,
          partial_data: extractedData,
          conversation_id: crypto.randomUUID()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we need user confirmation for inventory updates
    if (extractedData.success && extractedData.confidence > 75) {
      if (extractedData.auto_suggestions?.inventory_updates?.length > 0) {
        return new Response(
          JSON.stringify({
            type: 'confirmation_needed',
            data: extractedData,
            confirmation_message: `✅ Factura procesada correctamente!\n\n📦 ACTUALIZACIONES DE INVENTARIO SUGERIDAS:\n${extractedData.auto_suggestions.inventory_updates.map(item => `• ${item.suggestion}`).join('\n')}\n\n💰 ¿Esta compra fue pagada en EFECTIVO desde la caja registradora?\n\n🔄 Confirma para actualizar automáticamente el inventario y registrar el pago si corresponde.`,
            conversation_id: crypto.randomUUID(),
            payment_required: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If extraction was successful and no confirmation needed, save to database and update inventory
    if (extractedData.success && extractedData.confidence > 85) {
      console.log('Creating expense record...');

      // Create expense record
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          supplier_name: extractedData.supplier_name,
          invoice_number: extractedData.invoice_number,
          expense_date: extractedData.date,
          currency: extractedData.currency || 'MXN',
          subtotal: extractedData.subtotal,
          tax: extractedData.tax || 0,
          total_amount: extractedData.total,
          status: 'processed',
          ai_analysis: extractedData,
          receipt_url: receiptUrl || null
        })
        .select()
        .single();

      if (expenseError) {
        console.error('Error creating expense:', expenseError);
        return new Response(
          JSON.stringify({ error: 'Failed to save expense' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Expense created:', expense.id);

      // Create expense items and update inventory
      for (const item of extractedData.items) {
        // Find matching product
        const { data: matchingProducts } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .ilike('name', `%${item.description}%`)
          .limit(1);

        let productId = null;
        if (matchingProducts && matchingProducts.length > 0) {
          productId = matchingProducts[0].id;
          
          // Update existing inventory
          const { data: inventory } = await supabase
            .from('inventory')
            .select('*')
            .eq('product_id', productId)
            .single();

          if (inventory) {
            await supabase
              .from('inventory')
              .update({
                current_stock: inventory.current_stock + item.quantity,
                last_updated: new Date().toISOString()
              })
              .eq('id', inventory.id);

            // Create inventory movement
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: productId,
                movement_type: 'IN',
                quantity: item.quantity,
                reference_type: 'PURCHASE',
                reference_id: expense.id,
                notes: `Compra - Factura ${extractedData.invoice_number}`
              });
          }
        }

        // Create expense item
        await supabase
          .from('expense_items')
          .insert({
            expense_id: expense.id,
            product_id: productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            subtotal: item.subtotal
          });
      }

      return new Response(
        JSON.stringify({
          type: 'success',
          expense_id: expense.id,
          data: extractedData,
          message: `Factura procesada exitosamente. Se detectaron ${extractedData.items.length} productos.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          type: 'low_confidence',
          data: extractedData,
          questions: ['La calidad de la imagen no es óptima. ¿Podrías tomar una foto más clara o confirmar los datos extraídos?']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in receipt-processor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
