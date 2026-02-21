import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigSpecialInfo({ config, onSave }: Props) {
  const allRules: string[] = config.custom_rules || [];
  const existing = allRules.find(r => r.startsWith("[INFO_ESPECIAL]"))?.replace("[INFO_ESPECIAL] ", "") || "";
  const [info, setInfo] = useState(existing);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const otherRules = allRules.filter(r => !r.startsWith("[INFO_ESPECIAL]"));
    const newRules = info.trim() ? [...otherRules, `[INFO_ESPECIAL] ${info.trim()}`] : otherRules;
    await onSave("custom_rules", newRules);
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Info className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Información Especial</h3><p className="text-xs text-white/80">Algo más que Alicia deba saber</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Hay algo más que Alicia deba saber de tu negocio?</label>
          <p className="text-xs text-gray-400 mb-2">Ejemplos: "Tenemos dos sedes", "No vendemos alcohol", "Solo abrimos fines de semana", "Tenemos carta secreta para clientes VIP"</p>
          <Textarea 
            value={info} 
            onChange={e => setInfo(e.target.value)} 
            placeholder="Escribe aquí cualquier información importante..." 
            rows={5} 
            maxLength={500}
            className="border-gray-200" 
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{info.length}/500</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
