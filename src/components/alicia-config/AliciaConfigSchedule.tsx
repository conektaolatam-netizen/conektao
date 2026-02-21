import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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
    <Card>
      <CardHeader><CardTitle>Horarios y Tiempos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Apertura</Label><Input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} /></div>
          <div><Label>Cierre</Label><Input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3"><Switch checked={preOrders} onCheckedChange={setPreOrders} /><Label>Aceptar pre-pedidos (antes de abrir)</Label></div>
        {preOrders && <div><Label>Mensaje de pre-pedido</Label><Input value={preMsg} onChange={e => setPreMsg(e.target.value)} placeholder="Empezamos a preparar a las..." /></div>}
        <div className="flex items-center gap-3"><Switch checked={mayExtend} onCheckedChange={setMayExtend} /><Label>A veces nos extendemos del horario</Label></div>
        <h4 className="font-medium text-sm pt-2">Tiempos estimados de preparación</h4>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Semana</Label><Input value={weekday} onChange={e => setWeekday(e.target.value)} placeholder="~15min" /></div>
          <div><Label>Finde</Label><Input value={weekend} onChange={e => setWeekend(e.target.value)} placeholder="~20min" /></div>
          <div><Label>Hora pico</Label><Input value={peakTime} onChange={e => setPeakTime(e.target.value)} placeholder="~30min" /></div>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
