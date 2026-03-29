import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrelaunchRegistration {
  name?: string;
  business_name?: string;
  city?: string;
  branches?: string;
  main_business_type?: string;
  pos_uses?: boolean;
  pos_name?: string;
  improvements_wanted?: string[];
  free_trial_interest?: string;
  email?: string;
  phone?: string;
  necesidad_principal?: string;
  completo_flujo?: boolean;
  created_at?: string;
}

const NEED_LABELS: Record<string, string> = {
  mejorar_domicilios: "🛵 Mejorar la atención y gestión de domicilios",
  reducir_comisiones: "💸 Dejar de pagar tanto en comisiones a plataformas de delivery",
  usar_datos_ventas: "📊 Entender mis ventas y tomar mejores decisiones con datos",
  no_respondió: "No respondió",
};

function isRealValue(v: unknown): v is string {
  if (v === null || v === undefined) return false;
  if (typeof v !== "string") return false;
  const trimmed = v.trim();
  if (trimmed === "") return false;
  const fakes = ["por definir", "1"];
  if (fakes.includes(trimmed.toLowerCase())) return false;
  if (trimmed.endsWith("@pendiente.com")) return false;
  return true;
}

function buildField(label: string, value: string, isLink?: { href: string }): string {
  const displayValue = isLink
    ? `<a href="${isLink.href}">${value}</a>`
    : value;
  return `
    <div class="field">
      <div class="field-label">${label}</div>
      <div class="field-value">${displayValue}</div>
    </div>`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== SEND PRELAUNCH NOTIFICATION CALLED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const registration: PrelaunchRegistration = await req.json();
    console.log("📧 New registration received:", JSON.stringify(registration));

    const fields: string[] = [];

    if (isRealValue(registration.name)) {
      fields.push(buildField("Nombre", registration.name));
    }
    if (isRealValue(registration.business_name)) {
      fields.push(buildField("Nombre del Negocio", registration.business_name));
    }
    if (isRealValue(registration.city)) {
      fields.push(buildField("Ciudad", registration.city));
    }
    if (isRealValue(registration.branches)) {
      fields.push(buildField("Sucursales", registration.branches));
    }
    if (isRealValue(registration.main_business_type)) {
      fields.push(buildField("Tipo de Negocio", registration.main_business_type));
    }
    if (registration.pos_uses !== undefined) {
      const posInfo = registration.pos_uses
        ? `Sí - ${registration.pos_name || "No especificado"}`
        : "No";
      fields.push(buildField("Usa POS/Software de Facturación", posInfo));
    }
    if (registration.improvements_wanted && registration.improvements_wanted.length > 0) {
      fields.push(buildField("Mejoras que Busca", registration.improvements_wanted.join(", ")));
    }
    if (isRealValue(registration.free_trial_interest)) {
      fields.push(buildField("Interés en Prueba Gratuita", registration.free_trial_interest));
    }
    if (isRealValue(registration.email)) {
      fields.push(buildField("Correo Electrónico", registration.email, {
        href: `mailto:${registration.email}`,
      }));
    }
    if (isRealValue(registration.phone)) {
      const cleanPhone = registration.phone.replace(/\D/g, "");
      const waPhone = cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`;
      fields.push(buildField("WhatsApp", registration.phone, {
        href: `https://wa.me/${waPhone}`,
      }));
    }

    // Necesidad principal
    if (isRealValue(registration.necesidad_principal)) {
      const label = NEED_LABELS[registration.necesidad_principal] || registration.necesidad_principal;
      fields.push(buildField("Necesidad Principal", label));
    } else if (registration.completo_flujo === false) {
      // Step 1 only — hasn't reached step 2 yet
    }

    // Completó el flujo
    if (registration.completo_flujo !== undefined) {
      fields.push(buildField("Completó el Flujo", registration.completo_flujo ? "Sí ✅" : "No (solo paso 1)"));
    }

    const registrationDate = registration.created_at
      ? new Date(registration.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota" })
      : new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
    fields.push(buildField("Fecha de Registro", registrationDate));

    const subjectParts = [registration.name].filter(isRealValue);
    if (isRealValue(registration.business_name)) {
      subjectParts.push(registration.business_name);
    }
    const subjectSuffix = subjectParts.length > 0 ? subjectParts.join(" - ") : "Nuevo lead";

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
            ${fields.join("\n")}
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
      subject: `🚀 Nuevo registro: ${subjectSuffix}`,
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
