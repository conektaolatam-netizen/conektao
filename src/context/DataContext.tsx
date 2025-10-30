import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/useDataSync';
import { useToast } from '@/hooks/use-toast';

// Centralized data types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price?: number;
  stock: number;
  minStock: number;
  unit: string;
  is_active: boolean;
  user_id: string;
}

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  customer_email?: string;
  table_number?: number;
  created_at: string;
  status: string;
  user_id: string;
}

interface DataState {
  products: Product[];
  sales: Sale[];
  analytics: {
    dailySales: number;
    monthlySales: number;
    totalOrders: number;
    averageTicket: number;
  };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: { id: string; updates: Partial<Product> } }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'UPDATE_ANALYTICS'; payload: Partial<DataState['analytics']> }
  | { type: 'SET_LAST_UPDATED' };

const initialState: DataState = {
  products: [],
  sales: [],
  analytics: {
    dailySales: 0,
    monthlySales: 0,
    totalOrders: 0,
    averageTicket: 0
  },
  loading: false,
  error: null,
  lastUpdated: null
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    
    case 'ADD_PRODUCT':
      return { 
        ...state, 
        products: [...state.products, action.payload]
      };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id
            ? { ...product, ...action.payload.updates }
            : product
        )
      };
    
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      };
    
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    
    case 'ADD_SALE':
      return { 
        ...state, 
        sales: [...state.sales, action.payload]
      };
    
    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: { ...state.analytics, ...action.payload }
      };
    
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };
    
    default:
      return state;
  }
}

const DataContext = createContext<{
  state: DataState;
  actions: {
    loadProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    loadSales: () => Promise<void>;
    addSale: (sale: Omit<Sale, 'id' | 'created_at'>) => Promise<void>;
    refreshAnalytics: () => Promise<void>;
    refreshAll: () => Promise<void>;
  };
} | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { user, profile } = useAuth();
  const { safeDbOperation } = useDataSync();
  const { toast } = useToast();

  // Calculate analytics when sales change
  useEffect(() => {
    if (state.sales.length > 0) {
      calculateAnalytics();
    }
  }, [state.sales]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile?.restaurant_id) return;

    // Products subscription
    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    // Sales subscription
    const salesChannel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
        },
        () => {
          loadSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [profile?.restaurant_id]);

  const calculateAnalytics = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailySales = state.sales
      .filter(sale => new Date(sale.created_at) >= startOfDay)
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    const monthlySales = state.sales
      .filter(sale => new Date(sale.created_at) >= startOfMonth)
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    const totalOrders = state.sales.length;
    const averageTicket = totalOrders > 0 ? monthlySales / totalOrders : 0;

    dispatch({
      type: 'UPDATE_ANALYTICS',
      payload: {
        dailySales,
        monthlySales,
        totalOrders,
        averageTicket
      }
    });
  };

  const loadProducts = async () => {
    if (!profile?.restaurant_id) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          cost_price,
          is_active,
          user_id,
          category:categories(name),
          inventory(current_stock, min_stock, unit)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const formattedProducts: Product[] = data?.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'General',
        price: product.price,
        cost_price: product.cost_price,
        stock: product.inventory?.[0]?.current_stock || 0,
        minStock: product.inventory?.[0]?.min_stock || 0,
        unit: product.inventory?.[0]?.unit || 'unidades',
        is_active: product.is_active,
        user_id: product.user_id
      })) || [];

      dispatch({ type: 'SET_PRODUCTS', payload: formattedProducts });
      dispatch({ type: 'SET_LAST_UPDATED' });
    } catch (error) {
      console.error('Error loading products:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al cargar productos' });
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const result = await safeDbOperation(
        'products',
        'INSERT',
        {
          ...productData,
          user_id: user?.id
        },
        () => {
          // Optimistic update
          const tempProduct: Product = {
            ...productData,
            id: `temp-${Date.now()}`,
            user_id: user?.id || ''
          };
          dispatch({ type: 'ADD_PRODUCT', payload: tempProduct });
        }
      );

      if (result.success && !result.queued) {
        await loadProducts(); // Refresh from database
      }

      toast({
        title: "Producto agregado",
        description: result.queued ? "Se sincronizará cuando haya conexión" : "Producto agregado exitosamente",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto",
        variant: "destructive"
      });
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const result = await safeDbOperation(
        'products',
        'UPDATE',
        { id, ...updates },
        () => {
          // Optimistic update
          dispatch({ type: 'UPDATE_PRODUCT', payload: { id, updates } });
        }
      );

      if (result.success && !result.queued) {
        await loadProducts(); // Refresh from database
      }

      toast({
        title: "Producto actualizado",
        description: result.queued ? "Se sincronizará cuando haya conexión" : "Producto actualizado exitosamente",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const result = await safeDbOperation(
        'products',
        'DELETE',
        { id },
        () => {
          // Optimistic update
          dispatch({ type: 'DELETE_PRODUCT', payload: id });
        }
      );

      if (result.success && !result.queued) {
        await loadProducts(); // Refresh from database
      }

      toast({
        title: "Producto eliminado",
        description: result.queued ? "Se sincronizará cuando haya conexión" : "Producto eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };

  const loadSales = async () => {
    if (!profile?.restaurant_id) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSales: Sale[] = data?.map((sale: any) => ({
        id: sale.id,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        customer_email: sale.customer_email,
        table_number: sale.table_number,
        created_at: sale.created_at,
        status: sale.status,
        user_id: sale.user_id
      })) || [];

      dispatch({ type: 'SET_SALES', payload: formattedSales });
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive"
      });
    }
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'created_at'>) => {
    try {
      const result = await safeDbOperation(
        'sales',
        'INSERT',
        {
          ...saleData,
          user_id: user?.id
        },
        () => {
          // Optimistic update
          const tempSale: Sale = {
            ...saleData,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            user_id: user?.id || ''
          };
          dispatch({ type: 'ADD_SALE', payload: tempSale });
        }
      );

      if (result.success && !result.queued) {
        await loadSales(); // Refresh from database
      }

      toast({
        title: "Venta registrada",
        description: result.queued ? "Se sincronizará cuando haya conexión" : "Venta registrada exitosamente",
      });
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive"
      });
    }
  };

  const refreshAnalytics = async () => {
    calculateAnalytics();
  };

  const refreshAll = async () => {
    await Promise.all([
      loadProducts(),
      loadSales()
    ]);
  };

  // Initial data load
  useEffect(() => {
    if (user && profile?.restaurant_id) {
      refreshAll();
    }
  }, [user, profile?.restaurant_id]);

  const actions = {
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    loadSales,
    addSale,
    refreshAnalytics,
    refreshAll
  };

  return (
    <DataContext.Provider value={{ state, actions }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export type { Product, Sale, DataState };