import { Router } from "express";
import { db, foodCatalogTable } from "@workspace/db";
import { ListFoodsQueryParams } from "@workspace/api-zod";
import { ilike, eq, and, or, type SQL } from "drizzle-orm";
import {
  searchLocalCatalog,
  searchOpenFoodFacts,
  type AnyFoodItem,
} from "@workspace/food-data";

const router = Router();

interface FoodResponse {
  id: string;
  nameEn: string;
  nameAr: string;
  cuisine: string;
  region: string;
  category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number };
  tags: string[];
  allergens: string[];
  cookTime?: number;
  difficulty?: string;
  description?: string;
  ingredients?: string[];
  imageUrl?: string;
  dataSource: "database" | "nutri-llm-library" | "nutrition5k" | "openfoodfacts";
}

function fromDb(r: typeof foodCatalogTable.$inferSelect): FoodResponse {
  return {
    id: `db-${r.id}`,
    nameEn: r.nameEn,
    nameAr: r.nameAr ?? "",
    cuisine: r.cuisine ?? "International",
    region: r.region ?? "Global",
    category: r.category,
    nutrition: (r.nutrition as FoodResponse["nutrition"]) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
    tags: (r.tags as string[]) ?? [],
    allergens: (r.allergens as string[]) ?? [],
    cookTime: r.cookTime ?? undefined,
    difficulty: r.difficulty ?? undefined,
    description: r.description ?? undefined,
    imageUrl: r.imageUrl ?? undefined,
    dataSource: "database",
  };
}

function fromLocal(f: AnyFoodItem): FoodResponse {
  return {
    id: f.id,
    nameEn: f.nameEn,
    nameAr: f.nameAr,
    cuisine: f.cuisine,
    region: f.region,
    category: f.category,
    nutrition: f.nutrition,
    tags: (f as { tags?: string[] }).tags ?? [],
    allergens: (f as { allergens?: string[] }).allergens ?? [],
    cookTime: (f as { cookTime?: number }).cookTime,
    difficulty: (f as { difficulty?: string }).difficulty,
    description: (f as { description?: string }).description,
    ingredients: (f as { ingredients?: string[] }).ingredients,
    imageUrl: (f as { imageUrl?: string }).imageUrl,
    dataSource: (f as { source: string }).source as FoodResponse["dataSource"],
  };
}

router.get("/foods", async (req, res) => {
  const parsed = ListFoodsQueryParams.safeParse(req.query);
  const { search, category, region } = parsed.success ? parsed.data : {};
  const liveOFF = req.query.live === "1";

  const dedupeSet = new Set<string>();
  const results: FoodResponse[] = [];

  function addUnique(item: FoodResponse) {
    const key = item.nameEn.toLowerCase().trim();
    if (!dedupeSet.has(key)) {
      dedupeSet.add(key);
      results.push(item);
    }
  }

  // ── 1. Database ──────────────────────────────────────────────────────────────
  try {
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(foodCatalogTable.nameEn, `%${search}%`),
          ilike(foodCatalogTable.nameAr, `%${search}%`),
          ilike(foodCatalogTable.region, `%${search}%`)
        )!
      );
    }
    if (category) conditions.push(eq(foodCatalogTable.category, category));
    if (region) conditions.push(ilike(foodCatalogTable.region, `%${region}%`));

    const dbRows = await db
      .select()
      .from(foodCatalogTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(200);

    for (const row of dbRows) addUnique(fromDb(row));
  } catch (err) {
    req.log.warn({ err }, "DB foods fetch failed, continuing with library");
  }

  // ── 2. Local static library (MENA + Nutrition5k) ─────────────────────────────
  const localItems = searchLocalCatalog({ query: search, category, region, limit: 300 });
  for (const item of localItems) addUnique(fromLocal(item));

  // ── 3. OpenFoodFacts live API (on explicit search or when ?live=1) ────────────
  if (search && (liveOFF || results.length < 10)) {
    try {
      const offItems = await searchOpenFoodFacts(search, { category, region, limit: 20 });
      for (const item of offItems) {
        addUnique({
          id: item.id,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          cuisine: item.cuisine,
          region: item.region,
          category: item.category,
          nutrition: item.nutrition,
          tags: item.tags,
          allergens: item.allergens,
          dataSource: "openfoodfacts",
        });
      }
    } catch (err) {
      req.log.warn({ err }, "OpenFoodFacts fetch failed, skipping");
    }
  }

  res.json({
    foods: results,
    total: results.length,
    page: 1,
    sources: {
      database: results.filter(r => r.dataSource === "database").length,
      library: results.filter(r => r.dataSource === "nutri-llm-library").length,
      nutrition5k: results.filter(r => r.dataSource === "nutrition5k").length,
      openfoodfacts: results.filter(r => r.dataSource === "openfoodfacts").length,
    },
  });
});

router.get("/foods/stats", async (req, res) => {
  try {
    const { LOCAL_CATALOG } = await import("@workspace/food-data");
    const dbRows = await db.select().from(foodCatalogTable).catch(() => []);

    const all = [
      ...dbRows.map(r => ({ category: r.category, region: r.region ?? "Global", cuisine: r.cuisine ?? "International" })),
      ...LOCAL_CATALOG.map(f => ({ category: f.category, region: f.region, cuisine: f.cuisine })),
    ];

    const categoryCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    const cuisineCounts: Record<string, number> = {};

    for (const row of all) {
      categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
      regionCounts[row.region] = (regionCounts[row.region] ?? 0) + 1;
      cuisineCounts[row.cuisine] = (cuisineCounts[row.cuisine] ?? 0) + 1;
    }

    res.json({
      totalFoods: all.length,
      regionsCount: Object.keys(regionCounts).length,
      cuisinesCount: Object.keys(cuisineCounts).length,
      languagesSupported: ["Arabic", "English", "French", "Turkish", "Japanese", "Korean", "Spanish", "Italian", "Persian", "Hindi"],
      topCategories: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      topRegions: Object.entries(regionCounts).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      topCuisines: Object.entries(cuisineCounts).map(([cuisine, count]) => ({ cuisine, count })).sort((a, b) => b.count - a.count).slice(0, 20),
      modelVersion: "nutri-llm-v2.0",
      datasetVersion: "global-foods-v2.0",
    });
  } catch (err) {
    req.log.error({ err }, "Stats fetch failed");
    res.status(500).json({ error: "fetch_failed", message: "Could not fetch stats" });
  }
});

export default router;
