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

  const maxSug = suggestConfigs.max_suggestions_per_order || 2;

  // --- Global rules ---
  const rules: string[] = [];
  rules.push("REGLAS DE SUGERENCIAS:");
  rules.push(`- Máximo ${maxSug} sugerencias por pedido. Lleva la cuenta internamente`);
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
  rules.push("- Si ya alcanzaste el máximo de sugerencias → pasa al siguiente paso sin sugerir");

  // --- Step fragments ---
  let step1 = "";
  if (suggestConfigs.suggest_on_greeting !== false) {
    const greetingPart = greetingMessage
      ? `Usa como base este saludo: "${greetingMessage}". Personalízalo y`
      : "Al saludar,";
    step1 = `\n   → ${greetingPart} ,debes mencionar naturalmente hasta ${maxSug} productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"`;
  } else if (greetingMessage) {
    step1 = `\n   → Usa como base este saludo: "${greetingMessage}". Personalízalo naturalmente`;
  }

  let step2 = "";
  const hasUpsizing = suggestConfigs.suggest_upsizing !== false;
  const hasComplements = suggestConfigs.suggest_complements !== false;
  if (hasUpsizing) {
    step2 +=
      '\n   → Si el producto tiene tamaño mayor disponible en el menú, ofrécelo. Ej: "También lo tenemos en [tamaño mayor], ¿prefieres ese?"';
  }
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
