import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, MapPin, Store, Phone, CheckCircle2, Clock, RefreshCw, Truck, ChefHat, Mail, MailCheck, CreditCard, Image as ImageIcon, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { printKitchenTickets, hasPrinterConfigured } from "@/lib/printComanda";

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  packaging_cost?: number;
}

interface Order {
  id: string;
  customer_phone: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  delivery_type: string;
  delivery_address: string | null;
  status: string;
  email_sent: boolean;
  payment_proof_url: string | null;
  payment_method: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  received: { label: "Nuevo", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", icon: Clock },
  confirmed: { label: "Confirmado", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", icon: CheckCircle2 },
  preparing: { label: "Preparando", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", icon: ChefHat },
  delivering: { label: "En camino", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30", icon: Truck },
  completed: { label: "Entregado", color: "text-gray-400", bg: "bg-gray-400/10 border-gray-400/30", icon: CheckCircle2 },
};

interface OrdersPanelProps {
  restaurantId: string;
}

export default function OrdersPanel({ restaurantId }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from("whatsapp_orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });
    if (data) setOrders(data.map((d: any) => ({ ...d, items: Array.isArray(d.items) ? d.items : [] })) as Order[]);
    if (error) console.error("Error fetching orders:", error);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Real-time subscription filtered by restaurant
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, restaurantId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("whatsapp_orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      toast.error("Error al actualizar el estado");
      console.error(error);
    } else {
      toast.success(`Pedido marcado como: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
    setUpdatingId(null);
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith("57")) return `+57 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    return `+${phone}`;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" });
  };

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      received: "confirmed",
      confirmed: "preparing",
      preparing: "delivering",
      delivering: "completed",
    };
    return flow[current] || null;
  };

  const getNextLabel = (current: string): string => {
    const labels: Record<string, string> = {
      received: "✅ Confirmar pedido",
      confirmed: "👨‍🍳 Marcar en preparación",
      preparing: "🛵 Marcar en camino",
      delivering: "✅ Marcar entregado",
    };
    return labels[current] || "";
  };

  const activeOrders = orders.filter(o => o.status !== "completed");
  const completedOrders = orders.filter(o => o.status === "completed");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Comandas de hoy
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeOrders.length} activas · {completedOrders.length} completadas
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchOrders}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {activeOrders.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto opacity-30 mb-2" />
              <p>No hay pedidos activos</p>
            </div>
          )}

          {activeOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
            const StatusIcon = cfg.icon;
            const nextStatus = getNextStatus(order.status);
            const isDelivery = order.delivery_type === "delivery";

            return (
              <div
                key={order.id}
                className={`rounded-2xl border ${cfg.bg} overflow-hidden transition-all`}
              >
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{order.customer_name || "Cliente"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{formatPhone(order.customer_phone)}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.email_sent && (
                      <span title="Email enviado" className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <MailCheck className="w-3 h-3" />
                        Email
                      </span>
                    )}
                    {order.payment_proof_url && (
                      <a
                        href={order.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver comprobante"
                        className="flex items-center gap-1 text-[10px] text-blue-400 font-medium hover:text-blue-300 transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Comprobante ✓
                      </a>
                    )}
                    <Badge variant="outline" className={`${cfg.color} border-current text-xs`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Delivery info + payment method */}
                <div className="px-4 pb-2 space-y-2">
                  {isDelivery ? (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-emerald-400">Domicilio</p>
                        <p className="text-xs text-muted-foreground">{order.delivery_address || "Dirección no proporcionada"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <Store className="w-4 h-4 text-orange-400" />
                      <p className="text-xs font-medium text-orange-400">Recoger en local</p>
                    </div>
                  )}
                  {order.payment_method && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                      <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                      <p className="text-xs font-medium text-violet-400 capitalize">{order.payment_method}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="px-4 pb-3">
                  <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between px-3 py-2 text-sm border-b border-white/[0.04]">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">${((item.unit_price || 0) * (item.quantity || 1)).toLocaleString("es-CO")}</span>
                        </div>
                        {item.packaging_cost > 0 && (
                          <div className="flex items-center justify-between px-3 pl-8 py-1.5 text-xs border-b border-white/[0.04] bg-white/[0.02]">
                            <span className="text-muted-foreground">📦 Empaque x{item.quantity}</span>
                            <span className="text-muted-foreground">${(item.packaging_cost * (item.quantity || 1)).toLocaleString("es-CO")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Total */}
                    <div className="flex items-center justify-between px-3 py-2 bg-teal-500/[0.06]">
                      <span className="text-sm font-bold">Total</span>
                      <span className="text-lg font-bold text-teal-400">${(order.total || 0).toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {nextStatus && (
                  <div className="px-4 pb-4">
                    <Button
                      className="w-full"
                      variant={order.status === "received" ? "default" : "secondary"}
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, nextStatus)}
                    >
                      {updatingId === order.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {getNextLabel(order.status)}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Completed section */}
          {completedOrders.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground px-2">Completados hoy ({completedOrders.length})</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {completedOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{order.customer_name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(order.created_at)} · {order.delivery_type === "delivery" ? "🛵 Domicilio" : "🏪 Recoger"}</p>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">${(order.total || 0).toLocaleString("es-CO")}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
