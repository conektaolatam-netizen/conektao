import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OperationalAction {
  area: string;
  icon: string;
  action: string;
  direction: "up" | "down" | "neutral";
}

interface WeatherData {
  condition: string;
  description: string;
  temp: number;
  humidity: number;
  icon: string;
  recommendation: string;
  salesImpact: {
    dineIn: number;
    delivery: number;
  };
  operationalActions: OperationalAction[];
}

interface CalendarData {
  isHolidayToday: boolean;
  todayHoliday: string | null;
  isHolidayTomorrow: boolean;
  tomorrowHoliday: string | null;
  nextHoliday: { name: string; date: string; daysUntil: number } | null;
  recommendation: string;
  salesImpact: number;
}

interface NewsEvent {
  title: string;
  description: string;
  category: string;
  impactProbability: number;
  source: string;
}

interface NewsData {
  events: NewsEvent[];
  topEvent: NewsEvent | null;
  recommendation: string;
}

// Colombian holidays 2025-2026
const colombianHolidays: { [key: string]: string } = {
  "2025-01-01": "Año Nuevo",
  "2025-01-06": "Día de los Reyes Magos",
  "2025-03-24": "Día de San José",
  "2025-04-17": "Jueves Santo",
  "2025-04-18": "Viernes Santo",
  "2025-05-01": "Día del Trabajo",
  "2025-06-02": "Día de la Ascensión",
  "2025-06-23": "Corpus Christi",
  "2025-06-30": "Sagrado Corazón",
  "2025-07-20": "Día de la Independencia",
  "2025-08-07": "Batalla de Boyacá",
  "2025-08-18": "Asunción de la Virgen",
  "2025-10-13": "Día de la Raza",
  "2025-11-03": "Todos los Santos",
  "2025-11-17": "Independencia de Cartagena",
  "2025-12-08": "Inmaculada Concepción",
  "2025-12-25": "Navidad",
  "2026-01-01": "Año Nuevo",
  "2026-01-12": "Día de los Reyes Magos",
  "2026-03-23": "Día de San José",
  "2026-04-02": "Jueves Santo",
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Día del Trabajo",
  "2026-05-18": "Día de la Ascensión",
  "2026-06-08": "Corpus Christi",
  "2026-06-15": "Sagrado Corazón",
  "2026-06-29": "San Pedro y San Pablo",
  "2026-07-20": "Día de la Independencia",
  "2026-08-07": "Batalla de Boyacá",
  "2026-08-17": "Asunción de la Virgen",
  "2026-10-12": "Día de la Raza",
  "2026-11-02": "Todos los Santos",
  "2026-11-16": "Independencia de Cartagena",
  "2026-12-08": "Inmaculada Concepción",
  "2026-12-25": "Navidad",
};

async function getWeatherData(city: string): Promise<WeatherData> {
  // Enterprise demo: always show rainy day scenario for maximum operational impact
  return {
    condition: "Rain",
    description: "lluvia moderada",
    temp: 14,
    humidity: 85,
    icon: "10d",
    recommendation: "🌧️ Va a llover buena parte del día. Según el histórico de esta sucursal, cuando llueve las mesas bajan -15% pero domicilios suben +19%. Prepara la operación para recibir más pedidos a domicilio desde temprano.",
    operationalActions: [
      { area: "empaques", icon: "📦", action: "Alista +30% de empaques listos para servir antes de las 11AM", direction: "up" },
      { area: "delivery", icon: "🛵", action: "Llama 2 repartidores extra desde las 10:30AM. Domicilios van a subir fuerte después de mediodía", direction: "up" },
      { area: "cocina", icon: "👨‍🍳", action: "Prioriza la línea de domicilios. Prepara sopas, chocolate caliente y platos que viajan bien", direction: "up" },
      { area: "meseros", icon: "🍽️", action: "Reduce 1 mesero del salón y reasígnalo a empaque y apoyo en despacho", direction: "down" },
      { area: "inventario", icon: "📋", action: "Revisa stock de sopas, chocolate y productos de temporada fría antes de las 11AM", direction: "neutral" },
    ],
    salesImpact: {
      dineIn: -15,
      delivery: 19,
    },
  };
}

function getCalendarData(): CalendarData {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  
  const isHolidayToday = colombianHolidays[todayStr] !== undefined;
  const isHolidayTomorrow = colombianHolidays[tomorrowStr] !== undefined;
  
  // Find next holiday
  let nextHoliday: { name: string; date: string; daysUntil: number } | null = null;
  const sortedDates = Object.keys(colombianHolidays).sort();
  
  for (const dateStr of sortedDates) {
    const holidayDate = new Date(dateStr);
    if (holidayDate > today) {
      const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      nextHoliday = {
        name: colombianHolidays[dateStr],
        date: dateStr,
        daysUntil,
      };
      break;
    }
  }

  let recommendation = "";
  let salesImpact = 0;

  const dayOfWeek = today.getDay();
  const isFriday = dayOfWeek === 5;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isHolidayToday) {
    recommendation = `🎉 Hoy es ${colombianHolidays[todayStr]}. Según el histórico, las ventas aumentan un 25% en días festivos. Refuerza todo el personal y prepara inventario adicional.`;
    salesImpact = 25;
  } else if (isHolidayTomorrow) {
    recommendation = `📅 Mañana es ${colombianHolidays[tomorrowStr]}. Hoy la gente sale más a cenar antes del festivo. Ventas proyectadas +15%.`;
    salesImpact = 15;
  } else if (isFriday) {
    recommendation = "🗓️ Es viernes - día de alta demanda tradicional. Prepara para un 20% más de clientes en la noche.";
    salesImpact = 20;
  } else if (isWeekend) {
    recommendation = "🗓️ Fin de semana - alta demanda esperada, especialmente a la hora del almuerzo.";
    salesImpact = 15;
  } else if (nextHoliday && nextHoliday.daysUntil <= 7) {
    recommendation = `📆 ${nextHoliday.name} se acerca en ${nextHoliday.daysUntil} días. Prepara inventario adicional.`;
    salesImpact = 5;
  } else {
    recommendation = "📅 Día laboral normal. Flujo de clientes estándar esperado.";
    salesImpact = 0;
  }

  return {
    isHolidayToday,
    todayHoliday: isHolidayToday ? colombianHolidays[todayStr] : null,
    isHolidayTomorrow,
    tomorrowHoliday: isHolidayTomorrow ? colombianHolidays[tomorrowStr] : null,
    nextHoliday,
    recommendation,
    salesImpact,
  };
}

async function getNewsData(city: string): Promise<NewsData> {
  const apiKey = Deno.env.get("NEWSAPI_KEY");
  
  const simulatedEvents: NewsEvent[] = [
    {
      title: "Final Liga BetPlay: Millonarios vs Tolima",
      description: "El partido se juega hoy a las 8:00 PM en El Campín. Crepes & Waffles no transmite partidos en local — históricamente las ventas en salón caen hasta un 35% durante partidos importantes.",
      category: "deportes",
      impactProbability: 92,
      source: "El Tiempo",
    },
    {
      title: "Concierto de Shakira en el Movistar Arena",
      description: "El evento de esta noche generará tráfico pesado en la zona norte.",
      category: "entretenimiento",
      impactProbability: 78,
      source: "Caracol Radio",
    },
  ];

  if (!apiKey) {
    return {
      events: simulatedEvents,
      topEvent: simulatedEvents[0],
      recommendation: "⚽ Final Liga BetPlay hoy a las 8PM — como no se transmite en el local, las ventas en salón bajan hasta 35%. Considera reducir personal en mesa desde las 7PM y reforzar domicilios: los pedidos grupales suben un 20% durante partidos.",
    };
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=co&category=sports&apiKey=${apiKey}`
    );

    if (!response.ok) {
      return {
        events: simulatedEvents,
        topEvent: simulatedEvents[0],
        recommendation: "⚽ Final Liga BetPlay hoy a las 8PM — ventas en salón bajan ~35% al no transmitir. Reduce personal en mesa y refuerza domicilios.",
      };
    }

    const data = await response.json();
    
    const events: NewsEvent[] = data.articles?.slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description || "",
      category: "noticias",
      impactProbability: Math.floor(Math.random() * 40) + 30,
      source: article.source?.name || "Noticias",
    })) || simulatedEvents;

    events.unshift(simulatedEvents[0]);

    const topEvent = events[0];
    
    return {
      events,
      topEvent,
      recommendation: topEvent.impactProbability > 70 
        ? `⚠️ ${topEvent.title} - ${topEvent.impactProbability}% probabilidad de impacto en ventas. Ajusta tu operación.`
        : "Sin eventos de alto impacto detectados para hoy.",
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    return {
      events: simulatedEvents,
      topEvent: simulatedEvents[0],
      recommendation: "⚽ Final Liga BetPlay hoy — ventas en salón bajan ~35% al no transmitir. Refuerza domicilios.",
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city = "Bogotá", branch_id = "zona-t" } = await req.json();

    console.log(`Fetching conditions for ${city}, branch: ${branch_id}`);

    const [weather, calendar, news] = await Promise.all([
      getWeatherData(city),
      getCalendarData(),
      getNewsData(city),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    let aiSummary = "";
    
    if (LOVABLE_API_KEY) {
      try {
        const summaryPrompt = `Eres el copiloto de IA de una sucursal de Crepes & Waffles en ${city}. 
Basándote en las condiciones del día, genera un resumen ejecutivo breve para el gerente.

REGLAS DE FORMATO OBLIGATORIAS:
- PROHIBIDO usar asteriscos (**), markdown o formato técnico
- USA emojis al inicio de cada bloque para dar estructura visual
- Separa cada bloque con doble salto de línea
- Máximo 3 bloques
- Habla directo, como un copiloto que conoce el negocio hace años
- Incluye números concretos (porcentajes, cantidades)
- Tono: seguro, práctico, cero técnico

CLIMA: ${weather.condition} (${weather.temp}°C) - ${weather.recommendation}

CALENDARIO: ${calendar.recommendation}

NOTICIAS/EVENTOS: ${news.recommendation}

Formato esperado (3 bloques separados por doble salto de línea):

🌧️ Lluvia todo el día, 14°C. Según el histórico de esta sede, las mesas bajan -15% y domicilios suben +19%. Prepara empaques extra y refuerza delivery desde las 10:30AM.

⚽ Final Liga BetPlay a las 8PM. Como no transmitimos, el salón se vacía hasta -35% desde las 7PM. Mueve 1 mesero a despacho y activa promoción de domicilios grupales.

🎯 Impacto combinado del día: alto. Prioridad es domicilios. Asegura stock de sopas, chocolate y empaques impermeables antes del mediodía.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Eres el copiloto de IA para gerentes de Crepes & Waffles. Hablas directo, con datos, sin adornos. PROHIBIDO usar asteriscos o markdown. Usa emojis para estructura. Cada bloque separado por doble salto de línea. Tono: como un gerente experimentado hablándole a otro gerente." },
              { role: "user", content: summaryPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (aiError) {
        console.error("Error generating AI summary:", aiError);
      }
    }

    if (!aiSummary) {
      aiSummary = `🌧️ Día lluvioso en ${city}. Mesas bajan -15%, domicilios suben +19%. Prioriza delivery y empaques.\n\n⚽ Final Liga BetPlay a las 8PM — salón baja -35%. Refuerza domicilios desde las 7PM.\n\n🎯 Impacto combinado alto. Foco total en domicilios hoy.`;
    }

    const result = {
      weather,
      calendar,
      news,
      aiSummary,
      generatedAt: new Date().toISOString(),
      branch: {
        id: branch_id,
        city,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in crepes-conditions-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
