import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, X } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigDelivery({ config, onSave }: Props) {
  const dc = config.delivery_config || {};
  const [enabled, setEnabled] = useState(dc.enabled ?? true);
  const [freeZones, setFreeZones] = useState<string[]>(dc.free_zones || []);
  const [paidNote, setPaidNote] = useState(dc.paid_delivery_note || "");
  const [radius, setRadius] = useState(dc.radius || "");
  const [deliveryCost, setDeliveryCost] = useState<string>(dc.delivery_cost?.toString() || "");
  const [newZone, setNewZone] = useState("");
  const [saving, setSaving] = useState(false);

  const addZone = () => { if (newZone.trim()) { setFreeZones([...freeZones, newZone.trim()]); setNewZone(""); } };
  const removeZone = (i: number) => setFreeZones(freeZones.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    await onSave("delivery_config", { 
      enabled, free_zones: freeZones, paid_delivery_note: paidNote, 
      radius, delivery_cost: deliveryCost ? Number(deliveryCost) : null,
      escalation_tag: "---CONSULTA_DOMICILIO---" 
    });
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Truck className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Domicilios</h3><p className="text-xs text-white/80">Configura cómo entregas a domicilio</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <label className="text-sm text-gray-700 font-medium">¿Haces domicilios?</label>
        </div>

        {enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuál es tu radio de domicilio?</label>
              <Input value={radius} onChange={e => setRadius(e.target.value)} placeholder="5 km / Toda la ciudad / Barrios cercanos" className="border-gray-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuánto cobras por domicilio? (si aplica)</label>
              <Input type="number" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} placeholder="0 = gratis" className="border-gray-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zonas con domicilio gratis</label>
              <div className="flex gap-2 mt-1">
                <Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="Nombre del barrio o conjunto" onKeyDown={e => e.key === "Enter" && addZone()} className="border-gray-200" />
                <Button variant="outline" onClick={addZone} className="border-gray-200">Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {freeZones.map((z, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 bg-teal-50 text-teal-700 border border-teal-200">
                    {z}<X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeZone(i)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué le dice Alicia al cliente si la zona tiene cobro?</label>
              <Input value={paidNote} onChange={e => setPaidNote(e.target.value)} placeholder="El domicilio se paga al domiciliario" className="border-gray-200" />
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
