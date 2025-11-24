import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IngredientsManager } from '@/components/inventory/IngredientsManager';
import ProductManager from '@/components/ProductManager';
import { Package, Coffee } from 'lucide-react';

const InventoryManager = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Inventario</h1>
        <p className="text-muted-foreground">Administra ingredientes y productos</p>
      </div>

      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ingredients" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ingredientes
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Productos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredients" className="mt-6">
          <IngredientsManager />
        </TabsContent>
        
        <TabsContent value="products" className="mt-6">
          <ProductManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManager;
