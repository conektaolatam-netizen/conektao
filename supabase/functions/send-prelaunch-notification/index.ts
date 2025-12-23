import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrelaunchRegistration {
  name: string;
  business_name: string;
  city: string;
  branches: string;
  main_business_type: string;
  pos_uses: boolean;
  pos_name?: string;
  improvements_wanted: string[];
  free_trial_interest: string;
  email: string;
  phone: string;
  created_at?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== SEND PRELAUNCH NOTIFICATION CALLED ===");
  console.log("RESEND_API_KEY exists:", !!RESEND_API_KEY);
  console.log("RESEND_API_KEY length:", RESEND_API_KEY?.length || 0);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const registration: PrelaunchRegistration = await req.json();
    console.log("📧 New registration received:");
    console.log("- Name:", registration.name);
    console.log("- Business:", registration.business_name);
    console.log("- Phone:", registration.phone);

    const improvementsList = registration.improvements_wanted.join(", ") || "Ninguna seleccionada";
    const posInfo = registration.pos_uses 
      ? `Sí - ${registration.pos_name || 'No especificado'}` 
      : 'No';
    
    const registrationDate = registration.created_at 
      ? new Date(registration.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      : new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F97316, #14B8A6); padding: 20px; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #F97316; }
          .field-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .field-value { font-size: 16px; color: #333; margin-top: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Nuevo Registro Prelanzamiento Conektao</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Nombre</div>
              <div class="field-value">${registration.name}</div>
            </div>
            <div class="field">
              <div class="field-label">Nombre del Negocio</div>
              <div class="field-value">${registration.business_name}</div>
            </div>
            <div class="field">
              <div class="field-label">Ciudad</div>
              <div class="field-value">${registration.city}</div>
            </div>
            <div class="field">
              <div class="field-label">Sucursales</div>
              <div class="field-value">${registration.branches}</div>
            </div>
            <div class="field">
              <div class="field-label">Tipo de Negocio</div>
              <div class="field-value">${registration.main_business_type}</div>
            </div>
            <div class="field">
              <div class="field-label">Usa POS/Software de Facturación</div>
              <div class="field-value">${posInfo}</div>
            </div>
            <div class="field">
              <div class="field-label">Mejoras que Busca</div>
              <div class="field-value">${improvementsList}</div>
            </div>
            <div class="field">
              <div class="field-label">Interés en Prueba Gratuita</div>
              <div class="field-value">${registration.free_trial_interest}</div>
            </div>
            <div class="field">
              <div class="field-label">Correo Electrónico</div>
              <div class="field-value"><a href="mailto:${registration.email}">${registration.email}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Teléfono / WhatsApp</div>
              <div class="field-value"><a href="https://wa.me/${registration.phone.replace(/\D/g, '')}">${registration.phone}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Fecha de Registro</div>
              <div class="field-value">${registrationDate}</div>
            </div>
          </div>
          <div class="footer">
            <p>Este correo fue generado automáticamente por el sistema de prerregistro de Conektao.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("📤 Attempting to send email via Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "Conektao <onboarding@resend.dev>",
      to: ["conektaolatam@gmail.com"],
      subject: `🚀 Nuevo registro: ${registration.name} - ${registration.business_name}`,
      html: emailHtml,
    });

    console.log("✅ Email sent successfully!");
    console.log("Email response:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error in send-prelaunch-notification:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message, name: error.name }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
