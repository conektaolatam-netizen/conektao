import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  restaurantName: string;
  inviterName: string;
  role: string;
  token: string;
  siteUrl?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, restaurantName, inviterName, role, token, siteUrl }: InvitationRequest = await req.json();

    const baseUrl = (siteUrl?.replace(/\/$/, '')) || (Deno.env.get('SITE_URL')?.replace(/\/$/, '')) || (Deno.env.get('SUPABASE_URL') ?? '').replace('/rest/v1', '');
    const invitationUrl = `${baseUrl}/invitation?token=${token}`;

    const roleLabel = role === 'employee' ? 'Empleado' : role === 'admin' ? 'Administrador' : 'Gerente';
    const fromAddress = Deno.env.get("INVITATION_FROM_EMAIL") || "Conektao <onboarding@resend.dev>";
    console.log("Composed invitation email:", { to: email, restaurantName, inviterName, role, roleLabel, invitationUrl, fromAddress });

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `Invitación para unirte a ${restaurantName} en Conektao`,
      text: `¡Has sido invitado a unirte a ${restaurantName} en Conektao!\n\nInvitado por: ${inviterName}\nRol: ${roleLabel}\n\nAcepta la invitación aquí: ${invitationUrl}\n\nEste enlace expira en 7 días. Si no puedes hacer clic en el enlace, copia y pégalo en tu navegador.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">🏢 Conektao</h1>
            <h2 style="color: #374151; margin: 0;">¡Has sido invitado!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h3 style="color: white; margin: 0 0 15px 0; font-size: 24px;">
              ${inviterName} te ha invitado a unirte a
            </h3>
            <h2 style="color: white; margin: 0 0 15px 0; font-size: 28px; font-weight: bold;">
              ${restaurantName}
            </h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
              Rol: <strong>${role === 'employee' ? 'Empleado' : role === 'admin' ? 'Administrador' : 'Gerente'}</strong>
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${invitationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✅ Aceptar Invitación
            </a>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #374151; margin: 0 0 15px 0;">Con Conektao podrás:</h4>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
              <li>📊 Gestionar inventario y productos</li>
              <li>💰 Procesar ventas y facturación</li>
              <li>👥 Colaborar con tu equipo</li>
              <li>🤖 Usar IA para optimizar operaciones</li>
              <li>📈 Ver reportes en tiempo real</li>
            </ul>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Esta invitación expira en 7 días. Si no puedes hacer clic en el botón, 
              copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
              ${invitationUrl}
            </p>
          </div>
        </div>
      `,
    });


    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);