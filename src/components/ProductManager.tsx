import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category_id?: string;
  is_active: boolean;
  created_at: string;
}

const ProductManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category_id: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    await Promise.all([loadProducts(), loadCategories()]);
    setLoading(false);
  };

  const loadProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
      return;
    }

    setProducts(data || []);
  };

  const loadCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      sku: formData.sku || null,
      category_id: formData.category_id || null,
      user_id: user.id,
      is_active: true
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el producto",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Producto actualizado",
        description: "El producto se actualizó correctamente"
      });
    } else {
      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) {
        toast({
          title: "Error", 
          description: "No se pudo crear el producto",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Producto creado",
        description: "El producto se creó correctamente"
      });
    }

    resetForm();
    setIsDialogOpen(false);
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sku: product.sku || '',
      category_id: product.category_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Producto eliminado",
      description: "El producto se eliminó correctamente"
    });
    
    loadProducts();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      sku: '',
      category_id: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Gestión de Productos</h2>
          <p className="text-muted-foreground mt-2">Administra tu catálogo de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id} className="p-4 bg-gradient-card border-0 shadow-card">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                </div>
                {product.sku && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="p-8 text-center bg-gradient-card border-0 shadow-card">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
          <p className="text-muted-foreground mb-4">
            Comienza agregando tu primer producto al catálogo
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Crear primer producto
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ProductManager;