import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Brain, CheckCircle, RefreshCw, DollarSign, Check } from 'lucide-react';

interface CostCalculationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productData: any;
  onCostCalculated: (cost: number) => void;
}

interface Ingredient {
  id: string;
  name: string;
  cost: string;
  quantity: string;
  unit: string;
  transportCost: string;
  usageQuantity: string;
  usageUnit: string;
  type: 'fruits' | 'proteins' | 'frozen' | '';
  isVacuumPacked: boolean;
  hasPreparation: boolean;
  preparationIngredients: Ingredient[];
  preparationCost?: number;
  isCosted?: boolean;
}

interface CostCalculationResult {
  unitCost: number;
  ingredients: Array<{
    name: string;
    baseCost: number;
    wasteApplied: number;
    finalCost: number;
  }>;
  breakdown: {
    totalBaseCost: number;
    serviceMargin: number;
    safetyMargin: number;
  };
  suggestedPrices: {
    premium: number;
    cafeteria: number;
    beverages: number;
  };
}

const WASTE_PERCENTAGES = {
  fruits: { min: 10, max: 25, description: "Frutas y vegetales frescos (cáscara/manipulación)" },
  proteins: { min: 15, max: 30, description: "Proteínas crudas (cocción/limpieza)" },
  frozen: { min: 3, max: 7, description: "Productos congelados" },
  service: { min: 3, max: 7, description: "Preparación manual (servicio)" },
  safety: { min: 5, max: 10, description: "Margen de seguridad general" }
};

const PROFIT_MARGINS = {
  premium: { min: 60, max: 75, description: "Heladerías premium" },
  cafeteria: { min: 65, max: 80, description: "Cafeterías y bares" },
  beverages: { max: 85, description: "Bebidas y postres" }
};

const UNITS = [
  'gramos', 'kilogramos', 'litros', 'mililitros', 'unidades', 'onzas', 'libras'
];

export const CostCalculationDialog = ({ 
  isOpen, 
  onClose, 
  productData, 
  onCostCalculated 
}: CostCalculationDialogProps) => {
  const [step, setStep] = useState(0); // 0: ingredients list, 1: ingredient type selection, 2: ingredient costing, 3: preparation ingredients, 4: results
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CostCalculationResult | null>(null);
  
  // New flow state
  const [ingredientList, setIngredientList] = useState<string[]>([]);
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState(-1);
  const [costedIngredients, setCostedIngredients] = useState<Set<number>>(new Set());
  const [ingredientCosts, setIngredientCosts] = useState<Record<number, Ingredient>>({});
  const [currentIngredientType, setCurrentIngredientType] = useState<'simple' | 'prepared' | null>(null);
  const [preparationIngredients, setPreparationIngredients] = useState<Ingredient[]>([]);
  const [currentPrepIndex, setCurrentPrepIndex] = useState(-1);
  
  // Current ingredient being costed
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    id: '1',
    name: '',
    cost: '',
    quantity: '',
    unit: 'kilogramos',
    transportCost: '',
    usageQuantity: '',
    usageUnit: 'gramos',
    type: '',
    isVacuumPacked: false,
    hasPreparation: false,
    preparationIngredients: []
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      resetDialog();
      // Initialize with existing product data if available
      if (productData?.ingredients) {
        setIngredientList(productData.ingredients.map((ing: any) => ing.name));
      }
    }
  }, [isOpen]);

  const resetDialog = () => {
    setStep(0);
    setSelectedIngredientIndex(-1);
    setCostedIngredients(new Set());
    setIngredientCosts({});
    setCurrentIngredientType(null);
    setCurrentIngredient({
      id: '1',
      name: '',
      cost: '',
      quantity: '',
      unit: 'kilogramos',
      transportCost: '',
      usageQuantity: '',
      usageUnit: 'gramos',
      type: '',
      isVacuumPacked: false,
      hasPreparation: false,
      preparationIngredients: []
    });
    setCalculationResult(null);
    setIsCalculating(false);
  };

  const updateCurrentIngredient = (field: keyof Ingredient, value: any) => {
    setCurrentIngredient(prev => ({ ...prev, [field]: value }));
  };

  const selectIngredientToCost = (index: number) => {
    if (costedIngredients.has(index)) return; // Already costed
    
    setSelectedIngredientIndex(index);
    setCurrentIngredient({
      ...currentIngredient,
      name: ingredientList[index],
      usageQuantity: productData?.ingredients?.[index]?.quantity || ''
    });
    setStep(1); // Go to type selection
  };

  const selectIngredientType = (type: 'simple' | 'prepared') => {
    setCurrentIngredientType(type);
    if (type === 'prepared') {
      // Initialize with basic preparation ingredients
      setPreparationIngredients([
        {
          id: '1',
          name: '',
          cost: '',
          quantity: '',
          unit: 'kilogramos',
          transportCost: '0',
          usageQuantity: '',
          usageUnit: 'gramos',
          type: '',
          isVacuumPacked: false,
          hasPreparation: false,
          preparationIngredients: []
        }
      ]);
      setStep(3); // Go to preparation ingredients
    } else {
      setStep(2); // Go to simple ingredient costing
    }
  };

  const calculateIngredientCost = (ingredient: Ingredient, usageQty?: string, usageUnit?: string) => {
    const convertToGrams = (value: number, unit: string): number => {
      switch (unit.toLowerCase()) {
        case 'kilogramos':
        case 'kg':
          return value * 1000; // Convert to grams
        case 'gramos':
        case 'g':
          return value;
        case 'libras':
        case 'lb':
          return value * 453.592; // Convert to grams
        case 'onzas':
        case 'oz':
          return value * 28.3495; // Convert to grams
        default:
          return value; // For units that don't convert to grams (like 'unidades')
      }
    };

    const convertToMilliliters = (value: number, unit: string): number => {
      switch (unit.toLowerCase()) {
        case 'litros':
        case 'l':
          return value * 1000; // Convert to ml
        case 'mililitros':
        case 'ml':
          return value;
        default:
          return value; // For units that don't convert to ml
      }
    };

    const isWeightUnit = (unit: string): boolean => {
      const weightUnits = ['kilogramos', 'kg', 'gramos', 'g', 'libras', 'lb', 'onzas', 'oz'];
      return weightUnits.includes(unit.toLowerCase());
    };

    const isVolumeUnit = (unit: string): boolean => {
      const volumeUnits = ['litros', 'l', 'mililitros', 'ml'];
      return volumeUnits.includes(unit.toLowerCase());
    };

    // Get base values
    const costInsumo = parseFloat(ingredient.cost);
    const costTransporte = parseFloat(ingredient.transportCost || '0');
    const quantityPurchased = parseFloat(ingredient.quantity);
    const usageQuantity = parseFloat(usageQty || ingredient.usageQuantity);
    
    // Convert units to same base for calculation
    let cantidadAdquirida: number;
    let cantidadUtilizada: number;
    
    const purchaseUnit = ingredient.unit;
    const usageUnitFinal = usageUnit || ingredient.usageUnit;
    
    // Check if we're mixing unit types (this should not happen, but handle it)
    if (isWeightUnit(purchaseUnit) && isWeightUnit(usageUnitFinal)) {
      // Both are weight units - convert to grams
      cantidadAdquirida = convertToGrams(quantityPurchased, purchaseUnit);
      cantidadUtilizada = convertToGrams(usageQuantity, usageUnitFinal);
    } else if (isVolumeUnit(purchaseUnit) && isVolumeUnit(usageUnitFinal)) {
      // Both are volume units - convert to ml
      cantidadAdquirida = convertToMilliliters(quantityPurchased, purchaseUnit);
      cantidadUtilizada = convertToMilliliters(usageQuantity, usageUnitFinal);
    } else if (purchaseUnit === 'unidades' || usageUnitFinal === 'unidades') {
      // Handle unit-based ingredients
      cantidadAdquirida = quantityPurchased;
      cantidadUtilizada = usageQuantity;
    } else {
      // If units don't match types, show warning and use as-is
      console.warn(`Unidad de compra (${purchaseUnit}) y uso (${usageUnitFinal}) no son compatibles`);
      cantidadAdquirida = quantityPurchased;
      cantidadUtilizada = usageQuantity;
    }
    
    // Safety check to avoid division by zero
    if (cantidadAdquirida === 0) {
      console.error('Cantidad adquirida no puede ser cero');
      return 0;
    }
    
    // Apply the exact formula: Costo unitario = ((Costo del insumo + Costo del transporte) / Cantidad total adquirida) × Cantidad utilizada en la preparación
    const costoUnitario = ((costInsumo + costTransporte) / cantidadAdquirida) * cantidadUtilizada;

    // Apply waste percentage if applicable
    let wastePercentage = 0;
    if (!ingredient.isVacuumPacked && ingredient.type && WASTE_PERCENTAGES[ingredient.type]) {
      const waste = WASTE_PERCENTAGES[ingredient.type];
      wastePercentage = (waste.min + waste.max) / 2;
    }

    return costoUnitario * (1 + wastePercentage / 100);
  };

  const finishIngredientCosting = () => {
    let finalIngredientCost = 0;
    
    if (currentIngredientType === 'simple') {
      finalIngredientCost = calculateIngredientCost(currentIngredient);
    } else if (currentIngredientType === 'prepared') {
      // Calculate cost of all preparation ingredients
      preparationIngredients.forEach(prepIngredient => {
        if (prepIngredient.cost && prepIngredient.quantity && prepIngredient.usageQuantity) {
          finalIngredientCost += calculateIngredientCost(prepIngredient);
        }
      });
      
      // Apply usage quantity to the final preparation
      if (currentIngredient.usageQuantity) {
        const preparationYield = preparationIngredients.reduce((total, ing) => {
          if (ing.usageQuantity) {
            return total + parseFloat(ing.usageQuantity);
          }
          return total;
        }, 0);
        
        if (preparationYield > 0) {
          finalIngredientCost = (finalIngredientCost / preparationYield) * parseFloat(currentIngredient.usageQuantity);
        }
      }
    }
    
    // Save this ingredient cost
    const newIngredientCosts = {
      ...ingredientCosts,
      [selectedIngredientIndex]: {
        ...currentIngredient,
        preparationIngredients,
        preparationCost: finalIngredientCost,
        isCosted: true
      }
    };
    
    setIngredientCosts(newIngredientCosts);
    setCostedIngredients(new Set([...costedIngredients, selectedIngredientIndex]));
    
    // Reset for next ingredient
    setSelectedIngredientIndex(-1);
    setCurrentIngredientType(null);
    setPreparationIngredients([]);
    setCurrentPrepIndex(-1);
    setCurrentIngredient({
      id: '1',
      name: '',
      cost: '',
      quantity: '',
      unit: 'kilogramos',
      transportCost: '',
      usageQuantity: '',
      usageUnit: 'gramos',
      type: '',
      isVacuumPacked: false,
      hasPreparation: false,
      preparationIngredients: []
    });
    
    setStep(0); // Back to ingredient list
    
    toast({
      title: "Ingrediente costeado",
      description: `Costo calculado: $${Math.round(finalIngredientCost).toLocaleString()}`,
    });
  };

  const calculateFinalCost = () => {
    setIsCalculating(true);
    
    try {
      let totalCost = 0;
      const ingredientResults: Array<{name: string, baseCost: number, wasteApplied: number, finalCost: number}> = [];

      Object.entries(ingredientCosts).forEach(([index, ingredient]) => {
        const cost = ingredient.preparationCost || 0;
        
        ingredientResults.push({
          name: ingredient.name,
          baseCost: cost,
          wasteApplied: 0, // Already applied in individual calculation
          finalCost: cost
        });

        totalCost += cost;
      });

      const serviceMargin = (WASTE_PERCENTAGES.service.min + WASTE_PERCENTAGES.service.max) / 2;
      const safetyMargin = (WASTE_PERCENTAGES.safety.min + WASTE_PERCENTAGES.safety.max) / 2;
      
      const finalUnitCost = totalCost * (1 + (serviceMargin + safetyMargin) / 100);

      const premiumPrice = finalUnitCost * (1 + PROFIT_MARGINS.premium.max / 100);
      const cafeteriaPrice = finalUnitCost * (1 + PROFIT_MARGINS.cafeteria.max / 100);
      const beveragesPrice = finalUnitCost * (1 + PROFIT_MARGINS.beverages.max / 100);

      const result: CostCalculationResult = {
        unitCost: Math.round(finalUnitCost),
        ingredients: ingredientResults,
        breakdown: {
          totalBaseCost: totalCost,
          serviceMargin,
          safetyMargin
        },
        suggestedPrices: {
          premium: Math.round(premiumPrice),
          cafeteria: Math.round(cafeteriaPrice),
          beverages: Math.round(beveragesPrice)
        }
      };

      setCalculationResult(result);
      setStep(4); // Results step
    } catch (error) {
      toast({
        title: "Error en el cálculo",
        description: "Verifica que todos los valores sean números válidos",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleUpdateCost = async () => {
    if (calculationResult) {
      if (productData?.isExisting && productData?.id) {
        try {
          const { error } = await supabase
            .from('products')
            .update({ cost_price: calculationResult.unitCost })
            .eq('id', productData.id);

          if (error) throw error;

          toast({
            title: "Costo actualizado en base de datos",
            description: `El costo de "${productData.name}" se actualizó exitosamente a $${calculationResult.unitCost.toLocaleString()}`,
          });
        } catch (error) {
          console.error('Error updating product cost:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el costo en la base de datos",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Costo calculado",
          description: `El costo se estableció en $${calculationResult.unitCost.toLocaleString()}`,
        });
      }
      
      onCostCalculated(calculationResult.unitCost);
      onClose();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Ingredientes de {productData?.name}</h3>
              <p className="text-muted-foreground">Selecciona cuál ingrediente quieres costear primero</p>
            </div>
            
            {ingredientList.length === 0 ? (
              <div className="space-y-4">
                <Label htmlFor="newIngredient">Agrega los ingredientes del producto:</Label>
                <div className="flex gap-2">
                  <Input
                    id="newIngredient"
                    placeholder="Ej: Piña fresca"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          setIngredientList([...ingredientList, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('newIngredient') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value) {
                        setIngredientList([...ingredientList, value]);
                        input.value = '';
                      }
                    }}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {ingredientList.map((ingredient, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {costedIngredients.has(index) && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        <span className="font-medium">{ingredient}</span>
                        {costedIngredients.has(index) && (
                          <Badge variant="secondary">
                            ${Math.round(ingredientCosts[index]?.preparationCost || 0).toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      {!costedIngredients.has(index) ? (
                        <Button
                          onClick={() => selectIngredientToCost(index)}
                          size="sm"
                        >
                          Costear
                        </Button>
                      ) : (
                        <Badge variant="default">Completado</Badge>
                      )}
                    </div>
                  </Card>
                ))}
                
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Agregar otro ingrediente"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          setIngredientList([...ingredientList, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Agregar otro ingrediente"]') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value) {
                        setIngredientList([...ingredientList, value]);
                        input.value = '';
                      }
                    }}
                    variant="outline"
                  >
                    Agregar
                  </Button>
                </div>

                {costedIngredients.size === ingredientList.length && ingredientList.length > 0 && (
                  <Button 
                    onClick={calculateFinalCost}
                    className="w-full mt-6"
                    size="lg"
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Calculando costo total...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calcular Costo Total
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{ingredientList[selectedIngredientIndex]}</h3>
              <p className="text-muted-foreground">¿Qué tipo de ingrediente es?</p>
            </div>
            
            <div className="space-y-4">
              <Button
                type="button"
                variant={currentIngredientType === 'simple' ? "default" : "outline"}
                onClick={() => selectIngredientType('simple')}
                className="w-full h-auto p-6 text-left justify-start"
              >
                <div>
                  <div className="font-semibold text-lg">🥤 Ingrediente Simple</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Se compra y se usa directamente (Ej: Azúcar, leche, frutas frescas)
                  </div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={currentIngredientType === 'prepared' ? "default" : "outline"}
                onClick={() => selectIngredientType('prepared')}
                className="w-full h-auto p-6 text-left justify-start"
              >
                <div>
                  <div className="font-semibold text-lg">🍳 Ingrediente Preparado</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Requiere preparación previa (Ej: Salsa casera, mermelada, almíbar)
                  </div>
                </div>
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">
              Costeando: {ingredientList[selectedIngredientIndex]} (Ingrediente Simple)
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cost">¿Cuánto cuesta? ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={currentIngredient.cost}
                  onChange={(e) => updateCurrentIngredient('cost', e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="quantity">¿Qué cantidad recibes?</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  value={currentIngredient.quantity}
                  onChange={(e) => updateCurrentIngredient('quantity', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidad</Label>
                <Select value={currentIngredient.unit} onValueChange={(value) => updateCurrentIngredient('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="transport">¿Cuánto cuesta el transporte? ($)</Label>
              <Input
                id="transport"
                type="number"
                step="0.01"
                value={currentIngredient.transportCost}
                onChange={(e) => updateCurrentIngredient('transportCost', e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage">¿Cuánto usas por unidad de producto?</Label>
                <Input
                  id="usage"
                  type="number"
                  step="0.001"
                  value={currentIngredient.usageQuantity}
                  onChange={(e) => updateCurrentIngredient('usageQuantity', e.target.value)}
                  placeholder="300"
                />
              </div>
              <div>
                <Label htmlFor="usageUnit">Unidad de uso</Label>
                <Select value={currentIngredient.usageUnit} onValueChange={(value) => updateCurrentIngredient('usageUnit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>¿Qué tipo de ingrediente es?</Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(WASTE_PERCENTAGES).filter(([key]) => ['fruits', 'proteins', 'frozen'].includes(key)).map(([key, value]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={currentIngredient.type === key ? "default" : "outline"}
                    onClick={() => updateCurrentIngredient('type', key)}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium">{value.description}</div>
                      <div className="text-sm text-muted-foreground">Merma: {value.min}% - {value.max}%</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={currentIngredient.isVacuumPacked}
                onCheckedChange={(checked) => updateCurrentIngredient('isVacuumPacked', checked)}
              />
              <Label>¿Viene empacado al vacío o ya procesado? (Sin merma)</Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">
              Preparación: {ingredientList[selectedIngredientIndex]}
            </h3>
            <p className="text-sm text-muted-foreground">
              Agrega los ingredientes que necesitas para preparar este producto
            </p>
            
            <div className="space-y-4">
              {preparationIngredients.map((ingredient, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Ingrediente {index + 1}</Label>
                      {preparationIngredients.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newIngredients = preparationIngredients.filter((_, i) => i !== index);
                            setPreparationIngredients(newIngredients);
                          }}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      placeholder="Nombre del ingrediente (ej: Piña fresca)"
                      value={ingredient.name}
                      onChange={(e) => {
                        const newIngredients = [...preparationIngredients];
                        newIngredients[index].name = e.target.value;
                        setPreparationIngredients(newIngredients);
                      }}
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Costo ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10000"
                          value={ingredient.cost}
                          onChange={(e) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].cost = e.target.value;
                            setPreparationIngredients(newIngredients);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad que compras</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="2"
                          value={ingredient.quantity}
                          onChange={(e) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].quantity = e.target.value;
                            setPreparationIngredients(newIngredients);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unidad</Label>
                        <Select 
                          value={ingredient.unit} 
                          onValueChange={(value) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].unit = value;
                            setPreparationIngredients(newIngredients);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Transporte ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={ingredient.transportCost}
                          onChange={(e) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].transportCost = e.target.value;
                            setPreparationIngredients(newIngredients);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad que usas</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="300"
                          value={ingredient.usageQuantity}
                          onChange={(e) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].usageQuantity = e.target.value;
                            setPreparationIngredients(newIngredients);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unidad uso</Label>
                        <Select 
                          value={ingredient.usageUnit} 
                          onValueChange={(value) => {
                            const newIngredients = [...preparationIngredients];
                            newIngredients[index].usageUnit = value;
                            setPreparationIngredients(newIngredients);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de ingrediente</Label>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(WASTE_PERCENTAGES).filter(([key]) => ['fruits', 'proteins', 'frozen'].includes(key)).map(([key, value]) => (
                          <Button
                            key={key}
                            type="button"
                            size="sm"
                            variant={ingredient.type === key ? "default" : "outline"}
                            onClick={() => {
                              const newIngredients = [...preparationIngredients];
                              newIngredients[index].type = key as any;
                              setPreparationIngredients(newIngredients);
                            }}
                            className="text-left justify-start h-auto p-2"
                          >
                            <div>
                              <div className="text-xs font-medium">{value.description}</div>
                              <div className="text-xs text-muted-foreground">Merma: {value.min}% - {value.max}%</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ingredient.isVacuumPacked}
                        onCheckedChange={(checked) => {
                          const newIngredients = [...preparationIngredients];
                          newIngredients[index].isVacuumPacked = checked;
                          setPreparationIngredients(newIngredients);
                        }}
                      />
                      <Label className="text-xs">¿Empacado al vacío? (Sin merma)</Label>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreparationIngredients([...preparationIngredients, {
                    id: (preparationIngredients.length + 1).toString(),
                    name: '',
                    cost: '',
                    quantity: '',
                    unit: 'kilogramos',
                    transportCost: '0',
                    usageQuantity: '',
                    usageUnit: 'gramos',
                    type: '',
                    isVacuumPacked: false,
                    hasPreparation: false,
                    preparationIngredients: []
                  }]);
                }}
                className="w-full"
              >
                + Agregar otro ingrediente
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Label>¿Cuánto de esta preparación usas por producto final?</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="number"
                  step="0.001"
                  placeholder="50"
                  value={currentIngredient.usageQuantity}
                  onChange={(e) => updateCurrentIngredient('usageQuantity', e.target.value)}
                />
                <Select 
                  value={currentIngredient.usageUnit} 
                  onValueChange={(value) => updateCurrentIngredient('usageUnit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">¡Cálculo Completado!</h3>
            </div>

            {calculationResult && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-semibold">Costo por unidad calculado:</h4>
                      <div className="text-3xl font-bold text-primary">
                        ${calculationResult.unitCost.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium">Desglose por ingredientes:</h5>
                      {calculationResult.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{ingredient.name}</span>
                          <div className="text-right">
                            <div className="font-bold">${Math.round(ingredient.finalCost).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm mt-4 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal ingredientes:</span>
                        <span>${Math.round(calculationResult.breakdown.totalBaseCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margen servicio ({calculationResult.breakdown.serviceMargin.toFixed(1)}%):</span>
                        <Badge variant="secondary">Preparación manual</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Margen seguridad ({calculationResult.breakdown.safetyMargin.toFixed(1)}%):</span>
                        <Badge variant="secondary">Errores/desperdicios</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precios de venta sugeridos:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">Heladería Premium</div>
                          <div className="text-sm text-muted-foreground">Margen 60-75%</div>
                        </div>
                        <div className="text-lg font-bold">${calculationResult.suggestedPrices.premium.toLocaleString()}</div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium">Cafetería/Bar</div>
                          <div className="text-sm text-muted-foreground">Margen 65-80%</div>
                        </div>
                        <div className="text-lg font-bold">${calculationResult.suggestedPrices.cafeteria.toLocaleString()}</div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div>
                          <div className="font-medium">Bebidas/Postres</div>
                          <div className="text-sm text-muted-foreground">Margen hasta 85%</div>
                        </div>
                        <div className="text-lg font-bold">${calculationResult.suggestedPrices.beverages.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button onClick={handleUpdateCost} className="w-full" size="lg">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    ✅ {productData?.isExisting ? 'Actualizar costo en base de datos' : 'Usar este costo'}
                  </Button>
                  
                  <Button onClick={() => setStep(0)} variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    ❌ Revisar ingredientes
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canContinue = () => {
    switch (step) {
      case 0: return ingredientList.length > 0;
      case 1: return currentIngredientType !== null;
      case 2: 
        return currentIngredient.cost && 
               currentIngredient.quantity && 
               currentIngredient.transportCost && 
               currentIngredient.usageQuantity && 
               currentIngredient.type;
      case 3:
        const hasValidPrepIngredients = preparationIngredients.every(ing => 
          ing.name && ing.cost && ing.quantity && ing.usageQuantity && ing.type
        );
        return hasValidPrepIngredients && currentIngredient.usageQuantity && preparationIngredients.length > 0;
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Calcular Costo con IA - {productData?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex-shrink-0 flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            >
              {step === 0 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            {(step === 2 || step === 3) && (
              <Button
                onClick={finishIngredientCosting}
                disabled={!canContinue()}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Terminar ingrediente
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};