import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Trash2, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  showConfidence = true
}) => {
  const [ingredientOpen, setIngredientOpen] = React.useState(false);

  const handleIngredientSelect = (ingredientId: string) => {
    const selected = ingredients.find(i => i.id === ingredientId);
    if (selected) {
      onChange(index, {
        matched_ingredient_id: selected.id,
        matched_ingredient_name: selected.name,
        needs_mapping: false
      });
    }
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
            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Sin mapear
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(index)} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Product name on receipt (read-only reference) */}
      {item.product_name_on_receipt && (
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
        <div>
          <label className="text-xs font-medium text-muted-foreground">Mapear a ingrediente existente (recomendado)</label>
          <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-between">
                {item.matched_ingredient_name ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {item.matched_ingredient_name}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                    Buscar ingrediente...
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar ingrediente..." />
                <CommandList>
                  <CommandEmpty>No se encontraron ingredientes</CommandEmpty>
                  <CommandGroup>
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
                        <div>
                          <div>{ing.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Stock: {ing.current_stock} {ing.unit}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default ReceiptItemEditor;
