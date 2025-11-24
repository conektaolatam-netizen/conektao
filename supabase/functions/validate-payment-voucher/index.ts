import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voucherUrl, paymentMethod, expectedAmount, restaurantAccountId } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
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

    // Call OpenAI API with vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Error al validar con IA');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let validation;
    try {
      validation = JSON.parse(content);
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});