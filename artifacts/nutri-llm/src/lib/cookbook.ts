const KEY = "nutri_cookbook_v1";

export type CookbookFlair = "favorite" | "made" | "planned";

export interface SavedRecipe {
  id: string;
  name: string;
  description?: string;
  cuisine1?: string;
  cuisine2?: string;
  mealType?: string;
  servings?: number;
  cookTime?: number;
  difficulty?: string;
  category?: string;
  dietaryTags?: string[];
  ingredients?: Array<{ amount: string; item: string }>;
  instructions?: string[];
  proTips?: string[];
  nutritionInfo?: { calories: number; protein: number; carbs: number; fat: number };
  allergens?: string[];
  pairingNotes?: string;
  culturalStory?: string;
  generatedAt?: string;
  savedAt: number;
  flair?: CookbookFlair;
  note?: string;
  madeCount?: number;
}

export function loadCookbook(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(items: SavedRecipe[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function addToCookbook(recipe: Omit<SavedRecipe, "savedAt">): SavedRecipe[] {
  const list = loadCookbook();
  if (list.some(r => r.id === recipe.id)) return list;
  const next = [{ ...recipe, savedAt: Date.now() }, ...list];
  save(next);
  return next;
}

export function removeFromCookbook(id: string): SavedRecipe[] {
  const next = loadCookbook().filter(r => r.id !== id);
  save(next);
  return next;
}

export function isInCookbook(id: string): boolean {
  return loadCookbook().some(r => r.id === id);
}

export function updateSavedRecipe(id: string, patch: Partial<Pick<SavedRecipe, "flair" | "note" | "madeCount">>): SavedRecipe[] {
  const next = loadCookbook().map(r => r.id === id ? { ...r, ...patch } : r);
  save(next);
  return next;
}

export function clearCookbook(): void { save([]); }
