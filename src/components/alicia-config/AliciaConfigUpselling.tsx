import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lightbulb, MessageCircle, ShoppingBag, ArrowUpCircle, ClipboardCheck, DollarSign, ShieldCheck, Star, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

interface SuggestConfig {
  enabled: boolean;
  respect_first_no: boolean;
  suggest_upsizing: boolean;
  suggest_complements: boolean;
  suggest_on_greeting: boolean;
  suggest_before_close: boolean;
  no_prices_in_suggestions: boolean;
  max_suggestions_per_order: number;
}

interface PromotedProduct {
  product_id: string;
  name: string;
  note: string;
}

interface PromotedCategory {
  category: string;
  category_id: string;
  products: PromotedProduct[];
}

interface MenuProduct {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string | null;
  categories?: { name: string } | null;
}

const DEFAULT_CONFIG: SuggestConfig = {
  enabled: false,
  respect_first_no: true,
  suggest_upsizing: true,
  suggest_complements: true,
  suggest_on_greeting: true,
  suggest_before_close: true,
  no_prices_in_suggestions: true,
  max_suggestions_per_order: 2,
};

function parsePromotedProducts(raw: any): PromotedCategory[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === "object" && raw[0].category) {
    return raw as PromotedCategory[];
  }
  return [];
}

function isProductSelected(promoted: PromotedCategory[], productId: string): boolean {
  return promoted.some(c => c.products.some(p => p.product_id === productId));
}

function getProductNote(promoted: PromotedCategory[], productId: string): string {
  for (const c of promoted) {
    const found = c.products.find(p => p.product_id === productId);
    if (found) return found.note;
  }
  return "";
}

function totalSelected(promoted: PromotedCategory[]): number {
  return promoted.reduce((acc, c) => acc + c.products.length, 0);
}

export default function AliciaConfigUpselling({ config, onSave }: Props) {
  const raw = config.suggest_configs || {};
  const initial: SuggestConfig = { ...DEFAULT_CONFIG, ...raw };

  const [state, setState] = useState<SuggestConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [promoted, setPromoted] = useState<PromotedCategory[]>(() => parsePromotedProducts(config.promoted_products));
  const [menuByCategory, setMenuByCategory] = useState<Record<string, MenuProduct[]>>({});
  const [loading, setLoading] = useState(true);

  // Load active products
  useEffect(() => {
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", (await supabase.auth.getUser()).data.user?.id || "").single();
      if (!profile?.restaurant_id) return;

      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, category_id, categories(name)")
        .eq("restaurant_id", profile.restaurant_id)
        .eq("is_active", true)
        .order("name");

      if (products) {
        const grouped: Record<string, MenuProduct[]> = {};
        for (const p of products as any[]) {
          const cat = p.categories?.name || "Otros";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push({ id: p.id, name: p.name, price: p.price, category_id: p.category_id || "", category_name: cat, categories: p.categories });
        }
        setMenuByCategory(grouped);
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = <K extends keyof SuggestConfig>(key: K, value: SuggestConfig[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const toggleProduct = (product: MenuProduct, categoryName: string) => {
    setPromoted(prev => {
      const isSelected = isProductSelected(prev, product.id);
      if (isSelected) {
        const updated = prev.map(c => ({
          ...c,
          products: c.products.filter(p => p.product_id !== product.id),
        })).filter(c => c.products.length > 0);
        return updated;
      } else {
        const existing = prev.find(c => c.category === categoryName);
        const newProduct: PromotedProduct = { product_id: product.id, name: product.name, note: "" };
        if (existing) {
          return prev.map(c => c.category === categoryName ? { ...c, products: [...c.products, newProduct] } : c);
        }
        return [...prev, { category: categoryName, category_id: product.category_id, products: [newProduct] }];
      }
    });
  };

  const updateNote = (productId: string, note: string) => {
    setPromoted(prev => prev.map(c => ({
      ...c,
      products: c.products.map(p => p.product_id === productId ? { ...p, note } : p),
    })));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("suggest_configs", state);
    await onSave("promoted_products", promoted);
    setSaving(false);
  };

  const switches: { key: keyof SuggestConfig; label: string; desc: string; icon: React.ElementType }[] = [
    { key: "suggest_on_greeting", label: "Sugerir al saludar", desc: "Menciona 1-2 productos populares cuando el cliente saluda", icon: MessageCircle },
    { key: "suggest_complements", label: "Sugerir complementos", desc: "Sugiere bebidas, entradas u otros complementos tras un producto principal", icon: ShoppingBag },
    { key: "suggest_upsizing", label: "Sugerir tamaños mayores", desc: "Menciona tamaños más grandes si están disponibles", icon: ArrowUpCircle },
    { key: "suggest_before_close", label: "Sugerir antes de cerrar", desc: "Una última sugerencia ligera antes de confirmar el pedido", icon: ClipboardCheck },
    { key: "no_prices_in_suggestions", label: "No mencionar precios", desc: "Alicia no incluye precios al hacer sugerencias", icon: DollarSign },
    { key: "respect_first_no", label: "Respetar el primer 'no'", desc: "Si el cliente rechaza, no insistir con más sugerencias", icon: ShieldCheck },
  ];

  const sortedCategories = Object.keys(menuByCategory).sort();

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Lightbulb className="h-5 w-5 text-white" /></div>
        <div>
          <h3 className="text-lg font-semibold text-white">Sugerencias Inteligentes</h3>
          <p className="text-xs text-white/80">Alicia sugiere productos extras para subir el ticket</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Master toggle */}
        <div className="flex items-center gap-3 bg-muted rounded-lg p-4">
          <Switch checked={state.enabled} onCheckedChange={v => update("enabled", v)} />
          <div>
            <label className="text-sm text-foreground font-medium block">Sistema de sugerencias</label>
            <span className="text-xs text-muted-foreground">
              {state.enabled ? "Alicia hará sugerencias según la configuración" : "Alicia no hará ninguna sugerencia"}
            </span>
          </div>
        </div>

        {state.enabled && (
          <>
            {/* Max suggestions selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Máximo de sugerencias por momento</label>
              <p className="text-xs text-muted-foreground mb-2">Cuántas sugerencias puede hacer Alicia en cada momento de la conversación</p>
              <Select value={state.max_suggestions_per_order.toString()} onValueChange={v => update("max_suggestions_per_order", Number(v))}>
                <SelectTrigger className="w-40 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "sugerencia" : "sugerencias"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Star products section — categorized selector */}
            <div className="border border-border/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-orange-400" />
                <label className="text-sm font-medium text-foreground">Productos destacados</label>
                {totalSelected(promoted) > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">{totalSelected(promoted)} seleccionados</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Selecciona los productos que Alicia recomendará y agrega una nota descriptiva</p>

              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Cargando productos...</div>
              ) : sortedCategories.length === 0 ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No hay productos activos en el menú</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedCategories.map(cat => (
                    <Collapsible key={cat}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full bg-muted/50 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group">
                        <span className="text-sm font-medium text-foreground">{cat}</span>
                        <div className="flex items-center gap-2">
                          {promoted.find(c => c.category === cat)?.products.length ? (
                            <span className="text-xs text-orange-400 font-medium">
                              {promoted.find(c => c.category === cat)!.products.length}
                            </span>
                          ) : null}
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-2 pr-1 py-1 space-y-1">
                        {menuByCategory[cat].map(product => {
                          const selected = isProductSelected(promoted, product.id);
                          const note = getProductNote(promoted, product.id);
                          return (
                            <div key={product.id} className="space-y-1">
                              <label className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => toggleProduct(product, cat)}
                                />
                                <span className="text-sm text-foreground flex-1">{product.name}</span>
                                <span className="text-xs text-muted-foreground">${Number(product.price).toLocaleString("es-CO")}</span>
                              </label>
                              {selected && (
                                <div className="ml-9 mr-2 mb-2">
                                  <Input
                                    value={note}
                                    onChange={e => updateNote(product.id, e.target.value)}
                                    placeholder="Nota para Alicia, ej: recién salidos del horno..."
                                    className="text-xs border-border h-8"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>

            {/* Individual moment switches */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground mb-2">Momentos y comportamiento</label>
              {switches.map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="bg-muted rounded-md p-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block">{label}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </div>
                  <Switch checked={state[key] as boolean} onCheckedChange={v => update(key, v)} />
                </div>
              ))}
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
