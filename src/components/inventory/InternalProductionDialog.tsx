import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
  is_compound: boolean;
}

interface RecipeItem {
  base_ingredient_id: string;
  quantity_needed: number;
  yield_amount: number;
  unit: string;
  base_ingredient: {
    id: string;
    name: string;
    current_stock: number;
    unit: string;
  };
}

interface InternalProductionDialogProps {
  compoundIngredient: Ingredient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductionComplete: () => void;
}

export const InternalProductionDialog = ({
  compoundIngredient,
  open,
  onOpenChange,
  onProductionComplete
}: InternalProductionDialogProps) => {
  const [quantityToProduce, setQuantityToProduce] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [insufficientStock, setInsufficientStock] = useState<string[]>([]);
  const { toast } = useToast();

  // Cargar receta cuando se abre el diálogo
  const loadRecipe = async () => {
    if (!open || !compoundIngredient?.id) return;

    try {
      const { data, error } = await supabase
        .from('ingredient_recipes')
        .select(`
          base_ingredient_id,
          quantity_needed,
          yield_amount,
          unit,
          base_ingredient:ingredients!ingredient_recipes_base_ingredient_id_fkey(id, name, current_stock, unit)
        `)
        .eq('compound_ingredient_id', compoundIngredient.id);

      if (error) throw error;
      setRecipe(data || []);
    } catch (error) {
      console.error('Error loading recipe:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la receta del ingrediente",
        variant: "destructive"
      });
    }
  };

  // Verificar stock disponible
  const checkStock = () => {
    if (!quantityToProduce || quantityToProduce <= 0) return;

    const insufficient: string[] = [];

    recipe.forEach((item) => {
      const requiredQty = (item.quantity_needed / item.yield_amount) * quantityToProduce;
      if (item.base_ingredient.current_stock < requiredQty) {
        insufficient.push(
          `${item.base_ingredient.name}: necesitas ${requiredQty.toFixed(2)} ${item.base_ingredient.unit}, tienes ${item.base_ingredient.current_stock} ${item.base_ingredient.unit}`
        );
      }
    });

    setInsufficientStock(insufficient);
  };

  // Producir ingrediente compuesto
  const handleProduce = async () => {
    if (!quantityToProduce || quantityToProduce <= 0) {
      toast({
        title: "Error",
        description: "Ingresa una cantidad válida a producir",
        variant: "destructive"
      });
      return;
    }

    if (insufficientStock.length > 0) {
      toast({
        title: "Stock insuficiente",
        description: "No hay suficientes ingredientes base",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.restaurant_id) throw new Error('Restaurant not found');

      // 1. Descontar ingredientes base
      for (const item of recipe) {
        const qtyToDeduct = (item.quantity_needed / item.yield_amount) * quantityToProduce;
        
        // Actualizar stock
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ 
            current_stock: item.base_ingredient.current_stock - qtyToDeduct,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.base_ingredient_id);

        if (updateError) throw updateError;

        // Registrar movimiento OUT
        const { error: movementError } = await supabase
          .from('ingredient_movements')
          .insert({
            ingredient_id: item.base_ingredient_id,
            movement_type: 'OUT',
            quantity: qtyToDeduct,
            reference_type: 'INTERNAL_PRODUCTION',
            notes: `Producción de ${quantityToProduce} ${compoundIngredient.unit} de ${compoundIngredient.name}`
          });

        if (movementError) throw movementError;
      }

      // 2. Agregar al stock del ingrediente compuesto
      const { error: compoundError } = await supabase
        .from('ingredients')
        .update({ 
          current_stock: compoundIngredient.current_stock + quantityToProduce,
          updated_at: new Date().toISOString()
        })
        .eq('id', compoundIngredient.id);

      if (compoundError) throw compoundError;

      // Registrar movimiento IN
      const { error: inMovementError } = await supabase
        .from('ingredient_movements')
        .insert({
          ingredient_id: compoundIngredient.id,
          movement_type: 'IN',
          quantity: quantityToProduce,
          reference_type: 'INTERNAL_PRODUCTION',
          notes: `Producción interna${notes ? ': ' + notes : ''}`
        });

      if (inMovementError) throw inMovementError;

      // 3. Registrar en internal_productions
      const { error: prodError } = await supabase
        .from('internal_productions')
        .insert({
          compound_ingredient_id: compoundIngredient.id,
          quantity_produced: quantityToProduce,
          user_id: user?.id,
          restaurant_id: profile.restaurant_id,
          notes
        });

      if (prodError) throw prodError;

      toast({
        title: "Producción registrada",
        description: `Se produjeron ${quantityToProduce} ${compoundIngredient.unit} de ${compoundIngredient.name}`
      });

      onProductionComplete();
      onOpenChange(false);
      setQuantityToProduce(0);
      setNotes('');
    } catch (error) {
      console.error('Error in production:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la producción",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar receta cuando se abre el diálogo
  if (open && recipe.length === 0) {
    loadRecipe();
  }

  // Verificar stock cuando cambia la cantidad
  if (quantityToProduce > 0 && recipe.length > 0) {
    checkStock();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Producir {compoundIngredient.name}
          </DialogTitle>
          <DialogDescription>
            Registra la producción interna de este ingrediente compuesto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Receta del ingrediente */}
          {recipe.length > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium text-sm">Receta (por {recipe[0]?.yield_amount} {compoundIngredient.unit}):</h4>
              <ul className="text-sm space-y-1">
                {recipe.map((item) => (
                  <li key={item.base_ingredient_id} className="flex justify-between">
                    <span>{item.base_ingredient.name}</span>
                    <span className="text-muted-foreground">
                      {item.quantity_needed} {item.base_ingredient.unit}
                      <span className="text-xs ml-2">(disponible: {item.base_ingredient.current_stock})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cantidad a producir */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad a producir ({compoundIngredient.unit})</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantityToProduce || ''}
              onChange={(e) => setQuantityToProduce(parseFloat(e.target.value) || 0)}
              placeholder="Ej: 5"
            />
          </div>

          {/* Alerta de stock insuficiente */}
          {insufficientStock.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Stock insuficiente:</div>
                <ul className="text-xs space-y-1">
                  {insufficientStock.map((msg, idx) => (
                    <li key={idx}>• {msg}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Stock requerido */}
          {quantityToProduce > 0 && recipe.length > 0 && insufficientStock.length === 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-medium mb-2">Se descontarán:</div>
              <ul className="space-y-1">
                {recipe.map((item) => {
                  const required = (item.quantity_needed / item.yield_amount) * quantityToProduce;
                  return (
                    <li key={item.base_ingredient_id} className="flex justify-between">
                      <span>{item.base_ingredient.name}</span>
                      <span>{required.toFixed(2)} {item.base_ingredient.unit}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Lote del día 24/11/2025"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProduce} 
            disabled={loading || insufficientStock.length > 0 || !quantityToProduce}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Produciendo...
              </>
            ) : (
              'Registrar Producción'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
