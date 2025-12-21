import { supabase } from '@/integrations/supabase/client';

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number | null;
  status: string;
  total_items: number;
  priority: string;
  sent_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  notes: string | null;
}

interface KitchenOrderEvent {
  id: string;
  kitchen_order_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_name: string | null;
  reason_type: string | null;
  reason_comment: string | null;
  created_at: string;
}

export interface DailyKitchenReport {
  date: string;
  restaurant_id: string;
  summary: {
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    average_preparation_time_minutes: number;
    cancellation_rate_percent: number;
  };
  cancellations: Array<{
    order_number: string;
    table_number: number | null;
    reason_type: string | null;
    reason_comment: string | null;
    cancelled_by: string | null;
    cancelled_at: string | null;
  }>;
  hourly_distribution: Record<string, number>;
  orders: KitchenOrder[];
  events: KitchenOrderEvent[];
}

export const generateDailyKitchenReport = async (
  restaurantId: string,
  date: Date = new Date()
): Promise<DailyKitchenReport | null> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Obtener todas las comandas del día
    const { data: orders, error: ordersError } = await supabase
      .from('kitchen_orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('sent_at', { ascending: true });

    if (ordersError) throw ordersError;

    // Obtener eventos del día
    const { data: events, error: eventsError } = await supabase
      .from('kitchen_order_events')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: true });

    if (eventsError) throw eventsError;

    const ordersList = orders || [];
    const eventsList = events || [];

    // Calcular estadísticas
    const completedOrders = ordersList.filter(o => o.status === 'completed');
    const cancelledOrders = ordersList.filter(o => o.status === 'cancelled');

    // Calcular tiempo promedio de preparación
    let totalPrepTime = 0;
    let prepTimeCount = 0;
    
    completedOrders.forEach(order => {
      if (order.sent_at && order.completed_at) {
        const sent = new Date(order.sent_at).getTime();
        const completed = new Date(order.completed_at).getTime();
        totalPrepTime += (completed - sent) / 60000; // minutos
        prepTimeCount++;
      }
    });

    const avgPrepTime = prepTimeCount > 0 ? Math.round(totalPrepTime / prepTimeCount) : 0;

    // Distribución por hora
    const hourlyDistribution: Record<string, number> = {};
    ordersList.forEach(order => {
      const hour = new Date(order.sent_at).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      hourlyDistribution[hourKey] = (hourlyDistribution[hourKey] || 0) + 1;
    });

    // Detalle de anulaciones
    const cancellations = cancelledOrders.map(order => ({
      order_number: order.order_number,
      table_number: order.table_number,
      reason_type: order.cancellation_reason,
      reason_comment: eventsList.find(
        e => e.kitchen_order_id === order.id && e.new_status === 'cancelled'
      )?.reason_comment || null,
      cancelled_by: eventsList.find(
        e => e.kitchen_order_id === order.id && e.new_status === 'cancelled'
      )?.changed_by_name || null,
      cancelled_at: order.cancelled_at
    }));

    const report: DailyKitchenReport = {
      date: date.toISOString().split('T')[0],
      restaurant_id: restaurantId,
      summary: {
        total_orders: ordersList.length,
        completed_orders: completedOrders.length,
        cancelled_orders: cancelledOrders.length,
        average_preparation_time_minutes: avgPrepTime,
        cancellation_rate_percent: ordersList.length > 0 
          ? Math.round((cancelledOrders.length / ordersList.length) * 100) 
          : 0
      },
      cancellations,
      hourly_distribution: hourlyDistribution,
      orders: ordersList,
      events: eventsList
    };

    return report;
  } catch (error) {
    console.error('Error generating daily kitchen report:', error);
    return null;
  }
};

export const saveDailyKitchenReportToDocuments = async (
  restaurantId: string,
  userId: string,
  date: Date = new Date()
): Promise<string | null> => {
  try {
    const report = await generateDailyKitchenReport(restaurantId, date);
    
    if (!report) {
      throw new Error('No se pudo generar el reporte');
    }

    const dateStr = date.toISOString().split('T')[0];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const day = date.getDate();

    // Verificar si ya existe un documento para este día
    const { data: existingDoc } = await supabase
      .from('business_documents')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('document_type', 'daily_kitchen_report')
      .eq('document_date', dateStr)
      .single();

    if (existingDoc) {
      // Actualizar documento existente
      const { error } = await supabase
        .from('business_documents')
        .update({
          content: report as any,
          updated_at: new Date().toISOString(),
          metadata: {
            total_orders: report.summary.total_orders,
            completed: report.summary.completed_orders,
            cancelled: report.summary.cancelled_orders,
            avg_prep_time: report.summary.average_preparation_time_minutes,
            auto_generated: false,
            updated_by: userId
          }
        })
        .eq('id', existingDoc.id);

      if (error) throw error;
      return existingDoc.id;
    }

    // Crear nuevo documento
    const { data: newDoc, error } = await supabase
      .from('business_documents')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        document_type: 'daily_kitchen_report',
        title: `Comandas ${day} ${month} ${year}`,
        document_date: dateStr,
        content: report as any,
        metadata: {
          total_orders: report.summary.total_orders,
          completed: report.summary.completed_orders,
          cancelled: report.summary.cancelled_orders,
          avg_prep_time: report.summary.average_preparation_time_minutes,
          auto_generated: false,
          month: date.getMonth() + 1,
          year: year,
          day: day
        }
      })
      .select()
      .single();

    if (error) throw error;
    return newDoc?.id || null;
  } catch (error) {
    console.error('Error saving daily kitchen report:', error);
    return null;
  }
};
