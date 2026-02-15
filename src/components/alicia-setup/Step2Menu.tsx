import React, { useState } from "react";
import { Plus, Trash2, Star, UtensilsCrossed } from "lucide-react";

interface MenuItem {
  name: string;
  price: number;
  description?: string;
  is_recommended?: boolean;
  sizes?: { name: string; price: number }[];
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const Step2Menu = ({ data, onSave, saving, onBack }: Props) => {
  const [menuLink, setMenuLink] = useState(data.menu_link || "");
  const [categories, setCategories] = useState<MenuCategory[]>(
    data.menu_data?.length ? data.menu_data : [{ name: "", items: [{ name: "", price: 0 }] }]
  );

  const addCategory = () => {
    setCategories([...categories, { name: "", items: [{ name: "", price: 0 }] }]);
  };

  const addItem = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items.push({ name: "", price: 0 });
    setCategories(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items.splice(itemIdx, 1);
    setCategories(updated);
  };

  const removeCategory = (catIdx: number) => {
    setCategories(categories.filter((_, i) => i !== catIdx));
  };

  const updateCategory = (catIdx: number, field: string, value: string) => {
    const updated = [...categories];
    (updated[catIdx] as any)[field] = value;
    setCategories(updated);
  };

  const updateItem = (catIdx: number, itemIdx: number, field: string, value: any) => {
    const updated = [...categories];
    (updated[catIdx].items[itemIdx] as any)[field] = value;
    setCategories(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCategories = categories.filter(
      (c) => c.name.trim() && c.items.some((i) => i.name.trim() && i.price > 0)
    );
    onSave({
      menu_data: validCategories,
      menu_link: menuLink,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Tu menú</h2>
        <p className="text-muted-foreground mt-1">
          Agrega tus productos para que ALICIA los conozca
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Link a tu carta (opcional)
        </label>
        <input
          type="url"
          value={menuLink}
          onChange={(e) => setMenuLink(e.target.value)}
          placeholder="https://drive.google.com/tu-menu.pdf"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          ALICIA puede enviar este link a los clientes
        </p>
      </div>

      <div className="border-t border-border/50 pt-4">
        <h3 className="font-semibold text-foreground mb-3">Categorías y productos</h3>

        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="mb-6 p-4 bg-card/50 border border-border/50 rounded-xl">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(catIdx, "name", e.target.value)}
                placeholder="Ej: Pizzas, Bebidas, Entradas..."
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCategory(catIdx)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(catIdx, itemIdx, "name", e.target.value)}
                  placeholder="Producto"
                  className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  value={item.price || ""}
                  onChange={(e) => updateItem(catIdx, itemIdx, "price", Number(e.target.value))}
                  placeholder="Precio"
                  className="w-28 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => updateItem(catIdx, itemIdx, "is_recommended", !item.is_recommended)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.is_recommended
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  title="Marcar como recomendado"
                >
                  <Star className="w-4 h-4" fill={item.is_recommended ? "currentColor" : "none"} />
                </button>
                {cat.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(catIdx, itemIdx)}
                    className="p-2 text-destructive/60 hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => addItem(catIdx)}
              className="flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              <Plus className="w-3 h-3" /> Agregar producto
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addCategory}
          className="w-full py-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          + Nueva categoría
        </button>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
          >
            ← Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Siguiente →"}
        </button>
      </div>
    </form>
  );
};

export default Step2Menu;
