import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface InventoryItem {
  id: string;
  product_id: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  last_updated: string;
  unit: string;
  user_id: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    is_active: boolean;
  };
}

const InventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {stock: number, minStock: number}}>({});

  const { toast } = useToast();
  const { user, profile } = useAuth();

  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (user && isOwner) {
      loadInventory();
    }
  }, [user, isOwner]);

  const loadInventory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(
            id,
            name,
            description,
            price,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .order('product(name)');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = (item: InventoryItem) => {
    if (!isOwner) return;
    
    setEditingItem(item.id);
    setEditValues({
      [item.id]: {
        stock: item.current_stock,
        minStock: item.min_stock
      }
    });
  };

  const handleSaveStock = async (item: InventoryItem) => {
    if (!isOwner) return;

    const editValue = editValues[item.id];
    if (!editValue) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          current_stock: editValue.stock,
          min_stock: editValue.minStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      // Create inventory movement record
      const stockDifference = editValue.stock - item.current_stock;
      if (stockDifference !== 0) {
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product_id,
            movement_type: stockDifference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(stockDifference),
            reference_type: 'ADJUSTMENT',
            notes: `Ajuste manual de inventario - ${stockDifference > 0 ? 'Ingreso' : 'Salida'} de ${Math.abs(stockDifference)} ${item.unit}`
          });
      }

      toast({
        title: "Stock actualizado",
        description: `Stock de ${item.product.name} actualizado exitosamente`,
      });

      setEditingItem(null);
      setEditValues({});
      loadInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleDeleteProduct = async (item: InventoryItem) => {
    if (!isOwner) return;

    try {
      // Delete inventory first (due to foreign key constraints)
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', item.id);

      if (inventoryError) throw inventoryError;

      // Delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', item.product_id);

      if (productError) throw productError;

      toast({
        title: "Producto eliminado",
        description: `${item.product.name} ha sido eliminado del inventario`,
      });

      loadInventory();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'destructive';
    if (item.current_stock <= item.min_stock) return 'default';
    return 'secondary';
  };

  const getStatusText = (item: InventoryItem) => {
    if (item.current_stock === 0) return 'Sin Stock';
    if (item.current_stock <= item.min_stock) return 'Stock Bajo';
    return 'Stock Normal';
  };

  const getStatusIcon = (item: InventoryItem) => {
    if (item.current_stock === 0) return <X className="h-4 w-4" />;
    if (item.current_stock <= item.min_stock) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalProducts = () => inventory.length;
  const getLowStockCount = () => inventory.filter(item => item.current_stock <= item.min_stock && item.current_stock > 0).length;
  const getOutOfStockCount = () => inventory.filter(item => item.current_stock === 0).length;
  const getActiveProducts = () => inventory.filter(item => item.product.is_active).length;

  if (!isOwner) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los propietarios pueden gestionar el inventario.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Gestión de Inventario</h2>
        <p className="text-muted-foreground">Administra las cantidades en stock de tus productos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-xl font-bold">{getTotalProducts()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-xl font-bold text-yellow-600">{getLowStockCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sin Stock</p>
                <p className="text-xl font-bold text-red-600">{getOutOfStockCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Productos Activos</p>
                <p className="text-xl font-bold text-green-600">{getActiveProducts()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay productos en inventario</h3>
              <p className="text-muted-foreground">
                Los productos se agregarán automáticamente al inventario cuando los crees.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inventory.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <Badge 
                          variant={getStatusColor(item)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(item)}
                          {getStatusText(item)}
                        </Badge>
                        {!item.product.is_active && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                      
                      {item.product.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.product.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Precio: </span>
                          <span className="font-medium">{formatCurrency(item.product.price)}</span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Stock Actual: </span>
                          {editingItem === item.id ? (
                            <Input
                              type="number"
                              value={editValues[item.id]?.stock || 0}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [item.id]: {
                                  ...editValues[item.id],
                                  stock: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-20 h-6 text-xs"
                            />
                          ) : (
                            <span className="font-medium">{item.current_stock} {item.unit}</span>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Stock Mínimo: </span>
                          {editingItem === item.id ? (
                            <Input
                              type="number"
                              value={editValues[item.id]?.minStock || 0}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [item.id]: {
                                  ...editValues[item.id],
                                  minStock: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-20 h-6 text-xs"
                            />
                          ) : (
                            <span className="font-medium">{item.min_stock} {item.unit}</span>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Última Actualización: </span>
                          <span className="font-medium">
                            {new Date(item.last_updated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {editingItem === item.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveStock(item)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStock(item)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente "{item.product.name}" del inventario y de todos los registros. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(item)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManager;