import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
  Trash2
} from 'lucide-react';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  last_updated: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const InventoryReal = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    initial_stock: '',
    min_stock: '',
    unit: 'unidades'
  });

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, []);

  const loadInventory = async () => {
    if (!profile?.restaurant_id) return;
    
    setLoading(true);
    try {
      // Obtener usuarios del restaurante
      const { data: restaurantUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('restaurant_id', profile.restaurant_id);

      const userIds = restaurantUsers?.map(u => u.id) || [];

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          current_stock,
          min_stock,
          max_stock,
          unit,
          last_updated,
          products!inner(name, price, category:categories(name))
        `)
        .in('user_id', userIds);

      if (error) throw error;

      const formattedInventory = data?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        current_stock: item.current_stock,
        min_stock: item.min_stock,
        max_stock: item.max_stock,
        unit: item.unit,
        last_updated: item.last_updated,
        category: item.products.category?.name || 'General',
        price: item.products.price
      })) || [];

      setInventory(formattedInventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!profile?.restaurant_id) return;
    
    try {
      // Obtener usuarios del restaurante
      const { data: restaurantUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('restaurant_id', profile.restaurant_id);

      const userIds = restaurantUsers?.map(u => u.id) || [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          category:categories(name)
        `)
        .eq('is_active', true)
        .in('user_id', userIds);

      if (error) throw error;

      const formattedProducts = data?.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category?.name || 'General'
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const updateStock = async (inventoryId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', inventoryId);

      if (error) throw error;

      // Crear movimiento de inventario
      const inventoryItem = inventory.find(item => item.id === inventoryId);
      if (inventoryItem) {
        const difference = newStock - inventoryItem.current_stock;
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: inventoryItem.product_id,
            movement_type: difference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(difference),
            reference_type: 'ADJUSTMENT',
            notes: `Ajuste manual de stock por ${user?.email}`
          });
      }

      await loadInventory();
      toast({
        title: "Stock actualizado",
        description: "El stock se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock",
        variant: "destructive"
      });
    }
  };

  const addNewProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.initial_stock) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Crear producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          user_id: user?.id,
          is_active: true
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Crear inventario
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          current_stock: parseInt(newProduct.initial_stock),
          min_stock: parseInt(newProduct.min_stock) || 5,
          unit: newProduct.unit,
          user_id: user?.id
        });

      if (inventoryError) throw inventoryError;

      // 3. Crear movimiento inicial
      await supabase
        .from('inventory_movements')
        .insert({
          product_id: product.id,
          movement_type: 'IN',
          quantity: parseInt(newProduct.initial_stock),
          reference_type: 'INITIAL',
          notes: `Stock inicial del producto ${newProduct.name}`
        });

      setNewProduct({
        name: '',
        price: '',
        category: '',
        initial_stock: '',
        min_stock: '',
        unit: 'unidades'
      });
      setShowNewProduct(false);
      loadInventory();
      loadProducts();

      toast({
        title: "Producto agregado",
        description: `${newProduct.name} se agregó al inventario`
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

  const handleEditStock = (inventoryId: string, currentStock: number) => {
    setEditingStock(inventoryId);
    setTempStock(currentStock);
  };

  const handleSaveStock = (inventoryId: string) => {
    updateStock(inventoryId, tempStock);
    setEditingStock(null);
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'bg-red-100 text-red-800';
    if (item.current_stock <= item.min_stock) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'Agotado';
    if (item.current_stock <= item.min_stock) return 'Stock Bajo';
    return 'Normal';
  };

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalProducts = () => inventory.length;
  const getLowStockCount = () => inventory.filter(item => 
    item.current_stock <= item.min_stock && item.current_stock > 0
  ).length;
  const getOutOfStockCount = () => inventory.filter(item => 
    item.current_stock === 0
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Inventario Real</h2>
          <p className="text-muted-foreground mt-2">Control de stock de productos reales</p>
        </div>
        <Button onClick={() => setShowNewProduct(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-bold">{getTotalProducts()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold">{getLowStockCount()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <X className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Agotados</p>
              <p className="text-2xl font-bold">{getOutOfStockCount()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Productos Activos</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando inventario...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay productos en el inventario
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {item.min_stock} {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(item)}>
                      {getStatusText(item)}
                    </Badge>
                    <div className="text-center">
                      {editingStock === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={tempStock}
                            onChange={(e) => setTempStock(parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Button size="sm" onClick={() => handleSaveStock(item.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingStock(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {item.current_stock} {item.unit}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStock(item.id, item.current_stock)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      {showNewProduct && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo Producto</h3>
              <Button variant="outline" size="sm" onClick={() => setShowNewProduct(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Pizza Margherita"
                />
              </div>
              <div>
                <Label htmlFor="price">Precio de Venta *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="15000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initial_stock">Stock Inicial *</Label>
                  <Input
                    id="initial_stock"
                    type="number"
                    value={newProduct.initial_stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, initial_stock: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock">Stock Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={newProduct.min_stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, min_stock: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="unit">Unidad</Label>
                <Input
                  id="unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="unidades, kg, litros..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={addNewProduct} className="flex-1">
                  Agregar Producto
                </Button>
                <Button variant="outline" onClick={() => setShowNewProduct(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InventoryReal;