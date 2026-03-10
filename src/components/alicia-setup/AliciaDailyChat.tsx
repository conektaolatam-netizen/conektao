import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Override {
  id: string;
  instruction: string;
  type: string;
  created_at: string;
  expires: string;
  start_hour?: string;
  until_hour?: string;
  system_override_id?: string;
}

export default function AliciaDailyChat({ restaurantId }: { restaurantId: string }) {
  const [message, setMessage] = useState("");
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [sending, setSending] = useState(false);

  const fetchOverrides = async () => {
    const { data } = await supabase
      .from("whatsapp_configs")
      .select("daily_overrides, operating_hours")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (data?.daily_overrides) {
      const today = new Date().toISOString().split("T")[0];
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

      const all = (data.daily_overrides as unknown as Override[]);

      // Separate: expired (to remove) vs active (to keep)
      const stillValid: Override[] = [];
      const expired: Override[] = [];

      for (const o of all) {
        // Past day → expired
        if (o.expires && o.expires < today) {
          expired.push(o);
          continue;
        }
        // Today but until_hour already passed → expired
        if (o.until_hour && o.expires === today) {
          const [uh, um] = o.until_hour.split(":").map(Number);
          if (nowMinutes > uh * 60 + (um || 0)) {
            expired.push(o);
            continue;
          }
        }
        stillValid.push(o);
      }

      // Persist cleanup if stale entries removed
      if (expired.length > 0) {
        // Expire system_overrides for removed entries
        for (const r of expired) {
          if (r.system_override_id) {
            await supabase
              .from("system_overrides")
              .update({ end_time: new Date().toISOString() } as any)
              .eq("id", r.system_override_id);
          }
        }
        await supabase
          .from("whatsapp_configs")
          .update({ daily_overrides: stillValid } as any)
          .eq("restaurant_id", restaurantId);
      }

      setOverrides(stillValid);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchOverrides();
  }, [restaurantId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      const res = await supabase.functions.invoke("alicia-daily-override", {
        body: { restaurant_id: restaurantId, message: message.trim() },
      });

      if (res.error) throw res.error;
      toast.success("Instrucción registrada para hoy");
      setMessage("");
      fetchOverrides();
    } catch (e: any) {
      toast.error(e.message || "Error al procesar la instrucción");
    } finally {
      setSending(false);
    }
  };

  const removeOverride = async (id: string) => {
    const toRemove = overrides.find((o) => o.id === id);
    const updated = overrides.filter((o) => o.id !== id);

    // Expire the matching system_override so the backend stops enforcing it
    if (toRemove?.system_override_id) {
      await supabase
        .from("system_overrides")
        .update({ end_time: new Date().toISOString() } as any)
        .eq("id", toRemove.system_override_id);
    }

    await supabase
      .from("whatsapp_configs")
      .update({ daily_overrides: updated } as any)
      .eq("restaurant_id", restaurantId);
    setOverrides(updated);
    toast.success("Instrucción eliminada");
  };

  const formatTimeLabel = (o: Override): string | null => {
    const parts: string[] = [];
    if (o.start_hour) parts.push(`desde ${o.start_hour}`);
    if (o.until_hour) parts.push(`hasta ${o.until_hour}`);
    return parts.length > 0 ? parts.join(" ") : null;
  };

  return (
    <div className="rounded-2xl alicia-glass p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-teal-400 drop-shadow-[0_0_6px_hsl(174_100%_29%/0.5)]" />
        <h3 className="font-semibold text-foreground">Ajustes del día</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Escríbele a ALICIA cambios temporales para hoy. Ej: "Hoy cerramos a las 9", "No hay domicilio hoy", "Pizza a 35000 desde las 8pm hasta las 9pm"
      </p>

      {overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map((o) => {
            const timeLabel = formatTimeLabel(o);
            return (
              <div key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-foreground">{o.instruction}</span>
                  {timeLabel && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {timeLabel}
                    </span>
                  )}
                </div>
                <button onClick={() => removeOverride(o.id)} className="text-destructive hover:text-destructive/80 p-1 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
          placeholder="Ej: Hoy cerramos a las 9pm"
          className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_2px_10px_hsl(25_100%_50%/0.3)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
