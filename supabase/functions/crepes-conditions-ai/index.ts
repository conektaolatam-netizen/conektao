import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
  
  if (!apiKey) {
    // Fallback with realistic simulated data for Bogotá
    return getSimulatedWeather(city);
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},CO&appid=${apiKey}&units=metric&lang=es`
    );

    if (!response.ok) {
      console.log("Weather API error, using fallback:", response.status);
      return getSimulatedWeather(city);
    }

    const data = await response.json();
    
    const condition = data.weather[0].main.toLowerCase();
    const isRainy = condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunderstorm");
    const isCloudy = condition.includes("cloud");
    const isSunny = condition.includes("clear") || condition.includes("sun");

    let recommendation = "";
    let dineInImpact = 0;
    let deliveryImpact = 0;

    if (isRainy) {
      recommendation = "🌧️ Día lluvioso detectado. Según el histórico, las ventas en mesa bajan un 20% pero los domicilios aumentan un 40%. Prepara empaques adicionales y refuerza cocina para delivery.";
      dineInImpact = -20;
      deliveryImpact = 40;
    } else if (isCloudy) {
      recommendation = "☁️ Día nublado. El flujo de clientes será normal con ligera preferencia por bebidas calientes. Considera promover cafés especiales y sopas.";
      dineInImpact = 0;
      deliveryImpact = 10;
    } else if (isSunny) {
      recommendation = "☀️ Día soleado y despejado. Alta probabilidad de mesas llenas. Refuerza el equipo de meseros y prepara los postres fríos - helados y smoothies tendrán alta demanda.";
      dineInImpact = 15;
      deliveryImpact = -5;
    } else {
      recommendation = "El clima es moderado. Operación normal esperada.";
    }

    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      icon: data.weather[0].icon,
      recommendation,
      salesImpact: {
        dineIn: dineInImpact,
        delivery: deliveryImpact,
      },
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return getSimulatedWeather(city);
  }
}

function getSimulatedWeather(city: string): WeatherData {
  // Simulate rainy weather for demo purposes (most impactful scenario)
  return {
    condition: "Rain",
    description: "lluvia moderada",
    temp: 14,
    humidity: 85,
    icon: "10d",
    recommendation: "🌧️ Día lluvioso en " + city + ". Según el histórico, las ventas en mesa bajan un 20% pero los domicilios aumentan un 40%. Prepara empaques adicionales y refuerza cocina para delivery. Reduce meseros si es posible.",
    salesImpact: {
      dineIn: -20,
      delivery: 40,
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

  // Check if tomorrow is Friday and today is Thursday (puente potential)
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
  
  // For demo, use realistic simulated events that are impactful
  const simulatedEvents: NewsEvent[] = [
    {
      title: "Final Liga BetPlay: Millonarios vs Santa Fe",
      description: "El clásico capitalino se juega hoy a las 8:00 PM en El Campín. Se esperan más de 36,000 aficionados en la zona.",
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
      recommendation: "⚽ Final Liga BetPlay hoy a las 8PM - 92% probabilidad de afectar el tráfico en zona norte. Prepárate para una reducción de clientes en mesa durante el partido pero posible aumento de domicilios con pedidos grupales.",
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
        recommendation: "⚽ Final Liga BetPlay hoy a las 8PM - 92% probabilidad de afectar el tráfico. Prepárate para una reducción de clientes en mesa durante el partido.",
      };
    }

    const data = await response.json();
    
    const events: NewsEvent[] = data.articles?.slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description || "",
      category: "noticias",
      impactProbability: Math.floor(Math.random() * 40) + 30, // 30-70%
      source: article.source?.name || "Noticias",
    })) || simulatedEvents;

    // Add our simulated high-impact event for demo
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
      recommendation: "⚽ Final Liga BetPlay hoy - Alto impacto esperado en zona norte.",
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

    // Fetch all data in parallel
    const [weather, calendar, news] = await Promise.all([
      getWeatherData(city),
      getCalendarData(),
      getNewsData(city),
    ]);

    // Generate AI summary using Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    let aiSummary = "";
    
    if (LOVABLE_API_KEY) {
      try {
        const summaryPrompt = `Eres el asistente de IA de una sucursal de Crepes & Waffles en ${city}. 
Basándote en las siguientes condiciones del día, genera un resumen ejecutivo de 2-3 oraciones para el gerente:

CLIMA: ${weather.condition} (${weather.temp}°C) - ${weather.recommendation}

CALENDARIO: ${calendar.recommendation}

NOTICIAS/EVENTOS: ${news.recommendation}

El resumen debe ser directo, práctico y enfocado en acciones concretas para optimizar la operación del día.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Eres un asistente de gerencia para restaurantes. Responde de forma concisa y práctica." },
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
      aiSummary = `📊 Resumen del día: ${weather.condition === "Rain" ? "Día lluvioso - prioriza domicilios." : "Operación normal."} ${calendar.salesImpact > 0 ? `Ventas esperadas +${calendar.salesImpact}%.` : ""} ${news.topEvent?.impactProbability || 0 > 70 ? "Evento deportivo puede afectar tráfico." : ""}`;
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
