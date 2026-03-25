import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Props {
  config: any;
  onSave: (fields: Record<string, any>) => Promise<void>;
}

const ALL_DAYS = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

const PEAK_DAY_OPTIONS = [
  { key: "Lunes", label: "Lun" },
  { key: "Martes", label: "Mar" },
  { key: "Miercoles", label: "Mié" },
  { key: "Jueves", label: "Jue" },
  { key: "Viernes", label: "Vie" },
  { key: "Sabado", label: "Sáb" },
  { key: "Domingo", label: "Dom" },
];

const DaySelector = ({
  days,
  options,
  onToggle,
}: {
  days: string[];
  options: { key: string; label: string }[];
  onToggle: (key: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((d) => (
      <button
        key={d.key}
        type="button"
        onClick={() => onToggle(d.key)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          days.includes(d.key)
            ? "bg-gradient-to-r from-teal-500 to-orange-400 text-white shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-accent"
        }`}
      >
        {d.label}
      </button>
    ))}
  </div>
);

export default function AliciaConfigSchedule({ config, onSave }: Props) {
  const h = config.operating_hours || {};

  const [openTime, setOpenTime] = useState(h.open_time || "");
  const [closeTime, setCloseTime] = useState(h.close_time || "");
  const [preOrders, setPreOrders] = useState(h.accept_pre_orders ?? false);
  const [mayExtend, setMayExtend] = useState(h.may_extend ?? false);
  const [extendedDays, setExtendedDays] = useState<string[]>(h.extended_days || []);
  const [extendedOpenTime, setExtendedOpenTime] = useState(h.extended_open_time || "");
  const [extendedCloseTime, setExtendedCloseTime] = useState(h.extended_close_time || "");
  const [extendedScheduleStart, setExtendedScheduleStart] = useState(h.extended_schedule_start || "");
  const [extendedScheduleEnd, setExtendedScheduleEnd] = useState(h.extended_schedule_end || "");
  const [preMsg, setPreMsg] = useState(h.pre_order_message || "");
  const [weekday, setWeekday] = useState(h.weekday_waiting_time || "");
  const [weekend, setWeekend] = useState(h.weekend_waiting_time || "");
  const [peakTime, setPeakTime] = useState(h.peak_waiting_time || "");

  const [days, setDays] = useState<string[]>(h.days || ALL_DAYS.map((d) => d.key));
  const [scheduleStart, setScheduleStart] = useState(h.schedule_start || "");
  const [scheduleEnd, setScheduleEnd] = useState(h.schedule_end || "");
  const [timezone, setTimezone] = useState(h.timezone || "UTC-5");
  const [peakDays, setPeakDays] = useState<string[]>(h.peak_days || []);
  const [peakHourStart, setPeakHourStart] = useState(h.peak_hour_start || "");
  const [peakHourEnd, setPeakHourEnd] = useState(h.peak_hour_end || "");
  const [deliveryTravel, setDeliveryTravel] = useState(h.delivery_travel || "");

  const [saving, setSaving] = useState(false);

  const toggleDay = (key: string) =>
    setDays((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));

  const togglePeakDay = (key: string) =>
    setPeakDays((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      operating_hours: {
        ...h,
        days,
        open_time: openTime,
        close_time: closeTime,
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
        timezone,
        accept_pre_orders: preOrders,
        pre_order_message: preMsg,
        may_extend: mayExtend,
        peak_days: peakDays,
        peak_hour_start: peakHourStart,
        peak_hour_end: peakHourEnd,
        weekday_waiting_time: weekday,
        weekend_waiting_time: weekend,
        peak_waiting_time: peakTime,
        delivery_travel: deliveryTravel,
      },
    });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Horarios</h3>
          <p className="text-xs text-white/80">Configura cuándo y cómo atiendes</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Días de servicio</label>
          <DaySelector days={days} options={ALL_DAYS} onToggle={toggleDay} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Horario de apertura y cierre</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Abrimos a las</label>
              <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="border-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Cerramos a las</label>
              <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="border-border" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Inicio y fin de atención a clientes</label>
          <p className="text-xs text-muted-foreground mb-2">¿Cuándo empieza y termina realmente la atención, aunque el local ya esté abierto?</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Inicio de atención</label>
              <Input type="time" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="border-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fin de atención</label>
              <Input type="time" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="border-border" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Zona horaria</label>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC-5" className="border-border max-w-[200px]" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
            <Switch checked={preOrders} onCheckedChange={setPreOrders} />
            <label className="text-sm text-foreground">¿Aceptas pedidos antes de abrir?</label>
          </div>
          {preOrders && (
            <div className="pl-4">
              <label className="block text-xs text-muted-foreground mb-1">¿Qué le dice Alicia al cliente?</label>
              <Input value={preMsg} onChange={(e) => setPreMsg(e.target.value)} placeholder="Recibimos tu pedido, empezamos a preparar a las..." className="border-border" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
          <Switch checked={mayExtend} onCheckedChange={setMayExtend} />
          <label className="text-sm text-foreground">Opciones de horario extendido</label>
        </div>

        {mayExtend && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/30">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Días con horario extendido</label>
              <DaySelector days={extendedDays} options={ALL_DAYS} onToggle={(key) => setExtendedDays((prev) => prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key])} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Horario de apertura y cierre extendido</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Abrimos a las</label>
                  <Input type="time" value={extendedOpenTime} onChange={(e) => setExtendedOpenTime(e.target.value)} className="border-border" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Cerramos a las</label>
                  <Input type="time" value={extendedCloseTime} onChange={(e) => setExtendedCloseTime(e.target.value)} className="border-border" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Inicio y fin de atención extendido</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Inicio de atención</label>
                  <Input type="time" value={extendedScheduleStart} onChange={(e) => setExtendedScheduleStart(e.target.value)} className="border-border" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Fin de atención</label>
                  <Input type="time" value={extendedScheduleEnd} onChange={(e) => setExtendedScheduleEnd(e.target.value)} className="border-border" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Días pico (mayor demanda)</label>
          <DaySelector days={peakDays} options={PEAK_DAY_OPTIONS} onToggle={togglePeakDay} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Horario pico</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Inicia</label>
              <Input type="time" value={peakHourStart} onChange={(e) => setPeakHourStart(e.target.value)} className="border-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Termina</label>
              <Input type="time" value={peakHourEnd} onChange={(e) => setPeakHourEnd(e.target.value)} className="border-border" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tiempos estimados de preparación</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Entre semana</label>
              <Input value={weekday} onChange={(e) => setWeekday(e.target.value)} placeholder="~15min" className="border-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fin de semana</label>
              <Input value={weekend} onChange={(e) => setWeekend(e.target.value)} placeholder="~20min" className="border-border" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Hora pico</label>
              <Input value={peakTime} onChange={(e) => setPeakTime(e.target.value)} placeholder="~30min" className="border-border" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tiempo estimado de domicilio</label>
          <p className="text-xs text-muted-foreground mb-2">Informativo para Alicia cuando un cliente pregunte por tiempos de entrega</p>
          <Input value={deliveryTravel} onChange={(e) => setDeliveryTravel(e.target.value)} placeholder="~25min" className="border-border max-w-[200px]" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}