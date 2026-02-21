import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Lightbulb } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

interface UpsellRule { trigger: string; suggestion: string; }

export default function AliciaConfigUpselling({ config, onSave }: Props) {
  const sr = config.sales_rules || {};
  const [enabled, setEnabled] = useState(sr.enabled ?? false);
  const [maxPerOrder, setMaxPerOrder] = useState<string>((sr.max_per_order || 1).toString());
  const [rules, setRules] = useState<UpsellRule[]>(sr.rules || []);
  const [saving, setSaving] = useState(false);

  const addRule = () => setRules([...rules, { trigger: "", suggestion: "" }]);
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: keyof UpsellRule, value: string) => {
    const updated = [...rules];
    updated[i] = { ...updated[i], [field]: value };
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("sales_rules", { enabled, max_per_order: Number(maxPerOrder), rules: rules.filter(r => r.trigger && r.suggestion) });
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Lightbulb className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Sugerencias Inteligentes</h3><p className="text-xs text-white/80">Alicia sugiere productos extras para subir el ticket</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <label className="text-sm text-gray-700 font-medium">¿Quieres que Alicia sugiera algo extra en cada pedido?</label>
        </div>

        {enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de sugerencias por pedido</label>
              <Select value={maxPerOrder} onValueChange={setMaxPerOrder}>
                <SelectTrigger className="w-32 border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 sugerencia</SelectItem>
                  <SelectItem value="2">2 sugerencias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reglas de sugerencia</label>
              <p className="text-xs text-gray-400 mb-3">Ej: "Si pide pizza sola" → "sugerir una bebida o entrada"</p>
              
              {rules.map((r, i) => (
                <div key={i} className="flex gap-2 items-start mb-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Si el cliente pide...</label>
                      <Input value={r.trigger} onChange={e => updateRule(i, "trigger", e.target.value)} placeholder="Pizza sola" className="border-gray-200 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Alicia sugiere...</label>
                      <Input value={r.suggestion} onChange={e => updateRule(i, "suggestion", e.target.value)} placeholder="Una bebida o entrada" className="border-gray-200 bg-white" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeRule(i)} className="text-gray-400 hover:text-red-500 mt-5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addRule} className="gap-1 border-dashed border-gray-300 text-gray-500">
                <Plus className="h-4 w-4" />Agregar regla
              </Button>
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
