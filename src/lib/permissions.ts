import { 
  ShoppingCart, 
  Receipt, 
  ChefHat, 
  Package, 
  Users, 
  FileText, 
  Bell, 
  Brain, 
  Wallet,
  DollarSign,
  Utensils,
  Shield,
  Settings,
  LucideIcon
} from "lucide-react";

// Types
export interface Permission {
  key: string;
  label: string;
  description: string;
  dangerous?: boolean;
  warning?: string;
  implicit?: string[]; // Permissions that are auto-granted when this one is enabled
}

export interface ModuleDefinition {
  name: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
  permissions: Permission[];
}

export interface RolePreset {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  permissions: Record<string, string[]>;
}

// Module definitions with permissions
export const MODULE_PERMISSIONS: Record<string, ModuleDefinition> = {
  cash: {
    name: "Caja",
    icon: Wallet,
    gradient: "from-green-500 to-emerald-600",
    description: "Gestión de efectivo y transacciones",
    permissions: [
      { key: "open", label: "Abrir caja", description: "Establecer base inicial del día" },
      { key: "close", label: "Cerrar caja", description: "Realizar cierre guiado" },
      { key: "view_transactions", label: "Ver transacciones", description: "Ver movimientos del día" },
      { key: "register_payments", label: "Registrar pagos", description: "Retiros y pagos en efectivo" },
      { key: "register_income", label: "Registrar ingresos", description: "Ingresos extras en efectivo" },
      { key: "view_totals", label: "Ver totales de ventas", description: "Ver resumen financiero del día", dangerous: true, warning: "Puede ver información financiera sensible" },
      { key: "edit_opening", label: "Editar base inicial", description: "Modificar base con justificación", dangerous: true, warning: "Permite modificar la base de caja registrada" },
      { key: "upload_receipts_ai", label: "Subir facturas con IA", description: "Procesar facturas de proveedores" }
    ]
  },
  pos: {
    name: "Facturación / POS",
    icon: Receipt,
    gradient: "from-orange-500 to-pink-500",
    description: "Toma de pedidos y cobros",
    permissions: [
      { key: "take_orders", label: "Tomar pedidos", description: "Crear y editar órdenes" },
      { key: "send_kitchen", label: "Enviar a cocina", description: "Enviar comandas a preparación" },
      { key: "charge", label: "Cobrar", description: "Cerrar órdenes y procesar pagos" },
      { key: "apply_discounts", label: "Aplicar descuentos", description: "Descuentos hasta límite configurado" },
      { key: "manage_tips", label: "Gestionar propinas", description: "Registrar y distribuir propinas" },
      { key: "void_sales", label: "Anular ventas", description: "Cancelar ventas completadas", dangerous: true, warning: "Permite anular ventas ya procesadas. Genera alerta al dueño." },
      { key: "view_history", label: "Ver historial completo", description: "Ver todas las ventas del período" }
    ]
  },
  kitchen: {
    name: "Cocina",
    icon: ChefHat,
    gradient: "from-amber-500 to-orange-500",
    description: "Preparación de pedidos",
    permissions: [
      { key: "view_orders", label: "Ver comandas", description: "Ver pedidos pendientes" },
      { key: "prepare", label: "Preparar", description: "Marcar en preparación" },
      { key: "complete", label: "Completar", description: "Marcar como listo" },
      { key: "view_history", label: "Ver historial", description: "Comandas del día" },
      { key: "void_orders", label: "Anular comandas", description: "Cancelar pedidos en cocina", dangerous: true, warning: "Genera alerta al dueño. Use solo en casos justificados." }
    ]
  },
  inventory: {
    name: "Inventario",
    icon: Package,
    gradient: "from-blue-500 to-cyan-500",
    description: "Gestión de productos e insumos",
    permissions: [
      { key: "view", label: "Ver inventario", description: "Consultar stock y productos" },
      { key: "edit", label: "Editar inventario", description: "Modificar cantidades y productos" },
      { key: "create_products", label: "Crear productos", description: "Agregar nuevos productos" },
      { key: "manage_recipes", label: "Gestionar recetas", description: "Configurar ingredientes por producto" }
    ]
  },
  staff: {
    name: "Personal",
    icon: Users,
    gradient: "from-teal-500 to-cyan-600",
    description: "Gestión de empleados y nómina",
    permissions: [
      { key: "view_employees", label: "Ver empleados", description: "Lista de personal" },
      { key: "view_hours", label: "Ver horas trabajadas", description: "Control de asistencia" },
      { key: "view_payroll", label: "Ver nómina", description: "Valores de pago", dangerous: true, warning: "Acceso a información salarial confidencial" },
      { key: "close_shifts", label: "Cerrar turnos", description: "Finalizar turno de empleados" },
      { key: "manage_employees", label: "Gestionar empleados", description: "Crear, editar, eliminar empleados", dangerous: true, warning: "Control total sobre el personal. Solo para dueños." }
    ]
  },
  documents: {
    name: "Documentos",
    icon: FileText,
    gradient: "from-purple-500 to-violet-600",
    description: "Reportes y comprobantes",
    permissions: [
      { key: "view", label: "Ver documentos", description: "Consultar reportes y resúmenes" },
      { key: "view_receipts", label: "Ver comprobantes", description: "Fotos de pagos y transferencias" },
      { key: "view_auditor", label: "Auditor IA", description: "Análisis de seguridad con IA" },
      { key: "edit", label: "Editar documentos", description: "Modificar registros", dangerous: true, warning: "Permite editar datos históricos del negocio" },
      { key: "delete", label: "Eliminar documentos", description: "Borrar registros permanentemente", dangerous: true, warning: "Acción irreversible. Solo para el dueño." }
    ]
  },
  alerts: {
    name: "Alertas",
    icon: Bell,
    gradient: "from-red-500 to-rose-600",
    description: "Notificaciones de seguridad",
    permissions: [
      { key: "view", label: "Ver alertas", description: "Consultar alertas del negocio" },
      { key: "mark_read", label: "Marcar como leídas", description: "Gestionar estado de alertas" },
      { key: "delete", label: "Eliminar alertas", description: "Borrar alertas", dangerous: true, warning: "Puede ocultar eventos importantes. Solo dueño." }
    ]
  },
  ai: {
    name: "IA Conektao",
    icon: Brain,
    gradient: "from-violet-500 to-purple-600",
    description: "Asistente inteligente",
    permissions: [
      { key: "chat", label: "Chat IA", description: "Conversar con el asistente" },
      { key: "recommendations", label: "Ver recomendaciones", description: "Sugerencias diarias de IA" },
      { key: "contai", label: "ContAI", description: "Análisis contable avanzado", dangerous: true, warning: "Acceso a información financiera detallada" }
    ]
  },
  marketplace: {
    name: "Marketplace",
    icon: ShoppingCart,
    gradient: "from-indigo-500 to-purple-600",
    description: "Compras a proveedores",
    permissions: [
      { key: "view", label: "Ver catálogo", description: "Explorar productos de proveedores" },
      { key: "buy", label: "Comprar", description: "Realizar pedidos a proveedores" }
    ]
  }
};

// Role presets with default permissions
export const ROLE_PRESETS: Record<string, RolePreset> = {
  cashier: {
    name: "Cajero",
    description: "Opera la caja, cobra y gestiona transacciones",
    icon: DollarSign,
    color: "green",
    permissions: {
      cash: ["open", "close", "view_transactions", "register_payments", "register_income", "upload_receipts_ai"],
      pos: ["take_orders", "send_kitchen", "charge", "apply_discounts", "manage_tips"],
      inventory: ["view"]
    }
  },
  waiter: {
    name: "Mesero",
    description: "Atiende mesas y toma pedidos. No cobra.",
    icon: Utensils,
    color: "blue",
    permissions: {
      pos: ["take_orders", "send_kitchen"],
      kitchen: ["view_orders"]
    }
  },
  kitchen: {
    name: "Cocina",
    description: "Prepara pedidos y gestiona comandas",
    icon: ChefHat,
    color: "orange",
    permissions: {
      kitchen: ["view_orders", "prepare", "complete", "view_history"]
    }
  },
  admin: {
    name: "Administrador",
    description: "Gestión completa excepto acciones destructivas",
    icon: Shield,
    color: "purple",
    permissions: {
      cash: ["open", "close", "view_transactions", "register_payments", "register_income", "view_totals", "edit_opening", "upload_receipts_ai"],
      pos: ["take_orders", "send_kitchen", "charge", "apply_discounts", "manage_tips", "void_sales", "view_history"],
      kitchen: ["view_orders", "prepare", "complete", "view_history", "void_orders"],
      inventory: ["view", "edit", "create_products", "manage_recipes"],
      staff: ["view_employees", "view_hours", "view_payroll", "close_shifts"],
      documents: ["view", "view_receipts", "view_auditor"],
      alerts: ["view"],
      ai: ["chat", "recommendations"],
      marketplace: ["view", "buy"]
    }
  },
  custom: {
    name: "Personalizado",
    description: "Configura permisos manualmente",
    icon: Settings,
    color: "gray",
    permissions: {}
  }
};

// Helper function to get all permissions for a role preset
export function getPresetPermissions(presetKey: string): Record<string, string[]> {
  return ROLE_PRESETS[presetKey]?.permissions || {};
}

// Helper function to check if a permission is dangerous
export function isPermissionDangerous(moduleKey: string, permissionKey: string): boolean {
  const module = MODULE_PERMISSIONS[moduleKey];
  if (!module) return false;
  const permission = module.permissions.find(p => p.key === permissionKey);
  return permission?.dangerous || false;
}

// Helper function to get permission warning
export function getPermissionWarning(moduleKey: string, permissionKey: string): string | undefined {
  const module = MODULE_PERMISSIONS[moduleKey];
  if (!module) return undefined;
  const permission = module.permissions.find(p => p.key === permissionKey);
  return permission?.warning;
}

// Helper function to check if user has permission (frontend-only check)
export function hasPermission(
  permissions: Record<string, string[]> | null | undefined,
  moduleKey: string,
  permissionKey: string,
  userRole?: string
): boolean {
  // Owner always has all permissions
  if (userRole === 'owner') return true;
  
  if (!permissions) return false;
  
  const modulePermissions = permissions[moduleKey];
  if (!modulePermissions) return false;
  
  return modulePermissions.includes(permissionKey);
}

// Convert from flat permission object (old format) to new format
export function convertLegacyPermissions(legacyPermissions: Record<string, boolean>): Record<string, string[]> {
  const newPermissions: Record<string, string[]> = {};
  
  // Map legacy permission keys to new module/permission structure
  const legacyMap: Record<string, { module: string; permission: string }> = {
    access_supplier_marketplace: { module: 'marketplace', permission: 'buy' },
    add_products_to_order: { module: 'pos', permission: 'take_orders' },
    process_payments: { module: 'pos', permission: 'charge' },
    upload_receipts_with_ai: { module: 'cash', permission: 'upload_receipts_ai' },
    view_inventory: { module: 'inventory', permission: 'view' },
    edit_inventory: { module: 'inventory', permission: 'edit' },
    view_employee_hours: { module: 'staff', permission: 'view_hours' },
    view_payroll_values: { module: 'staff', permission: 'view_payroll' },
    edit_time_records: { module: 'staff', permission: 'close_shifts' },
    view_documents: { module: 'documents', permission: 'view' },
    access_ai: { module: 'ai', permission: 'chat' },
    view_sales: { module: 'cash', permission: 'view_totals' },
    view_reports: { module: 'documents', permission: 'view' },
    manage_products: { module: 'inventory', permission: 'create_products' },
    view_employees: { module: 'staff', permission: 'view_employees' },
    access_pos: { module: 'pos', permission: 'take_orders' },
    manage_cash: { module: 'cash', permission: 'view_transactions' },
    access_kitchen: { module: 'kitchen', permission: 'view_orders' },
    manage_kitchen_orders: { module: 'kitchen', permission: 'prepare' }
  };
  
  Object.entries(legacyPermissions).forEach(([key, value]) => {
    if (value && legacyMap[key]) {
      const { module, permission } = legacyMap[key];
      if (!newPermissions[module]) {
        newPermissions[module] = [];
      }
      if (!newPermissions[module].includes(permission)) {
        newPermissions[module].push(permission);
      }
    }
  });
  
  return newPermissions;
}

// Salary frequency options
export const SALARY_FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'weekly', label: 'Semanal' }
];

// Bonus types
export const BONUS_TYPES = [
  { value: 'percentage_sales', label: '% de ventas' },
  { value: 'fixed_per_shift', label: 'Fijo por turno' },
  { value: 'goal_based', label: 'Por metas' },
  { value: 'tip_based', label: 'Por propinas' },
  { value: 'product_based', label: 'Por producto' },
  { value: 'mixed', label: 'Mixto' }
];

// Bonus frequencies
export const BONUS_FREQUENCIES = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' }
];
