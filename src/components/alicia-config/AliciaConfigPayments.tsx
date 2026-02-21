import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

const ALL_METHODS = ["efectivo", "transferencia", "nequi", "daviplata", "datafono"];

export default function AliciaConfigPayments({ config, onSave }: Props) {
  const pc = config.payment_config || {};
  const [methods, setMethods] = useState<string[]>(pc.methods || ["efectivo"]);
  const [bankDetails, setBankDetails] = useState(pc.bank_details || "");
  const [requireProof, setRequireProof] = useState(pc.require_proof ?? true);
  const [saving, setSaving] = useState(false);

  const toggleMethod = (m: string) => {
    setMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("payment_config", { methods, bank_details: bankDetails, require_proof: requireProof });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Métodos de Pago</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Métodos aceptados</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {ALL_METHODS.map(m => (
              <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={methods.includes(m)} onCheckedChange={() => toggleMethod(m)} />
                <span className="capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>
        <div><Label>Datos bancarios (para transferencias)</Label><Input value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="Bancolombia Ahorros 123-456..." /></div>
        <div className="flex items-center gap-3">
          <Switch checked={requireProof} onCheckedChange={setRequireProof} />
          <Label>Pedir comprobante de transferencia</Label>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
