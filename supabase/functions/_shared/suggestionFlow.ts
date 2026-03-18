/**
 * Shared helper: builds suggestion/upselling fragments
 * that get injected directly INTO the conversational flow steps.
 *
 * Single source of truth — used by both generate-alicia and whatsapp-webhook.
 */

export interface SuggestionFragments {
  /** Global rules block — injected BEFORE the FLUJO DE PEDIDO */
  globalRules: string;
  /** Injected after step 1 (greeting) */
  step1: string;
  /** Injected after step 2 (order taking) */
  step2: string;
  /** Injected after step 3 (before close) */
  step3: string;
}

export function buildSuggestionFlow(suggestConfigs: any, greetingMessage?: string): SuggestionFragments {
  const empty: SuggestionFragments = { globalRules: "", step1: "", step2: "", step3: "" };

  // If suggestions are disabled, still inject greeting into step1 if available
  if (!suggestConfigs?.enabled) {
    if (greetingMessage) {
      empty.step1 = `\n   → Usa como base este saludo: "${greetingMessage}". Personalízalo naturalmente`;
    }
    return empty;
  }

  const maxSug = suggestConfigs.max_suggestions_per_moment || 2;
  const sugLabel = maxSug === 1 ? "EXACTAMENTE 1" : `hasta ${maxSug}`;
  const sugNoun = (s: string, p: string) => maxSug === 1 ? s : p;

  // --- Global rules ---
  const rules: string[] = [];
  rules.push("REGLAS DE SUGERENCIAS:");
  rules.push(`- Máximo ${maxSug} ${sugNoun("sugerencia", "sugerencias")} por MOMENTO (saludo, durante pedido, antes de cerrar). El contador se reinicia en cada momento`);
  if (suggestConfigs.respect_first_no !== false) {
    rules.push(
      "- Si el cliente rechaza UNA sugerencia ESPECÍFICA de producto (ej: 'no quiero eso', 'no gracias' a un producto sugerido) → NO sugieras más en toda la conversación",
    );
    rules.push(
      "- IMPORTANTE: Cuando el cliente dice 'no' a '¿Algo más?' NO es un rechazo de sugerencia — es que terminó de pedir. Puedes seguir sugiriendo en pasos posteriores",
    );
  }
  if (suggestConfigs.no_prices_in_suggestions) {
    rules.push("- NO menciones precios al sugerir");
  }
  rules.push("- Prioriza PRODUCTOS RECOMENDADOS HOY en tus sugerencias");
  rules.push("- NO repitas la misma sugerencia dos veces");
  rules.push("- NO sugieras productos que el cliente ya pidió");
  rules.push("- Si ya alcanzaste el máximo de sugerencias EN ESTE MOMENTO → pasa al siguiente paso sin sugerir");

  // --- Step fragments ---
  let step1 = "";
  if (suggestConfigs.suggest_on_greeting !== false) {
    const greetingRef = greetingMessage
      ? ` con el tono de: "${greetingMessage}" pero NO lo copies textualmente`
      : "";
    step1 = `\n   → OBLIGATORIO en tu primer mensaje: (a) Saluda${greetingRef}, (b) Menciona ${sugLabel} ${sugNoun("producto", "productos")} del menú ${sugNoun("recomendado", "recomendados")} HOY. Tu saludo DEBE incluir ${sugNoun("nombre de producto", "nombres de productos")}. Ej: "¡Hola! Hoy te recomiendo [producto del menú]. ¿Qué se te antoja?"`;
  } else if (greetingMessage) {
    step1 = `\n   → Saluda con el tono de: "${greetingMessage}" (NO copies textualmente, personalízalo)`;
  }

  let step2 = "";
  const hasComplements = suggestConfigs.suggest_complements !== false;
  if (hasComplements) {
    step2 += `\n   → Antes de preguntar "¿algo más?", sugiere hasta ${maxSug} complemento(s) natural(es). Ej: "Para acompañar te queda genial un [complemento]. ¿Algo más?"`;
  }

  let step3 = "";
  if (suggestConfigs.suggest_before_close !== false) {
    step3 = `\n   → Antes de pasar a recoger/domicilio, haz hasta ${maxSug} última(s) sugerencia(s) breve(s). Ej: "Antes de cerrar, ¿no te provoca un [producto]?"`;
  }

  return {
    globalRules: rules.join("\n"),
    step1,
    step2,
    step3,
  };
}
