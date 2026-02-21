import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

const ALL_METHODS = ["efectivo", "transferencia", "nequi", "daviplata", "datafono"];

export default function AliciaConfigPayments({ config, onSave }: Props) {
  const pc = config.payment_config || {};
  const [methods, setMethods] = useState<string[]>(pc.methods || ["efectivo"]);
  const [bankDetails, setBankDetails] = useState(pc.bank_details || "");
  const [requireProof, setRequireProof] = useState(pc.require_proof ?? true);
  const [deliveryTerminal, setDeliveryTerminal] = useState<string>(pc.delivery_card_terminal || "no");
  const [saving, setSaving] = useState(false);

  const toggleMethod = (m: string) => {
    setMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("payment_config", { methods, bank_details: bankDetails, require_proof: requireProof, delivery_card_terminal: deliveryTerminal });
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><CreditCard className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Métodos de Pago</h3><p className="text-xs text-white/80">¿Cómo pueden pagarte tus clientes?</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué métodos de pago aceptas?</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_METHODS.map(m => (
              <label key={m} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2.5 rounded-lg border transition-all ${
                methods.includes(m) ? "border-teal-300 bg-teal-50 text-teal-800" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}>
                <Checkbox checked={methods.includes(m)} onCheckedChange={() => toggleMethod(m)} />
                <span className="capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {methods.includes("transferencia") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datos bancarios para transferencias</label>
            <Input value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="Bancolombia Ahorros 123-456..." className="border-gray-200" />
          </div>
        )}

        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <Switch checked={requireProof} onCheckedChange={setRequireProof} />
          <label className="text-sm text-gray-700">¿Pedir comprobante de transferencia?</label>
        </div>

        {methods.includes("datafono") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Puedes llevar datáfono a domicilio?</label>
            <div className="space-y-2">
              {[
                { value: "yes", label: "Sí, siempre" },
                { value: "sometimes", label: "A veces (Alicia confirma disponibilidad)" },
                { value: "no", label: "No, solo en el local" },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  deliveryTerminal === opt.value ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:bg-gray-50"
                }`}>
                  <input type="radio" name="delivery_terminal" value={opt.value} checked={deliveryTerminal === opt.value} onChange={() => setDeliveryTerminal(opt.value)} className="accent-teal-500" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
