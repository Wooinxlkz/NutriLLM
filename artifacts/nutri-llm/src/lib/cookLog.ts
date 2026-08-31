const KEY = "nutri_cooklog_v1";

export interface CookLogEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  at: number;
  servings: number;
  nutrition: { calories: number; protein: number; carbs: number; fat: number } | null;
}

export function loadCookLog(): CookLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(items: CookLogEntry[]) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }

export function addCookLogEntry(recipe: { id: string; name: string; servings?: number; nutritionInfo?: { calories: number; protein: number; carbs: number; fat: number } }): CookLogEntry {
  const entry: CookLogEntry = {
    id: `${recipe.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recipeId: recipe.id,
    recipeName: recipe.name,
    at: Date.now(),
    servings: recipe.servings ?? 1,
    nutrition: recipe.nutritionInfo ? {
      calories: Math.round(recipe.nutritionInfo.calories || 0),
      protein: Math.round(recipe.nutritionInfo.protein || 0),
      carbs: Math.round(recipe.nutritionInfo.carbs || 0),
      fat: Math.round(recipe.nutritionInfo.fat || 0),
    } : null,
  };
  const next = [entry, ...loadCookLog()];
  save(next);
  return entry;
}

export function removeCookLogEntry(id: string): CookLogEntry[] {
  const next = loadCookLog().filter(e => e.id !== id);
  save(next);
  return next;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeStreak(entries: CookLogEntry[]): number {
  if (!entries.length) return 0;
  const days = Array.from(new Set(entries.map(e => dayKey(e.at)))).sort().reverse();
  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86400000);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = (prev.getTime() - cur.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function todayTotals(entries: CookLogEntry[]) {
  const today = dayKey(Date.now());
  const todayEntries = entries.filter(e => dayKey(e.at) === today);
  return todayEntries.reduce(
    (acc, e) => {
      if (e.nutrition) {
        acc.calories += e.nutrition.calories;
        acc.protein += e.nutrition.protein;
        acc.carbs += e.nutrition.carbs;
        acc.fat += e.nutrition.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
