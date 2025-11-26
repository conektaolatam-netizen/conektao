import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IngredientsManager } from './IngredientsManager';
import ProductManager from '../ProductManager';
import { CompoundIngredientsManager } from './CompoundIngredientsManager';
import ProductsCatalog from '../ProductsCatalog';
import { CreateProductFlow } from './CreateProductFlow';
import { Package, Beaker, BookOpen, Eye, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const InventoryManagement = ({ onModuleChange }: { onModuleChange?: (module: string) => void }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("ingredients");
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateIngredientOpen, setIsCreateIngredientOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name');
    
    if (data) setCategories(data);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
          <p className="text-muted-foreground">Gestiona ingredientes, productos y recetas internas</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="ingredients" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ingredientes
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="compounds" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Recetas Internas
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Catálogo Visual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="mt-6">
          <IngredientsManager />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductManager onModuleChange={onModuleChange} />
        </TabsContent>

        <TabsContent value="compounds" className="mt-6">
          <CompoundIngredientsManager />
        </TabsContent>

        <TabsContent value="catalog" className="mt-6">
          <ProductsCatalog key={refreshKey} />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsCreateMenuOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 bg-green-600 hover:bg-green-700"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Menu Dialog */}
      <Dialog open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ¿Qué querés crear?
            </DialogTitle>
            <DialogDescription>
              Elegí qué tipo de elemento querés agregar al inventario
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-start gap-2"
              onClick={() => {
                setIsCreateMenuOpen(false);
                setIsCreateProductOpen(true);
              }}
            >
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold">Producto Final</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Creá un producto completo con receta y costeo automático
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col items-start gap-2"
              onClick={() => {
                setIsCreateMenuOpen(false);
                setIsCreateIngredientOpen(true);
              }}
            >
              <div className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-primary" />
                <span className="font-semibold">Ingrediente Simple</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Agregá un ingrediente básico para usar en tus recetas
              </p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Flow */}
      <CreateProductFlow
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onSuccess={handleCreateSuccess}
        categories={categories}
      />

      {/* Create Ingredient Dialog - Simplified */}
      <Dialog open={isCreateIngredientOpen} onOpenChange={setIsCreateIngredientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Ingrediente</DialogTitle>
            <DialogDescription>
              Para crear un ingrediente, ir a la pestaña "Ingredientes" y usar el botón "Nuevo Ingrediente"
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => {
            setIsCreateIngredientOpen(false);
            setActiveTab("ingredients");
          }}>
            Ir a Ingredientes
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
