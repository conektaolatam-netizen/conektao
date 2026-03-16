import React, { useState, useEffect } from "react";
import { UtensilsCrossed, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuOnboardingFlow, ExtractedMenuData } from "@/components/onboarding/MenuOnboardingFlow";
import { supabase } from "@/integrations/supabase/client";

interface CategoryWithProducts {
  name: string;
  count: number;
}

interface Props { config: any; configId: string; onSave: (field: string, value: any) => Promise<void>; onReload: () => void; }

export default function AliciaConfigMenu({ config, onReload }: Props) {
  const [showImport, setShowImport] = useState(false);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantId = config.restaurant_id;

  useEffect(() => {
    if (restaurantId) loadProducts();
  }, [restaurantId]);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category_id, categories(name)")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);

      if (products && products.length > 0) {
        const grouped: Record<string, number> = {};
        for (const p of products) {
          const catName = (p.categories as any)?.name || "Sin categoría";
          grouped[catName] = (grouped[catName] || 0) + 1;
        }
        setCategories(
          Object.entries(grouped)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, count]) => ({ name, count }))
        );
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleImportComplete = (_data: ExtractedMenuData) => {
    setShowImport(false);
    onReload();
    loadProducts();
  };

  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2"><UtensilsCrossed className="h-5 w-5 text-white" /></div>
          <div><h3 className="text-lg font-semibold text-white">Menú</h3><p className="text-xs text-white/80">Los productos que Alicia puede ofrecer</p></div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <p className="text-sm text-muted-foreground">
              {totalProducts > 0
                ? `${totalProducts} productos activos en ${categories.length} categorías`
                : "Aún no tienes productos registrados."}
            </p>
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => loadProducts()} size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </Button>
              <Button
                onClick={() => setShowImport(true)}
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-orange-400 text-white gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Importar menú con IA
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground animate-pulse">Cargando productos...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <span className="font-medium text-sm text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">{cat.count} productos</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay productos registrados. Usa el botón "Importar menú con IA" o agrégalos desde el módulo de Productos.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-auto">
          <MenuOnboardingFlow
            onComplete={handleImportComplete}
            onSkip={() => setShowImport(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
