/**
 * Shared helper: builds the suggestion/upselling prompt block
 * integrated into the conversational flow steps.
 *
 * Single source of truth — used by both generate-alicia and whatsapp-webhook.
 */
export function buildSuggestionFlow(suggestConfigs: any): string {
  if (!suggestConfigs?.enabled) {
    return "SUGERENCIAS: NO hacer sugerencias de venta adicional.";
  }

  const maxSug = suggestConfigs.max_suggestions_per_order || 2;
  const lines: string[] = [];

  lines.push("SUGERENCIAS INTEGRADAS AL FLUJO:");
  lines.push(`- Máximo ${maxSug} sugerencias por momento. Lleva la cuenta internamente`);

  if (suggestConfigs.respect_first_no !== false) {
    lines.push("- Si el cliente rechaza UNA sugerencia → NO sugieras más en toda la conversación");
  }
  if (suggestConfigs.no_prices_in_suggestions) {
    lines.push("- NO menciones precios al sugerir");
  }
  lines.push("- Prioriza PRODUCTOS RECOMENDADOS HOY en tus sugerencias");

  // Step 1 — Greeting
  if (suggestConfigs.suggest_on_greeting !== false) {
    lines.push("");
    lines.push("EN EL PASO 1 (saludo):");
    lines.push('Después de saludar, menciona naturalmente 1-2 productos populares o recomendados. Ej: "Hoy tenemos [producto], te lo recomiendo"');
  }

  // Step 2 — After main product
  const hasComplements = suggestConfigs.suggest_complements !== false;
  const hasUpsizing = suggestConfigs.suggest_upsizing !== false;
  if (hasComplements || hasUpsizing) {
    lines.push("");
    lines.push("EN EL PASO 2 (después de anotar producto principal):");
    if (hasUpsizing) {
      lines.push('Si el producto tiene tamaño mayor disponible en el menú, ofrécelo primero. Ej: "También lo tenemos en [tamaño mayor], ¿prefieres ese?"');
    }
    if (hasComplements) {
      lines.push('Antes de preguntar "¿algo más?", sugiere UN complemento natural (bebida, entrada, postre). Ej: "Para acompañar te queda genial un [complemento]. ¿Algo más?"');
    }
  }

  // Step 3 — Before close
  if (suggestConfigs.suggest_before_close !== false) {
    lines.push("");
    lines.push("EN EL PASO 3 (antes de cerrar):");
    lines.push('Cuando diga "nada más", haz UNA última sugerencia breve antes de pasar a recoger/domicilio. Ej: "Antes de cerrar, ¿no te provoca un [producto]?"');
  }

  // Rules
  lines.push("");
  lines.push("REGLAS DE SUGERENCIAS:");
  lines.push("- NO repitas la misma sugerencia dos veces");
  lines.push("- NO sugieras productos que el cliente ya pidió");
  lines.push("- Si ya alcanzaste el máximo de sugerencias → pasa al siguiente paso sin sugerir");

  return lines.join("\n");
}
