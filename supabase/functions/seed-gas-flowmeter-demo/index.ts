import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVERS = [
  { name: 'Carlos Rodríguez', plate: 'TIB-001', mermaBase: 0.008 },
  { name: 'Miguel Ángel López', plate: 'TIB-002', mermaBase: 0.012 },
  { name: 'Juan David Martínez', plate: 'TIB-003', mermaBase: 0.005 },
];

const PIPETA_SIZES = [20, 45, 100];
const GLP_DENSITY = 0.51;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tenantId } = await req.json();
    
    if (!tenantId) {
      throw new Error("tenantId is required");
    }

    const readings: any[] = [];
    const now = new Date();

    // Generate 7 days of historical data
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(6, 0, 0, 0);

      // 2-3 tanker trips per day
      const tripsPerDay = 2 + Math.floor(Math.random() * 2);
      
      for (let trip = 0; trip < tripsPerDay; trip++) {
        const driver = DRIVERS[trip % DRIVERS.length];
        const batchCode = `LOTE-${date.toISOString().split('T')[0].replace(/-/g, '')}-${trip + 1}`;
        
        // M1 - Puerto Salgar - Carga enviada
        const tripHour = 6 + trip * 4;
        const sentTime = new Date(date);
        sentTime.setHours(tripHour, Math.floor(Math.random() * 30), 0, 0);
        
        const volumeSent = 8000 + Math.random() * 4000;
        
        readings.push({
          tenant_id: tenantId,
          meter_id: 'M1_PUERTO_SALGAR',
          meter_location: 'Puerto Salgar',
          reading_type: 'carga_enviada',
          volume_liters: Math.round(volumeSent * 100) / 100,
          volume_kg: Math.round(volumeSent * GLP_DENSITY * 100) / 100,
          temperature: 18 + Math.random() * 7,
          pressure: 10 + Math.random() * 4,
          batch_code: batchCode,
          vehicle_plate: driver.plate,
          driver_name: driver.name,
          device_id: 'IOT-M1-001',
          signal_quality: 85 + Math.floor(Math.random() * 15),
          reading_at: sentTime.toISOString(),
        });

        // M2 - Ibagué - Carga recibida (4 hours later)
        const receivedTime = new Date(sentTime);
        receivedTime.setHours(receivedTime.getHours() + 4);
        
        const mermaPct = driver.mermaBase + (Math.random() - 0.5) * 0.004;
        const volumeReceived = volumeSent * (1 - mermaPct);
        const variance = volumeSent - volumeReceived;
        
        readings.push({
          tenant_id: tenantId,
          meter_id: 'M2_IBAGUE',
          meter_location: 'Ibagué Estacionario',
          reading_type: 'carga_recibida',
          volume_liters: Math.round(volumeReceived * 100) / 100,
          volume_kg: Math.round(volumeReceived * GLP_DENSITY * 100) / 100,
          temperature: 20 + Math.random() * 5,
          pressure: 8 + Math.random() * 3,
          batch_code: batchCode,
          vehicle_plate: driver.plate,
          driver_name: driver.name,
          device_id: 'IOT-M2-001',
          signal_quality: 85 + Math.floor(Math.random() * 15),
          reading_at: receivedTime.toISOString(),
          expected_volume: Math.round(volumeSent * 100) / 100,
          variance_liters: Math.round(variance * 100) / 100,
          variance_percent: Math.round(mermaPct * 10000) / 100,
          is_anomaly: mermaPct > 0.01,
        });
      }

      // 40-80 pipetas per day
      const pipetasPerDay = 40 + Math.floor(Math.random() * 40);
      
      for (let p = 0; p < pipetasPerDay; p++) {
        const pipetaTime = new Date(date);
        pipetaTime.setHours(
          8 + Math.floor(p / (pipetasPerDay / 10)),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
          0
        );
        
        const size = PIPETA_SIZES[Math.floor(Math.random() * PIPETA_SIZES.length)];
        const volumeLiters = size / GLP_DENSITY;
        
        readings.push({
          tenant_id: tenantId,
          meter_id: 'M3_PIPETAS',
          meter_location: 'Llenado Pipetas',
          reading_type: 'pipeta_llenada',
          volume_liters: Math.round(volumeLiters * 100) / 100,
          volume_kg: size,
          temperature: 22 + Math.random() * 3,
          pressure: 6 + Math.random() * 2,
          cylinder_serial: `P-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          device_id: 'IOT-M3-001',
          signal_quality: 90 + Math.floor(Math.random() * 10),
          reading_at: pipetaTime.toISOString(),
        });
      }
    }

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < readings.length; i += batchSize) {
      const batch = readings.slice(i, i + batchSize);
      const { error } = await supabaseAdmin
        .from('gas_flowmeter_readings')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Inserted ${inserted} flowmeter readings`,
        stats: {
          days: 7,
          readings: inserted,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
