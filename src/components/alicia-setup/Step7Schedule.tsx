import React, { useState } from "react";
import { Clock, Rocket } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const DAYS = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
  { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: `${h}:00`, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? "AM" : "PM"}` };
});

const Step7Schedule = ({ data, onSave, saving, onBack }: Props) => {
  const hours = data.operating_hours || {};
  const times = data.time_estimates || {};

  const [openTime, setOpenTime] = useState(hours.open_time || "15:00");
  const [closeTime, setCloseTime] = useState(hours.close_time || "23:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(
    hours.days || DAYS.map((d) => d.key)
  );
  const [acceptPreOrders, setAcceptPreOrders] = useState(hours.accept_pre_orders ?? true);
  const [prepStart, setPrepStart] = useState(hours.preparation_start || "15:30");
  const [preOrderMsg, setPreOrderMsg] = useState(
    hours.pre_order_message || "Podemos tomar tu pedido ahora, pero empezamos a preparar más tarde"
  );
  const [peakHours, setPeakHours] = useState(hours.peak_hours || "");
  const [weekday, setWeekday] = useState(times.weekday || "");
  const [weekend, setWeekend] = useState(times.weekend || "");
  const [peak, setPeak] = useState(times.peak || "");

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      operating_hours: {
        open_time: openTime,
        close_time: closeTime,
        days: selectedDays,
        accept_pre_orders: acceptPreOrders,
        preparation_start: acceptPreOrders ? prepStart : null,
        pre_order_message: acceptPreOrders ? preOrderMsg : null,
        peak_hours: peakHours,
        may_extend: true,
        schedule: `${selectedDays.length === 7 ? "Todos los días" : selectedDays.join(", ")} ${openTime} - ${closeTime}`,
      },
      time_estimates: { weekday, weekend, peak, delivery_travel: times.delivery_travel || "" },
    });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const smallInput =
    "w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Horarios y tiempos</h2>
        <p className="text-muted-foreground mt-1">Último paso — ¡ya casi!</p>
      </div>

      {/* Days of operation */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">Días de operación</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDay(d.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedDays.includes(d.key)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Open / Close time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Hora de apertura</label>
          <select value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass}>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Hora de cierre</label>
          <select value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass}>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pre-orders */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptPreOrders}
            onChange={(e) => setAcceptPreOrders(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
          />
          <span className="text-sm text-foreground/80">¿Tomar pedidos antes de abrir?</span>
        </label>

        {acceptPreOrders && (
          <div className="space-y-3 pl-8">
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">
                ¿A qué hora empiezan a preparar?
              </label>
              <select value={prepStart} onChange={(e) => setPrepStart(e.target.value)} className={smallInput}>
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/80 mb-1">
                Mensaje al cliente si pide antes de abrir
              </label>
              <input
                type="text"
                value={preOrderMsg}
                onChange={(e) => setPreOrderMsg(e.target.value)}
                placeholder="Ej: Tomamos tu pedido pero preparamos desde las 3:30 pm"
                className={smallInput}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">Horas pico (mayor demanda)</label>
        <input
          type="text"
          value={peakHours}
          onChange={(e) => setPeakHours(e.target.value)}
          placeholder="Ej: Viernes y Sábado 7-10PM"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Entre semana</label>
          <input type="text" value={weekday} onChange={(e) => setWeekday(e.target.value)} placeholder="~15min" className={smallInput} />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Fin de semana</label>
          <input type="text" value={weekend} onChange={(e) => setWeekend(e.target.value)} placeholder="~20min" className={smallInput} />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Hora pico</label>
          <input type="text" value={peak} onChange={(e) => setPeak(e.target.value)} placeholder="~30min" className={smallInput} />
        </div>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all">
            ← Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-4 rounded-xl font-bold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Rocket className="w-5 h-5" />
          {saving ? "Activando..." : "¡Activar ALICIA!"}
        </button>
      </div>
    </form>
  );
};

export default Step7Schedule;
