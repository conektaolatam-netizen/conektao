import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IngredientsManager } from './IngredientsManager';
import ProductManager from '../ProductManager';
import { CompoundIngredientsManager } from './CompoundIngredientsManager';
import ProductsCatalog from '../ProductsCatalog';
import { Package, Beaker, BookOpen, Eye } from 'lucide-react';

const InventoryManagement = ({ onModuleChange }: { onModuleChange?: (module: string) => void }) => {
  const [activeTab, setActiveTab] = useState<string>("ingredients");

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
          <ProductsCatalog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;
