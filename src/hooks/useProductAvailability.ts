import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredient?: {
    name: string;
    current_stock: number;
    unit: string;
  };
}

export const useProductAvailability = (productId?: string) => {
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  const checkAvailability = async (prodId: string, quantity: number = 1) => {
    try {
      const { data, error } = await supabase
        .rpc('check_product_ingredients_available', {
          p_product_id: prodId,
          p_quantity: quantity,
        });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Default to available if check fails (product might not have ingredients)
    }
  };

  const loadProductIngredients = async (prodId: string) => {
    if (!prodId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_ingredients')
        .select(`
          *,
          ingredient:ingredients(name, current_stock, unit)
        `)
        .eq('product_id', prodId);

      if (error) throw error;
      
      const ingredients = (data || []).map(item => ({
        ...item,
        ingredient: Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient
      }));
      
      setProductIngredients(ingredients);

      // Check if product is available
      const available = await checkAvailability(prodId, 1);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error loading product ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProductIngredient = async (
    prodId: string,
    ingredientId: string,
    quantityNeeded: number
  ) => {
    try {
      const { error } = await supabase
        .from('product_ingredients')
        .insert({
          product_id: prodId,
          ingredient_id: ingredientId,
          quantity_needed: quantityNeeded,
        });

      if (error) throw error;
      await loadProductIngredients(prodId);
      return true;
    } catch (error) {
      console.error('Error adding product ingredient:', error);
      return false;
    }
  };

  const updateProductIngredient = async (id: string, quantityNeeded: number) => {
    try {
      const { error } = await supabase
        .from('product_ingredients')
        .update({ quantity_needed: quantityNeeded })
        .eq('id', id);

      if (error) throw error;
      
      if (productId) {
        await loadProductIngredients(productId);
      }
      return true;
    } catch (error) {
      console.error('Error updating product ingredient:', error);
      return false;
    }
  };

  const removeProductIngredient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (productId) {
        await loadProductIngredients(productId);
      }
      return true;
    } catch (error) {
      console.error('Error removing product ingredient:', error);
      return false;
    }
  };

  useEffect(() => {
    if (productId) {
      loadProductIngredients(productId);
    }
  }, [productId]);

  return {
    productIngredients,
    isAvailable,
    loading,
    checkAvailability,
    loadProductIngredients,
    addProductIngredient,
    updateProductIngredient,
    removeProductIngredient,
  };
};
