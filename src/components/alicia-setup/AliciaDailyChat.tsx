import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Override {
  id: string;
  instruction: string;
  type: string;
  created_at: string;
  expires: string;
}

export default function AliciaDailyChat({ restaurantId }: { restaurantId: string }) {
  const [message, setMessage] = useState("");
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [sending, setSending] = useState(false);

  const fetchOverrides = async () => {
    const { data } = await supabase
      .from("whatsapp_configs")
      .select("daily_overrides")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (data?.daily_overrides) {
      const today = new Date().toISOString().split("T")[0];
      const active = (data.daily_overrides as unknown as Override[]).filter(
        (o) => !o.expires || o.expires >= today
      );
      setOverrides(active);
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
    const updated = overrides.filter((o) => o.id !== id);
    await supabase
      .from("whatsapp_configs")
      .update({ daily_overrides: updated } as any)
      .eq("restaurant_id", restaurantId);
    setOverrides(updated);
    toast.success("Instrucción eliminada");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Ajustes del día</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Escríbele a ALICIA cambios temporales para hoy. Ej: "Hoy cerramos a las 9", "No hay domicilio hoy"
      </p>

      {overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
              <span className="text-foreground">{o.instruction}</span>
              <button onClick={() => removeOverride(o.id)} className="text-destructive hover:text-destructive/80 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
          placeholder="Ej: Hoy cerramos a las 9pm"
          className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
