export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string | null;
  position: 'center' | 'left' | 'right';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido a Conektao',
    description: '¡Hola! Soy AliciIA, tu asistente virtual. Te voy a guiar por todas las funciones de Conektao para que puedas sacarle el máximo provecho a tu negocio. Puedes interrumpirme en cualquier momento si tienes alguna pregunta.',
    targetSelector: null,
    position: 'center',
  },
  {
    id: 'sidebar',
    title: 'Menú de navegación',
    description: 'Aquí tienes el menú principal. Desde aquí puedes acceder a todas las secciones: ventas, productos, inventario, empleados, reportes y mucho más.',
    targetSelector: '[data-tour="sidebar"]',
    position: 'right',
  },
  {
    id: 'pos',
    title: 'Sistema de ventas',
    description: 'Esta es tu caja registradora digital. Aquí puedes registrar ventas, seleccionar productos, aplicar descuentos y procesar pagos de forma rápida y sencilla.',
    targetSelector: '[data-tour="pos"]',
    position: 'center',
  },
  {
    id: 'products',
    title: 'Gestión de productos',
    description: 'Administra tu catálogo de productos. Puedes agregar nuevos productos, editar precios, organizar por categorías y subir fotos.',
    targetSelector: '[data-tour="products"]',
    position: 'center',
  },
  {
    id: 'inventory',
    title: 'Control de inventario',
    description: 'Lleva el control de tu inventario en tiempo real. El sistema te alerta cuando un producto está por agotarse.',
    targetSelector: '[data-tour="inventory"]',
    position: 'center',
  },
  {
    id: 'employees',
    title: 'Gestión de empleados',
    description: 'Administra tu equipo de trabajo. Control de horarios, cálculo de nómina y seguimiento de asistencia.',
    targetSelector: '[data-tour="employees"]',
    position: 'center',
  },
  {
    id: 'reports',
    title: 'Reportes y análisis',
    description: 'Visualiza reportes detallados de ventas, ganancias y tendencias. Toma decisiones basadas en datos reales.',
    targetSelector: '[data-tour="reports"]',
    position: 'center',
  },
  {
    id: 'ai-assistant',
    title: 'Asistente con IA',
    description: 'Yo, AliciIA, estoy aquí para ayudarte siempre. Pregúntame sobre tus ventas, recomendaciones, o cualquier duda que tengas sobre tu negocio.',
    targetSelector: '[data-tour="ai-assistant"]',
    position: 'center',
  },
  {
    id: 'finish',
    title: '¡Listo para comenzar!',
    description: '¡Eso es todo por ahora! Ya conoces las funciones principales de Conektao. Recuerda que puedes llamarme cuando quieras haciendo clic en el botón de asistente. ¡Éxito con tu negocio!',
    targetSelector: null,
    position: 'center',
  },
];
