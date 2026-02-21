import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Props { config: any; onSave: (fields: Record<string, any>) => Promise<void>; }

export default function AliciaConfigSchedule({ config, onSave }: Props) {
  const h = config.operating_hours || {};
  const t = config.time_estimates || {};
  const [openTime, setOpenTime] = useState(h.open_time || "");
  const [closeTime, setCloseTime] = useState(h.close_time || "");
  const [preOrders, setPreOrders] = useState(h.accept_pre_orders ?? false);
  const [mayExtend, setMayExtend] = useState(h.may_extend ?? false);
  const [preMsg, setPreMsg] = useState(h.pre_order_message || "");
  const [weekday, setWeekday] = useState(t.weekday || "");
  const [weekend, setWeekend] = useState(t.weekend || "");
  const [peakTime, setPeakTime] = useState(t.peak || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      operating_hours: { ...h, open_time: openTime, close_time: closeTime, accept_pre_orders: preOrders, may_extend: mayExtend, pre_order_message: preMsg },
      time_estimates: { weekday, weekend, peak: peakTime },
    });
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Clock className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Horarios</h3><p className="text-xs text-white/80">¿Cuándo atiendes?</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Horario de atención</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Abrimos a las</label>
              <Input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cerramos a las</label>
              <Input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="border-gray-200" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <Switch checked={preOrders} onCheckedChange={setPreOrders} />
            <label className="text-sm text-gray-700">¿Aceptas pedidos antes de abrir?</label>
          </div>
          {preOrders && (
            <div className="pl-4">
              <label className="block text-xs text-gray-500 mb-1">¿Qué le dice Alicia al cliente?</label>
              <Input value={preMsg} onChange={e => setPreMsg(e.target.value)} placeholder="Recibimos tu pedido, empezamos a preparar a las..." className="border-gray-200" />
            </div>
          )}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <Switch checked={mayExtend} onCheckedChange={setMayExtend} />
            <label className="text-sm text-gray-700">¿A veces se extienden del horario?</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tiempos estimados de preparación</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Entre semana</label>
              <Input value={weekday} onChange={e => setWeekday(e.target.value)} placeholder="~15min" className="border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin de semana</label>
              <Input value={weekend} onChange={e => setWeekend(e.target.value)} placeholder="~20min" className="border-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora pico</label>
              <Input value={peakTime} onChange={e => setPeakTime(e.target.value)} placeholder="~30min" className="border-gray-200" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
