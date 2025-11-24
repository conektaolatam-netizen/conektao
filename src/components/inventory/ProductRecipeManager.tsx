import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { useIngredients } from '@/hooks/useIngredients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
}

export const ProductRecipeManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    ingredient_id: '',
    quantity_needed: 0,
  });

  const { ingredients } = useIngredients();
  const {
    productIngredients,
    isAvailable,
    loading,
    loadProductIngredients,
    addProductIngredient,
    updateProductIngredient,
    removeProductIngredient,
  } = useProductAvailability(selectedProductId);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedProductId || !newIngredient.ingredient_id || newIngredient.quantity_needed <= 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const success = await addProductIngredient(
      selectedProductId,
      newIngredient.ingredient_id,
      newIngredient.quantity_needed
    );

    if (success) {
      toast.success('Ingrediente agregado a la receta');
      setIsDialogOpen(false);
      setNewIngredient({ ingredient_id: '', quantity_needed: 0 });
    }
  };

  const handleRemoveIngredient = async (id: string) => {
    if (confirm('¿Eliminar este ingrediente de la receta?')) {
      const success = await removeProductIngredient(id);
      if (success) {
        toast.success('Ingrediente eliminado');
      }
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Gestión de Recetas</h2>
        <p className="text-muted-foreground">
          Define qué ingredientes necesita cada producto
        </p>
      </div>

      {/* Product Selector */}
      <Card className="p-4">
        <Label>Selecciona un Producto</Label>
        <Select
          value={selectedProductId}
          onValueChange={(value) => {
            setSelectedProductId(value);
            loadProductIngredients(value);
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Selecciona un producto..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} - ${product.price.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedProductId && (
        <>
          {/* Availability Alert */}
          {!loading && !isAvailable && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este producto NO está disponible actualmente debido a falta de ingredientes.
              </AlertDescription>
            </Alert>
          )}

          {/* Add Ingredient Button */}
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Ingrediente
          </Button>

          {/* Ingredients List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">
              Ingredientes de {selectedProduct?.name}
            </h3>
            
            {productIngredients.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>Este producto aún no tiene ingredientes asignados</p>
                <p className="text-sm mt-2">
                  Agrega ingredientes para habilitar el control de inventario automático
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {productIngredients.map((pi) => {
                  const hasEnough = pi.ingredient && 
                    pi.ingredient.current_stock >= pi.quantity_needed;

                  return (
                    <Card key={pi.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pi.ingredient?.name}</p>
                            {!hasEnough && (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>
                              Necesita: {pi.quantity_needed} {pi.ingredient?.unit}
                            </span>
                            <span className={hasEnough ? 'text-green-600' : 'text-destructive'}>
                              Stock: {pi.ingredient?.current_stock} {pi.ingredient?.unit}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredient(pi.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Ingredient Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Ingrediente a la Receta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ingrediente</Label>
              <Select
                value={newIngredient.ingredient_id}
                onValueChange={(value) => 
                  setNewIngredient({ ...newIngredient, ingredient_id: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona un ingrediente..." />
                </SelectTrigger>
                <SelectContent>
                  {ingredients
                    .filter(ing => 
                      !productIngredients.some(pi => pi.ingredient_id === ing.id)
                    )
                    .map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} (Stock: {ing.current_stock} {ing.unit})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cantidad Necesaria</Label>
              <Input
                type="number"
                step="0.01"
                value={newIngredient.quantity_needed}
                onChange={(e) => 
                  setNewIngredient({ 
                    ...newIngredient, 
                    quantity_needed: Number(e.target.value) 
                  })
                }
                placeholder="Ej: 100"
              />
              {newIngredient.ingredient_id && (
                <p className="text-sm text-muted-foreground mt-1">
                  Unidad: {ingredients.find(i => i.id === newIngredient.ingredient_id)?.unit}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddIngredient}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
