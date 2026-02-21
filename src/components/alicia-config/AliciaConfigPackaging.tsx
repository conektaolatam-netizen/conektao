import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

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
    <Card>
      <CardHeader><CardTitle>Empaques</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Define los costos de empaque para domicilio y llevar</p>
        {rules.map((r, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1"><Label>Tipo</Label><Input value={r.type} onChange={e => updateRule(i, "type", e.target.value)} placeholder="Pizza, Pasta, Bebida..." /></div>
            <div className="w-32"><Label>Costo ($)</Label><Input type="number" value={r.cost} onChange={e => updateRule(i, "cost", e.target.value)} /></div>
            <Button variant="ghost" size="icon" onClick={() => removeRule(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={addRule} className="gap-1"><Plus className="h-4 w-4" />Agregar regla</Button>
        <div><Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></div>
      </CardContent>
    </Card>
  );
}
