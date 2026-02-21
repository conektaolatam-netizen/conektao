import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, X, Plus } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigStarProducts({ config, onSave }: Props) {
  const [products, setProducts] = useState<string[]>(config.promoted_products || []);
  const [newProduct, setNewProduct] = useState("");
  const [saving, setSaving] = useState(false);

  const add = () => { if (newProduct.trim() && !products.includes(newProduct.trim())) { setProducts([...products, newProduct.trim()]); setNewProduct(""); } };
  const remove = (i: number) => setProducts(products.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    await onSave("promoted_products", products);
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Star className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Productos Estrella</h3><p className="text-xs text-white/80">Alicia los impulsará en las conversaciones</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuáles son tus productos más vendidos o que quieres impulsar?</label>
          <p className="text-xs text-gray-400 mb-2">Alicia los sugerirá cuando el cliente no sepa qué pedir</p>
          <div className="flex gap-2">
            <Input value={newProduct} onChange={e => setNewProduct(e.target.value)} placeholder="Ej: Pizza Margarita, Combo Familiar..." onKeyDown={e => e.key === "Enter" && add()} className="border-gray-200" />
            <Button variant="outline" onClick={add} className="border-gray-200 gap-1"><Plus className="h-4 w-4" />Agregar</Button>
          </div>
        </div>

        {products.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {products.map((p, i) => (
              <Badge key={i} className="gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 px-3 py-1.5 text-sm">
                <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                {p}
                <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => remove(i)} />
              </Badge>
            ))}
          </div>
        )}

        {products.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Agrega tus productos estrella para que Alicia los promocione</p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
