import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, plan } = await req.json();

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Nombre y teléfono son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY no configurada");

    const planLabel = plan === "enterprise" ? "Enterprise (Multi-sucursal)" : "Plan ALICIA ($450.000 COP/mes)";

    const emailBody = {
      sender: { name: "ALICIA — Conektao", email: "pedidos@conektao.com" },
      to: [{ email: "conektaolatam@gmail.com", name: "Conektao Ventas" }],
      subject: `🚀 Nuevo lead ALICIA — ${name}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f97316, #14b8a6); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: white;">¡Nuevo Lead ALICIA! 🤖</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; color: white;">Alguien quiere contratar a ALICIA</p>
          </div>
          <div style="padding: 32px;">
            <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid #f97316/30;">
              <h2 style="margin: 0 0 16px; color: #f97316; font-size: 18px;">📋 Datos del cliente</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Nombre</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 16px; font-weight: bold;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">Teléfono</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 16px; font-weight: bold;">
                    <a href="https://wa.me/57${phone.replace(/\D/g, '')}" style="color: #14b8a6; text-decoration: none;">📱 ${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">Plan</td>
                  <td style="padding: 8px 0; color: #f97316; font-size: 16px; font-weight: bold;">${planLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; font-size: 14px;">Fecha</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}</td>
                </tr>
              </table>
            </div>
            <div style="text-align: center;">
              <a href="https://wa.me/57${phone.replace(/\D/g, '')}" 
                 style="display: inline-block; background: linear-gradient(135deg, #25d366, #128c7e); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                💬 Contactar por WhatsApp
              </a>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #111; text-align: center; color: #555; font-size: 12px;">
            Lead recibido via conektao.com/alicia · Conektao © 2025
          </div>
        </div>
      `,
    };

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!brevoRes.ok) {
      const errorText = await brevoRes.text();
      throw new Error(`Brevo error: ${brevoRes.status} — ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("alicia-contact-lead error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
