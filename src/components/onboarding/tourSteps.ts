export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string | null;
  position: 'center' | 'left' | 'right';
}

export const tourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Tu Centro de Control',
    description: 'Bienvenido a Conektao 🚀 Aquí ves el estado real de tu negocio, en tiempo real. Todo lo que pasa en ventas, caja e inventario se refleja aquí. Las alertas te muestran lo que necesita tu atención.',
    targetSelector: '[data-tour="dashboard"]',
    position: 'center',
  },
  {
    id: 'marketplace',
    title: 'Marketplace de Proveedores',
    description: 'Este es tu mercado de proveedores. Comprar aquí ahorra dinero y errores, porque el inventario se actualiza automáticamente. Accede a descuentos especiales y microcréditos para tu negocio.',
    targetSelector: '[data-tour="marketplace"]',
    position: 'center',
  },
  {
    id: 'pos',
    title: 'Facturación / POS',
    description: 'Aquí se crean las órdenes. Una mesa no puede cobrarse sin enviar comanda a cocina. El sistema te guía para evitar errores que afectan tu caja.',
    targetSelector: '[data-tour="pos"]',
    position: 'center',
  },
  {
    id: 'caja',
    title: 'Gestión de Caja',
    description: 'Caja no es solo efectivo. Aquí se refleja TODO lo que entra y sale del negocio. Cada edición queda registrada para tu protección.',
    targetSelector: '[data-tour="cash"]',
    position: 'center',
  },
  {
    id: 'facturas-ia',
    title: 'Facturas IA (Proveedores)',
    description: 'Toma foto de la factura de tu proveedor → La IA lee los productos → Tú confirmas → El inventario se actualiza → Se registra el pago → Todo queda guardado. Si la factura es escrita a mano, no pasa nada. La guardamos, tú ingresas los datos y AuditorIA la revisa.',
    targetSelector: '[data-tour="receipts"]',
    position: 'center',
  },
  {
    id: 'inventarios',
    title: 'Control de Inventarios',
    description: 'No todo afecta recetas. Algunos productos se registran como inventario operativo, no de producción. El sistema descuenta automáticamente por ventas y solo te pide confirmar cuando detecta algo extraño.',
    targetSelector: '[data-tour="inventory"]',
    position: 'center',
  },
  {
    id: 'cocina',
    title: 'Pantalla de Cocina',
    description: 'Las comandas llegan digitalmente. Estados: pendiente → en proceso → listo. Cuando cocina marca un pedido como listo, el mesero recibe notificación automáticamente.',
    targetSelector: '[data-tour="kitchen"]',
    position: 'center',
  },
  {
    id: 'documentos-auditoria',
    title: 'Documentos y Auditoría',
    description: 'Aquí queda el historial real del negocio. No es castigo, es control inteligente. Nada se borra, todo es trazable. Tu protección como dueño.',
    targetSelector: '[data-tour="documents"]',
    position: 'center',
  },
  {
    id: 'alicia-intro',
    title: 'Soy AlicIA 🤍',
    description: 'Estoy aquí para ayudarte a operar mejor tu negocio, siempre. Pregúntame lo que necesites sobre ventas, inventario, empleados o cualquier duda. Puedes hablarme cuando quieras.',
    targetSelector: null,
    position: 'center',
  },
];
