import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildSuggestionFlow, SuggestionFragments } from "../_shared/suggestionFlow.ts";

// ==================== CONFIGURATION ====================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GLOBAL_WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const GLOBAL_WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";
const WA_API_VERSION = "v22.0";
// Multi-tenant: no hardcoded restaurant IDs

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Structured tenant-aware logger ──
function tlog(level: "info" | "warn" | "error", rid: string, msg: string, data?: any) {
  const prefix = `[${rid?.substring(0, 8) || "NO_TENANT"}]`;
  const payload = data ? ` ${JSON.stringify(data)}` : "";
  if (level === "error") console.error(`${prefix} ${msg}${payload}`);
  else if (level === "warn") console.warn(`${prefix} ${msg}${payload}`);
  else console.log(`${prefix} ${msg}${payload}`);
}

// ── In-memory rate limiter per phone+tenant (resets on cold start) ──
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // max messages per minute per phone
const RATE_WINDOW_MS = 60_000;

function isRateLimited(phone: string, tenantId: string): boolean {
  const key = `${tenantId}:${phone}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count++;
  if (bucket.count > RATE_LIMIT) return true;
  return false;
}
// Periodic cleanup to prevent memory leak (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (now > v.resetAt) rateBuckets.delete(k);
  }
}, 5 * 60_000);

// ==================== CONSTANTS ====================
const FINAL_ORDER_STATUSES = ["confirmed", "emailed", "sent"];

// ==================== UTILITY FUNCTIONS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Human-like typing delay based on message length */
function humanDelay(text: string): number {
  const len = text.length;
  if (len < 50) return 2000 + Math.random() * 1000;
  if (len < 150) return 3000 + Math.random() * 2000;
  return 4000 + Math.random() * 2000;
}

/** Parse "UTC-5", "UTC+1" etc. into offset hours */
function parseTimezoneOffset(tz: string): number {
  if (!tz) return -5;
  const match = tz.match(/^UTC([+-]?\d+)$/i);
  return match ? parseInt(match[1]) : -5;
}

/** Get current Date shifted to a given UTC offset (pure arithmetic, no getTimezoneOffset) */
function getRestaurantTime(offsetHours: number): Date {
  const nowUTC = Date.now();
  return new Date(nowUTC + offsetHours * 3600000);
}

/** Get "YYYY-MM-DD" in restaurant's timezone */
function getRestaurantDate(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  return local.toISOString().split("T")[0];
}

/** Get time info using restaurant's configured timezone */
function getRestaurantTimeInfo(config: any) {
  const tz = config?.operating_hours?.timezone || "UTC-5";
  const offset = parseTimezoneOffset(tz);
  const local = getRestaurantTime(offset);
  const h = local.getHours();
  const m = local.getMinutes();
  const d = local.getDay();
  return { hour: h, minute: m, day: d, weekend: d === 5 || d === 6, decimal: h + m / 60 };
}

/** Check if current time is within peak hours using structured config */
function isPeakNow(hours: any): boolean {
  try {
    const { peak_days, peak_hour_start, peak_hour_end } = hours || {};
    if (!peak_days?.length || !peak_hour_start || !peak_hour_end) return false;
    const dayMap: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miercoles: 3,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      sábado: 6,
    };
    const { day, hour, minute } = getRestaurantTimeInfo(hours ? { operating_hours: hours } : {});
    const isDay = peak_days.some((d: string) => dayMap[d.toLowerCase()] === day);
    if (!isDay) return false;
    const parse24 = (s: string): number => {
      const parts = s.split(":");
      const h = parseInt(parts[0]);
      const m = parts.length > 1 ? parseInt(parts[1]) : 0;
      if (isNaN(h) || isNaN(m)) return -1;
      return h * 60 + m;
    };
    const start = parse24(peak_hour_start);
    const end = parse24(peak_hour_end);
    if (start < 0 || end < 0) return false;
    const now = hour * 60 + minute;
    return now >= start && now <= end;
  } catch (e) {
    console.warn("⚠️ isPeakNow failed, defaulting to false:", e);
    return false;
  }
}

/** Convert "HH:MM" to total minutes for precise schedule comparison */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Check if the restaurant is currently within service hours */
function isRestaurantOpen(config: any): { isOpen: boolean; isPreOrder: boolean; preOrderMessage: string } {
  const hours = config?.operating_hours || {};
  if (!hours.open_time || !hours.close_time) {
    console.error("⚠️ isRestaurantOpen: missing open_time or close_time, defaulting to CLOSED");
    return { isOpen: false, isPreOrder: false, preOrderMessage: "" };
  }

  const { hour, minute } = getRestaurantTimeInfo(config);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const schedStart = hours.schedule_start || hours.open_time;
  const schedStartMin = timeToMinutes(schedStart);
  const isPreOrder = isOpen && currentMinutes < schedStartMin;
  const preOrderMessage = hours.pre_order_message || `Tomamos tu pedido, pero empezamos a atender a las ${schedStart}`;

  return { isOpen, isPreOrder, preOrderMessage };
}

// ==================== SYSTEM OVERRIDES ====================

async function getActiveOverrides(restaurantId: string): Promise<any[]> {
  try {
    const { data } = await supabase
      .from("system_overrides")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .lte("start_time", new Date().toISOString())
      .gte("end_time", new Date().toISOString());
    return data || [];
  } catch (e) {
    console.warn("⚠️ getActiveOverrides failed, defaulting to []:", e);
    return [];
  }
}

function getDisabledProductIds(overrides: any[]): Set<string> {
  return new Set(
    overrides
      .filter((o) => o.type === "disable" && o.target_type === "product" && o.product_id)
      .map((o) => o.product_id),
  );
}

function getPriceOverrides(overrides: any[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of overrides) {
    if (o.type === "price_override" && o.target_type === "product" && o.product_id) {
      const price = parseFloat(o.value);
      if (!isNaN(price) && price > 0) map.set(o.product_id, price);
    }
  }
  return map;
}

function isRestaurantClosedOverride(overrides: any[]): boolean {
  return overrides.some((o) => o.type === "disable" && o.target_type === "restaurant" && o.value === "closed");
}

/** Encapsulated restaurant availability check with 5-tier priority */
function checkRestaurantAvailability(
  config: any,
  activeOverrides: any[],
  dailyOverrides: any[],
): { blocked: boolean; message: string } {
  const hours = config?.operating_hours || {};
  const tz = hours.timezone || "UTC-5";
  const offset = parseTimezoneOffset(tz);
  const now = getRestaurantTime(offset);
  const nowH = now.getHours();
  const nowM = now.getMinutes();
  const nowMinutes = nowH * 60 + nowM;

  const dayMap: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };
  const currentDay = now.getDay();

  const fmt12 = (t: string): string => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${(m || 0).toString().padStart(2, "0")} ${suffix}`;
  };

  // --- Priority 1: system_overrides (restaurant closed) ---
  if (isRestaurantClosedOverride(activeOverrides)) {
    const closedOverride = activeOverrides.find(
      (o) => o.type === "disable" && o.target_type === "restaurant" && o.value === "closed",
    );
    if (closedOverride?.end_time) {
      const endLocal = new Date(new Date(closedOverride.end_time).getTime() + offset * 3600000);
      const endH = endLocal.getHours();
      const endM = endLocal.getMinutes();
      const endMinutes = endH * 60 + endM;
      // Determine the effective closing boundary
      const schedEnd = hours.schedule_end || hours.close_time || null;
      const closeBoundary = schedEnd ? timeToMinutes(schedEnd) : null;
      if (endMinutes > nowMinutes) {
        // If override ends after the service window, don't say "reopening at 11:59 PM"
        if (closeBoundary && endMinutes >= closeBoundary) {
          const tomorrowLabel = hours.accept_pre_orders
            ? hours.open_time || hours.schedule_start || ""
            : hours.schedule_start || hours.open_time || "";
          return {
            blocked: true,
            message: `El restaurante está cerrado por hoy.\nNuestro horario es hasta las ${fmt12(schedEnd)}. ¡Te esperamos mañana${tomorrowLabel ? ` desde las ${fmt12(tomorrowLabel)}` : ""}! 🙏`,
          };
        }
        const endStr = fmt12(`${endH}:${endM}`);
        return {
          blocked: true,
          message: `El restaurante está cerrado en este momento.\nAbriremos nuevamente a las ${endStr}. ¡Te esperamos! 🙏`,
        };
      }
      // endMinutes <= nowMinutes → override expired locally, don't block
      console.log(
        `Closure override expired (end ${endH}:${endM} <= now ${Math.floor(nowMinutes / 60)}:${nowMinutes % 60}), skipping block`,
      );
    } else {
      // No end_time at all → indefinite closure for today
      return { blocked: true, message: "Hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏" };
    }
  }

  // --- Priority 2: daily_overrides (restaurant closed) ---
  const todayStr = getRestaurantDate(offset);
  const activeDailyClosures = (dailyOverrides || []).filter((o: any) => {
    if (o.type !== "schedule_change") return false;
    if (!/closed/i.test(o.value || "")) return false;
    if (o.expires && o.expires < todayStr) return false;
    if (o.start_hour) {
      const [sh, sm] = o.start_hour.split(":").map(Number);
      if (nowMinutes < sh * 60 + (sm || 0)) return false;
    }
    if (o.until_hour) {
      const [uh, um] = o.until_hour.split(":").map(Number);
      if (nowMinutes > uh * 60 + (um || 0)) return false;
    }
    return true;
  });

  if (activeDailyClosures.length > 0) {
    const closure = activeDailyClosures[0];
    if (closure.until_hour) {
      const untilMin = timeToMinutes(closure.until_hour);
      const schedEnd = hours.schedule_end || hours.close_time || null;
      const closeBoundary = schedEnd ? timeToMinutes(schedEnd) : null;
      // If until_hour is after closing, don't give a misleading reopen time
      if (closeBoundary && untilMin >= closeBoundary) {
        const tomorrowLabel = hours.accept_pre_orders
          ? hours.open_time || hours.schedule_start || ""
          : hours.schedule_start || hours.open_time || "";
        return {
          blocked: true,
          message: `El restaurante está cerrado por hoy.\nNuestro horario es hasta las ${fmt12(schedEnd)}. ¡Te esperamos mañana${tomorrowLabel ? ` desde las ${fmt12(tomorrowLabel)}` : ""}! 🙏`,
        };
      }
      return {
        blocked: true,
        message: `El restaurante está cerrado en este momento.\nAbriremos nuevamente a las ${fmt12(closure.until_hour)}. ¡Te esperamos! 🙏`,
      };
    }
    return { blocked: true, message: "Hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏" };
  }

  // --- Priority 3: Check valid day ---
  const days = hours.days;
  if (Array.isArray(days) && days.length > 0) {
    const dayOpen = days.some((d: string) => dayMap[d.toLowerCase()] === currentDay);
    if (!dayOpen) {
      const dayNames = days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
      return {
        blocked: true,
        message: `Hoy el restaurante no está abierto.\nNuestros días de atención son: ${dayNames}. ¡Te esperamos! 🙏`,
      };
    }
  }

  // --- Priority 4: open_time / close_time ---
  if (hours.open_time && hours.close_time) {
    const openMin = timeToMinutes(hours.open_time);
    const closeMin = timeToMinutes(hours.close_time);

    if (nowMinutes < openMin) {
      return {
        blocked: true,
        message: `El restaurante aún no está abierto.\nAbrimos a las ${fmt12(hours.open_time)}. ¡Te esperamos! 🙏`,
      };
    }
    if (nowMinutes >= closeMin) {
      return {
        blocked: true,
        message: `El restaurante ya cerró por hoy.\nNuestro horario es de ${fmt12(hours.open_time)} a ${fmt12(hours.close_time)}. ¡Te esperamos mañana! 🙏`,
      };
    }
  }

  // --- Priority 5: schedule_start / schedule_end (with override support) ---
  let effectiveScheduleStart = hours.schedule_start || null;
  let effectiveScheduleEnd = hours.schedule_end || null;

  // daily_overrides can override schedule_start/schedule_end
  for (const o of dailyOverrides || []) {
    if (o.expires && o.expires < todayStr) continue;
    if (o.type === "schedule_change" && o.schedule_start) effectiveScheduleStart = o.schedule_start;
    if (o.type === "schedule_change" && o.schedule_end) effectiveScheduleEnd = o.schedule_end;
  }

  // system_overrides can override schedule_start/schedule_end (highest priority)
  for (const o of activeOverrides) {
    if (o.type === "schedule_start") effectiveScheduleStart = o.value;
    if (o.type === "schedule_end") effectiveScheduleEnd = o.value;
  }

  if (effectiveScheduleStart) {
    const schedStartMin = timeToMinutes(effectiveScheduleStart);
    if (nowMinutes < schedStartMin) {
      // If accept_pre_orders is true and we're within open hours, let the flow continue
      if (hours.accept_pre_orders && hours.open_time) {
        const openMin = timeToMinutes(hours.open_time);
        if (nowMinutes >= openMin) {
          // Allow pre-orders — the AI prompt (scheduleBlock) will handle the messaging
          return { blocked: false, message: "" };
        }
      }
      return {
        blocked: true,
        message: `El restaurante ya está abierto, pero comenzamos a atender pedidos a las ${fmt12(effectiveScheduleStart)}. ¡Te esperamos! 🙏`,
      };
    }
  }

  if (effectiveScheduleEnd) {
    const schedEndMin = timeToMinutes(effectiveScheduleEnd);
    if (nowMinutes >= schedEndMin) {
      const startLabel = effectiveScheduleStart || hours.open_time || "";
      return {
        blocked: true,
        message: `Ya no estamos recibiendo pedidos por hoy.\nNuestro horario de atención es de ${fmt12(startLabel)} a ${fmt12(effectiveScheduleEnd)}. ¡Te esperamos mañana! 🙏`,
      };
    }
  }

  return { blocked: false, message: "" };
}

function isDeliveryDisabledOverride(overrides: any[]): boolean {
  return overrides.some((o) => o.type === "disable" && o.value === "no_delivery");
}

function isPickupDisabledOverride(overrides: any[]): boolean {
  return overrides.some(
    (o) =>
      o.type === "disable" && (o.target_type === "pickup" || (o.target_type === "delivery" && o.value === "no_pickup")),
  );
}

function buildServiceBlockMessage(overrides: any[], serviceType: "delivery" | "pickup", config: any): string {
  const isDelivery = serviceType === "delivery";
  const override = overrides.find((o) =>
    isDelivery
      ? o.type === "disable" && o.value === "no_delivery"
      : o.type === "disable" &&
        (o.target_type === "pickup" || (o.target_type === "delivery" && o.value === "no_pickup")),
  );

  const serviceName = isDelivery ? "domicilio" : "recogida";
  const altService = isDelivery ? "recoger en el local" : "domicilio";
  const altQuestion = isDelivery ? "¿Te gustaría recogerlo en el local?" : "¿Te gustaría pedirlo a domicilio?";

  if (override?.end_time) {
    const hours = config?.operating_hours || {};
    const tz = hours.timezone || "UTC-5";
    const offset = parseTimezoneOffset(tz);
    const endLocal = new Date(new Date(override.end_time).getTime() + offset * 3600000);
    const endH = endLocal.getHours();
    const endM = endLocal.getMinutes();
    const suffix = endH >= 12 ? "PM" : "AM";
    const h12 = endH % 12 || 12;
    const endStr = endM > 0 ? `${h12}:${String(endM).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;

    // Check if end_time is at or after restaurant closing → "all day"
    const schedEnd = hours.schedule_end || hours.close_time;
    if (schedEnd) {
      const [seH, seM] = schedEnd.split(":").map(Number);
      if (endH * 60 + endM >= seH * 60 + (seM || 0)) {
        return `Lo siento, hoy no tenemos servicio de ${serviceName} 🚫 Solo estamos manejando pedidos para ${altService}. ${altQuestion}`;
      }
    }
    return `Lo siento, no tenemos servicio de ${serviceName} hasta las ${endStr} 🚫 ${altQuestion}`;
  }

  return `Lo siento, hoy no tenemos servicio de ${serviceName} 🚫 Solo estamos manejando pedidos para ${altService}. ${altQuestion}`;
}

function applyOverridesToProducts(products: any[], overrides: any[]): any[] {
  const disabledIds = getDisabledProductIds(overrides);
  const priceMap = getPriceOverrides(overrides);
  return products
    .filter((p: any) => !disabledIds.has(p.id))
    .map((p: any) => (priceMap.has(p.id) ? { ...p, price: priceMap.get(p.id) } : p));
}

function buildOverridePromptBlock(allProducts: any[], overrides: any[]): string {
  const disabledIds = getDisabledProductIds(overrides);
  const priceMap = getPriceOverrides(overrides);
  let block = "";
  const disabledNames = allProducts.filter((p) => disabledIds.has(p.id)).map((p) => p.name);
  if (disabledNames.length > 0) {
    block += `\nPRODUCTOS NO DISPONIBLES HOY (SISTEMA): ${disabledNames.join(", ")}. NO los ofrezcas bajo ninguna circunstancia.\n`;
  }
  const priceChanges: string[] = [];
  for (const [id, price] of priceMap) {
    const prod = allProducts.find((p) => p.id === id);
    if (prod) priceChanges.push(`${prod.name}: $${price}`);
  }
  if (priceChanges.length > 0) {
    block += `\nPRECIOS TEMPORALES HOY (SISTEMA): ${priceChanges.join(", ")}. Usa ESTOS precios.\n`;
  }
  if (isDeliveryDisabledOverride(overrides)) {
    const delOv = overrides.find((o) => o.type === "disable" && o.value === "no_delivery");
    const timeNote = delOv?.end_time ? " El servicio de domicilio vuelve más tarde hoy." : "";
    block += `\nSERVICIO DE DOMICILIO NO DISPONIBLE (SISTEMA): NO ofrezcas domicilio. Si el cliente pide domicilio, dile que no está disponible.${timeNote}\n`;
  }
  if (isPickupDisabledOverride(overrides)) {
    const pickOv = overrides.find(
      (o) =>
        o.type === "disable" &&
        (o.target_type === "pickup" || (o.target_type === "delivery" && o.value === "no_pickup")),
    );
    const timeNote = pickOv?.end_time ? " El servicio de recogida vuelve más tarde hoy." : "";
    block += `\nRECOGIDA NO DISPONIBLE (SISTEMA): NO ofrezcas recogida en el local. Si el cliente quiere recoger, dile que no está disponible.${timeNote}\n`;
  }
  return block;
}

// ==================== MEDIA HANDLING ====================

/** Download media from WhatsApp, upload to Supabase Storage, return public URL */
async function downloadAndUploadMedia(
  mediaId: string,
  token: string,
  folder: string,
  defaultMime: string,
): Promise<string | null> {
  try {
    // Step 1: Get media URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!metaRes.ok) {
      console.error(`Media meta error (${folder}):`, await metaRes.text());
      return null;
    }
    const metaData = await metaRes.json();
    if (!metaData.url) return null;

    // Step 2: Download the binary
    const dlRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!dlRes.ok) {
      console.error(`Media download error (${folder}):`, await dlRes.text());
      return null;
    }
    const blob = await dlRes.blob();
    const mime = metaData.mime_type || defaultMime;

    // Determine file extension from MIME
    let ext = "bin";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
    else if (mime.includes("mp4")) ext = "m4a";
    else if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("webp")) ext = "webp";

    const fileName = `${folder}/${Date.now()}-${mediaId}.${ext}`;

    // Step 3: Upload to Supabase Storage
    const { error } = await supabase.storage.from("whatsapp-media").upload(fileName, blob, {
      contentType: mime,
      upsert: true,
    });
    if (error) {
      console.error(`Storage upload error (${folder}):`, error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("whatsapp-media").getPublicUrl(fileName);
    console.log(`${folder} uploaded:`, urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    console.error(`Media handling failed (${folder}):`, e);
    return null;
  }
}

/** Transcribe audio using Lovable AI Gateway (Gemini) */
async function transcribeAudio(audioUrl: string): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for audio transcription");
      return null;
    }

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) return null;
    const audioBlob = await audioRes.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = audioBlob.type || "audio/ogg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Eres un transcriptor de audio. Tu ÚNICA tarea es transcribir exactamente lo que dice la persona. Devuelve SOLO el texto transcrito. Si no entiendes, responde: NO_ENTENDIDO",
          },
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: { data: base64Audio, format: mimeType.includes("mp4") ? "m4a" : "ogg" },
              },
              { type: "text", text: "Transcribe este audio de WhatsApp." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Transcription AI error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content?.trim();
    if (!transcription || transcription === "NO_ENTENDIDO") return null;
    return transcription;
  } catch (e) {
    console.error("Transcription failed:", e);
    return null;
  }
}

// ==================== WHATSAPP API ====================

/** Split long text into human-like message chunks */
function fixOrphanedPunctuation(chunks: string[]): string[] {
  for (let i = 1; i < chunks.length; i++) {
    const match = chunks[i].match(/^(\s*[?!¡¿]+\s*)/);
    if (match) {
      chunks[i - 1] = chunks[i - 1].trimEnd() + match[1].trim();
      chunks[i] = chunks[i].substring(match[0].length).trim();
    }
  }
  return chunks.filter((c) => c.length > 0);
}

function splitIntoHumanChunks(text: string): string[] {
  if (text.length <= 200) return [text];
  const parts = text.split(/\n\n+/).filter((p) => p.trim());
  if (parts.length >= 2 && parts.length <= 4) {
    return fixOrphanedPunctuation(parts.map((p) => p.trim()));
  }
  const lines = text.split(/\n/).filter((p) => p.trim());
  if (lines.length >= 2) {
    const mid = Math.ceil(lines.length / 2);
    const chunks = [lines.slice(0, mid).join("\n"), lines.slice(mid).join("\n")].filter((p) => p.trim());
    return fixOrphanedPunctuation(chunks);
  }
  return [text];
}

/** Send a plain text message via WhatsApp Cloud API */
async function sendWA(phoneId: string, token: string, to: string, text: string, addHumanDelay = false) {
  const chunks = splitIntoHumanChunks(text);

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];

    /* if (addHumanDelay) {
      const delay = i === 0 ? humanDelay(c) : 1500 + Math.random() * 1000;
      console.log(`⏳ Human delay: ${Math.round(delay)}ms before chunk ${i + 1}/${chunks.length}`);
      await sleep(delay);
    }*/

    // Handle WA 4096 char limit per message
    let rem = c;
    while (rem.length > 0) {
      let segment: string;
      if (rem.length <= 4000) {
        segment = rem;
        rem = "";
      } else {
        let s = rem.lastIndexOf("\n", 4000);
        if (s < 2000) s = rem.lastIndexOf(". ", 4000);
        if (s < 2000) s = 4000;
        segment = rem.substring(0, s);
        rem = rem.substring(s).trim();
        // Fix orphaned punctuation at segment boundary
        const orphanMatch = rem.match(/^([?!¡¿]+\s*)/);
        if (orphanMatch) {
          segment = segment.trimEnd() + orphanMatch[1].trim();
          rem = rem.substring(orphanMatch[0].length).trim();
        }
      }

      const r = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: segment } }),
      });
      if (!r.ok) console.error("WA send error:", await r.text());
    }
  }
}

/** Send an interactive button message via WhatsApp Cloud API */
async function sendWAInteractive(
  phoneId: string,
  token: string,
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  addHumanDelay = false,
) {
  if (addHumanDelay) {
    const delay = humanDelay(bodyText);
    console.log(`⏳ Human delay: ${Math.round(delay)}ms before interactive message`);
    await sleep(delay);
  }

  // WhatsApp limits: max 3 buttons, body max 1024 chars, button title max 20 chars
  const trimmedBody = bodyText.substring(0, 1024);
  const trimmedButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title.substring(0, 20) },
  }));

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: trimmedBody },
      action: { buttons: trimmedButtons },
    },
  };

  console.log(`📱 Sending interactive buttons to ${to}:`, buttons.map((b) => b.title).join(", "));
  const r = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const errText = await r.text();
    console.error("WA interactive error:", errText);
    // Fallback to plain text if interactive fails
    console.log("⚠️ Falling back to plain text message");
    await sendWA(
      phoneId,
      token,
      to,
      bodyText + "\n\nResponde:\n1️⃣ Confirmar\n2️⃣ Agregar más\n3️⃣ Cancelar",
      addHumanDelay,
    );
  }
}

/** Mark message as read */
async function markRead(phoneId: string, token: string, msgId: string) {
  await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: msgId }),
  });
}

// ==================== CONVERSATION MANAGEMENT ====================

/** Detect if text is a greeting that starts a new conversation cycle */
function isGreetingMessage(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase().replace(/[!¡?¿.,;:\s]+/g, " ").trim();
  return /^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|hi|hello|ey|epa|alo|aló|qué tal|que tal|buenas buenas)(\s|$)/i.test(t);
}

/** Get or create a conversation record.
 * If the existing conversation has a closed order (confirmed/emailed/sent),
 * reset it so recurring customers can place a NEW order without any block.
 * Also resets on greeting after inactivity to prevent stale context bias.
 * Idempotency still applies per order_id — not per phone/customer. */
async function getConversation(rid: string, phone: string, incomingText?: string) {
  const { data: ex } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("restaurant_id", rid)
    .eq("customer_phone", phone)
    .maybeSingle();

  if (ex) {
    // Pedido anterior ya cerrado → resetear para permitir nuevo pedido independiente
    if (FINAL_ORDER_STATUSES.includes(ex.order_status)) {
      const { data: reset } = await supabase
        .from("whatsapp_conversations")
        .update({
          order_status: "none",
          current_order: null,
          pending_since: null,
          payment_proof_url: null,
        })
        .eq("id", ex.id)
        .select()
        .single();
      console.log(`🔄 CONV_RESET: ${phone} retorna tras pedido cerrado (${ex.order_status}) → estado fresco`);
      return reset || ex;
    }

    // Greeting after inactivity → reset context to prevent stale history bias
    if (incomingText && isGreetingMessage(incomingText)) {
      const lastActivity = ex.updated_at ? new Date(ex.updated_at).getTime() : 0;
      const minutesSinceLastActivity = (Date.now() - lastActivity) / 60000;
      const isPendingConfirmation = ex.order_status === "pending_confirmation";
      // Reset if 15+ minutes of inactivity AND no pending confirmation
      if (minutesSinceLastActivity >= 15 && !isPendingConfirmation) {
        const { data: reset } = await supabase
          .from("whatsapp_conversations")
          .update({
            order_status: "none",
            current_order: null,
            pending_since: null,
            payment_proof_url: null,
            messages: [], // Clear history to prevent greeting-loop bias
          })
          .eq("id", ex.id)
          .select()
          .single();
        console.log(`🔄 GREETING_RESET: ${phone} greeted after ${Math.round(minutesSinceLastActivity)}min inactivity → fresh context`);
        return reset || ex;
      }
    }

    return ex;
  }

  // Nueva conversación
  const { data: cr, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ restaurant_id: rid, customer_phone: phone, messages: [], order_status: "none" })
    .select()
    .single();
  if (error) throw error;
  return cr;
}


// ==================== WA CUSTOMER MEMORY ====================

/**
 * Get (or create+backfill) a customer memory profile.
 * - On first visit: backfills from whatsapp_orders history (max 5 orders).
 * - On return visits: returns the existing profile immediately.
 * This function NEVER throws — returns null on any error so the main flow is never blocked.
 */
async function getOrCreateWaCustomer(phone: string, rid: string): Promise<any | null> {
  try {
    // 1. Try to fetch existing profile
    const { data: existing } = await supabase
      .from("wa_customer_profiles")
      .select("*")
      .eq("restaurant_id", rid)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      console.log(`👤 WA_PROFILE_HIT: ${phone} → name=${existing.name}, addresses=${existing.addresses?.length || 0}`);
      return existing;
    }

    // 2. First visit — backfill from order history
    const { data: pastOrders } = await supabase
      .from("whatsapp_orders")
      .select("customer_name, delivery_address, created_at")
      .eq("restaurant_id", rid)
      .eq("customer_phone", phone)
      .not("delivery_address", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    const name: string | null = pastOrders?.[0]?.customer_name || null;
    const addresses: any[] = [];
    const seen = new Set<string>();
    for (const o of pastOrders || []) {
      const addr = (o.delivery_address || "").trim();
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        addresses.push({ address: addr, label: null, last_used_at: o.created_at });
      }
    }

    const { data: created } = await supabase
      .from("wa_customer_profiles")
      .upsert(
        {
          restaurant_id: rid,
          phone,
          name,
          addresses,
          total_orders: pastOrders?.length || 0,
          last_order_at: pastOrders?.[0]?.created_at || null,
        },
        { onConflict: "restaurant_id,phone" },
      )
      .select()
      .single();

    console.log(`👤 WA_PROFILE_CREATED: ${phone} → name=${name}, addresses=${addresses.length} (backfilled)`);
    return created || null;
  } catch (err) {
    console.error(`👤 WA_PROFILE_ERROR: ${phone} — ${err}`);
    return null; // Never block main flow
  }
}

/**
 * Update customer profile after an order is confirmed.
 * - Upserts the delivery address into the addresses array.
 * - Sorts addresses by last_used_at descending.
 * - Keeps max 5 unique addresses (oldest removed if needed).
 * This function NEVER throws — called fire-and-forget from saveOrder().
 */
async function updateWaCustomerProfile(
  phone: string,
  rid: string,
  name: string | null,
  deliveryAddress: string | null,
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("wa_customer_profiles")
      .select("*")
      .eq("restaurant_id", rid)
      .eq("phone", phone)
      .maybeSingle();

    const now = new Date().toISOString();
    const existingAddresses: any[] = profile?.addresses || [];

    let newAddresses = [...existingAddresses];
    if (deliveryAddress && deliveryAddress.trim()) {
      const addr = deliveryAddress.trim();
      // Remove if already exists (we'll re-add with fresh last_used_at)
      newAddresses = newAddresses.filter((a: any) => a.address !== addr);
      newAddresses.unshift({ address: addr, label: null, last_used_at: now });
      // Keep max 5 unique addresses
      newAddresses = newAddresses.slice(0, 5);
    }

    await supabase.from("wa_customer_profiles").upsert(
      {
        restaurant_id: rid,
        phone,
        name: name || profile?.name || null,
        addresses: newAddresses,
        last_order_at: now,
        total_orders: (profile?.total_orders || 0) + 1,
      },
      { onConflict: "restaurant_id,phone" },
    );

    console.log(`👤 WA_PROFILE_UPDATED: ${phone} → name=${name}, addr=${deliveryAddress || "pickup"}`);
  } catch (err) {
    console.error(`👤 WA_PROFILE_UPDATE_ERROR: ${phone} — ${err}`);
    // Never block — order already confirmed and email already sent
  }
}

/**
 * Build a memory context block to inject into the prompt.
 * Returns an empty string for new customers (no changes to flow).
 *
 * Casos:
 *   A: nombre + 1 dirección  → pregunta si es la misma o es otra
 *   B: nombre + 2+ dir       → ofrece elegir entre las 2 últimas (max)
 *   C: nombre sin dirección  → usa nombre, pide dirección normalmente
 *   D: sin nada              → retorna "" (flujo normal sin cambios)
 */
function buildCustomerMemoryContext(customer: any | null): string {
  if (!customer) return "";
  const { name, addresses } = customer;

  const hasName = !!(name && name.trim() && name !== "Cliente WhatsApp" && name !== "Cliente");
  const activeAddresses: any[] = Array.isArray(addresses) ? addresses.slice(0, 2) : []; // Max 2 para el prompt

  if (!hasName && activeAddresses.length === 0) return ""; // Caso D — cliente completamente nuevo

  const lines: string[] = [];
  lines.push("--- MEMORIA CLIENTE RECURRENTE ---");

  if (hasName) {
    lines.push(`- Nombre conocido: "${name}" → Ya tienes su nombre. NO lo pidas. Úsalo directamente.`);
  }

  if (activeAddresses.length === 1) {
    // Caso A
    const addr = activeAddresses[0].address;
    lines.push(`- Dirección guardada: "${addr}" (última usada).`);
    lines.push(`- Cuando llegue el paso de dirección (pedido domicilio), pregunta EXACTAMENTE:`);
    lines.push(`  "¿Te lo envío a ${addr} como la última vez o es otra dirección?"`);
    lines.push(`- Si confirma ("sí", "la misma", "esa", etc.) → usa "${addr}" como delivery_address.`);
    lines.push(`- Si dice otra → pídela y úsala. El sistema la guarda automáticamente.`);
  } else if (activeAddresses.length >= 2) {
    // Caso B
    const addr1 = activeAddresses[0].address;
    const addr2 = activeAddresses[1].address;
    // Acortar para el mensaje (primeras 25 chars + "...")
    const short1 = addr1.length > 30 ? addr1.substring(0, 28) + "…" : addr1;
    const short2 = addr2.length > 30 ? addr2.substring(0, 28) + "…" : addr2;
    lines.push(`- Direcciones guardadas:`);
    lines.push(`  1. "${addr1}" (última usada)`);
    lines.push(`  2. "${addr2}"`);
    lines.push(`- Cuando llegue el paso de dirección (pedido domicilio), pregunta:`);
    lines.push(`  "¿A dónde te lo envío: ${short1} o ${short2}? Si es otra, me la mandas."`);
    lines.push(`- Máximo 2 opciones. NO listar más. Si dice número → usa la dirección completa correspondiente.`);
    lines.push(`- Si dice "otra" o da una nueva → pídela y úsala.`);
  } else if (hasName && activeAddresses.length === 0) {
    // Caso C — solo nombre
    lines.push(`- Sin dirección guardada → pedir normalmente cuando corresponda al domicilio.`);
  }

  lines.push(`- REGLA: Si el pedido es para recoger (pickup), NO preguntes por dirección.`);
  lines.push(`- REGLA: Máximo 1 pregunta por mensaje. Nada de menús largos.`);
  lines.push("--- FIN MEMORIA ---");

  return "\n\n" + lines.join("\n");
}

// ==================== AI PROMPT BUILDING ====================

/**
 * CORE SYSTEM PROMPT — Conektao immutable rules.
 * NOT editable by clients. Contains identity, anti-hallucination, flow, and format rules.
 * This is the "DNA" of every Alicia instance.
 */
function buildCoreSystemPrompt(assistantName: string, escalationPhone: string, suggestConfigs?: any, greetingMessage?: string): string {
  const sf = buildSuggestionFlow(suggestConfigs || {}, greetingMessage);
  const globalRulesBlock = sf.globalRules ? `\n${sf.globalRules}\n` : "";
  return `=== CORE CONEKTAO (INMUTABLE) ===

IDENTIDAD:
- Eres ${assistantName}, una IA conversacional de pedidos por WhatsApp
- Eres amable, humana, clara y paciente
- Te enfocas en vender y subir ticket promedio según gustos y presupuesto
- Si preguntan si eres bot → admítelo: "Sí, soy una asistente virtual, pero te atiendo con todo el gusto del mundo 😊"
- NUNCA niegues ser IA. NUNCA digas "soy una persona" ni "soy humana"
- No digas espontáneamente que eres IA

ANTI-ALUCINACIÓN (INQUEBRANTABLE):
- NUNCA inventes productos que no están en el menú
- NUNCA inventes precios. Solo usa los precios del MENÚ OFICIAL
- NUNCA inventes estados de pedidos
- NUNCA inventes información sobre el negocio, sedes o productos
- NUNCA digas que un pedido está listo sin confirmación real del sistema
- NUNCA digas que el domiciliario ya llegó o está en camino
- Si no sabes algo → redirige al número del dueño: ${escalationPhone || "el administrador"}
- NUNCA cambies tamaños que no existen en el menú
- Solo usas productos de base de datos
- Solo usas precios de base de datos
- NUNCA asumas disponibilidad de productos
- No prometas tiempos si no están confirmados
- Siempre recalculas antes de confirmar
- NUNCA mientes
- Si el cliente pregunta cuántas porciones tiene un producto, responde SOLO con el dato del menú. NO inventes porciones

PROHIBIDO DECIR (EN CUALQUIER VARIACIÓN):
- "ya puedes pasar por tu pedido", "tu pedido está listo", "ya está listo", "puedes venir a recogerlo", "ya puedes recogerlo", "está listo para recoger"
- Si tipo = recoger → responde SIEMPRE: "Te avisamos cuando esté listo para recoger 😊"
- NUNCA asumas que un pedido está listo

TRATO AL CLIENTE:
- PROHIBIDO: "mi amor", "mi vida", "cariño", "corazón", "cielo", "linda", "hermosa", "papi", "mami", "reina", "rey". NUNCA apodos cariñosos
- Cuando sepas el nombre → úsalo: "Claro, María" o "Listo, señor Carlos"
- Si NO sabes el nombre → tutea con amabilidad: "Claro, con gusto te ayudo"
- Sé paciente. NUNCA respondas con agresividad ni impaciencia
- Si el cliente dice algo ambiguo → pregunta con amabilidad, no asumas


FORMATO:
- Primera letra MAYÚSCULA siempre. NO punto final. Siempre cierra los signos de interrogación (¿...?) y exclamación (¡...!). Mensajes CORTOS (1-2 líneas). Máximo 1 emoji cada 2-3 mensajes
- NUNCA asteriscos, negritas, markdown. NUNCA "la comunicación puede fallar"
- PROHIBIDO: "oki", "cositas ricas", "delicias", signos dobles (!!)

AUDIOS: "[Audio transcrito]:" → responde natural. "[Audio no transcrito]" → "No te escuché, me lo escribes?"
STICKERS: Responde simpático y redirige al pedido
CONTEXTO: Lee historial COMPLETO. Si ya dieron info, NO la pidas de nuevo. Max 2 veces la misma pregunta
${globalRulesBlock}
FLUJO DE PEDIDO (un paso por mensaje, NO te saltes pasos):
1. Saluda y pregunta qué quiere ${sf.step1}
2. Anota cada producto. Después de cada uno pregunta: "Algo más?"${sf.step2}
3. ${sf.step3}, Cuando diga "no", "eso es todo", "nada más" → pregunta: recoger o domicilio
4. Si domicilio → pide nombre y dirección. Si recoger → pide solo nombre
5. Indica datos de pago
6. Recopila toda la información del pedido (productos, cantidades, tipo de entrega, dirección si aplica, nombre, forma de pago). Cuando tengas TODO listo, genera el tag ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- al final del mensaje. El sistema generará y enviará el resumen automáticamente con los precios correctos. NO escribas un resumen de precios detallado en tu respuesta, solo incluye el tag con el JSON. (Antes de generar el tag, asegúrate de que el restaurante esté ABIERTO)
7. El sistema guarda el pedido y espera confirmación del cliente automáticamente
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

TAG OBLIGATORIO:
- El tag ---PEDIDO_CONFIRMADO--- va en el PASO 6 (al presentar el resumen), NO después de que confirmen
- SIEMPRE inclúyelo al final del mensaje del resumen, el sistema lo oculta automáticamente
- Si NO incluyes el tag, el pedido NO se guardará y se perderá

CONFIRMACIÓN (REGLA CRÍTICA - ANTI-LOOP):
- Solo pide confirmación UNA VEZ, después del resumen final con TODOS los datos completos
- NUNCA preguntes "confirmamos?" mientras el cliente aún está pidiendo productos
- PROHIBIDO repetir el resumen si ya lo presentaste
- PROHIBIDO preguntar confirmación si ya la pediste (order_status = pending_confirmation)
- Palabras afirmativas válidas: "sí", "si", "dale", "listo", "ok", "perfecto", "de una", "sisas", "hagale", "hágale", "va", "vamos", "hecho", "correcto", "claro", emojis ✅👍🔥
- Si el cliente dice "cambiar", "modificar", "agregar", "corregir" → NO confirmes, vuelve al flujo de edición
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas

MODIFICACIONES (solo pedidos ya confirmados):
- CAMBIO (<25 min) → ---CAMBIO_PEDIDO---{json}---FIN_CAMBIO---
- CAMBIO (>25 min) → "Ya lo preparamos, te lo mandamos como lo pediste"
- ADICIÓN → ---ADICION_PEDIDO---{json items nuevos + nuevo total}---FIN_ADICION---

EMPAQUES:
- NO decides cuándo aplicar empaques
- El sistema define qué productos requieren empaque
- Si el producto incluye packaging_cost en el cálculo, debes incluirlo en el JSON
- NUNCA elimines packaging_cost si el sistema lo ha incluido
- Siempre incluye packaging_cost exactamente como corresponde según los datos del producto

REGLAS INQUEBRANTABLES:
1. PRECIOS: NUNCA inventes. Verifica en el menú
2. TAMAÑOS: Solo los del menú. Si no existen otros, NUNCA los inventes
3. PRODUCTOS: NUNCA digas que no existe sin revisar TODO el menú
4. VARIANTES: Si un producto existe en múltiples versiones (ej: Personal Y Mediana), JAMÁS asumas cuál quiere. Pregunta siempre. Si tiene UNA SOLA versión, NO preguntes
5. DESGLOSE: producto + precio + empaque + total. Números DEBEN cuadrar
6. DIRECCIÓN: Cuando la den, GRÁBALA. DEBE aparecer en el JSON
7. FRUSTRACIÓN → pasa al humano
8. NUNCA muestres JSON al cliente
RECUERDA: ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- va en el RESUMEN (paso 6), NO después de la confirmación.

=== FIN CORE ===`;
}

function buildPrompt(
  products: any[],
  promoted: any[],
  greeting: string,
  name: string,
  order: any,
  status: string,
  config?: any,
  customerName?: string,
) {
  let prom = "";
  if (promoted && promoted.length > 0) {
    const lines: string[] = [];
    for (const item of promoted) {
      if (item.category && Array.isArray(item.products)) {
        for (const p of item.products) {
          lines.push(p.note ? `⭐ ${p.name} — ${p.note}` : `⭐ ${p.name}`);
        }
      }
    }
    if (lines.length > 0) prom = `\nPRODUCTOS RECOMENDADOS HOY:\n${lines.join("\n")}`;
  }
  let ctx = status !== "none" && order ? `\n\nPEDIDO ACTUAL:\n${JSON.stringify(order)}\nEstado: ${status}` : "";
  if (status === "confirmed" && config?._confirmed_at) {
    const minutesSince = Math.floor((Date.now() - new Date(config._confirmed_at).getTime()) / 60000);
    ctx += `\nTiempo desde confirmación: ${minutesSince} minutos`;
  }

  const { hour: h, day: d, weekend: we } = getRestaurantTimeInfo(config || {});
  const peak = isPeakNow(config?.operating_hours || {});

  // All businesses use Core + Dynamic — no more hardcoded La Barra special case
  if (config?.setup_completed && config?.restaurant_name) {
    const escalation = config.escalation_config || {};
    const personality = config.personality_rules || {};
    const assistantName = personality.name || "Alicia";
    const suggestConfigs = config.suggest_configs || {};
    const core = buildCoreSystemPrompt(assistantName, escalation.human_phone || "", suggestConfigs, greeting);
    const dynamic = buildDynamicPrompt(
      config,
      products,
      promoted,
      prom,
      ctx,
      peak,
      we,
      h,
      d,
      greeting,
      order,
      status,
      customerName,
    );
    return core + "\n\n" + dynamic;
  }

  // Fallback for unconfigured businesses — use Core + minimal dynamic
  const core = buildCoreSystemPrompt("Alicia", "");
  const menuBlock = products?.length > 0 ? buildMenuFromProducts(products) : "MENÚ: No disponible";
  return core + `\n\n${menuBlock}\n${prom}\n${ctx}`;
}

function buildDynamicPrompt(
  config: any,
  products: any[],
  promoted: any[],
  prom: string,
  ctx: string,
  peak: boolean,
  we: boolean,
  h: number,
  d: number,
  greeting: string,
  order: any,
  status: string,
  customerName?: string,
): string {
  const personality = config.personality_rules || {};
  const delivery = config.delivery_config || {};
  const payment = config.payment_config || {};
  // packaging_rules removed — packaging context now built dynamically from products
  const hours = config.operating_hours || {};
  const times = {
    weekday: hours.weekday_waiting_time,
    weekend: hours.weekend_waiting_time,
    peak: hours.peak_waiting_time,
  };
  const escalation = config.escalation_config || {};
  const customRules = config.custom_rules || [];
  const suggestConfigs = config.suggest_configs || {};
  const tone = personality.tone || "casual_professional";
  const assistantName = personality.name || "Alicia";
  const dailyOverrides = config.daily_overrides || [];

  // Schedule
  let scheduleBlock = "";
  if (hours.open_time && hours.close_time) {
    const { hour, minute } = getRestaurantTimeInfo(config);
    const currentMinutes = hour * 60 + minute;
    const openMinutes = timeToMinutes(hours.open_time);
    const closeMinutes = timeToMinutes(hours.close_time);
    const schedStart = hours.schedule_start || hours.open_time;
    const schedEnd = hours.schedule_end || hours.close_time;

    if (currentMinutes < openMinutes) {
      scheduleBlock = `ESTADO: Cerrado. Abrimos a las ${hours.open_time}.`;
      if (hours.accept_pre_orders) {
        scheduleBlock += ` Puedes tomar el pedido: "${hours.pre_order_message || `Empezamos a atender a las ${schedStart}`}"`;
      }
    } else if (currentMinutes >= closeMinutes) {
      scheduleBlock = `ESTADO: Cerrando. Horario: ${hours.open_time} - ${hours.close_time}.${hours.may_extend ? " A veces nos extendemos." : ""}`;
    } else if (currentMinutes < timeToMinutes(schedStart) && hours.accept_pre_orders) {
      scheduleBlock = `ESTADO: ABIERTOS pero en horario de pre-pedido. Atención de pedidos desde las ${schedStart} hasta las ${schedEnd}.\nMensaje pre-orden: "${hours.pre_order_message || `Tomamos tu pedido, pero empezamos a preparar a las ${schedStart}`}"\nSi el cliente confirma su pedido, tómalo pero indícale que se empezará a preparar a las ${schedStart}.`;
    } else {
      scheduleBlock = `ESTADO: ABIERTOS. ${hours.open_time} - ${hours.close_time}. Atención: ${schedStart} - ${schedEnd}.`;
    }
  }

  // Daily overrides — time-aware filtering + auto-clean
  let overridesBlock = "";
  if (dailyOverrides.length > 0) {
    const tzOffset = parseTimezoneOffset(hours?.timezone || "UTC-5");
    const today = getRestaurantDate(tzOffset);
    const nowLocal = getRestaurantTime(tzOffset);
    const nowMinutes = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();

    // Filter to only currently active overrides (date + hour)
    const active = dailyOverrides.filter((o: any) => {
      if (o.expires && o.expires < today) return false;
      if (o.start_hour) {
        const [sh, sm] = o.start_hour.split(":").map(Number);
        if (nowMinutes < sh * 60 + (sm || 0)) return false;
      }
      if (o.until_hour) {
        const [uh, um] = o.until_hour.split(":").map(Number);
        if (nowMinutes > uh * 60 + (um || 0)) return false;
      }
      return true;
    });

    if (active.length > 0) {
      overridesBlock = "\nCAMBIOS DE HOY:\n" + active.map((o: any) => `- ${o.instruction || o.value}`).join("\n");
    }

    // Auto-clean expired overrides from JSONB (fire-and-forget)
    const cleaned = dailyOverrides.filter((o: any) => {
      if (o.expires && o.expires < today) return false;
      if (o.until_hour && o.expires === today) {
        const [uh, um] = o.until_hour.split(":").map(Number);
        if (nowMinutes > uh * 60 + (um || 0)) return false;
      }
      return true;
    });
    if (cleaned.length !== dailyOverrides.length) {
      supabase
        .from("whatsapp_configs")
        .update({ daily_overrides: cleaned })
        .eq("restaurant_id", config.restaurant_id)
        .then(() => console.log(`Cleaned ${dailyOverrides.length - cleaned.length} expired daily_overrides`));
    }
  }

  // Menu — always from products table (single source of truth)
  let menuBlock = "";
  if (products?.length > 0) {
    menuBlock = buildMenuFromProducts(products);
  }

  // Delivery
  const radiusInfo = delivery.radius && delivery.radius !== "" ? ` Radio de cobertura: ${delivery.radius}.` : "";
  let deliveryBlock = "";
  if (delivery.enabled) {
    const freeZones = (delivery.free_zones || []).join(", ");
    deliveryBlock = freeZones
      ? `DOMICILIO GRATIS: ${freeZones}.${radiusInfo} ${delivery.paid_delivery_note || "Otras zonas se pagan aparte."} Si insisten → ---CONSULTA_DOMICILIO---`
      : `DOMICILIO:${radiusInfo} ${delivery.paid_delivery_note || "Se paga al domiciliario."} Si insisten → ---CONSULTA_DOMICILIO---`;
  } else {
    deliveryBlock = `Solo recogida. ${delivery.pickup_only_details || ""}`;
  }

  // Payment — filter "datafono" from proactive offers
  const safeMethods = (payment.methods || []).filter((m: string) => !/dat[aá]fono|terminal/i.test(m));
  const methods = (safeMethods.length > 0 ? safeMethods : ["efectivo"]).join(", ");
  let paymentBlock = `PAGO: ${methods}.`;
  if (payment.bank_details) paymentBlock += ` Datos: ${payment.bank_details}.`;
  if (payment.require_proof) paymentBlock += " Pedir foto del comprobante.";
  paymentBlock +=
    "\nDATÁFONO: NO lo ofrezcas proactivamente. Si el cliente lo pide → responde: 'No siempre podemos llevar datáfono, te confirmo disponibilidad'. NUNCA confirmes datáfono sin validación.";

  // Packaging — built dynamically from products table (single source of truth)
  const packagingProducts = products.filter((p: any) => p.requires_packaging && p.packaging_price > 0);
  const packagingBlock =
    packagingProducts.length > 0
      ? "EMPAQUES (aplica siempre que el producto lo requiera):\n" +
        packagingProducts
          .map((p: any) => `- ${p.name}: +$${Number(p.packaging_price).toLocaleString("es-CO")}`)
          .join("\n")
      : "";

  // Time estimates
  const timeBlock = times.weekday
    ? `TIEMPOS (solo si preguntan): Semana ${times.weekday}. Finde ${times.weekend || times.weekday}. Pico ${times.peak || times.weekday}. Actual: ${peak ? `PICO ${times.peak || "~30min"}` : we ? `Finde ${times.weekend || "~20min"}` : `Semana ${times.weekday}`}`
    : "";

  // Escalation
  const escalationBlock = escalation.human_phone
    ? `ESCALAMIENTO: Si insiste en persona → "${escalation.escalation_message || `Comunícate al ${escalation.human_phone}`}". Solo ---ESCALAMIENTO--- para temas técnicos.`
    : "";

  // Custom rules (includes disambiguation, history, anti-hallucination specifics per business)
  const rulesBlock =
    customRules.length > 0 ? "REGLAS DEL NEGOCIO:\n" + customRules.map((r: string) => `- ${r}`).join("\n") : "";

  // Tone
  let toneBlock = "";
  if (tone === "very_casual") toneBlock = "Habla MUY casual, como una amiga. Usa jerga local.";
  else if (tone === "formal") toneBlock = "Habla profesional. Trato de usted.";
  else toneBlock = "Habla cercana y profesional. Natural, cálida pero con respeto.";

  const menuLinkBlock = config.menu_link ? `\nCARTA: ${config.menu_link}` : "";

  // Customer context
  const customerCtx = customerName
    ? `NOMBRE DEL CLIENTE YA CONOCIDO: "${customerName}". Úsalo. NO vuelvas a pedirlo.`
    : "Nombre del cliente: aún no proporcionado.";

  // Upselling now injected directly into the core flow steps (buildCoreSystemPrompt)

  return `=== CONFIG DEL NEGOCIO ===

NEGOCIO: "${config.restaurant_name}"
${config.restaurant_description ? `HISTORIA: ${config.restaurant_description}` : ""}
UBICACIÓN: ${config.location_details || config.location_address || "Consulta con el equipo"}

${scheduleBlock}
${overridesBlock}

TONO: ${toneBlock}
- Varía: ${(personality.preferred_vocabulary || ["dale", "listo", "va", "claro", "bueno", "perfecto", "con gusto"]).join(", ")}

${customerCtx}
${menuLinkBlock}

${menuBlock}
${prom}
${rulesBlock}
${packagingBlock}
${deliveryBlock}
${timeBlock}
${paymentBlock}
${escalationBlock}

=== FIN CONFIG ===
${ctx}`;
}

function buildMenuFromProducts(products: any[]): string {
  if (!products || products.length === 0) return "MENÚ: No disponible en este momento";
  const pizzaSizes: Record<string, { desc: string; personal?: number; mediana?: number; cat: string }> = {};
  const otherProducts: { name: string; desc: string; price: number; cat: string }[] = [];
  for (const p of products) {
    const cat = p.category_name || "Otros",
      name = (p.name || "").trim(),
      desc = (p.description || "").trim(),
      price = Number(p.price);
    const pm = name.match(/^(.+?)\s+Personal$/i),
      mm = name.match(/^(.+?)\s+Mediana$/i);
    if (pm && cat.toLowerCase().includes("pizza")) {
      const b = pm[1].trim();
      if (!pizzaSizes[b]) pizzaSizes[b] = { desc, cat };
      pizzaSizes[b].personal = price;
    } else if (mm && cat.toLowerCase().includes("pizza")) {
      const b = mm[1].trim();
      if (!pizzaSizes[b]) pizzaSizes[b] = { desc, cat };
      pizzaSizes[b].mediana = price;
    } else otherProducts.push({ name, desc, price, cat, portions: p.portions || 1 });
  }
  let menu = "=== MENÚ OFICIAL (COP) ===\nINSTRUCCIÓN: COPIA la descripción EXACTA del menú. NO inventes.\n\n";
  const salPizzas = Object.entries(pizzaSizes)
    .filter(([, i]) => !i.cat.toLowerCase().includes("dulce"))
    .sort((a, b) => a[0].localeCompare(b[0]));
  const dulcePizzas = Object.entries(pizzaSizes)
    .filter(([, i]) => i.cat.toLowerCase().includes("dulce"))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (salPizzas.length > 0) {
    menu += "🍕 PIZZAS DE SAL:\n";
    for (const [n, i] of salPizzas)
      menu += `${n} | ${i.desc} | ${i.personal ? `$${i.personal.toLocaleString("es-CO")}` : "—"} | ${i.mediana ? `$${i.mediana.toLocaleString("es-CO")}` : "—"}\n`;
    menu += "\n";
  }
  if (dulcePizzas.length > 0) {
    menu += "🍫 PIZZAS DULCES:\n";
    for (const [n, i] of dulcePizzas)
      menu += `${n} | ${i.desc} | $${(i.personal || i.mediana || 0).toLocaleString("es-CO")}\n`;
    menu += "\n";
  }
  const groups: Record<string, typeof otherProducts> = {};
  for (const p of otherProducts) {
    if (!groups[p.cat]) groups[p.cat] = [];
    groups[p.cat].push(p);
  }
  for (const [cat, items] of Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))) {
    menu += `📋 ${cat.toUpperCase()}:\n`;
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
      const portionsText = item.portions > 1 ? ` | ${item.portions} porciones` : "";
      menu += `${item.name} | ${item.desc || "—"} | $${item.price.toLocaleString("es-CO")}${portionsText}\n`;
    }
    menu += "\n";
  }
  return menu + "=== FIN MENÚ ===";
}

// buildLaBarraPrompt REMOVED — La Barra now uses buildCoreSystemPrompt + buildDynamicPrompt
// All La Barra-specific rules migrated to whatsapp_configs.custom_rules

// ==================== PRICE VALIDATION (DYNAMIC) ====================

/** Build price map dynamically from products loaded from DB */
import { resolveProductEntry, type ProductEntry } from "../_shared/productResolver.ts";

function buildProductEntries(products: any[]): ProductEntry[] {
  return products
    .filter((p: any) => p.name && p.price)
    .map((p: any) => ({
      name: (p.name || "").toLowerCase().trim(),
      price: Number(p.price),
      description: (p.description || "").toLowerCase().trim(),
      categoryName: (p.category_name || p.categories?.name || "").toLowerCase().trim(),
      categoryId: p.category_id || "",
      requiresPackaging: p.requires_packaging === true,
      packagingPrice: p.packaging_price != null ? Number(p.packaging_price) : 0,
    }));
}

// buildPackagingMap removed — packaging now resolved from ProductEntry[] via buildProductEntries

/**
 * Returns packaging cost for an item.
 * Now fully DB-driven via products.packaging_price.
 * If requires_packaging = false → 0.
 * If requires_packaging = true → use packaging_price from DB.
 * Defaults to 0 if packaging_price is missing/null/undefined.
 */
function getPackagingCost(_itemName: string, requiresPackaging?: boolean, packagingPrice?: number): number {
  if (requiresPackaging === false) return 0;
  if (requiresPackaging === true) {
    return packagingPrice != null && packagingPrice > 0 ? packagingPrice : 0;
  }
  // No DB data available → default 0 (safe fallback)
  return 0;
}

/** Validate and correct order prices/packaging for any business */
function validateOrder(order: any, products?: any[]): { order: any; corrected: boolean; issues: string[] } {
  if (!order?.items) return { order, corrected: false, issues: [] };

  const productEntries: ProductEntry[] = products ? buildProductEntries(products) : [];
  const issues: string[] = [];
  let corrected = false;
  const isDelivery =
    (order.delivery_type || "").toLowerCase().includes("delivery") ||
    (order.delivery_type || "").toLowerCase().includes("domicilio");

  // Remove AI-generated packaging pseudo-items — packaging is handled via packaging_cost per product
  order.items = (order.items || []).filter((item: any) => {
    const name = (item.name || "").trim();
    return !/^📦?\s*empaque/i.test(name);
  });

  for (const item of order.items) {
    const itemName = item.name || "";
    const itemLower = itemName.toLowerCase();

    // Price validation using shared category-aware resolver
    let bestEntry: ProductEntry | null = null;
    let bestPrice = 0;
    if (productEntries.length > 0) {
      const declaredPrice = item.unit_price || 0;
      const resolved = resolveProductEntry(itemLower, declaredPrice, productEntries);
      bestEntry = resolved.entry;
      bestPrice = bestEntry?.price || 0;
      if (bestEntry) item.category_name = bestEntry.categoryName;

      if (bestEntry && bestPrice > 0 && !resolved.ambiguous) {
        if (declaredPrice > 0 && declaredPrice !== bestPrice) {
          issues.push(
            `PRECIO CORREGIDO: ${itemName} de $${declaredPrice.toLocaleString()} a $${bestPrice.toLocaleString()}`,
          );
          item.unit_price = bestPrice;
          corrected = true;
        }
      }
      // If ambiguous, keep AI's declared price — do NOT correct
    }

    // ── PACKAGING: driven exclusively by DB fields via matched ProductEntry ──
    {
      let dbPkgInfo: { requires: boolean; price: number } | undefined = undefined;
      if (bestEntry) {
        dbPkgInfo = { requires: bestEntry.requiresPackaging, price: bestEntry.packagingPrice };
      }

      const dbRequiresPackaging = dbPkgInfo?.requires;
      const dbPackagingPrice = dbPkgInfo?.price ?? 0;

      // If product does not require packaging → force 0
      if (dbRequiresPackaging === false) {
        if ((item.packaging_cost || 0) !== 0) {
          issues.push(`Empaque ELIMINADO para ${itemName} (producto embotellado/enlatado)`);
          item.packaging_cost = 0;
          corrected = true;
        }
      } else if (!item.packaging_cost || item.packaging_cost <= 0) {
        // Requires packaging but missing → add it using DB packaging_price
        const pkg = getPackagingCost(itemName, dbRequiresPackaging, dbPackagingPrice);
        if (pkg > 0) {
          item.packaging_cost = pkg;
          issues.push(`Empaque faltante para ${itemName}: +$${pkg}`);
          corrected = true;
        }
      }
    }
  }

  // Recalculate totals
  let subtotal = 0;
  let packagingTotal = 0;
  for (const item of order.items) {
    subtotal += (item.unit_price || 0) * (item.quantity || 1);
    packagingTotal += (item.packaging_cost || 0) * (item.quantity || 1);
  }
  let calculatedTotal = subtotal + packagingTotal;
  // Guard: never allow negative or zero totals
  if (calculatedTotal <= 0 && subtotal > 0) {
    issues.push(
      `TOTAL NEGATIVO/CERO CORREGIDO: de $${calculatedTotal.toLocaleString()} a $${subtotal.toLocaleString()}`,
    );
    calculatedTotal = subtotal;
    corrected = true;
  }
  if (order.total !== calculatedTotal) {
    issues.push(`TOTAL CORREGIDO: de $${(order.total || 0).toLocaleString()} a $${calculatedTotal.toLocaleString()}`);
    corrected = true;
  }
  order.subtotal = subtotal;
  order.packaging_total = packagingTotal;
  order.total = calculatedTotal;

  if (issues.length > 0) console.log("🔧 ORDER CORRECTIONS:", issues.join("; "));
  return { order, corrected, issues };
}

// ==================== BACKEND-BUILT ORDER SUMMARY ====================

/** Format COP price like $39.000 */
function formatCOP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CO");
}

/**
 * Build a human-readable WhatsApp order summary from VALIDATED order data.
 * This replaces the AI-generated summary to guarantee price consistency.
 */
function buildOrderSummary(order: any, config: any, customerName?: string): string {
  const rName = config?.restaurant_name || "Restaurante";
  const name = customerName || order.customer_name || "";
  const payment = config?.payment_config || {};
  const delivery = config?.delivery_config || {};

  // Build items block
  let itemLines = "";
  let subtotal = 0;
  let packagingTotal = 0;
  for (const item of order.items || []) {
    const qty = item.quantity || 1;
    const unitPrice = item.unit_price || 0;
    const pkgCost = item.packaging_cost || 0;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    packagingTotal += pkgCost * qty;
    // Strip any parenthesized category already embedded in the item name by the AI
    let displayName = (item.name || "").replace(/\s*\([^)]*\)\s*/g, "").trim() || item.name;
    const catLabel = item.category_name
      ? ` (${item.category_name
          .split(/\s+/)
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")})`
      : "";
    itemLines += `- ${qty > 1 ? qty + "x " : ""}${displayName}${catLabel}: ${formatCOP(lineTotal)}\n`;
    if (pkgCost > 0) {
      itemLines += `  📦 Empaque: ${formatCOP(pkgCost * qty)}\n`;
    }
  }

  const total = subtotal + packagingTotal;

  // Payment block
  let paymentBlock = "";
  const safeMethods = (payment.methods || []).filter((m: string) => !/dat[aá]fono|terminal/i.test(m));
  const methods = safeMethods.length > 0 ? safeMethods.join(", ") : "efectivo";
  if (payment.bank_details) {
    paymentBlock = `Puedes pagar por transferencia a ${payment.bank_details}, o en ${methods}.`;
    if (payment.require_proof) {
      paymentBlock += "\nPor favor, envíanos una foto del comprobante si pagas por transferencia.";
    }
  } else {
    paymentBlock = `Pago: ${methods}.`;
  }

  // Delivery block
  let deliveryBlock = "";
  const isDelivery =
    (order.delivery_type || "").toLowerCase().includes("delivery") ||
    (order.delivery_type || "").toLowerCase().includes("domicilio");
  if (isDelivery && order.delivery_address) {
    deliveryBlock = `\n📍 Domicilio: ${order.delivery_address}`;
  } else if (!isDelivery) {
    deliveryBlock = "\n🏪 Para recoger";
  }

  // Compose final message
  let msg = `${rName}: Listo${name ? ", " + name : ""}. El total de tu pedido es de ${formatCOP(total)}.\n\n`;
  msg += paymentBlock + "\n\n";
  msg += "Tu pedido incluye:\n\n";
  msg += itemLines;
  if (packagingTotal > 0) {
    msg += `\nSubtotal: ${formatCOP(subtotal)}`;
    msg += `\nEmpaques: ${formatCOP(packagingTotal)}`;
  }
  msg += `\nTotal: ${formatCOP(total)}`;
  msg += deliveryBlock;
  msg += `\n\n¿Me confirmas tu pedido para empezarlo a preparar?\nResponde: "Sí, confirmar" o escribe qué quieres cambiar`;

  return msg;
}

// ==================== PRICE QUESTION HANDLER ====================

/** Detect price questions and return backend-built response using effectiveProducts */
function handlePriceQuestion(text: string, effectiveProducts: any[], config: any): string | null {
  // Detect price question patterns
  const pricePatterns = [
    /(?:cu[áa]nto|quanto)\s+(?:cuesta|vale|es|sale|cost)/i,
    /(?:precio|costo)\s+(?:de(?:l)?|la|el|los|las)\s+/i,
    /(?:qu[ée])\s+(?:precio|costo)/i,
    /(?:a\s+c[óo]mo)\s+(?:est[áa]|sale|queda|va)/i,
    /(?:cu[áa]l\s+es\s+el\s+precio)/i,
    /(?:cu[áa]nto\s+(?:me\s+)?(?:sale|queda|cost))/i,
  ];

  const isPrice = pricePatterns.some((p) => p.test(text));
  if (!isPrice) return null;

  // Extract product name by stripping the question pattern
  let productQuery = text;
  const stripPatterns = [
    /(?:cu[áa]nto|quanto)\s+(?:cuesta|vale|es|sale|cost[aá]?)\s+(?:la|el|un|una|los|las)?\s*/i,
    /(?:precio|costo)\s+(?:de(?:l)?|la|el|los|las)\s*/i,
    /(?:qu[ée])\s+(?:precio|costo)\s+(?:tiene|tiene\s+la|tiene\s+el)?\s*/i,
    /(?:a\s+c[óo]mo)\s+(?:est[áa]|sale|queda|va)\s+(?:la|el|un|una|los|las)?\s*/i,
    /(?:cu[áa]l\s+es\s+el\s+precio\s+(?:de(?:l)?|la|el)\s*)/i,
    /(?:cu[áa]nto\s+(?:me\s+)?(?:sale|queda|cost[aá]?)\s+(?:la|el|un|una|los|las)?\s*)/i,
  ];
  for (const sp of stripPatterns) {
    productQuery = productQuery.replace(sp, "");
  }
  productQuery = productQuery.replace(/[?¿!¡.,]+/g, "").trim();

  if (!productQuery || productQuery.length < 2) return null;

  // Use shared resolver
  const entries = buildProductEntries(effectiveProducts);
  if (entries.length === 0) return null;

  const resolved = resolveProductEntry(productQuery, 0, entries);

  if (!resolved.entry) return null;

  // Check for multiple size variants (same base name)
  const baseName = productQuery.toLowerCase().trim();
  const variants = entries.filter((e) => {
    const eName = e.name.toLowerCase();
    return (
      eName.includes(baseName) || baseName.includes(eName.replace(/(personal|mediana|grande|familiar)/i, "").trim())
    );
  });

  // If multiple variants exist and we got an ambiguous match, list them
  if (variants.length > 1 && resolved.ambiguous) {
    let msg = "Tenemos:\n";
    for (const v of variants) {
      const orig = effectiveProducts.find((p: any) => (p.name || "").toLowerCase().trim() === v.name);
      const catLabel = v.categoryName
        ? ` (${v.categoryName
            .split(/\s+/)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")})`
        : "";
      msg += `- ${orig?.name || v.name}${catLabel}: ${formatCOP(v.price)}\n`;
    }
    msg += "¿Cuál te gustaría?";
    return msg;
  }

  // Single match — return price
  const origProduct = effectiveProducts.find((p: any) => (p.name || "").toLowerCase().trim() === resolved.entry!.name);
  const displayName = origProduct?.name || resolved.entry.name;
  const catLabel = resolved.entry.categoryName
    ? ` (${resolved.entry.categoryName
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")})`
    : "";
  return `${displayName}${catLabel} cuesta ${formatCOP(resolved.entry.price)}.\n¿Quieres que te agregue una al pedido?`;
}

// ==================== AI INTEGRATION ====================

/** Call AI for response generation */
async function callAI(sys: string, msgs: any[], temperature = 0.2) {
  const m = msgs.slice(-120).map((x: any) => ({
    role: x.role === "customer" ? "user" : "assistant",
    content: x.content,
  }));
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, ...m],
      temperature,
      max_tokens: 800,
    }),
  });
  if (!r.ok) {
    const e = await r.text();
    console.error("AI err:", e);
    throw new Error(e);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || null;
}

// ==================== ORDER PARSING ====================

function parseOrder(txt: string) {
  const m = txt.match(/---PEDIDO_CONFIRMADO---\s*([\s\S]*?)\s*---FIN_PEDIDO---/);
  if (!m) {
    // Safety net 1: detect raw JSON with order structure
    const jsonMatch = txt.match(/\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?"total"\s*:\s*\d+[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const recovered = JSON.parse(jsonMatch[0]);
        if (recovered.items && recovered.total) {
          console.log("⚠️ SAFETY NET JSON: Recovered order from raw JSON");
          return {
            order: recovered,
            clean:
              txt
                .replace(jsonMatch[0], "")
                .replace(/```json\s*/g, "")
                .replace(/```/g, "")
                .trim() || "✅ Pedido registrado! 🍽️",
          };
        }
      } catch {
        /* ignore */
      }
    }

    // Safety net 2: detect text-based order summary with prices (e.g. "$32.000", "Total: $60.000")
    // This catches when the AI presents a summary without the tag
    const hasMultiplePrices = (txt.match(/\$[\d.,]+/g) || []).length >= 2;
    const hasTotalKeyword = /total[:\s]*\$[\d.,]+/i.test(txt);
    const hasConfirmQuestion = /todo bien|confirm|está bien|correcto\?|de acuerdo/i.test(txt);

    if (hasMultiplePrices && hasTotalKeyword && hasConfirmQuestion) {
      console.log("⚠️ SAFETY NET TEXT: Detected text-based order summary without tag. Extracting...");

      // Extract items from bullet points or lines with prices
      const items: any[] = [];
      const lines = txt.split("\n");
      for (const line of lines) {
        const itemMatch = line.match(/[*•\-]?\s*(.+?):\s*\$?([\d.,]+)/);
        if (itemMatch) {
          const name = itemMatch[1].trim();
          const price = parseInt(itemMatch[2].replace(/[.,]/g, ""));
          // Skip lines that are subtotal/total/empaque summary lines
          if (/^(sub)?total|^empaque/i.test(name)) continue;
          if (price > 0 && name.length > 1) {
            items.push({ name, quantity: 1, unit_price: price, packaging_cost: 0 });
          }
        }
      }

      // Extract total
      const totalMatch = txt.match(/total[:\s]*\$?([\d.,]+)/i);
      const total = totalMatch ? parseInt(totalMatch[1].replace(/[.,]/g, "")) : 0;

      if (items.length > 0 && total > 0) {
        const order = {
          items,
          total,
          subtotal: total,
          packaging_total: 0,
          delivery_type: "pickup",
          delivery_address: null,
          customer_name: "",
          payment_method: "efectivo",
          observations: "",
        };

        // Try to extract delivery info from text
        if (/domicilio|delivery/i.test(txt)) order.delivery_type = "delivery";
        const addrMatch = txt.match(/(?:direcci[oó]n|para|hacia)[:\s]*(.+?)(?:\n|$)/i);
        if (addrMatch) order.delivery_address = addrMatch[1].trim();

        // Extract customer name if present
        const nameMatch = txt.match(/(?:nombre|cliente)[:\s]*(.+?)(?:\n|,|$)/i);
        if (nameMatch) order.customer_name = nameMatch[1].trim();

        console.log(`⚠️ SAFETY NET TEXT: Recovered ${items.length} items, total $${total}`);
        return { order, clean: txt };
      }
    }

    return null;
  }
  try {
    return {
      order: JSON.parse(m[1].trim()),
      clean: txt.replace(/---PEDIDO_CONFIRMADO---[\s\S]*?---FIN_PEDIDO---/, "").trim(),
    };
  } catch {
    return null;
  }
}

function parseOrderModification(txt: string): { type: "addition" | "change"; order: any; clean: string } | null {
  const addMatch = txt.match(/---ADICION_PEDIDO---\s*([\s\S]*?)\s*---FIN_ADICION---/);
  if (addMatch) {
    try {
      return {
        type: "addition",
        order: JSON.parse(addMatch[1].trim()),
        clean: txt.replace(/---ADICION_PEDIDO---[\s\S]*?---FIN_ADICION---/, "").trim(),
      };
    } catch {
      /* ignore */
    }
  }
  const changeMatch = txt.match(/---CAMBIO_PEDIDO---\s*([\s\S]*?)\s*---FIN_CAMBIO---/);
  if (changeMatch) {
    try {
      return {
        type: "change",
        order: JSON.parse(changeMatch[1].trim()),
        clean: txt.replace(/---CAMBIO_PEDIDO---[\s\S]*?---FIN_CAMBIO---/, "").trim(),
      };
    } catch {
      /* ignore */
    }
  }
  return null;
}

// ==================== ORDER PERSISTENCE & EMAIL ====================

function buildOrderEmailHtml(order: any, phone: string, isDelivery: boolean, paymentProofUrl?: string | null): string {
  const items = (order.items || [])
    .map((i: any) => {
      let row = `<tr><td style="padding:8px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.quantity}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${(i.unit_price || 0).toLocaleString("es-CO")}</td><td style="padding:8px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`;
      if (i.packaging_cost && i.packaging_cost > 0) {
        row += `<tr><td style="padding:4px 8px 8px 24px;border-bottom:1px solid #1a1a1a;color:#888;font-size:12px;">📦 Empaque x${i.quantity}</td><td style="padding:4px 8px 8px;border-bottom:1px solid #1a1a1a;"></td><td style="padding:4px 8px 8px;border-bottom:1px solid #1a1a1a;"></td><td style="padding:4px 8px 8px;text-align:right;border-bottom:1px solid #1a1a1a;color:#888;font-size:12px;">$${(i.packaging_cost * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`;
      }
      return row;
    })
    .join("");
  const rawPay = (order.payment_method || "").toLowerCase();
  const isEfectivo = /efectivo|cash|contra/.test(rawPay);
  const delSec = isDelivery
    ? `<div style="background:rgba(0,212,170,0.15);padding:12px;border-radius:8px;margin:10px 0;border-left:4px solid #00D4AA;"><b style="color:#00D4AA;">🏍️ DOMICILIO</b><br/><span style="color:#fff;">📍 ${order.delivery_address || "No proporcionada"}</span></div>`
    : `<div style="background:rgba(255,107,53,0.1);padding:12px;border-radius:8px;margin:10px 0;border-left:4px solid #FF6B35;"><b style="color:#FF6B35;">🏪 Recoger en local</b></div>`;
  const paySec = isEfectivo
    ? `<div style="padding:12px;background:rgba(0,212,170,0.12);border-radius:8px;border-left:4px solid #00D4AA;margin-top:10px;"><b style="color:#00D4AA;">💵 Efectivo</b> - ${isDelivery ? "Paga al domiciliario" : "Paga al recoger"}</div>`
    : paymentProofUrl
      ? `<div style="padding:12px;background:rgba(0,212,170,0.12);border-radius:8px;margin-top:10px;"><b style="color:#00D4AA;">💳 Comprobante</b><br/><img src="${paymentProofUrl}" style="max-width:100%;border-radius:8px;"/></div>`
      : `<div style="padding:12px;background:rgba(255,107,53,0.1);border-radius:8px;margin-top:10px;"><b style="color:#FF6B35;">💳 ${order.payment_method || "Pendiente"}</b></div>`;
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid #1a1a1a;"><div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:20px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:20px;">CONEKTAO</h1><p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Nuevo Pedido WhatsApp</p></div><div style="padding:20px;"><div style="display:flex;gap:8px;margin-bottom:12px;"><div style="background:#111;padding:10px;border-radius:8px;flex:1;"><small style="color:#888;">Cliente</small><p style="margin:4px 0 0;color:#fff;">👤 ${order.customer_name || "Cliente"}</p></div><div style="background:#111;padding:10px;border-radius:8px;flex:1;"><small style="color:#888;">Teléfono</small><p style="margin:4px 0 0;color:#fff;">📱 +${phone}</p></div></div>${delSec}<table style="width:100%;border-collapse:collapse;margin-top:12px;background:#111;border-radius:8px;border:1px solid #1a1a1a;"><thead><tr style="background:#151515;"><th style="padding:8px;text-align:left;color:#00D4AA;font-size:11px;">Producto</th><th style="padding:8px;color:#00D4AA;font-size:11px;">Cant.</th><th style="padding:8px;text-align:right;color:#00D4AA;font-size:11px;">Precio</th><th style="padding:8px;text-align:right;color:#00D4AA;font-size:11px;">Subtotal</th></tr></thead><tbody>${items}</tbody><tfoot><tr><td colspan="3" style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;color:#fff;border-top:2px solid #00D4AA;">TOTAL:</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px;color:#00D4AA;border-top:2px solid #00D4AA;">$${(order.total || 0).toLocaleString("es-CO")}</td></tr></tfoot></table>${paySec}${order.observations ? `<div style="margin-top:10px;padding:10px;background:#111;border-radius:8px;"><small style="color:#888;">Obs.</small><p style="margin:4px 0 0;color:#e0e0e0;">📝 ${order.observations}</p></div>` : ""}</div><div style="padding:12px;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:10px;">Powered by CONEKTAO</p></div></div>`;
}

/** Send email via Brevo — uses pedidos@conektao.com verified domain */
async function sendEmail(to: string, subject: string, html: string, fromOverride?: string): Promise<boolean> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    console.error("EMAIL_SKIP: BREVO_API_KEY not set");
    return false;
  }
  const fromEmail = fromOverride || "pedidos@conektao.com";
  const fromName = "CONEKTAO Pedidos";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  const body = await res.text();
  console.log(`Brevo [${fromEmail} → ${to}]: status=${res.status} body=${body}`);
  if (!res.ok) {
    console.error(`EMAIL_FAIL { from: "${fromEmail}", to: "${to}", status: ${res.status}, body: "${body}" }`);
  }
  return res.ok;
}

/** Save order to DB and send confirmation email — EMAIL NEVER BLOCKS CONFIRMATION */
async function saveOrder(
  rid: string,
  cid: string,
  phone: string,
  order: any,
  config: any,
  paymentProofUrl?: string | null,
) {
  // ── ARCHIVE old confirmed orders so repeat customers aren't blocked ────────
  const { data: archived } = await supabase
    .from("whatsapp_orders")
    .update({ status: "completed" })
    .eq("conversation_id", cid)
    .eq("restaurant_id", rid)
    .eq("status", "confirmed")
    .lt("created_at", new Date(Date.now() - 30 * 1000).toISOString())
    .select("id");
  if (archived?.length) console.log(`♻️ ARCHIVED ${archived.length} old confirmed orders for conv ${cid}`);

  // ── DEDUP GUARD 1: by conversation_id (30s window — blocks webhook dupes, allows new orders) ──
  const thirtySecsAgoDedup = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: existingOrder } = await supabase
    .from("whatsapp_orders")
    .select("id, email_sent, status")
    .eq("conversation_id", cid)
    .eq("restaurant_id", rid)
    .in("status", ["received", "confirmed"])
    .gt("created_at", thirtySecsAgoDedup)
    .limit(1)
    .maybeSingle();

  if (existingOrder) {
    console.log(`⚠️ DEDUP: Order already exists for conversation ${cid} (order ${existingOrder.id})`);
    // Email was not sent on previous attempt → retry now (non-blocking)
    if (!existingOrder.email_sent && config.order_email) {
      console.log(`📧 EMAIL_RETRY: Retrying email for existing order ${existingOrder.id}`);
      const rawType = (order.delivery_type || "pickup").toLowerCase();
      const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
      const html = buildOrderEmailHtml(order, phone, isDelivery, paymentProofUrl);
      const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
      try {
        const sent = await sendEmail(config.order_email, subject, html);
        if (sent) {
          await supabase
            .from("whatsapp_orders")
            .update({ email_sent: true, status: "confirmed" })
            .eq("id", existingOrder.id);
          await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
          console.log(`📧 EMAIL_RETRY_OK { order_id: "${existingOrder.id}" }`);
        } else {
          // Email failed but order is still confirmed
          await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", existingOrder.id);
          console.log(`📧 EMAIL_RETRY_FAIL { order_id: "${existingOrder.id}" }`);
        }
      } catch (emailErr) {
        await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", existingOrder.id);
        console.error(`📧 EMAIL_RETRY_ERROR { order_id: "${existingOrder.id}", err: "${emailErr}" }`);
      }
    }
    return existingOrder.id;
  }

  // ── DEDUP GUARD 2: time-based fallback (2 min window) ─────────────────────
  // 30s es suficiente para deduplicar dobles-webhooks de Meta (< 5s); 120s bloqueaba pedidos legítimos consecutivos
  const twoMinAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: recentDup } = await supabase
    .from("whatsapp_orders")
    .select("id")
    .eq("customer_phone", phone)
    .eq("restaurant_id", rid)
    .gt("created_at", twoMinAgo)
    .limit(1)
    .maybeSingle();
  if (recentDup) {
    console.log(`⚠️ DEDUP_TIME: Skipping duplicate order for ${phone} (within 2min)`);
    return recentDup.id;
  }

  const rawType = (order.delivery_type || "pickup").toLowerCase();
  const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
  const deliveryType = isDelivery ? "delivery" : "pickup";

  // ── STEP 1: Insert order in DB ─────────────────────────────────────────────
  const { data: saved, error } = await supabase
    .from("whatsapp_orders")
    .insert({
      restaurant_id: rid,
      conversation_id: cid,
      customer_phone: phone,
      customer_name: order.customer_name || "Cliente WhatsApp",
      items: order.items || [],
      total: order.total || 0,
      delivery_type: deliveryType,
      delivery_address: order.delivery_address || null,
      status: "received",
      email_sent: false,
      payment_proof_url: paymentProofUrl || null,
      payment_method: order.payment_method || null,
    })
    .select()
    .single();

  // ATOMIC DEDUP: If unique constraint violation, return existing order
  if (error && error.code === "23505") {
    console.log(`🔒 ATOMIC_DEDUP: Unique constraint caught duplicate for conv ${cid}`);
    const { data: existingAtomic } = await supabase
      .from("whatsapp_orders")
      .select("id")
      .eq("conversation_id", cid)
      .eq("restaurant_id", rid)
      .in("status", ["received", "confirmed"])
      .limit(1)
      .maybeSingle();
    return existingAtomic?.id || null;
  }

  if (error) {
    console.error(`💾 DB_INSERT_FAIL { phone: "${phone}", error: "${error.message}" }`);
    return null;
  }
  console.log(`💾 DB_INSERT_OK { order_id: "${saved.id}", phone: "${phone}", total: ${order.total} }`);

  // ── STEP 2: IMMEDIATELY mark conversation as confirmed (BEFORE email attempt) ──
  // This ensures the order stays confirmed even if email fails
  await supabase
    .from("whatsapp_conversations")
    .update({ order_status: "confirmed", current_order: order, pending_since: null })
    .eq("id", cid);
  console.log(`✅ CONV_STATUS_CONFIRMED { conv_id: "${cid}" }`);

  // ── STEP 3: Send email (NON-BLOCKING — failure never reverts confirmation) ──
  if (!config.order_email) {
    console.log(`📧 EMAIL_SKIP: No order_email configured for restaurant ${rid}`);
    // Still mark as confirmed even if no email configured
    await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", saved.id);
    return saved.id;
  }

  try {
    const html = buildOrderEmailHtml(order, phone, isDelivery, paymentProofUrl);
    const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
    const sent = await sendEmail(config.order_email, subject, html);
    if (sent) {
      // Update status to confirmed + email_sent — never revert to received
      await supabase.from("whatsapp_orders").update({ email_sent: true, status: "confirmed" }).eq("id", saved.id);
      await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
      console.log(`📧 EMAIL_SEND_OK { order_id: "${saved.id}", to: "${config.order_email}" }`);
    } else {
      // Email failed — order confirmed in dashboard regardless
      await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", saved.id);
      console.log(
        `📧 EMAIL_SEND_FAIL { order_id: "${saved.id}", to: "${config.order_email}" } — order confirmed regardless`,
      );
    }
  } catch (emailErr) {
    // Email exception — order confirmed in dashboard regardless
    await supabase.from("whatsapp_orders").update({ status: "confirmed" }).eq("id", saved.id);
    console.error(`📧 EMAIL_EXCEPTION { order_id: "${saved.id}", err: "${emailErr}" } — order confirmed regardless`);
  }

  // ── STEP 4: Update WA customer profile (FIRE-AND-FORGET — never blocks) ──
  // This runs after email logic so any failure here cannot affect confirmation or email.
  updateWaCustomerProfile(
    phone,
    rid,
    order.customer_name || null,
    isDelivery ? order.delivery_address || null : null,
  ).catch((e) => console.error(`👤 WA_PROFILE_SAVE_ERROR: ${e}`));

  return saved.id;
}

async function saveOrderModification(
  rid: string,
  cid: string,
  phone: string,
  modification: any,
  modType: "addition" | "change",
  config: any,
  originalOrder: any,
) {
  const updatedOrder =
    modType === "change"
      ? modification
      : {
          ...originalOrder,
          items: [...(originalOrder?.items || []), ...(modification.items || [])],
          total: modification.total || originalOrder?.total,
        };
  await supabase.from("whatsapp_conversations").update({ current_order: updatedOrder }).eq("id", cid);
  const { data: existingOrder } = await supabase
    .from("whatsapp_orders")
    .select("id, items, total")
    .eq("conversation_id", cid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingOrder) {
    const newItems =
      modType === "change"
        ? modification.items
        : [...((existingOrder.items as any[]) || []), ...(modification.items || [])];
    await supabase
      .from("whatsapp_orders")
      .update({ items: newItems, total: modification.total || updatedOrder.total })
      .eq("id", existingOrder.id);
  }
  if (!config.order_email) return;
  const isAdd = modType === "addition",
    emoji = isAdd ? "➕" : "⚠️",
    label = isAdd ? "ADICIÓN" : "CAMBIO",
    color = isAdd ? "#00D4AA" : "#FF6B35";
  const itemsHtml = (modification.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:8px;text-align:center;color:#e0e0e0;">${i.quantity}</td><td style="padding:8px;text-align:right;color:#e0e0e0;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid ${color}33;"><div style="background:linear-gradient(135deg,${color},${color}99);padding:16px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:18px;">${emoji} ${label} DE PEDIDO</h1></div><div style="padding:16px;"><p style="color:#fff;">👤 ${modification.customer_name || "Cliente"} · 📱 +${phone}</p>${!isAdd ? `<div style="background:#2a0a0a;border:1px solid #FF4444;border-radius:8px;padding:10px;margin-bottom:12px;"><p style="margin:0;color:#FF4444;">⚠️ Productos cambiados</p></div>` : ""}<table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;border:1px solid #1a1a1a;"><thead><tr style="background:#151515;"><th style="padding:8px;text-align:left;color:${color};font-size:11px;">Producto</th><th style="padding:8px;color:${color};font-size:11px;">Cant.</th><th style="padding:8px;text-align:right;color:${color};font-size:11px;">Precio</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="margin-top:12px;text-align:right;"><span style="color:${color};font-size:20px;font-weight:bold;">$${(modification.total || 0).toLocaleString("es-CO")}</span></div></div><div style="padding:10px;text-align:center;border-top:1px solid #1a1a1a;"><p style="margin:0;color:#555;font-size:10px;">CONEKTAO</p></div></div>`;
  await sendEmail(
    config.order_email,
    `${emoji} ${label} - ${modification.customer_name || "Cliente"} - $${(modification.total || 0).toLocaleString("es-CO")}`,
    html,
  );
}

async function escalate(config: any, phone: string, reason: string, conversationMessages?: any[]) {
  if (!config.order_email) return;
  const convHtml = conversationMessages?.length
    ? `<div style="margin-top:12px;padding:10px;background:#111;border-radius:8px;">${conversationMessages
        .slice(-10)
        .map(
          (m: any) =>
            `<p style="margin:4px 0;padding:4px 8px;border-radius:4px;background:${m.role === "customer" ? "#1a2a1a" : "#1a1a2a"};color:#eee;font-size:12px;"><b style="color:${m.role === "customer" ? "#00D4AA" : "#FF6B35"};">${m.role === "customer" ? "👤" : "🤖"}</b> ${(m.content || "").substring(0, 150)}</p>`,
        )
        .join("")}</div>`
    : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:12px;border:1px solid #1a1a1a;"><div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:16px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:18px;">🚨 ALICIA necesita autorización</h1></div><div style="padding:16px;color:#eee;"><div style="background:#1a1a1a;border-radius:8px;padding:12px;margin-bottom:12px;"><p style="margin:0 0 6px;"><b style="color:#FF6B35;">📱</b> +${phone}</p><p style="margin:0;color:#ccc;">${reason}</p></div>${convHtml}<div style="margin-top:12px;padding:10px;background:#1a2a1a;border-radius:8px;"><p style="color:#00D4AA;margin:0;">💡 Comunícate con el cliente al +${phone}</p></div></div></div>`;
  await sendEmail(config.order_email, `⚠️ ALICIA - Cliente +${phone}`, html);
}

// ==================== SALES NUDGE SYSTEM ====================

async function runSalesNudgeCheck() {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: dyingConvs } = await supabase
      .from("whatsapp_conversations")
      .select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at")
      .not(
        "order_status",
        "in",
        '("none","confirmed","followup_sent","nudge_sent","pending_confirmation","pending_button_confirmation","pre_order","emailed","sent")',
      )
      .lt("updated_at", twoMinAgo);
    const { data: abandonedConvs } = await supabase
      .from("whatsapp_conversations")
      .select("id, customer_phone, restaurant_id, messages, order_status, customer_name, current_order, last_nudge_at")
      .not(
        "order_status",
        "in",
        '("none","confirmed","followup_sent","nudge_sent","pending_confirmation","pending_button_confirmation","pre_order","emailed","sent")',
      )
      .lt("updated_at", twoMinAgo);
    const reallyAbandoned = (abandonedConvs || []).filter((c: any) => {
      const m = Array.isArray(c.messages) ? c.messages : [];
      if (m.length < 3) return false;
      let count = 0;
      for (let i = m.length - 1; i >= 0; i--) {
        if (m[i].role === "customer") count++;
        else break;
      }
      return count >= 3;
    });
    const allConvs = [...(dyingConvs || [])];
    const existingIds = new Set(allConvs.map((c: any) => c.id));
    for (const ac of reallyAbandoned) {
      if (!existingIds.has(ac.id)) {
        allConvs.push(ac);
        existingIds.add(ac.id);
      }
    }
    if (allConvs.length === 0) return { nudged: 0 };
    let nudgedCount = 0;
    for (const conv of allConvs) {
      if (conv.last_nudge_at && new Date(conv.last_nudge_at).toISOString() > tenMinAgo) continue;
      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      // Skip if assistant responded recently (< 5 min) — avoid nudging while waiting for user confirmation
      const lastAssistantMsg = msgs.filter((m: any) => m.role === "assistant").pop();
      if (lastAssistantMsg?.timestamp) {
        const lastTime = new Date(lastAssistantMsg.timestamp).getTime();
        if (Date.now() - lastTime < 5 * 60 * 1000) continue;
      }
      const lastMsg = msgs[msgs.length - 1];
      let consecutiveCustomerMsgs = 0;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "customer") consecutiveCustomerMsgs++;
        else break;
      }
      const isConvAbandoned = consecutiveCustomerMsgs >= 3;
      if (!isConvAbandoned) {
        if (!lastMsg || lastMsg.role !== "assistant" || lastMsg.is_nudge) continue;
      }
      const { data: waConfig } = await supabase
        .from("whatsapp_configs")
        .select("whatsapp_phone_id, whatsapp_access_token, restaurant_id")
        .eq("restaurant_id", conv.restaurant_id)
        .maybeSingle();
      const phoneId = waConfig?.whatsapp_phone_id || GLOBAL_WA_PHONE_ID;
      const waToken =
        waConfig?.whatsapp_access_token && waConfig.whatsapp_access_token !== "ENV_SECRET"
          ? waConfig.whatsapp_access_token
          : GLOBAL_WA_TOKEN;
      if (!phoneId || !waToken) continue;
      const closerPrompt = isConvAbandoned
        ? `Eres Alicia. El cliente envió mensajes sin respuesta. Discúlpate BREVEMENTE y responde. NO markdown. Max 1 emoji. Corto.\nPEDIDO: ${conv.current_order ? JSON.stringify(conv.current_order) : "N/A"}\nCliente: ${conv.customer_name || "?"}`
        : `Eres Alicia. Cliente dejó de responder. Seguimiento MUY corto. NO markdown. Max 1 emoji.\nPEDIDO: ${conv.current_order ? JSON.stringify(conv.current_order) : "N/A"}`;
      const nudgeMsg = await callAI(closerPrompt, msgs.slice(-10), 0.6);
      if (!nudgeMsg) continue; // AI returned empty — skip this nudge silently
      const cleanNudge = nudgeMsg
        .replace(/---[A-Z_]+---[\s\S]*?---[A-Z_]+---/g, "")
        .replace(/\*+/g, "")
        .trim();
      const FALLBACK_MSG = "Lo siento, no pude procesar tu mensaje";
      if (!cleanNudge || cleanNudge.includes(FALLBACK_MSG)) continue; // Never send fallback as nudge
      await supabase
        .from("whatsapp_conversations")
        .update({ last_nudge_at: new Date().toISOString(), order_status: "nudge_sent" })
        .eq("id", conv.id);
      await sendWA(phoneId, waToken, conv.customer_phone, cleanNudge, true);
      msgs.push({ role: "assistant", content: cleanNudge, timestamp: new Date().toISOString(), is_nudge: true });
      await supabase
        .from("whatsapp_conversations")
        .update({ messages: msgs.slice(-30) })
        .eq("id", conv.id);
      nudgedCount++;
    }
    return { nudged: nudgedCount };
  } catch (e) {
    console.error("Sales nudge error:", e);
    return { nudged: 0 };
  }
}

// ==================== ADMIN ENDPOINTS ====================

async function handleAdminAction(url: URL, req: Request): Promise<Response | null> {
  const action = url.searchParams.get("action");
  if (!action) return null;

  switch (action) {
    case "subscribe_waba": {
      const wabaId = url.searchParams.get("waba_id") || "1203273002014817";
      const callbackUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
      const subRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${wabaId}/subscribed_apps`, {
        method: "POST",
        headers: { Authorization: `Bearer ${GLOBAL_WA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ override_callback_uri: callbackUrl, verify_token: VERIFY_TOKEN }),
      });
      const subData = await subRes.json();
      const checkRes = await fetch(`https://graph.facebook.com/${WA_API_VERSION}/${wabaId}/subscribed_apps`, {
        headers: { Authorization: `Bearer ${GLOBAL_WA_TOKEN}` },
      });
      const checkData = await checkRes.json();
      return new Response(JSON.stringify({ subscribe_result: subData, current_subscriptions: checkData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "send_escalation_email": {
      const phone = url.searchParams.get("phone") || "";
      const reason = url.searchParams.get("reason") || "Escalamiento manual";
      const { data: cfgData } = await supabase.from("whatsapp_configs").select("*").limit(1).maybeSingle();
      if (!cfgData)
        return new Response(JSON.stringify({ error: "No config" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { data: convData } = await supabase
        .from("whatsapp_conversations")
        .select("messages")
        .eq("customer_phone", phone)
        .maybeSingle();
      await escalate(cfgData, phone, reason, convData?.messages || []);
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "reset_conv": {
      const phone = url.searchParams.get("phone") || "";
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ order_status: "none", current_order: null, messages: [], payment_proof_url: null })
        .eq("customer_phone", phone);
      return new Response(JSON.stringify({ reset: !error, error }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "resend_recent_orders": {
      // Reenvía emails de todos los pedidos recientes al correo configurado en whatsapp_configs
      let bodyResend: any = {};
      try {
        bodyResend = await req.clone().json();
      } catch (_) {}
      const daysBack = parseInt(url.searchParams.get("days") || "7");
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
      const resendRestaurantId = bodyResend.restaurant_id;

      // Read configured order_email from whatsapp_configs (respects the actual config)
      let overrideTo = bodyResend.override_email || null;
      if (!overrideTo && resendRestaurantId) {
        const { data: cfgRow } = await supabase
          .from("whatsapp_configs")
          .select("order_email")
          .eq("restaurant_id", resendRestaurantId)
          .maybeSingle();
        overrideTo = cfgRow?.order_email || null;
      }
      if (!overrideTo) overrideTo = "conektaolatam@gmail.com"; // final fallback

      const ordersQuery = supabase
        .from("whatsapp_orders")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (resendRestaurantId) ordersQuery.eq("restaurant_id", resendRestaurantId);

      const { data: recentOrders } = await ordersQuery;
      if (!recentOrders?.length)
        return new Response(JSON.stringify({ sent: 0, message: "No orders found in period" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      let sentCount = 0;
      const results: any[] = [];
      for (const order of recentOrders) {
        try {
          const isDelivery = order.delivery_type === "delivery";
          const html = buildOrderEmailHtml(order as any, order.customer_phone, isDelivery);
          const dateStr = new Date(order.created_at).toLocaleString("es-CO", { timeZone: "America/Bogota" });
          const subject = `🍕 [${dateStr}] ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`;
          const sent = await sendEmail(overrideTo, subject, html);
          if (sent) sentCount++;
          results.push({
            order_id: order.id,
            customer: order.customer_name,
            total: order.total,
            sent,
            date: order.created_at,
          });
        } catch (e: any) {
          results.push({ order_id: order.id, error: e?.message });
        }
      }
      return new Response(JSON.stringify({ sent: sentCount, total: recentOrders.length, to: overrideTo, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "save_manual_order": {
      // Inserta un pedido manual y envía email — para conversaciones donde current_order quedó null
      // POST body: { conversation_id, customer_phone, customer_name, items, total, delivery_type, delivery_address, payment_method, restaurant_id }
      let body: any = {};
      try {
        body = await req.clone().json();
      } catch (_) {}
      const rid = body.restaurant_id;
      if (!rid)
        return new Response(JSON.stringify({ error: "restaurant_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const cid = body.conversation_id;
      const phone = body.customer_phone;
      if (!cid || !phone)
        return new Response(JSON.stringify({ error: "conversation_id and customer_phone required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      const order = {
        customer_name: body.customer_name || "Cliente",
        items: body.items || [],
        total: body.total || 0,
        subtotal: body.subtotal || body.total || 0,
        delivery_type: body.delivery_type || "delivery",
        delivery_address: body.delivery_address || null,
        payment_method: body.payment_method || "Efectivo",
        observations: body.observations || null,
        packaging_total: body.packaging_total || 0,
      };

      // Insert order
      const { data: saved, error: insErr } = await supabase
        .from("whatsapp_orders")
        .insert({
          restaurant_id: rid,
          conversation_id: cid,
          customer_phone: phone,
          customer_name: order.customer_name,
          items: order.items,
          total: order.total,
          delivery_type: order.delivery_type === "delivery" ? "delivery" : "pickup",
          delivery_address: order.delivery_address,
          status: "received",
          email_sent: false,
        })
        .select()
        .single();

      if (insErr)
        return new Response(JSON.stringify({ error: insErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // Update conversation to confirmed
      await supabase
        .from("whatsapp_conversations")
        .update({ order_status: "confirmed", current_order: order, pending_since: null })
        .eq("id", cid);

      // Send email
      const { data: cfg } = await supabase
        .from("whatsapp_configs")
        .select("order_email")
        .eq("restaurant_id", rid)
        .maybeSingle();

      let emailSent = false;
      if (cfg?.order_email) {
        const isDelivery = order.delivery_type === "delivery";
        const html = buildOrderEmailHtml(order, phone, isDelivery);
        const dateStr = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name} - $${order.total.toLocaleString("es-CO")}`;
        emailSent = await sendEmail(cfg.order_email, subject, html);
        if (emailSent) {
          await supabase.from("whatsapp_orders").update({ email_sent: true, status: "confirmed" }).eq("id", saved.id);
          await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", cid);
        }
      }

      return new Response(JSON.stringify({ order_id: saved.id, email_sent: emailSent, to: cfg?.order_email }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "resend_order_email": {
      const orderId = url.searchParams.get("order_id") || "";
      const { data: orderData, error: oErr } = await supabase
        .from("whatsapp_orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (oErr || !orderData)
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { data: cfgData } = await supabase
        .from("whatsapp_configs")
        .select("order_email")
        .eq("restaurant_id", orderData.restaurant_id)
        .maybeSingle();
      if (!cfgData?.order_email)
        return new Response(JSON.stringify({ error: "No email config" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const isDelivery = orderData.delivery_type === "delivery";
      const html = buildOrderEmailHtml(orderData as any, orderData.customer_phone, isDelivery);
      const sent = await sendEmail(
        cfgData.order_email,
        `🍕 [REENVÍO] Pedido - ${orderData.customer_name} - $${(orderData.total || 0).toLocaleString("es-CO")}`,
        html,
      );
      return new Response(JSON.stringify({ sent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "update_email": {
      const email = url.searchParams.get("email") || "";
      const targetRestId = url.searchParams.get("restaurant_id") || "";
      if (!targetRestId || !email)
        return new Response(JSON.stringify({ error: "restaurant_id and email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const { error } = await supabase
        .from("whatsapp_configs")
        .update({ order_email: email })
        .eq("restaurant_id", targetRestId);
      return new Response(JSON.stringify({ updated: !error, email, restaurant_id: targetRestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "check_nudges": {
      const result = await runSalesNudgeCheck();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    case "send_message": {
      const phone = url.searchParams.get("phone") || "";
      const message = url.searchParams.get("message") || "";
      const msgRestId = url.searchParams.get("restaurant_id") || "";
      if (!phone || !message)
        return new Response(JSON.stringify({ error: "phone and message required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      // Resolve per-business config
      let msgPid = GLOBAL_WA_PHONE_ID,
        msgToken = GLOBAL_WA_TOKEN;
      if (msgRestId) {
        const { data: msgCfg } = await supabase
          .from("whatsapp_configs")
          .select("whatsapp_phone_number_id, whatsapp_access_token")
          .eq("restaurant_id", msgRestId)
          .maybeSingle();
        if (msgCfg?.whatsapp_phone_number_id) msgPid = msgCfg.whatsapp_phone_number_id;
        if (msgCfg?.whatsapp_access_token && msgCfg.whatsapp_access_token !== "ENV_SECRET")
          msgToken = msgCfg.whatsapp_access_token;
      }
      await sendWA(msgPid, msgToken, phone, message);
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("customer_phone", phone)
        .maybeSingle();
      if (conv) {
        const msgs = conv.messages || [];
        msgs.push({ role: "assistant", content: message, ts: new Date().toISOString() });
        await supabase.from("whatsapp_conversations").update({ messages: msgs }).eq("id", conv.id);
      }
      return new Response(JSON.stringify({ sent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    default:
      return null;
  }
}

// ==================== MAIN WEBHOOK HANDLER ====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // Handle admin actions
  const adminResponse = await handleAdminAction(url, req);
  if (adminResponse) return adminResponse;

  // GET: Webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }

  // POST: Incoming messages
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const value = body.entry?.[0]?.changes?.[0]?.value;
      if (!value?.messages?.length)
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // Run sales nudge check ONLY when there's a real message (not status updates)
      await runSalesNudgeCheck();

      const msg = value.messages[0];
      const phoneId = value.metadata?.phone_number_id;
      const from = msg.from;

      // ── Stale pending follow-up check (with dedup guards) ──
      try {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: staleConvs } = await supabase
          .from("whatsapp_conversations")
          .select("id, customer_phone, restaurant_id, pending_since")
          .in("order_status", ["pending_confirmation", "pending_button_confirmation"])
          .lt("pending_since", fiveMinAgo)
          .lt("updated_at", twoMinAgo)
          .neq("customer_phone", from)
          .or(`follow_up_sent_at.is.null,follow_up_sent_at.lt.${thirtyMinAgo}`);

        if (staleConvs?.length) {
          for (const stale of staleConvs) {
            const { data: staleConfig } = await supabase
              .from("whatsapp_configs")
              .select("whatsapp_phone_number_id, whatsapp_access_token")
              .eq("restaurant_id", stale.restaurant_id)
              .maybeSingle();
            const stalePid = staleConfig?.whatsapp_phone_number_id || GLOBAL_WA_PHONE_ID;
            const staleToken =
              staleConfig?.whatsapp_access_token && staleConfig.whatsapp_access_token !== "ENV_SECRET"
                ? staleConfig.whatsapp_access_token
                : GLOBAL_WA_TOKEN;
            console.log(`⚠️ FOLLOW-UP: Stale pending for ${stale.customer_phone} (restaurant: ${stale.restaurant_id})`);
            const followUpMsg =
              "Hola! Vi que estábamos armando tu pedido pero no alcancé a recibir tu confirmación. Si quieres confirmarlo, escríbeme: confirmar pedido 😊";
            await sendWA(stalePid, staleToken, stale.customer_phone, followUpMsg);
            const { data: staleConv } = await supabase
              .from("whatsapp_conversations")
              .select("messages")
              .eq("id", stale.id)
              .single();
            const staleMsgs = Array.isArray(staleConv?.messages) ? staleConv.messages : [];
            staleMsgs.push({ role: "assistant", content: followUpMsg, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({
                messages: staleMsgs.slice(-30),
                order_status: "followup_sent",
                pending_since: null,
                follow_up_sent_at: new Date().toISOString(),
              })
              .eq("id", stale.id);
          }
        }
      } catch (e) {
        console.error("Follow-up check error:", e);
      }

      // ===== MESSAGE TYPE HANDLING =====
      let text = msg.text?.body || msg.button?.text || "";
      let paymentProofUrl: string | null = null;
      let buttonReplyId: string | null = null;

      if (msg.type === "interactive" && msg.interactive?.button_reply) {
        // Interactive button reply
        buttonReplyId = msg.interactive.button_reply.id;
        text = msg.interactive.button_reply.title || "";
        console.log(`🔘 Button reply from ${from}: id="${buttonReplyId}" title="${text}"`);
      } else if (msg.type === "image") {
        const mediaId = msg.image?.id;
        text = msg.image?.caption || "Te envié una foto del comprobante de pago";
        if (mediaId) {
          // Use per-business token resolved after config load; deferred to after config section
          paymentProofUrl = "__DEFERRED_IMAGE__:" + mediaId;
        }
      } else if (msg.type === "audio") {
        const audioId = msg.audio?.id;
        if (audioId) {
          // Deferred — will be processed after config is loaded with per-business token
          text = "__DEFERRED_AUDIO__:" + audioId;
        } else {
          text = "[El cliente envió un audio]";
        }
      } else if (msg.type === "sticker") {
        text = "[El cliente envió un sticker 😄]";
      } else if (msg.type === "reaction") {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Msg from ${from}: "${text}" (type: ${msg.type})`);
      if (!text.trim())
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      // ===== GET CONFIG (MULTI-TENANT SAFE) =====
      let config: any = null;
      let token = GLOBAL_WA_TOKEN;
      let pid = phoneId || GLOBAL_WA_PHONE_ID;

      const { data: cd } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("whatsapp_phone_number_id", phoneId)
        .eq("is_active", true)
        .maybeSingle();
      if (cd) {
        config = cd;
        if (cd.whatsapp_access_token && cd.whatsapp_access_token !== "ENV_SECRET") token = cd.whatsapp_access_token;
      } else {
        // NO FALLBACK — each business must have its own config mapped by phone_number_id
        console.warn(`⚠️ NO CONFIG for phone_number_id=${phoneId}. No fallback.`);
      }

      if (!config) {
        await sendWA(pid, token, from, "Lo siento, este número aún no está configurado. 🙏");
        return new Response(JSON.stringify({ status: "no_config" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await markRead(pid, token, msg.id);
      const rId = config.restaurant_id;

      // ===== DEFERRED MEDIA: now process with per-business token =====
      if (typeof paymentProofUrl === "string" && paymentProofUrl.startsWith("__DEFERRED_IMAGE__:")) {
        const mediaId = paymentProofUrl.replace("__DEFERRED_IMAGE__:", "");
        paymentProofUrl = await downloadAndUploadMedia(mediaId, token, "payment-proofs", "image/jpeg");
      }
      if (text.startsWith("[Audio transcrito]:") || text === "[El cliente envió un audio]") {
        // Already processed with placeholder — re-check
      }
      // Handle deferred audio
      const deferredAudioMatch = text.match(/^__DEFERRED_AUDIO__:(.+)$/);
      if (deferredAudioMatch) {
        const audioId = deferredAudioMatch[1];
        try {
          const audioUrl = await downloadAndUploadMedia(audioId, token, "audio-messages", "audio/ogg");
          if (audioUrl) {
            const transcription = await transcribeAudio(audioUrl);
            text = transcription
              ? `[Audio transcrito]: ${transcription}`
              : "[El cliente envió un audio que no se pudo transcribir]";
          } else {
            text = "[El cliente envió un audio]";
          }
        } catch (e) {
          console.error("Audio processing error:", e);
          text = "[El cliente envió un audio]";
        }
      }

      // ===== BLOCKED NUMBER CHECK =====
      const { data: blockedEntry } = await supabase
        .from("whatsapp_blocked_numbers")
        .select("id")
        .eq("restaurant_id", rId)
        .eq("phone_number", from)
        .maybeSingle();

      if (blockedEntry) {
        console.log(`🚫 BLOCKED: Message from ${from} ignored (blocked number)`);
        return new Response(JSON.stringify({ status: "blocked" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // ===== END BLOCKED NUMBER CHECK =====

      // ===== RATE LIMITING =====
      if (isRateLimited(from, rId)) {
        tlog("warn", rId, `RATE_LIMITED: ${from} exceeded ${RATE_LIMIT} msgs/min`);
        return new Response(JSON.stringify({ status: "rate_limited" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      tlog("info", rId, `MSG from ${from}: "${text.substring(0, 80)}" (type: ${msg.type})`);
      const conv = await getConversation(rId, from, text);

      // ===== HANDLE AFFIRMATIVE CONFIRMATION =====
      const lowerTextTrim = text
        .toLowerCase()
        .trim()
        .replace(/[.,!?¿¡]+/g, "")
        .trim();

      // --- EMAIL RETRY: If confirmed but email never sent, retry before anything else ---
      if (conv.order_status === "confirmed" && conv.current_order) {
        const { data: pendingOrder } = await supabase
          .from("whatsapp_orders")
          .select("id, email_sent")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingOrder && !pendingOrder.email_sent) {
          console.log(`📧 EMAIL_PENDING_RETRY: order_id=${pendingOrder.id} - retrying email`);
          const orderData: any = conv.current_order;
          const isDelivery = orderData?.delivery_type === "delivery";
          const html = buildOrderEmailHtml(orderData, from, isDelivery);
          const subject = `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${orderData?.customer_name || "Cliente"} - $${(orderData?.total || 0).toLocaleString("es-CO")}`;
          const retried = await sendEmail(config.order_email, subject, html);
          if (retried) {
            await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", pendingOrder.id);
            await supabase.from("whatsapp_conversations").update({ order_status: "emailed" }).eq("id", conv.id);
            console.log(`📧 EMAIL_RETRY_SUCCESS: order_id=${pendingOrder.id} → emailed`);
            // Update conv locally for the rest of this request
            conv.order_status = "emailed";
          } else {
            console.log(`📧 EMAIL_RETRY_FAIL: order_id=${pendingOrder.id} - will retry on next message`);
          }
        }
      }

      // --- IDEMPOTENCY: If already confirmed/emailed, never re-confirm ---
      if ((conv.order_status === "confirmed" || conv.order_status === "emailed") && conv.current_order) {
        // Check if user is trying to confirm again
        const affirmativeWords =
          /(si|sí|confirmar|confirmo|dale|listo|ok|perfecto|de una|sisas|hagale|hágale|va|claro|bueno|hecho|correcto|✅|👍)/i;
        if (affirmativeWords.test(lowerTextTrim)) {
          console.log(`🔁 IDEMPOTENCY: Already ${conv.order_status} for ${from}. Skipping re-confirm.`);
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });
          const resp = "Ya quedó confirmado ✅ Tu pedido está en preparación";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: convMsgs.slice(-30) })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "already_confirmed_idempotent" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Not affirmative on confirmed order — fall through to post-confirmation handling below
      }

      // --- ROBUST CONFIRMATION DETECTION ---
      // Instead of exact match, detect affirmative INTENT even with extra text like "en efectivo sí"
      const affirmativeKeywords =
        /\b(si|sí|confirmar|confirmo|dale|listo|va|claro|ok|okey|okay|perfecto|de una|deuna|correcto|bien|todo bien|vamos|adelante|manda|envía|envia|ya|eso es|hecho|sale|sisas|hagale|hágale|sii|siii|siiii|sep|sepp|aja|ajá|venga|bueno|va pues|hagámosle|confirmado)\b/i;
      const negativeKeywords =
        /\b(no|cancel|cancelar|no quiero|dejalo|déjalo|nada|olvida|cambiar|cambio|modificar|quitar|quita|agregar|corregir)\b/i;
      const emojiAffirmative = /[✅👍🔥]/.test(text);
      const isAffirmative =
        !negativeKeywords.test(lowerTextTrim) && (affirmativeKeywords.test(lowerTextTrim) || emojiAffirmative);

      // ── BACKEND DETERMINISTIC CONFIRMATION ─────────────────────────────────────
      // The LLM ONLY converses. The backend decides to confirm.
      // If user is affirmative AND there's a valid order (either in conv or in DB fallback):
      if (
        isAffirmative &&
        (conv.order_status === "pending_confirmation" ||
          conv.order_status === "pending_button_confirmation" ||
          conv.order_status === "active")
      ) {
        // ── RESOLVE ORDER: from conv OR from DB fallback (tag-failure protection) ──
        let resolvedOrder = conv.current_order;

        if (!resolvedOrder) {
          // Gemini may have failed to output the tag — look for the most recent DB order
          const { data: lastDbOrder } = await supabase
            .from("whatsapp_orders")
            .select("*")
            .eq("conversation_id", conv.id)
            .eq("restaurant_id", rId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastDbOrder && lastDbOrder.status !== "confirmed") {
            resolvedOrder = {
              items: lastDbOrder.items,
              total: lastDbOrder.total,
              delivery_type: lastDbOrder.delivery_type,
              delivery_address: lastDbOrder.delivery_address,
              customer_name: lastDbOrder.customer_name,
              payment_method: "efectivo",
            };
            console.log(`🔄 FALLBACK_ORDER: Resolved order from DB for conv ${conv.id}, total: ${lastDbOrder.total}`);
          }
        }

        if (!resolvedOrder) {
          // No order found anywhere — user said "yes" but there's nothing to confirm
          // This happens when they say something affirmative before ordering
          console.log(
            `⚠️ CONFIRM_NO_ORDER { phone: "${from}", status: "${conv.order_status}" } — falling through to AI`,
          );
          // Do NOT return here — fall through to normal AI processing
        } else {
          console.log(
            `✅ CONFIRM_DETECTED { phone: "${from}", status: "${conv.order_status}", matched_phrase: "${lowerTextTrim}" }`,
          );

          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });

          // ── IDEMPOTENCY: Check for existing confirmed order (30s window) ──
          const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
          const { data: existingEvent } = await supabase
            .from("whatsapp_orders")
            .select("id")
            .eq("conversation_id", conv.id)
            .eq("restaurant_id", rId)
            .in("status", ["received", "confirmed"])
            .gt("created_at", thirtySecsAgo)
            .limit(1)
            .maybeSingle();

          if (existingEvent) {
            console.log(`🔁 IDEMPOTENCY: Order already exists for conversation ${conv.id}. Skipping duplicate.`);
            const { isOpen: idempOpen, isPreOrder: idempPreOrder } = isRestaurantOpen(config);
            const resp =
              idempOpen && !idempPreOrder
                ? "Ya quedó confirmado ✅ Tu pedido está en preparación"
                : "Ya quedó registrado ✅ Te avisamos cuando empecemos a preparar";
            const idempStatus = idempOpen && !idempPreOrder ? "confirmed" : "pre_order";
            convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({ messages: convMsgs.slice(-30), order_status: idempStatus, pending_since: null })
              .eq("id", conv.id);
            await sendWA(pid, token, from, resp, true);
            return new Response(JSON.stringify({ status: "confirmed_idempotent" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ── PRICE SNAPSHOT: Re-validate prices from DB at confirmation time ──
          const { data: restaurantProfiles } = await supabase.from("profiles").select("id").eq("restaurant_id", rId);
          const profileIds = (restaurantProfiles || []).map((p: any) => p.id);
          const { data: confirmProds } =
            profileIds.length > 0
              ? await supabase
                  .from("products")
                  .select(
                    "id, name, price, description, category_id, requires_packaging, packaging_price, portions, categories(name)",
                  )
                  .in("user_id", profileIds)
                  .eq("is_active", true)
              : { data: [] };
          const confirmProdsWithCategory = (confirmProds || []).map((p: any) => ({
            ...p,
            category_name: p.categories?.name || "Otros",
          }));

          // ── SYSTEM OVERRIDES: Apply overrides at confirmation time ──
          const confirmOverrides = await getActiveOverrides(rId);
          const effectiveConfirmProds = applyOverridesToProducts(confirmProdsWithCategory, confirmOverrides);

          // ── Check if restaurant is closed by override ──
          if (isRestaurantClosedOverride(confirmOverrides)) {
            const closedResp = "Lo siento, hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏";
            convMsgs.push({ role: "assistant", content: closedResp, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({ messages: convMsgs.slice(-30), order_status: "none", current_order: null, pending_since: null })
              .eq("id", conv.id);
            await sendWA(pid, token, from, closedResp, true);
            return new Response(JSON.stringify({ status: "restaurant_closed_override" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ── Check if delivery is disabled by override ──
          const deliveryTypeCheck = resolvedOrder?.delivery_type || "";
          if (/domicilio|delivery/i.test(deliveryTypeCheck) && isDeliveryDisabledOverride(confirmOverrides)) {
            const noDeliveryResp = buildServiceBlockMessage(confirmOverrides, "delivery", config);
            convMsgs.push({ role: "assistant", content: noDeliveryResp, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({
                messages: convMsgs.slice(-30),
                order_status: "pending_confirmation",
                pending_since: new Date().toISOString(),
              })
              .eq("id", conv.id);
            await sendWA(pid, token, from, noDeliveryResp, true);
            return new Response(JSON.stringify({ status: "delivery_disabled_override" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ── Check if pickup is disabled by override ──
          const isPickupType =
            /recog|pickup/i.test(deliveryTypeCheck) || !/domicilio|delivery/i.test(deliveryTypeCheck);
          if (isPickupType && isPickupDisabledOverride(confirmOverrides)) {
            const noPickupResp = buildServiceBlockMessage(confirmOverrides, "pickup", config);
            convMsgs.push({ role: "assistant", content: noPickupResp, timestamp: new Date().toISOString() });
            await supabase
              .from("whatsapp_conversations")
              .update({
                messages: convMsgs.slice(-30),
                order_status: "pending_confirmation",
                pending_since: new Date().toISOString(),
              })
              .eq("id", conv.id);
            await sendWA(pid, token, from, noPickupResp, true);
            return new Response(JSON.stringify({ status: "pickup_disabled_override" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // ── Check if any ordered items are disabled by override ──
          const confirmDisabledIds = getDisabledProductIds(confirmOverrides);
          if (confirmDisabledIds.size > 0 && resolvedOrder?.items?.length > 0) {
            const blockedItems: string[] = [];
            for (const item of resolvedOrder.items) {
              const itemName = (item.name || item.product || "").toLowerCase().trim();
              for (const dId of confirmDisabledIds) {
                const disabledProd = confirmProdsWithCategory.find((p: any) => p.id === dId);
                if (disabledProd && disabledProd.name.toLowerCase().includes(itemName.split(" ")[0])) {
                  blockedItems.push(disabledProd.name);
                }
              }
            }
            if (blockedItems.length > 0) {
              const blockedResp = `Lo siento, hoy no tenemos disponible: ${blockedItems.join(", ")} 😔 ¿Te gustaría pedir otra cosa?`;
              convMsgs.push({ role: "assistant", content: blockedResp, timestamp: new Date().toISOString() });
              await supabase
                .from("whatsapp_conversations")
                .update({
                  messages: convMsgs.slice(-30),
                  order_status: "active",
                  current_order: null,
                  pending_since: null,
                })
                .eq("id", conv.id);
              await sendWA(pid, token, from, blockedResp, true);
              return new Response(JSON.stringify({ status: "items_disabled_override" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }

          const validated = validateOrder(resolvedOrder, effectiveConfirmProds);

          // ── STEP 1: CONFIRM IMMEDIATELY (email is async, never blocks) ──────
          // Fetch fresh proof from DB (image may have been saved in a previous message)
          const { data: proofCheck } = await supabase
            .from("whatsapp_conversations")
            .select("payment_proof_url")
            .eq("id", conv.id)
            .maybeSingle();
          const storedProof = paymentProofUrl || proofCheck?.payment_proof_url || conv.payment_proof_url || null;
          await saveOrder(rId, conv.id, from, validated.order, config, storedProof);
          console.log(`💾 ORDER_SAVED { conv=${conv.id}, phone: "${from}" }`);

          // Build confirmation message with payment info
          const orderData = typeof validated.order === "object" ? validated.order : {};
          const customerName = (orderData as any)?.customer_name || "";
          const deliveryType = (orderData as any)?.delivery_type || "";
          const paymentMethod = (orderData as any)?.payment_method || "";
          const isDelivery = /domicilio|delivery/i.test(deliveryType);

          let paymentInstruction = "";
          if (isDelivery) {
            if (paymentMethod && /transferencia|nequi|daviplata/i.test(paymentMethod)) {
              paymentInstruction = "\n\n💳 Envíame el comprobante de pago cuando lo tengas";
            } else {
              paymentInstruction = "\n\n💵 Pagas al domiciliario cuando llegue";
            }
          }
          const nameGreeting = customerName ? `, ${customerName}` : "";

          // Check if restaurant is currently open and if it's pre-order time
          const { isOpen, isPreOrder, preOrderMessage } = isRestaurantOpen(config);
          const hours = config?.operating_hours || {};
          const fmt12Conf = (t: string): string => {
            const [h, m] = t.split(":").map(Number);
            const suffix = h >= 12 ? "PM" : "AM";
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return `${h12}:${(m || 0).toString().padStart(2, "0")} ${suffix}`;
          };

          let resp: string;
          let finalStatus: string;

          if (isOpen && !isPreOrder) {
            // Fully operational — send to kitchen
            resp = `Listo${nameGreeting} ✅ Pedido confirmado!\n\nYa lo estamos preparando 🍕\n📩 Pedido enviado a cocina${paymentInstruction}`;
            finalStatus = "confirmed";
          } else if (isOpen && isPreOrder) {
            // Open but before schedule_start — accept as pre-order, do NOT say "sent to kitchen"
            const schedStart = hours.schedule_start || hours.open_time;
            resp = `Listo${nameGreeting} ✅ Pedido recibido!\n\n${preOrderMessage}\n🕐 Empezamos a preparar a las ${fmt12Conf(schedStart)}${paymentInstruction}`;
            finalStatus = "pre_order";
          } else {
            // Closed
            const openTime = hours.open_time || "";
            resp = `Listo${nameGreeting} ✅ Pedido recibido!\n\n🕐 El restaurante abre a las ${openTime}.\n${preOrderMessage}${paymentInstruction}`;
            finalStatus = "pre_order";
          }

          // Save assistant message + final redundant state update
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });

          await supabase
            .from("whatsapp_conversations")
            .update({
              messages: convMsgs.slice(-30),
              order_status: finalStatus,
              current_order: validated.order,
              pending_since: null,
            })
            .eq("id", conv.id);

          console.log(`FINAL_STATE { conv_id: "${conv.id}", status: "${finalStatus}", phone: "${from}" }`);

          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "confirmed_via_backend" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // resolvedOrder null -> user said yes without an active order -> fall through to AI
      }

      // ===== PENDING CONFIRMATION: handle cancel or pass to AI =====
      if (
        (conv.order_status === "pending_confirmation" || conv.order_status === "pending_button_confirmation") &&
        conv.current_order
      ) {
        const lowerText = text
          .toLowerCase()
          .trim()
          .replace(/[.,!?¿¡]+/g, "")
          .trim();
        // Detect "quiero cambiar/modificar/agregar" → reset to active, not cancel
        const changePatterns =
          /^(cambiar|cambiar algo|modificar|agregar|corregir|quiero cambiar|quiero modificar|quiero agregar|cambio)/i;
        if (changePatterns.test(lowerText)) {
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });
          const resp = "Listo, cuéntame qué quieres cambiar y lo ajusto 😊";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({
              messages: convMsgs.slice(-30),
              order_status: "active",
              pending_since: null,
            })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "change_requested" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const cancelPatterns = /^(no|cancel|cancelar|no quiero|dejalo|déjalo|nada|olvida)/i;
        if (cancelPatterns.test(lowerText)) {
          const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
          convMsgs.push({
            role: "customer",
            content: text,
            timestamp: new Date().toISOString(),
            wa_message_id: msg.id,
          });
          const resp = "Listo, cancelé el pedido. Si cambias de opinión, me escribes con mucho gusto 😊";
          convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({
              messages: convMsgs.slice(-30),
              order_status: "none",
              current_order: null,
              pending_since: null,
            })
            .eq("id", conv.id);
          await sendWA(pid, token, from, resp, true);
          return new Response(JSON.stringify({ status: "cancelled_via_text" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Not cancel, not affirmative (already handled above) — fall through to AI
      }

      // ===== POST-CONFIRMATION: New message after order was confirmed/emailed =====
      if (conv.order_status === "confirmed" || conv.order_status === "emailed") {
        const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
        // Check if confirmation was recent (within 2 hours)
        const lastAssistant = [...convMsgs].reverse().find((m: any) => m.role === "assistant");
        const lastAssistantTime = lastAssistant?.timestamp ? new Date(lastAssistant.timestamp).getTime() : 0;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

        if (lastAssistantTime > twoHoursAgo) {
          // Recent confirmation — check if it's a modification request or a new order
          const lowerText = text.toLowerCase().trim();
          const isModification = /cambi|modific|quita|agrega|añad|cancel/i.test(lowerText);

          if (!isModification) {
            // Check if it's a gratitude message — respond warmly without resetting
            const isGratitude = /gracia|thank|chever|genial|perfecto|excelente|buenísimo/i.test(lowerText);
            // Check if it's a follow-up question about their order
            const isFollowUp =
              /cuánto|cuanto|demora|tiempo|llega|lleg[oó]|sale|dónde|donde|estado|seguimiento|rastreo|ya sal/i.test(
                lowerText,
              );

            convMsgs.push({
              role: "customer",
              content: text,
              timestamp: new Date().toISOString(),
              wa_message_id: msg.id,
            });

            if (isGratitude) {
              // Warm farewell — don't reset, don't offer new order
              const farewells = [
                "Con mucho gusto! Que disfrutes tu pedido 🤗",
                "A ti! Buen provecho y aquí estamos cuando quieras 😊",
                "De nada! Que lo disfruten mucho 🤗",
                "Un placer atenderte! Buen provecho 😊",
              ];
              const resp = farewells[Math.floor(Math.random() * farewells.length)];
              convMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
              await supabase
                .from("whatsapp_conversations")
                .update({ messages: convMsgs.slice(-30) })
                .eq("id", conv.id);
              await sendWA(pid, token, from, resp, true);
              return new Response(JSON.stringify({ status: "post_confirmation_gratitude" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            if (isFollowUp) {
              // Follow-up question about existing order — NEVER say it's ready
              const followUpResp =
                conv.current_order?.delivery_method === "delivery"
                  ? "Tu pedido ya está en preparación! Normalmente tarda entre 30-45 minutos en llegar 🛵"
                  : "Tu pedido ya está en preparación! Te avisamos cuando esté listo para recoger 😊";
              convMsgs.push({ role: "assistant", content: followUpResp, timestamp: new Date().toISOString() });
              await supabase
                .from("whatsapp_conversations")
                .update({ messages: convMsgs.slice(-30) })
                .eq("id", conv.id);
              await sendWA(pid, token, from, followUpResp, true);
              return new Response(JSON.stringify({ status: "post_confirmation_followup" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }

            // Not gratitude, not follow-up, not modification — let AI handle naturally
            // Don't reset immediately, fall through to normal AI processing
          }
          // If modification, fall through to normal AI processing which handles ---CAMBIO--- and ---ADICION--- tags
        } else {
          // Old confirmation (>2 hours) — reset to fresh conversation
          await supabase
            .from("whatsapp_conversations")
            .update({
              order_status: "none",
              current_order: null,
            })
            .eq("id", conv.id);
          // Fall through to normal processing as new conversation
        }
      }

      // ===== NORMAL MESSAGE PROCESSING =====
      // Products are linked via user_id -> profiles.restaurant_id, not directly
      const { data: restProfiles } = await supabase.from("profiles").select("id").eq("restaurant_id", rId);
      const restProfileIds = (restProfiles || []).map((p: any) => p.id);
      const { data: prods } =
        restProfileIds.length > 0
          ? await supabase
              .from("products")
              .select(
                "id, name, price, description, category_id, requires_packaging, packaging_price, portions, categories(name)",
              )
              .in("user_id", restProfileIds)
              .eq("is_active", true)
              .order("name")
          : { data: [] };

      console.log(`📋 Products loaded for restaurant ${rId}: ${(prods || []).length} products found`);
      // Flatten category name for prompt building
      const prodsWithCategory = (prods || []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name || "Otros",
      }));

      // ── SYSTEM OVERRIDES: Load active overrides for this restaurant ──
      const activeOverrides = await getActiveOverrides(rId);
      const effectiveProducts = applyOverridesToProducts(prodsWithCategory, activeOverrides);
      const overridePromptBlock = buildOverridePromptBlock(prodsWithCategory, activeOverrides);
      tlog(
        "info",
        rId,
        `System overrides loaded: ${activeOverrides.length} active, ${effectiveProducts.length}/${prodsWithCategory.length} products effective`,
      );

      // ── RESTAURANT AVAILABILITY CHECK: Block early if closed ──
      const availability = checkRestaurantAvailability(config, activeOverrides, config.daily_overrides || []);
      if (availability.blocked) {
        tlog("info", rId, `Restaurant blocked: ${availability.message.substring(0, 60)}`);
        const convMsgs = Array.isArray(conv.messages) ? conv.messages : [];
        convMsgs.push({ role: "customer", content: text, timestamp: new Date().toISOString() });
        convMsgs.push({ role: "assistant", content: availability.message, timestamp: new Date().toISOString() });
        await supabase
          .from("whatsapp_conversations")
          .update({ messages: convMsgs.slice(-30), order_status: "none", current_order: null })
          .eq("id", conv.id);
        await sendWA(pid, token, from, availability.message, true);
        return new Response(JSON.stringify({ status: "restaurant_unavailable" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: rest } = await supabase.from("restaurants").select("id, name").eq("id", rId).single();
      const rName = rest?.name || "Restaurante";

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      const currentWaMessageId = msg.id;
      msgs.push({
        role: "customer",
        content: text,
        timestamp: new Date().toISOString(),
        has_image: !!paymentProofUrl,
        wa_message_id: currentWaMessageId,
      });

      // === MESSAGE BATCHING ===
      await supabase
        .from("whatsapp_conversations")
        .update({ messages: msgs.slice(-30) })
        .eq("id", conv.id);

      console.log(`⏳ MESSAGE BATCH: Waiting 4s for ${from}... (wa_id: ${currentWaMessageId})`);
      await sleep(4000);

      const { data: freshConv } = await supabase
        .from("whatsapp_conversations")
        .select("messages, order_status, current_order, customer_name, payment_proof_url, updated_at")
        .eq("id", conv.id)
        .single();

      const freshMsgs = Array.isArray(freshConv?.messages) ? freshConv.messages : msgs;

      // Dedup by wa_message_id
      const lastCustomerMsg = [...freshMsgs].reverse().find((m: any) => m.role === "customer");
      if (lastCustomerMsg?.wa_message_id && lastCustomerMsg.wa_message_id !== currentWaMessageId) {
        console.log(`⏭️ BATCH SKIP: Newer message found for ${from}. Safety net...`);
        await sleep(5000);
        const { data: safetyCheck } = await supabase
          .from("whatsapp_conversations")
          .select("messages")
          .eq("id", conv.id)
          .single();
        const safetyMsgs = Array.isArray(safetyCheck?.messages) ? safetyCheck.messages : [];
        const lastMsgAfterWait = safetyMsgs[safetyMsgs.length - 1];

        if (lastMsgAfterWait?.role === "assistant") {
          console.log(`✅ SAFETY NET OK: Assistant responded for ${from}`);
          return new Response(JSON.stringify({ status: "batched_safe" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`🚨 SAFETY NET TRIGGERED: No response after 8s for ${from}. Emergency processing...`);
      }

      // Merge consecutive customer messages for AI
      const mergedMsgs: any[] = [];
      const trailingCustomerTexts: string[] = [];
      for (let i = freshMsgs.length - 1; i >= 0; i--) {
        if (freshMsgs[i].role === "customer") trailingCustomerTexts.unshift(freshMsgs[i].content);
        else break;
      }
      const nonTrailingCount = freshMsgs.length - trailingCustomerTexts.length;
      for (let i = 0; i < nonTrailingCount; i++) mergedMsgs.push(freshMsgs[i]);
      if (trailingCustomerTexts.length > 1) {
        console.log(`📦 BATCH MERGED: ${trailingCustomerTexts.length} messages from ${from}`);
      }
      mergedMsgs.push({
        role: "customer",
        content: trailingCustomerTexts.join("\n"),
        timestamp: new Date().toISOString(),
      });

      // === COMPRESS GREETING LOOPS ===
      // Remove repetitive hola→saludo cycles that bias the model into copying old patterns
      const compressedMsgs: any[] = [];
      let greetingLoopCount = 0;
      for (let i = 0; i < mergedMsgs.length; i++) {
        const m = mergedMsgs[i];
        const next = mergedMsgs[i + 1];
        // Detect pattern: customer greeting followed by assistant greeting response
        if (
          m.role === "customer" &&
          isGreetingMessage(m.content) &&
          next?.role === "assistant" &&
          greetingLoopCount >= 1 // Keep the first greeting cycle, compress subsequent ones
        ) {
          greetingLoopCount++;
          i++; // Skip the assistant response too
          continue;
        }
        if (m.role === "customer" && isGreetingMessage(m.content)) {
          greetingLoopCount++;
        }
        compressedMsgs.push(m);
      }
      if (greetingLoopCount > 2) {
        console.log(`🗜️ GREETING_COMPRESS: Removed ${greetingLoopCount - 1} redundant greeting cycles for ${from}`);
      }
      // Use compressed messages for AI call
      const finalMsgs = compressedMsgs;

      // Store payment proof
      if (paymentProofUrl) {
        await supabase.from("whatsapp_conversations").update({ payment_proof_url: paymentProofUrl }).eq("id", conv.id);
      }

      // Build prompt and call AI
      const freshOrderStatus = freshConv?.order_status || conv.order_status;
      const freshCurrentOrder = freshConv?.current_order || conv.current_order;
      const freshCustomerName = freshConv?.customer_name || conv.customer_name;
      const configWithTime = {
        ...config,
        _confirmed_at: freshOrderStatus === "confirmed" ? freshConv?.updated_at || conv.updated_at : null,
      };

      // === CUSTOMER MEMORY INJECTION ===
      // Load persistent customer profile (non-blocking — returns null on failure)
      const waCustomer = await getOrCreateWaCustomer(from, rId);
      const customerMemoryCtx = buildCustomerMemoryContext(waCustomer);

      // ── Detect stale "closed" messages in history when restaurant is NOW OPEN ──
      let reopenHint = "";
      if (!isRestaurantClosedOverride(activeOverrides)) {
        const recentMsgs = (finalMsgs || []).slice(-10);
        const hasStaleClosedMsg = recentMsgs.some(
          (m: any) => m.role === "assistant" && /cerrado|closed|cerrada|cerramos/i.test(m.content || ""),
        );
        if (hasStaleClosedMsg) {
          reopenHint =
            "\n\nIMPORTANTE: El restaurante está ABIERTO ahora. Ignora cualquier mensaje anterior que diga que está cerrado. Responde con normalidad y toma pedidos.";
        }
      }

      // Detect stale "no delivery" messages when delivery is now available
      if (!isDeliveryDisabledOverride(activeOverrides)) {
        const recentMsgs = (mergedMsgs || []).slice(-10);
        const hasStaleDeliveryMsg = recentMsgs.some(
          (m: any) => m.role === "assistant" && /no.*(domicilio|delivery|servicio de domicilio)/i.test(m.content || ""),
        );
        if (hasStaleDeliveryMsg) {
          reopenHint +=
            "\n\nIMPORTANTE: El servicio de DOMICILIO está disponible ahora. Ignora mensajes anteriores que digan que no hay domicilio. Ofrece domicilio con normalidad.";
        }
      }

      // Detect stale "no pickup" messages when pickup is now available
      if (!isPickupDisabledOverride(activeOverrides)) {
        const recentMsgs = (mergedMsgs || []).slice(-10);
        const hasStalePickupMsg = recentMsgs.some(
          (m: any) => m.role === "assistant" && /no.*(recogida|recoger|pickup)/i.test(m.content || ""),
        );
        if (hasStalePickupMsg) {
          reopenHint +=
            "\n\nIMPORTANTE: El servicio de RECOGIDA está disponible ahora. Ignora mensajes anteriores que digan que no hay recogida.";
        }
      }

      const sys =
        buildPrompt(
          effectiveProducts || [],
          config.promoted_products || [],
          config.greeting_message || "Hola! Bienvenido 👋",
          rName,
          freshCurrentOrder,
          freshOrderStatus,
          configWithTime,
          freshCustomerName || waCustomer?.name || "",
        ) +
        customerMemoryCtx +
        overridePromptBlock +
        reopenHint;

      // === PRICE QUESTION INTERCEPTOR ===
      // Check if user is asking a price question — respond with DB prices, skip AI
      const userTextForPrice = trailingCustomerTexts.join(" ");
      const priceAnswer = handlePriceQuestion(userTextForPrice, effectiveProducts || [], config);
      if (priceAnswer) {
        console.log(`💰 PRICE QUESTION intercepted for ${from}: "${userTextForPrice.substring(0, 60)}"`);
        freshMsgs.push({ role: "assistant", content: priceAnswer, timestamp: new Date().toISOString() });
        await supabase
          .from("whatsapp_conversations")
          .update({
            messages: freshMsgs.slice(-30),
            customer_name: freshCustomerName,
            current_order: freshCurrentOrder,
            order_status: freshOrderStatus,
          })
          .eq("id", conv.id);
        await sendWA(pid, token, from, priceAnswer, true);
        return new Response(JSON.stringify({ status: "price_answered" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ai = await callAI(sys, mergedMsgs);

      if (!ai) {
        console.error("AI returned empty response for", from);
        return new Response(JSON.stringify({ status: "ai_empty" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsed = parseOrder(ai);
      const modification = !parsed ? parseOrderModification(ai) : null;
      let resp = ai;
      const storedProof = paymentProofUrl || freshConv?.payment_proof_url || conv.payment_proof_url || null;

      if (parsed) {
        // ── Backend enforce delivery/pickup overrides BEFORE building summary ──
        const orderDeliveryType = (parsed.order.delivery_type || "").toLowerCase();
        const isOrderDelivery = /domicilio|delivery/.test(orderDeliveryType);
        const isOrderPickup = /pickup|recog/.test(orderDeliveryType) || (!isOrderDelivery && orderDeliveryType !== "");

        if (isOrderDelivery && isDeliveryDisabledOverride(activeOverrides)) {
          const noDelivResp = buildServiceBlockMessage(activeOverrides, "delivery", config);
          freshMsgs.push({ role: "assistant", content: noDelivResp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: freshMsgs.slice(-30) })
            .eq("id", conv.id);
          await sendWA(pid, token, from, noDelivResp, true);
          return new Response(JSON.stringify({ status: "delivery_blocked" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (isOrderPickup && isPickupDisabledOverride(activeOverrides)) {
          const noPickResp = buildServiceBlockMessage(activeOverrides, "pickup", config);
          freshMsgs.push({ role: "assistant", content: noPickResp, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: freshMsgs.slice(-30) })
            .eq("id", conv.id);
          await sendWA(pid, token, from, noPickResp, true);
          return new Response(JSON.stringify({ status: "pickup_blocked" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // ORDER DETECTED BY AI → Validate and build backend summary
        const validated = validateOrder(parsed.order, effectiveProducts);
        if (validated.corrected) parsed.order = validated.order;

        // Build summary from validated data — NEVER use AI text for prices
        resp = buildOrderSummary(validated.order, config, parsed.order.customer_name || freshCustomerName);
        console.log(
          `📋 BACKEND SUMMARY built for ${from} (validated=${validated.corrected}, issues=${validated.issues.length})`,
        );

        // Store order and set pending confirmation status
        freshMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
        await supabase
          .from("whatsapp_conversations")
          .update({
            messages: freshMsgs.slice(-30),
            customer_name: parsed.order.customer_name || freshCustomerName,
            current_order: parsed.order,
            order_status: "pending_confirmation",
            pending_since: new Date().toISOString(),
          })
          .eq("id", conv.id);

        // Send backend-built summary (no AI text)
        await sendWA(pid, token, from, resp, true);

        return new Response(JSON.stringify({ status: "pending_confirmation" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (modification) {
        resp =
          modification.clean || (modification.type === "addition" ? "✅ Adición registrada!" : "✅ Cambio registrado!");
        await saveOrderModification(
          rId,
          conv.id,
          from,
          modification.order,
          modification.type,
          config,
          freshCurrentOrder,
        );
      }

      // ── Mid-conversation delivery/pickup interception ──
      // If the AI response seems to accept a restricted service, override it
      if (!parsed && !modification) {
        const lastCustomerText = trailingCustomerTexts.join(" ").toLowerCase();
        if (isDeliveryDisabledOverride(activeOverrides) && /domicilio|delivery/i.test(lastCustomerText)) {
          // Check if AI is NOT already denying delivery
          if (!/no.{0,20}(domicilio|delivery)|no tene.{0,10}domicilio/i.test(resp)) {
            resp = buildServiceBlockMessage(activeOverrides, "delivery", config);
          }
        }
        if (isPickupDisabledOverride(activeOverrides) && /recog|pickup|recoger/i.test(lastCustomerText)) {
          if (!/no.{0,20}(recogida|pickup|recoger)|no tene.{0,10}recog/i.test(resp)) {
            resp = buildServiceBlockMessage(activeOverrides, "pickup", config);
          }
        }
      }

      // Handle special tags
      if (resp.includes("---ESCALAMIENTO---")) {
        resp = resp.replace(/---ESCALAMIENTO---/g, "").trim();
        const reason =
          resp.length > 10 ? `Alicia respondió: "${resp.substring(0, 300)}"` : "Cliente necesita atención humana";
        await escalate(config, from, reason, freshMsgs);
      }
      if (resp.includes("---CONSULTA_DOMICILIO---")) {
        resp = resp.replace(/---CONSULTA_DOMICILIO---/g, "").trim();
        await escalate(config, from, "Cliente pregunta costo domicilio", freshMsgs);
      }

      // Update conversation
      freshMsgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
      // Only parseOrder() sets pending_confirmation — no auto-detection
      const baseStatus =
        freshOrderStatus === "nudge_sent" || freshOrderStatus === "followup_sent" ? "active" : freshOrderStatus;
      const newOrderStatus = baseStatus;

      await supabase
        .from("whatsapp_conversations")
        .update({
          messages: freshMsgs.slice(-30),
          customer_name: freshCustomerName,
          current_order: freshCurrentOrder,
          order_status: newOrderStatus,
        })
        .eq("id", conv.id);

      await sendWA(pid, token, from, resp, true);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Enhanced error handling with admin notification
      console.error("🔥 CRITICAL ERROR:", {
        error: e?.message || String(e),
        stack: e?.stack || "no stack",
        timestamp: new Date().toISOString(),
      });

      try {
        const body2 = await req
          .clone()
          .json()
          .catch(() => null);
        const from2 = body2?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "unknown";

        const { data: failConv } = await supabase
          .from("whatsapp_conversations")
          .select("id, messages, restaurant_id")
          .eq("customer_phone", from2)
          .maybeSingle();
        if (failConv) {
          const failMsgs = Array.isArray(failConv.messages) ? failConv.messages : [];
          failMsgs.push({
            role: "system_error",
            content: `Error: ${e?.message || "unknown"}`,
            timestamp: new Date().toISOString(),
          });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: failMsgs.slice(-30) })
            .eq("id", failConv.id);

          const { data: errConfig } = await supabase
            .from("whatsapp_configs")
            .select("order_email")
            .eq("restaurant_id", failConv.restaurant_id)
            .maybeSingle();
          if (errConfig?.order_email) {
            await sendEmail(
              errConfig.order_email,
              `⚠️ Error procesando mensaje de +${from2}`,
              `<p>Un mensaje de <b>+${from2}</b> no pudo ser procesado.</p><p>Error: ${e?.message || "unknown"}</p><p>Revisa el dashboard de Alicia.</p>`,
            );
          }
        }
      } catch (innerErr) {
        console.error("Failed to save error state:", innerErr);
      }

      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
