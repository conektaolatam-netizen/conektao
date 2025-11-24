import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, DollarSign, Coffee, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface ProductIngredient {
  id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredient?: Ingredient;
}

const ProductManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Category management
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  
  // Ingredients management for product
  const [selectedProductForIngredients, setSelectedProductForIngredients] = useState<Product | null>(null);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: '', quantity_needed: '' });
  
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
    await Promise.all([loadProducts(), loadCategories(), loadIngredients()]);
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
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const loadIngredients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name, unit, current_stock')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading ingredients:', error);
      return;
    }

    setIngredients(data || []);
  };

  const loadProductIngredients = async (productId: string) => {
    const { data, error } = await supabase
      .from('product_ingredients')
      .select(`
        *,
        ingredient:ingredients(name, unit, current_stock)
      `)
      .eq('product_id', productId);

    if (error) {
      console.error('Error loading product ingredients:', error);
      return;
    }

    const formatted = (data || []).map(item => ({
      ...item,
      ingredient: Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient
    }));

    setProductIngredients(formatted);
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

  // Category management
  const handleCreateCategory = async () => {
    if (!categoryForm.name || !user) return;

    const { error } = await supabase
      .from('categories')
      .insert({
        name: categoryForm.name,
        description: categoryForm.description || null,
        user_id: user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Categoría creada",
      description: "La categoría se creó correctamente"
    });

    setCategoryForm({ name: '', description: '' });
    setIsCategoryDialogOpen(false);
    loadCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Categoría eliminada"
    });
    
    loadCategories();
  };

  // Ingredients management
  const handleOpenIngredientsDialog = (product: Product) => {
    setSelectedProductForIngredients(product);
    loadProductIngredients(product.id);
    setIsIngredientsDialogOpen(true);
  };

  const handleAddIngredientToProduct = async () => {
    if (!newIngredient.ingredient_id || !newIngredient.quantity_needed || !selectedProductForIngredients) return;

    const { error } = await supabase
      .from('product_ingredients')
      .insert({
        product_id: selectedProductForIngredients.id,
        ingredient_id: newIngredient.ingredient_id,
        quantity_needed: parseFloat(newIngredient.quantity_needed)
      });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el ingrediente",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ingrediente agregado"
    });

    setNewIngredient({ ingredient_id: '', quantity_needed: '' });
    loadProductIngredients(selectedProductForIngredients.id);
  };

  const handleRemoveIngredientFromProduct = async (productIngredientId: string) => {
    const { error } = await supabase
      .from('product_ingredients')
      .delete()
      .eq('id', productIngredientId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el ingrediente",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ingrediente eliminado"
    });

    if (selectedProductForIngredients) {
      loadProductIngredients(selectedProductForIngredients.id);
    }
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
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Bebidas"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción opcional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCategory}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </div>

      {/* Categories List */}
      {categories.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Badge key={category.id} variant="secondary" className="flex items-center gap-2">
                {category.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => {
          const category = categories.find(c => c.id === product.category_id);
          
          return (
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
                    {category && (
                      <Badge variant="outline" className="mt-1">
                        {category.name}
                      </Badge>
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
                    onClick={() => handleOpenIngredientsDialog(product)}
                    className="flex-1"
                  >
                    <Coffee className="h-4 w-4 mr-1" />
                    Ingredientes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
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
          );
        })}
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

      {/* Ingredients Dialog */}
      <Dialog open={isIngredientsDialogOpen} onOpenChange={setIsIngredientsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ingredientes - {selectedProductForIngredients?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current ingredients */}
            <div>
              <h4 className="font-semibold mb-2">Ingredientes Actuales</h4>
              {productIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay ingredientes asignados</p>
              ) : (
                <div className="space-y-2">
                  {productIngredients.map(pi => (
                    <div key={pi.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{pi.ingredient?.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {pi.quantity_needed} {pi.ingredient?.unit}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredientFromProduct(pi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new ingredient */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Agregar Ingrediente</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Ingrediente</Label>
                  <Select
                    value={newIngredient.ingredient_id}
                    onValueChange={(value) => setNewIngredient(prev => ({ ...prev, ingredient_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} ({ing.current_stock} {ing.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newIngredient.quantity_needed}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity_needed: e.target.value }))}
                    />
                    <Button onClick={handleAddIngredientToProduct}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIngredientsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManager;
