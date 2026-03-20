import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, Settings2 } from "lucide-react";

interface ReservationConfig {
  enabled: boolean;
  max_per_slot: number;
  slot_duration_minutes: number;
  max_party_size: number;
  min_advance_hours: number;
  max_advance_days: number;
  available_days: number[]; // 0=Sun, 1=Mon...6=Sat
  available_hours: { start: string; end: string };
  blocked_dates: string[];
  confirmation_message: string;
  slot_full_message: string;
}

const DEFAULT_CONFIG: ReservationConfig = {
  enabled: false,
  max_per_slot: 4,
  slot_duration_minutes: 30,
  max_party_size: 12,
  min_advance_hours: 2,
  max_advance_days: 30,
  available_days: [1, 2, 3, 4, 5, 6], // Mon-Sat
  available_hours: { start: "12:00", end: "21:00" },
  blocked_dates: [],
  confirmation_message: "¡Tu reserva ha sido confirmada! Te esperamos 🎉",
  slot_full_message: "Lo siento, ese horario ya está completo. ¿Te gustaría reservar en otro horario?",
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Props {
  config: any;
  onSave: (field: string, value: any) => Promise<void>;
}

export default function AliciaConfigReservations({ config, onSave }: Props) {
  const [resConfig, setResConfig] = useState<ReservationConfig>(() => {
    const saved = config?.reservation_config;
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      return { ...DEFAULT_CONFIG, ...saved };
    }
    return { ...DEFAULT_CONFIG };
  });

  const [saving, setSaving] = useState(false);

  // Load reservations for selected date
  useEffect(() => {
    loadReservations();
  }, [selectedDate, config?.restaurant_id]);

  async function loadReservations() {
    if (!config?.restaurant_id) return;
    setLoadingReservations(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", config.restaurant_id)
        .eq("reservation_date", selectedDate)
        .order("reservation_time", { ascending: true });

      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (err) {
      console.error("Error loading reservations:", err);
    } finally {
      setLoadingReservations(false);
    }
  }

  function updateConfig(partial: Partial<ReservationConfig>) {
    setResConfig(prev => ({ ...prev, ...partial }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave("reservation_config", resConfig);
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: number) {
    const days = resConfig.available_days.includes(day)
      ? resConfig.available_days.filter(d => d !== day)
      : [...resConfig.available_days, day].sort();
    updateConfig({ available_days: days });
  }

  async function updateReservationStatus(id: string, status: string) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
    if (status === "cancelled") updateData.cancelled_at = new Date().toISOString();

    const { error } = await supabase.from("reservations").update(updateData).eq("id", id);
    if (error) {
      toast.error("Error actualizando reserva");
      console.error(error);
    } else {
      toast.success(status === "confirmed" ? "Reserva confirmada ✅" : status === "cancelled" ? "Reserva cancelada" : "Estado actualizado");
      loadReservations();
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendiente", variant: "outline" },
      confirmed: { label: "Confirmada", variant: "default" },
      cancelled: { label: "Cancelada", variant: "destructive" },
      completed: { label: "Completada", variant: "secondary" },
      no_show: { label: "No asistió", variant: "destructive" },
    };
    const info = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const confirmedCount = reservations.filter(r => r.status === "confirmed").length;
  const pendingCount = reservations.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-teal-400" />
          Reservas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configura cómo Alicia gestiona las reservas por WhatsApp
        </p>
      </div>

      {/* Enable toggle */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Activar reservas</p>
            <p className="text-sm text-muted-foreground">Alicia podrá recibir y gestionar reservas por WhatsApp</p>
          </div>
          <Switch
            checked={resConfig.enabled}
            onCheckedChange={(v) => updateConfig({ enabled: v })}
          />
        </div>
      </Card>

      {resConfig.enabled && (
        <>
          {/* Limits & Capacity */}
          <Card className="p-4 bg-card border-border space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Capacidad y límites
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Máximo reservas por slot</Label>
                <Input
                  type="number" min={1} max={50}
                  value={resConfig.max_per_slot}
                  onChange={e => updateConfig({ max_per_slot: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Duración del slot (minutos)</Label>
                <Select
                  value={String(resConfig.slot_duration_minutes)}
                  onValueChange={v => updateConfig({ slot_duration_minutes: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Máximo personas por mesa</Label>
                <Input
                  type="number" min={1} max={50}
                  value={resConfig.max_party_size}
                  onChange={e => updateConfig({ max_party_size: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Anticipación mínima (horas)</Label>
                <Input
                  type="number" min={0} max={72}
                  value={resConfig.min_advance_hours}
                  onChange={e => updateConfig({ min_advance_hours: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Máximo días de anticipación</Label>
                <Input
                  type="number" min={1} max={90}
                  value={resConfig.max_advance_days}
                  onChange={e => updateConfig({ max_advance_days: parseInt(e.target.value) || 7 })}
                />
              </div>
            </div>
          </Card>

          {/* Available days */}
          <Card className="p-4 bg-card border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Días y horarios de reserva
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    resConfig.available_days.includes(i)
                      ? "bg-teal-500/20 text-teal-400 border border-teal-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hora inicio reservas</Label>
                <Input
                  type="time"
                  value={resConfig.available_hours.start}
                  onChange={e => updateConfig({ available_hours: { ...resConfig.available_hours, start: e.target.value } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hora fin reservas</Label>
                <Input
                  type="time"
                  value={resConfig.available_hours.end}
                  onChange={e => updateConfig({ available_hours: { ...resConfig.available_hours, end: e.target.value } })}
                />
              </div>
            </div>
          </Card>

          {/* Confirmation message */}
          <Card className="p-4 bg-card border-border space-y-3">
            <Label className="text-xs text-muted-foreground">Mensaje de confirmación (WhatsApp)</Label>
            <Input
              value={resConfig.confirmation_message}
              onChange={e => updateConfig({ confirmation_message: e.target.value })}
              placeholder="¡Tu reserva ha sido confirmada! Te esperamos 🎉"
            />
          </Card>

          {/* Slot full message */}
          <Card className="p-4 bg-card border-border space-y-3">
            <Label className="text-xs text-muted-foreground">Mensaje cuando el horario está lleno</Label>
            <Textarea
              value={resConfig.slot_full_message}
              onChange={e => updateConfig({ slot_full_message: e.target.value })}
              placeholder="Lo siento, ese horario ya está completo. ¿Te gustaría reservar en otro horario?"
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <p className="text-[11px] text-muted-foreground">
              Se envía directamente al cliente cuando intenta reservar en un horario sin disponibilidad.
            </p>
          </Card>

        </>
      )}

      {/* Save button — always visible */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white"
      >
        {saving ? "Guardando..." : "Guardar configuración de reservas"}
      </Button>
    </div>
  );
}
