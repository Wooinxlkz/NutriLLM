export type { StaticFoodItem } from "./mena-foods";
export type { OFFProduct } from "./openfoodfacts";
export type { Nutrition5kItem } from "./nutrition5k";
export { MENA_FOODS } from "./mena-foods";
export { WORLD_FOODS } from "./world-foods";
export { NUTRITION5K_DISHES, searchNutrition5k } from "./nutrition5k";
export { searchOpenFoodFacts, fetchMENAFoodsFromOFF } from "./openfoodfacts";
export { FOOD_IMAGES, getFoodImage } from "./food-images";
export { MENA_REGIONS, COUNTRY_NAMES, VALID_COUNTRY_CODES, countryName, regionForCountry } from "./country-taxonomy";
export { verifyNutritionAgainstUSDA, type USDAVerificationResult } from "./usda-verify";

import { MENA_FOODS, type StaticFoodItem } from "./mena-foods";
import { WORLD_FOODS } from "./world-foods";
import { NUTRITION5K_DISHES, type Nutrition5kItem } from "./nutrition5k";
import { FOOD_IMAGES } from "./food-images";

export type AnyFoodItem = (StaticFoodItem | Nutrition5kItem) & { id: string; nameEn: string; nameAr: string };

/**
 * Combined in-memory catalog (MENA library + World foods + Nutrition5k) with images injected.
 */
export const LOCAL_CATALOG: AnyFoodItem[] = [
  ...(MENA_FOODS as AnyFoodItem[]),
  ...(WORLD_FOODS as AnyFoodItem[]),
  ...(NUTRITION5K_DISHES as AnyFoodItem[]),
].map(f => ({ ...f, imageUrl: FOOD_IMAGES[f.id] }));

export interface SearchOptions {
  query?: string;
  category?: string;
  region?: string;
  country?: string;
  limit?: number;
}

export function searchLocalCatalog(opts: SearchOptions = {}): AnyFoodItem[] {
  const { query, category, region, country, limit = 200 } = opts;
  let results = LOCAL_CATALOG;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      f =>
        f.nameEn.toLowerCase().includes(q) ||
        f.nameAr.includes(q) ||
        f.cuisine.toLowerCase().includes(q) ||
        f.region.toLowerCase().includes(q) ||
        (f as StaticFoodItem).tags?.some(t => t.includes(q)) ||
        (f as StaticFoodItem).ingredients?.some(i => i.toLowerCase().includes(q))
    );
  }

  if (category && category !== "All") {
    results = results.filter(f => f.category === category);
  }

  if (region && region !== "All Regions") {
    results = results.filter(f => f.region.toLowerCase().includes(region.toLowerCase()));
  }

  if (country) {
    results = results.filter(f => (f as StaticFoodItem).country === country.toLowerCase());
  }

  return results.slice(0, limit);
}
