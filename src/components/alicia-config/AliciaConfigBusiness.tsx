import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
    <Card>
      <CardHeader><CardTitle>Tu Negocio</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Nombre del negocio</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Mi Restaurante" /></div>
        <div><Label>Historia / Descripción</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Cuenta la historia de tu negocio..." rows={4} /></div>
        <div><Label>Dirección principal</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle 44 #5-20, Ciudad" /></div>
        <div><Label>Detalles de ubicación (sedes, referencias)</Label><Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Estamos en el centro comercial..." rows={2} /></div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
