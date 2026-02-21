import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigDelivery({ config, onSave }: Props) {
  const dc = config.delivery_config || {};
  const [enabled, setEnabled] = useState(dc.enabled ?? true);
  const [freeZones, setFreeZones] = useState<string[]>(dc.free_zones || []);
  const [paidNote, setPaidNote] = useState(dc.paid_delivery_note || "");
  const [newZone, setNewZone] = useState("");
  const [saving, setSaving] = useState(false);

  const addZone = () => { if (newZone.trim()) { setFreeZones([...freeZones, newZone.trim()]); setNewZone(""); } };
  const removeZone = (i: number) => setFreeZones(freeZones.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    await onSave("delivery_config", { enabled, free_zones: freeZones, paid_delivery_note: paidNote, escalation_tag: "---CONSULTA_DOMICILIO---" });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Domicilios</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <Label>Domicilios habilitados</Label>
        </div>
        {enabled && (
          <>
            <div>
              <Label>Zonas con domicilio gratis</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="Nombre del barrio/conjunto" onKeyDown={e => e.key === "Enter" && addZone()} />
                <Button variant="outline" onClick={addZone}>Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {freeZones.map((z, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">{z}<X className="h-3 w-3 cursor-pointer" onClick={() => removeZone(i)} /></Badge>
                ))}
              </div>
            </div>
            <div><Label>Nota para zonas con cobro</Label><Input value={paidNote} onChange={e => setPaidNote(e.target.value)} placeholder="El domicilio se paga al domiciliario" /></div>
          </>
        )}
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
