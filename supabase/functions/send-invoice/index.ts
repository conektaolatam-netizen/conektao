import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  customerEmail: string;
  customerName: string;
  restaurantName: string;
  invoiceNumber: string;
  date: string;
  time: string;
  items: InvoiceItem[];
  subtotal: number;
  service: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

const generateInvoiceHTML = (data: InvoiceData): string => {
  // Los precios ya incluyen el impoconsumo, no se debe sumar adicional
  const impoconsumo = 0; // No calcular impoconsumo adicional
  const totalConImpoconsumo = data.total; // Usar el total que ya viene calculado

  const itemsHTML = data.items.map(item => `
    <tr style="border-bottom: 1px solid rgba(255,145,0,0.15);">
      <td style="padding: 15px 0; color: #374151; font-size: 14px; font-weight: 500;">${item.name}</td>
      <td style="padding: 15px 0; color: #374151; text-align: center; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 15px 0; color: #374151; text-align: right; font-size: 14px;">$${item.price.toLocaleString()}</td>
      <td style="padding: 15px 0; color: #FF7A00; text-align: right; font-weight: 700; font-size: 14px;">$${item.total.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Factura Digital - ${data.restaurantName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: linear-gradient(135deg, 
            #f8fafc 0%, 
            #e2f8ff 20%, 
            #fff5e6 40%, 
            #e2f8ff 60%, 
            #fff5e6 80%, 
            #f8fafc 100%
          );
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        
        .invoice-container {
          max-width: 700px;
          margin: 0 auto;
          background: linear-gradient(145deg, 
            rgba(255,255,255,0.95) 0%, 
            rgba(248,250,252,0.98) 25%, 
            rgba(255,255,255,0.95) 50%, 
            rgba(248,250,252,0.98) 75%, 
            rgba(255,255,255,0.95) 100%
          );
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 32px 64px rgba(255,145,0,0.12),
            0 16px 32px rgba(0,212,255,0.08),
            0 8px 16px rgba(0,0,0,0.04),
            0 0 0 1px rgba(255,145,0,0.1);
          position: relative;
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255,145,0,0.15);
        }
        
        .invoice-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, 
            #FF9100 0%, 
            #FFB347 25%, 
            #00D4FF 50%, 
            #4FC3F7 75%, 
            #FF9100 100%
          );
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: -200% 0; }
          50% { background-position: 200% 0; }
        }
        
        .header {
          background: linear-gradient(135deg, 
            #FF9100 0%, 
            #FFB347 30%, 
            #00D4FF 70%, 
            #4FC3F7 100%
          );
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: pulse 6s ease-in-out infinite;
        }
        
        .header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)"/><line x1="2" y1="2" x2="18" y2="2" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><line x1="2" y1="2" x2="2" y2="18" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23circuit)"/></svg>') opacity(0.3);
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.2; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.4; }
        }
        
        .logo {
          font-size: 48px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          text-shadow: 0 4px 8px rgba(0,0,0,0.4);
          position: relative;
          z-index: 3;
          letter-spacing: 2px;
        }
        
        .tagline {
          font-size: 18px;
          color: rgba(255,255,255,0.95);
          font-weight: 400;
          position: relative;
          z-index: 3;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .brand-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          font-weight: 600;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 3px;
          position: relative;
          z-index: 3;
        }
        
        .invoice-header {
          padding: 40px 30px 30px;
          background: linear-gradient(135deg, rgba(255,145,0,0.08), rgba(0,212,255,0.08));
          border-bottom: 2px solid rgba(255,145,0,0.2);
          position: relative;
        }
        
        .invoice-info {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 25px;
        }
        
        .info-block {
          flex: 1;
          min-width: 200px;
          background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.9));
          padding: 20px;
          border-radius: 16px;
          border: 2px solid rgba(0,212,255,0.15);
          box-shadow: 0 8px 16px rgba(0,212,255,0.08);
        }
        
        .info-title {
          font-size: 12px;
          color: #0066CC;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .info-content {
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
        }
        
        .restaurant-name {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #FF7A00, #FF9100, #0099CC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #FF7A00, #0099CC);
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 10px auto;
          box-shadow: 0 6px 20px rgba(255,122,0,0.25);
        }
        
        .items-section {
          padding: 0 30px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #FF7A00, #0099CC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 40px 0 25px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(248,250,252,0.8));
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .table-header {
          background: linear-gradient(135deg, rgba(255,122,0,0.15), rgba(0,153,204,0.15));
        }
        
        .table-header th {
          padding: 18px 0;
          color: #1a1a1a;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 1px;
        }
        
        .totals-section {
          background: linear-gradient(135deg, rgba(255,122,0,0.08), rgba(0,153,204,0.08));
          padding: 35px 30px;
          border-top: 3px solid rgba(255,122,0,0.3);
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255,122,0,0.15);
        }
        
        .total-row:last-child {
          border-bottom: none;
          padding-top: 25px;
          margin-top: 20px;
          border-top: 3px solid #FF7A00;
          background: linear-gradient(135deg, rgba(255,122,0,0.1), rgba(0,153,204,0.1));
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(255,122,0,0.15);
        }
        
        .total-label {
          font-size: 15px;
          color: #374151;
          font-weight: 600;
        }
        
        .total-value {
          font-size: 15px;
          color: #1a1a1a;
          font-weight: 700;
        }
        
        .final-total .total-label {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #FF7A00, #0099CC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .final-total .total-value {
          font-size: 28px;
          font-weight: 800;
          color: #FF7A00;
          text-shadow: 0 2px 4px rgba(255,122,0,0.2);
        }
        
        .payment-info {
          background: linear-gradient(135deg, rgba(255,122,0,0.12), rgba(0,153,204,0.12));
          padding: 25px;
          margin: 25px 0;
          border-radius: 16px;
          border: 2px solid rgba(255,122,0,0.25);
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(255,122,0,0.15);
        }
        
        .payment-info::before {
          content: '✓';
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 24px;
          color: #0099CC;
          font-weight: bold;
        }
        
        .footer {
          background: linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.8));
          padding: 40px 30px;
          text-align: center;
          border-top: 2px solid rgba(255,122,0,0.2);
          position: relative;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .powered-by {
          font-size: 16px;
          font-weight: 700;
          background: linear-gradient(135deg, #FF7A00, #0099CC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }
        
        .ai-message {
          font-size: 13px;
          color: #0099CC;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .tech-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 85%, rgba(255,122,0,0.06) 0%, transparent 50%),
            radial-gradient(circle at 75% 15%, rgba(0,153,204,0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255,122,0,0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        
        @media (max-width: 600px) {
          .invoice-info {
            flex-direction: column;
          }
          
          .logo {
            font-size: 36px;
          }
          
          .restaurant-name {
            font-size: 22px;
          }
          
          .items-table {
            font-size: 12px;
          }
          
          .table-header th,
          .items-table td {
            padding: 10px 5px;
          }
          
          .final-total .total-label {
            font-size: 18px;
          }
          
          .final-total .total-value {
            font-size: 22px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="tech-elements"></div>
        
        <div class="header">
          <div class="logo">CONEKTAO</div>
          <div class="tagline">Control Total de tu Negocio por medio de IA</div>
          <div class="brand-subtitle">Tecnología • Inteligencia • Futuro</div>
        </div>
        
        <div class="invoice-header">
          <div class="restaurant-name">${data.restaurantName}</div>
          <div class="ai-badge">
            🤖 Gestionado con IA Avanzada
          </div>
          <div class="invoice-info">
            <div class="info-block">
              <div class="info-title">Cliente</div>
              <div class="info-content">${data.customerName}</div>
            </div>
            <div class="info-block">
              <div class="info-title">Factura Digital #</div>
              <div class="info-content">${data.invoiceNumber}</div>
            </div>
            <div class="info-block">
              <div class="info-title">Fecha & Hora</div>
              <div class="info-content">${data.date} • ${data.time}</div>
            </div>
          </div>
        </div>
        
        <div class="items-section">
          <div class="section-title">🛍️ Detalles de tu Compra</div>
          <table class="items-table">
            <thead class="table-header">
              <tr>
                <th style="text-align: left;">Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>
        
        <div class="totals-section">
          <div class="total-row">
            <div class="total-label">Subtotal</div>
            <div class="total-value">$${data.subtotal.toLocaleString()}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Impoconsumo</div>
            <div class="total-value">Incluido en precios</div>
          </div>
          <div class="total-row final-total">
            <div class="total-label">Total a Pagar</div>
            <div class="total-value">$${totalConImpoconsumo.toLocaleString()}</div>
          </div>
          
          <div class="payment-info">
            <div class="info-title">✅ Método de Pago</div>
            <div class="info-content">${data.paymentMethod}</div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">
            🌟 Gracias por confiar en nosotros. Esta factura digital ha sido generada automáticamente<br>
            por nuestro sistema de IA avanzada para brindarte la mejor experiencia.
          </div>
          <div class="powered-by">
            Powered by CONEKTAO
          </div>
          <div class="ai-message">
            🚀 El Futuro de la Gestión Empresarial está Aquí
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 send-invoice function called");
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Starting invoice email processing...");
    
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    console.log("✅ RESEND_API_KEY found");

    const requestBody = await req.text();
    console.log("📝 Request body received:", requestBody);
    
    let invoiceData: InvoiceData;
    try {
      invoiceData = JSON.parse(requestBody);
      console.log("✅ Invoice data parsed successfully");
      console.log("👤 Customer email:", invoiceData.customerEmail);
      console.log("🏪 Restaurant name:", invoiceData.restaurantName);
      console.log("📄 Invoice number:", invoiceData.invoiceNumber);
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      throw new Error("Invalid JSON in request body");
    }

    // Validate required fields
    if (!invoiceData.customerEmail) {
      console.error("❌ Missing customer email");
      throw new Error("Customer email is required");
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      console.error("❌ Missing invoice items");
      throw new Error("Invoice items are required");
    }

    console.log("🎨 Generating email HTML...");
    const emailHTML = generateInvoiceHTML(invoiceData);
    console.log("✅ Email HTML generated successfully");

    console.log("📨 Attempting to send email via Resend...");
    const emailResponse = await resend.emails.send({
      from: "Conektao <noreply@resend.dev>", // Using resend.dev domain for testing
      to: [invoiceData.customerEmail],
      subject: `✨ Tu factura de ${invoiceData.restaurantName} - #${invoiceData.invoiceNumber}`,
      html: emailHTML,
    });

    console.log("📧 Resend response:", emailResponse);

    if (emailResponse.error) {
      console.error("❌ Resend error:", emailResponse.error);
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    console.log("🎉 Email sent successfully!");
    console.log("📧 Email ID:", emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Factura enviada exitosamente",
      emailId: emailResponse.data?.id,
      recipientEmail: invoiceData.customerEmail
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 CRITICAL ERROR in send-invoice function:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.stack || "No stack trace available"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);