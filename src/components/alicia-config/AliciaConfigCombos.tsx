import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Package, X, Save, ChevronDown, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  category_name: string;
}

interface ComboItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_price: number;
  fraction: number;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  description: string | null;
  calculated_price: number;
  override_price: number | null;
  is_active: boolean;
  items: ComboItem[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

interface Props {
  restaurantId: string;
}

export default function AliciaConfigCombos({ restaurantId }: Props) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Combo | null>(null);

  // Create/edit form state
  const [editCombo, setEditCombo] = useState<Combo | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOverridePrice, setFormOverridePrice] = useState("");
  const [formItems, setFormItems] = useState<ComboItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      loadCombos();
      loadProducts();
    }
  }, [restaurantId]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, category_id, categories(name)")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("name");
    setProducts((data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price ?? 0,
      category_name: p.categories?.name || "Sin categoría",
    })));
  }

  async function loadCombos() {
    setLoading(true);
    try {
      const { data: combosData } = await supabase
        .from("product_combos")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("name");

      if (!combosData || combosData.length === 0) {
        setCombos([]);
        setLoading(false);
        return;
      }

      const comboIds = combosData.map(c => c.id);
      const { data: itemsData } = await supabase
        .from("product_combo_items")
        .select("id, combo_id, product_id, fraction, quantity, products(name, price)")
        .in("combo_id", comboIds);

      const combosWithItems: Combo[] = combosData.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        calculated_price: Number(c.calculated_price),
        override_price: c.override_price != null ? Number(c.override_price) : null,
        is_active: c.is_active,
        items: (itemsData || [])
          .filter((i: any) => i.combo_id === c.id)
          .map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            product_name: (i as any).products?.name || "?",
            product_price: Number((i as any).products?.price || 0),
            fraction: Number(i.fraction),
            quantity: i.quantity,
          })),
      }));

      setCombos(combosWithItems);
    } catch (err) {
      console.error("Error loading combos:", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditCombo(null);
    setFormName("");
    setFormDescription("");
    setFormOverridePrice("");
    setFormItems([]);
    setShowCreate(true);
  }

  function openEdit(combo: Combo) {
    setEditCombo(combo);
    setFormName(combo.name);
    setFormDescription(combo.description || "");
    setFormOverridePrice(combo.override_price != null ? String(combo.override_price) : "");
    setFormItems([...combo.items]);
    setShowCreate(true);
  }

  function addItem() {
    if (products.length === 0) return;
    const first = products[0];
    setFormItems(prev => [...prev, {
      product_id: first.id,
      product_name: first.name,
      product_price: first.price,
      fraction: 1,
      quantity: 1,
    }]);
  }

  function updateItem(index: number, field: string, value: any) {
    setFormItems(prev => {
      const copy = [...prev];
      if (field === "product_id") {
        const product = products.find(p => p.id === value);
        if (product) {
          copy[index] = { ...copy[index], product_id: value, product_name: product.name, product_price: product.price };
        }
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  }

  function removeItem(index: number) {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  }

  const calculatedPrice = useMemo(() => {
    return formItems.reduce((sum, item) => sum + (item.product_price * item.fraction * item.quantity), 0);
  }, [formItems]);

  const autoName = useMemo(() => {
    if (formItems.length === 0) return "";
    return formItems.map(i => {
      const prefix = i.fraction === 0.5 ? "Mitad " : i.fraction === 1 ? "" : `${i.fraction}x `;
      const qty = i.quantity > 1 ? ` x${i.quantity}` : "";
      return `${prefix}${i.product_name}${qty}`;
    }).join(" + ");
  }, [formItems]);

  async function handleSave() {
    if (formItems.length === 0) {
      toast.error("Agrega al menos un producto al combo");
      return;
    }

    const name = formName.trim() || autoName;
    if (!name) {
      toast.error("El combo necesita un nombre");
      return;
    }

    setSaving(true);
    try {
      const overridePrice = formOverridePrice.trim() ? Number(formOverridePrice) : null;

      if (editCombo) {
        // Update combo
        const { error } = await supabase
          .from("product_combos")
          .update({
            name,
            description: formDescription.trim() || null,
            override_price: overridePrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editCombo.id);
        if (error) throw error;

        // Delete old items and re-insert
        await supabase.from("product_combo_items").delete().eq("combo_id", editCombo.id);
        const { error: itemsError } = await supabase.from("product_combo_items").insert(
          formItems.map(i => ({
            combo_id: editCombo.id,
            product_id: i.product_id,
            fraction: i.fraction,
            quantity: i.quantity,
          }))
        );
        if (itemsError) throw itemsError;

        toast.success("Combo actualizado ✅");
      } else {
        // Create combo
        const { data: newCombo, error } = await supabase
          .from("product_combos")
          .insert({
            restaurant_id: restaurantId,
            name,
            description: formDescription.trim() || null,
            calculated_price: calculatedPrice,
            override_price: overridePrice,
          })
          .select()
          .single();
        if (error) throw error;

        const { error: itemsError } = await supabase.from("product_combo_items").insert(
          formItems.map(i => ({
            combo_id: newCombo.id,
            product_id: i.product_id,
            fraction: i.fraction,
            quantity: i.quantity,
          }))
        );
        if (itemsError) throw itemsError;

        toast.success("Combo creado ✅");
      }

      setShowCreate(false);
      loadCombos();
    } catch (err: any) {
      console.error("Error saving combo:", err);
      toast.error(err?.message || "Error al guardar combo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("product_combos")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Combo eliminado");
      setDeleteTarget(null);
      loadCombos();
    } catch (err) {
      toast.error("Error al eliminar combo");
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {combos.length > 0 ? `${combos.length} combos activos` : "No tienes combos creados aún."}
          </p>
          <Button onClick={openCreate} size="sm" className="bg-gradient-to-r from-teal-500 to-orange-400 text-white gap-2">
            <Plus className="h-4 w-4" />
            Crear combo
          </Button>
        </div>

        {loading ? (
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">Cargando combos...</p>
          </div>
        ) : combos.length > 0 ? (
          <div className="space-y-2">
            {combos.map(combo => {
              const effectivePrice = combo.override_price ?? combo.calculated_price;
              return (
                <div
                  key={combo.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3 hover:bg-muted transition-colors cursor-pointer group"
                  onClick={() => openEdit(combo)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-teal-400 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{combo.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {combo.items.map(i => {
                          const frac = i.fraction === 0.5 ? "½ " : i.fraction === 1 ? "" : `${i.fraction}× `;
                          return `${frac}${i.product_name}`;
                        }).join(" + ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">{formatPrice(effectivePrice)}</span>
                      {combo.override_price != null && (
                        <div className="text-[10px] text-muted-foreground line-through">{formatPrice(combo.calculated_price)}</div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(combo); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted rounded-lg p-6 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Crea combos como "Mitad y Mitad" o paquetes de productos.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCombo ? "Editar combo" : "Crear combo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre</label>
              <Input
                placeholder={autoName || "Ej: Mitad Hawaiana + Mitad Pepperoni"}
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
              {!formName.trim() && autoName && (
                <p className="text-[10px] text-muted-foreground mt-1">Auto: {autoName}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción (opcional)</label>
              <Input
                placeholder="Descripción del combo"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
              />
            </div>

            {/* Items */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Productos del combo</label>

              {/* Added items list */}
              {formItems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{item.product_name} — {formatPrice(item.product_price)}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeItem(idx)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Fracción</label>
                          <Select value={String(item.fraction)} onValueChange={v => updateItem(idx, "fraction", Number(v))}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.25">¼ (cuarto)</SelectItem>
                              <SelectItem value="0.33">⅓ (tercio)</SelectItem>
                              <SelectItem value="0.5">½ (mitad)</SelectItem>
                              <SelectItem value="0.75">¾ (tres cuartos)</SelectItem>
                              <SelectItem value="1">1 (completo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-16">
                          <label className="text-[10px] text-muted-foreground">Cantidad</label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="text-right w-24">
                          <label className="text-[10px] text-muted-foreground">Subtotal</label>
                          <p className="text-xs font-medium text-foreground">{formatPrice(item.product_price * item.fraction * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Collapsible category product picker */}
              <ComboProductPicker products={products} onSelect={(p) => {
                setFormItems(prev => [...prev, {
                  product_id: p.id,
                  product_name: p.name,
                  product_price: p.price,
                  fraction: 1,
                  quantity: 1,
                }]);
              }} />
            </div>

            {/* Pricing */}
            {formItems.length > 0 && (
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Precio calculado</span>
                  <span className="text-sm font-semibold text-foreground">{formatPrice(calculatedPrice)}</span>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Precio fijo (opcional, reemplaza el calculado)</label>
                  <Input
                    type="number"
                    placeholder="Dejar vacío para usar el calculado"
                    value={formOverridePrice}
                    onChange={e => setFormOverridePrice(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                {formOverridePrice.trim() && (
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <span className="text-xs font-medium text-teal-400">Precio final</span>
                    <span className="text-sm font-bold text-teal-400">{formatPrice(Number(formOverridePrice))}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || formItems.length === 0} className="gap-2 bg-gradient-to-r from-teal-500 to-orange-400 text-white">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : editCombo ? "Actualizar" : "Crear combo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar combo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" dejará de estar disponible. Puedes recrearlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* Collapsible category-based product picker */
function ComboProductPicker({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of products) {
      const cat = p.category_name || "Sin categoría";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, items]) => ({ name, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [products]);

  const toggleCat = (name: string) => setOpenCats(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="border border-dashed border-border/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Plus className="h-3.5 w-3.5" /> Agregar producto
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="max-h-60 overflow-y-auto border-t border-border/30">
          {grouped.map(cat => (
            <div key={cat.name}>
              <button
                type="button"
                onClick={() => toggleCat(cat.name)}
                className="flex items-center justify-between w-full px-4 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${openCats[cat.name] ? "rotate-180" : ""}`} />
                  <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">{cat.items.length}</Badge>
              </button>
              {openCats[cat.name] && (
                <div className="border-l-2 border-border/40 ml-4 mr-1">
                  {cat.items.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelect(p); }}
                      className="flex items-center justify-between w-full text-left py-2 px-3 hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-xs text-foreground">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatPrice(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
