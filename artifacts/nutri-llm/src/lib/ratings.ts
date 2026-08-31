const KEY = "nutri_ratings_v1";

export interface RecipeRating { stars: number; note: string; updatedAt: number; }
type Store = Record<string, RecipeRating>;

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) ?? {};
  } catch { return {}; }
}

function save(s: Store) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

export function getRating(id: string): RecipeRating | null { return load()[id] ?? null; }

export function setRating(id: string, stars: number, note = ""): RecipeRating {
  const store = load();
  const r: RecipeRating = { stars: Math.max(0, Math.min(5, Math.round(stars))), note: note.slice(0, 280), updatedAt: Date.now() };
  store[id] = r;
  save(store);
  return r;
}

export function clearRating(id: string): void { const s = load(); delete s[id]; save(s); }
export function loadAllRatings(): Store { return load(); }
