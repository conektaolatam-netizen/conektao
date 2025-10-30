import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
  Truck,
  DollarSign
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: string;
  shippingCoverage: string;
  minimumOrder: number;
  isActive: boolean;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  supplier_id: string;
  stock: number;
  category: string;
}

const SupplierMarketplace = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [currentView, setCurrentView] = useState<'suppliers' | 'products'>('suppliers');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      
      const { data: suppliersData, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Obtener configuraciones de proveedores
      const supplierIds = suppliersData?.map(s => s.user_id) || [];
      const { data: settingsData } = await supabase
        .from('supplier_settings')
        .select('*')
        .in('user_id', supplierIds)
        .eq('is_active', true);

      // Cargar conteo de productos por proveedor
      const supplierIdsForProducts = suppliersData?.map(s => s.id) || [];
      const { data: productCounts } = await supabase
        .from('supplier_products')
        .select('supplier_id')
        .in('supplier_id', supplierIdsForProducts);

      const countMap = productCounts?.reduce((acc, item) => {
        acc[item.supplier_id] = (acc[item.supplier_id] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number}) || {};

      // Crear mapa de configuraciones por user_id
      const settingsMap = settingsData?.reduce((acc, setting) => {
        acc[setting.user_id] = setting;
        return acc;
      }, {} as {[key: string]: any}) || {};

      const formattedSuppliers = suppliersData?.map(supplier => {
        const settings = settingsMap[supplier.user_id];
        return {
          id: supplier.id,
          name: supplier.name,
          description: supplier.description || '',
          rating: supplier.rating || 4.5,
          deliveryTime: settings ? `${settings.delivery_time_min || 24}-${settings.delivery_time_max || 48}h` : '24-48h',
          shippingCoverage: settings?.shipping_coverage || 'local',
          minimumOrder: settings?.minimum_order_amount || 0,
          isActive: settings?.is_active || false,
          productCount: countMap[supplier.id] || 0
        };
      }) || [];

      setSuppliers(formattedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierProducts = async (supplierId: string) => {
    try {
      setLoading(true);
      
      const { data: productsData, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_active', true);

      if (error) throw error;

      setProducts(productsData || []);
      setSelectedSupplier(supplierId);
      setCurrentView('products');
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity
    }));
    
    toast({
      title: "Producto agregado",
      description: "Se agregó el producto al carrito"
    });
  };

  const createOrder = async () => {
    if (!selectedSupplier || Object.keys(cart).length === 0) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      // Obtener datos del usuario
      const { data: profileData } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.data.user.id)
        .single();

      if (!profileData?.restaurant_id) {
        throw new Error('Debes estar asociado a un restaurante para hacer pedidos');
      }

      // Obtener detalles de productos del carrito
      const productIds = Object.keys(cart);
      const { data: cartProducts } = await supabase
        .from('supplier_products')
        .select('*')
        .in('id', productIds);

      if (!cartProducts) throw new Error('No se pudieron obtener los productos');

      // Calcular totales
      const subtotal = cartProducts.reduce((sum, product) => {
        const quantity = cart[product.id];
        return sum + (product.price * quantity);
      }, 0);

      const shippingCost = 0; // Por ahora gratis
      const taxAmount = subtotal * 0.19; // IVA 19%
      const commissionAmount = subtotal * 0.08; // Comisión 8%
      const totalAmount = subtotal + shippingCost + taxAmount;

      // Crear el pedido
      const { data: orderData, error: orderError } = await supabase
        .from('supplier_orders')
        .insert({
          supplier_id: selectedSupplier,
          restaurant_id: profileData.restaurant_id,
          ordered_by: user.data.user.id,
          subtotal,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
          commission_amount: commissionAmount,
          total_amount: totalAmount,
          delivery_address: 'Dirección del restaurante' // TODO: obtener dirección real
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear items del pedido
      const orderItems = cartProducts.map(product => ({
        order_id: orderData.id,
        product_id: product.id,
        quantity: cart[product.id],
        unit_price: product.price,
        total_price: product.price * cart[product.id]
      }));

      const { error: itemsError } = await supabase
        .from('supplier_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Limpiar carrito
      setCart({});
      
      toast({
        title: "Pedido creado",
        description: `Pedido ${orderData.order_number} creado exitosamente`
      });

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {currentView === 'suppliers' ? 'Marketplace de Proveedores' : 'Productos'}
          </h1>
          <p className="text-muted-foreground">
            {currentView === 'suppliers' 
              ? 'Encuentra proveedores para tu restaurante'
              : 'Agrega productos a tu pedido'
            }
          </p>
        </div>
        
        {currentView === 'products' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setCurrentView('suppliers');
              setSelectedSupplier(null);
              setProducts([]);
            }}>
              Volver a Proveedores
            </Button>
            {Object.keys(cart).length > 0 && (
              <Button onClick={createOrder}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Crear Pedido ({Object.keys(cart).length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={currentView === 'suppliers' ? "Buscar proveedores..." : "Buscar productos..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Content */}
      {currentView === 'suppliers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{supplier.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {supplier.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Entrega: {supplier.deliveryTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <Badge variant="secondary">
                      {supplier.shippingCoverage === 'national' ? 'Nacional' : 
                       supplier.shippingCoverage === 'local' ? 'Local' : 'Ciudades específicas'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Mínimo: {formatCurrency(supplier.minimumOrder)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    {supplier.productCount} productos
                  </span>
                  <Button onClick={() => loadSupplierProducts(supplier.id)}>
                    Ver Productos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 space-y-4">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                )}
                
                <div>
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    Stock: {product.stock}
                  </Badge>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {cart[product.id] ? `En carrito (${cart[product.id]})` : 'Agregar al carrito'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(currentView === 'suppliers' ? filteredSuppliers : filteredProducts).length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {currentView === 'suppliers' 
              ? 'No se encontraron proveedores'
              : 'No se encontraron productos'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SupplierMarketplace;