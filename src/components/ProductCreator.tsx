import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ToppingsManager } from './ToppingsManager';
import { CostCalculationDialog } from './CostCalculationDialog';
import { 
  Plus,
  Package,
  Calculator,
  Brain,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ProductCreatorProps {
  onProductCreated: () => void;
  onNeedCostCalculation: (productData: any) => void;
  existingProduct?: {
    id: string;
    name: string;
    price: number;
    cost_price?: number;
    description?: string;
  };
}

interface Topping {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  is_active: boolean;
}

const ProductCreator = ({ onProductCreated, onNeedCostCalculation, existingProduct }: ProductCreatorProps) => {
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: 'gramos' }]);
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('unidades');
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [showCostOptions, setShowCostOptions] = useState(false);
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [showToppingsManager, setShowToppingsManager] = useState(false);
  const [showCostCalculationDialog, setShowCostCalculationDialog] = useState(false);
  
  // Ingredients autocomplete
  const [existingIngredients, setExistingIngredients] = useState<string[]>([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<{[key: number]: string[]}>({});
  
  // Category management states
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check if this is MOCAI restaurant
  const isMocai = profile?.restaurant_id && user?.email === 'mocai@mocai.com';

  useEffect(() => {
    if (user) {
      loadCategories();
      loadExistingIngredients();
      if (isMocai) {
        loadToppings();
      }
    }
    
    // Load existing product data if provided
    if (existingProduct) {
      setProductName(existingProduct.name);
      setPrice(existingProduct.price.toString());
      setCostPrice(existingProduct.cost_price?.toString() || '');
      
      // Parse ingredients from description
      if (existingProduct.description) {
        const parsedIngredients = existingProduct.description.split(', ').map(desc => {
          const match = desc.match(/^(.+?)\s*\(([^)]+)\)$/);
          if (match) {
            return { name: match[1], quantity: '', unit: match[2] };
          }
          return { name: desc, quantity: '', unit: 'gramos' };
        });
        setIngredients(parsedIngredients.length > 0 ? parsedIngredients : [{ name: '', quantity: '', unit: 'gramos' }]);
      }
      
      if (existingProduct.cost_price) {
        setShowCostOptions(true);
      }
    }
  }, [isMocai, user, existingProduct]);

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

  const loadToppings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableToppings(data || []);
    } catch (error) {
      console.error('Error loading toppings:', error);
    }
  };

  const loadExistingIngredients = async () => {
    if (!user) return;

    try {
      // Obtener todos los productos del usuario y extraer ingredientes únicos
      const { data: products, error } = await supabase
        .from('products')
        .select('description')
        .eq('user_id', user.id);

      if (error) throw error;

      const ingredientsSet = new Set<string>();
      
      products?.forEach(product => {
        if (product.description) {
          // Extraer nombres de ingredientes de la descripción
          const ingredientMatches = product.description.split(', ');
          ingredientMatches.forEach(match => {
            const ingredientName = match.replace(/\s*\([^)]*\)/, '').trim();
            if (ingredientName) {
              ingredientsSet.add(ingredientName);
            }
          });
        }
      });

      setExistingIngredients(Array.from(ingredientsSet));
    } catch (error) {
      console.error('Error loading existing ingredients:', error);
    }
  };

  const getSuggestions = (input: string, index: number) => {
    if (!input || input.length < 2) {
      setIngredientSuggestions(prev => ({...prev, [index]: []}));
      return;
    }

    const filtered = existingIngredients.filter(ingredient =>
      ingredient.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);

    setIngredientSuggestions(prev => ({...prev, [index]: filtered}));
  };

  const selectSuggestion = (suggestion: string, index: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index].name = suggestion;
    setIngredients(newIngredients);
    setIngredientSuggestions(prev => ({...prev, [index]: []}));
  };

  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setSelectedCategoryId(data.id);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateCategory(false);

      toast({
        title: "Categoría creada",
        description: `La categoría "${data.name}" ha sido creada exitosamente`,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const calculateMargin = () => {
    const sellPrice = parseFloat(price);
    const cost = parseFloat(costPrice);
    
    if (sellPrice && cost && sellPrice > 0) {
      const margin = ((sellPrice - cost) / sellPrice) * 100;
      return margin.toFixed(1);
    }
    return "0";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (existingProduct?.id) {
        // Modo edición - actualizar producto existente y asegurar ingredientes en inventario + receta
        const { error: updateError } = await supabase
          .from("products")
          .update({
            name: productName,
            description: ingredients.map(ing => `${ing.name} (${ing.unit})`).join(', '),
            price: parseFloat(price),
            cost_price: costPrice ? parseFloat(costPrice) : null,
            category_id: selectedCategoryId && selectedCategoryId !== 'no-category' ? selectedCategoryId : null,
          })
          .eq('id', existingProduct.id);

        if (updateError) throw updateError;

        // Asegurar productos de materia prima e inventario por cada ingrediente
        const recipeIngredients: Array<{ ingredient_product_id: string; name: string; quantity: number; unit: string }> = [];
        for (const ing of ingredients.filter(i => i.name.trim())) {
          // Buscar producto de materia prima por nombre
          const { data: foundRaw } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', `%${ing.name}%`)
            .limit(1);

          let rawProductId = foundRaw && foundRaw.length > 0 ? foundRaw[0].id : null;

          if (!rawProductId) {
            // Crear producto de materia prima
            const { data: rawProduct, error: rawErr } = await supabase
              .from('products')
              .insert({
                name: ing.name.trim(),
                price: 0,
                cost_price: null,
                user_id: user.id,
                is_active: true,
              })
              .select()
              .single();
            if (rawErr) throw rawErr;
            rawProductId = rawProduct.id;
          }

          // Asegurar inventario para la materia prima
          const { data: inv } = await supabase
            .from('inventory')
            .select('id, unit')
            .eq('product_id', rawProductId)
            .maybeSingle();
          if (!inv) {
            await supabase.from('inventory').insert({
              product_id: rawProductId,
              current_stock: 0,
              min_stock: 0,
              unit: ing.unit,
              user_id: user.id,
            });
          } else if (inv.unit !== ing.unit && ing.unit) {
            // Mantener la unidad elegida en la receta; la unidad de inventario puede diferir
          }

          recipeIngredients.push({
            ingredient_product_id: rawProductId as string,
            name: ing.name.trim(),
            quantity: parseFloat(ing.quantity || '0') || 0,
            unit: ing.unit,
          });
        }

        // Upsert receta asociada al producto por nombre
        const { data: existingRecipe } = await supabase
          .from('recipes')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', productName)
          .maybeSingle();

        if (existingRecipe) {
          await supabase
            .from('recipes')
            .update({ ingredients: recipeIngredients, updated_at: new Date().toISOString() })
            .eq('id', existingRecipe.id);
        } else {
          await supabase
            .from('recipes')
            .insert({
              user_id: user.id,
              name: productName,
              ingredients: recipeIngredients,
              is_active: true,
            });
        }

        toast({
          title: "Producto actualizado",
          description: `${productName} se ha actualizado exitosamente. Ingredientes sincronizados con inventario y receta.`,
        });

        // Notificar al padre para cerrar y refrescar
        onProductCreated();
      } else {
        // Modo creación - crear nuevo producto
        const { data: productData, error: productError } = await supabase
          .from("products")
          .insert({
            name: productName,
            description: ingredients.map(ing => `${ing.name} (${ing.unit})`).join(', '),
            price: parseFloat(price),
            cost_price: costPrice ? parseFloat(costPrice) : null,
            category_id: selectedCategoryId && selectedCategoryId !== 'no-category' ? selectedCategoryId : null,
            user_id: user.id,
            is_active: true,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Crear o encontrar ingredientes y asegurar inventario y receta
        const uniqueIngredients = ingredients.filter(ing => ing.name.trim());
        const recipeIngredients: Array<{ ingredient_product_id: string; name: string; quantity: number; unit: string }> = [];

        for (const ingredient of uniqueIngredients) {
          // Buscar producto de materia prima por nombre
          const { data: foundRaw } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', `%${ingredient.name}%`)
            .limit(1);

          let rawProductId = foundRaw && foundRaw.length > 0 ? foundRaw[0].id : null;

          if (!rawProductId) {
            // Crear producto de materia prima
            const { data: rawProduct, error: rawErr } = await supabase
              .from('products')
              .insert({
                name: ingredient.name.trim(),
                price: 0,
                cost_price: null,
                user_id: user.id,
                is_active: true,
              })
              .select()
              .single();
            if (rawErr) throw rawErr;
            rawProductId = rawProduct.id;
          }

          // Asegurar inventario para materia prima
          const { data: inv } = await supabase
            .from('inventory')
            .select('id')
            .eq('product_id', rawProductId)
            .maybeSingle();
          if (!inv) {
            await supabase.from('inventory').insert({
              product_id: rawProductId,
              current_stock: 0,
              min_stock: 0,
              unit: ingredient.unit,
              user_id: user.id,
            });
          }

          recipeIngredients.push({
            ingredient_product_id: rawProductId as string,
            name: ingredient.name.trim(),
            quantity: parseFloat(ingredient.quantity || '0') || 0,
            unit: ingredient.unit,
          });
        }

        // Crear receta para este producto
        await supabase.from('recipes').insert({
          user_id: user.id,
          name: productName,
          ingredients: recipeIngredients,
          is_active: true,
        });

        // Si hay toppings seleccionados y es MOCAI, crear las relaciones
        if (isMocai && selectedToppings.length > 0) {
          const productToppings = selectedToppings.map(toppingId => ({
            product_id: productData.id,
            topping_id: toppingId
          }));

          const { error: toppingsError } = await supabase
            .from('product_toppings')
            .insert(productToppings);

          if (toppingsError) throw toppingsError;
        }

        toast({
          title: "Producto creado",
          description: `${productName} se ha agregado exitosamente con ${ingredients.length} ingredientes${selectedToppings.length > 0 ? ` y ${selectedToppings.length} toppings` : ''}.`,
        });
      }

      // Reset form
      setProductName("");
      setIngredients([{ name: '', quantity: '', unit: 'gramos' }]);
      setPrice("");
      setCostPrice("");
      setMinStock("");
      setUnit("unidades");
      setSelectedCategoryId("");
      setShowCostOptions(false);
      setSelectedToppings([]);
      setShowCreateCategory(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setIngredientSuggestions({});
      loadExistingIngredients(); // Recargar ingredientes después de crear
      onProductCreated();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
    }
  };

  const handleCalculateCost = () => {
    if (!productName || ingredients.some(ing => !ing.name.trim()) || !price) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa nombre, ingredientes y precio antes de calcular el costo",
        variant: "destructive",
      });
      return;
    }

    setShowCostCalculationDialog(true);
  };

  const handleCostCalculated = async (calculatedCost: number) => {
    setCostPrice(calculatedCost.toString());
    setShowCostOptions(true);
    
    // If it's an existing product, update the cost in database
    if (existingProduct?.id) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ cost_price: calculatedCost })
          .eq('id', existingProduct.id);

        if (error) throw error;

        toast({
          title: "Costo actualizado",
          description: `El costo de "${existingProduct.name}" se actualizó a $${calculatedCost.toLocaleString()}`,
        });
        
        // Notify parent component
        onProductCreated();
      } catch (error) {
        console.error('Error updating product cost:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el costo en la base de datos",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {existingProduct ? `Editar Producto - ${existingProduct.name}` : 'Crear Nuevo Producto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName" className="text-sm font-medium">
                  Nombre del Producto *
                </Label>
                <Input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  placeholder="Ej: Pizza Margherita"
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Precio de Venta * ($)
                  </Label>
                  {costPrice && price && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ganancia: {calculateMargin()}%</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        +${(parseFloat(price) - parseFloat(costPrice)).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Ingredientes * (Mínimo 1)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients([...ingredients, { name: '', quantity: '', unit: 'gramos' }])}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600"
                >
                  <Plus className="h-3 w-3" />
                  Agregar Ingrediente
                </Button>
              </div>
              
              <div className="space-y-2">
                 {ingredients.map((ingredient, index) => (
                   <div key={index} className="flex gap-2 items-start relative">
                     <div className="flex-1 relative">
                       <Input
                         type="text"
                         value={ingredient.name}
                         onChange={(e) => {
                           const newIngredients = [...ingredients];
                           newIngredients[index].name = e.target.value;
                           setIngredients(newIngredients);
                           getSuggestions(e.target.value, index);
                         }}
                         onBlur={() => {
                           // Ocultar sugerencias después de un delay
                           setTimeout(() => {
                             setIngredientSuggestions(prev => ({...prev, [index]: []}));
                           }, 150);
                         }}
                         placeholder={`Ingrediente ${index + 1}`}
                         required
                         className="text-sm"
                       />
                       
                       {/* Sugerencias de autocompletado */}
                       {ingredientSuggestions[index] && ingredientSuggestions[index].length > 0 && (
                         <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                           {ingredientSuggestions[index].map((suggestion, sugIndex) => (
                             <button
                               key={sugIndex}
                               type="button"
                               className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b last:border-b-0"
                               onMouseDown={() => selectSuggestion(suggestion, index)}
                             >
                               <span className="font-medium">{suggestion}</span>
                               <span className="text-xs text-green-600 ml-2">✓ Ya existe</span>
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        step="0.001"
                        value={ingredient.quantity}
                        onChange={(e) => {
                          const newIngredients = [...ingredients];
                          newIngredients[index].quantity = e.target.value;
                          setIngredients(newIngredients);
                        }}
                        placeholder="Cant."
                        className="text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <Select 
                        value={ingredient.unit} 
                        onValueChange={(value) => {
                          const newIngredients = [...ingredients];
                          newIngredients[index].unit = value;
                          setIngredients(newIngredients);
                        }}
                      >
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gramos">gr</SelectItem>
                          <SelectItem value="kilogramos">kg</SelectItem>
                          <SelectItem value="mililitros">ml</SelectItem>
                          <SelectItem value="litros">lt</SelectItem>
                          <SelectItem value="unidades">und</SelectItem>
                          <SelectItem value="cucharadas">cda</SelectItem>
                          <SelectItem value="tazas">tzs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newIngredients = ingredients.filter((_, i) => i !== index);
                          setIngredients(newIngredients);
                        }}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
               
               <p className="text-xs text-muted-foreground">
                 Los ingredientes nuevos se crean automáticamente en inventario. Si escribes las primeras letras de un ingrediente existente, aparecerán sugerencias.
               </p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Categoría del Producto</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateCategory(!showCreateCategory)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                {showCreateCategory ? 'Cancelar' : 'Nueva Categoría'}
              </Button>
            </div>

            {showCreateCategory ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newCategoryName" className="text-sm font-medium">
                      Nombre de Categoría *
                    </Label>
                    <Input
                      id="newCategoryName"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej: Bebidas, Pizzas, Postres"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryDescription" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Input
                      id="newCategoryDescription"
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Descripción de la categoría"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Crear Categoría
                </Button>
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium">
                  Seleccionar Categoría
                </Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona una categoría (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-category">Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {category.description && (
                          <span className="text-muted-foreground ml-2">
                            - {category.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay categorías disponibles. Crea una nueva categoría arriba.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Product Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minStock" className="text-sm font-medium">
                  Stock Mínimo del Producto
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="5"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad mínima del producto terminado
                </p>
              </div>
              
              <div>
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unidad de Venta
                </Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="porciones">Porciones</SelectItem>
                    <SelectItem value="platos">Platos</SelectItem>
                    <SelectItem value="rebanadas">Rebanadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cost Management Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Gestión de Costos (Opcional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCostOptions(!showCostOptions)}
                  className="flex items-center gap-1"
                >
                  <Calculator className="h-4 w-4" />
                  {showCostOptions ? 'Ocultar' : 'Añadir'} Costo
                </Button>
                
                {profile?.role === 'owner' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCalculateCost}
                    disabled={isCalculatingCost}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isCalculatingCost ? (
                      <>
                        <Brain className="h-4 w-4 animate-pulse" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        IA Calcular Costo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {showCostOptions && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="costPrice" className="text-sm font-medium">
                    Precio de Costo ($)
                  </Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                {costPrice && price && (
                  <div className="flex items-center gap-4 p-3 bg-background rounded-md border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Margen de Ganancia:</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {calculateMargin()}%
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono">
                      Ganancia: ${(parseFloat(price) - parseFloat(costPrice)).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toppings section - Only for MOCAI */}
          {isMocai && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Toppings Disponibles (máx. 10)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToppingsManager(!showToppingsManager)}
                >
                  {showToppingsManager ? 'Ocultar' : 'Gestionar'} Toppings
                </Button>
              </div>

              {showToppingsManager && (
                <ToppingsManager isMocai={isMocai} />
              )}

              {availableToppings.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableToppings.map((topping) => (
                      <div key={topping.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`topping-${topping.id}`}
                          checked={selectedToppings.includes(topping.id)}
                          onCheckedChange={(checked) => {
                            if (checked && selectedToppings.length < 10) {
                              setSelectedToppings(prev => [...prev, topping.id]);
                            } else if (!checked) {
                              setSelectedToppings(prev => prev.filter(id => id !== topping.id));
                            }
                          }}
                          disabled={!selectedToppings.includes(topping.id) && selectedToppings.length >= 10}
                        />
                        <Label 
                          htmlFor={`topping-${topping.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {topping.name} (${topping.price.toFixed(2)})
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedToppings.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedToppings.length} de 10 toppings seleccionados
                    </p>
                  )}
                </div>
              )}

              {availableToppings.length === 0 && !showToppingsManager && (
                <p className="text-sm text-muted-foreground">
                  No hay toppings disponibles. Crea algunos para asignar a este producto.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
          <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            {existingProduct ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
          </div>
        </form>
      </CardContent>
      
      {/* Cost Calculation Dialog */}
      <CostCalculationDialog
        isOpen={showCostCalculationDialog}
        onClose={() => setShowCostCalculationDialog(false)}
        productData={{
          id: existingProduct?.id,
          name: productName,
          ingredients: ingredients.filter(ing => ing.name.trim()),
          price: parseFloat(price) || 0,
          unit,
          isExisting: !!existingProduct
        }}
        onCostCalculated={handleCostCalculated}
      />
    </Card>
  );
};

export default ProductCreator;