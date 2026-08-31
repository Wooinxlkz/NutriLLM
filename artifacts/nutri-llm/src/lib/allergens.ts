const KEY = "nutri_allergens_v1";

export const COMMON_ALLERGENS = [
  "peanuts", "tree nuts", "dairy", "eggs", "soy",
  "wheat", "gluten", "shellfish", "fish", "sesame",
] as const;

export type AllergenName = typeof COMMON_ALLERGENS[number];

const ALIASES: Record<string, string[]> = {
  peanuts: ["peanut", "groundnut"],
  "tree nuts": ["almond", "cashew", "hazelnut", "pecan", "pistachio", "walnut", "macadamia", "pine nut"],
  dairy: ["milk", "cream", "butter", "cheese", "yogurt", "whey", "casein", "ghee", "mascarpone", "parmesan", "pecorino", "mozzarella", "béchamel"],
  eggs: ["egg"],
  soy: ["soy", "tofu", "edamame", "miso", "tempeh", "soybean"],
  wheat: ["wheat", "flour", "bread", "pasta", "noodle", "couscous", "bulgur", "semolina", "phyllo", "warqa", "injera"],
  gluten: ["wheat", "barley", "rye", "flour", "bread", "pasta", "couscous", "seitan"],
  shellfish: ["shrimp", "prawn", "crab", "lobster", "scallop", "mussel", "clam", "oyster"],
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "anchovy", "sardine", "trout", "halibut"],
  sesame: ["sesame", "tahini"],
};

export function loadAllergens(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveAllergens(items: string[]): string[] {
  const cleaned = Array.from(new Set(items.map(s => s.trim().toLowerCase()).filter(Boolean)));
  try { localStorage.setItem(KEY, JSON.stringify(cleaned)); } catch {}
  return cleaned;
}

export function toggleAllergen(allergen: string): string[] {
  const list = loadAllergens();
  const a = allergen.toLowerCase();
  return saveAllergens(list.includes(a) ? list.filter(x => x !== a) : [...list, a]);
}

export function scanForAllergens(ingredients: string[], userAllergens: string[]): string[] {
  if (!ingredients.length || !userAllergens.length) return [];
  const hits = new Set<string>();
  for (const allergen of userAllergens) {
    const terms = [allergen, ...(ALIASES[allergen] ?? [])];
    for (const ing of ingredients) {
      const lower = ing.toLowerCase();
      if (terms.some(t => lower.includes(t))) {
        hits.add(allergen);
        break;
      }
    }
  }
  return Array.from(hits);
}
