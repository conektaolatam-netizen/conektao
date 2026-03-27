import React, { useState, useEffect, useRef } from "react";
import { UtensilsCrossed, Sparkles, RefreshCw, ChevronDown, Trash2, RotateCcw, EyeOff, FileText, Upload, ExternalLink, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MenuOnboardingFlow, ExtractedMenuData } from "@/components/onboarding/MenuOnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AliciaConfigCombos from "./AliciaConfigCombos";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface CategoryWithProducts {
  name: string;
  products: ProductItem[];
}

interface Props { config: any; configId: string; onSave: (field: string, value: any) => Promise<void>; onReload: () => void; }

const BUCKET = "whatsapp-media";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

function groupProducts(products: any[]): CategoryWithProducts[] {
  const grouped: Record<string, ProductItem[]> = {};
  for (const p of products) {
    const catName = (p.categories as any)?.name || "Sin categoría";
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push({ id: p.id, name: p.name, price: p.price ?? 0, description: p.description ?? null });
  }
  return Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, products]) => ({ name, products: products.sort((a, b) => a.name.localeCompare(b.name)) }));
}

export default function AliciaConfigMenu({ config, configId, onSave, onReload }: Props) {
  const [showImport, setShowImport] = useState(false);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveCategories, setInactiveCategories] = useState<CategoryWithProducts[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<ProductItem | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const restaurantId = config.restaurant_id;

  useEffect(() => {
    if (restaurantId) loadProducts();
  }, [restaurantId]);

  useEffect(() => {
    if (showInactive && restaurantId) loadInactiveProducts();
  }, [showInactive, restaurantId]);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, description, category_id, categories(name)")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true);
      setCategories(data && data.length > 0 ? groupProducts(data) : []);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadInactiveProducts() {
    setLoadingInactive(true);
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, description, category_id, categories(name)")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", false);
      setInactiveCategories(data && data.length > 0 ? groupProducts(data) : []);
    } catch (err) {
      console.error("Error loading inactive products:", err);
    } finally {
      setLoadingInactive(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").update({ is_active: false }).eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Producto eliminado", description: `"${deleteTarget.name}" fue desactivado del menú.` });
      setDeleteTarget(null);
      loadProducts();
      if (showInactive) loadInactiveProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  async function handleReactivateProduct() {
    if (!reactivateTarget) return;
    setReactivating(true);
    try {
      const { error } = await supabase.from("products").update({ is_active: true }).eq("id", reactivateTarget.id);
      if (error) throw error;
      toast({ title: "Producto reactivado", description: `"${reactivateTarget.name}" vuelve a estar en el menú.` });
      setReactivateTarget(null);
      loadProducts();
      loadInactiveProducts();
    } catch (err) {
      console.error("Error reactivating product:", err);
      toast({ title: "Error", description: "No se pudo reactivar el producto.", variant: "destructive" });
    } finally {
      setReactivating(false);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Formato inválido", description: "Solo se permiten archivos PDF.", variant: "destructive" });
      return;
    }
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: `El PDF pesa ${fileSizeMB} MB. El máximo permitido es 50 MB.`, variant: "destructive" });
      return;
    }
    setUploadingPdf(true);
    try {
      const filePath = `${restaurantId}/Carta.pdf`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) {
        if (uploadError.message?.includes("maximum allowed size")) {
          toast({ title: "Archivo muy grande", description: `El PDF pesa ${fileSizeMB} MB y excede el límite del servidor. Intenta comprimir el archivo.`, variant: "destructive" });
        } else {
          toast({ title: "Error", description: uploadError.message || "No se pudo subir el PDF.", variant: "destructive" });
        }
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      await onSave("menu_link", urlData.publicUrl);
      toast({ title: "PDF subido ✅", description: `Menú actualizado (${fileSizeMB} MB).` });
    } catch (err: any) {
      console.error("Error uploading PDF:", err);
      toast({ title: "Error", description: err?.message || "No se pudo subir el PDF.", variant: "destructive" });
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePdf() {
    await onSave("menu_link", null);
    toast({ title: "PDF removido", description: "El enlace del menú fue eliminado." });
  }

  const menuLink = config.menu_link;

  const handleImportComplete = (_data: ExtractedMenuData) => {
    setShowImport(false);
    onReload();
    loadProducts();
  };

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);
  const totalInactive = inactiveCategories.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <>
      <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2"><UtensilsCrossed className="h-5 w-5 text-white" /></div>
          <div><h3 className="text-lg font-semibold text-white">Menú</h3><p className="text-xs text-white/80">Los productos que Alicia puede ofrecer</p></div>
        </div>
        <div className="p-5">
          {/* PDF del menú */}
          <div className="mb-5 rounded-lg border border-border/30 bg-muted/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-medium text-foreground">Menú en PDF</span>
              <span className="text-xs text-muted-foreground">(se envía por WhatsApp cuando el cliente pide la carta)</span>
            </div>
            {menuLink ? (
              <div className="flex items-center gap-3 flex-wrap">
                <a href={menuLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 truncate max-w-xs">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Ver PDF actual
                </a>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadingPdf}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingPdf ? "Subiendo..." : "Reemplazar"}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleRemovePdf}>
                  <X className="h-3.5 w-3.5" />
                  Quitar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">No hay PDF cargado.</p>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploadingPdf}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingPdf ? "Subiendo..." : "Subir PDF"}
                </Button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
          </div>

          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {totalProducts > 0
                ? `${totalProducts} productos activos en ${categories.length} categorías`
                : "Aún no tienes productos registrados."}
            </p>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button onClick={() => setShowInactive(!showInactive)} size="sm" variant={showInactive ? "secondary" : "outline"} className="gap-1.5">
                <EyeOff className="h-3.5 w-3.5" />
                Inactivos
                {totalInactive > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{totalInactive}</Badge>}
              </Button>
              <Button onClick={() => { loadProducts(); if (showInactive) loadInactiveProducts(); }} size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </Button>
              <Button onClick={() => setShowImport(true)} size="sm" className="bg-gradient-to-r from-teal-500 to-orange-400 text-white gap-2">
                <Sparkles className="h-4 w-4" />
                Importar menú con IA
              </Button>
            </div>
          </div>

          {/* Active products */}
          {loading ? (
            <div className="bg-muted rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground animate-pulse">Cargando productos...</p>
            </div>
          ) : categories.length > 0 ? (
            <CategoryList categories={categories} onAction={setDeleteTarget} actionIcon="delete" />
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay productos registrados. Usa el botón "Importar menú con IA" o agrégalos desde el módulo de Productos.</p>
            </div>
          )}

          {/* Inactive products */}
          {showInactive && (
            <div className="mt-5 border-t border-dashed border-border/40 pt-5">
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <EyeOff className="h-4 w-4" /> Productos inactivos
              </p>
              {loadingInactive ? (
                <div className="bg-muted rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground animate-pulse">Cargando inactivos...</p>
                </div>
              ) : inactiveCategories.length > 0 ? (
                <div className="opacity-70">
                  <CategoryList categories={inactiveCategories} onAction={setReactivateTarget} actionIcon="reactivate" />
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">No hay productos inactivos.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-auto">
          <MenuOnboardingFlow onComplete={handleImportComplete} onSkip={() => setShowImport(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" dejará de aparecer en el menú de Alicia. Puedes reactivarlo desde la sección de inactivos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate confirmation */}
      <AlertDialog open={!!reactivateTarget} onOpenChange={(open) => !open && setReactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{reactivateTarget?.name}" volverá a aparecer en el menú de Alicia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReactivateProduct} disabled={reactivating} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {reactivating ? "Reactivando..." : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* Extracted sub-component for category accordion list */
function CategoryList({ categories, onAction, actionIcon }: {
  categories: CategoryWithProducts[];
  onAction: (product: ProductItem) => void;
  actionIcon: "delete" | "reactivate";
}) {
  return (
    <div className="space-y-2">
      {categories.map((cat, i) => (
        <Collapsible key={i}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted rounded-lg px-4 py-3 hover:bg-muted/80 transition-colors group">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              <span className="font-medium text-sm text-foreground">{cat.name}</span>
            </div>
            <Badge variant="secondary" className="text-xs">{cat.products.length} productos</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 mr-1 mt-1 mb-2 border-l-2 border-border/40 pl-3 space-y-1">
              {cat.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group/item">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">{product.name}</span>
                    {product.price > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity ${
                      actionIcon === "delete"
                        ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                    }`}
                    onClick={() => onAction(product)}
                  >
                    {actionIcon === "delete" ? <Trash2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
