import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Minus,
  Utensils,
  ShoppingCart,
  CreditCard,
  Banknote,
  Receipt,
  Users,
  Coffee,
  Pizza,
  Wine,
  CheckCircle,
  ArrowLeft,
  Search,
  Home,
  Truck,
  User,
  Phone,
  MapPin,
  Camera,
  Upload,
  Split,
  Smartphone,
  RefreshCw,
  ChefHat,
  AlertTriangle,
  Clock
} from 'lucide-react';
import KitchenOrderModal from '@/components/kitchen/KitchenOrderModal';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';

interface Table {
  number: number;
  status: 'libre' | 'ocupada';
  guestCount: number;
  currentOrder: any[];
  orderTotal: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
  user_id?: string;
  quantity?: number;
}

interface SelectedProduct extends Product {
  quantity: number;
}

const POSBilling = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Estados principales
  const [currentView, setCurrentView] = useState<'order-type' | 'tables' | 'guests' | 'customer-info' | 'menu' | 'payment' | 'success' | 'cash'>('order-type');
  const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  
  // Estados para comandas
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [showCommandReminder, setShowCommandReminder] = useState(false);
  const { sendToKitchen, checkPendingCommand, setPendingCommandReminder, isLoading: kitchenLoading } = useKitchenOrders();
  
  // Estado de mesas con sincronización con base de datos
  const [tables, setTables] = useState<Table[]>([]);

  // Cargar estado de mesas desde la base de datos
  const loadTableStates = async () => {
    if (!user || !profile?.restaurant_id) return;

    try {
      const { data: tableStates, error } = await supabase
        .from('table_states')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('table_number');

      if (error) throw error;

      const formattedTables = (tableStates || []).map(state => ({
        number: state.table_number,
        status: state.status as 'libre' | 'ocupada',
        guestCount: state.guest_count || 0,
        currentOrder: Array.isArray(state.current_order) ? state.current_order : [],
        orderTotal: state.order_total || 0
      }));

      setTables(formattedTables);
    } catch (error) {
      console.error('Error loading table states:', error);
    }
  };

  // Función para actualizar estado de mesa en base de datos
  const updateTableState = async (tableNumber: number, status: 'libre' | 'ocupada', guestCount: number = 0, currentOrder: any[] = [], orderTotal: number = 0) => {
    if (!profile?.restaurant_id) return;

    try {
      const { error } = await supabase
        .from('table_states')
        .upsert({
          restaurant_id: profile.restaurant_id,
          table_number: tableNumber,
          status,
          guest_count: guestCount,
          current_order: currentOrder,
          order_total: orderTotal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'restaurant_id,table_number'
        });

      if (error) throw error;
      
      // Actualizar estado local
      await loadTableStates();
    } catch (error) {
      console.error('Error updating table state:', error);
    }
  };

  // Actualizar orden de una mesa específica
  const updateTableOrder = async (tableNumber: number, order: any[], total: number) => {
    if (!profile?.restaurant_id) return;

    try {
      const { error } = await supabase
        .from('table_states')
        .update({
          current_order: order,
          order_total: total,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', tableNumber);

      if (error) throw error;
      
      // Actualizar estado local
      await loadTableStates();
    } catch (error) {
      console.error('Error updating table order:', error);
    }
  };

  const loadProducts = async () => {
    if (!user?.id || !profile?.restaurant_id) {
      console.log('Falta información de usuario o perfil');
      return;
    }
    
    try {
      console.log('Cargando productos para restaurante:', profile.restaurant_id);
      
      // Cargar productos y recetas visibles por RLS del restaurante actual
      const [prodRes, recRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('recipes')
          .select('*')
          .eq('is_active', true)
      ]);

      console.log('Respuesta productos:', prodRes);
      console.log('Respuesta recetas:', recRes);

      if (prodRes.error) {
        console.error('Error getting products:', prodRes.error);
        if (prodRes.error.code === 'PGRST301') {
          console.log('No se encontraron productos o no hay permisos');
          setProducts([]);
          return;
        }
        throw prodRes.error;
      }
      
      if (recRes.error) {
        console.error('Error getting recipes:', recRes.error);
        if (recRes.error.code === 'PGRST301') {
          console.log('No se encontraron recetas o no hay permisos');
        } else {
          throw recRes.error;
        }
      }
      
      console.log('Productos encontrados:', prodRes.data?.length || 0);
      console.log('Recetas encontradas:', recRes.data?.length || 0);
      
      // Mapear ambos conjuntos a la interfaz de Product
      const mappedProducts = (prodRes.data || []).map((product: any) => ({
        ...product,
        category: product.category || product.description || 'General'
      }));

      const mappedRecipes = (recRes.data || []).map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        price: Number(recipe.price) || 0,
        category: recipe.category || 'Recetas',
        category_id: null,
        image_url: null,
        description: recipe.description || 'Receta',
        is_active: true,
        user_id: recipe.user_id
      }));

      const combined = [...mappedProducts, ...mappedRecipes];
      setProducts(combined);
      
      console.log(`Total productos/recetas cargados: ${combined.length}`);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Error al cargar productos. Verifica tu sesión.",
        variant: "destructive"
      });
    }
  };

  // Función para enviar a cocina
  const handleSendToKitchen = async (
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      special_instructions?: string;
    }>,
    notes?: string,
    priority?: string,
    estimatedTime?: number
  ) => {
    try {
      await sendToKitchen(items, selectedTable?.number);
      
      // Limpiar carrito después de enviar a cocina
      setSelectedProducts([]);
      if (selectedTable) {
        await updateTableOrder(selectedTable.number, [], 0);
      }
      
      setIsKitchenModalOpen(false);
      
      toast({
        title: "¡Comanda enviada!",
        description: "La comanda se ha enviado exitosamente a cocina",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Error sending to kitchen:', error);
    }
  };

  useEffect(() => {
    if (user && profile?.restaurant_id) {
      loadProducts();
      loadTableStates();
    }
  }, [user, profile?.restaurant_id]);

  // Función para obtener icono según categoría
  const getProductIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Bebidas': Wine,
      'Comida': Pizza,
      'Café': Coffee,
      'General': Utensils
    };
    return iconMap[category] || Utensils;
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categorías disponibles
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const orderTotal = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Agregar producto al pedido
  const addProductToOrder = (product: Product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts(prev => 
        prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
      );
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  // Remover producto del pedido
  const removeProductFromOrder = (productId: string) => {
    setSelectedProducts(prev => {
      const product = prev.find(p => p.id === productId);
      if (product && product.quantity > 1) {
        return prev.map(p => p.id === productId ? { ...p, quantity: p.quantity - 1 } : p);
      }
      return prev.filter(p => p.id !== productId);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentView('success');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Error al procesar el pago",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full shadow-lg">
          <ShoppingCart className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-white">POS & Facturación</h1>
        </div>
        <p className="text-lg text-slate-600">
          Sistema unificado de ventas para <span className="font-semibold text-orange-600">{profile?.restaurant_id}</span>
        </p>
      </div>

      {/* Vista de Tipo de Orden */}
      {currentView === 'order-type' && (
        <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 via-cyan-50 to-purple-50 border-b border-orange-100 p-6">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Tipo de Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button
                onClick={() => {
                  setOrderType('dine-in');
                  setCurrentView('tables');
                }}
                className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center gap-4">
                  <Home className="h-12 w-12" />
                  <div className="text-center">
                    <div className="text-xl font-bold">Comer Aquí</div>
                    <div className="text-sm opacity-90">Servicio en mesa</div>
                  </div>
                </div>
              </Button>
              <Button
                onClick={() => {
                  setOrderType('delivery');
                  setCurrentView('customer-info');
                }}
                className="h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex flex-col items-center gap-4">
                  <Truck className="h-12 w-12" />
                  <div className="text-center">
                    <div className="text-xl font-bold">Domicilio</div>
                    <div className="text-sm opacity-90">Entrega a domicilio</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de Mesas */}
      {currentView === 'tables' && (
        <Card className="max-w-6xl mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-blue-700">
                <Users className="h-6 w-6" />
                Seleccionar Mesa
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setCurrentView('order-type')}
                className="px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map(table => (
                <button
                  key={table.number}
                  onClick={() => {
                    setSelectedTable(table);
                    if (table.status === 'ocupada') {
                      setGuestCount(table.guestCount);
                      setSelectedProducts(table.currentOrder.map(item => ({
                        ...item,
                        category: item.category || 'General',
                        is_active: true
                      })));
                      setCurrentView('menu');
                    } else {
                      setCurrentView('guests');
                    }
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    table.status === 'libre'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300 shadow-md hover:shadow-lg'
                      : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:border-orange-300 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="text-center space-y-2">
                    <div className={`text-xl font-bold ${
                      table.status === 'libre' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      Mesa {table.number}
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-full ${
                      table.status === 'libre'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {table.status === 'libre' ? 'Libre' : 'Ocupada'}
                    </div>
                    {table.status === 'ocupada' && (
                      <div className="mt-2 text-sm">
                        <div>{table.guestCount} comensales</div>
                        <div className="font-semibold">{formatCurrency(table.orderTotal)}</div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de Comensales */}
      {currentView === 'guests' && selectedTable && (
        <Card className="max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-blue-700">
              <Users className="h-6 w-6" />
              Mesa {selectedTable.number}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-slate-700">¿Cuántos comensales?</h3>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="h-12 w-12 rounded-full"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-3xl font-bold text-blue-600 w-16 text-center">
                  {guestCount}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="h-12 w-12 rounded-full"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentView('tables')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await updateTableState(selectedTable.number, 'ocupada', guestCount);
                  setCurrentView('menu');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de Información del Cliente */}
      {currentView === 'customer-info' && (
        <Card className="max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-green-700">
              <User className="h-6 w-6" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del cliente
                </label>
                <Input
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono
                </label>
                <Input
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección de entrega
                </label>
                <Input
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentView('order-type')}
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                onClick={() => setCurrentView('menu')}
                disabled={!customerInfo.name || !customerInfo.address}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista del Menú */}
      {currentView === 'menu' && (orderType === 'dine-in' ? selectedTable : true) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de productos */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <Utensils className="h-6 w-6 text-orange-600" />
                  <span className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Nuestro Menú
                  </span>
                </CardTitle>
                <div className="flex items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView(orderType === 'dine-in' ? 'guests' : 'customer-info')}
                    className="px-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Filtros de categoría */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap"
                      size="sm"
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => {
                    const IconComponent = getProductIcon(product.category);
                    return (
                      <Card
                        key={product.id}
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-orange-200"
                        onClick={() => addProductToOrder(product)}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-700">
                  <ShoppingCart className="h-5 w-5" />
                  {orderType === 'dine-in' 
                    ? `Mesa ${selectedTable?.number}` 
                    : customerInfo.name || 'Domicilio'
                  }
                </CardTitle>
                <p className="text-sm text-slate-600">
                  {orderType === 'dine-in' 
                    ? `${guestCount} comensales`
                    : `${customerInfo.address}`
                  }
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Lista de productos en el carrito */}
                {selectedProducts.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Agrega productos al pedido
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedProducts.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-slate-600">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeProductFromOrder(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addProductToOrder(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(orderTotal)}</span>
                </div>

                {/* Botón de Enviar a Cocina - SIEMPRE VISIBLE */}
                <Button
                  onClick={() => setIsKitchenModalOpen(true)}
                  disabled={selectedProducts.length === 0}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChefHat className="h-5 w-5 mr-2" />
                  Enviar a Cocina
                </Button>

                {/* Opciones de pago */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      variant={paymentMode === 'single' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentMode('single');
                        setSelectedPaymentMethod('');
                      }}
                      className="flex-1 h-12"
                    >
                      Pago Simple
                    </Button>
                    <Button
                      variant={paymentMode === 'split' ? 'default' : 'outline'}
                      onClick={() => {
                        setPaymentMode('split');
                        setSelectedPaymentMethod('');
                      }}
                      className="flex-1 h-12"
                    >
                      <Split className="h-4 w-4 mr-2" />
                      Dividir
                    </Button>
                  </div>

                  {/* Métodos de pago */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={selectedPaymentMethod === 'efectivo' ? 'default' : 'outline'}
                      onClick={() => setSelectedPaymentMethod('efectivo')}
                      className="h-16"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className="h-6 w-6" />
                        <span>Efectivo</span>
                      </div>
                    </Button>
                    <Button
                      variant={selectedPaymentMethod === 'tarjeta' ? 'default' : 'outline'}
                      onClick={() => setSelectedPaymentMethod('tarjeta')}
                      className="h-16"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-6 w-6" />
                        <span>Tarjeta</span>
                      </div>
                    </Button>
                  </div>

                  {selectedPaymentMethod && (
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing || selectedProducts.length === 0}
                      className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Procesando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Receipt className="h-5 w-5" />
                          Procesar Pago - {formatCurrency(orderTotal)}
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Vista de éxito */}
      {currentView === 'success' && (
        <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-700">¡Pago Exitoso!</h2>
            <p className="text-slate-600">
              El pago se ha procesado correctamente
            </p>
            <div className="text-lg font-semibold text-slate-700">
              Total: {formatCurrency(orderTotal)}
            </div>
            <Button
              onClick={() => {
                setCurrentView('order-type');
                setSelectedProducts([]);
                setSelectedTable(null);
                setCustomerInfo({ name: '', phone: '', address: '' });
                setSelectedPaymentMethod('');
                setPaymentMode('single');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Nueva Orden
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Comanda */}
      <KitchenOrderModal
        isOpen={isKitchenModalOpen}
        onClose={() => setIsKitchenModalOpen(false)}
        onConfirmOrder={handleSendToKitchen}
        selectedProducts={selectedProducts.map(product => ({ product, quantity: product.quantity }))}
        tableNumber={selectedTable?.number}
        orderType={orderType}
        customerInfo={orderType === 'delivery' ? customerInfo : undefined}
      />
    </div>
  );
};

export default POSBilling;