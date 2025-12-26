import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDayRange } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Receipt, DollarSign, Calendar, Users, Utensils, Minus, CreditCard, Banknote, Smartphone, ArrowLeft, CheckCircle, Clock, Coffee, Pizza, Wine, IceCream, ChefHat, Sparkles, Eye, Download, TrendingUp, Wallet, Upload, Camera, Printer, Edit3, Trash2, Brain, Truck, AlertTriangle, Loader2 } from 'lucide-react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import KitchenOrderModal from './kitchen/KitchenOrderModal';
import { useSuspiciousEvents } from '@/hooks/useSuspiciousEvents';
import CashManagement from './CashManagement';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import type { Sale } from '@/context/AppContext';
import ProductCreatorNew from './ProductCreatorNew';
import POSSystem from './POSSystem';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import TipDistributionModal from './billing/TipDistributionModal';
import TipAdjustmentModal from './billing/TipAdjustmentModal';
import TipSelector from './billing/TipSelector';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useTipConfig } from '@/context/TipConfigContext';

const Billing = () => {
  const {
    state,
    dispatch
  } = useApp();
  const {
    checkAvailability
  } = useProductAvailability();
  const { logAction } = useAuditLog();
  const { sendToKitchen, isLoading: kitchenLoading } = useKitchenOrders();
  const { logSuspiciousEvent } = useSuspiciousEvents();
  
  // Estado para cocina
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [kitchenOrderSent, setKitchenOrderSent] = useState(false);
  const [showNoKitchenWarning, setShowNoKitchenWarning] = useState(false);
  
  // Estado de procesamiento de pago - feedback inmediato
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Usar configuración de propinas desde el contexto GLOBAL (única fuente de verdad)
  const tipConfig = useTipConfig();
  const [currentView, setCurrentView] = useState<'tables' | 'menu' | 'payment' | 'success' | 'cash' | 'pos'>('tables');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Estados para campos adicionales de pago
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');

  // Estados para modal de correo
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState('');

  // Estados para creación de productos
  const [showProductCreator, setShowProductCreator] = useState(false);
  const [pendingProductData, setPendingProductData] = useState<any>(null);
  const [editingProductWithAI, setEditingProductWithAI] = useState<any>(null);

  // Estados para gestión de órdenes
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedTableForGuests, setSelectedTableForGuests] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState('');

  // Estado para disponibilidad de productos
  const [productsAvailability, setProductsAvailability] = useState<Record<string, {
    maxUnits: number;
    limitingIngredient: string | null;
  }>>({});
  const {
    toast
  } = useToast();
  const {
    user,
    profile
  } = useAuth();

  // Estado para órdenes y datos reales
  const [tables, setTables] = useState(() => Array.from({
    length: 24
  }, (_, i) => ({
    number: i + 1,
    status: 'libre',
    customers: 0,
    currentOrder: null,
    guestCount: 0,
    // Nuevo campo para número de comensales
    orderTotal: 0 // Total de la orden actual
  })));

  // Estado para datos de ventas reales
  const [dailySales, setDailySales] = useState(0);
  const [dailyOrders, setDailyOrders] = useState(0);
  const [activeTables, setActiveTables] = useState(0);

  // Estados para productos y datos reales de la base de datos
  const [products, setProducts] = useState<any[]>([]);
  // Categorías dinámicas desde BD
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  // Edición de producto (solo owner)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Estado para modal de limpiar mesa - CAPTURAMOS datos antes de abrir modal
  const [showClearTableModal, setShowClearTableModal] = useState(false);
  const [clearTableReason, setClearTableReason] = useState('');
  const [isClearingTable, setIsClearingTable] = useState(false);
  const [clearTableData, setClearTableData] = useState<{
    tableNumber: number;
    products: any[];
    total: number;
  } | null>(null);
  
  // Función para abrir modal capturando datos ANTES
  const openClearTableModal = () => {
    if (!selectedTable) {
      toast({ title: "Error", description: "No hay mesa seleccionada", variant: "destructive" });
      return;
    }
    // CAPTURAR estado ANTES de abrir modal
    setClearTableData({
      tableNumber: selectedTable,
      products: [...selectedProducts],
      total: selectedProducts.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0)
    });
    setShowClearTableModal(true);
  };
  
  // Función para cerrar modal y limpiar datos capturados
  const closeClearTableModal = () => {
    setShowClearTableModal(false);
    setClearTableReason('');
    setClearTableData(null);
  };
  const openEditProduct = (product: any) => {
    // Abrir el ProductCreator con el producto existente para edición completa
    setEditingProductWithAI({
      id: product.id,
      name: product.name,
      price: product.price,
      cost_price: product.cost_price,
      description: product.description
    });
    setShowProductCreator(true);
  };
  const openProductCostCalculation = (product: any) => {
    setEditingProductWithAI({
      id: product.id,
      name: product.name,
      price: product.price,
      cost_price: product.cost_price,
      description: product.description
    });
    setShowProductCreator(true);
  };
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const {
        error
      } = await supabase.from('products').update({
        price: parseFloat(editPrice) || 0,
        description: editDescription
      }).eq('id', editingProduct.id);
      if (error) throw error;
      toast({
        title: 'Producto actualizado',
        description: 'Se guardaron los cambios.'
      });
      setEditDialogOpen(false);
      setEditingProduct(null);
      await loadProductsFromDB();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el producto',
        variant: 'destructive'
      });
    }
  };
  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    try {
      // Soft delete: marcar como inactivo para evitar conflictos de claves foráneas
      const {
        error
      } = await supabase.from('products').update({
        is_active: false
      }).eq('id', editingProduct.id);
      if (error) throw error;
      toast({
        title: 'Producto eliminado',
        description: 'El producto fue desactivado y ocultado del menú.'
      });
      setDeleteDialogOpen(false);
      setEditingProduct(null);
      await loadProductsFromDB();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive'
      });
    }
  };
  const [realSalesData, setRealSalesData] = useState({
    dailySales: 0,
    dailyOrders: 0,
    totalOrders: 0,
    deliveryOrders: 0,
    dineInOrders: 0
  });

  // Estados para propinas - valores de la orden actual (pueden diferir del default global)
  const [tipAmount, setTipAmount] = useState(0);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [noTip, setNoTip] = useState(false);
  const [tipOverridden, setTipOverridden] = useState(false); // Marca si el cajero editó la propina
  
  // Estado para modal de distribución de propinas
  const [showTipDistributionModal, setShowTipDistributionModal] = useState(false);
  const [pendingSaleIdForTip, setPendingSaleIdForTip] = useState<string | null>(null);
  const [pendingTipAmountForDistribution, setPendingTipAmountForDistribution] = useState(0);
  
  // Estado para modal de ajuste de propinas (cuando baja o se elimina)
  const [showTipAdjustmentModal, setShowTipAdjustmentModal] = useState(false);
  const [pendingPaymentCallback, setPendingPaymentCallback] = useState<(() => void) | null>(null);
  const [initialSuggestedTip, setInitialSuggestedTip] = useState(0);

  // Usar cliente Supabase compartido tipado desde '@/integrations/supabase/client'

  // Cargar productos de la base de datos
  useEffect(() => {
    loadProductsFromDB();
    loadTodaysSales();
  }, [user, profile?.restaurant_id]);

  // Sincronizar propina inicial desde el contexto global cuando cambie
  useEffect(() => {
    if (tipConfig.tipEnabled && !tipConfig.isLoading && !tipOverridden) {
      // Recalcular propina sugerida cuando el default global cambie
      const subtotal = calculateSubtotal();
      const suggestedTip = (subtotal * tipConfig.defaultTipPercentage) / 100;
      setTipAmount(suggestedTip);
      setInitialSuggestedTip(suggestedTip);
    }
  }, [tipConfig.defaultTipPercentage, tipConfig.tipEnabled, tipConfig.isLoading]);
  useEffect(() => {
    if (user && profile?.restaurant_id) {
      loadCategoriesFromDB();
    }
  }, [user, profile?.restaurant_id]);

  // Real-time synchronization for unified experience
  useEffect(() => {
    if (!user || !profile?.restaurant_id) return;

    // Subscribe to table_states changes for real-time sync between owner and employees
    const tableStatesChannel = supabase.channel('table_states_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_states',
      filter: `restaurant_id=eq.${profile.restaurant_id}`
    }, () => {
      // Reload table states when any changes occur
      loadTodaysSales();
    }).subscribe();

    // Subscribe to kitchen_orders for real-time updates
    const kitchenOrdersChannel = supabase.channel('kitchen_orders_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'kitchen_orders',
      filter: `restaurant_id=eq.${profile.restaurant_id}`
    }, () => {
      // Reload when kitchen orders change
      loadTodaysSales();
    }).subscribe();

    // Subscribe to sales for real-time updates
    const salesChannel = supabase.channel('sales_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sales'
    }, () => {
      // Reload sales data for real-time updates
      loadTodaysSales();
    }).subscribe();
    return () => {
      supabase.removeChannel(tableStatesChannel);
      supabase.removeChannel(kitchenOrdersChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [user, profile?.restaurant_id]);

  // Estado para sincronización
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Efecto para limpiar productos y recargar mesas cuando se vuelve a la vista de tables
  useEffect(() => {
    if (currentView === 'tables') {
      // NO resetear si el modal está abierto - usuario puede estar anulando
      if (!showClearTableModal) {
        setSelectedProducts([]);
        setSelectedTable(null);
      }
      // CRÍTICO: Siempre recargar mesas desde DB para evitar datos stale
      loadTodaysSales();
    }
  }, [currentView, showClearTableModal]);
  const loadCategoriesFromDB = async () => {
    if (!user || !profile?.restaurant_id) return;
    try {
      // Obtener usuarios del restaurante
      const {
        data: restaurantUsers,
        error: usersError
      } = await supabase.from('profiles').select('id').eq('restaurant_id', profile.restaurant_id);
      if (usersError) throw usersError;
      const userIds = restaurantUsers?.map(u => u.id) || [];

      // Obtener categorías de cualquier usuario del restaurante
      const {
        data,
        error
      } = await supabase.from('categories').select('name').in('user_id', userIds).order('name');
      if (error) throw error;
      const names = (data || []).map((c: any) => c.name).filter((n: string) => !!n);
      setDbCategories(names);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  const loadProductsFromDB = async () => {
    try {
      if (!user || !profile?.restaurant_id) {
        console.log('No user or restaurant_id available');
        setProducts(generateFallbackProducts());
        return;
      }

      // Buscar productos visibles por RLS del restaurante actual
      const {
        data: dbProducts,
        error
      } = await supabase.from('products').select(`
          *,
          category:categories(name),
          inventory(current_stock)
        `).eq('is_active', true);
      if (error) {
        console.error('Error loading products:', error);
        setProducts(generateFallbackProducts());
        return;
      }
      console.log('Products loaded for restaurant:', dbProducts);

      // Primero crear los productos sin disponibilidad
      const formattedProducts = dbProducts?.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Sin categoría',
        price: product.price,
        description: 'Cargando disponibilidad...',
        // Temporal
        image: getProductIcon(product.name, state.userData?.businessType || 'restaurant'),
        popular: false,
        stock: 0 // Temporal
      })) || [];
      setProducts(formattedProducts);

      // Ahora calcular la disponibilidad real desde ingredientes
      await loadProductsAvailability(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts(generateFallbackProducts());
    }
  };

  // Nueva función para cargar disponibilidad real desde ingredientes
  const loadProductsAvailability = async (productsList: any[]) => {
    if (!productsList.length) return;
    const availabilityMap: Record<string, any> = {};
    const updatedProducts = [...productsList];
    for (let i = 0; i < productsList.length; i++) {
      const product = productsList[i];
      const result = await checkAvailability(product.id, 1);
      availabilityMap[product.id] = {
        maxUnits: result.maxUnits,
        limitingIngredient: result.limitingIngredient
      };

      // Actualizar la descripción con la disponibilidad real
      updatedProducts[i] = {
        ...product,
        description: `Disponible: ${result.maxUnits} unidades`,
        stock: result.maxUnits
      };
    }
    setProductsAvailability(availabilityMap);
    setProducts(updatedProducts);
  };
  // La configuración de propinas ahora viene del contexto global (tipConfig)
  // Ya no se necesita loadTipSettings - el contexto se sincroniza automáticamente
  const loadTodaysSales = async () => {
    try {
      if (!profile?.restaurant_id) return;
      const {
        startISO,
        endISO
      } = getLocalDayRange();

      // Cargar ventas del día
      const {
        data: sales,
        error
      } = await supabase.from('sales').select('total_amount, table_number, customer_email, created_at').gte('created_at', startISO).lt('created_at', endISO);
      if (!error && sales) {
        const dailyTotal = sales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0);

        // Separar órdenes de delivery y dine-in
        const deliveryOrders = sales.filter(sale => sale.table_number === null).length;
        const dineInOrders = sales.filter(sale => sale.table_number !== null).length;
        setRealSalesData({
          dailySales: dailyTotal,
          dailyOrders: sales.length,
          totalOrders: sales.length,
          deliveryOrders,
          dineInOrders
        });
      }

      // Cargar estado actual de las mesas desde la base de datos
      const {
        data: tableStates,
        error: tableError
      } = await supabase.from('table_states').select('*').eq('restaurant_id', profile.restaurant_id).order('table_number');
      if (!tableError && tableStates) {
        // Crear array de 24 mesas con el estado real de la base de datos
        const updatedTables = Array.from({
          length: 24
        }, (_, i) => {
          const tableNumber = i + 1;
          const tableState = tableStates.find(t => t.table_number === tableNumber);
          return {
            number: tableNumber,
            status: tableState?.status || 'libre',
            customers: tableState?.guest_count || 0,
            currentOrder: tableState?.current_order || null,
            guestCount: tableState?.guest_count || 0,
            orderTotal: tableState?.order_total || 0
          };
        });
        setTables(updatedTables);
      } else {
        // Si no hay datos en table_states, usar fallback
        setTables(Array.from({
          length: 24
        }, (_, i) => ({
          number: i + 1,
          status: 'libre',
          customers: 0,
          currentOrder: null,
          guestCount: 0,
          orderTotal: 0
        })));
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };
  const generateFallbackProducts = () => {
    // Use products from global state if available
    if (state.products && state.products.length > 0) {
      return state.products.map((product, index) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        description: `Disponible: ${product.stock} unidades`,
        image: getProductIcon(product.name, state.userData?.businessType || 'restaurant'),
        popular: product.sold > 10,
        stock: product.stock
      }));
    }

    // Productos por defecto si no hay datos
    return [{
      id: 1,
      name: "Producto 1",
      category: "General",
      price: 10000,
      description: "Producto básico",
      image: "🍽️",
      popular: false,
      stock: 10
    }, {
      id: 2,
      name: "Producto 2",
      category: "General",
      price: 15000,
      description: "Producto básico",
      image: "🍽️",
      popular: false,
      stock: 10
    }, {
      id: 3,
      name: "Bebida",
      category: "Bebidas",
      price: 5000,
      description: "Bebida refrescante",
      image: "🥤",
      popular: false,
      stock: 10
    }];
  };
  const getProductCategory = (productName: string, businessType: string) => {
    const name = productName.toLowerCase();

    // Detectar categorías específicas por tipo de negocio
    if (businessType === 'heladeria') {
      if (name.includes('helado') || name.includes('açaí') || name.includes('acai')) return 'Helados Base';
      if (name.includes('topping') || name.includes('granola') || name.includes('fruta')) return 'Toppings';
      if (name.includes('salsa') || name.includes('miel') || name.includes('jarabe')) return 'Salsas';
      if (name.includes('combo')) return 'Combos';
      return 'Helados Base';
    }
    if (businessType === 'pizzeria') {
      if (name.includes('pizza')) return 'Pizzas';
      if (name.includes('adición') || name.includes('extra') || name.includes('queso')) return 'Adiciones';
      if (name.includes('postre')) return 'Postres';
      return 'Pizzas';
    }
    if (businessType === 'cafeteria') {
      if (name.includes('café') || name.includes('cappuccino') || name.includes('espresso')) return 'Bebidas Calientes';
      if (name.includes('frío') || name.includes('frappé') || name.includes('ice')) return 'Bebidas Frías';
      if (name.includes('sandwich') || name.includes('comida')) return 'Comida';
      if (name.includes('postre') || name.includes('torta')) return 'Postres';
      return 'Bebidas Calientes';
    }
    if (businessType === 'bar') {
      if (name.includes('cerveza')) return 'Cervezas';
      if (name.includes('cocktail') || name.includes('trago')) return 'Cocktails';
      if (name.includes('licor') || name.includes('whisky') || name.includes('ron')) return 'Licores';
      if (name.includes('comida') || name.includes('picada')) return 'Comida';
      return 'Bebidas';
    }

    // Categorías genéricas
    if (name.includes('bebida') || name.includes('jugo') || name.includes('gaseosa')) return 'Bebidas';
    if (name.includes('postre') || name.includes('dulce')) return 'Postres';
    if (name.includes('entrada') || name.includes('aperitivo')) return 'Entradas';
    return 'Productos';
  };
  const getProductIcon = (productName: string, businessType: string) => {
    const name = productName.toLowerCase();
    if (name.includes('pizza')) return '🍕';
    if (name.includes('hamburguesa')) return '🍔';
    if (name.includes('bebida') || name.includes('jugo')) return '🥤';
    if (name.includes('cerveza')) return '🍺';
    if (name.includes('vino')) return '🍷';
    if (name.includes('café')) return '☕';
    if (name.includes('helado')) return '🍦';
    if (name.includes('pan')) return '🥖';
    if (name.includes('postre')) return '🍰';

    // Iconos por tipo de negocio
    switch (businessType) {
      case 'pizzeria':
        return '🍕';
      case 'cafeteria':
        return '☕';
      case 'bar':
        return '🍺';
      case 'heladeria':
        return '🍦';
      case 'panaderia':
        return '🥖';
      default:
        return '🍽️';
    }
  };
  const getComplementaryProducts = (businessType: string) => {
    const baseId = 1000; // Para evitar conflictos con IDs de productos del usuario

    switch (businessType) {
      case 'pizzeria':
        return [{
          id: baseId + 1,
          name: "Coca Cola",
          category: "Bebidas",
          price: 4500,
          description: "Bebida refrescante",
          image: "🥤",
          popular: false
        }, {
          id: baseId + 2,
          name: "Cerveza",
          category: "Bebidas",
          price: 8000,
          description: "Cerveza fría",
          image: "🍺",
          popular: false
        }, {
          id: baseId + 3,
          name: "Adición de Queso",
          category: "Adiciones",
          price: 3000,
          description: "Extra queso",
          image: "🧀",
          popular: false
        }];
      case 'bar':
        return [{
          id: baseId + 1,
          name: "Cerveza Nacional",
          category: "Bebidas",
          price: 6000,
          description: "Cerveza fría",
          image: "🍺",
          popular: true
        }, {
          id: baseId + 2,
          name: "Vino Tinto",
          category: "Bebidas",
          price: 25000,
          description: "Copa de vino",
          image: "🍷",
          popular: false
        }, {
          id: baseId + 3,
          name: "Picada",
          category: "Entradas",
          price: 35000,
          description: "Picada para compartir",
          image: "🧀",
          popular: false
        }];
      case 'cafeteria':
        return [{
          id: baseId + 1,
          name: "Café Americano",
          category: "Bebidas",
          price: 3500,
          description: "Café tradicional",
          image: "☕",
          popular: true
        }, {
          id: baseId + 2,
          name: "Cappuccino",
          category: "Bebidas",
          price: 5500,
          description: "Café con espuma",
          image: "☕",
          popular: false
        }, {
          id: baseId + 3,
          name: "Sandwich",
          category: "Comida",
          price: 12000,
          description: "Sandwich del día",
          image: "🥪",
          popular: false
        }];
      default:
        return [{
          id: baseId + 1,
          name: "Bebida Refrescante",
          category: "Bebidas",
          price: 3000,
          description: "Bebida fría",
          image: "🥤",
          popular: false
        }, {
          id: baseId + 2,
          name: "Agua",
          category: "Bebidas",
          price: 2000,
          description: "Agua natural",
          image: "💧",
          popular: false
        }];
    }
  };
  const menuProducts = products;
  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set((menuProducts || []).map((p: any) => p.category).filter((n: string) => !!n && n.trim() !== '' && n.toLowerCase() !== 'sin categoría')));
    const allNames = Array.from(new Set([...(dbCategories || []), ...fromProducts])).filter(name => name && name.trim() !== '' && name.toLowerCase() !== 'sin categoría');
    const gradients = ['from-blue-500 to-blue-600', 'from-green-500 to-teal-600', 'from-purple-500 to-purple-600', 'from-yellow-500 to-orange-600', 'from-pink-500 to-rose-600', 'from-orange-500 to-amber-600'];
    const dynamic = allNames.map((name, idx) => ({
      name,
      icon: Utensils,
      color: gradients[idx % gradients.length]
    }));
    return [...dynamic, {
      name: 'Todos',
      icon: Utensils,
      color: 'from-blue-500 to-blue-600'
    }];
  }, [dbCategories, menuProducts]);
  const paymentMethods = [{
    id: 'efectivo',
    name: 'Efectivo',
    icon: Banknote,
    color: 'from-green-500 to-green-600'
  }, {
    id: 'tarjeta',
    name: 'Tarjeta',
    icon: CreditCard,
    color: 'from-blue-500 to-blue-600'
  }, {
    id: 'transferencia',
    name: 'Transferencia',
    icon: Smartphone,
    color: 'from-purple-500 to-purple-600'
  }, {
    id: 'daviplata',
    name: 'Daviplata',
    icon: Smartphone,
    color: 'from-orange-500 to-orange-600'
  }, {
    id: 'nequi',
    name: 'Nequi',
    icon: Smartphone,
    color: 'from-pink-500 to-pink-600'
  }];

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calcular estadísticas reales usando datos de Supabase
  const activeTablesCount = tables.filter(t => t.status === 'ocupada').length;
  const totalGuests = tables.reduce((sum, table) => sum + (table.status === 'ocupada' ? table.guestCount : 0), 0);

  // Ticket promedio del día = ventas totales del día / personas que visitaron en el día
  const dailyVisitors = realSalesData.dailyOrders; // Cada orden representa una persona/visita
  const averageTicketDaily = dailyVisitors > 0 ? realSalesData.dailySales / dailyVisitors : 0;
  const stats = [{
    title: 'Ventas Hoy',
    value: formatCurrency(realSalesData.dailySales),
    change: realSalesData.dailySales > 0 ? `+${realSalesData.dailyOrders} órdenes` : 'Sin ventas',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600'
  }, {
    title: 'Órdenes Mesa',
    value: realSalesData.dineInOrders?.toString() || '0',
    change: `${activeTablesCount} mesas activas`,
    icon: Utensils,
    color: 'from-blue-500 to-blue-600'
  }, {
    title: 'Órdenes Delivery',
    value: realSalesData.deliveryOrders?.toString() || '0',
    change: realSalesData.deliveryOrders > 0 ? 'Domicilios del día' : 'Sin domicilios',
    icon: Truck,
    color: 'from-purple-500 to-purple-600'
  }, {
    title: 'Ticket Promedio',
    value: formatCurrency(averageTicketDaily),
    change: dailyVisitors > 0 ? `${dailyVisitors} personas visitaron hoy` : 'Sin visitantes hoy',
    icon: TrendingUp,
    color: 'from-orange-500 to-orange-600'
  }];

  // Funciones
  const filteredProducts = menuProducts.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  // Función robusta para actualizar orden con retry
  const updateTableOrder = async (updatedProducts: any[], retryCount = 0): Promise<boolean> => {
    if (!profile?.restaurant_id || !selectedTable) return false;
    
    const maxRetries = 3;
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const orderTotal = updatedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
      
      const { data, error } = await supabase
        .from('table_states')
        .update({
          current_order: updatedProducts,
          order_total: orderTotal,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', selectedTable)
        .select();
      
      if (error) throw error;
      
      // Verificar que la actualización se aplicó
      if (!data || data.length === 0) {
        throw new Error('No se actualizó ningún registro');
      }
      
      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error(`Error actualizando orden de mesa (intento ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Retry exponencial
        const delay = Math.pow(2, retryCount) * 300;
        await new Promise(resolve => setTimeout(resolve, delay));
        return updateTableOrder(updatedProducts, retryCount + 1);
      }
      
      // Falló después de todos los reintentos
      setIsSyncing(false);
      setSyncError('No se pudo guardar. Reintenta.');
      toast({
        title: "Error de sincronización",
        description: "Los cambios no se guardaron. Revisa tu conexión.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Función para anular/liberar mesa usando RPC atómico - USA clearTableData (datos capturados)
  const handleClearTable = async () => {
    console.log('>>> handleClearTable INICIADO <<<');
    
    // USAR DATOS CAPTURADOS, NO ESTADO LIVE
    if (!clearTableData) {
      console.error('handleClearTable: No clearTableData');
      toast({ title: "Error", description: "No hay datos de mesa para procesar", variant: "destructive" });
      return;
    }
    
    const { tableNumber, products } = clearTableData;
    const hasProducts = products.length > 0;
    
    // Validación con feedback al usuario
    if (!profile?.restaurant_id) {
      console.error('handleClearTable: No restaurant_id');
      toast({ title: "Error", description: "No se encontró el restaurante", variant: "destructive" });
      return;
    }
    if (!user) {
      console.error('handleClearTable: No user');
      toast({ title: "Error", description: "Usuario no autenticado", variant: "destructive" });
      return;
    }
    
    console.log('handleClearTable ejecutando con datos CAPTURADOS:', { 
      tableNumber, 
      hasProducts, 
      productCount: products.length,
      reason: clearTableReason 
    });
    
    // Mostrar feedback inmediato
    toast({ title: "Procesando...", description: `${hasProducts ? 'Anulando' : 'Liberando'} mesa ${tableNumber}` });
    
    setIsClearingTable(true);
    
    try {
      const rpcParams = {
        p_table_number: tableNumber,
        p_restaurant_id: profile.restaurant_id,
        p_user_id: user.id,
        p_user_name: profile?.full_name || 'Usuario',
        p_reason: hasProducts ? clearTableReason : (clearTableReason || 'Mesa liberada sin productos')
      };
      
      console.log('Llamando RPC clear_table_order con:', rpcParams);
      
      const { data, error } = await supabase.rpc('clear_table_order', rpcParams);
      
      console.log('RPC clear_table_order response:', { data, error });
      
      if (error) {
        console.error('RPC error:', error);
        throw error;
      }
      
      const result = data as { success: boolean; message: string };
      console.log('RPC result:', result);
      
      if (!result?.success) {
        throw new Error(result?.message || 'Error desconocido');
      }
      
      // SOLO si la DB confirmó, actualizar UI
      setSelectedProducts([]);
      setKitchenOrderSent(false);
      
      // Actualizar estado local de la mesa usando tableNumber capturado
      setTables(prev => prev.map(t => 
        t.number === tableNumber 
          ? { ...t, status: 'libre', customers: 0, guestCount: 0, orderTotal: 0, current_order: [] }
          : t
      ));
      
      toast({
        title: hasProducts ? "✅ Mesa anulada" : "✅ Mesa liberada",
        description: `Mesa ${tableNumber} liberada.${hasProducts ? ' Quedó registro para auditoría.' : ''}`
      });
      
      console.log('>>> handleClearTable COMPLETADO EXITOSAMENTE <<<');
      
      // Cerrar modal y limpiar datos capturados
      closeClearTableModal();
      
      // Volver al dashboard de mesas
      setCurrentView('tables');
      
      // Forzar recarga desde DB
      await loadTodaysSales();
      
    } catch (error: any) {
      console.error('Error limpiando mesa:', error);
      toast({
        title: "Error al procesar",
        description: error?.message || `No se pudo ${hasProducts ? 'anular' : 'liberar'} la mesa. Reintenta.`,
        variant: "destructive"
      });
    } finally {
      setIsClearingTable(false);
    }
  };
  
  const addProduct = async (product: any) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    let updatedProducts;
    if (existing) {
      updatedProducts = selectedProducts.map(p => p.id === product.id ? {
        ...p,
        quantity: p.quantity + 1
      } : p);
    } else {
      updatedProducts = [...selectedProducts, {
        ...product,
        quantity: 1
      }];
    }
    
    // Actualizar UI inmediatamente (optimistic update)
    setSelectedProducts(updatedProducts);

    // Actualizar en la base de datos con validación
    const success = await updateTableOrder(updatedProducts);
    
    if (success) {
      toast({
        title: "Producto agregado",
        description: `${product.name} añadido a la orden`
      });
    } else {
      // Revertir UI si falló la persistencia
      setSelectedProducts(selectedProducts);
    }
  };
  
  const removeProduct = async (productId: number) => {
    const existing = selectedProducts.find(p => p.id === productId);
    const previousProducts = [...selectedProducts];
    let updatedProducts;
    
    if (existing && existing.quantity > 1) {
      updatedProducts = selectedProducts.map(p => p.id === productId ? {
        ...p,
        quantity: p.quantity - 1
      } : p);
    } else {
      updatedProducts = selectedProducts.filter(p => p.id !== productId);
    }
    
    // Optimistic update
    setSelectedProducts(updatedProducts);

    // Actualizar en la base de datos con validación
    const success = await updateTableOrder(updatedProducts);
    
    if (!success) {
      // Revertir si falló
      setSelectedProducts(previousProducts);
    }
  };
  const calculateSubtotal = () => selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const calculateTipAmount = () => {
    if (noTip) return 0;
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      return parseFloat(customTipAmount);
    }
    if (tipConfig.tipEnabled && !noTip) {
      return calculateSubtotal() * tipConfig.defaultTipPercentage / 100;
    }
    return 0;
  };
  const calculateTotal = () => calculateSubtotal() + calculateTipAmount();
  
  // Calcular propina sugerida (para comparación)
  const getSuggestedTipAmount = () => {
    if (!tipConfig.tipEnabled) return 0;
    return calculateSubtotal() * tipConfig.defaultTipPercentage / 100;
  };
  
  // Verificar si la propina ha sido reducida
  const isTipReduced = () => {
    const suggested = getSuggestedTipAmount();
    const current = calculateTipAmount();
    return current < suggested;
  };
  
  // Registrar ajuste de propina en la BD
  const saveTipAdjustment = async (saleId: string, reasonType: string, reasonComment: string) => {
    if (!profile?.restaurant_id) return;
    
    try {
      const suggested = getSuggestedTipAmount();
      const current = calculateTipAmount();
      const finalPercent = calculateSubtotal() > 0 ? (current / calculateSubtotal()) * 100 : 0;
      
      await supabase.from('tip_adjustments').insert({
        restaurant_id: profile.restaurant_id,
        sale_id: saleId,
        cashier_id: user?.id,
        waiter_id: null, // TODO: Agregar si hay mesero asociado
        default_tip_percent: tipConfig.defaultTipPercentage,
        suggested_tip_amount: suggested,
        previous_tip_amount: suggested,
        new_tip_amount: current,
        final_tip_percent: finalPercent,
        reason_type: reasonType,
        reason_comment: reasonComment || null
      });
    } catch (error) {
      console.error('Error saving tip adjustment:', error);
    }
  };
  
  // Handler para confirmar ajuste de propina desde el modal
  const handleTipAdjustmentConfirm = (reasonType: string, reasonComment: string) => {
    setShowTipAdjustmentModal(false);
    // Guardar los datos del motivo para usar después de la venta
    localStorage.setItem('pending_tip_adjustment', JSON.stringify({ reasonType, reasonComment }));
    // Continuar con el pago
    if (pendingPaymentCallback) {
      pendingPaymentCallback();
      setPendingPaymentCallback(null);
    }
  };
  
  // Handler para cancelar ajuste (restaurar propina sugerida)
  const handleTipAdjustmentCancel = () => {
    setShowTipAdjustmentModal(false);
    setPendingPaymentCallback(null);
    // Restaurar propina sugerida
    setNoTip(false);
    setCustomTipAmount('');
    setTipOverridden(false);
    toast({
      title: "Propina restaurada",
      description: `Se ha restaurado la propina sugerida del ${tipConfig.defaultTipPercentage}%`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Comprobante cargado",
        description: `Archivo ${file.name} cargado exitosamente`
      });
    }
  };

  // Función para manejar selección de método de pago
  const handlePaymentMethodSelect = (methodId: string) => {
    setPendingPaymentMethod(methodId);
    setShowEmailModal(true);
  };

  // Función para confirmar email y método de pago
  const confirmPaymentMethod = () => {
    setPaymentMethod(pendingPaymentMethod);
    setShowEmailModal(false);

    // Scroll automático hacia el comprobante de pago
    setTimeout(() => {
      const proofSection = document.querySelector('[data-scroll-target="proof"]');
      if (proofSection) {
        proofSection.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
    toast({
      title: "Método de pago seleccionado",
      description: `Se enviará factura a: ${customerEmail}`
    });
  };

  // Conversión básica de unidades (asume densidad ~1 para ml<->g por simplicidad)
  const convertUnit = (qty: number, from: string, to: string) => {
    const norm = (u: string) => u.toLowerCase();
    const f = norm(from);
    const t = norm(to);
    if (f === t) return qty;
    const g = ['g', 'gramos'];
    const kg = ['kg', 'kilogramos'];
    const ml = ['ml', 'mililitros'];
    const l = ['l', 'lt', 'litros'];
    const isIn = (u: string, arr: string[]) => arr.includes(u);
    if (isIn(f, kg) && isIn(t, g)) return qty * 1000;
    if (isIn(f, g) && isIn(t, kg)) return qty / 1000;
    if (isIn(f, l) && isIn(t, ml)) return qty * 1000;
    if (isIn(f, ml) && isIn(t, l)) return qty / 1000;

    // Aproximación densidad 1: agua/pulpas
    if (isIn(f, l) && isIn(t, g)) return qty * 1000;
    if (isIn(f, ml) && isIn(t, g)) return qty;
    if (isIn(f, g) && isIn(t, ml)) return qty;
    if (isIn(f, g) && isIn(t, l)) return qty / 1000;
    return qty; // fallback
  };

  // Descontar inventario de ingredientes según receta por productos vendidos
  const processRecipeConsumption = async (saleId: string) => {
    try {
      const uniqueNames = Array.from(new Set(selectedProducts.map(p => p.name)));
      // Cargar recetas por nombre
      const {
        data: recipesData
      } = await supabase.from('recipes').select('name, ingredients').in('name', uniqueNames);
      const recipes: Array<{
        name: string;
        ingredients: any[];
      }> = recipesData as any || [];
      if (!recipes || recipes.length === 0) return;
      for (const sold of selectedProducts) {
        const recipe = recipes.find(r => r.name === sold.name);
        if (!recipe || !Array.isArray(recipe.ingredients)) continue;
        for (const ing of recipe.ingredients) {
          const ingredientProductId = ing.ingredient_product_id as string | undefined;
          // Buscar producto de ingrediente por id primero, si no por nombre
          let rawId = ingredientProductId || '';
          if (!rawId && ing.name) {
            const {
              data: found
            } = await supabase.from('products').select('id').eq('user_id', user?.id).ilike('name', `%${ing.name}%`).limit(1);
            rawId = found && found.length ? found[0].id : '';
          }
          if (!rawId) continue;

          // Obtener inventario para conocer la unidad
          const {
            data: inv
          } = await supabase.from('inventory').select('id, current_stock, unit').eq('product_id', rawId).maybeSingle();
          if (!inv) continue;
          const perUnitQty = Number(ing.quantity) || 0;
          const needed = perUnitQty * sold.quantity;
          const converted = convertUnit(needed, String(ing.unit || ''), String(inv.unit || ''));
          const newStock = Math.max(0, (inv.current_stock || 0) - converted);
          await supabase.from('inventory').update({
            current_stock: newStock,
            last_updated: new Date().toISOString()
          }).eq('id', inv.id);
          await supabase.from('inventory_movements').insert({
            product_id: rawId,
            movement_type: 'OUT',
            quantity: converted,
            reference_type: 'SALE_RECIPE',
            reference_id: saleId,
            notes: `Consumo por receta: ${sold.quantity} x ${sold.name}`
          });
        }
      }
    } catch (err) {
      console.error('Error procesando consumo por receta:', err);
    }
  };
  // Cargar orden de mesa SIEMPRE desde DB - es la fuente de verdad
  const loadTableOrder = async (tableNumber: number) => {
    if (!profile?.restaurant_id) return;
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('table_states')
        .select('current_order, order_total, status')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', tableNumber)
        .single();
      
      if (error) {
        console.error('Error cargando orden de mesa:', error);
        toast({
          title: "Error de carga",
          description: "No se pudo cargar la orden. Intenta nuevamente.",
          variant: "destructive"
        });
        setIsSyncing(false);
        return;
      }
      
      if (data?.current_order) {
        const orderProducts = Array.isArray(data.current_order) ? data.current_order : [];
        setSelectedProducts(orderProducts);
        console.log(`Mesa ${tableNumber} cargada con ${orderProducts.length} productos`);
      } else {
        setSelectedProducts([]);
      }
      
      setIsSyncing(false);
    } catch (error) {
      console.error('Error cargando orden de mesa:', error);
      setIsSyncing(false);
      toast({
        title: "Error",
        description: "No se pudo cargar la orden de la mesa",
        variant: "destructive"
      });
    }
  };
  const handleTableSelect = async (tableNumber: number) => {
    const table = tables.find(t => t.number === tableNumber);
    if (table?.status === 'ocupada') {
      // Orden ya ocupada - cargar productos existentes y ir al menú
      setSelectedTable(tableNumber);
      await loadTableOrder(tableNumber);
      setCurrentView('menu');
    } else {
      // Orden libre - mostrar modal de comensales
      setSelectedTableForGuests(tableNumber);
      setShowGuestModal(true);
    }
  };
  const confirmTableSelection = async () => {
    if (!guestCount || parseInt(guestCount) <= 0) {
      toast({
        title: "Error",
        description: "Ingresa un número válido de comensales",
        variant: "destructive"
      });
      return;
    }
    if (!profile?.restaurant_id || !selectedTableForGuests) return;
    const guests = parseInt(guestCount);
    setSelectedTable(selectedTableForGuests);
    setCurrentView('menu');
    try {
      // Actualizar estado de mesa en la base de datos con manejo de conflictos
      const {
        error
      } = await supabase.from('table_states').upsert({
        restaurant_id: profile.restaurant_id,
        table_number: selectedTableForGuests,
        status: 'ocupada',
        guest_count: guests,
        current_order: [],
        order_total: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'restaurant_id,table_number'
      });
      if (error) throw error;

      // Actualizar estado local
      setTables(prevTables => prevTables.map(table => table.number === selectedTableForGuests ? {
        ...table,
        status: 'ocupada',
        customers: guests,
        guestCount: guests,
        currentOrder: [],
        orderTotal: 0
      } : table));
      toast({
        title: "Orden abierta",
        description: `Orden ${selectedTableForGuests} abierta para ${guests} comensales`
      });
    } catch (error) {
      console.error('Error actualizando mesa:', error);
      toast({
        title: "Error",
        description: "No se pudo abrir la orden. Intenta nuevamente.",
        variant: "destructive"
      });
    }

    // Reset modal
    setShowGuestModal(false);
    setGuestCount('');
    setSelectedTableForGuests(null);
  };
  // Función interna para procesar el pago real
  const processPaymentInternal = async () => {
    const total = calculateTotal();
    
    // ACTIVAR estado de procesamiento INMEDIATAMENTE
    setIsProcessing(true);
    toast({
      title: "⏳ Procesando pago...",
      description: "Por favor espera mientras registramos la venta"
    });
    
    try {
      // Verificar si hay ajuste de propina pendiente
      const pendingAdjustment = localStorage.getItem('pending_tip_adjustment');
      let tipAdjustmentData: { reasonType: string; reasonComment: string } | null = null;
      if (pendingAdjustment) {
        tipAdjustmentData = JSON.parse(pendingAdjustment);
        localStorage.removeItem('pending_tip_adjustment');
      }
      
      // 1. Guardar la venta en Supabase
      const {
        data: saleData,
        error: saleError
      } = await supabase.from('sales').insert({
        user_id: user?.id,
        total_amount: total,
        payment_method: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo',
        table_number: selectedTable,
        customer_email: customerEmail || null
      }).select().single();
      if (saleError) {
        throw saleError;
      }
      if (!saleData) {
        throw new Error('No se pudo crear la venta');
      }

      // 2. Guardar los items de la venta
      const saleItems = selectedProducts.map(product => ({
        sale_id: saleData.id,
        product_id: product.id,
        quantity: product.quantity,
        unit_price: product.price,
        subtotal: product.price * product.quantity
      }));
      const {
        error: itemsError
      } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) {
        throw itemsError;
      }

      // 3. Descuento automático de inventario según recetas
      await processRecipeConsumption(saleData.id);

      // 4. Actualizar inventario (el trigger se encarga automáticamente para productos directos)
      // 4. Actualizar estado local y global para mantener sincronización
      const sale: Sale = {
        id: `SALE-${saleData.id}`,
        products: selectedProducts.map(p => ({
          productId: p.id,
          quantity: p.quantity,
          price: p.price
        })),
        total: total,
        paymentMethod: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo',
        table: selectedTable || undefined,
        date: new Date().toISOString(),
        status: 'completed'
      };
      dispatch({
        type: 'ADD_SALE',
        payload: sale
      });

      // 5. Crear y guardar factura en Supabase
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(saleData.id).slice(0, 8).toUpperCase()}`;
      const paymentMethodName = paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo';
      
      let invoiceId: string | null = null;
      if (profile?.restaurant_id) {
        try {
          console.log('📄 Guardando factura en Supabase...');
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              restaurant_id: profile.restaurant_id,
              sale_id: saleData.id,
              invoice_number: invoiceNumber,
              invoice_type: 'pos_receipt',
              payment_method: paymentMethodName,
              subtotal: calculateSubtotal(),
              tax_amount: 0,
              total_amount: total,
              created_by: user?.id,
              sent_to_email: !!customerEmail,
              sent_at: customerEmail ? new Date().toISOString() : null
            })
            .select()
            .single();
          
          if (invoiceError) {
            console.error('❌ Error guardando factura:', invoiceError);
          } else {
            invoiceId = invoiceData?.id;
            console.log('✅ Factura guardada:', invoiceId);
          }
          
          // 5.1 Guardar en business_documents para archivo del día
          const today = new Date().toISOString().split('T')[0];
          const { error: docError } = await supabase
            .from('business_documents')
            .insert({
              restaurant_id: profile.restaurant_id,
              user_id: user?.id || '',
              document_type: 'invoice',
              title: `Factura ${invoiceNumber} - Mesa ${selectedTable || 'N/A'}`,
              document_date: today,
              content: {
                invoice_number: invoiceNumber,
                sale_id: saleData.id,
                table_number: selectedTable,
                customer_email: customerEmail,
                items: selectedProducts.map(p => ({
                  name: p.name,
                  quantity: p.quantity,
                  price: p.price,
                  subtotal: p.price * p.quantity
                })),
                subtotal: calculateSubtotal(),
                total: total,
                payment_method: paymentMethodName,
                tip_amount: calculateTipAmount()
              },
              metadata: {
                invoice_id: invoiceId,
                processed_at: new Date().toISOString(),
                source: 'billing'
              }
            });
          
          if (docError) {
            console.error('❌ Error guardando documento:', docError);
          } else {
            console.log('✅ Documento archivado para el día:', today);
          }
        } catch (err) {
          console.error('💥 Error en persistencia de factura:', err);
        }
      }
      
      // Dispatch local para mantener sincronización de UI
      const invoice = {
        id: invoiceNumber,
        clientName: `Cliente Orden ${selectedTable}`,
        items: selectedProducts.map(p => ({
          description: p.name,
          quantity: p.quantity,
          price: p.price
        })),
        subtotal: calculateSubtotal(),
        tax: 0,
        total: total,
        date: new Date().toISOString(),
        status: 'paid',
        paymentMethod: paymentMethodName
      };
      dispatch({
        type: 'ADD_INVOICE',
        payload: invoice
      });

      // 5.1 Enviar factura por email (Edge Function)
      try {
        if (customerEmail && customerEmail.includes('@')) {
          console.log('📧 Preparando envío de factura (Billing)...');
          const invoiceData = {
            customerEmail: customerEmail,
            customerName: customerEmail.split('@')[0],
            restaurantName: 'Mi Restaurante',
            invoiceNumber: String(saleData.id).slice(0, 8),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            items: selectedProducts.map(p => ({
              name: p.name,
              quantity: p.quantity,
              price: p.price,
              total: p.price * p.quantity
            })),
            subtotal: calculateSubtotal(),
            service: 0,
            // No servicio para negocios de comida
            tax: 0,
            // Solo impoconsumo, se calcula en el backend
            total: total,
            paymentMethod: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo'
          };
          console.log('📝 Datos de factura a enviar:', invoiceData);
          const {
            data,
            error
          } = await supabase.functions.invoke('send-invoice', {
            body: invoiceData
          });
          console.log('📨 Respuesta send-invoice:', {
            data,
            error
          });
          if (error || !data?.success) {
            console.error('❌ Error al enviar email:', error || data);
            toast({
              title: 'No se pudo enviar el email',
              description: 'La venta fue registrada, pero el correo falló. Revisa los logs.',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Factura enviada',
              description: `Enviada a ${customerEmail}`
            });
          }
        }
      } catch (err) {
        console.error('💥 Excepción enviando email:', err);
        toast({
          title: 'Error al enviar email',
          description: 'La venta fue registrada, pero el email falló.',
          variant: 'destructive'
        });
      }

      // 6. Actualizar estadísticas locales
      setRealSalesData(prev => ({
        ...prev,
        dailySales: prev.dailySales + total,
        dailyOrders: prev.dailyOrders + 1
      }));

      // 7. Liberar orden en la base de datos
      if (profile?.restaurant_id && selectedTable) {
        try {
          await supabase.from('table_states').upsert({
            restaurant_id: profile.restaurant_id,
            table_number: selectedTable,
            status: 'libre',
            guest_count: 0,
            current_order: [],
            order_total: 0,
            updated_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error liberando mesa:', error);
        }
      }

      // Actualizar estado local
      setTables(prevTables => prevTables.map(table => table.number === selectedTable ? {
        ...table,
        status: 'libre',
        customers: 0,
        currentOrder: null,
        guestCount: 0,
        orderTotal: 0
      } : table));

      // 8. Recargar productos para actualizar stock
      await loadProductsFromDB();
      
      // 8.1 Log de auditoría - registrar la venta completada
      try {
        await logAction({
          action: 'sale_completed',
          tableName: 'sales',
          recordId: saleData.id,
          newValues: {
            total_amount: total,
            table_number: selectedTable,
            payment_method: paymentMethods.find(m => m.id === paymentMethod)?.name,
            items_count: selectedProducts.length,
            tip_amount: calculateTipAmount()
          }
        });
      } catch (auditError) {
        console.error('Error logging sale:', auditError);
      }
      
      // 8.2 Si hubo ajuste de propina, guardarlo
      if (tipAdjustmentData && isTipReduced()) {
        await saveTipAdjustment(saleData.id, tipAdjustmentData.reasonType, tipAdjustmentData.reasonComment);
      }
      
      // 9. Si hay propina y está configurada la distribución, mostrar modal
      const currentTipAmount = calculateTipAmount();
      const canDistribute = tipConfig.tipCashierCanDistribute || profile?.role === 'owner' || profile?.role === 'admin';
      
      if (tipConfig.tipEnabled && currentTipAmount > 0 && canDistribute) {
        setPendingSaleIdForTip(saleData.id);
        setPendingTipAmountForDistribution(currentTipAmount);
        setShowTipDistributionModal(true);
        // No mostrar success inmediatamente, esperar al modal
        toast({
          title: "✅ ¡Venta registrada!",
          description: `Orden ${selectedTable} - ${formatCurrency(total)} | Ahora distribuye la propina`
        });
      } else {
        setCurrentView('success');
        toast({
          title: "✅ ¡Pago completado!",
          description: `Factura guardada y archivada | Orden ${selectedTable} - ${formatCurrency(total)}`
        });

        // Reset after 3 seconds
        setTimeout(() => {
          setCurrentView('tables');
          setSelectedTable(null);
          setSelectedProducts([]);
          setPaymentMethod('');
          setCustomerEmail('');
          setTipAmount(0);
          setCustomTipAmount('');
          setNoTip(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "❌ Error al procesar pago",
        description: "Hubo un problema al guardar la venta. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      // SIEMPRE desactivar estado de procesamiento
      setIsProcessing(false);
    }
  };
  
  // Función principal de pago - verifica si necesita mostrar modal de ajuste de propina
  const handlePayment = async () => {
    // Si está habilitada la verificación de motivo y la propina ha bajado
    if (tipConfig.tipEnabled && tipConfig.requireReasonIfDecrease && isTipReduced()) {
      setInitialSuggestedTip(getSuggestedTipAmount());
      setPendingPaymentCallback(() => processPaymentInternal);
      setShowTipAdjustmentModal(true);
      return;
    }
    
    // Si no hay reducción de propina, procesar directamente
    await processPaymentInternal();
  };
  const handleProductCreated = () => {
    loadProductsFromDB();
    loadCategoriesFromDB();
    setShowProductCreator(false);
    setEditingProductWithAI(null);
    toast({
      title: editingProductWithAI ? "Producto actualizado" : "Producto creado",
      description: editingProductWithAI ? "El costo del producto ha sido actualizado exitosamente" : "El producto ha sido agregado exitosamente"
    });
  };
  const handleNeedCostCalculation = (productData: any) => {
    setPendingProductData(productData);
    setShowProductCreator(false);

    // Mensaje inicial para IA con guía paso a paso y solicitud de confirmación antes de actualizar
    const aiMessage = `Quiero calcular el costo unitario de un producto nuevo y necesito que me guíes paso a paso haciéndome preguntas.

Producto:
- Nombre: ${productData.name}
- Descripción: ${productData.description}
${productData.price ? `- Precio de venta propuesto: ${formatCurrency(productData.price)}` : ''}

Por favor:
1) Hazme preguntas necesarias (ingredientes, cantidades, mermas, tiempos, etc.)
2) Entrega un costo estimado con desglose
3) NO actualices aún. Propón el costo en un bloque [PROPOSED_COST] con JSON y pide autorización
4) Cuando te responda "Sí, actualizar" o presione el botón de confirmar, podrás actualizar el producto.`;

    // Guardar mensaje pre-cargado para AIAssistant y cambiar al módulo de IA
    localStorage.setItem('ai_preload_message', JSON.stringify({
      message: aiMessage,
      metadata: {
        type: 'cost_calc',
        product: productData
      }
    }));
    dispatch({
      type: 'SET_ACTIVE_MODULE',
      payload: 'ai'
    });
    toast({
      title: "Redirigiendo a Conektao AI",
      description: "Te guiaremos para calcular el costo y confirmar la actualización"
    });
  };

  // Vista de éxito
  if (currentView === 'success') {
    return <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">¡Pago Exitoso!</h2>
            <p className="text-green-600 mb-4">Orden {selectedTable}</p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-green-800">{formatCurrency(calculateTotal())}</p>
              <p className="text-sm text-green-600">Pagado con {paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">Regresando al inicio...</p>
          </CardContent>
        </Card>
      </div>;
  }

  // Vista de pago
  if (currentView === 'payment') {
    return <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('menu')} className="rounded-full border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Finalizar Pago</h1>
              <p className="text-white/60">Orden {selectedTable}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Resumen de orden */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Receipt className="h-5 w-5" />
                  Resumen de la orden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {selectedProducts.map(product => <div key={product.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-sm text-white/60">
                            {product.quantity} × {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-white">
                        {formatCurrency(product.price * product.quantity)}
                      </span>
                    </div>)}
                </div>
                
                <Separator className="my-4 bg-white/10" />
                
                <div className="space-y-2 text-white">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  {tipConfig.tipEnabled && <div className="flex justify-between">
                      <span>Propina ({tipConfig.defaultTipPercentage}%)</span>
                      <span>{formatCurrency(calculateTipAmount())}</span>
                    </div>}
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-orange-400">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de propina */}
            {tipConfig.tipEnabled && <Card className="bg-gray-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Propina</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="noTip" checked={noTip} onChange={e => {
                    setNoTip(e.target.checked);
                    if (e.target.checked) {
                      setCustomTipAmount('');
                    }
                  }} className="rounded border-gray-300" />
                      <Label htmlFor="noTip" className="text-white">No dio propina</Label>
                    </div>
                    
                    {!noTip && <>
                        <div className="space-y-2">
                          <Label className="text-white">Propina sugerida ({tipConfig.defaultTipPercentage}%): {formatCurrency(calculateSubtotal() * tipConfig.defaultTipPercentage / 100)}</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="customTip" className="text-white">Propina personalizada (opcional)</Label>
                          <Input id="customTip" type="number" placeholder="Ingrese monto personalizado" value={customTipAmount} onChange={e => setCustomTipAmount(e.target.value)} min="0" className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40" />
                          <p className="text-xs text-white/60">
                            Si ingresa un monto, se usará en lugar del porcentaje sugerido
                          </p>
                        </div>
                        
                        <div className="bg-gray-700/30 p-3 rounded-lg">
                          <p className="text-sm font-medium text-white">
                            Propina total: {formatCurrency(calculateTipAmount())}
                          </p>
                        </div>
                      </>}
                  </div>
                </CardContent>
              </Card>}

            {/* Métodos de pago */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Método de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  return <Button key={method.id} variant={paymentMethod === method.id ? "default" : "outline"} className={`h-16 flex-col gap-2 ${paymentMethod === method.id ? `bg-gradient-to-r ${method.color} text-white border-none` : "border-white/20 text-white hover:bg-white/10"}`} onClick={() => handlePaymentMethodSelect(method.id)}>
                        <IconComponent className="h-5 w-5" />
                        <span className="text-sm">{method.name}</span>
                      </Button>;
                })}
                </div>

                {/* Campos adicionales según método de pago */}
                {paymentMethod === 'tarjeta' && <div className="bg-blue-900/30 p-4 rounded-lg space-y-3 border border-blue-500/30">
                    <h4 className="font-semibold text-blue-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Información de Tarjeta
                    </h4>
                    <div>
                      <Label htmlFor="voucher" className="text-white">Código de Voucher</Label>
                      <Input id="voucher" placeholder="Ingrese el código del voucher" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40" />
                      <p className="text-xs text-blue-300 mt-1">*Opcional - Para verificación del pago</p>
                    </div>
                  </div>}

                {(paymentMethod === 'transferencia' || paymentMethod === 'daviplata' || paymentMethod === 'nequi') && <div className="bg-purple-900/30 p-4 rounded-lg space-y-4 border border-purple-500/30" data-scroll-target="proof">
                    <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Comprobante de Pago
                    </h4>
                    
                    <div className="space-y-3">
                      <Label className="text-white">Subir comprobante (Opcional)</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input type="file" accept="image/*" onChange={handleFileUpload} className="bg-gray-700/50 border-white/20 text-white" />
                        </div>
                        <Button type="button" variant="outline" onClick={() => {
                      // Simular tomar foto con cámara
                      toast({
                        title: "Función de cámara",
                        description: "En la app móvil podrás tomar foto directamente"
                      });
                    }} className="border-white/20 hover:bg-white/10 text-white">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {paymentProofPreview && <div className="mt-3">
                          <Label className="text-white">Vista previa del comprobante:</Label>
                          <div className="mt-2 p-2 border border-white/20 rounded-lg">
                            <img src={paymentProofPreview} alt="Comprobante de pago" className="max-w-full h-32 object-contain mx-auto rounded" />
                          </div>
                        </div>}
                      
                      <p className="text-xs text-purple-300">
                        *Opcional - Puedes agregar el comprobante ahora o después
                      </p>
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {/* Botón de pago con estado de procesamiento */}
            <Button 
              onClick={handlePayment} 
              disabled={!paymentMethod || isProcessing} 
              className={`w-full h-14 text-lg transition-all duration-300 ${
                isProcessing 
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 cursor-wait' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Procesar Pago {formatCurrency(calculateTotal())}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Modal de correo electrónico */}
        {showEmailModal && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
              <div className="relative overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
                  <div className="relative">
                    <h3 className="text-2xl font-bold mb-2">📧 Correo del Cliente</h3>
                    <p className="text-white/90 text-sm">Solicita el correo para enviar la factura</p>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">
                      Método: {paymentMethods.find(m => m.id === pendingPaymentMethod)?.name}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Pregunta al cliente su correo electrónico
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo Electrónico del Cliente
                    </Label>
                    <Input id="email" type="email" placeholder="cliente@ejemplo.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="h-12 border-2 focus:border-green-500 transition-colors" autoFocus />
                    <p className="text-xs text-muted-foreground">
                      ✅ Se enviará la factura al correo del cliente
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                  setShowEmailModal(false);
                  setCustomerEmail('');
                  setPendingPaymentMethod('');
                }} className="flex-1 h-12 border-2 hover:border-muted-foreground transition-colors">
                      Cancelar
                    </Button>
                    <Button onClick={confirmPaymentMethod} disabled={!customerEmail.trim() || !customerEmail.includes('@')} className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90 transition-opacity">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </div>;
  }

  // Vista del menú
  if (currentView === 'menu') {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b">
          <div className="p-4 bg-stone-950">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setCurrentView('tables')} className="rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">Orden {selectedTable}</h1>
                    {/* Indicador de sincronización */}
                    {isSyncing && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full animate-pulse">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                        <span className="text-xs text-yellow-700 font-medium">Guardando...</span>
                      </div>
                    )}
                    {syncError && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-700 font-medium">{syncError}</span>
                      </div>
                    )}
                    {!isSyncing && !syncError && selectedProducts.length > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-700 font-medium">Guardado</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Selecciona productos</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <button onClick={() => {
                    const currentTable = tables.find(t => t.number === selectedTable);
                    const currentGuests = currentTable?.guestCount || currentTable?.customers || 1;
                    const newGuests = prompt(`Número actual de comensales: ${currentGuests}\n\nIngresa el nuevo número:`, currentGuests.toString());
                    if (newGuests && parseInt(newGuests) > 0) {
                      setTables(prevTables => prevTables.map(table => table.number === selectedTable ? {
                        ...table,
                        customers: parseInt(newGuests),
                        guestCount: parseInt(newGuests)
                      } : table));
                      toast({
                        title: "Comensales actualizados",
                        description: `Orden ${selectedTable}: ${newGuests} personas`
                      });
                    }
                  }} className="text-xs transition-colors font-medium border-b border-dashed border-primary/30 hover:border-primary/60 text-cyan-500">
                      {tables.find(t => t.number === selectedTable)?.guestCount || tables.find(t => t.number === selectedTable)?.customers || 1} personas
                    </button>
                  </div>
                </div>
              </div>
              {/* BOTONES DE ACCIÓN */}
              <div className="flex flex-wrap gap-2">
                {/* ENVIAR COMANDA A COCINA */}
                {selectedProducts.length > 0 && (
                  kitchenOrderSent ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium text-sm">Comanda enviada</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsKitchenModalOpen(true)}
                      disabled={kitchenLoading}
                      className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white font-bold shadow-lg"
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Enviar comanda
                      <Badge className="bg-white/20 text-white border-white/30 ml-2 text-xs">
                        {selectedProducts.length}
                      </Badge>
                    </Button>
                  )
                )}

                {/* ANULAR MESA - Único botón para cancelar/limpiar - USA openClearTableModal para CAPTURAR datos */}
                <Button
                  variant="destructive"
                  onClick={openClearTableModal}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg border-0"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  ANULAR MESA
                </Button>

                {/* IMPRIMIR CUENTA */}
                {selectedProducts.length > 0 && (
                  <Button onClick={() => {
                    const printContent = `
                      Orden ${selectedTable}
                      ${new Date().toLocaleString()}
                      
                      ${selectedProducts.map(p => `${p.name} - $${p.price.toLocaleString()}`).join('\n')}
                      
                      Total: $${selectedProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                    `;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><title>Cuenta Orden ${selectedTable}</title></head>
                          <body style="font-family: monospace; padding: 20px; white-space: pre-line;">
                            ${printContent}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                      printWindow.close();
                    }
                  }} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Printer className="h-4 w-4 mr-2" />
                    Cuenta
                  </Button>
                )}

                {/* COBRAR */}
                {selectedProducts.length > 0 && (
                  <Button 
                    onClick={() => {
                      if (!kitchenOrderSent) {
                        setShowNoKitchenWarning(true);
                      } else {
                        setCurrentView('payment');
                      }
                    }} 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Cobrar ({selectedProducts.length})
                  </Button>
                )}
              </div>

              {/* Alerta si hay productos sin enviar */}
              {selectedProducts.length > 0 && !kitchenOrderSent && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700 font-medium">
                    Recuerda enviar la comanda a cocina antes de cobrar
                  </p>
                </div>
              )}
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => {
              const IconComponent = category.icon;
              return <Button key={category.name} variant={selectedCategory === category.name ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category.name)} className={`flex items-center gap-2 whitespace-nowrap ${selectedCategory === category.name ? `bg-gradient-to-r ${category.color} text-white border-none` : ""}`}>
                    <IconComponent className="h-4 w-4" />
                    {category.name}
                  </Button>;
            })}
            </div>
          </div>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Precio</Label>
                <Input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProduct}>Guardar</Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará "{editingProduct?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="p-4 grid lg:grid-cols-4 gap-6 bg-neutral-950">
          {/* Lista de productos */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => <Card key={product.id} className="group hover:shadow-lg transition-all border-2 hover:border-primary/30 relative overflow-hidden">
                  {product.popular && <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>}
                  
                  <CardContent className="p-4">
                    {/* Área clickeable para agregar producto */}
                    <div className="text-center mb-3 cursor-pointer" onClick={() => addProduct(product)}>
                      <div className="text-4xl mb-2">{product.image}</div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </div>
                    </div>

                    {/* Área separada para botones de administración */}
                    {(profile?.role === 'owner' || profile?.role === 'admin' || profile?.permissions?.manage_products) && <div className="flex gap-1 mb-3 justify-center bg-muted/20 rounded-lg p-2">
                        <Button size="sm" variant="ghost" onMouseDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    openEditProduct(product);
                  }} title="Editar producto" className="hover:bg-primary/10">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onMouseDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    openProductCostCalculation(product);
                  }} title="Calcular costo con IA" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Brain className="h-4 w-4" />
                        </Button>
                        {profile?.role === 'owner' && <Button size="sm" variant="ghost" onMouseDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingProduct(product);
                    setDeleteDialogOpen(true);
                  }} title="Eliminar producto" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>}
                      </div>}
                    
                    <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:scale-105 transition-transform" onClick={() => addProduct(product)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Orden actual - sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="text-center">Orden Actual</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProducts.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                    <Coffee className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay productos</p>
                  </div> : <>
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {selectedProducts.map(product => <div key={product.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{product.image}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={e => {
                        e.stopPropagation();
                        removeProduct(product.id);
                      }} className="h-6 w-6 p-0">
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{product.quantity}</span>
                            <Button size="sm" variant="ghost" onClick={e => {
                        e.stopPropagation();
                        addProduct(product);
                      }} className="h-6 w-6 p-0">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {tipConfig.tipEnabled && <div className="flex justify-between">
                          <span>Propina</span>
                          <span>{formatCurrency(calculateTipAmount())}</span>
                        </div>}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción flotantes/sticky */}
        {selectedProducts.length > 0 && <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-3 flex gap-3">
              <Button onClick={() => {
            // Función para imprimir cuenta
            const printContent = `
                    Orden ${selectedTable}
                    ${new Date().toLocaleString()}
                    
                    ${selectedProducts.map(p => `${p.name} - $${p.price.toLocaleString()}`).join('\n')}
                    
                    Total: $${selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toLocaleString()}
                  `;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                      <html>
                        <head><title>Cuenta Orden ${selectedTable}</title></head>
                        <body style="font-family: monospace; padding: 20px; white-space: pre-line;">
                          ${printContent}
                        </body>
                      </html>
                    `);
              printWindow.document.close();
              printWindow.print();
              printWindow.close();
            }
          }} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Printer className="h-5 w-5 mr-2" />
                Cuenta
              </Button>
              <Button onClick={() => setCurrentView('payment')} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-semibold">
                <Receipt className="h-5 w-5 mr-2" />
                Cobrar ({selectedProducts.length})
              </Button>
            </div>
          </div>}
          
        {/* Modal de confirmación para ANULAR/LIBERAR MESA - DENTRO de vista menu */}
        <AlertDialog open={showClearTableModal} onOpenChange={(open) => !open && closeClearTableModal()}>
          <AlertDialogContent className={`max-w-md ${(clearTableData?.products.length ?? 0) > 0 ? 'border-red-200 bg-gradient-to-b from-red-50 to-white' : 'border-cyan-200 bg-gradient-to-b from-cyan-50 to-white'}`}>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse' : 'bg-gradient-to-br from-cyan-500 to-cyan-700'}`}>
                  {(clearTableData?.products.length ?? 0) > 0 ? (
                    <AlertTriangle className="h-7 w-7 text-white" />
                  ) : (
                    <CheckCircle className="h-7 w-7 text-white" />
                  )}
                </div>
                <div>
                  <AlertDialogTitle className={`text-xl font-bold ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-700' : 'text-cyan-700'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? `⚠️ Anular mesa ${clearTableData?.tableNumber}` : `Liberar mesa ${clearTableData?.tableNumber}`}
                  </AlertDialogTitle>
                  <p className={`text-xs font-medium ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-500' : 'text-cyan-500'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Acción crítica con auditoría' : 'Marcar mesa como disponible'}
                  </p>
                </div>
              </div>
              <AlertDialogDescription className={`text-base p-3 rounded-lg border ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-red-100 border-red-200' : 'bg-cyan-100 border-cyan-200'}`}>
                {(clearTableData?.products.length ?? 0) > 0 ? (
                  <>
                    <strong className="text-red-700">Esto eliminará la orden y liberará la mesa.</strong>
                    <br />
                    <span className="text-red-600">Quedará registro permanente para auditoría del dueño.</span>
                  </>
                ) : (
                  <span className="text-cyan-700">Esta mesa está vacía. Se liberará para nuevos clientes.</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4 space-y-4">
              {/* Resumen de la orden - USANDO DATOS CAPTURADOS */}
              <div className={`p-4 rounded-lg border ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-cyan-50 border-cyan-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-700' : 'text-cyan-700'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Orden a anular:' : 'Estado actual:'}
                  </span>
                  <Badge variant={(clearTableData?.products.length ?? 0) > 0 ? "destructive" : "secondary"} className="text-xs">
                    Mesa {clearTableData?.tableNumber}
                  </Badge>
                </div>
                <div className={`space-y-1 text-sm ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-600' : 'text-cyan-600'}`}>
                  <p>• <strong>{clearTableData?.products.length ?? 0}</strong> productos</p>
                  <p>• Total: <strong>{formatCurrency(clearTableData?.total ?? 0)}</strong></p>
                </div>
                {(clearTableData?.products.length ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200 max-h-24 overflow-y-auto">
                    {clearTableData?.products.map((p, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {p.quantity}x {p.name} - {formatCurrency(p.price * p.quantity)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Motivo - obligatorio solo si hay productos */}
              {(clearTableData?.products.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="clearReasonMenu" className="text-red-700 font-semibold flex items-center gap-2">
                    <span>Motivo de anulación</span>
                    <Badge variant="outline" className="text-xs border-red-300 text-red-600">Obligatorio</Badge>
                  </Label>
                  <Textarea
                    id="clearReasonMenu"
                    placeholder="Ej: Error de comanda, cliente se fue, producto devuelto, otro..."
                    value={clearTableReason}
                    onChange={(e) => setClearTableReason(e.target.value)}
                    className="min-h-[80px] border-red-200 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
              )}
            </div>
            
            <AlertDialogFooter className={`flex-col sm:flex-row gap-2 pt-4 border-t ${(clearTableData?.products.length ?? 0) > 0 ? 'border-red-200' : 'border-cyan-200'}`}>
              <AlertDialogCancel 
                disabled={isClearingTable}
                onClick={() => closeClearTableModal()}
                className="w-full sm:w-auto border-2"
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                type="button"
                variant={(clearTableData?.products.length ?? 0) > 0 ? "destructive" : "default"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('>>> CONFIRMAR ANULACIÓN/LIBERAR clicked (from menu view) <<<', { clearTableData });
                  handleClearTable();
                }}
                disabled={isClearingTable || ((clearTableData?.products.length ?? 0) > 0 && !clearTableReason.trim())}
                className={`w-full sm:w-auto font-bold shadow-lg ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'}`}
              >
                {isClearingTable ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Anulando...' : 'Liberando...'}
                  </>
                ) : (
                  <>
                    {(clearTableData?.products.length ?? 0) > 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        CONFIRMAR ANULACIÓN
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        LIBERAR MESA
                      </>
                    )}
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>;
  }

  // Vista de caja
  if (currentView === 'cash') {
    return <CashManagement onBack={() => setCurrentView('tables')} />;
  }

  // Vista principal - selección de órdenes
  return <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-2">
            Sistema de Facturación
          </h1>
          <p className="text-muted-foreground">Selecciona una orden para comenzar</p>
        </div>
        <Button onClick={() => setCurrentView('cash')} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Wallet className="h-5 w-5 mr-2" />
          💰 Caja
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Selección de órdenes */}
      {currentView === 'tables' && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Órdenes Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map(table => <Button key={table.number} variant="outline" onClick={() => handleTableSelect(table.number)} className={`h-24 flex-col gap-2 transition-all duration-300 rounded-xl hover:scale-105 bg-gradient-to-br from-gray-900 via-gray-950 to-black ${table.status === 'libre' ? 'border-4 border-green-500 hover:border-green-400 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-4 border-red-500 hover:border-red-400 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-orange-500/5 before:via-transparent before:to-cyan-500/5 before:pointer-events-none'} relative overflow-hidden`}>
                <Utensils className={`h-5 w-5 ${table.status === 'libre' ? 'text-green-500' : 'text-red-500'}`} />
                
                <div className="text-center">
                  <div className={`font-bold text-sm ${table.status === 'libre' ? 'text-green-400' : 'text-red-400'}`}>
                    Orden {table.number}
                  </div>
                  {table.status === 'libre' ? <div className="text-xs text-green-400 font-medium">
                      Disponible
                    </div> : <div className="text-xs text-gray-300 space-y-1">
                      <div>{table.customers} personas</div>
                      {table.orderTotal > 0 && <div className="text-sm font-bold text-red-400">
                          {formatCurrency(table.orderTotal)}
                        </div>}
                    </div>}
                </div>
              </Button>)}
          </div>
        </CardContent>
      </Card>}
      
      {/* Botón para crear nuevos artículos */}
      {currentView === 'tables' && (profile?.role === 'owner' || profile?.role === 'admin' || profile?.permissions?.manage_products) && <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={() => setShowProductCreator(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full h-14 w-14" size="lg">
            <Plus className="h-6 w-6" />
          </Button>
        </div>}

      {/* Modal de creación de productos */}
      {showProductCreator && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-xl">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {editingProductWithAI ? `Calcular Costo - ${editingProductWithAI.name}` : 'Crear Nuevo Artículo'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
            setShowProductCreator(false);
            setEditingProductWithAI(null);
          }} className="rounded-full hover:bg-accent">
                ✕
              </Button>
            </div>
            <div className="p-6">
              <ProductCreatorNew onProductCreated={handleProductCreated} existingProduct={editingProductWithAI} />
            </div>
          </div>
        </div>}

        {/* Modal para número de comensales */}
        {showGuestModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl max-w-md w-full p-6 shadow-2xl opacity-80 bg-stone-950">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Orden {selectedTableForGuests}</h2>
                <p className="text-neutral-600">¿Cuántas personas van a comer?</p>
              </div>
              
              <div className="space-y-4">
                <Input type="number" placeholder="Número de comensales" value={guestCount} onChange={e => setGuestCount(e.target.value)} min="1" max="20" className="text-center text-lg" autoFocus />
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
              setShowGuestModal(false);
              setGuestCount('');
              setSelectedTableForGuests(null);
            }} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={confirmTableSelection} className="flex-1" disabled={!guestCount || parseInt(guestCount) <= 0}>
                    Abrir Orden
                  </Button>
                </div>
              </div>
            </div>
          </div>}

        {/* Modal de distribución de propinas */}
        <TipDistributionModal
          open={showTipDistributionModal}
          onClose={() => {
            setShowTipDistributionModal(false);
            // Después de cerrar el modal, ir a success
            setCurrentView('success');
            setTimeout(() => {
              setCurrentView('tables');
              setSelectedTable(null);
              setSelectedProducts([]);
              setPaymentMethod('');
              setCustomerEmail('');
              setTipAmount(0);
              setCustomTipAmount('');
              setNoTip(false);
              setPendingSaleIdForTip(null);
              setPendingTipAmountForDistribution(0);
            }, 3000);
          }}
          totalTipAmount={pendingTipAmountForDistribution}
          saleId={pendingSaleIdForTip || ''}
          onDistributed={() => {
            setShowTipDistributionModal(false);
            setCurrentView('success');
            setTimeout(() => {
              setCurrentView('tables');
              setSelectedTable(null);
              setSelectedProducts([]);
              setPaymentMethod('');
              setCustomerEmail('');
              setTipAmount(0);
              setCustomTipAmount('');
              setNoTip(false);
              setPendingSaleIdForTip(null);
              setPendingTipAmountForDistribution(0);
            }, 3000);
          }}
        />
        
        {/* Modal de ajuste de propina */}
        <TipAdjustmentModal
          open={showTipAdjustmentModal}
          onOpenChange={setShowTipAdjustmentModal}
          suggestedTipAmount={initialSuggestedTip}
          newTipAmount={calculateTipAmount()}
          subtotal={calculateSubtotal()}
          defaultTipPercent={tipConfig.defaultTipPercentage}
          onConfirm={handleTipAdjustmentConfirm}
          onCancel={handleTipAdjustmentCancel}
        />

        {/* Modal de cocina */}
        <KitchenOrderModal
          isOpen={isKitchenModalOpen}
          onClose={() => setIsKitchenModalOpen(false)}
          onConfirmOrder={async (items, notes, priority, estimatedTime) => {
            try {
              await sendToKitchen(items, selectedTable || undefined, notes, priority as 'normal' | 'high' | 'urgent', estimatedTime);
              setKitchenOrderSent(true);
              setIsKitchenModalOpen(false);
              toast({
                title: "✅ Comanda enviada",
                description: `La orden de la mesa ${selectedTable} fue enviada a cocina`
              });
            } catch (error) {
              console.error('Error sending to kitchen:', error);
              toast({
                title: "Error",
                description: "No se pudo enviar la comanda a cocina",
                variant: "destructive"
              });
            }
          }}
          selectedProducts={selectedProducts.map(p => ({ 
            product: { 
              id: String(p.id), 
              name: p.name || 'Producto sin nombre', 
              price: p.price || 0,
              special_instructions: p.special_instructions 
            }, 
            quantity: p.quantity || 1 
          }))}
          tableNumber={selectedTable || undefined}
          orderType="dine-in"
        />

        {/* Modal de advertencia: Cobrar sin enviar comanda */}
        <AlertDialog open={showNoKitchenWarning} onOpenChange={setShowNoKitchenWarning}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <AlertDialogTitle className="text-xl">¡No enviaste la comanda!</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Vas a cobrar sin haber enviado la orden a cocina. Esto quedará registrado para auditoría.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Orden {selectedTable}</strong> • {selectedProducts.length} productos • {formatCurrency(selectedProducts.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0))}
              </p>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="default"
                onClick={() => {
                  setShowNoKitchenWarning(false);
                  setIsKitchenModalOpen(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 w-full sm:w-auto"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Enviar comanda primero
              </Button>
              <AlertDialogAction
                onClick={async () => {
                  // Registrar evento sospechoso
                  await logSuspiciousEvent({
                    eventType: 'PAYMENT_ATTEMPT_WITHOUT_KITCHEN_ORDER',
                    tableNumber: selectedTable || undefined,
                    hasItems: true,
                    itemsCount: selectedProducts.length,
                    orderTotal: selectedProducts.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0),
                    metadata: {
                      products: selectedProducts.map(p => ({ name: p.name, price: p.price, quantity: p.quantity || 1 })),
                      timestamp: new Date().toISOString()
                    }
                  });
                  
                  setShowNoKitchenWarning(false);
                  setCurrentView('payment');
                }}
                className="bg-muted hover:bg-muted/80 text-foreground w-full sm:w-auto"
              >
                Continuar sin enviar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de confirmación para ANULAR/LIBERAR MESA - USA clearTableData (datos capturados) */}
        <AlertDialog open={showClearTableModal} onOpenChange={(open) => !open && closeClearTableModal()}>
          <AlertDialogContent className={`max-w-md ${(clearTableData?.products.length ?? 0) > 0 ? 'border-red-200 bg-gradient-to-b from-red-50 to-white' : 'border-cyan-200 bg-gradient-to-b from-cyan-50 to-white'}`}>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse' : 'bg-gradient-to-br from-cyan-500 to-cyan-700'}`}>
                  {(clearTableData?.products.length ?? 0) > 0 ? (
                    <AlertTriangle className="h-7 w-7 text-white" />
                  ) : (
                    <CheckCircle className="h-7 w-7 text-white" />
                  )}
                </div>
                <div>
                  <AlertDialogTitle className={`text-xl font-bold ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-700' : 'text-cyan-700'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? `⚠️ Anular mesa ${clearTableData?.tableNumber}` : `Liberar mesa ${clearTableData?.tableNumber}`}
                  </AlertDialogTitle>
                  <p className={`text-xs font-medium ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-500' : 'text-cyan-500'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Acción crítica con auditoría' : 'Marcar mesa como disponible'}
                  </p>
                </div>
              </div>
              <AlertDialogDescription className={`text-base p-3 rounded-lg border ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-red-100 border-red-200' : 'bg-cyan-100 border-cyan-200'}`}>
                {(clearTableData?.products.length ?? 0) > 0 ? (
                  <>
                    <strong className="text-red-700">Esto eliminará la orden y liberará la mesa.</strong>
                    <br />
                    <span className="text-red-600">Quedará registro permanente para auditoría del dueño.</span>
                  </>
                ) : (
                  <span className="text-cyan-700">Esta mesa está vacía. Se liberará para nuevos clientes.</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="my-4 space-y-4">
              {/* Resumen de la orden - USANDO DATOS CAPTURADOS */}
              <div className={`p-4 rounded-lg border ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-cyan-50 border-cyan-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-700' : 'text-cyan-700'}`}>
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Orden a anular:' : 'Estado actual:'}
                  </span>
                  <Badge variant={(clearTableData?.products.length ?? 0) > 0 ? "destructive" : "secondary"} className="text-xs">
                    Mesa {clearTableData?.tableNumber}
                  </Badge>
                </div>
                <div className={`space-y-1 text-sm ${(clearTableData?.products.length ?? 0) > 0 ? 'text-red-600' : 'text-cyan-600'}`}>
                  <p>• <strong>{clearTableData?.products.length ?? 0}</strong> productos</p>
                  <p>• Total: <strong>{formatCurrency(clearTableData?.total ?? 0)}</strong></p>
                </div>
                {(clearTableData?.products.length ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200 max-h-24 overflow-y-auto">
                    {clearTableData?.products.map((p, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {p.quantity}x {p.name} - {formatCurrency(p.price * p.quantity)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Motivo - obligatorio solo si hay productos */}
              {(clearTableData?.products.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="clearReason" className="text-red-700 font-semibold flex items-center gap-2">
                    <span>Motivo de anulación</span>
                    <Badge variant="outline" className="text-xs border-red-300 text-red-600">Obligatorio</Badge>
                  </Label>
                  <Textarea
                    id="clearReason"
                    placeholder="Ej: Error de comanda, cliente se fue, producto devuelto, otro..."
                    value={clearTableReason}
                    onChange={(e) => setClearTableReason(e.target.value)}
                    className="min-h-[80px] border-red-200 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
              )}
            </div>
            
            <AlertDialogFooter className={`flex-col sm:flex-row gap-2 pt-4 border-t ${(clearTableData?.products.length ?? 0) > 0 ? 'border-red-200' : 'border-cyan-200'}`}>
              <AlertDialogCancel 
                disabled={isClearingTable}
                onClick={() => closeClearTableModal()}
                className="w-full sm:w-auto border-2"
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                type="button"
                variant={(clearTableData?.products.length ?? 0) > 0 ? "destructive" : "default"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('>>> CONFIRMAR ANULACIÓN/LIBERAR clicked <<<', { clearTableData });
                  handleClearTable();
                }}
                disabled={isClearingTable || ((clearTableData?.products.length ?? 0) > 0 && !clearTableReason.trim())}
                className={`w-full sm:w-auto font-bold shadow-lg ${(clearTableData?.products.length ?? 0) > 0 ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'}`}
              >
                {isClearingTable ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {(clearTableData?.products.length ?? 0) > 0 ? 'Anulando...' : 'Liberando...'}
                  </>
                ) : (
                  <>
                    {(clearTableData?.products.length ?? 0) > 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        CONFIRMAR ANULACIÓN
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        LIBERAR MESA
                      </>
                    )}
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>;
};
export default Billing;