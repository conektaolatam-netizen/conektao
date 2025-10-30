import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Types
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  sold: number;
  icon?: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  hourlyRate: number;
  weeklyHours: number;
  overtimeHours: number;
  hoursWorked: number;
  bonuses: number;
  salesBonus: number;
  status: string;
  startDate: string;
  lastAttendance?: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  status: string;
  relatedTo?: string;
}

interface Sale {
  id: string;
  products: { productId: number; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  table?: number;
  date: string;
  status: string;
}

interface Invoice {
  id: string;
  clientName: string;
  items: { description: string; quantity: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  status: string;
  paymentMethod: string;
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: string;
}

interface AppState {
  // Business Info
  userData: any;
  
  // Inventory
  products: Product[];
  
  // HR
  employees: Employee[];
  
  // Financial
  transactions: Transaction[];
  sales: Sale[];
  invoices: Invoice[];
  
  // Cash Register
  cashRegister: {
    openingBalance: number;
    currentBalance: number;
    expectedBalance: number;
    cardSales: number;
    expenses: number;
  };
  
  // Analytics
  analytics: {
    dailySales: number;
    monthlySales: number;
    averageTicket: number;
    totalTransactions: number;
    topProducts: Product[];
  };
  
  // Notifications
  notifications: Notification[];
  
  // UI State
  activeModule: string;
  loading: boolean;
}

type AppAction = 
  | { type: 'SET_USER_DATA'; payload: any }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT_STOCK'; payload: { id: number; quantity: number } }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE_ATTENDANCE'; payload: { employeeId: number; hours: number; overtime: number } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'UPDATE_CASH_REGISTER'; payload: Partial<AppState['cashRegister']> }
  | { type: 'SET_ACTIVE_MODULE'; payload: string }
  | { type: 'CALCULATE_ANALYTICS' }
  | { type: 'INITIALIZE_APP'; payload: Partial<AppState> };

const initialState: AppState = {
  userData: null,
  products: [],
  employees: [],
  transactions: [],
  sales: [],
  invoices: [],
  cashRegister: {
    openingBalance: 500000,
    currentBalance: 500000,
    expectedBalance: 500000,
    cardSales: 0,
    expenses: 0,
  },
  analytics: {
    dailySales: 0,
    monthlySales: 0,
    averageTicket: 0,
    totalTransactions: 0,
    topProducts: [],
  },
  notifications: [],
  activeModule: 'dashboard',
  loading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return { ...state, ...action.payload };

    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };

    case 'ADD_PRODUCT':
      return { 
        ...state, 
        products: [...state.products, action.payload],
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          type: 'success',
          title: 'Producto Agregado',
          message: `${action.payload.name} fue agregado al inventario`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      };

    case 'UPDATE_PRODUCT_STOCK': {
      const updatedProducts = state.products.map(product => 
        product.id === action.payload.id 
          ? { 
              ...product, 
              stock: Math.max(0, product.stock - action.payload.quantity),
              sold: product.sold + action.payload.quantity
            }
          : product
      );
      
      // Check for low stock notifications
      const lowStockProducts = updatedProducts.filter(p => p.stock <= p.minStock && p.stock > 0);
      const outOfStockProducts = updatedProducts.filter(p => p.stock === 0);
      
      const newNotifications = [
        ...lowStockProducts.map(p => ({
          id: `low-stock-${p.id}-${Date.now()}`,
          type: 'warning' as const,
          title: 'Stock Bajo',
          message: `${p.name} tiene solo ${p.stock} unidades restantes`,
          timestamp: new Date().toISOString(),
          read: false,
          action: 'inventory'
        })),
        ...outOfStockProducts.map(p => ({
          id: `out-stock-${p.id}-${Date.now()}`,
          type: 'error' as const,
          title: 'Sin Stock',
          message: `${p.name} se ha agotado completamente`,
          timestamp: new Date().toISOString(),
          read: false,
          action: 'inventory'
        }))
      ];

      return {
        ...state,
        products: updatedProducts,
        notifications: [...state.notifications, ...newNotifications]
      };
    }

    case 'ADD_EMPLOYEE':
      return { 
        ...state, 
        employees: [...state.employees, action.payload],
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          type: 'success',
          title: 'Empleado Agregado',
          message: `${action.payload.name} fue agregado al equipo`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      };

    case 'UPDATE_EMPLOYEE_ATTENDANCE': {
      const updatedEmployees = state.employees.map(emp =>
        emp.id === action.payload.employeeId
          ? {
              ...emp,
              hoursWorked: emp.hoursWorked + action.payload.hours,
              overtimeHours: emp.overtimeHours + action.payload.overtime,
              lastAttendance: new Date().toISOString()
            }
          : emp
      );

      return {
        ...state,
        employees: updatedEmployees,
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          type: 'info',
          title: 'Asistencia Registrada',
          message: `Asistencia actualizada para empleado ID ${action.payload.employeeId}`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      };
    }

    case 'ADD_TRANSACTION': {
      const newTransaction = action.payload;
      const updatedCashRegister = {
        ...state.cashRegister,
        currentBalance: newTransaction.type === 'income' 
          ? state.cashRegister.currentBalance + newTransaction.amount
          : state.cashRegister.currentBalance - newTransaction.amount,
        expenses: newTransaction.type === 'expense'
          ? state.cashRegister.expenses + newTransaction.amount
          : state.cashRegister.expenses
      };

      return {
        ...state,
        transactions: [...state.transactions, newTransaction],
        cashRegister: updatedCashRegister
      };
    }

    case 'ADD_SALE': {
      const sale = action.payload;
      
      // Update product stock for each sold item
      const updatedProducts = state.products.map(product => {
        const soldItem = sale.products.find(p => p.productId === product.id);
        if (soldItem) {
          return {
            ...product,
            stock: Math.max(0, product.stock - soldItem.quantity),
            sold: product.sold + soldItem.quantity
          };
        }
        return product;
      });

      // Update cash register
      const updatedCashRegister = {
        ...state.cashRegister,
        currentBalance: sale.paymentMethod === 'Efectivo' 
          ? state.cashRegister.currentBalance + sale.total
          : state.cashRegister.currentBalance,
        cardSales: sale.paymentMethod !== 'Efectivo'
          ? state.cashRegister.cardSales + sale.total
          : state.cashRegister.cardSales
      };

      // Add transaction record
      const transaction: Transaction = {
        id: `sale-${sale.id}`,
        type: 'income',
        category: 'Ventas',
        amount: sale.total,
        description: `Venta ${sale.id}`,
        date: sale.date,
        paymentMethod: sale.paymentMethod,
        status: 'completed',
        relatedTo: sale.id
      };

      return {
        ...state,
        sales: [...state.sales, sale],
        products: updatedProducts,
        cashRegister: updatedCashRegister,
        transactions: [...state.transactions, transaction],
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          type: 'success',
          title: 'Venta Procesada',
          message: `Venta por ${sale.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} completada`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      };
    }

    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [...state.invoices, action.payload],
        notifications: [...state.notifications, {
          id: Date.now().toString(),
          type: 'info',
          title: 'Factura Generada',
          message: `Factura ${action.payload.id} para ${action.payload.clientName}`,
          timestamp: new Date().toISOString(),
          read: false,
        }]
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        )
      };

    case 'UPDATE_CASH_REGISTER':
      return {
        ...state,
        cashRegister: { ...state.cashRegister, ...action.payload }
      };

    case 'SET_ACTIVE_MODULE':
      return { ...state, activeModule: action.payload };

    case 'CALCULATE_ANALYTICS': {
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      
      const dailySales = state.sales
        .filter(sale => new Date(sale.date).toDateString() === today)
        .reduce((sum, sale) => sum + sale.total, 0);
        
      const monthlySales = state.sales
        .filter(sale => new Date(sale.date).getMonth() === thisMonth)
        .reduce((sum, sale) => sum + sale.total, 0);
        
      const totalTransactions = state.sales.length;
      const averageTicket = totalTransactions > 0 ? monthlySales / totalTransactions : 0;
      
      const productSales = state.products
        .filter(p => p.sold > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      return {
        ...state,
        analytics: {
          dailySales,
          monthlySales,
          averageTicket,
          totalTransactions,
          topProducts: productSales
        }
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // DEPRECATED: Este contexto está siendo reemplazado por DataContext
  // Solo mantener para compatibilidad temporal
  
  // Load minimal data from localStorage on mount (solo para compatibilidad)
  useEffect(() => {
    const savedData = localStorage.getItem('conektaoAppData_legacy');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Solo cargar configuraciones de UI, no datos críticos
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: parsedData.activeModule || 'dashboard' });
      } catch (error) {
        console.log('Error loading legacy data:', error);
      }
    }
  }, []);

  // Solo guardar configuraciones de UI, no datos críticos
  useEffect(() => {
    const uiConfig = {
      activeModule: state.activeModule,
    };
    localStorage.setItem('conektaoAppData_legacy', JSON.stringify(uiConfig));
  }, [state.activeModule]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export type { Product, Employee, Transaction, Sale, Invoice, Notification, AppState };