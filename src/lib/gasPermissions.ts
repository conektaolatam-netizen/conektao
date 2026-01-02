// GAS-specific roles and permissions
export type GasRole = 'gerencia_gas' | 'logistica_gas' | 'cartera_gas' | 'conductor_gas' | 'cliente_gas';

export interface GasPermissions {
  // Dashboard access
  viewDashboard: boolean;
  viewFullKpis: boolean;
  
  // Inventory
  viewInventory: boolean;
  manageInventory: boolean;
  
  // Routes
  viewRoutes: boolean;
  createRoutes: boolean;
  assignRoutes: boolean;
  executeDeliveries: boolean;
  
  // Deliveries
  viewAllDeliveries: boolean;
  viewOwnDeliveries: boolean;
  
  // Payments & AR
  viewPayments: boolean;
  registerPayments: boolean;
  reconcilePayments: boolean;
  
  // Clients
  viewClients: boolean;
  manageClients: boolean;
  
  // Anomalies
  viewAnomalies: boolean;
  resolveAnomalies: boolean;
  
  // Prices
  viewPrices: boolean;
  managePrices: boolean;
  
  // Orders
  viewOrders: boolean;
  createOrders: boolean;
}

export const GAS_ROLE_PERMISSIONS: Record<GasRole, GasPermissions> = {
  gerencia_gas: {
    viewDashboard: true,
    viewFullKpis: true,
    viewInventory: true,
    manageInventory: true,
    viewRoutes: true,
    createRoutes: true,
    assignRoutes: true,
    executeDeliveries: false,
    viewAllDeliveries: true,
    viewOwnDeliveries: true,
    viewPayments: true,
    registerPayments: true,
    reconcilePayments: true,
    viewClients: true,
    manageClients: true,
    viewAnomalies: true,
    resolveAnomalies: true,
    viewPrices: true,
    managePrices: true,
    viewOrders: true,
    createOrders: true,
  },
  logistica_gas: {
    viewDashboard: true,
    viewFullKpis: false,
    viewInventory: true,
    manageInventory: true,
    viewRoutes: true,
    createRoutes: true,
    assignRoutes: true,
    executeDeliveries: false,
    viewAllDeliveries: true,
    viewOwnDeliveries: true,
    viewPayments: false,
    registerPayments: false,
    reconcilePayments: false,
    viewClients: true,
    manageClients: false,
    viewAnomalies: true,
    resolveAnomalies: false,
    viewPrices: true,
    managePrices: false,
    viewOrders: true,
    createOrders: false,
  },
  cartera_gas: {
    viewDashboard: true,
    viewFullKpis: false,
    viewInventory: false,
    manageInventory: false,
    viewRoutes: false,
    createRoutes: false,
    assignRoutes: false,
    executeDeliveries: false,
    viewAllDeliveries: true,
    viewOwnDeliveries: true,
    viewPayments: true,
    registerPayments: true,
    reconcilePayments: true,
    viewClients: true,
    manageClients: false,
    viewAnomalies: true,
    resolveAnomalies: false,
    viewPrices: true,
    managePrices: false,
    viewOrders: false,
    createOrders: false,
  },
  conductor_gas: {
    viewDashboard: false,
    viewFullKpis: false,
    viewInventory: false,
    manageInventory: false,
    viewRoutes: false,
    createRoutes: false,
    assignRoutes: false,
    executeDeliveries: true,
    viewAllDeliveries: false,
    viewOwnDeliveries: true,
    viewPayments: false,
    registerPayments: false,
    reconcilePayments: false,
    viewClients: false,
    manageClients: false,
    viewAnomalies: false,
    resolveAnomalies: false,
    viewPrices: false,
    managePrices: false,
    viewOrders: false,
    createOrders: false,
  },
  cliente_gas: {
    viewDashboard: false,
    viewFullKpis: false,
    viewInventory: false,
    manageInventory: false,
    viewRoutes: false,
    createRoutes: false,
    assignRoutes: false,
    executeDeliveries: false,
    viewAllDeliveries: false,
    viewOwnDeliveries: false,
    viewPayments: false,
    registerPayments: false,
    reconcilePayments: false,
    viewClients: false,
    manageClients: false,
    viewAnomalies: false,
    resolveAnomalies: false,
    viewPrices: false,
    managePrices: false,
    viewOrders: true,
    createOrders: true,
  },
};

export const getGasPermissions = (role: string): GasPermissions => {
  // Map standard roles to gas roles for owners/admins
  if (role === 'owner' || role === 'admin') {
    return GAS_ROLE_PERMISSIONS.gerencia_gas;
  }
  
  // Check if it's a specific gas role
  if (role in GAS_ROLE_PERMISSIONS) {
    return GAS_ROLE_PERMISSIONS[role as GasRole];
  }
  
  // Default to conductor permissions for employees
  return GAS_ROLE_PERMISSIONS.conductor_gas;
};

export const getGasRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    gerencia_gas: 'Gerencia',
    logistica_gas: 'Logística',
    cartera_gas: 'Cartera',
    conductor_gas: 'Conductor',
    cliente_gas: 'Cliente',
    owner: 'Gerencia',
    admin: 'Gerencia',
  };
  return labels[role] || 'Usuario';
};
