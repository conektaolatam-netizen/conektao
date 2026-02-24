import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildOrderEmailHtml(order: any, isRetry = true): string {
  const items = (order.items || []) as any[];
  const itemsHtml = items.map((it: any) => {
    const name = it.name || it.product_name || "Producto";
    const qty = it.quantity || 1;
    const price = it.price || it.unit_price || 0;
    const packaging = it.packaging_name ? ` (${it.packaging_name})` : "";
    return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${name}${packaging}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(price).toLocaleString()}</td></tr>`;
  }).join("");

  const deliveryLabel = order.delivery_type === "delivery" ? "🏍️ Domicilio" : "🏪 Recoger en tienda";
  const addressBlock = order.delivery_type === "delivery" && order.delivery_address
    ? `<p><strong>Dirección:</strong> ${order.delivery_address}</p>` : "";
  const paymentBlock = order.payment_method
    ? `<p><strong>Método de pago:</strong> ${order.payment_method}</p>` : "";
  const proofBlock = order.payment_proof_url
    ? `<p><strong>Comprobante de pago:</strong></p><img src="${order.payment_proof_url}" alt="Comprobante" style="max-width:400px;border-radius:8px;margin-top:8px"/>` : "";
  const retryBanner = isRetry
    ? `<div style="background:#FFF3CD;border:1px solid #FFECB5;border-radius:8px;padding:12px 16px;margin-top:20px;color:#664D03;font-size:14px">⚠️ <strong>[REENVÍO AUTOMÁTICO]</strong> — Este correo fue reenviado porque el envío original falló.</div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
<div style="background:white;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<h2 style="color:#E85D04;margin-top:0">🍕 Nuevo Pedido</h2>
<p><strong>Cliente:</strong> ${order.customer_name || "Sin nombre"}</p>
<p><strong>Teléfono:</strong> ${order.customer_phone || "N/A"}</p>
<p><strong>Tipo de entrega:</strong> ${deliveryLabel}</p>
${addressBlock}
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<thead><tr style="background:#f0f0f0"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Precio</th></tr></thead>
<tbody>${itemsHtml}</tbody>
</table>
<div style="text-align:right;font-size:20px;font-weight:bold;color:#E85D04;margin:16px 0">Total: $${Number(order.total_amount || 0).toLocaleString()}</div>
${paymentBlock}${proofBlock}${retryBanner}
</div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Query failed orders from last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: orders, error: queryError } = await supabase
      .from("whatsapp_orders")
      .select("*")
      .eq("email_sent", false)
      .eq("status", "confirmed")
      .gte("created_at", fourHoursAgo)
      .limit(20);

    if (queryError) {
      console.error("RETRY_QUERY_ERROR", queryError);
      return new Response(JSON.stringify({ error: "Error al consultar pedidos: " + queryError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!orders || orders.length === 0) {
      console.log("RETRY_NO_PENDING_ORDERS");
      return new Response(JSON.stringify({ processed: 0, sent: 0, skipped: 0, failed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache configs by restaurant_id
    const configCache: Record<string, string | null> = {};
    let sent = 0, skipped = 0, failed = 0;

    for (const order of orders) {
      const rid = order.restaurant_id;

      // Get order_email from cache or DB
      if (!(rid in configCache)) {
        const { data: cfg } = await supabase
          .from("whatsapp_configs")
          .select("order_email")
          .eq("restaurant_id", rid)
          .maybeSingle();
        configCache[rid] = cfg?.order_email || null;
      }

      const toEmail = configCache[rid];
      if (!toEmail) {
        console.log("RETRY_SKIP_NO_EMAIL", { order_id: order.id });
        skipped++;
        continue;
      }

      // Build and send email
      const html = buildOrderEmailHtml(order, true);
      const subject = `🍕 [REENVÍO] Pedido - ${order.customer_name || "Cliente"} - $${Number(order.total_amount || 0).toLocaleString()}`;

      try {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": brevoApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Alicia - Conektao", email: "pedidos@conektao.com" },
            to: [{ email: toEmail }],
            subject,
            htmlContent: html,
          }),
        });

        if (!brevoRes.ok) {
          const errText = await brevoRes.text();
          console.error("RETRY_FAIL", { order_id: order.id, to: toEmail, status: brevoRes.status, error: errText });
          failed++;
          continue;
        }
        await brevoRes.text(); // consume body

        // Mark as sent
        await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", order.id);
        console.log("RETRY_OK", { order_id: order.id, to: toEmail });
        sent++;
      } catch (emailErr) {
        console.error("RETRY_FAIL", { order_id: order.id, to: toEmail, error: String(emailErr) });
        failed++;
      }
    }

    const result = { processed: orders.length, sent, skipped, failed };
    console.log("RETRY_SUMMARY", result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (fatalErr) {
    console.error("RETRY_FATAL_ERROR", String(fatalErr));
    return new Response(JSON.stringify({ error: "Error fatal: " + String(fatalErr) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
