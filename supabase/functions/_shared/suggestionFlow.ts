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

export function buildSuggestionFlow(suggestConfigs: any): SuggestionFragments {
  const empty: SuggestionFragments = { globalRules: "", step1: "", step2: "", step3: "" };

  if (!suggestConfigs?.enabled) {
    return empty;
  }

  const maxSug = suggestConfigs.max_suggestions_per_order || 2;

  // --- Global rules ---
  const rules: string[] = [];
  rules.push("REGLAS DE SUGERENCIAS:");
  rules.push(`- Máximo ${maxSug} sugerencias por pedido. Lleva la cuenta internamente`);
  if (suggestConfigs.respect_first_no !== false) {
    rules.push("- Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación");
  }
  if (suggestConfigs.no_prices_in_suggestions) {
    rules.push("- NO menciones precios al sugerir");
  }
  rules.push("- Prioriza PRODUCTOS RECOMENDADOS HOY en tus sugerencias");
  rules.push("- NO repitas la misma sugerencia dos veces");
  rules.push("- NO sugieras productos que el cliente ya pidió");
  rules.push("- Si ya alcanzaste el máximo de sugerencias → pasa al siguiente paso sin sugerir");

  // --- Step fragments ---
  let step1 = "";
  if (suggestConfigs.suggest_on_greeting !== false) {
    step1 = '\n   → Después de saludar, menciona naturalmente 1-2 productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"';
  }

  let step2 = "";
  const hasUpsizing = suggestConfigs.suggest_upsizing !== false;
  const hasComplements = suggestConfigs.suggest_complements !== false;
  if (hasUpsizing) {
    step2 += '\n   → Si el producto tiene tamaño mayor disponible en el menú, ofrécelo. Ej: "También lo tenemos en [tamaño mayor], ¿prefieres ese?"';
  }
  if (hasComplements) {
    step2 += '\n   → Antes de preguntar "¿algo más?", sugiere UN complemento natural. Ej: "Para acompañar te queda genial un [complemento]. ¿Algo más?"';
  }

  let step3 = "";
  if (suggestConfigs.suggest_before_close !== false) {
    step3 = '\n   → Antes de pasar a recoger/domicilio, haz UNA última sugerencia breve. Ej: "Antes de cerrar, ¿no te provoca un [producto]?"';
  }

  return {
    globalRules: rules.join("\n"),
    step1,
    step2,
    step3,
  };
}
