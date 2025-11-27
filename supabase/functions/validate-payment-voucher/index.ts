import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voucherUrl, paymentMethod, expectedAmount, restaurantAccountId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get restaurant account details if provided
    let accountDetails = null;
    if (restaurantAccountId) {
      const { data } = await supabase
        .from('business_payment_accounts')
        .select('*')
        .eq('id', restaurantAccountId)
        .single();
      accountDetails = data;
    }

    // Create prompt based on payment method
    let prompt = '';
    if (paymentMethod === 'tarjeta') {
      prompt = `Analiza este voucher de pago con tarjeta. Debes verificar:
1. Que el monto sea exactamente $${expectedAmount.toLocaleString('es-CO')} COP
2. Que el voucher sea legible y tenga fecha reciente
3. Que contenga número de autorización visible
4. Que no haya signos de manipulación

Responde en formato JSON con:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "detectedAmount": number,
  "issues": string[],
  "recommendation": "approved" | "rejected" | "manual_review"
}`;
    } else if (paymentMethod === 'transferencia' || paymentMethod === 'nequi' || paymentMethod === 'daviplata') {
      const accountInfo = accountDetails 
        ? `Cuenta esperada: ${accountDetails.account_type.toUpperCase()} - terminada en ${accountDetails.last_four_digits}`
        : 'No se proporcionó información de cuenta';
      
      prompt = `Analiza este comprobante de transferencia/pago digital. Debes verificar:
1. Que el monto sea exactamente $${expectedAmount.toLocaleString('es-CO')} COP
2. ${accountInfo}
3. Que la fecha sea reciente (último día)
4. Que el comprobante sea legible y auténtico
5. Que contenga número de referencia o transacción

Responde en formato JSON con:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "detectedAmount": number,
  "detectedAccount": string (últimos 4 dígitos si es visible),
  "issues": string[],
  "recommendation": "approved" | "rejected" | "manual_review"
}`;
    }

    // Call Lovable AI Gateway with vision and retry logic
    const response = await retryWithBackoff(async () => {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: voucherUrl }
                }
              ]
            }
          ],
          max_completion_tokens: 500,
        }),
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
        const errorText = await aiResponse.text();
        console.error('Lovable AI error:', errorText);
        throw new Error('Error al validar con IA');
      }

      return aiResponse;
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let validation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      // If JSON parsing fails, return manual review
      validation = {
        isValid: false,
        confidence: 0,
        detectedAmount: 0,
        issues: ['No se pudo analizar automáticamente'],
        recommendation: 'manual_review'
      };
    }

    return new Response(
      JSON.stringify(validation),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in validate-payment-voucher:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'Sistema ocupado validando pagos. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT',
        isValid: false,
        confidence: 0,
        recommendation: 'manual_review'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        error: 'Servicio de validación temporalmente no disponible. Por favor contacta soporte.',
        code: 'PAYMENT_REQUIRED',
        isValid: false,
        confidence: 0,
        recommendation: 'manual_review'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
