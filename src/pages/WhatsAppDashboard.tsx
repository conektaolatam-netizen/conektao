import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Phone, User, Clock, Package, ChevronLeft, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import AliciaDailyChat from "@/components/alicia-setup/AliciaDailyChat";

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  ts?: string;
  has_image?: boolean;
}

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  order_status: string;
  messages: Message[];
  updated_at: string;
  current_order: any;
}

export default function WhatsAppDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).maybeSingle();
        if (profile?.restaurant_id) setRestaurantId(profile.restaurant_id);
      }
    };
    fetchRestaurant();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      const parsed = data.map((c: any) => ({
        ...c,
        messages: Array.isArray(c.messages) ? c.messages : [],
      }));
      setConversations(parsed);
      if (selected) {
        const updated = parsed.find((c: Conversation) => c.id === selected.id);
        if (updated) setSelected(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatPhone = (phone: string) => {
    if (phone.startsWith("57")) return `+57 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    return `+${phone}`;
  };

  const getTime = (msg: Message) => {
    const ts = msg.timestamp || msg.ts;
    if (!ts) return "";
    const d = new Date(ts);
    const co = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    return format(co, "h:mm a", { locale: es });
  };

  const getLastMessage = (c: Conversation) => {
    const last = c.messages[c.messages.length - 1];
    if (!last) return "Sin mensajes";
    return last.content.substring(0, 80) + (last.content.length > 80 ? "..." : "");
  };

  const getLastTime = (c: Conversation) => {
    const last = c.messages[c.messages.length - 1];
    if (!last) return "";
    return getTime(last);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      confirmed: { label: "Confirmado", variant: "default" },
      pending_confirmation: { label: "Pendiente", variant: "destructive" },
      followup_sent: { label: "Follow-up", variant: "secondary" },
      none: { label: "Conversando", variant: "outline" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.customer_name || "").toLowerCase().includes(q) ||
      c.customer_phone.includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sidebar - Conversation List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-[380px] border-r border-border`}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              ALICIA — Conversaciones
            </h1>
            <button onClick={fetchConversations} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} conversaciones</div>
          {restaurantId && <AliciaDailyChat restaurantId={restaurantId} />}
        </div>

        <ScrollArea className="flex-1">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                selected?.id === c.id ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {c.customer_name || formatPhone(c.customer_phone)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{formatPhone(c.customer_phone)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{getLastTime(c)}</span>
                  {statusBadge(c.order_status)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate pl-[52px]">{getLastMessage(c)}</p>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selected.customer_name || "Cliente"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {formatPhone(selected.customer_phone)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(selected.order_status)}
                {selected.current_order && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    ${(selected.current_order.total || 0).toLocaleString("es-CO")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {selected.messages.map((msg, i) => {
                  const isCustomer = msg.role === "customer";
                  return (
                    <div key={i} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          isCustomer
                            ? "bg-muted text-foreground rounded-bl-md"
                            : "bg-primary text-primary-foreground rounded-br-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isCustomer ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">{getTime(msg)}</span>
                          {msg.has_image && <span className="text-[10px] ml-1">📷</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto opacity-30" />
              <p>Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
