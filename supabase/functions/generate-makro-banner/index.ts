import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    console.log('Generando imagen de banner Makro...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: 'Generate a professional promotional banner for Makro supermarket. The banner should be 16:9 aspect ratio (1920x1080). Include: an elegant bottle of French red wine (Bordeaux style) prominently displayed, the Makro logo in orange and white colors, large bold text "60% OFF" in white with orange accent, text "en vino francés" below it, small text "*aplican términos y condiciones" at the bottom, vibrant orange and red gradient background, modern and professional design, high quality marketing material style, photorealistic wine bottle.'
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error('Error al generar imagen con IA');
    }

    const data = await response.json();
    console.log('Respuesta de IA recibida');
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No se generó la imagen');
    }

    console.log('Imagen generada exitosamente');

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: 'Imagen generada exitosamente'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-makro-banner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});