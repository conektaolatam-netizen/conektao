import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useIngredients } from '@/hooks/useIngredients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Trash2, Calculator, Check, ChevronRight, FolderPlus } from 'lucide-react';
import { CostCalculationDialog } from '@/components/CostCalculationDialog';

interface CreateProductFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string }>;
  onCategoryCreated?: () => void;
}

interface ProductIngredient {
  ingredient_id: string;
  quantity_needed: number;
  ingredient_name?: string;
  unit?: string;
}

export const CreateProductFlow = ({ isOpen, onClose, onSuccess, categories, onCategoryCreated }: CreateProductFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { ingredients, loadIngredients } = useIngredients();
  
  // Steps: 1=basic info, 2=ingredients, 3=costing
  const [step, setStep] = useState(1);
  
  // Product data (removed sku from here)
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: ''
  });
  
  // Category creation dialog
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Ingredients
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  
  // Costing
  const [isCostingDialogOpen, setIsCostingDialogOpen] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  
  // New ingredient creation
  const [isNewIngredientDialogOpen, setIsNewIngredientDialogOpen] = useState(false);
  const [newIngredientForm, setNewIngredientForm] = useState({
    name: '',
    unit: 'gramos',
    cost_per_unit: '',
    min_stock: '0',
    current_stock: '0'
  });
  
  const resetForm = () => {
    setStep(1);
    setProductData({
      name: '',
      description: '',
      price: '',
      category_id: ''
    });
    setProductIngredients([]);
    setSelectedIngredientId('');
    setQuantityNeeded('');
    setCalculatedCost(null);
    setNewCategoryName('');
    setNewIngredientForm({
      name: '',
      unit: 'gramos',
      cost_per_unit: '',
      min_stock: '0',
      current_stock: '0'
    });
  };
  
  // Generate automatic SKU
  const generateSKU = (productName: string, categoryName?: string) => {
    const prefix = categoryName ? categoryName.substring(0, 3).toUpperCase() : 'PRD';
    const timestamp = Date.now().toString().slice(-6);
    const namePrefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    return `${prefix}-${namePrefix}-${timestamp}`;
  };
  
  // Handle new category creation
  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresa un nombre para la categoría",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✓ Categoría creada",
        description: `"${newCategoryName}" está lista para usar`,
      });

      setProductData(prev => ({ ...prev, category_id: data.id }));
      setIsNewCategoryDialogOpen(false);
      setNewCategoryName('');
      
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error al crear categoría",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle new ingredient creation
  const handleCreateIngredient = async () => {
    if (!user || !newIngredientForm.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresa un nombre para el ingrediente",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get user's restaurant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          name: newIngredientForm.name,
          unit: newIngredientForm.unit,
          cost_per_unit: newIngredientForm.cost_per_unit ? parseFloat(newIngredientForm.cost_per_unit) : null,
          min_stock: parseFloat(newIngredientForm.min_stock),
          current_stock: parseFloat(newIngredientForm.current_stock),
          user_id: user.id,
          restaurant_id: profile?.restaurant_id || null,
          is_active: true,
          is_compound: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✓ Ingrediente creado",
        description: `"${newIngredientForm.name}" está listo para usar`,
      });

      // Add the new ingredient to the recipe with the pending quantity
      if (quantityNeeded) {
        setProductIngredients([
          ...productIngredients,
          {
            ingredient_id: data.id,
            quantity_needed: parseFloat(quantityNeeded),
            ingredient_name: data.name,
            unit: data.unit
          }
        ]);
        setQuantityNeeded('');
      } else {
        // If no quantity was set, just select the new ingredient
        setSelectedIngredientId(data.id);
      }

      setIsNewIngredientDialogOpen(false);
      setNewIngredientForm({
        name: '',
        unit: 'gramos',
        cost_per_unit: '',
        min_stock: '0',
        current_stock: '0'
      });

      // Refresh ingredients list
      await loadIngredients();
    } catch (error: any) {
      console.error('Error creating ingredient:', error);
      toast({
        title: "Error al crear ingrediente",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddIngredient = () => {
    if (!selectedIngredientId || !quantityNeeded) {
      toast({
        title: "Campos incompletos",
        description: "Selecciona un ingrediente y la cantidad",
        variant: "destructive"
      });
      return;
    }

    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    if (!ingredient) return;

    const exists = productIngredients.find(pi => pi.ingredient_id === selectedIngredientId);
    if (exists) {
      toast({
        title: "Ingrediente duplicado",
        description: "Este ingrediente ya fue agregado",
        variant: "destructive"
      });
      return;
    }

    setProductIngredients([
      ...productIngredients,
      {
        ingredient_id: selectedIngredientId,
        quantity_needed: parseFloat(quantityNeeded),
        ingredient_name: ingredient.name,
        unit: ingredient.unit
      }
    ]);

    setSelectedIngredientId('');
    setQuantityNeeded('');
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setProductIngredients(productIngredients.filter(pi => pi.ingredient_id !== ingredientId));
  };

  const handleOpenCosting = () => {
    if (productIngredients.length === 0) {
      toast({
        title: "Sin ingredientes",
        description: "Agrega ingredientes antes de costear el producto",
        variant: "destructive"
      });
      return;
    }
    setIsCostingDialogOpen(true);
  };

  const handleCostCalculated = (cost: number) => {
    setCalculatedCost(cost);
    
    // Auto-sugerir precio de venta con 70% de margen
    const suggestedPrice = Math.ceil(cost * 1.7);
    setProductData(prev => ({
      ...prev,
      price: suggestedPrice.toString()
    }));

    toast({
      title: "✓ Costo calculado",
      description: `Costo: $${cost.toLocaleString()} | Precio sugerido: $${suggestedPrice.toLocaleString()}`,
    });
  };

  const canProceedToStep2 = () => {
    return productData.name.trim() !== '' && productData.price.trim() !== '';
  };

  const canProceedToStep3 = () => {
    return productIngredients.length > 0;
  };

  const handleFinalSave = async () => {
    if (!user || !productData.name || !productData.price) {
      toast({
        title: "Datos incompletos",
        description: "Completa nombre y precio del producto",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate automatic SKU
      const categoryName = categories.find(c => c.id === productData.category_id)?.name;
      const generatedSKU = generateSKU(productData.name, categoryName);

      // 1. Crear el producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description || null,
          price: parseFloat(productData.price),
          cost_price: calculatedCost || null,
          sku: generatedSKU,
          category_id: productData.category_id || null,
          user_id: user.id,
          is_active: true
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Crear relaciones con ingredientes
      if (productIngredients.length > 0) {
        const ingredientRelations = productIngredients.map(pi => ({
          product_id: product.id,
          ingredient_id: pi.ingredient_id,
          quantity_needed: pi.quantity_needed
        }));

        const { error: ingredientsError } = await supabase
          .from('product_ingredients')
          .insert(ingredientRelations);

        if (ingredientsError) throw ingredientsError;
      }

      toast({
        title: "🎉 Producto creado",
        description: `"${productData.name}" está listo para venderse`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error al crear producto",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const availableIngredients = ingredients.filter(
    ing => !productIngredients.some(pi => pi.ingredient_id === ing.id)
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Crear Producto con Costeo
            </DialogTitle>
            <DialogDescription>
              Creá tu plato. Nosotros nos encargamos del costeo.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Información</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {step > 2 ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Receta</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">Costeo</span>
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  placeholder="Ej: Pizza Hawaiana"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                  placeholder="Descripción breve del producto"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <div className="flex gap-2">
                  <Select
                    value={productData.category_id}
                    onValueChange={(value) => {
                      if (value === '_new_') {
                        setIsNewCategoryDialogOpen(true);
                      } else {
                        setProductData({ ...productData, category_id: value });
                      }
                    }}
                  >
                    <SelectTrigger id="category" className="flex-1">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_new_" className="text-primary font-medium">
                        <div className="flex items-center gap-2">
                          <FolderPlus className="h-4 w-4" />
                          Crear nueva categoría
                        </div>
                      </SelectItem>
                      {categories.length > 0 && <div className="h-px bg-border my-1" />}
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  El código SKU se genera automáticamente
                </p>
              </div>

              <div>
                <Label htmlFor="price">Precio de Venta *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={productData.price}
                  onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Podés ajustarlo después del costeo
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep(2)} disabled={!canProceedToStep2()}>
                  Siguiente: Receta
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Ingredients */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Agregar ingredientes</h3>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                  <div>
                    <Label>Ingrediente</Label>
                    <Select 
                      value={selectedIngredientId} 
                      onValueChange={(value) => {
                        if (value === '_new_') {
                          setIsNewIngredientDialogOpen(true);
                        } else {
                          setSelectedIngredientId(value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ingrediente..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_new_" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Crear nuevo ingrediente
                          </div>
                        </SelectItem>
                        {availableIngredients.length > 0 && <div className="h-px bg-border my-1" />}
                        {availableIngredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-28">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quantityNeeded}
                      onChange={(e) => setQuantityNeeded(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <Button onClick={handleAddIngredient} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <Label>Ingredientes agregados ({productIngredients.length})</Label>
                {productIngredients.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    <p>Aún no hay ingredientes</p>
                    <p className="text-sm mt-1">Agrega los ingredientes que componen este producto</p>
                  </Card>
                ) : (
                  productIngredients.map(pi => (
                    <Card key={pi.ingredient_id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{pi.ingredient_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {pi.quantity_needed} {pi.unit}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredient(pi.ingredient_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedToStep3()}>
                  Siguiente: Costeo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Costing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                <div className="flex items-start gap-3">
                  <Calculator className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Costeo Automático</h3>
                    <p className="text-sm text-muted-foreground">
                      Calculamos el costo real de tu producto considerando ingredientes, transporte y mermas.
                    </p>
                  </div>
                </div>
              </div>

              {calculatedCost === null ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Hace clic para costear este producto
                  </p>
                  <Button onClick={handleOpenCosting} size="lg">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Costo
                  </Button>
                </div>
              ) : (
                <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold">Producto Costeado</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Costo Unitario</Label>
                      <p className="text-2xl font-bold">${calculatedCost.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Precio de Venta</Label>
                      <p className="text-2xl font-bold text-primary">${parseFloat(productData.price).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Margen de Utilidad</span>
                      <Badge variant="secondary" className="text-lg">
                        {((parseFloat(productData.price) - calculatedCost) / parseFloat(productData.price) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenCosting}
                    className="w-full mt-4"
                  >
                    Recalcular Costo
                  </Button>
                </Card>
              )}

              <div className="border-t pt-4">
                <Label htmlFor="final-price" className="mb-2">Ajustar Precio de Venta (opcional)</Label>
                <Input
                  id="final-price"
                  type="number"
                  step="0.01"
                  value={productData.price}
                  onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                />
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Atrás
                </Button>
                <Button onClick={handleFinalSave} size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Crear Producto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cost Calculation Dialog */}
      <CostCalculationDialog
        isOpen={isCostingDialogOpen}
        onClose={() => setIsCostingDialogOpen(false)}
        productData={{
          name: productData.name,
          ingredients: productIngredients.map(pi => ({
            name: pi.ingredient_name,
            quantity: pi.quantity_needed,
            unit: pi.unit
          }))
        }}
        onCostCalculated={handleCostCalculated}
      />

      {/* New Category Dialog */}
      <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>
              Ingresá el nombre de la nueva categoría para tus productos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category-name">Nombre de la Categoría *</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Pizzas, Bebidas, Postres..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewCategoryDialogOpen(false);
                setNewCategoryName('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              <Check className="h-4 w-4 mr-2" />
              Crear Categoría
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Ingredient Dialog */}
      <Dialog open={isNewIngredientDialogOpen} onOpenChange={setIsNewIngredientDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ingrediente</DialogTitle>
            <DialogDescription>
              Este ingrediente se guardará en tu inventario y estará disponible para futuras recetas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="ingredient-name">Nombre del Ingrediente *</Label>
              <Input
                id="ingredient-name"
                value={newIngredientForm.name}
                onChange={(e) => setNewIngredientForm({ ...newIngredientForm, name: e.target.value })}
                placeholder="Ej: Harina de trigo, Tomate fresco..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateIngredient();
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredient-unit">Unidad de Medida *</Label>
                <Select
                  value={newIngredientForm.unit}
                  onValueChange={(value) => setNewIngredientForm({ ...newIngredientForm, unit: value })}
                >
                  <SelectTrigger id="ingredient-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gramos">Gramos</SelectItem>
                    <SelectItem value="kilogramos">Kilogramos</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="mililitros">Mililitros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="onzas">Onzas</SelectItem>
                    <SelectItem value="libras">Libras</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ingredient-cost">Precio Estimado</Label>
                <Input
                  id="ingredient-cost"
                  type="number"
                  step="0.01"
                  value={newIngredientForm.cost_per_unit}
                  onChange={(e) => setNewIngredientForm({ ...newIngredientForm, cost_per_unit: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional - se actualizará con facturas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredient-stock">Stock Inicial</Label>
                <Input
                  id="ingredient-stock"
                  type="number"
                  step="0.01"
                  value={newIngredientForm.current_stock}
                  onChange={(e) => setNewIngredientForm({ ...newIngredientForm, current_stock: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="ingredient-min">Stock Mínimo</Label>
                <Input
                  id="ingredient-min"
                  type="number"
                  step="0.01"
                  value={newIngredientForm.min_stock}
                  onChange={(e) => setNewIngredientForm({ ...newIngredientForm, min_stock: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para alertas de reposición
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 El costo se actualizará automáticamente cuando proceses facturas con este ingrediente
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewIngredientDialogOpen(false);
                setNewIngredientForm({
                  name: '',
                  unit: 'gramos',
                  cost_per_unit: '',
                  min_stock: '0',
                  current_stock: '0'
                });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateIngredient} 
              disabled={!newIngredientForm.name.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Crear y Usar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
