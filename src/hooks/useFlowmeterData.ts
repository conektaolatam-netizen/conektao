import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef, useState } from 'react';

export interface FlowmeterReading {
  id: string;
  tenant_id: string;
  meter_id: string;
  meter_location: string;
  reading_type: string;
  volume_liters: number;
  volume_kg: number | null;
  temperature: number | null;
  pressure: number | null;
  batch_code: string | null;
  vehicle_plate: string | null;
  driver_name: string | null;
  driver_id: string | null;
  cylinder_serial: string | null;
  client_id: string | null;
  device_id: string | null;
  signal_quality: number | null;
  reading_at: string;
  created_at: string;
  expected_volume: number | null;
  variance_liters: number | null;
  variance_percent: number | null;
  is_anomaly: boolean;
}

export interface MermaByDriver {
  driver_name: string;
  total_trips: number;
  total_merma_liters: number;
  avg_merma_percent: number;
  status: 'excellent' | 'normal' | 'warning';
}

export interface DailyFlowSummary {
  date: string;
  sent_liters: number;
  received_liters: number;
  merma_liters: number;
  merma_percent: number;
  pipetas_filled: number;
  pipetas_kg: number;
}

const DRIVERS = [
  { name: 'Carlos Rodríguez', plate: 'TIB-001', mermaBase: 0.008 },
  { name: 'Miguel Ángel López', plate: 'TIB-002', mermaBase: 0.012 },
  { name: 'Juan David Martínez', plate: 'TIB-003', mermaBase: 0.005 },
];

const PIPETA_SIZES = [20, 45, 100]; // kg
const GLP_DENSITY = 0.51; // kg/liter

export const useFlowmeterData = () => {
  const { restaurant } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = restaurant?.id;

  // Fetch latest readings for each meter
  const latestReadingsQuery = useQuery({
    queryKey: ['flowmeter_latest', tenantId],
    queryFn: async () => {
      if (!tenantId) return { M1: null, M2: null, M3: null };
      
      const meters = ['M1_PUERTO_SALGAR', 'M2_IBAGUE', 'M3_PIPETAS'];
      const results: Record<string, FlowmeterReading | null> = {};
      
      for (const meter of meters) {
        const { data } = await supabase
          .from('gas_flowmeter_readings')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('meter_id', meter)
          .order('reading_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        results[meter.split('_')[0]] = data as FlowmeterReading | null;
      }
      
      return results;
    },
    enabled: !!tenantId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
  });

  // Fetch 7-day history
  const historyQuery = useQuery({
    queryKey: ['flowmeter_history', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('gas_flowmeter_readings')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('reading_at', sevenDaysAgo.toISOString())
        .order('reading_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as FlowmeterReading[];
    },
    enabled: !!tenantId,
  });

  // Calculate merma by driver from history
  const mermaByDriver = useQuery({
    queryKey: ['flowmeter_merma_by_driver', tenantId],
    queryFn: async (): Promise<MermaByDriver[]> => {
      if (!tenantId) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('gas_flowmeter_readings')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('meter_id', 'M2_IBAGUE')
        .gte('reading_at', sevenDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Group by driver
      const driverStats: Record<string, { trips: number; totalMerma: number; totalPercent: number }> = {};
      
      ((data || []) as FlowmeterReading[]).forEach(reading => {
        const driver = reading.driver_name || 'Sin conductor';
        if (!driverStats[driver]) {
          driverStats[driver] = { trips: 0, totalMerma: 0, totalPercent: 0 };
        }
        driverStats[driver].trips++;
        driverStats[driver].totalMerma += reading.variance_liters || 0;
        driverStats[driver].totalPercent += reading.variance_percent || 0;
      });
      
      return Object.entries(driverStats).map(([name, stats]) => {
        const avgPercent = stats.trips > 0 ? stats.totalPercent / stats.trips : 0;
        const status: 'excellent' | 'normal' | 'warning' = avgPercent > 1 ? 'warning' : avgPercent < 0.6 ? 'excellent' : 'normal';
        return {
          driver_name: name,
          total_trips: stats.trips,
          total_merma_liters: Math.abs(stats.totalMerma),
          avg_merma_percent: Math.abs(avgPercent),
          status,
        };
      }).sort((a, b) => b.avg_merma_percent - a.avg_merma_percent);
    },
    enabled: !!tenantId,
  });

  // Daily flow summary
  const dailySummaryQuery = useQuery({
    queryKey: ['flowmeter_daily_summary', tenantId],
    queryFn: async (): Promise<DailyFlowSummary[]> => {
      if (!tenantId) return [];
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('gas_flowmeter_readings')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('reading_at', sevenDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Group by date
      const dailyStats: Record<string, DailyFlowSummary> = {};
      
      ((data || []) as FlowmeterReading[]).forEach(reading => {
        const date = reading.reading_at.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            sent_liters: 0,
            received_liters: 0,
            merma_liters: 0,
            merma_percent: 0,
            pipetas_filled: 0,
            pipetas_kg: 0,
          };
        }
        
        if (reading.meter_id === 'M1_PUERTO_SALGAR') {
          dailyStats[date].sent_liters += reading.volume_liters;
        } else if (reading.meter_id === 'M2_IBAGUE') {
          dailyStats[date].received_liters += reading.volume_liters;
          dailyStats[date].merma_liters += Math.abs(reading.variance_liters || 0);
        } else if (reading.meter_id === 'M3_PIPETAS') {
          dailyStats[date].pipetas_filled++;
          dailyStats[date].pipetas_kg += reading.volume_kg || 0;
        }
      });
      
      // Calculate merma percent
      Object.values(dailyStats).forEach(day => {
        if (day.sent_liters > 0) {
          day.merma_percent = (day.merma_liters / day.sent_liters) * 100;
        }
      });
      
      return Object.values(dailyStats).sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!tenantId,
  });

  // Today's summary
  const todaySummary = useQuery({
    queryKey: ['flowmeter_today', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('gas_flowmeter_readings')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('reading_at', `${today}T00:00:00`)
        .lte('reading_at', `${today}T23:59:59`);
      
      if (error) throw error;
      
      const readings = (data || []) as FlowmeterReading[];
      
      const sent = readings.filter(r => r.meter_id === 'M1_PUERTO_SALGAR').reduce((sum, r) => sum + r.volume_liters, 0);
      const received = readings.filter(r => r.meter_id === 'M2_IBAGUE').reduce((sum, r) => sum + r.volume_liters, 0);
      const pipetas = readings.filter(r => r.meter_id === 'M3_PIPETAS');
      const pipetasKg = pipetas.reduce((sum, r) => sum + (r.volume_kg || 0), 0);
      const merma = readings.filter(r => r.meter_id === 'M2_IBAGUE').reduce((sum, r) => sum + Math.abs(r.variance_liters || 0), 0);
      
      return {
        sent_liters: sent,
        received_liters: received,
        merma_liters: merma,
        merma_percent: sent > 0 ? (merma / sent) * 100 : 0,
        pipetas_count: pipetas.length,
        pipetas_kg: pipetasKg,
      };
    },
    enabled: !!tenantId,
    refetchInterval: 10000,
  });

  return {
    latestReadings: latestReadingsQuery.data || { M1: null, M2: null, M3: null },
    history: historyQuery.data || [],
    mermaByDriver: mermaByDriver.data || [],
    dailySummary: dailySummaryQuery.data || [],
    todaySummary: todaySummary.data,
    isLoading: latestReadingsQuery.isLoading || historyQuery.isLoading,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['flowmeter_latest'] });
      queryClient.invalidateQueries({ queryKey: ['flowmeter_history'] });
      queryClient.invalidateQueries({ queryKey: ['flowmeter_merma_by_driver'] });
      queryClient.invalidateQueries({ queryKey: ['flowmeter_daily_summary'] });
      queryClient.invalidateQueries({ queryKey: ['flowmeter_today'] });
    },
  };
};

// Simulation hook - generates fake readings in real-time
export const useFlowmeterSimulation = () => {
  const { restaurant } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = restaurant?.id;
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastPipetaTime, setLastPipetaTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateSimulatedReading = async (type: 'pipeta' | 'carga_enviada' | 'carga_recibida') => {
    if (!tenantId) return;

    const driver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
    const batchCode = `LOTE-${Date.now().toString(36).toUpperCase()}`;
    
    let reading: Partial<FlowmeterReading> = {
      tenant_id: tenantId,
      device_id: `IOT-${type.toUpperCase()}-001`,
      signal_quality: 85 + Math.floor(Math.random() * 15),
    };

    if (type === 'carga_enviada') {
      const volume = 8000 + Math.random() * 4000; // 8000-12000 liters
      reading = {
        ...reading,
        meter_id: 'M1_PUERTO_SALGAR',
        meter_location: 'Puerto Salgar',
        reading_type: 'carga_enviada',
        volume_liters: Math.round(volume * 100) / 100,
        volume_kg: Math.round(volume * GLP_DENSITY * 100) / 100,
        temperature: 18 + Math.random() * 7,
        pressure: 10 + Math.random() * 4,
        batch_code: batchCode,
        vehicle_plate: driver.plate,
        driver_name: driver.name,
      };
    } else if (type === 'carga_recibida') {
      const sentVolume = 8000 + Math.random() * 4000;
      const mermaPct = driver.mermaBase + (Math.random() - 0.5) * 0.004; // variance
      const receivedVolume = sentVolume * (1 - mermaPct);
      const variance = sentVolume - receivedVolume;
      
      reading = {
        ...reading,
        meter_id: 'M2_IBAGUE',
        meter_location: 'Ibagué Estacionario',
        reading_type: 'carga_recibida',
        volume_liters: Math.round(receivedVolume * 100) / 100,
        volume_kg: Math.round(receivedVolume * GLP_DENSITY * 100) / 100,
        temperature: 20 + Math.random() * 5,
        pressure: 8 + Math.random() * 3,
        batch_code: batchCode,
        vehicle_plate: driver.plate,
        driver_name: driver.name,
        expected_volume: Math.round(sentVolume * 100) / 100,
        variance_liters: Math.round(variance * 100) / 100,
        variance_percent: Math.round(mermaPct * 10000) / 100,
        is_anomaly: mermaPct > 0.01,
      };
    } else if (type === 'pipeta') {
      const size = PIPETA_SIZES[Math.floor(Math.random() * PIPETA_SIZES.length)];
      const volumeLiters = size / GLP_DENSITY;
      
      reading = {
        ...reading,
        meter_id: 'M3_PIPETAS',
        meter_location: 'Llenado Pipetas',
        reading_type: 'pipeta_llenada',
        volume_liters: Math.round(volumeLiters * 100) / 100,
        volume_kg: size,
        temperature: 22 + Math.random() * 3,
        pressure: 6 + Math.random() * 2,
        cylinder_serial: `P-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      };
    }

    try {
      const { error } = await supabase
        .from('gas_flowmeter_readings')
        .insert(reading as any);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['flowmeter_latest'] });
        queryClient.invalidateQueries({ queryKey: ['flowmeter_today'] });
      }
    } catch (err) {
      console.error('Error inserting simulated reading:', err);
    }
  };

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    // Generate a pipeta reading every 8-15 seconds
    intervalRef.current = setInterval(() => {
      generateSimulatedReading('pipeta');
      setLastPipetaTime(new Date());
    }, 8000 + Math.random() * 7000);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  };

  const simulateTankerTrip = async () => {
    await generateSimulatedReading('carga_enviada');
    // Simulate arrival 4 hours later (instant for demo)
    setTimeout(async () => {
      await generateSimulatedReading('carga_recibida');
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isSimulating,
    lastPipetaTime,
    startSimulation,
    stopSimulation,
    simulateTankerTrip,
    generatePipetaReading: () => generateSimulatedReading('pipeta'),
  };
};
