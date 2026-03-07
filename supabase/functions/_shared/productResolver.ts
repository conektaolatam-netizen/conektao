/**
 * Shared product resolver with category-aware disambiguation.
 * Used by whatsapp-webhook and alicia-daily-override.
 */

const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, "");
const tokenize = (s: string) => clean(s).split(/\s+/).filter(Boolean);

/** Score how well a query matches a product using name, description, and category tokens */
export function scoreProduct(query: string, product: { name: string; description?: string; category_name?: string }): number {
  const qTokens = tokenize(query);
  const nameTokens = tokenize(product.name);
  const descTokens = tokenize(product.description || "");
  const catTokens = tokenize(product.category_name || "");
  let score = 0;
  for (const t of qTokens) {
    if (nameTokens.some((n) => n.includes(t) || t.includes(n))) score += 3;
    if (descTokens.some((d) => d.includes(t) || t.includes(d))) score += 5;
    if (catTokens.some((c) => c.includes(t) || t.includes(c))) score += 4;
  }
  if (clean(product.name).includes(clean(query))) score += 2;
  const extra = nameTokens.filter((n) => !qTokens.some((q) => n.includes(q) || q.includes(n))).length;
  score -= extra;
  return score;
}

/** Resolve best product from a list, with optional price hint for disambiguation */
export function resolveProduct(
  productName: string,
  products: { id: string; name: string; description?: string; category_name?: string; price?: number }[],
  hints?: { unit_price?: number }
): { id: string; name: string; price?: number } | null {
  if (!productName || products.length === 0) return null;

  // Score all products
  const scored = products.map((p) => ({ ...p, score: scoreProduct(productName, p) }));
  const bestScore = Math.max(...scored.map((s) => s.score));
  if (bestScore < 3) return null;

  const candidates = scored.filter((s) => s.score === bestScore);
  if (candidates.length === 1) return { id: candidates[0].id, name: candidates[0].name, price: candidates[0].price };

  // Price-as-intent: if hint price matches exactly one candidate
  if (hints?.unit_price && hints.unit_price > 0) {
    const priceMatch = candidates.filter((c) => c.price === hints.unit_price);
    if (priceMatch.length === 1) return { id: priceMatch[0].id, name: priceMatch[0].name, price: priceMatch[0].price };
  }

  // Category token boost: re-score candidates by matching query tokens against category_name
  const qTokens = tokenize(productName);
  let bestCatScore = -Infinity;
  let catWinner: typeof candidates[0] | null = null;
  for (const c of candidates) {
    const catTokens = tokenize(c.category_name || "");
    let catBoost = 0;
    for (const t of qTokens) {
      if (catTokens.some((ct) => ct.includes(t) || t.includes(ct))) catBoost += 4;
    }
    if (catBoost > bestCatScore) {
      bestCatScore = catBoost;
      catWinner = c;
    }
  }
  if (bestCatScore > 0 && catWinner) {
    // Ensure only one candidate has this boost level
    const tied = candidates.filter((c) => {
      const catTokens = tokenize(c.category_name || "");
      let boost = 0;
      for (const t of qTokens) {
        if (catTokens.some((ct) => ct.includes(t) || t.includes(ct))) boost += 4;
      }
      return boost === bestCatScore;
    });
    if (tied.length === 1) return { id: tied[0].id, name: tied[0].name, price: tied[0].price };
  }

  // Fallback: pick shortest name (least specific penalty) but mark it's a best-effort
  const shortest = candidates.reduce((a, b) => (a.name.length <= b.name.length ? a : b));
  return { id: shortest.id, name: shortest.name, price: shortest.price };
}

export type ProductEntry = {
  name: string;
  price: number;
  description: string;
  categoryName: string;
  categoryId: string;
  requiresPackaging: boolean;
  packagingPrice: number;
};

/**
 * Resolve the best ProductEntry for an AI-declared item, with category-aware disambiguation.
 * Returns { entry, ambiguous }.
 * When ambiguous=true, the caller should NOT correct prices.
 */
export function resolveProductEntry(
  itemName: string,
  declaredPrice: number,
  entries: ProductEntry[]
): { entry: ProductEntry | null; ambiguous: boolean } {
  if (!entries.length) return { entry: null, ambiguous: false };

  const itemLower = clean(itemName);
  const itemTokens = tokenize(itemName);

  // Phase 1: Score all entries
  const scored = entries.map((entry) => {
    const prodTokens = tokenize(entry.name);
    const descTokens = tokenize(entry.description);
    const catTokens = tokenize(entry.categoryName);
    let score = 0;
    for (const t of itemTokens) {
      if (prodTokens.includes(t)) score += 3;
      if (descTokens.includes(t)) score += 5;
      if (catTokens.includes(t)) score += 4;
    }
    if (itemLower.includes(clean(entry.name)) || clean(entry.name).includes(itemLower)) score += 2;
    for (const t of prodTokens) { if (!itemTokens.includes(t)) score -= 1; }
    return { entry, score };
  });

  const bestScore = Math.max(...scored.map((s) => s.score));
  if (bestScore <= 0) return { entry: null, ambiguous: false };

  const candidates = scored.filter((s) => s.score === bestScore);

  // Single match → use it
  if (candidates.length === 1) return { entry: candidates[0].entry, ambiguous: false };

  // Multiple candidates — disambiguate

  // 1️⃣ Price-as-intent: if declaredPrice matches exactly one candidate
  if (declaredPrice > 0) {
    const priceMatch = candidates.filter((c) => c.entry.price === declaredPrice);
    if (priceMatch.length === 1) return { entry: priceMatch[0].entry, ambiguous: false };
  }

  // 2️⃣ Category token boost: check if item tokens match any candidate's categoryName
  let bestCatBoost = 0;
  const catBoosted = candidates.map((c) => {
    const catTokens = tokenize(c.entry.categoryName);
    let boost = 0;
    for (const t of itemTokens) {
      if (catTokens.some((ct) => ct.includes(t) || t.includes(ct))) boost += 4;
    }
    if (boost > bestCatBoost) bestCatBoost = boost;
    return { ...c, catBoost: boost };
  });

  if (bestCatBoost > 0) {
    const catWinners = catBoosted.filter((c) => c.catBoost === bestCatBoost);
    if (catWinners.length === 1) return { entry: catWinners[0].entry, ambiguous: false };
  }

  // 3️⃣ Family consistency: prefer candidate whose categoryId appears most frequently among candidates
  const catFreq: Record<string, number> = {};
  for (const c of candidates) {
    const cid = c.entry.categoryId;
    if (cid) catFreq[cid] = (catFreq[cid] || 0) + 1;
  }
  const maxFreq = Math.max(...Object.values(catFreq), 0);
  if (maxFreq > 0) {
    const freqWinners = candidates.filter((c) => catFreq[c.entry.categoryId] === maxFreq);
    if (freqWinners.length === 1) return { entry: freqWinners[0].entry, ambiguous: false };
  }

  // 4️⃣ Ambiguous — return the first candidate but flag ambiguous so caller skips price correction
  return { entry: candidates[0].entry, ambiguous: true };
}
