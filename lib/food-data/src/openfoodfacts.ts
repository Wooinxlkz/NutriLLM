/**
 * OpenFoodFacts public API client (no API key required)
 * https://wiki.openfoodfacts.org/API
 */

export interface OFFProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  cuisine: string;
  region: string;
  category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };
  tags: string[];
  allergens: string[];
  source: "openfoodfacts";
}

const OFF_BASE = "https://world.openfoodfacts.org";
const OFF_ARABIC = "https://ar.openfoodfacts.org";

function mapOFFCategory(categories: string): string {
  const c = categories.toLowerCase();
  if (c.includes("dessert") || c.includes("sweet") || c.includes("cake") || c.includes("pastry")) return "dessert";
  if (c.includes("soup") || c.includes("broth")) return "soup";
  if (c.includes("salad")) return "salad";
  if (c.includes("breakfast") || c.includes("cereal")) return "breakfast";
  if (c.includes("beverage") || c.includes("drink") || c.includes("juice") || c.includes("tea") || c.includes("coffee")) return "beverage";
  if (c.includes("snack") || c.includes("chips") || c.includes("cracker")) return "snack";
  if (c.includes("bread") || c.includes("rice") || c.includes("pasta") || c.includes("side")) return "side";
  if (c.includes("appetizer") || c.includes("dip") || c.includes("spread")) return "appetizer";
  return "main";
}

function parseAllergens(allergens: string): string[] {
  const known = ["peanuts", "tree nuts", "dairy", "eggs", "soy", "wheat", "shellfish", "fish", "sesame"];
  const text = allergens.toLowerCase();
  return known.filter(a => text.includes(a) || (a === "dairy" && (text.includes("milk") || text.includes("lactose"))));
}

function normalizeNutriment(p: Record<string, unknown>): OFFProduct["nutrition"] {
  const g = (key: string) => Number(p[key] ?? p[`${key}_100g`] ?? 0) || 0;
  return {
    calories: g("energy-kcal") || Math.round(g("energy") / 4.184),
    protein: g("proteins"),
    carbs: g("carbohydrates"),
    fat: g("fat"),
    fiber: g("fiber"),
    sodium: Math.round(g("sodium") * 1000),
  };
}

function guessRegion(country: string, categories: string): string {
  const text = (country + " " + categories).toLowerCase();
  if (text.includes("morocco") || text.includes("algeria") || text.includes("tunisia") || text.includes("libya") || text.includes("egypt")) return "North Africa";
  if (text.includes("saudi") || text.includes("emirati") || text.includes("uae") || text.includes("bahrain") || text.includes("kuwait") || text.includes("qatar") || text.includes("oman") || text.includes("yemen")) return "Arabian Peninsula";
  if (text.includes("lebanon") || text.includes("jordan") || text.includes("syria") || text.includes("palestine")) return "Levant";
  if (text.includes("iran") || text.includes("iraq") || text.includes("turkey")) return "Middle East";
  if (text.includes("india") || text.includes("pakistan") || text.includes("bangladesh")) return "South Asia";
  if (text.includes("japan")) return "East Asia";
  if (text.includes("china")) return "East Asia";
  if (text.includes("korea")) return "East Asia";
  if (text.includes("thai") || text.includes("vietnam") || text.includes("indonesia")) return "Southeast Asia";
  if (text.includes("italy") || text.includes("france") || text.includes("spain") || text.includes("greek") || text.includes("greece")) return "Mediterranean";
  if (text.includes("mexico") || text.includes("brazil")) return "Latin America";
  if (text.includes("united states") || text.includes("canada")) return "North America";
  return "Global";
}

export async function searchOpenFoodFacts(
  query: string,
  opts: { category?: string; region?: string; limit?: number } = {}
): Promise<OFFProduct[]> {
  const limit = Math.min(opts.limit ?? 20, 50);
  try {
    const url = new URL(`${OFF_BASE}/cgi/search.pl`);
    url.searchParams.set("search_terms", query);
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", String(limit));
    url.searchParams.set("fields", "id,product_name,product_name_ar,categories,countries,nutriments,allergens,ingredients_text,labels");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as { products?: Record<string, unknown>[] };
    const products = data.products ?? [];

    return products
      .filter(p => p.product_name && (p.nutriments as Record<string, unknown>)?.["energy-kcal_100g"])
      .map(p => {
        const n = normalizeNutriment((p.nutriments as Record<string, unknown>) ?? {});
        const categories = String(p.categories ?? "");
        const countries = String(p.countries ?? "");
        const cat = mapOFFCategory(categories);

        if (opts.category && opts.category !== "All" && cat !== opts.category) return null;

        const region = guessRegion(countries, categories);
        if (opts.region && opts.region !== "All Regions" && region !== opts.region) return null;

        return {
          id: `off-${String(p.id ?? p.code ?? Math.random()).replace(/[^a-z0-9]/gi, "-").slice(0, 24)}`,
          nameEn: String(p.product_name ?? "").trim() || "Unknown",
          nameAr: String(p.product_name_ar ?? "").trim(),
          cuisine: countries ? countries.split(",")[0].trim() : "International",
          region,
          category: cat,
          nutrition: n,
          tags: String(p.labels ?? categories).split(",").map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5),
          allergens: parseAllergens(String(p.allergens ?? "")),
          source: "openfoodfacts" as const,
        } satisfies OFFProduct;
      })
      .filter((x): x is OFFProduct => x !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Fetch MENA-focused foods from OpenFoodFacts Arabic store
 */
export async function fetchMENAFoodsFromOFF(query?: string, limit = 30): Promise<OFFProduct[]> {
  const terms = query ?? "arabic food mena middle east";
  return searchOpenFoodFacts(terms, { limit });
}
