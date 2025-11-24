import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
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
import { useIngredients, Ingredient } from '@/hooks/useIngredients';
import { toast } from 'sonner';

export const IngredientsManager = () => {
  const { ingredients, loading, createIngredient, updateIngredient, deleteIngredient, adjustStock } = useIngredients();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'gramos',
    current_stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    movement_type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    notes: '',
  });

  const handleOpenDialog = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        description: ingredient.description || '',
        unit: ingredient.unit,
        current_stock: ingredient.current_stock,
        min_stock: ingredient.min_stock,
        cost_per_unit: ingredient.cost_per_unit || 0,
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: '',
        description: '',
        unit: 'gramos',
        current_stock: 0,
        min_stock: 0,
        cost_per_unit: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, formData);
    } else {
      await createIngredient({ ...formData, is_active: true });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ingrediente?')) {
      await deleteIngredient(id);
    }
  };

  const handleOpenStockDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setStockAdjustment({
      quantity: 0,
      movement_type: 'IN',
      notes: '',
    });
    setIsStockDialogOpen(true);
  };

  const handleStockAdjust = async () => {
    if (!selectedIngredient || stockAdjustment.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    await adjustStock(
      selectedIngredient.id,
      stockAdjustment.quantity,
      stockAdjustment.movement_type,
      stockAdjustment.notes
    );
    setIsStockDialogOpen(false);
  };

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLowStockCount = () => 
    ingredients.filter(i => i.current_stock <= i.min_stock).length;

  if (loading) {
    return <div className="p-6 text-center">Cargando ingredientes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Ingredientes</h2>
          <p className="text-muted-foreground">
            Administra los ingredientes que componen tus productos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ingrediente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Ingredientes</p>
              <p className="text-2xl font-bold">{ingredients.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold">{getLowStockCount()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar ingredientes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Ingredients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIngredients.map((ingredient) => {
          const isLowStock = ingredient.current_stock <= ingredient.min_stock;
          
          return (
            <Card key={ingredient.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{ingredient.name}</h3>
                    {ingredient.description && (
                      <p className="text-sm text-muted-foreground">{ingredient.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(ingredient)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={`flex items-center justify-between ${isLowStock ? 'text-destructive' : ''}`}>
                    <span className="text-sm">Stock Actual:</span>
                    <span className="font-semibold">
                      {ingredient.current_stock} {ingredient.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Stock Mínimo:</span>
                    <span>{ingredient.min_stock} {ingredient.unit}</span>
                  </div>
                  {ingredient.cost_per_unit && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Costo unitario:</span>
                      <span>${ingredient.cost_per_unit.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleOpenStockDialog(ingredient)}
                >
                  Ajustar Stock
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Harina, Tomate, etc."
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>

            <div>
              <Label>Unidad de Medida *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Actual</Label>
                <Input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Costo por Unidad</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajustar Stock - {selectedIngredient?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Stock actual:</p>
              <p className="text-lg font-semibold">
                {selectedIngredient?.current_stock} {selectedIngredient?.unit}
              </p>
            </div>

            <div>
              <Label>Tipo de Movimiento</Label>
              <Select
                value={stockAdjustment.movement_type}
                onValueChange={(value: any) => 
                  setStockAdjustment({ ...stockAdjustment, movement_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Entrada (Agregar)</SelectItem>
                  <SelectItem value="OUT">Salida (Restar)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                step="0.01"
                value={stockAdjustment.quantity}
                onChange={(e) => 
                  setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label>Notas (opcional)</Label>
              <Input
                value={stockAdjustment.notes}
                onChange={(e) => 
                  setStockAdjustment({ ...stockAdjustment, notes: e.target.value })
                }
                placeholder="Motivo del ajuste..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStockAdjust}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
