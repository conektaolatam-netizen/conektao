import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wifi } from "lucide-react";

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
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Wifi className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Conexión WhatsApp</h3><p className="text-xs text-white/80">Datos técnicos de tu conexión</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Estos datos son técnicos. Solo modifícalos si sabes lo que haces o con soporte de Conektao.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID (Meta)</label>
          <Input value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="942285825640689" className="border-gray-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access Token (Meta)</label>
          <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="EAF..." className="border-gray-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID</label>
          <Input value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="1203273002014817" className="border-gray-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email para recibir pedidos</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="pedidos@minegocio.com" className="border-gray-200" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
