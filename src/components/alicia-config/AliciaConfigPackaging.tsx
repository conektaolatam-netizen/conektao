import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Package } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigPackaging({ config, onSave }: Props) {
  const [rules, setRules] = useState<{ type: string; cost: number }[]>(config.packaging_rules || []);
  const [saving, setSaving] = useState(false);

  const addRule = () => setRules([...rules, { type: "", cost: 0 }]);
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: string, value: any) => {
    const updated = [...rules];
    (updated[i] as any)[field] = field === "cost" ? Number(value) : value;
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("packaging_rules", rules.filter(r => r.type));
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Package className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Empaques</h3><p className="text-xs text-white/80">¿Cobras empaque para domicilio o llevar?</p></div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-500">Define los costos de empaque por tipo de producto</p>
        {rules.map((r, i) => (
          <div key={i} className="flex gap-2 items-end bg-gray-50 rounded-lg p-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Tipo de producto</label>
              <Input value={r.type} onChange={e => updateRule(i, "type", e.target.value)} placeholder="Pizza, Pasta, Bebida..." className="border-gray-200 bg-white" />
            </div>
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">Costo ($)</label>
              <Input type="number" value={r.cost} onChange={e => updateRule(i, "cost", e.target.value)} className="border-gray-200 bg-white" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeRule(i)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addRule} className="gap-1 border-dashed border-gray-300 text-gray-500">
          <Plus className="h-4 w-4" />Agregar regla de empaque
        </Button>
        <div>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
