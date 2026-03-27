import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

interface Props { config: any; onSave: (fields: Record<string, any>) => Promise<void>; }

export default function AliciaConfigBusiness({ config, onSave }: Props) {
  const [name, setName] = useState(config.restaurant_name || "");
  const [desc, setDesc] = useState(config.restaurant_description || "");
  const [address, setAddress] = useState(config.location_address || "");
  const [details, setDetails] = useState(config.location_details || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ restaurant_name: name, restaurant_description: desc, location_address: address, location_details: details });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Store className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Tu Negocio</h3><p className="text-xs text-white/80">Cuéntale a Alicia sobre tu negocio</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿Cómo se llama tu negocio?</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Mi Restaurante" className="border-border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cuéntanos la historia de tu negocio</label>
          <p className="text-xs text-muted-foreground mb-1">Alicia usará esto para conectar con tus clientes</p>
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Somos un restaurante familiar que..." rows={3} className="border-border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿Dónde están ubicados?</label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle 44 #5-20, Ciudad" className="border-border" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}