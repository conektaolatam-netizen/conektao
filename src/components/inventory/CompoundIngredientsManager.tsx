import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Beaker, Plus, Loader2, Package } from "lucide-react";
import { InternalProductionDialog } from './InternalProductionDialog';

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  cost_per_unit: number | null;
  is_compound: boolean;
}

interface RecipeItem {
  base_ingredient: {
    name: string;
    unit: string;
  };
  quantity_needed: number;
}

export const CompoundIngredientsManager = () => {
  const [compoundIngredients, setCompoundIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Record<string, RecipeItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCompoundIngredients();
  }, []);

  const loadCompoundIngredients = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.restaurant_id) return;

      // Obtener ingredientes compuestos
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('is_compound', true)
        .eq('is_active', true)
        .eq('restaurant_id', profile.restaurant_id)
        .order('name');

      if (ingredientsError) throw ingredientsError;

      setCompoundIngredients(ingredients || []);

      // Cargar recetas de cada ingrediente compuesto
      if (ingredients && ingredients.length > 0) {
        const recipesData: Record<string, RecipeItem[]> = {};

        for (const ingredient of ingredients) {
          const { data: recipe } = await supabase
            .from('ingredient_recipes')
            .select(`
              quantity_needed,
              base_ingredient:ingredients!ingredient_recipes_base_ingredient_id_fkey(name, unit)
            `)
            .eq('compound_ingredient_id', ingredient.id);

          if (recipe) {
            recipesData[ingredient.id] = recipe;
          }
        }

        setRecipes(recipesData);
      }
    } catch (error) {
      console.error('Error loading compound ingredients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ingredientes compuestos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductionDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setProductionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (compoundIngredients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Beaker className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay ingredientes compuestos</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Los ingredientes compuestos se crean al definir productos que usan recetas internas
            (ej: piña melada hecha con piña + azúcar + canela)
          </p>
          <Button onClick={() => window.location.href = '/?view=products'}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Producto con Receta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Ingredientes Elaborados</h3>
          <p className="text-sm text-muted-foreground">
            Ingredientes producidos internamente con recetas definidas
          </p>
        </div>
        <Badge variant="secondary">
          {compoundIngredients.length} {compoundIngredients.length === 1 ? 'ingrediente' : 'ingredientes'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {compoundIngredients.map((ingredient) => {
          const recipe = recipes[ingredient.id] || [];
          const isLowStock = ingredient.current_stock < ingredient.min_stock;

          return (
            <Card key={ingredient.id} className="relative overflow-hidden">
              {isLowStock && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                  </div>
                  {isLowStock && (
                    <Badge variant="destructive" className="text-xs">Bajo</Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  Stock: {ingredient.current_stock} {ingredient.unit}
                  {ingredient.cost_per_unit && ` • $${ingredient.cost_per_unit.toFixed(2)}/${ingredient.unit}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Receta */}
                {recipe.length > 0 && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-xs font-medium mb-2">Receta:</div>
                    <ul className="text-xs space-y-1">
                      {recipe.map((item, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">{item.base_ingredient.name}</span>
                          <span className="font-medium">
                            {item.quantity_needed} {item.base_ingredient.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botón para producir */}
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={() => handleOpenProductionDialog(ingredient)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Producir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de producción */}
      {selectedIngredient && (
        <InternalProductionDialog
          compoundIngredient={selectedIngredient}
          open={productionDialogOpen}
          onOpenChange={setProductionDialogOpen}
          onProductionComplete={loadCompoundIngredients}
        />
      )}
    </div>
  );
};
