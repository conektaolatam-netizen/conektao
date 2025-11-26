import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { Package, Plus, Trash2, Calculator, Check, ChevronRight } from 'lucide-react';
import { CostCalculationDialog } from '@/components/CostCalculationDialog';

interface CreateProductFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string }>;
}

interface ProductIngredient {
  ingredient_id: string;
  quantity_needed: number;
  ingredient_name?: string;
  unit?: string;
}

export const CreateProductFlow = ({ isOpen, onClose, onSuccess, categories }: CreateProductFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { ingredients } = useIngredients();
  
  // Steps: 1=basic info, 2=ingredients, 3=costing
  const [step, setStep] = useState(1);
  
  // Product data
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category_id: ''
  });
  
  // Ingredients
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  
  // Costing
  const [isCostingDialogOpen, setIsCostingDialogOpen] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  
  const resetForm = () => {
    setStep(1);
    setProductData({
      name: '',
      description: '',
      price: '',
      sku: '',
      category_id: ''
    });
    setProductIngredients([]);
    setSelectedIngredientId('');
    setQuantityNeeded('');
    setCalculatedCost(null);
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
      // 1. Crear el producto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description || null,
          price: parseFloat(productData.price),
          cost_price: calculatedCost || null,
          sku: productData.sku || null,
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU / Código</Label>
                  <Input
                    id="sku"
                    value={productData.sku}
                    onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                    placeholder="Ej: PIZ-001"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={productData.category_id}
                    onValueChange={(value) => setProductData({ ...productData, category_id: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ingrediente..." />
                      </SelectTrigger>
                      <SelectContent>
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
    </>
  );
};
