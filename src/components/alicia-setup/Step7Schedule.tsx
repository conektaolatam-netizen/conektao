import React, { useState } from "react";
import { Clock, Rocket } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const Step7Schedule = ({ data, onSave, saving, onBack }: Props) => {
  const hours = data.operating_hours || {};
  const times = data.time_estimates || {};
  const [schedule, setSchedule] = useState(hours.schedule || "");
  const [peakHours, setPeakHours] = useState(hours.peak_hours || "");
  const [weekday, setWeekday] = useState(times.weekday || "");
  const [weekend, setWeekend] = useState(times.weekend || "");
  const [peak, setPeak] = useState(times.peak || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      operating_hours: { schedule, peak_hours: peakHours },
      time_estimates: { weekday, weekend, peak, delivery_travel: times.delivery_travel || "" },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Horarios y tiempos</h2>
        <p className="text-muted-foreground mt-1">Último paso — ¡ya casi!</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Horario de operación
        </label>
        <input
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="Ej: Lunes a Domingo 12pm - 10pm"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Horas pico (mayor demanda)
        </label>
        <input
          type="text"
          value={peakHours}
          onChange={(e) => setPeakHours(e.target.value)}
          placeholder="Ej: Viernes y Sábado 7-10PM"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Entre semana</label>
          <input
            type="text"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
            placeholder="~15min"
            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Fin de semana</label>
          <input
            type="text"
            value={weekend}
            onChange={(e) => setWeekend(e.target.value)}
            placeholder="~20min"
            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">Hora pico</label>
          <input
            type="text"
            value={peak}
            onChange={(e) => setPeak(e.target.value)}
            placeholder="~30min"
            className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
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
