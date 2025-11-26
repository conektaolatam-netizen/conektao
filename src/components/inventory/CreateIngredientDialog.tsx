import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Beaker, ChefHat } from 'lucide-react';

interface CreateIngredientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateIngredientDialog = ({ isOpen, onClose, onSuccess }: CreateIngredientDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'gramos',
    cost_per_unit: '',
    min_stock: '0',
    current_stock: '0',
    quantity_purchased: '',
    total_price: '',
    is_compound: false
  });

  // Auto-fill current_stock when quantity_purchased changes
  const handleQuantityPurchasedChange = (value: string) => {
    setFormData({ 
      ...formData, 
      quantity_purchased: value,
      current_stock: value // Auto-fill stock with purchased quantity
    });
  };

  const getUnitLabel = (unit: string) => {
    const unitLabels: Record<string, string> = {
      'gramos': 'gramo',
      'kilogramos': 'kilogramo',
      'litros': 'litro',
      'mililitros': 'mililitro',
      'unidades': 'unidad',
      'onzas': 'onza',
      'libras': 'libra'
    };
    return unitLabels[unit] || 'unidad';
  };

  const getUnitLabelPlural = (unit: string) => {
    const unitLabels: Record<string, string> = {
      'gramos': 'gramos',
      'kilogramos': 'kilogramos',
      'litros': 'litros',
      'mililitros': 'mililitros',
      'unidades': 'unidades',
      'onzas': 'onzas',
      'libras': 'libras'
    };
    return unitLabels[unit] || 'unidades';
  };

  const calculatePricePerUnit = () => {
    const total = parseFloat(formData.total_price);
    const qty = parseFloat(formData.quantity_purchased);
    
    if (!isNaN(total) && !isNaN(qty) && qty > 0) {
      return (total / qty).toFixed(2);
    }
    return null;
  };

  const pricePerUnit = calculatePricePerUnit();

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'gramos',
      cost_per_unit: '',
      min_stock: '0',
      current_stock: '0',
      quantity_purchased: '',
      total_price: '',
      is_compound: false
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) {
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

      const calculatedPrice = pricePerUnit ? parseFloat(pricePerUnit) : null;

      const { error } = await supabase
        .from('ingredients')
        .insert({
          name: formData.name,
          unit: formData.unit,
          cost_per_unit: calculatedPrice,
          min_stock: parseFloat(formData.min_stock),
          current_stock: parseFloat(formData.current_stock),
          user_id: user.id,
          restaurant_id: profile?.restaurant_id || null,
          is_active: true,
          is_compound: formData.is_compound
        });

      if (error) throw error;

      toast({
        title: "✓ Ingrediente creado",
        description: `"${formData.name}" está listo para usar en tus recetas`,
      });

      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Error creating ingredient:', error);
      toast({
        title: "Error al crear ingrediente",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            Crear Nuevo Ingrediente
          </DialogTitle>
          <DialogDescription>
            Este ingrediente estará disponible para recetas, facturas y el sistema POS
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredient-name">Nombre del Ingrediente *</Label>
            <Input
              id="ingredient-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Harina de trigo, Tomate fresco..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="ingredient-unit">Unidad de Medida *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
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

          <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
            <p className="text-sm font-medium">Información de Compra</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantity-purchased" className="text-sm">
                  Cantidad Comprada
                </Label>
                <Input
                  id="quantity-purchased"
                  type="number"
                  step="0.01"
                  value={formData.quantity_purchased}
                  onChange={(e) => handleQuantityPurchasedChange(e.target.value)}
                  placeholder={`Ej: 5 ${formData.unit}`}
                />
              </div>
              <div>
                <Label htmlFor="total-price" className="text-sm">
                  Precio Total
                </Label>
                <Input
                  id="total-price"
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                  placeholder="Ej: 10000"
                />
              </div>
            </div>
            
            {pricePerUnit && (
              <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  ✓ Costo estimado: <span className="font-bold">${pricePerUnit}</span> por {getUnitLabel(formData.unit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este ingrediente ya tiene costo estimado y no requiere costeo adicional
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              💡 El precio por unidad se calcula automáticamente y se actualizará con facturas reales
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ingredient-stock">
                Stock Inicial <span className="text-muted-foreground font-normal">(en {getUnitLabelPlural(formData.unit)})</span>
              </Label>
              <Input
                id="ingredient-stock"
                type="number"
                step="0.01"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este es el stock que entra ahora a inventario
              </p>
            </div>

            <div>
              <Label htmlFor="ingredient-min">
                Stock Mínimo <span className="text-muted-foreground font-normal">(en {getUnitLabelPlural(formData.unit)})</span>
              </Label>
              <Input
                id="ingredient-min"
                type="number"
                step="0.01"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para alertas de reposición
              </p>
            </div>
          </div>

          {/* Compound ingredient option */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                id="is-compound"
                checked={formData.is_compound}
                onCheckedChange={(checked) => setFormData({ ...formData, is_compound: checked as boolean })}
              />
              <div className="flex-1">
                <Label htmlFor="is-compound" className="flex items-center gap-2 cursor-pointer font-medium">
                  <ChefHat className="h-4 w-4 text-primary" />
                  Ingrediente compuesto (preparación interna)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Marca esta opción si este ingrediente se prepara en tu cocina. Podrás definir su receta y rendimiento después.
                </p>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!formData.name.trim()}
          >
            <Check className="h-4 w-4 mr-2" />
            Crear Ingrediente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
