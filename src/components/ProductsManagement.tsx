import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManager from './ProductManager';
import ProductsCatalog from './ProductsCatalog';
import { Settings, Eye } from 'lucide-react';

const ProductsManagement = () => {
  const [activeTab, setActiveTab] = useState<string>("catalog");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">Gestiona y visualiza tu menú</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestión
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-6">
          <ProductsCatalog />
        </TabsContent>

        <TabsContent value="management" className="mt-6">
          <ProductManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsManagement;
