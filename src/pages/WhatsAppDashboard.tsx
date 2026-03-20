import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Phone, User, Clock, Package, ChevronLeft, RefreshCw, Search, FileText, ShieldOff, Trash2, Settings, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AliciaDailyChat from "@/components/alicia-setup/AliciaDailyChat";
import OrdersPanel from "@/components/alicia-dashboard/OrdersPanel";
import TemplatesPanel from "@/components/alicia-dashboard/TemplatesPanel";
import ReservationsPanel from "@/components/alicia-dashboard/ReservationsPanel";
import aliciaAvatar from "@/assets/alicia-avatar.png";

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

interface BlockedNumber {
  id: string;
  phone_number: string;
  reason: string | null;
  created_at: string;
}

// ===== BLOCKED NUMBERS PANEL =====
function BlockedNumbersPanel({ restaurantId }: { restaurantId: string }) {
  const [blocked, setBlocked] = useState<BlockedNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBlocked = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_blocked_numbers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    if (data) setBlocked(data as BlockedNumber[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocked();
  }, [restaurantId]);

  const handleBlock = async () => {
    const cleaned = newPhone.replace(/[\s+\-()]/g, "");
    if (!cleaned || cleaned.length < 8) {
      toast.error("Ingresa un número válido (ej: 573162131254)");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("whatsapp_blocked_numbers").insert({
      restaurant_id: restaurantId,
      phone_number: cleaned,
      reason: newReason || null,
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Este número ya está bloqueado");
      } else {
        toast.error("Error al bloquear: " + error.message);
      }
    } else {
      toast.success(`🚫 Número ${cleaned} bloqueado`);
      setNewPhone("");
      setNewReason("");
      fetchBlocked();
    }
  };

  const handleUnblock = async (id: string, phone: string) => {
    const { error } = await supabase.from("whatsapp_blocked_numbers").delete().eq("id", id);
    if (error) {
      toast.error("Error al desbloquear");
    } else {
      toast.success(`✅ Número ${phone} desbloqueado`);
      fetchBlocked();
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith("57") && phone.length === 12) {
      return `+57 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    return `+${phone}`;
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldOff className="w-5 h-5 text-destructive" />
          Números bloqueados
        </h2>
        <p className="text-sm text-muted-foreground">
          Los números bloqueados no recibirán respuesta de Alicia. Sus mensajes se ignorarán silenciosamente.
        </p>
      </div>

      {/* Form */}
      <div className="alicia-glass rounded-2xl p-4 space-y-3">
        <p className="text-sm font-medium">Bloquear número nuevo</p>
        <Input
          placeholder="Número completo sin + (ej: 573162131254)"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="bg-white/5 border-white/10 focus:ring-teal-500/30"
        />
        <Input
          placeholder="Motivo (opcional)"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          className="bg-white/5 border-white/10 focus:ring-teal-500/30"
        />
        <Button
          onClick={handleBlock}
          disabled={saving || !newPhone}
          variant="destructive"
          className="w-full rounded-xl"
        >
          {saving ? "Bloqueando..." : "🚫 Bloquear número"}
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {loading ? "Cargando..." : `${blocked.length} número${blocked.length !== 1 ? "s" : ""} bloqueado${blocked.length !== 1 ? "s" : ""}`}
        </p>
        {blocked.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <ShieldOff className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No hay números bloqueados</p>
          </div>
        )}
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3 alicia-glass rounded-xl">
            <div>
              <p className="font-mono text-sm font-medium">{formatPhone(b.phone_number)}</p>
              {b.reason && <p className="text-xs text-muted-foreground mt-0.5">{b.reason}</p>}
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(b.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleUnblock(b.id, b.phone_number)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Desbloquear
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== STATUS DOT HELPER =====
function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    confirmed: "bg-emerald-400 shadow-emerald-400/50",
    none: "bg-emerald-400 shadow-emerald-400/50",
    pending_confirmation: "bg-orange-400 shadow-orange-400/50",
    followup_sent: "bg-blue-400 shadow-blue-400/50",
  };
  const c = colorMap[status] || colorMap.none;
  return <span className={`inline-block w-2 h-2 rounded-full ${c} shadow-[0_0_6px]`} />;
}

// ===== MAIN DASHBOARD =====
export default function WhatsAppDashboard() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [wabaId, setWabaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).maybeSingle();
        if (profile?.restaurant_id) {
          setRestaurantId(profile.restaurant_id);
          const { data: config } = await supabase
            .from("whatsapp_configs")
            .select("waba_id")
            .eq("restaurant_id", profile.restaurant_id)
            .maybeSingle();
          if (config?.waba_id) {
            setWabaId(config.waba_id as string);
          }
        }
      }
    };
    fetchRestaurant();
  }, []);

  const fetchConversations = async () => {
    if (!restaurantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("restaurant_id", restaurantId)
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
    if (!restaurantId) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const checkNudges = async () => {
      try {
        const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook?action=check_nudges`;
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurant_id: restaurantId }),
        });
      } catch (e) {
        console.error("Nudge check error:", e);
      }
    };
    checkNudges();
    const nudgeInterval = setInterval(checkNudges, 2 * 60 * 1000);
    return () => clearInterval(nudgeInterval);
  }, [restaurantId]);

  const blockFromConversation = async (conv: Conversation) => {
    if (!restaurantId) return;
    const { error } = await supabase.from("whatsapp_blocked_numbers").insert({
      restaurant_id: restaurantId,
      phone_number: conv.customer_phone,
      reason: `Bloqueado desde conversación - ${conv.customer_name || conv.customer_phone}`,
    });
    if (error && error.code === "23505") {
      toast.info("Este número ya estaba bloqueado");
    } else if (error) {
      toast.error("Error al bloquear");
    } else {
      toast.success(`🚫 ${conv.customer_name || conv.customer_phone} bloqueado`);
      setSelected(null);
      setActiveTab("blocked");
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith("57")) return `+57 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    return `+${phone}`;
  };

  const getTime = (msg: Message) => {
    const ts = msg.timestamp || msg.ts;
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" });
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
    <div className="h-screen flex flex-col alicia-dash-bg text-foreground">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-4 pt-3 pb-1">
          <TabsList className="alicia-glass rounded-2xl p-1 w-auto">
            <TabsTrigger value="orders" className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_0_12px_hsl(174_100%_29%/0.2)] transition-all">
              <Package className="w-4 h-4" />
              Comandas
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_0_12px_hsl(174_100%_29%/0.2)] transition-all">
              <MessageSquare className="w-4 h-4" />
              Conversaciones
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_0_12px_hsl(174_100%_29%/0.2)] transition-all">
              <FileText className="w-4 h-4" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_0_12px_hsl(174_100%_29%/0.2)] transition-all">
              <ShieldOff className="w-4 h-4" />
              Bloqueados
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_0_12px_hsl(174_100%_29%/0.2)] transition-all">
              <CalendarDays className="w-4 h-4" />
              Reservas
            </TabsTrigger>
            <Button
              variant="ghost"
              onClick={() => navigate("/alicia/config")}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-3 py-1.5"
            >
              <Settings className="w-4 h-4" />
              Configurar Alicia
            </Button>
          </TabsList>
        </div>

        <TabsContent value="orders" className="flex-1 m-0 overflow-hidden">
          {restaurantId ? <OrdersPanel restaurantId={restaurantId} /> : <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>}
        </TabsContent>

        <TabsContent value="conversations" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex">
            {/* Sidebar */}
            <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-[380px] border-r border-white/[0.06]`}>
              <div className="p-4 border-b border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                    Conversaciones
                  </h1>
                  <button onClick={fetchConversations} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nombre, teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10 rounded-xl focus:ring-teal-500/30" />
                </div>
                <div className="text-xs text-muted-foreground">{filtered.length} conversaciones</div>
                {restaurantId && <AliciaDailyChat restaurantId={restaurantId} />}
              </div>

              <ScrollArea className="flex-1 alicia-glass-light">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left p-4 border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors ${selected?.id === c.id ? "alicia-active-bar bg-white/[0.06]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 border border-teal-500/20">
                          <User className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.customer_name || formatPhone(c.customer_phone)}</p>
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
                  <div className="m-3 mb-0 p-4 alicia-glass rounded-2xl">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelected(null)} className="md:hidden p-1">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="alicia-avatar-ring flex-shrink-0">
                        <img src={aliciaAvatar} alt="ALICIA" className="w-11 h-11 rounded-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-wide">ALICIA</span>
                          <StatusDot status={selected.order_status} />
                          <span className="text-[10px] text-muted-foreground">
                            {selected.order_status === "confirmed" ? "Confirmado" : selected.order_status === "pending_confirmation" ? "Esperando pago" : "Activa"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <User className="w-3 h-3" />
                          <span className="truncate">{selected.customer_name || "Cliente"}</span>
                          <span className="text-white/20">·</span>
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(selected.customer_phone)}</span>
                        </div>
                      </div>
                      {statusBadge(selected.order_status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2 rounded-xl"
                        onClick={() => blockFromConversation(selected)}
                        title="Bloquear este número"
                      >
                        <ShieldOff className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Bloquear</span>
                      </Button>
                    </div>
                  </div>

                  {selected.current_order && (
                    <div className="mx-3 mt-2 mb-0 p-4 rounded-2xl alicia-glass">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center">
                            <Package className="w-4 h-4 text-teal-400" />
                          </div>
                          <span className="text-sm font-semibold">Pedido actual</span>
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
                          ${(selected.current_order.total || 0).toLocaleString("es-CO")}
                        </span>
                      </div>
                      {selected.current_order.items && Array.isArray(selected.current_order.items) && (
                        <div className="space-y-1.5">
                          {selected.current_order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                              <span className="font-medium">${((item.unit_price || 0) * (item.quantity || 1)).toLocaleString("es-CO")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selected.current_order.delivery_type && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{selected.current_order.delivery_type === "delivery" ? "🛵 Domicilio" : "🏪 Recoger"}</span>
                          {selected.current_order.customer_name && <span>· {selected.current_order.customer_name}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <ScrollArea className="flex-1 p-4">
                    <div className="max-w-2xl mx-auto space-y-4">
                      {selected.messages.map((msg, i) => {
                        const isCustomer = msg.role === "customer";
                        return (
                          <div key={i} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isCustomer ? "alicia-bubble-customer rounded-bl-md" : "alicia-bubble-assistant rounded-br-md"}`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1.5 ${isCustomer ? "text-white/40" : "text-white/50"}`}>
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
                  <div className="text-center space-y-3">
                    <div className="alicia-avatar-ring mx-auto w-fit">
                      <img src={aliciaAvatar} alt="ALICIA" className="w-16 h-16 rounded-full object-cover" />
                    </div>
                    <p className="text-sm">Selecciona una conversación</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 m-0 overflow-hidden">
          {wabaId ? (
            <TemplatesPanel wabaId={wabaId} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm">Configura tu WhatsApp Business primero para gestionar plantillas</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked" className="flex-1 m-0 overflow-y-auto">
          {restaurantId ? (
            <BlockedNumbersPanel restaurantId={restaurantId} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm">Cargando...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservations" className="flex-1 m-0 overflow-y-auto">
          {restaurantId ? (
            <ReservationsPanel restaurantId={restaurantId} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
              <p className="text-sm">Cargando...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
