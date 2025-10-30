import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Topping {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  is_active: boolean;
}

interface ToppingsManagerProps {
  isMocai?: boolean;
}

export const ToppingsManager: React.FC<ToppingsManagerProps> = ({ isMocai = false }) => {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost_price: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isMocai && user) {
      loadToppings();
    }
  }, [isMocai, user]);

  const loadToppings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setToppings(data || []);
    } catch (error) {
      console.error('Error loading toppings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los toppings",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.restaurant_id) return;

    setLoading(true);
    try {
      const toppingData = {
        name: formData.name,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price) || 0,
        user_id: user.id,
        restaurant_id: profile.restaurant_id,
        is_active: true
      };

      if (editingTopping) {
        const { error } = await supabase
          .from('toppings')
          .update(toppingData)
          .eq('id', editingTopping.id);

        if (error) throw error;
        toast({
          title: "Topping actualizado",
          description: "El topping se actualizó correctamente"
        });
      } else {
        const { error } = await supabase
          .from('toppings')
          .insert(toppingData);

        if (error) throw error;
        toast({
          title: "Topping creado",
          description: "El topping se creó correctamente"
        });
      }

      setFormData({ name: '', price: '', cost_price: '' });
      setEditingTopping(null);
      setIsDialogOpen(false);
      loadToppings();
    } catch (error) {
      console.error('Error saving topping:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el topping",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topping: Topping) => {
    setEditingTopping(topping);
    setFormData({
      name: topping.name,
      price: topping.price.toString(),
      cost_price: topping.cost_price?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (toppingId: string) => {
    if (!confirm('¿Estás seguro de eliminar este topping?')) return;

    try {
      const { error } = await supabase
        .from('toppings')
        .update({ is_active: false })
        .eq('id', toppingId);

      if (error) throw error;
      
      toast({
        title: "Topping eliminado",
        description: "El topping se desactivó correctamente"
      });
      loadToppings();
    } catch (error) {
      console.error('Error deleting topping:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el topping",
        variant: "destructive"
      });
    }
  };

  if (!isMocai) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-center">
          La gestión de toppings está disponible próximamente para tu establecimiento.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Toppings</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTopping(null);
                setFormData({ name: '', price: '', cost_price: '' });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Topping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTopping ? 'Editar Topping' : 'Crear Nuevo Topping'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Topping</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio de Venta ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost_price">Precio de Costo ($) - Opcional</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : editingTopping ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {toppings.filter(t => t.is_active).map((topping) => (
            <div key={topping.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{topping.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    Precio: ${topping.price.toFixed(2)}
                  </Badge>
                  {topping.cost_price > 0 && (
                    <Badge variant="outline">
                      Costo: ${topping.cost_price.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(topping)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(topping.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {toppings.filter(t => t.is_active).length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No hay toppings creados. Crea el primero para empezar.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};