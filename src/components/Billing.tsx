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
import { 
  Plus,
  Search,
  Receipt,
  DollarSign,
  Calendar,
  Users,
  Utensils,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  Clock,
  Coffee,
  Pizza,
  Wine,
  IceCream,
  ChefHat,
  Sparkles,
  Eye,
  Download,
  TrendingUp,
  Wallet,
  Upload,
  Camera,
  Printer,
  Edit3,
  Trash2,
  Brain,
  Truck
} from 'lucide-react';
import CashManagement from './CashManagement';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import type { Sale } from '@/context/AppContext';
import ProductCreator from './ProductCreator';
import POSSystem from './POSSystem';

const Billing = () => {
  const { state, dispatch } = useApp();
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

  const { toast } = useToast();

  const { user, profile } = useAuth();

  // Estado para órdenes y datos reales
  const [tables, setTables] = useState(() => 
    Array.from({ length: 24 }, (_, i) => ({
      number: i + 1,
      status: 'libre',
      customers: 0,
      currentOrder: null,
      guestCount: 0, // Nuevo campo para número de comensales
      orderTotal: 0 // Total de la orden actual
    }))
  );
  
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
      const { error } = await supabase
        .from('products')
        .update({ price: parseFloat(editPrice) || 0, description: editDescription })
        .eq('id', editingProduct.id);
      if (error) throw error;
      toast({ title: 'Producto actualizado', description: 'Se guardaron los cambios.' });
      setEditDialogOpen(false);
      setEditingProduct(null);
      await loadProductsFromDB();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el producto', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    try {
      // Soft delete: marcar como inactivo para evitar conflictos de claves foráneas
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', editingProduct.id);
      if (error) throw error;
      toast({ title: 'Producto eliminado', description: 'El producto fue desactivado y ocultado del menú.' });
      setDeleteDialogOpen(false);
      setEditingProduct(null);
      await loadProductsFromDB();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' });
    }
  };
  
  const [realSalesData, setRealSalesData] = useState({
    dailySales: 0,
    dailyOrders: 0,
    totalOrders: 0,
    deliveryOrders: 0,
    dineInOrders: 0
  });

  // Estados para propinas
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [noTip, setNoTip] = useState(false);

// Usar cliente Supabase compartido tipado desde '@/integrations/supabase/client'

  // Cargar productos de la base de datos
  useEffect(() => {
    loadProductsFromDB();
    loadTodaysSales();
    loadTipSettings();
  }, [user, profile?.restaurant_id]);

  useEffect(() => {
    if (user && profile?.restaurant_id) {
      loadCategoriesFromDB();
    }
  }, [user, profile?.restaurant_id]);

  // Real-time synchronization for unified experience
  useEffect(() => {
    if (!user || !profile?.restaurant_id) return;

    // Subscribe to table_states changes for real-time sync between owner and employees
    const tableStatesChannel = supabase
      .channel('table_states_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_states',
          filter: `restaurant_id=eq.${profile.restaurant_id}`
        },
        () => {
          // Reload table states when any changes occur
          loadTodaysSales();
        }
      )
      .subscribe();

    // Subscribe to kitchen_orders for real-time updates
    const kitchenOrdersChannel = supabase
      .channel('kitchen_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kitchen_orders',
          filter: `restaurant_id=eq.${profile.restaurant_id}`
        },
        () => {
          // Reload when kitchen orders change
          loadTodaysSales();
        }
      )
      .subscribe();

    // Subscribe to sales for real-time updates
    const salesChannel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        () => {
          // Reload sales data for real-time updates
          loadTodaysSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tableStatesChannel);
      supabase.removeChannel(kitchenOrdersChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [user, profile?.restaurant_id]);

  // Efecto para limpiar productos seleccionados cuando se cambia de vista a tables
  useEffect(() => {
    if (currentView === 'tables') {
      setSelectedProducts([]);
      setSelectedTable(null);
    }
  }, [currentView]);

const loadCategoriesFromDB = async () => {
  if (!user || !profile?.restaurant_id) return;
  
  try {
    // Obtener usuarios del restaurante
    const { data: restaurantUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('restaurant_id', profile.restaurant_id);

    if (usersError) throw usersError;

    const userIds = restaurantUsers?.map(u => u.id) || [];

    // Obtener categorías de cualquier usuario del restaurante
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .in('user_id', userIds)
      .order('name');
      
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
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          inventory(current_stock)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading products:', error);
        setProducts(generateFallbackProducts());
        return;
      }

      console.log('Products loaded for restaurant:', dbProducts);

      const formattedProducts = dbProducts?.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Sin categoría',
        price: product.price,
        description: `Disponible: ${product.inventory?.[0]?.current_stock || 0} unidades`,
        image: getProductIcon(product.name, state.userData?.businessType || 'restaurant'),
        popular: false,
        stock: product.inventory?.[0]?.current_stock || 0
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts(generateFallbackProducts());
    }
  };

  const loadTipSettings = async () => {
    try {
      if (!profile?.restaurant_id) return;
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('tip_enabled, default_tip_percentage')
        .eq('owner_id', user?.id)
        .single();
        
      if (!error && data) {
        setTipEnabled(data.tip_enabled || false);
        setTipPercentage(data.default_tip_percentage || 10);
      }
    } catch (error) {
      console.error('Error loading tip settings:', error);
    }
  };

const loadTodaysSales = async () => {
    try {
      if (!profile?.restaurant_id) return;

      const { startISO, endISO } = getLocalDayRange();
      
      // Cargar ventas del día
      const { data: sales, error } = await supabase
        .from('sales')
        .select('total_amount, table_number, customer_email, created_at')
        .gte('created_at', startISO)
        .lt('created_at', endISO);

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
      const { data: tableStates, error: tableError } = await supabase
        .from('table_states')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('table_number');

      if (!tableError && tableStates) {
        // Crear array de 24 mesas con el estado real de la base de datos
        const updatedTables = Array.from({ length: 24 }, (_, i) => {
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
        setTables(Array.from({ length: 24 }, (_, i) => ({
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
    return [
      { id: 1, name: "Producto 1", category: "General", price: 10000, description: "Producto básico", image: "🍽️", popular: false, stock: 10 },
      { id: 2, name: "Producto 2", category: "General", price: 15000, description: "Producto básico", image: "🍽️", popular: false, stock: 10 },
      { id: 3, name: "Bebida", category: "Bebidas", price: 5000, description: "Bebida refrescante", image: "🥤", popular: false, stock: 10 }
    ];
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
      case 'pizzeria': return '🍕';
      case 'cafeteria': return '☕';
      case 'bar': return '🍺';
      case 'heladeria': return '🍦';
      case 'panaderia': return '🥖';
      default: return '🍽️';
    }
  };

  const getComplementaryProducts = (businessType: string) => {
    const baseId = 1000; // Para evitar conflictos con IDs de productos del usuario
    
    switch (businessType) {
      case 'pizzeria':
        return [
          { id: baseId + 1, name: "Coca Cola", category: "Bebidas", price: 4500, description: "Bebida refrescante", image: "🥤", popular: false },
          { id: baseId + 2, name: "Cerveza", category: "Bebidas", price: 8000, description: "Cerveza fría", image: "🍺", popular: false },
          { id: baseId + 3, name: "Adición de Queso", category: "Adiciones", price: 3000, description: "Extra queso", image: "🧀", popular: false }
        ];
      case 'bar':
        return [
          { id: baseId + 1, name: "Cerveza Nacional", category: "Bebidas", price: 6000, description: "Cerveza fría", image: "🍺", popular: true },
          { id: baseId + 2, name: "Vino Tinto", category: "Bebidas", price: 25000, description: "Copa de vino", image: "🍷", popular: false },
          { id: baseId + 3, name: "Picada", category: "Entradas", price: 35000, description: "Picada para compartir", image: "🧀", popular: false }
        ];
      case 'cafeteria':
        return [
          { id: baseId + 1, name: "Café Americano", category: "Bebidas", price: 3500, description: "Café tradicional", image: "☕", popular: true },
          { id: baseId + 2, name: "Cappuccino", category: "Bebidas", price: 5500, description: "Café con espuma", image: "☕", popular: false },
          { id: baseId + 3, name: "Sandwich", category: "Comida", price: 12000, description: "Sandwich del día", image: "🥪", popular: false }
        ];
      default:
        return [
          { id: baseId + 1, name: "Bebida Refrescante", category: "Bebidas", price: 3000, description: "Bebida fría", image: "🥤", popular: false },
          { id: baseId + 2, name: "Agua", category: "Bebidas", price: 2000, description: "Agua natural", image: "💧", popular: false }
        ];
    }
  };

  const menuProducts = products;

  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set((menuProducts || [])
      .map((p: any) => p.category)
      .filter((n: string) => !!n && n.trim() !== '' && n.toLowerCase() !== 'sin categoría')));
    const allNames = Array.from(new Set([...(dbCategories || []), ...fromProducts]))
      .filter(name => name && name.trim() !== '' && name.toLowerCase() !== 'sin categoría');
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-teal-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-orange-600',
      'from-pink-500 to-rose-600',
      'from-orange-500 to-amber-600'
    ];
    const dynamic = allNames.map((name, idx) => ({
      name,
      icon: Utensils,
      color: gradients[idx % gradients.length]
    }));
    return [
      ...dynamic,
      { name: 'Todos', icon: Utensils, color: 'from-blue-500 to-blue-600' }
    ];
  }, [dbCategories, menuProducts]);

  const paymentMethods = [
    { id: 'efectivo', name: 'Efectivo', icon: Banknote, color: 'from-green-500 to-green-600' },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'transferencia', name: 'Transferencia', icon: Smartphone, color: 'from-purple-500 to-purple-600' },
    { id: 'daviplata', name: 'Daviplata', icon: Smartphone, color: 'from-orange-500 to-orange-600' },
    { id: 'nequi', name: 'Nequi', icon: Smartphone, color: 'from-pink-500 to-pink-600' }
  ];

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
  
  const stats = [
    { 
      title: 'Ventas Hoy', 
      value: formatCurrency(realSalesData.dailySales), 
      change: realSalesData.dailySales > 0 ? `+${realSalesData.dailyOrders} órdenes` : 'Sin ventas', 
      icon: DollarSign, 
      color: 'from-green-500 to-emerald-600' 
    },
    { 
      title: 'Órdenes Mesa', 
      value: realSalesData.dineInOrders?.toString() || '0', 
      change: `${activeTablesCount} mesas activas`, 
      icon: Utensils, 
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      title: 'Órdenes Delivery', 
      value: realSalesData.deliveryOrders?.toString() || '0', 
      change: realSalesData.deliveryOrders > 0 ? 'Domicilios del día' : 'Sin domicilios', 
      icon: Truck, 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      title: 'Ticket Promedio', 
      value: formatCurrency(averageTicketDaily), 
      change: dailyVisitors > 0 ? `${dailyVisitors} personas visitaron hoy` : 'Sin visitantes hoy', 
      icon: TrendingUp, 
      color: 'from-orange-500 to-orange-600' 
    }
  ];

  // Funciones
  const filteredProducts = menuProducts.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateTableOrder = async (updatedProducts: any[]) => {
    if (!profile?.restaurant_id || !selectedTable) return;

    try {
      const orderTotal = updatedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      await supabase
        .from('table_states')
        .update({
          current_order: updatedProducts,
          order_total: orderTotal,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', selectedTable);
    } catch (error) {
      console.error('Error actualizando orden de mesa:', error);
    }
  };

  const addProduct = async (product: any) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    let updatedProducts;
    
    if (existing) {
      updatedProducts = selectedProducts.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
    } else {
      updatedProducts = [...selectedProducts, { ...product, quantity: 1 }];
    }
    
    setSelectedProducts(updatedProducts);
    
    // Actualizar en la base de datos
    await updateTableOrder(updatedProducts);
    
    toast({
      title: "Producto agregado",
      description: `${product.name} añadido a la orden`,
    });
  };

  const removeProduct = async (productId: number) => {
    const existing = selectedProducts.find(p => p.id === productId);
    let updatedProducts;
    
    if (existing && existing.quantity > 1) {
      updatedProducts = selectedProducts.map(p =>
        p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
      );
    } else {
      updatedProducts = selectedProducts.filter(p => p.id !== productId);
    }
    
    setSelectedProducts(updatedProducts);
    
    // Actualizar en la base de datos
    await updateTableOrder(updatedProducts);
  };

  const calculateSubtotal = () => selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  const calculateTipAmount = () => {
    if (noTip) return 0;
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      return parseFloat(customTipAmount);
    }
    if (tipEnabled && !noTip) {
      return (calculateSubtotal() * tipPercentage) / 100;
    }
    return 0;
  };
  
  const calculateTotal = () => calculateSubtotal() + calculateTipAmount();

  // Función para manejar la subida de comprobante de pago
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
        description: `Archivo ${file.name} cargado exitosamente`,
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
      description: `Se enviará factura a: ${customerEmail}`,
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
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('name, ingredients')
        .in('name', uniqueNames);

      const recipes: Array<{ name: string; ingredients: any[] }> = (recipesData as any) || [];

      if (!recipes || recipes.length === 0) return;

      for (const sold of selectedProducts) {
        const recipe = recipes.find(r => r.name === sold.name);
        if (!recipe || !Array.isArray(recipe.ingredients)) continue;

        for (const ing of recipe.ingredients) {
          const ingredientProductId = ing.ingredient_product_id as string | undefined;
          // Buscar producto de ingrediente por id primero, si no por nombre
          let rawId = ingredientProductId || '';
          if (!rawId && ing.name) {
            const { data: found } = await supabase
              .from('products')
              .select('id')
              .eq('user_id', user?.id)
              .ilike('name', `%${ing.name}%`)
              .limit(1);
            rawId = found && found.length ? found[0].id : '';
          }
          if (!rawId) continue;

          // Obtener inventario para conocer la unidad
          const { data: inv } = await supabase
            .from('inventory')
            .select('id, current_stock, unit')
            .eq('product_id', rawId)
            .maybeSingle();
          if (!inv) continue;

          const perUnitQty = Number(ing.quantity) || 0;
          const needed = perUnitQty * sold.quantity;
          const converted = convertUnit(needed, String(ing.unit || ''), String(inv.unit || ''));
          const newStock = Math.max(0, (inv.current_stock || 0) - converted);

          await supabase.from('inventory').update({ current_stock: newStock, last_updated: new Date().toISOString() }).eq('id', inv.id);
          await supabase.from('inventory_movements').insert({
            product_id: rawId,
            movement_type: 'OUT',
            quantity: converted,
            reference_type: 'SALE_RECIPE',
            reference_id: saleId,
            notes: `Consumo por receta: ${sold.quantity} x ${sold.name}`,
          });
        }
      }
    } catch (err) {
      console.error('Error procesando consumo por receta:', err);
    }
  };

  const loadTableOrder = async (tableNumber: number) => {
    if (!profile?.restaurant_id) return;

    try {
      const { data, error } = await supabase
        .from('table_states')
        .select('current_order')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', tableNumber)
        .single();

      if (!error && data?.current_order) {
        setSelectedProducts(Array.isArray(data.current_order) ? data.current_order : []);
      }
    } catch (error) {
      console.error('Error cargando orden de mesa:', error);
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
      const { error } = await supabase
        .from('table_states')
        .upsert({
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
      setTables(prevTables => 
        prevTables.map(table => 
          table.number === selectedTableForGuests 
            ? { ...table, status: 'ocupada', customers: guests, guestCount: guests, currentOrder: [], orderTotal: 0 }
            : table
        )
      );

      toast({
        title: "Orden abierta",
        description: `Orden ${selectedTableForGuests} abierta para ${guests} comensales`,
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

  const handlePayment = async () => {
    const total = calculateTotal();
    
    try {
      // 1. Guardar la venta en Supabase
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user?.id,
          total_amount: total,
          payment_method: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo',
          table_number: selectedTable,
          customer_email: customerEmail || null
        })
        .select()
        .single();

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

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

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

      dispatch({ type: 'ADD_SALE', payload: sale });

      // 5. Crear factura
      const invoice = {
        id: `INV-2024-${String(saleData.id).slice(-3)}`,
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
        paymentMethod: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo'
      };

      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      
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
            service: 0, // No servicio para negocios de comida
            tax: 0, // Solo impoconsumo, se calcula en el backend
            total: total,
            paymentMethod: paymentMethods.find(m => m.id === paymentMethod)?.name || 'Efectivo'
          };

          console.log('📝 Datos de factura a enviar:', invoiceData);
          const { data, error } = await supabase.functions.invoke('send-invoice', {
            body: invoiceData
          });
          console.log('📨 Respuesta send-invoice:', { data, error });

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
              description: `Enviada a ${customerEmail}`,
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
          await supabase
            .from('table_states')
            .upsert({
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
      setTables(prevTables => 
        prevTables.map(table => 
          table.number === selectedTable 
            ? { ...table, status: 'libre', customers: 0, currentOrder: null, guestCount: 0, orderTotal: 0 }
            : table
        )
      );

      // 8. Recargar productos para actualizar stock
      await loadProductsFromDB();

      setCurrentView('success');
      
      toast({
        title: "¡Venta registrada!",
        description: `Orden ${selectedTable} - ${formatCurrency(total)} | Guardado en base de datos`,
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

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error al procesar pago",
        description: "Hubo un problema al guardar la venta. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleProductCreated = () => {
    loadProductsFromDB();
    loadCategoriesFromDB();
    setShowProductCreator(false);
    setEditingProductWithAI(null);
    toast({
      title: editingProductWithAI ? "Producto actualizado" : "Producto creado",
      description: editingProductWithAI 
        ? "El costo del producto ha sido actualizado exitosamente"
        : "El producto ha sido agregado exitosamente",
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
      metadata: { type: 'cost_calc', product: productData }
    }));

    dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'ai' });

    toast({
      title: "Redirigiendo a Conektao AI",
      description: "Te guiaremos para calcular el costo y confirmar la actualización",
    });
  };

  // Vista de éxito
  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
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
      </div>
    );
  }

  // Vista de pago
  if (currentView === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentView('menu')}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Finalizar Pago</h1>
              <p className="text-muted-foreground">Orden {selectedTable}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Resumen de orden */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Resumen de la orden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {selectedProducts.map(product => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} × {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(product.price * product.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <Separator />
                  {tipEnabled && (
                    <div className="flex justify-between">
                      <span>Propina ({tipPercentage}%)</span>
                      <span>{formatCurrency(calculateTipAmount())}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de propina */}
            {tipEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Propina</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="noTip"
                        checked={noTip}
                        onChange={(e) => {
                          setNoTip(e.target.checked);
                          if (e.target.checked) {
                            setCustomTipAmount('');
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="noTip">No dio propina</Label>
                    </div>
                    
                    {!noTip && (
                      <>
                        <div className="space-y-2">
                          <Label>Propina sugerida ({tipPercentage}%): {formatCurrency((calculateSubtotal() * tipPercentage) / 100)}</Label>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="customTip">Propina personalizada (opcional)</Label>
                          <Input
                            id="customTip"
                            type="number"
                            placeholder="Ingrese monto personalizado"
                            value={customTipAmount}
                            onChange={(e) => setCustomTipAmount(e.target.value)}
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground">
                            Si ingresa un monto, se usará en lugar del porcentaje sugerido
                          </p>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium">
                            Propina total: {formatCurrency(calculateTipAmount())}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métodos de pago */}
            <Card>
              <CardHeader>
                <CardTitle>Método de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {paymentMethods.map(method => {
                    const IconComponent = method.icon;
                    return (
                      <Button
                        key={method.id}
                        variant={paymentMethod === method.id ? "default" : "outline"}
                        className={`h-16 flex-col gap-2 ${
                          paymentMethod === method.id 
                            ? `bg-gradient-to-r ${method.color} text-white border-none` 
                            : ""
                        }`}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-sm">{method.name}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Campos adicionales según método de pago */}
                {paymentMethod === 'tarjeta' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Información de Tarjeta
                    </h4>
                    <div>
                      <Label htmlFor="voucher">Código de Voucher</Label>
                      <Input
                        id="voucher"
                        placeholder="Ingrese el código del voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="border-blue-200 focus:border-blue-400"
                      />
                      <p className="text-xs text-blue-600 mt-1">*Opcional - Para verificación del pago</p>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'transferencia' || paymentMethod === 'daviplata' || paymentMethod === 'nequi') && (
                  <div className="bg-purple-50 p-4 rounded-lg space-y-4" data-scroll-target="proof">
                    <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Comprobante de Pago
                    </h4>
                    
                    <div className="space-y-3">
                      <Label>Subir comprobante (Opcional)</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="border-purple-200 focus:border-purple-400"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // Simular tomar foto con cámara
                            toast({
                              title: "Función de cámara",
                              description: "En la app móvil podrás tomar foto directamente",
                            });
                          }}
                          className="border-purple-200 hover:border-purple-400"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {paymentProofPreview && (
                        <div className="mt-3">
                          <Label>Vista previa del comprobante:</Label>
                          <div className="mt-2 p-2 border border-purple-200 rounded-lg">
                            <img 
                              src={paymentProofPreview} 
                              alt="Comprobante de pago" 
                              className="max-w-full h-32 object-contain mx-auto rounded"
                            />
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-purple-600">
                        *Opcional - Puedes agregar el comprobante ahora o después
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botón de pago */}
            <Button 
              onClick={handlePayment}
              disabled={!paymentMethod}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Procesar Pago {formatCurrency(calculateTotal())}
            </Button>
          </div>
        </div>

        {/* Modal de correo electrónico */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
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
                    <Input
                      id="email"
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="h-12 border-2 focus:border-green-500 transition-colors"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      ✅ Se enviará la factura al correo del cliente
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailModal(false);
                        setCustomerEmail('');
                        setPendingPaymentMethod('');
                      }}
                      className="flex-1 h-12 border-2 hover:border-muted-foreground transition-colors"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmPaymentMethod}
                      disabled={!customerEmail.trim() || !customerEmail.includes('@')}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista del menú
  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header fijo */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentView('tables')}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">Orden {selectedTable}</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Selecciona productos</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <button 
                      onClick={() => {
                        const currentTable = tables.find(t => t.number === selectedTable);
                        const currentGuests = currentTable?.guestCount || currentTable?.customers || 1;
                        const newGuests = prompt(`Número actual de comensales: ${currentGuests}\n\nIngresa el nuevo número:`, currentGuests.toString());
                        if (newGuests && parseInt(newGuests) > 0) {
                          setTables(prevTables => 
                            prevTables.map(table => 
                              table.number === selectedTable 
                                ? { ...table, customers: parseInt(newGuests), guestCount: parseInt(newGuests) }
                                : table
                            )
                          );
                          toast({
                            title: "Comensales actualizados",
                            description: `Orden ${selectedTable}: ${newGuests} personas`,
                          });
                        }
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors font-medium border-b border-dashed border-primary/30 hover:border-primary/60"
                    >
                      {tables.find(t => t.number === selectedTable)?.guestCount || 
                       tables.find(t => t.number === selectedTable)?.customers || 1} personas
                    </button>
                  </div>
                </div>
              </div>
              {selectedProducts.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      // Función para imprimir cuenta
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
                    }}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Cuenta
                  </Button>
                  <Button 
                    onClick={() => setCurrentView('payment')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Cobrar ({selectedProducts.length})
                  </Button>
                </div>
              )}
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categorías */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      selectedCategory === category.name 
                        ? `bg-gradient-to-r ${category.color} text-white border-none` 
                        : ""
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.name}
                  </Button>
                );
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
                <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
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

        <div className="p-4 grid lg:grid-cols-4 gap-6">
          {/* Lista de productos */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id}
                  className="group hover:shadow-lg transition-all border-2 hover:border-primary/30 relative overflow-hidden"
                >
                  {product.popular && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    {/* Área clickeable para agregar producto */}
                    <div 
                      className="text-center mb-3 cursor-pointer"
                      onClick={() => addProduct(product)}
                    >
                      <div className="text-4xl mb-2">{product.image}</div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </div>
                    </div>

                    {/* Área separada para botones de administración */}
                    {(profile?.role === 'owner' || profile?.role === 'admin' || profile?.permissions?.manage_products) && (
                      <div className="flex gap-1 mb-3 justify-center bg-muted/20 rounded-lg p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openEditProduct(product);
                          }}
                          title="Editar producto"
                          className="hover:bg-primary/10"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openProductCostCalculation(product);
                          }}
                          title="Calcular costo con IA"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Brain className="h-4 w-4" />
                        </Button>
                        {profile?.role === 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingProduct(product);
                              setDeleteDialogOpen(true);
                            }}
                            title="Eliminar producto"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:scale-105 transition-transform"
                      onClick={() => addProduct(product)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Orden actual - sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="text-center">Orden Actual</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Coffee className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay productos</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {selectedProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProduct(product.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{product.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                addProduct(product);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {tipEnabled && (
                        <div className="flex justify-between">
                          <span>Propina</span>
                          <span>{formatCurrency(calculateTipAmount())}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción flotantes/sticky */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-3 flex gap-3">
              <Button 
                onClick={() => {
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
                }}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Printer className="h-5 w-5 mr-2" />
                Cuenta
              </Button>
              <Button 
                onClick={() => setCurrentView('payment')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white font-semibold"
              >
                <Receipt className="h-5 w-5 mr-2" />
                Cobrar ({selectedProducts.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de caja
  if (currentView === 'cash') {
    return <CashManagement />;
  }

  // Vista principal - selección de órdenes
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-2">
            Sistema de Facturación
          </h1>
          <p className="text-muted-foreground">Selecciona una orden para comenzar</p>
        </div>
        <Button 
          onClick={() => setCurrentView('cash')}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Wallet className="h-5 w-5 mr-2" />
          💰 Caja
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
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
            </Card>
          );
        })}
      </div>

      {/* Selección de órdenes */}
      {currentView === 'tables' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Órdenes Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map(table => (
              <Button
                key={table.number}
                variant="outline"
                onClick={() => handleTableSelect(table.number)}
                className={`h-24 flex-col gap-2 transition-all duration-500 rounded-xl border-2 bg-white
                  ${table.status === 'libre' 
                    ? 'border-transparent bg-gradient-to-r from-green-400 to-emerald-500 p-0.5 hover:from-green-500 hover:to-emerald-600 hover:shadow-2xl hover:shadow-green-500/30' 
                    : 'border-transparent bg-gradient-to-r from-red-400 to-rose-400 p-0.5 hover:from-red-500 hover:to-rose-500 hover:shadow-2xl hover:shadow-red-500/30'
                  }
                  hover:scale-110 transform-gpu
                  group
                `}
              >
                <div className={`w-full h-full bg-white rounded-lg flex flex-col items-center justify-center gap-2
                  ${table.status === 'libre' 
                    ? 'group-hover:bg-gradient-to-br group-hover:from-green-50 group-hover:to-emerald-50' 
                    : 'group-hover:bg-gradient-to-br group-hover:from-red-50 group-hover:to-rose-50'
                  }
                  transition-all duration-500
                `}>
                  <Utensils className={`h-5 w-5 transition-all duration-300
                    ${table.status === 'libre' 
                      ? 'text-green-600 group-hover:text-green-700' 
                      : 'text-red-500 group-hover:text-red-600'
                    }`} 
                  />
                  <div className="text-center">
                    <div className={`font-bold text-sm bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300
                      ${table.status === 'libre' 
                        ? 'from-green-700 to-emerald-600 group-hover:from-green-800 group-hover:to-emerald-700' 
                        : 'from-red-600 to-rose-500 group-hover:from-red-700 group-hover:to-rose-600'
                      }`}>
                      Orden {table.number}
                    </div>
                    <div className="text-xs leading-tight">
                      {table.status === 'libre' ? (
                        <span className={`bg-gradient-to-r bg-clip-text text-transparent font-medium
                          from-green-600 to-emerald-500 group-hover:from-green-700 group-hover:to-emerald-600
                          transition-all duration-300`}>
                          Disponible
                        </span>
                      ) : (
                        <span className={`bg-gradient-to-r bg-clip-text text-transparent font-medium
                          from-red-500 to-rose-400 group-hover:from-red-600 group-hover:to-rose-500
                          transition-all duration-300`}>
                          {table.customers} personas
                        </span>
                      )}
                    </div>
                    {table.currentOrder && (
                      <div className={`text-xs font-medium bg-gradient-to-r bg-clip-text text-transparent
                        from-orange-600 to-amber-500 group-hover:from-orange-700 group-hover:to-amber-600
                        transition-all duration-300`}>
                    {formatCurrency(table.orderTotal || 0)}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
      
      {/* Botón para crear nuevos artículos */}
      {currentView === 'tables' && (profile?.role === 'owner' || profile?.role === 'admin' || profile?.permissions?.manage_products) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowProductCreator(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full h-14 w-14"
            size="lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Modal de creación de productos */}
      {showProductCreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-xl">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {editingProductWithAI ? `Calcular Costo - ${editingProductWithAI.name}` : 'Crear Nuevo Artículo'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowProductCreator(false);
                  setEditingProductWithAI(null);
                }}
                className="rounded-full hover:bg-accent"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <ProductCreator
                onProductCreated={handleProductCreated}
                onNeedCostCalculation={handleNeedCostCalculation}
                existingProduct={editingProductWithAI}
              />
            </div>
          </div>
        </div>
      )}

        {/* Modal para número de comensales */}
        {showGuestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Orden {selectedTableForGuests}</h2>
                <p className="text-gray-600">¿Cuántas personas van a comer?</p>
              </div>
              
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder="Número de comensales"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  min="1"
                  max="20"
                  className="text-center text-lg"
                  autoFocus
                />
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowGuestModal(false);
                      setGuestCount('');
                      setSelectedTableForGuests(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={confirmTableSelection}
                    className="flex-1"
                    disabled={!guestCount || parseInt(guestCount) <= 0}
                  >
                    Abrir Orden
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Billing;