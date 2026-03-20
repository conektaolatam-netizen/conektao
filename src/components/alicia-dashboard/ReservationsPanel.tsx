import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays, Users, Phone, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, RotateCcw,
} from "lucide-react";

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  notes: string | null;
  source: string;
}

export default function ReservationsPanel({ restaurantId }: { restaurantId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [selectedDate, restaurantId]);

  async function loadReservations() {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", selectedDate)
        .order("reservation_time", { ascending: true });
      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (err) {
      console.error("Error loading reservations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();
    if (status === "cancelled") updateData.cancelled_at = new Date().toISOString();

    const { error } = await supabase.from("reservations").update(updateData).eq("id", id);
    if (error) {
      toast.error("Error actualizando reserva");
    } else {
      toast.success(
        status === "confirmed" ? "Reserva confirmada ✅" :
        status === "cancelled" ? "Reserva cancelada" :
        status === "completed" ? "Marcada como completada" :
        status === "no_show" ? "Marcada como no asistió" :
        "Estado actualizado"
      );
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-teal-400" />
          Reservas del día
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[120px] text-center">
            {format(parseISO(selectedDate), "EEE d MMM", { locale: es })}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {confirmedCount} confirmadas
        </div>
        <div className="flex items-center gap-1.5 text-xs text-yellow-400">
          <AlertCircle className="h-3.5 w-3.5" /> {pendingCount} pendientes
        </div>
      </div>

      {/* Reservation list */}
      {loading ? (
        <div className="text-sm text-muted-foreground animate-pulse py-4">Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <Card className="p-6 bg-card border-border text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hay reservas para este día</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reservations.map(r => (
            <Card key={r.id} className="p-3 bg-card border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{r.reservation_time.slice(0, 5)}</span>
                    <span className="text-sm text-foreground truncate">{r.customer_name}</span>
                    {statusBadge(r.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.party_size} personas</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.customer_phone}</span>
                    {r.source !== "whatsapp" && <Badge variant="outline" className="text-[10px] px-1.5">{r.source}</Badge>}
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>}
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-900/20" onClick={() => updateStatus(r.id, "confirmed")}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => updateStatus(r.id, "cancelled")}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {r.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:bg-muted" onClick={() => updateStatus(r.id, "completed")}>
                        ✓ Asistió
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-yellow-400 hover:bg-yellow-900/20" onClick={() => updateStatus(r.id, "no_show")}>
                        No asistió
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => updateStatus(r.id, "cancelled")}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {(r.status === "completed" || r.status === "no_show" || r.status === "cancelled") && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-teal-400 hover:text-teal-300 hover:bg-teal-900/20" onClick={() => updateStatus(r.id, "confirmed")}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restablecer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
