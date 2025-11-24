import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit?: number;
  is_active: boolean;
  is_compound?: boolean;
  user_id?: string;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
  expiry_date?: string;
}

export interface IngredientMovement {
  id: string;
  ingredient_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export const useIngredients = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIngredients = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error: any) {
      console.error('Error loading ingredients:', error);
      toast.error('Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const createIngredient = async (ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          ...ingredient,
          user_id: user.id,
          restaurant_id: profile?.restaurant_id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Ingrediente creado exitosamente');
      await loadIngredients();
      return data;
    } catch (error: any) {
      console.error('Error creating ingredient:', error);
      toast.error('Error al crear ingrediente');
      return null;
    }
  };

  const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Ingrediente actualizado');
      await loadIngredients();
    } catch (error: any) {
      console.error('Error updating ingredient:', error);
      toast.error('Error al actualizar ingrediente');
    }
  };

  const deleteIngredient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Ingrediente eliminado');
      await loadIngredients();
    } catch (error: any) {
      console.error('Error deleting ingredient:', error);
      toast.error('Error al eliminar ingrediente');
    }
  };

  const adjustStock = async (
    ingredientId: string,
    quantity: number,
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT',
    notes?: string
  ) => {
    try {
      // Update stock
      const ingredient = ingredients.find(i => i.id === ingredientId);
      if (!ingredient) throw new Error('Ingrediente no encontrado');

      const newStock = movementType === 'OUT' 
        ? ingredient.current_stock - quantity 
        : ingredient.current_stock + quantity;

      await supabase
        .from('ingredients')
        .update({ current_stock: newStock })
        .eq('id', ingredientId);

      // Record movement
      await supabase
        .from('ingredient_movements')
        .insert({
          ingredient_id: ingredientId,
          movement_type: movementType,
          quantity,
          reference_type: movementType,
          notes,
        });

      toast.success('Stock actualizado correctamente');
      await loadIngredients();
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  useEffect(() => {
    loadIngredients();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('ingredients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingredients',
        },
        () => {
          loadIngredients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    ingredients,
    loading,
    loadIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
  };
};
