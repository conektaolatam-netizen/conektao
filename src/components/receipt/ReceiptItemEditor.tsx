import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Trash2, Search, Plus, Loader2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  confidence_score: number;
  needs_mapping: boolean;
  inventory_type: 'ingrediente_receta' | 'suministro_operativo' | 'activo_menor';
  product_name_on_receipt?: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface ReceiptItemEditorProps {
  item: ReceiptItem;
  index: number;
  ingredients: Ingredient[];
  onChange: (index: number, updates: Partial<ReceiptItem>) => void;
  onDelete: (index: number) => void;
  onIngredientCreated?: () => void;
  showConfidence?: boolean;
}

const UNITS = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'unidades', label: 'Unidades' },
  { value: 'cajas', label: 'Cajas' },
  { value: 'paquetes', label: 'Paquetes' },
  { value: 'bolsas', label: 'Bolsas' },
];

const INVENTORY_TYPES = [
  { value: 'ingrediente_receta', label: '🍳 Ingrediente (Receta)', description: 'Afecta costos y disponibilidad de productos' },
  { value: 'suministro_operativo', label: '📦 Suministro (Operación)', description: 'Empaques, servilletas, guantes, etc.' },
  { value: 'activo_menor', label: '🔧 Activo menor', description: 'Utensilios pequeños, herramientas' },
];

export const ReceiptItemEditor: React.FC<ReceiptItemEditorProps> = ({
  item,
  index,
  ingredients,
  onChange,
  onDelete,
  onIngredientCreated,
  showConfidence = true
}) => {
  const { user, restaurant } = useAuth();
  const { toast } = useToast();
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState(item.unit || 'unidades');
  const [isCreating, setIsCreating] = useState(false);

  const handleIngredientSelect = (ingredientId: string) => {
    const selected = ingredients.find(i => i.id === ingredientId);
    if (selected) {
      onChange(index, {
        matched_ingredient_id: selected.id,
        matched_ingredient_name: selected.name,
        needs_mapping: false
      });
      
      // Guardar mapping para aprendizaje futuro de la IA
      if (item.product_name_on_receipt && user?.id && restaurant?.id) {
        saveIngredientMapping(item.product_name_on_receipt, selected.id);
      }
    }
    setIngredientOpen(false);
  };

  const saveIngredientMapping = async (productName: string, ingredientId: string) => {
    try {
      // Verificar si ya existe el mapping
      const { data: existing } = await supabase
        .from('ingredient_product_mappings')
        .select('id')
        .eq('product_name', productName.toLowerCase().trim())
        .eq('ingredient_id', ingredientId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('ingredient_product_mappings').insert({
          product_name: productName.toLowerCase().trim(),
          ingredient_id: ingredientId,
          restaurant_id: restaurant?.id,
          user_id: user?.id,
          created_by_ai: false,
          confidence_level: 100, // 100% porque el usuario lo confirmó
          notes: `Asociación manual desde factura: "${productName}"`
        });
        console.log('✅ Mapping guardado para aprendizaje:', productName, '->', ingredientId);
      }
    } catch (error) {
      console.error('Error guardando mapping:', error);
    }
  };

  const handleCreateIngredient = async () => {
    if (!newIngredientName.trim() || !user?.id) return;
    
    setIsCreating(true);
    try {
      // Crear el ingrediente
      const { data: newIngredient, error } = await supabase
        .from('ingredients')
        .insert({
          name: newIngredientName.trim(),
          unit: newIngredientUnit,
          user_id: user.id,
          restaurant_id: restaurant?.id,
          current_stock: item.quantity, // Iniciar con la cantidad de la factura
          min_stock: 0,
          is_active: true,
          cost_per_unit: item.unit_price
        })
        .select()
        .single();

      if (error) throw error;

      // Asociar el item con el nuevo ingrediente
      onChange(index, {
        matched_ingredient_id: newIngredient.id,
        matched_ingredient_name: newIngredient.name,
        needs_mapping: false
      });

      // Guardar el mapping para futuras facturas
      if (item.product_name_on_receipt) {
        await saveIngredientMapping(item.product_name_on_receipt, newIngredient.id);
      }

      toast({
        title: '✅ Ingrediente creado',
        description: `"${newIngredient.name}" ha sido creado y asociado automáticamente`
      });

      setShowCreateDialog(false);
      setNewIngredientName('');
      onIngredientCreated?.();

    } catch (error: any) {
      console.error('Error creando ingrediente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el ingrediente',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateDialog = () => {
    setNewIngredientName(item.description || item.product_name_on_receipt || '');
    setNewIngredientUnit(item.unit || 'unidades');
    setShowCreateDialog(true);
    setIngredientOpen(false);
  };

  const confidenceColor = item.confidence_score >= 80 
    ? 'bg-green-100 text-green-800' 
    : item.confidence_score >= 60 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-red-100 text-red-800';

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      {/* Header with confidence and delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-muted-foreground">Item #{index + 1}</span>
          {showConfidence && (
            <Badge className={confidenceColor}>
              {item.confidence_score}% confianza
            </Badge>
          )}
          {item.needs_mapping && (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Sin asociar
            </Badge>
          )}
          {item.matched_ingredient_name && !item.needs_mapping && (
            <Badge variant="outline" className="border-green-500 text-green-700">
              <Check className="h-3 w-3 mr-1" />
              Asociado
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(index)} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Product name on receipt (read-only reference) */}
      {item.product_name_on_receipt && item.product_name_on_receipt !== item.description && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          📄 En factura: "{item.product_name_on_receipt}"
        </div>
      )}

      {/* Main fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Description/Name */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Nombre del item</label>
          <Input
            value={item.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Nombre del producto"
            className="mt-1"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Cantidad</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.quantity}
            onChange={(e) => {
              const qty = parseFloat(e.target.value) || 0;
              onChange(index, { 
                quantity: qty,
                subtotal: qty * item.unit_price
              });
            }}
            className="mt-1"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Unidad</label>
          <Select 
            value={item.unit} 
            onValueChange={(v) => onChange(index, { unit: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(u => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unit Price */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Precio unitario</label>
          <Input
            type="number"
            step="1"
            min="0"
            value={item.unit_price}
            onChange={(e) => {
              const price = parseFloat(e.target.value) || 0;
              onChange(index, { 
                unit_price: price,
                subtotal: item.quantity * price
              });
            }}
            className="mt-1"
          />
        </div>

        {/* Subtotal (calculated) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Subtotal</label>
          <div className="mt-1 h-9 flex items-center px-3 bg-muted rounded-md font-medium">
            ${item.subtotal.toLocaleString()}
          </div>
        </div>

        {/* Inventory Type */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">¿Qué tipo de item es?</label>
          <Select 
            value={item.inventory_type} 
            onValueChange={(v: any) => onChange(index, { inventory_type: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <div>
                    <div>{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ingredient Mapping - only for recipe ingredients */}
      {item.inventory_type === 'ingrediente_receta' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Asociar a ingrediente del inventario
            {item.needs_mapping && <span className="text-amber-600 ml-1">(requerido)</span>}
          </label>
          <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant={item.needs_mapping ? "secondary" : "outline"} 
                className={`w-full mt-1 justify-between ${item.needs_mapping ? 'border-amber-500' : ''}`}
              >
                {item.matched_ingredient_name ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {item.matched_ingredient_name}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                    Buscar o crear ingrediente...
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar ingrediente..." />
                <CommandList>
                  <CommandEmpty className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No se encontró este ingrediente</p>
                    <Button size="sm" onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-1" />
                      Crear nuevo ingrediente
                    </Button>
                  </CommandEmpty>
                  <CommandGroup heading="Ingredientes existentes">
                    {ingredients.map(ing => (
                      <CommandItem
                        key={ing.id}
                        value={ing.name}
                        onSelect={() => handleIngredientSelect(ing.id)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            item.matched_ingredient_id === ing.id ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <div className="flex-1">
                          <div>{ing.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Stock: {ing.current_stock} {ing.unit}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup>
                    <CommandItem onSelect={openCreateDialog} className="text-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear nuevo ingrediente
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Dialog para crear ingrediente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo ingrediente</DialogTitle>
            <DialogDescription>
              Este ingrediente se creará y asociará automáticamente. 
              La IA recordará esta asociación para futuras facturas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nombre del ingrediente</label>
              <Input
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
                placeholder="Ej: Coca Cola"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Unidad de medida</label>
              <Select value={newIngredientUnit} onValueChange={setNewIngredientUnit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Se creará con:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Stock inicial: {item.quantity} {newIngredientUnit}</li>
                <li>• Costo unitario: ${item.unit_price.toLocaleString()}</li>
                {item.product_name_on_receipt && (
                  <li>• Asociado a: "{item.product_name_on_receipt}"</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateIngredient} 
              disabled={!newIngredientName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear y asociar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptItemEditor;
