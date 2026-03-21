import { loadPrinterConfig } from './printerConfig';

export interface ComandaItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface ComandaData {
  order_id: string;           // ID corto para mostrar en la comanda
  customer_name: string;
  customer_phone?: string;
  items: ComandaItem[];
  total: number;
  delivery_type: 'pickup' | 'delivery' | string;
  delivery_address?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;         // ISO string
  source: 'whatsapp' | 'pos'; // De dónde viene el pedido
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function getDeliveryLabel(type: string): string {
  if (type === 'pickup') return 'Para recoger';
  if (type === 'delivery') return 'Domicilio';
  return type;
}

/**
 * Genera el HTML completo de una comanda, optimizado para papel térmico de 80mm
 * pero también legible en papel A4 normal.
 */
function buildComandaHTML(data: ComandaData, paperWidth: string): string {
  const isNarrow = paperWidth === '80mm' || paperWidth === '58mm';
  const widthPx = paperWidth === '58mm' ? '200px' : paperWidth === '80mm' ? '280px' : '100%';

  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 3px 0; vertical-align: top;">
          <strong>${item.quantity}x</strong>
        </td>
        <td style="padding: 3px 4px; vertical-align: top;">
          ${item.product_name}
          ${item.notes ? `<br/><em style="font-size:10px;">&nbsp;&nbsp;↳ ${item.notes}</em>` : ''}
        </td>
        <td style="padding: 3px 0; vertical-align: top; text-align: right; white-space: nowrap;">
          ${formatPrice(item.unit_price * item.quantity)}
        </td>
      </tr>`
    )
    .join('');

  const divider = `<tr><td colspan="3" style="padding: 3px 0;"><div style="border-top: 1px dashed #000; margin: 4px 0;"></div></td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Comanda ${data.order_id}</title>
  <style>
    @media print {
      @page {
        margin: 4mm;
        ${isNarrow ? `size: ${paperWidth} auto;` : ''}
      }
      body { margin: 0; }
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 8px;
      width: ${widthPx};
      max-width: ${widthPx};
      box-sizing: border-box;
    }
    h1 { font-size: 16px; font-weight: bold; text-align: center; margin: 0 0 2px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 3px double #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
    .tag-wa {
      display: inline-block;
      background: #000;
      color: #fff;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h1>*** NUEVO PEDIDO ***</h1>
  <div class="center" style="font-size:10px; margin-bottom: 4px;">
    ${data.source === 'whatsapp' ? '<span class="tag-wa">WhatsApp</span>' : '<span class="tag-wa">POS</span>'}
  </div>

  <div class="divider"></div>

  <div class="bold"># ${data.order_id}</div>
  <div>${formatTime(data.created_at)}</div>

  <div class="divider"></div>

  <div class="bold">CLIENTE: ${data.customer_name}</div>
  ${data.customer_phone ? `<div>Tel: ${data.customer_phone}</div>` : ''}
  <div>Tipo: ${getDeliveryLabel(data.delivery_type)}</div>
  ${data.delivery_address ? `<div>Dir: ${data.delivery_address}</div>` : ''}
  ${data.payment_method ? `<div>Pago: ${data.payment_method}</div>` : ''}

  <div class="divider"></div>

  <div class="bold" style="margin-bottom: 4px;">PRODUCTOS:</div>
  <table>
    <tbody>
      ${itemsHTML}
      ${divider}
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td style="text-align: right;">${formatPrice(data.total)}</td>
      </tr>
    </tbody>
  </table>

  ${data.notes ? `
  <div class="divider"></div>
  <div class="bold">NOTAS:</div>
  <div>${data.notes}</div>
  ` : ''}

  <div class="double-divider"></div>
  <div class="center" style="font-size: 10px;">conektao.com</div>
</body>
</html>`;
}

/**
 * Abre una ventana de impresión con la comanda y la envía a la impresora
 * configurada (o al diálogo de impresión si no hay ninguna configurada).
 *
 * Retorna true si la ventana se abrió correctamente.
 */
export function printComanda(data: ComandaData): boolean {
  const config = loadPrinterConfig();
  const html = buildComandaHTML(data, config.paperWidth);

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    console.error('[printComanda] No se pudo abrir ventana de impresión. Verifica que no esté bloqueada por el navegador.');
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Pequeña espera para que el navegador procese el DOM antes de imprimir
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Cerrar automáticamente después del diálogo
    printWindow.onafterprint = () => printWindow.close();
    // Fallback: cerrar si onafterprint no se dispara (Safari)
    setTimeout(() => {
      try { printWindow.close(); } catch { /* ya cerrada */ }
    }, 10000);
  };

  return true;
}

/**
 * Convierte un registro de whatsapp_orders (JSON de Supabase) a ComandaData.
 */
export function whatsappOrderToComanda(order: Record<string, unknown>): ComandaData {
  const items = (order.items as ComandaItem[] | null) ?? [];
  const rawTotal = typeof order.total === 'number' ? order.total : Number(order.total ?? 0);
  const deliveryCost = typeof order.delivery_cost === 'number' ? order.delivery_cost : 0;

  return {
    order_id: String(order.id ?? '').slice(0, 8).toUpperCase(),
    customer_name: String(order.customer_name ?? 'Cliente'),
    customer_phone: order.customer_phone ? String(order.customer_phone) : undefined,
    items: items.map((i) => ({
      product_name: i.product_name,
      quantity: Number(i.quantity ?? 1),
      unit_price: Number(i.unit_price ?? 0),
      notes: i.notes,
    })),
    total: rawTotal + deliveryCost,
    delivery_type: String(order.delivery_type ?? 'pickup'),
    delivery_address: order.delivery_address ? String(order.delivery_address) : undefined,
    payment_method: order.payment_method ? String(order.payment_method) : undefined,
    notes: order.notes ? String(order.notes) : undefined,
    created_at: String(order.created_at ?? new Date().toISOString()),
    source: 'whatsapp',
  };
}
