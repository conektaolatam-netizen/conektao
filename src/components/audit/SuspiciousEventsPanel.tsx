import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, User, Clock, ShoppingCart, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDayRange } from '@/lib/date';

interface SuspiciousEvent {
  id: string;
  event_type: string;
  user_id: string;
  user_role: string | null;
  table_number: number | null;
  items_count: number | null;
  order_total: number | null;
  has_items: boolean | null;
  created_at: string;
  metadata: any;
}

interface UserProfile {
  id: string;
  full_name: string;
}

const SuspiciousEventsPanel = () => {
  const { restaurant } = useAuth();
  const [events, setEvents] = useState<SuspiciousEvent[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!restaurant?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { startISO, endISO } = getLocalDayRange();
      
      const { data, error: fetchError } = await supabase
        .from('pos_suspicious_events')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setEvents(data || []);
      
      // Load user profiles for the events
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(e => e.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (profiles) {
          const profileMap: Record<string, string> = {};
          profiles.forEach((p: UserProfile) => {
            profileMap[p.id] = p.full_name;
          });
          setUserProfiles(profileMap);
        }
      }
    } catch (err: any) {
      console.error('Error loading suspicious events:', err);
      setError(err.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [restaurant?.id]);

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'exit_without_kitchen':
        return 'Salida sin enviar a cocina';
      case 'payment_without_kitchen':
        return 'Intento de pago sin cocina';
      case 'order_cleared':
        return 'Orden limpiada con ítems';
      case 'large_discount':
        return 'Descuento grande aplicado';
      case 'void_item':
        return 'Ítem anulado';
      case 'void_sale':
        return 'Venta anulada';
      default:
        return type;
    }
  };

  const getEventSeverity = (type: string): 'high' | 'medium' | 'low' => {
    switch (type) {
      case 'void_sale':
      case 'large_discount':
        return 'high';
      case 'exit_without_kitchen':
      case 'payment_without_kitchen':
      case 'order_cleared':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medio</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Bajo</Badge>;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Aggregate by user for pattern detection
  const eventsByUser = events.reduce((acc, event) => {
    const userId = event.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(event);
    return acc;
  }, {} as Record<string, SuspiciousEvent[]>);

  const getUsersWithMultipleEvents = () => {
    return Object.entries(eventsByUser)
      .filter(([_, userEvents]) => userEvents.length >= 2)
      .map(([userId, userEvents]) => ({
        userId,
        name: userProfiles[userId] || 'Usuario desconocido',
        count: userEvents.length,
        events: userEvents
      }));
  };

  const usersWithPatterns = getUsersWithMultipleEvents();

  if (loading) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-2" />
          <span className="text-muted-foreground">Cargando eventos...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-sm border-red-500/20">
        <div className="flex items-center justify-center py-6 text-red-400">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          Eventos Inusuales del Día
        </h3>
        <Button variant="ghost" size="sm" onClick={loadEvents}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay eventos inusuales hoy</p>
          <p className="text-xs mt-1">¡Buen trabajo! Todo parece normal.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pattern alerts */}
          {usersWithPatterns.length > 0 && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <h4 className="font-medium text-sm text-red-400 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Patrones detectados
              </h4>
              <div className="space-y-2">
                {usersWithPatterns.map(user => (
                  <div key={user.userId} className="text-sm">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-muted-foreground"> - {user.count} eventos inusuales</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div 
                key={event.id} 
                className="p-3 bg-muted/30 rounded-lg border border-border/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {getEventLabel(event.event_type)}
                  </span>
                  {getSeverityBadge(getEventSeverity(event.event_type))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {userProfiles[event.user_id] || 'Usuario'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.created_at)}
                  </span>
                  {event.table_number && (
                    <span>Mesa {event.table_number}</span>
                  )}
                  {event.order_total && event.order_total > 0 && (
                    <span>{formatCurrency(event.order_total)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {events.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              Y {events.length - 10} eventos más...
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default SuspiciousEventsPanel;
