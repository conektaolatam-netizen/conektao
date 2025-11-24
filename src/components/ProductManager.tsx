import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, DollarSign, Coffee, X, AlertCircle, ShoppingCart, TrendingUp, Power, PowerOff } from 'lucide-react';
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

interface ProductAvailability {
  maxUnits: number;
  limitingIngredient: string | null;
  productCost: number;
}

const ProductManager = ({ onModuleChange }: { onModuleChange?: (module: string) => void }) => {
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
  
  // New ingredient creation dialog
  const [isNewIngredientDialogOpen, setIsNewIngredientDialogOpen] = useState(false);
  const [newIngredientForm, setNewIngredientForm] = useState({
    name: '',
    unit: 'gramos',
    min_stock: '0',
    current_stock: '0',
    cost_per_unit: ''
  });
  
  // Product availability tracking
  const [productsAvailability, setProductsAvailability] = useState<Record<string, ProductAvailability>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
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

  // Load products availability after products are loaded
  useEffect(() => {
    if (products.length > 0) {
      loadProductsAvailability();
    }
  }, [products]);

  const loadProductsAvailability = async () => {
    if (!products.length) return;
    
    setIsLoadingAvailability(true);
    const availabilityMap: Record<string, ProductAvailability> = {};
    
    for (const product of products) {
      try {
        // Check availability
        const { data: availData } = await supabase
          .rpc('check_product_ingredients_available', {
            p_product_id: product.id,
            p_quantity: 1
          });
        
        // Calculate cost
        const { data: costData } = await supabase
          .rpc('calculate_product_cost', {
            p_product_id: product.id
          });
        
        availabilityMap[product.id] = {
          maxUnits: availData?.[0]?.max_units || 0,
          limitingIngredient: availData?.[0]?.limiting_ingredient_name || null,
          productCost: costData || 0
        };
      } catch (error) {
        console.error(`Error loading availability for ${product.name}:`, error);
        availabilityMap[product.id] = {
          maxUnits: 0,
          limitingIngredient: null,
          productCost: 0
        };
      }
    }
    
    setProductsAvailability(availabilityMap);
    setIsLoadingAvailability(false);
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

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId)
      .eq('user_id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: currentStatus ? "Producto desactivado" : "Producto activado",
      description: currentStatus 
        ? "El producto ya no aparecerá en ventas" 
        : "El producto está disponible para vender"
    });
    
    loadProducts();
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente este producto? Esta acción no se puede deshacer.')) return;

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
      description: "El producto se eliminó permanentemente"
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
  const handleOpenIngredientsDialog = async (product: Product) => {
    setSelectedProductForIngredients(product);
    await loadProductIngredients(product.id);
    
    // Check for low stock ingredients
    const lowStockIngredients = productIngredients.filter(pi => 
      pi.ingredient && pi.ingredient.current_stock < (pi.ingredient as any).min_stock
    );
    
    if (lowStockIngredients.length > 0) {
      toast({
        title: "⚠️ Stock Bajo Detectado",
        description: `${lowStockIngredients.length} ingrediente(s) por debajo del mínimo`,
        variant: "destructive"
      });
    }
    
    setIsIngredientsDialogOpen(true);
  };

  // Handle "Reponer Ingredientes" button
  const handleReponerIngredientes = () => {
    // Find products with 0 availability
    const productsOutOfStock = products.filter(
      p => productsAvailability[p.id]?.maxUnits === 0
    );
    
    if (productsOutOfStock.length === 0) {
      toast({
        title: "✅ Todo en orden",
        description: "Tienes stock suficiente para todos tus productos"
      });
      return;
    }
    
    // Build message with limiting ingredients
    const ingredientsToRestock = new Map<string, string[]>();
    
    productsOutOfStock.forEach(product => {
      const availability = productsAvailability[product.id];
      if (availability?.limitingIngredient) {
        const productsList = ingredientsToRestock.get(availability.limitingIngredient) || [];
        productsList.push(product.name);
        ingredientsToRestock.set(availability.limitingIngredient, productsList);
      }
    });
    
    let message = `📦 INGREDIENTES A REPONER:\n\n`;
    ingredientsToRestock.forEach((productsList, ingredient) => {
      message += `• ${ingredient}\n  Afecta: ${productsList.join(', ')}\n\n`;
    });
    
    message += `\n¿Ir al Marketplace para comprar?`;
    
    const goToMarketplace = confirm(message);
    
    if (goToMarketplace && onModuleChange) {
      onModuleChange('marketplace');
    }
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

  const handleCreateNewIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newIngredientForm.name) return;

    const ingredientData = {
      name: newIngredientForm.name,
      unit: newIngredientForm.unit,
      min_stock: parseFloat(newIngredientForm.min_stock) || 0,
      current_stock: parseFloat(newIngredientForm.current_stock) || 0,
      cost_per_unit: newIngredientForm.cost_per_unit ? parseFloat(newIngredientForm.cost_per_unit) : null,
      user_id: user.id,
      is_active: true
    };

    const { data, error } = await supabase
      .from('ingredients')
      .insert([ingredientData])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el ingrediente",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "✅ Ingrediente creado",
      description: `${newIngredientForm.name} se creó correctamente`
    });

    // Reset form
    setNewIngredientForm({
      name: '',
      unit: 'gramos',
      min_stock: '0',
      current_stock: '0',
      cost_per_unit: ''
    });
    
    setIsNewIngredientDialogOpen(false);
    
    // Reload ingredients and auto-select the new one
    await loadIngredients();
    if (data) {
      setNewIngredient(prev => ({ ...prev, ingredient_id: data.id }));
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
          <p className="text-muted-foreground mt-2">Administra tu catálogo de productos y su disponibilidad</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReponerIngredientes}
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Reponer Ingredientes
          </Button>
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

                {/* NEW: Availability and Cost Section */}
                {!isLoadingAvailability && productsAvailability[product.id] && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {/* Product Cost */}
                      <div>
                        <p className="text-muted-foreground text-xs">Costo</p>
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(productsAvailability[product.id].productCost)}
                        </p>
                      </div>
                      
                      {/* Profit Margin */}
                      <div>
                        <p className="text-muted-foreground text-xs">Margen</p>
                        <p className="font-semibold text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {productsAvailability[product.id].productCost > 0 
                            ? ((product.price - productsAvailability[product.id].productCost) / product.price * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      
                      {/* Available Units - HIGHLIGHTED */}
                      <div className={`col-span-2 rounded-lg p-2 ${
                        productsAvailability[product.id].maxUnits === 0 
                          ? 'bg-destructive/10 border border-destructive/20' 
                          : 'bg-primary/5'
                      }`}>
                        <p className="text-muted-foreground text-xs mb-1">Disponible para vender</p>
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-lg ${
                            productsAvailability[product.id].maxUnits === 0 
                              ? 'text-destructive' 
                              : 'text-primary'
                          }`}>
                            {productsAvailability[product.id].maxUnits} unidades
                          </p>
                          {productsAvailability[product.id].maxUnits === 0 && (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        
                        {/* Show limiting ingredient if exists */}
                        {productsAvailability[product.id].limitingIngredient && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Limitado por: <span className="font-medium text-destructive">
                              {productsAvailability[product.id].limitingIngredient}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                    onClick={() => handleToggleActive(product.id, product.is_active)}
                    className={product.is_active ? "text-orange-600" : "text-green-600"}
                    title={product.is_active ? "Desactivar producto" : "Activar producto"}
                  >
                    {product.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
                  {productIngredients.map(pi => {
                    const isLowStock = pi.ingredient && 
                      pi.ingredient.current_stock < (pi.ingredient as any).min_stock;
                    
                    return (
                      <div 
                        key={pi.id} 
                        className={`flex items-center justify-between p-2 border rounded ${
                          isLowStock ? 'border-destructive bg-destructive/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{pi.ingredient?.name}</span>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Stock Bajo
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground block">
                            {pi.quantity_needed} {pi.ingredient?.unit} necesarios
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            Stock actual: {pi.ingredient?.current_stock} {pi.ingredient?.unit}
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add new ingredient */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Agregar Ingrediente</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Ingrediente</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newIngredient.ingredient_id}
                      onValueChange={(value) => setNewIngredient(prev => ({ ...prev, ingredient_id: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.current_stock} {ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsNewIngredientDialogOpen(true)}
                      title="Crear nuevo ingrediente"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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

      {/* Dialog for creating new ingredient */}
      <Dialog open={isNewIngredientDialogOpen} onOpenChange={setIsNewIngredientDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ingrediente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNewIngredient} className="space-y-4">
            <div>
              <Label>Nombre del Ingrediente *</Label>
              <Input
                value={newIngredientForm.name}
                onChange={(e) => setNewIngredientForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Harina de trigo"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidad de Medida</Label>
                <Select
                  value={newIngredientForm.unit}
                  onValueChange={(value) => setNewIngredientForm(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="gramos">Gramos (g)</SelectItem>
                    <SelectItem value="kilogramos">Kilogramos (kg)</SelectItem>
                    <SelectItem value="litros">Litros (L)</SelectItem>
                    <SelectItem value="mililitros">Mililitros (ml)</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Stock Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIngredientForm.current_stock}
                  onChange={(e) => setNewIngredientForm(prev => ({ ...prev, current_stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIngredientForm.min_stock}
                  onChange={(e) => setNewIngredientForm(prev => ({ ...prev, min_stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label>Costo por Unidad (Opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIngredientForm.cost_per_unit}
                  onChange={(e) => setNewIngredientForm(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewIngredientDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!newIngredientForm.name}>
                Crear Ingrediente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManager;
