const KEY = "nutri_pantry_v1";

export function loadPantry(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === "string") : [];
  } catch { return []; }
}

export function savePantry(items: string[]): string[] {
  const dedup = Array.from(new Set(items.map(s => s.trim()).filter(Boolean)));
  try { localStorage.setItem(KEY, JSON.stringify(dedup)); } catch {}
  return dedup;
}

export function togglePantryItem(item: string): string[] {
  const list = loadPantry();
  const i = list.findIndex(x => x.toLowerCase() === item.trim().toLowerCase());
  const next = i >= 0 ? list.filter((_, idx) => idx !== i) : [...list, item.trim()];
  return savePantry(next);
}

export function isInPantry(item: string): boolean {
  return loadPantry().some(x => x.toLowerCase() === item.trim().toLowerCase());
}

export const COMMON_PANTRY = [
  "olive oil", "salt", "pepper", "garlic", "onion", "rice", "pasta",
  "eggs", "butter", "milk", "chicken", "tomato", "lemon", "cheese",
  "flour", "soy sauce", "potato", "carrot", "spinach", "beans",
  "chickpeas", "cumin", "paprika", "coriander", "turmeric", "ginger",
  "honey", "vinegar", "breadcrumbs", "tahini", "coconut milk",
];
