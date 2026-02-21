import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { config: any; onSave: (fields: Record<string, any>) => Promise<void>; }

export default function AliciaConfigConnection({ config, onSave }: Props) {
  const [phoneId, setPhoneId] = useState(config.whatsapp_phone_number_id || "");
  const [token, setToken] = useState(config.whatsapp_access_token || "");
  const [email, setEmail] = useState(config.order_email || "");
  const [wabaId, setWabaId] = useState(config.waba_id || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ whatsapp_phone_number_id: phoneId, whatsapp_access_token: token, order_email: email, waba_id: wabaId });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Conexión WhatsApp</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">Estos datos son técnicos. Solo modifícalos si sabes lo que haces o con soporte de Conektao.</p>
        </div>
        <div><Label>Phone Number ID (Meta)</Label><Input value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="942285825640689" /></div>
        <div><Label>Access Token (Meta)</Label><Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="EAF..." /></div>
        <div><Label>WABA ID</Label><Input value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="1203273002014817" /></div>
        <div><Label>Email para recibir pedidos</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="pedidos@minegocio.com" /></div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
