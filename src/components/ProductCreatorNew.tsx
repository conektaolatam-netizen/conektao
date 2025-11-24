import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus,
  Package,
  Trash2,
  Calculator,
  CheckCircle,
  Beaker,
  X
} from 'lucide-react';

interface ProductCreatorNewProps {
  onProductCreated: () => void;
  existingProduct?: {
    id: string;
    name: string;
    price: number;
    cost_price?: number;
    description?: string;
  };
}

interface IngredientData {
  id?: string; // Si ya existe
  name: string;
  quantity: string;
  unit: string;
  cost_per_unit?: string;
  is_compound: boolean;
  recipe?: RecipeIngredient[]; // Si es compuesto
  yield_amount?: string; // Cuánto produce la receta
}

interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
}

interface AvailableIngredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number | null;
  current_stock: number;
  is_compound: boolean;
}

const ProductCreatorNew = ({ onProductCreated, existingProduct }: ProductCreatorNewProps) => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [productIngredients, setProductIngredients] = useState<IngredientData[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Create ingredient dialog state
  const [showCreateIngredientDialog, setShowCreateIngredientDialog] = useState(false);
  const [newIngredient, setNewIngredient] = useState<IngredientData>({
    name: '',
    quantity: '',
    unit: 'gramos',
    cost_per_unit: '',
    is_compound: false,
    recipe: [],
    yield_amount: ''
  });

  useEffect(() => {
    if (user) {
      loadCategories();
      loadAvailableIngredients();
    }
  }, [user]);

  useEffect(() => {
    if (existingProduct) {
      setProductName(existingProduct.name);
      setPrice(existingProduct.price.toString());
      loadExistingProductIngredients(existingProduct.id);
    }
  }, [existingProduct]);

  const loadCategories = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAvailableIngredients = async () => {
    if (!user || !profile?.restaurant_id) return;
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit, current_stock, is_compound')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setAvailableIngredients(data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadExistingProductIngredients = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select(`
          quantity_needed,
          ingredient:ingredients!product_ingredients_ingredient_id_fkey(
            id, name, unit, cost_per_unit, is_compound
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;

      const loadedIngredients: IngredientData[] = (data || []).map((item: any) => ({
        id: item.ingredient.id,
        name: item.ingredient.name,
        quantity: item.quantity_needed.toString(),
        unit: item.ingredient.unit,
        cost_per_unit: item.ingredient.cost_per_unit?.toString() || '',
        is_compound: item.ingredient.is_compound || false,
        recipe: [],
        yield_amount: ''
      }));

      setProductIngredients(loadedIngredients);
    } catch (error) {
      console.error('Error loading product ingredients:', error);
    }
  };

  const handleAddExistingIngredient = (ingredientId: string) => {
    const ingredient = availableIngredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    // Check if already added
    if (productIngredients.some(i => i.id === ingredientId)) {
      toast({
        title: "Ingrediente duplicado",
        description: "Este ingrediente ya está en la lista",
        variant: "destructive"
      });
      return;
    }

    setProductIngredients([...productIngredients, {
      id: ingredient.id,
      name: ingredient.name,
      quantity: '',
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit?.toString() || '',
      is_compound: ingredient.is_compound,
      recipe: [],
      yield_amount: ''
    }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setProductIngredients(productIngredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredientQuantity = (index: number, quantity: string) => {
    const updated = [...productIngredients];
    updated[index].quantity = quantity;
    setProductIngredients(updated);
  };

  const handleOpenCreateIngredient = () => {
    setNewIngredient({
      name: '',
      quantity: '',
      unit: 'gramos',
      cost_per_unit: '',
      is_compound: false,
      recipe: [],
      yield_amount: ''
    });
    setShowCreateIngredientDialog(true);
  };

  const handleAddRecipeIngredient = () => {
    if (!newIngredient.recipe) {
      setNewIngredient({...newIngredient, recipe: []});
    }
    setNewIngredient({
      ...newIngredient,
      recipe: [...(newIngredient.recipe || []), {
        ingredient_id: '',
        ingredient_name: '',
        quantity: '',
        unit: 'gramos'
      }]
    });
  };

  const handleUpdateRecipeIngredient = (index: number, field: string, value: string) => {
    if (!newIngredient.recipe) return;
    const updated = [...newIngredient.recipe];
    
    if (field === 'ingredient_id') {
      const ing = availableIngredients.find(i => i.id === value);
      if (ing) {
        updated[index] = {
          ...updated[index],
          ingredient_id: value,
          ingredient_name: ing.name,
          unit: ing.unit
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setNewIngredient({...newIngredient, recipe: updated});
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    if (!newIngredient.recipe) return;
    setNewIngredient({
      ...newIngredient,
      recipe: newIngredient.recipe.filter((_, i) => i !== index)
    });
  };

  const handleSaveNewIngredient = async () => {
    if (!user || !profile?.restaurant_id || !newIngredient.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del ingrediente es requerido",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Crear el ingrediente
      const { data: createdIngredient, error: ingredientError } = await supabase
        .from('ingredients')
        .insert({
          name: newIngredient.name.trim(),
          unit: newIngredient.unit,
          cost_per_unit: newIngredient.cost_per_unit ? parseFloat(newIngredient.cost_per_unit) : null,
          is_compound: newIngredient.is_compound,
          current_stock: 0,
          min_stock: 0,
          user_id: user.id,
          restaurant_id: profile.restaurant_id,
          is_active: true
        })
        .select()
        .single();

      if (ingredientError) throw ingredientError;

      // 2. Si es compuesto, crear su receta
      if (newIngredient.is_compound && newIngredient.recipe && newIngredient.recipe.length > 0) {
        const yieldAmount = newIngredient.yield_amount ? parseFloat(newIngredient.yield_amount) : 1;
        
        const recipeInserts = newIngredient.recipe
          .filter(r => r.ingredient_id && r.quantity)
          .map(r => ({
            compound_ingredient_id: createdIngredient.id,
            base_ingredient_id: r.ingredient_id,
            quantity_needed: parseFloat(r.quantity),
            yield_amount: yieldAmount,
            unit: r.unit
          }));

        if (recipeInserts.length > 0) {
          const { error: recipeError } = await supabase
            .from('ingredient_recipes')
            .insert(recipeInserts);

          if (recipeError) throw recipeError;
        }

        // Calcular costo del compuesto
        let totalCost = 0;
        for (const r of newIngredient.recipe) {
          const baseIng = availableIngredients.find(i => i.id === r.ingredient_id);
          if (baseIng && baseIng.cost_per_unit && r.quantity) {
            totalCost += baseIng.cost_per_unit * parseFloat(r.quantity);
          }
        }
        const costPerUnit = totalCost / yieldAmount;

        // Actualizar costo del ingrediente compuesto
        await supabase
          .from('ingredients')
          .update({ cost_per_unit: costPerUnit })
          .eq('id', createdIngredient.id);

        createdIngredient.cost_per_unit = costPerUnit;
      }

      // 3. Agregar a la lista de ingredientes del producto
      setProductIngredients([...productIngredients, {
        id: createdIngredient.id,
        name: createdIngredient.name,
        quantity: newIngredient.quantity,
        unit: createdIngredient.unit,
        cost_per_unit: createdIngredient.cost_per_unit?.toString() || '',
        is_compound: createdIngredient.is_compound,
        recipe: [],
        yield_amount: ''
      }]);

      // 4. Recargar ingredientes disponibles
      loadAvailableIngredients();

      toast({
        title: "Ingrediente creado",
        description: `${createdIngredient.name} ${newIngredient.is_compound ? '(compuesto) ' : ''}ha sido creado exitosamente`
      });

      setShowCreateIngredientDialog(false);
    } catch (error) {
      console.error('Error creating ingredient:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ingrediente",
        variant: "destructive"
      });
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    for (const ing of productIngredients) {
      if (ing.cost_per_unit && ing.quantity) {
        total += parseFloat(ing.cost_per_unit) * parseFloat(ing.quantity);
      }
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.restaurant_id) return;

    if (!productName.trim() || !price || productIngredients.length === 0) {
      toast({
        title: "Información incompleta",
        description: "Completa nombre, precio y al menos un ingrediente",
        variant: "destructive"
      });
      return;
    }

    // Validar que todos los ingredientes tengan cantidad
    if (productIngredients.some(i => !i.quantity || parseFloat(i.quantity) <= 0)) {
      toast({
        title: "Cantidades incompletas",
        description: "Todos los ingredientes deben tener una cantidad válida",
        variant: "destructive"
      });
      return;
    }

    try {
      if (existingProduct?.id) {
        // Actualizar producto
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: productName,
            price: parseFloat(price),
            cost_price: calculateTotalCost(),
            category_id: selectedCategoryId || null
          })
          .eq('id', existingProduct.id);

        if (updateError) throw updateError;

        // Eliminar relaciones anteriores
        await supabase
          .from('product_ingredients')
          .delete()
          .eq('product_id', existingProduct.id);

        // Crear nuevas relaciones
        const productIngredientInserts = productIngredients
          .filter(i => i.id)
          .map(i => ({
            product_id: existingProduct.id,
            ingredient_id: i.id,
            quantity_needed: parseFloat(i.quantity)
          }));

        if (productIngredientInserts.length > 0) {
          const { error: piError } = await supabase
            .from('product_ingredients')
            .insert(productIngredientInserts);

          if (piError) throw piError;
        }

        toast({
          title: "Producto actualizado",
          description: `${productName} ha sido actualizado exitosamente`
        });
      } else {
        // Crear producto nuevo
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: productName,
            price: parseFloat(price),
            cost_price: calculateTotalCost(),
            category_id: selectedCategoryId || null,
            user_id: user.id,
            is_active: true
          })
          .select()
          .single();

        if (productError) throw productError;

        // Crear relaciones product_ingredients
        const productIngredientInserts = productIngredients
          .filter(i => i.id)
          .map(i => ({
            product_id: product.id,
            ingredient_id: i.id,
            quantity_needed: parseFloat(i.quantity)
          }));

        if (productIngredientInserts.length > 0) {
          const { error: piError } = await supabase
            .from('product_ingredients')
            .insert(productIngredientInserts);

          if (piError) throw piError;
        }

        toast({
          title: "Producto creado",
          description: `${productName} ha sido creado con ${productIngredients.length} ingredientes`
        });
      }

      // Reset form
      setProductName('');
      setPrice('');
      setSelectedCategoryId('');
      setProductIngredients([]);
      onProductCreated();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      });
    }
  };

  const totalCost = calculateTotalCost();
  const margin = price && totalCost > 0 ? ((parseFloat(price) - totalCost) / parseFloat(price)) * 100 : 0;

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {existingProduct ? `Editar: ${existingProduct.name}` : 'Crear Producto para Venta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Nombre del Producto *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Pizza Hawaiana"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Precio de Venta ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
                {totalCost > 0 && price && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Badge variant={margin > 0 ? "default" : "destructive"}>
                      Margen: {margin.toFixed(1)}%
                    </Badge>
                    <span className="text-muted-foreground">
                      Ganancia: ${(parseFloat(price) - totalCost).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sección de ingredientes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ingredientes del Producto *</Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleAddExistingIngredient}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="+ Ingrediente existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIngredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} {ing.is_compound && <Beaker className="inline h-3 w-3 ml-1" />}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={handleOpenCreateIngredient}>
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Ingrediente
                  </Button>
                </div>
              </div>

              {/* Lista de ingredientes */}
              {productIngredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Agrega ingredientes para definir la receta de este producto
                </div>
              ) : (
                <div className="space-y-2">
                  {productIngredients.map((ing, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {ing.name}
                          {ing.is_compound && (
                            <Badge variant="secondary" className="text-xs">
                              <Beaker className="h-3 w-3 mr-1" />
                              Compuesto
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ing.cost_per_unit && `$${parseFloat(ing.cost_per_unit).toFixed(2)} por ${ing.unit}`}
                        </div>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={`${ing.unit}`}
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredientQuantity(index, e.target.value)}
                          required
                        />
                      </div>
                      <div className="text-sm font-medium w-20 text-right">
                        {ing.quantity && ing.cost_per_unit && 
                          `$${(parseFloat(ing.quantity) * parseFloat(ing.cost_per_unit)).toFixed(2)}`
                        }
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Resumen de costos */}
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-semibold">
                    <span>Costo Total del Producto:</span>
                    <span className="text-lg">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onProductCreated()}>
                Cancelar
              </Button>
              <Button type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />
                {existingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog para crear nuevo ingrediente */}
      <Dialog open={showCreateIngredientDialog} onOpenChange={setShowCreateIngredientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ingrediente</DialogTitle>
            <DialogDescription>
              Define un ingrediente simple (comprado) o compuesto (producido internamente)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newIngName">Nombre del Ingrediente *</Label>
                <Input
                  id="newIngName"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  placeholder="Ej: Piña, Azúcar, Piña Melada"
                />
              </div>
              <div>
                <Label htmlFor="newIngUnit">Unidad de Medida *</Label>
                <Select 
                  value={newIngredient.unit} 
                  onValueChange={(value) => setNewIngredient({...newIngredient, unit: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gramos">Gramos</SelectItem>
                    <SelectItem value="kilogramos">Kilogramos</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                    <SelectItem value="mililitros">Mililitros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newIngQuantity">Cantidad para este producto</Label>
                <Input
                  id="newIngQuantity"
                  type="number"
                  step="0.01"
                  value={newIngredient.quantity}
                  onChange={(e) => setNewIngredient({...newIngredient, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="newIngCost">Costo por Unidad ($)</Label>
                <Input
                  id="newIngCost"
                  type="number"
                  step="0.01"
                  value={newIngredient.cost_per_unit}
                  onChange={(e) => setNewIngredient({...newIngredient, cost_per_unit: e.target.value})}
                  placeholder="0.00"
                  disabled={newIngredient.is_compound}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCompound"
                checked={newIngredient.is_compound}
                onChange={(e) => setNewIngredient({
                  ...newIngredient, 
                  is_compound: e.target.checked,
                  recipe: e.target.checked ? [] : undefined,
                  yield_amount: e.target.checked ? '' : undefined
                })}
                className="h-4 w-4"
              />
              <Label htmlFor="isCompound" className="flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Este ingrediente se produce internamente (compuesto)
              </Label>
            </div>

            {/* Receta para ingrediente compuesto */}
            {newIngredient.is_compound && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label>Receta Interna</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRecipeIngredient}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ingrediente Base
                  </Button>
                </div>

                <div>
                  <Label htmlFor="yieldAmount">Rendimiento (cuánto produce esta receta)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="yieldAmount"
                      type="number"
                      step="0.01"
                      value={newIngredient.yield_amount}
                      onChange={(e) => setNewIngredient({...newIngredient, yield_amount: e.target.value})}
                      placeholder="Ej: 3"
                      className="w-24"
                    />
                    <span className="flex items-center text-sm text-muted-foreground">
                      {newIngredient.unit}
                    </span>
                  </div>
                </div>

                {newIngredient.recipe && newIngredient.recipe.map((recipeIng, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Select
                        value={recipeIng.ingredient_id}
                        onValueChange={(value) => handleUpdateRecipeIngredient(idx, 'ingredient_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona ingrediente base" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableIngredients.filter(i => !i.is_compound).map(ing => (
                            <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Cantidad"
                      value={recipeIng.quantity}
                      onChange={(e) => handleUpdateRecipeIngredient(idx, 'quantity', e.target.value)}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipeIngredient(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {(!newIngredient.recipe || newIngredient.recipe.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Agrega ingredientes base que conforman este ingrediente compuesto
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateIngredientDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewIngredient}>
              Crear Ingrediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCreatorNew;
