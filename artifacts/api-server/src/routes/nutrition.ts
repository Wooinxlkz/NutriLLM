import { Router } from "express";
import { db, foodAnalysesTable } from "@workspace/db";
import { AnalyzeFoodBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { searchLocalCatalog, verifyNutritionAgainstUSDA } from "@workspace/food-data";
import { desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const DRINK_PAIRINGS: Record<string, { wine?: string; beer?: string; nonAlcoholic: string }> = {
  moroccan: { wine: "Moroccan Syrah", beer: "Casablanca lager", nonAlcoholic: "Mint tea" },
  algerian: { wine: "Coteaux de Mascara", nonAlcoholic: "Café maure or mint tea" },
  tunisian: { wine: "Muscat de Kelibia", nonAlcoholic: "Mint tea with pine nuts" },
  lebanese: { wine: "Chateau Musar", beer: "Almaza", nonAlcoholic: "Jallab or ayran" },
  syrian: { nonAlcoholic: "Jallab or ayran" },
  jordanian: { nonAlcoholic: "Ayran or sahlab" },
  palestinian: { nonAlcoholic: "Limonana (mint lemonade) or sahlab" },
  levantine: { wine: "Chateau Musar", beer: "Almaza", nonAlcoholic: "Jallab or ayran" },
  egyptian: { wine: "Obelisk rosé", beer: "Stella Egyptian lager", nonAlcoholic: "Karkade" },
  sudanese: { nonAlcoholic: "Karkade (hibiscus tea) or Sudanese jebena coffee" },
  turkish: { wine: "Turkish Öküzgözü", beer: "Efes Pilsen", nonAlcoholic: "Ayran" },
  iranian: { wine: "Dry Shiraz", beer: "Pale ale", nonAlcoholic: "Doogh" },
  iraqi: { nonAlcoholic: "Iraqi chai (strong black tea)" },
  yemeni: { nonAlcoholic: "Yemeni qahwa or adeni chai" },
  emirati: { nonAlcoholic: "Arabic coffee (qahwa) with dates" },
  bahraini: { nonAlcoholic: "Arabic coffee (qahwa) with dates" },
  qatari: { nonAlcoholic: "Arabic coffee (qahwa) with dates" },
  kuwaiti: { nonAlcoholic: "Arabic coffee (qahwa) with dates" },
  omani: { nonAlcoholic: "Omani qahwa with halwa" },
  saudi: { nonAlcoholic: "Qahwa or laban" },
  italian: { wine: "Chianti or Pinot Grigio", beer: "Peroni", nonAlcoholic: "San Pellegrino" },
  japanese: { wine: "Dry Riesling", beer: "Asahi", nonAlcoholic: "Green tea" },
  mexican: { wine: "Albariño", beer: "Modelo", nonAlcoholic: "Agua fresca" },
  indian: { wine: "Off-dry Riesling", beer: "Kingfisher", nonAlcoholic: "Mango lassi" },
  french: { wine: "Bordeaux", beer: "Belgian witbier", nonAlcoholic: "Sparkling cider" },
  thai: { wine: "Gewürztraminer", beer: "Singha", nonAlcoholic: "Coconut water" },
  chinese: { wine: "Off-dry Riesling", beer: "Tsingtao", nonAlcoholic: "Jasmine tea" },
  korean: { wine: "Sparkling rosé", beer: "Hite", nonAlcoholic: "Barley tea" },
  greek: { wine: "Assyrtiko", beer: "Mythos", nonAlcoholic: "Lemon-mint water" },
  spanish: { wine: "Tempranillo", beer: "Estrella Damm", nonAlcoholic: "Sangria mocktail" },
  default: { wine: "Light rosé", beer: "Crisp pilsner", nonAlcoholic: "Sparkling water with citrus" },
};

function getDrinkPairing(cuisine: string) {
  const key = cuisine.toLowerCase().trim();
  // Exact match first — more precise than substring matching, and doesn't
  // depend on a cuisine string happening to contain a dict key as a substring
  // (the old substring-only approach silently missed Syrian, Jordanian,
  // Palestinian, Emirati, Bahraini, etc. because none of those strings
  // contain another key as a substring).
  if (DRINK_PAIRINGS[key]) return { ...DRINK_PAIRINGS[key], source: cuisine };
  for (const [k, v] of Object.entries(DRINK_PAIRINGS)) {
    if (key.includes(k)) return { ...v, source: cuisine };
  }
  return { ...DRINK_PAIRINGS.default, source: cuisine };
}

function extractJson(raw: string): string {
  if (!raw || raw.trim().length === 0) return "{}";
  let s = raw.trim();
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) s = fenceMatch[1].trim();
  const objStart = s.indexOf("{");
  const objEnd = s.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    s = s.slice(objStart, objEnd + 1);
  }
  return s;
}

function normalizeNutrition(n: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(n)) {
    const key = k.toLowerCase().replace(/[\s()\/]/g, "").replace("g", "").replace("mg", "").replace("mcg", "");
    const mapped: Record<string, string> = {
      calories: "calories", protein: "protein", carbs: "carbs", carbohydrates: "carbs",
      fat: "fat", totalfat: "fat", fiber: "fiber", dietaryfiber: "fiber",
      sugar: "sugar", totalsugars: "sugar", sodium: "sodium",
      saturatedfat: "saturatedFat", cholesterol: "cholesterol",
      potassium: "potassium", calcium: "calcium", iron: "iron",
      vitaminc: "vitaminC", vitamina: "vitaminA", vitamind: "vitaminD",
      vitaminb12: "vitaminB12", omega3: "omega3", glycemicindex: "glycemicIndex",
    };
    const resolved = mapped[key] ?? k;
    const num = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
    if (!isNaN(num)) out[resolved] = num;
  }
  return out;
}

function findInLibrary(food: string) {
  const lower = food.toLowerCase().trim();
  const results = searchLocalCatalog({ query: food, limit: 15 });
  const exact = results.find(f =>
    f.nameEn.toLowerCase() === lower ||
    f.nameAr.toLowerCase() === lower
  );
  if (exact) return exact;
  const partial = results.find(f => {
    const nameEn = f.nameEn.toLowerCase();
    const nameAr = f.nameAr.toLowerCase();
    return nameEn.includes(lower) || lower.includes(nameEn) ||
      (nameAr.length > 2 && (nameAr.includes(lower) || lower.includes(nameAr)));
  });
  return partial ?? (results.length > 0 ? results[0] : null);
}

function buildEnrichmentPrompt(food: string, cuisine: string, ingredients: string[]): string {
  return `You are a culinary cultural expert specializing in ${cuisine} cuisine. For the dish "${food}", return ONLY this JSON with real, specific, detailed content:

{
  "culturalContext": "2-3 detailed sentences about cultural significance, traditions, and when/how this dish is enjoyed",
  "culturalContextAr": "نفس المحتوى بالعربية",
  "originStory": "1-2 sentences about historical origin and how this dish came to be",
  "healthInsights": [
    "Specific health benefit 1 with mechanism (e.g. chickpeas provide plant-based protein and resistant starch...)",
    "Specific health benefit 2 related to key ingredients",
    "Specific health benefit 3 about vitamins or minerals",
    "Any moderation advice or balance tip"
  ],
  "healthInsightsAr": ["فائدة صحية 1", "فائدة صحية 2", "فائدة صحية 3", "نصيحة التوازن"],
  "warnings": ["Any relevant health warnings — e.g. high sodium, allergen note, not suitable for diabetics etc. Leave empty array if none."],
  "cookingSteps": [
    "Step 1: [Prep work — e.g. soak, marinate, measure ingredients]",
    "Step 2: [Heat/prep cooking surface or vessel]",
    "Step 3: [First cooking action]",
    "Step 4: [Main cooking process]",
    "Step 5: [Add remaining ingredients]",
    "Step 6: [Finishing — seasoning, garnish]",
    "Step 7: [Rest/cool/plate]",
    "Step 8: [Serve with — garnish and presentation tips]"
  ],
  "servingSuggestions": ["How to plate and serve suggestion 1", "What to pair it with suggestion 2", "Occasion or serving tip 3"],
  "storageTips": "Detailed storage instructions: how long it keeps, refrigerator vs freezer, reheating tips",
  "bestTimeToEat": "breakfast OR lunch OR dinner OR snack OR any",
  "fitnessGoals": ["weight-loss" and/or "muscle-gain" and/or "endurance" and/or "general-health" and/or "heart-health" and/or "energy"],
  "dietaryCompatibility": {
    "vegan": false,
    "vegetarian": false,
    "glutenFree": false,
    "dairyFree": false,
    "halal": true,
    "kosher": false,
    "keto": false,
    "paleo": false,
    "lowCarb": false,
    "highProtein": false
  },
  "regionalVariations": [
    {"region": "Country/Region name", "description": "How this region prepares it differently", "keyDifferences": ["difference 1", "difference 2"]},
    {"region": "Another region", "description": "Their variation", "keyDifferences": ["difference 1"]}
  ]
}

Ingredients in this dish: ${ingredients.slice(0, 12).join(", ")}
Return ONLY the JSON. No markdown. No code fences.`;
}

function buildFullAnalyzePrompt(food: string, servingSize: string): string {
  return `You are a professional nutritionist and culinary cultural expert. Analyze "${food}" for a serving size of "${servingSize}".

IMPORTANT: All numeric values MUST be accurate, realistic numbers based on real nutritional data — NEVER leave any number as 0 unless it is truly zero (e.g. fiber in meat is truly 0). Use your nutritional knowledge to provide precise estimates.

Return ONLY this JSON object with all fields filled with REAL values:

{
  "foodNameEn": "English name of the dish",
  "foodNameAr": "اسم الطبق بالعربية",
  "cuisine": "cuisine type (e.g. Lebanese, Japanese, Mexican)",
  "region": "geographic region (e.g. Levant, East Asia)",
  "category": "main OR soup OR salad OR dessert OR breakfast OR snack OR beverage OR side OR appetizer",
  "servingSize": "describe exact serving with estimated grams (e.g. 1 bowl ~350g)",
  "nutrition": {
    "calories": 400,
    "protein": 18,
    "carbs": 45,
    "fat": 14,
    "fiber": 6,
    "sugar": 4,
    "sodium": 550,
    "saturatedFat": 3,
    "cholesterol": 45,
    "potassium": 420,
    "calcium": 85,
    "iron": 3,
    "vitaminC": 8,
    "vitaminA": 120,
    "vitaminD": 0,
    "vitaminB12": 0.5,
    "omega3": 0.3,
    "glycemicIndex": 45
  },
  "dailyValues": {
    "calories": 20,
    "protein": 36,
    "carbs": 15,
    "fat": 18,
    "fiber": 24,
    "sodium": 24,
    "calcium": 8,
    "iron": 17,
    "vitaminC": 9,
    "vitaminA": 13,
    "vitaminD": 0,
    "potassium": 9
  },
  "culturalContext": "2-3 sentences about cultural significance and traditions",
  "culturalContextAr": "نفس المحتوى بالعربية في جملتين أو ثلاثة",
  "originStory": "1-2 sentences about historical origin of this dish",
  "bestTimeToEat": "breakfast OR lunch OR dinner OR snack OR any",
  "fitnessGoals": ["weight-loss", "general-health"],
  "regionalVariations": [
    {"region": "region name", "description": "how they prepare it", "keyDifferences": ["difference 1"]},
    {"region": "another region", "description": "their variation", "keyDifferences": ["difference 1"]}
  ],
  "healthInsights": [
    "Specific benefit 1 with mechanism",
    "Specific benefit 2 mentioning key ingredients",
    "Vitamin or mineral highlight",
    "Balance or moderation advice"
  ],
  "healthInsightsAr": ["فائدة 1", "فائدة 2", "فائدة 3", "نصيحة"],
  "warnings": ["health warning if sodium/sugar/fat is high — or empty array"],
  "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3", "up to 10 ingredients"],
  "cookingMethod": "brief 1-sentence description of cooking technique",
  "cookingSteps": [
    "Step 1: Prepare and measure all ingredients",
    "Step 2: Begin cooking",
    "Step 3: Main cooking process",
    "Step 4: Add seasonings",
    "Step 5: Finish and plate",
    "Step 6: Garnish and serve"
  ],
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "easy OR medium OR hard",
  "servingSuggestions": ["serving suggestion 1", "serving suggestion 2"],
  "storageTips": "How to store leftovers, shelf life, reheating tips",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "allergens": ["only real allergens: peanuts, tree nuts, dairy, eggs, soy, wheat, shellfish, fish, sesame"],
  "dietaryCompatibility": {
    "vegan": false,
    "vegetarian": false,
    "glutenFree": true,
    "dairyFree": false,
    "halal": true,
    "kosher": false,
    "keto": false,
    "paleo": false,
    "lowCarb": false,
    "highProtein": false
  }
}

Replace the example numbers above with REAL accurate values for "${food}". Return ONLY the JSON object. No markdown, no backticks.`;
}

const STATUS_PHASES = [
  "Looking up in food library...",
  "Calculating full nutrition profile...",
  "Researching cultural context...",
  "Writing step-by-step recipe...",
  "Building health insights...",
  "Finalizing analysis...",
];

router.post("/nutrition/analyze/stream", async (req, res) => {
  const parsed = AnalyzeFoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { food, servingSize = "1 serving" } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  send({ type: "status", message: STATUS_PHASES[0] });

  // ── Step 1: Check local library ──────────────────────────────────────────────
  const libraryFood = findInLibrary(food);

  if (libraryFood) {
    // Fast path: library nutrition is accurate, only need AI for text enrichment
    send({ type: "status", message: "Found in library — enriching with cultural & health data..." });

    const heartbeat = setInterval(() => send({ type: "heartbeat" }), 6000);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content: "You are a culinary cultural expert. Return ONLY valid compact JSON. No markdown, no code fences, no extra text."
          },
          {
            role: "user",
            content: buildEnrichmentPrompt(food, libraryFood.cuisine, (libraryFood as { ingredients?: string[] }).ingredients ?? [])
          }
        ],
      });

      clearInterval(heartbeat);

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      let enrichment: Record<string, unknown> = {};
      try {
        enrichment = JSON.parse(extractJson(rawContent));
      } catch {
        req.log.warn({ rawContent: rawContent.slice(0, 200) }, "Enrichment parse failed, using library only");
      }

      const libNutrition = libraryFood.nutrition as Record<string, number>;

      // Compute daily values from library nutrition
      const DV_REF: Record<string, number> = {
        calories: 2000, protein: 50, carbs: 325, fat: 78, fiber: 28,
        sodium: 2300, calcium: 1300, iron: 18, vitaminC: 90,
        vitaminA: 900, vitaminD: 20, potassium: 4700,
      };
      const dailyValues: Record<string, number> = {};
      for (const [key, ref] of Object.entries(DV_REF)) {
        const val = libNutrition[key] ?? 0;
        if (val > 0 && ref > 0) dailyValues[key] = Math.round((val / ref) * 100);
      }

      const drinkPairing = getDrinkPairing(libraryFood.cuisine);

      const result = {
        id: randomUUID(),
        food,
        foodNameEn: libraryFood.nameEn,
        foodNameAr: libraryFood.nameAr,
        cuisine: libraryFood.cuisine,
        region: libraryFood.region,
        category: libraryFood.category,
        servingSize: `1 serving (~200g)`,
        nutrition: {
          ...libNutrition,
          saturatedFat: libNutrition.saturatedFat ?? Math.round((libNutrition.fat ?? 0) * 0.3),
          cholesterol: libNutrition.cholesterol ?? 0,
          potassium: libNutrition.potassium ?? Math.round((libNutrition.calories ?? 0) * 0.5),
          calcium: libNutrition.calcium ?? Math.round((libNutrition.calories ?? 0) * 0.15),
          iron: libNutrition.iron ?? Math.round((libNutrition.protein ?? 0) * 0.3),
          vitaminC: libNutrition.vitaminC ?? 0,
          vitaminA: libNutrition.vitaminA ?? 0,
          vitaminD: libNutrition.vitaminD ?? 0,
          vitaminB12: libNutrition.vitaminB12 ?? 0,
          omega3: libNutrition.omega3 ?? 0,
          glycemicIndex: libNutrition.glycemicIndex ?? 50,
        },
        dailyValues,
        culturalContext: (enrichment.culturalContext as string) ?? (libraryFood as { description?: string }).description ?? "",
        culturalContextAr: (enrichment.culturalContextAr as string) ?? "",
        originStory: (enrichment.originStory as string) ?? "",
        bestTimeToEat: (enrichment.bestTimeToEat as string) ?? "any",
        fitnessGoals: (enrichment.fitnessGoals as string[]) ?? [],
        regionalVariations: (enrichment.regionalVariations as object[]) ?? [],
        healthInsights: (enrichment.healthInsights as string[]) ?? [],
        healthInsightsAr: (enrichment.healthInsightsAr as string[]) ?? [],
        warnings: (enrichment.warnings as string[]) ?? [],
        ingredients: (libraryFood as { ingredients?: string[] }).ingredients ?? [],
        cookingMethod: "",
        cookingSteps: (enrichment.cookingSteps as string[]) ?? [],
        prepTime: (libraryFood as { cookTime?: number }).cookTime ? Math.round(((libraryFood as { cookTime?: number }).cookTime ?? 30) * 0.3) : 15,
        cookTime: (libraryFood as { cookTime?: number }).cookTime ?? 30,
        difficulty: (libraryFood as { difficulty?: string }).difficulty ?? "medium",
        servingSuggestions: (enrichment.servingSuggestions as string[]) ?? [],
        storageTips: (enrichment.storageTips as string) ?? "",
        tags: (libraryFood as { tags?: string[] }).tags ?? [],
        allergens: (libraryFood as { allergens?: string[] }).allergens ?? [],
        dietaryCompatibility: (enrichment.dietaryCompatibility as object) ?? {},
        drinkPairing,
        imageUrl: (libraryFood as { imageUrl?: string }).imageUrl,
        confidence: 0.98,
        source: "nutri-llm-library",
        analyzedAt: new Date().toISOString(),
      };

      try {
        await db.insert(foodAnalysesTable).values({
          food,
          foodNameEn: result.foodNameEn,
          foodNameAr: result.foodNameAr,
          servingSize: result.servingSize,
          nutrition: result.nutrition,
          culturalContext: result.culturalContext,
          culturalContextAr: result.culturalContextAr,
          regionalVariations: result.regionalVariations,
          healthInsights: result.healthInsights,
          healthInsightsAr: result.healthInsightsAr,
          ingredients: result.ingredients,
          cuisine: result.cuisine,
          region: result.region,
          category: result.category,
          tags: result.tags,
        });
      } catch (dbErr) {
        req.log.warn({ dbErr }, "DB insert failed, continuing");
      }

      send({ type: "done", result });
    } catch (err) {
      clearInterval(heartbeat);
      req.log.error({ err }, "Enrichment AI call failed");
      send({ type: "error", message: "Analysis failed. Please try again." });
    }

    res.end();
    return;
  }

  // ── Slow path: food not in library, full AI analysis ─────────────────────────
  send({ type: "status", message: "Performing full AI nutritional analysis..." });

  let phaseIdx = 1;
  const phaseTimer = setInterval(() => {
    phaseIdx = Math.min(phaseIdx + 1, STATUS_PHASES.length - 1);
    send({ type: "status", message: STATUS_PHASES[phaseIdx] });
  }, 5000);
  const heartbeatTimer = setInterval(() => send({ type: "heartbeat" }), 8000);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: "You are NutriLLM, a professional nutritionist and food cultural expert. Return ONLY a valid JSON object. No markdown, no code fences. All numeric values must be real accurate non-zero numbers based on actual nutritional data."
        },
        { role: "user", content: buildFullAnalyzePrompt(food, servingSize) }
      ],
    });

    clearInterval(phaseTimer);
    clearInterval(heartbeatTimer);

    const rawContent = completion.choices[0]?.message?.content ?? "";
    req.log.info({ contentLength: rawContent.length }, "AI full analysis received");

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(extractJson(rawContent));
    } catch (parseErr) {
      req.log.error({ parseErr, rawContent: rawContent.slice(0, 300) }, "JSON parse failed");
      send({ type: "error", message: "Analysis returned unexpected format. Please try again." });
      res.end();
      return;
    }

    const nutrition = normalizeNutrition((analysis.nutrition as Record<string, unknown>) ?? {});

    // Sanity-check the AI-generated nutrition numbers against USDA FoodData
    // Central rather than trusting them blindly — see usda-verify.ts for why
    // this matters and exactly what it does and doesn't catch. Never blocks
    // the response: any USDA failure just means "unverified," not an error.
    const usdaVerification = await verifyNutritionAgainstUSDA(food, {
      calories: nutrition.calories ?? 0,
      protein: nutrition.protein ?? 0,
      carbs: nutrition.carbs ?? 0,
      fat: nutrition.fat ?? 0,
    });
    req.log.info({ usdaVerification }, "USDA verification result for AI-generated nutrition");

    // Confidence reflects the actual verification outcome instead of a fixed
    // constant — a deviation flagged against real reference data is a
    // meaningfully different situation from an unverified or clean estimate,
    // and the response should say so rather than claiming the same 0.92
    // regardless of what was actually found.
    const confidenceByStatus: Record<typeof usdaVerification.status, number> = {
      verified: 0.9,
      "deviation-flagged": 0.55,
      "no-match": 0.75,
      "skipped-no-api-key": 0.75,
      error: 0.75,
    };

    // Compute daily values
    const DV_REF: Record<string, number> = {
      calories: 2000, protein: 50, carbs: 325, fat: 78, fiber: 28,
      sodium: 2300, calcium: 1300, iron: 18, vitaminC: 90,
      vitaminA: 900, vitaminD: 20, potassium: 4700,
    };
    const dailyValues: Record<string, number> = {};
    for (const [key, ref] of Object.entries(DV_REF)) {
      const val = nutrition[key] ?? 0;
      if (val > 0 && ref > 0) dailyValues[key] = Math.round((val / ref) * 100);
    }

    try {
      await db.insert(foodAnalysesTable).values({
        food,
        foodNameEn: (analysis.foodNameEn as string) ?? food,
        foodNameAr: (analysis.foodNameAr as string) ?? food,
        servingSize: (analysis.servingSize as string) ?? servingSize,
        nutrition,
        culturalContext: (analysis.culturalContext as string) ?? "",
        culturalContextAr: (analysis.culturalContextAr as string) ?? "",
        regionalVariations: (analysis.regionalVariations as object[]) ?? [],
        healthInsights: (analysis.healthInsights as string[]) ?? [],
        healthInsightsAr: (analysis.healthInsightsAr as string[]) ?? [],
        ingredients: (analysis.ingredients as string[]) ?? [],
        cuisine: (analysis.cuisine as string) ?? "International",
        region: (analysis.region as string) ?? "Global",
        category: (analysis.category as string) ?? "main",
        tags: (analysis.tags as string[]) ?? [],
      });
    } catch (dbErr) {
      req.log.warn({ dbErr }, "DB insert failed, continuing");
    }

    const drinkPairing = getDrinkPairing((analysis.cuisine as string) ?? "");

    send({
      type: "done",
      result: {
        id: randomUUID(),
        food,
        foodNameEn: analysis.foodNameEn ?? food,
        foodNameAr: analysis.foodNameAr ?? food,
        servingSize: analysis.servingSize ?? servingSize,
        nutrition,
        dailyValues,
        culturalContext: analysis.culturalContext ?? "",
        culturalContextAr: analysis.culturalContextAr ?? "",
        originStory: analysis.originStory ?? "",
        bestTimeToEat: analysis.bestTimeToEat ?? "any",
        fitnessGoals: analysis.fitnessGoals ?? [],
        regionalVariations: analysis.regionalVariations ?? [],
        healthInsights: analysis.healthInsights ?? [],
        healthInsightsAr: analysis.healthInsightsAr ?? [],
        warnings: analysis.warnings ?? [],
        ingredients: analysis.ingredients ?? [],
        cookingMethod: analysis.cookingMethod ?? "",
        cookingSteps: (analysis.cookingSteps as string[]) ?? [],
        prepTime: analysis.prepTime ?? null,
        cookTime: analysis.cookTime ?? null,
        difficulty: analysis.difficulty ?? null,
        servingSuggestions: analysis.servingSuggestions ?? [],
        storageTips: analysis.storageTips ?? "",
        tags: analysis.tags ?? [],
        allergens: analysis.allergens ?? [],
        dietaryCompatibility: analysis.dietaryCompatibility ?? {},
        cuisine: analysis.cuisine ?? "International",
        region: analysis.region ?? "Global",
        category: analysis.category ?? "main",
        drinkPairing,
        confidence: confidenceByStatus[usdaVerification.status],
        nutritionVerification: usdaVerification,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    clearInterval(phaseTimer);
    clearInterval(heartbeatTimer);
    req.log.error({ err }, "Streaming analysis failed");
    send({ type: "error", message: "Analysis failed. Please try again." });
  }

  res.end();
});

router.post("/nutrition/analyze", async (req, res) => {
  const parsed = AnalyzeFoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", message: parsed.error.message });
    return;
  }
  const { food, servingSize = "1 serving" } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 3000,
      messages: [
        { role: "system", content: "You are NutriLLM. Return only valid JSON, no markdown, no code fences. All numbers must be real accurate non-zero values." },
        { role: "user", content: buildFullAnalyzePrompt(food, servingSize) }
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(extractJson(rawContent));
    const drinkPairing = getDrinkPairing(analysis.cuisine ?? "");
    const nutrition = normalizeNutrition(analysis.nutrition ?? {});

    await db.insert(foodAnalysesTable).values({
      food,
      foodNameEn: analysis.foodNameEn ?? food,
      foodNameAr: analysis.foodNameAr ?? food,
      servingSize: analysis.servingSize ?? servingSize,
      nutrition,
      culturalContext: analysis.culturalContext ?? "",
      culturalContextAr: analysis.culturalContextAr ?? "",
      regionalVariations: analysis.regionalVariations ?? [],
      healthInsights: analysis.healthInsights ?? [],
      healthInsightsAr: analysis.healthInsightsAr ?? [],
      ingredients: analysis.ingredients ?? [],
      cuisine: analysis.cuisine ?? "International",
      region: analysis.region ?? "Global",
      category: analysis.category ?? "main",
      tags: analysis.tags ?? [],
    });

    res.json({ id: randomUUID(), food, ...analysis, nutrition, drinkPairing, analyzedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Food analysis failed");
    res.status(500).json({ error: "Analysis failed", message: "Could not analyze food item" });
  }
});

router.post("/nutrition/analyze-image", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body ?? {};
  if (!imageBase64) {
    res.status(400).json({ error: "Missing imageBase64" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2500,
      messages: [
        { role: "system", content: "You are NutriLLM. Analyze food images accurately. Return ONLY valid JSON, no markdown. All numeric values must be real non-zero estimates based on what you see." },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            {
              type: "text", text: `Identify all food in this image. Return ONLY JSON with real numbers (NOT zero):
{
  "foodNameEn": "name",
  "foodNameAr": "الاسم",
  "confidence": 0.9,
  "identifiedFoods": ["food 1", "food 2"],
  "cuisine": "cuisine",
  "region": "region",
  "category": "main",
  "servingSize": "estimated serving",
  "nutrition": {"calories": 400, "protein": 18, "carbs": 45, "fat": 14, "fiber": 5, "sugar": 4, "sodium": 550, "saturatedFat": 3, "cholesterol": 40, "potassium": 400, "calcium": 80, "iron": 3, "vitaminC": 8, "glycemicIndex": 50},
  "dailyValues": {"calories": 20, "protein": 36, "carbs": 14, "fat": 18, "fiber": 18, "sodium": 24, "calcium": 6, "iron": 17, "vitaminC": 9},
  "ingredients": ["ingredient 1", "ingredient 2"],
  "allergens": [],
  "tags": ["tag1", "tag2"],
  "healthInsights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "healthInsightsAr": ["فائدة 1", "فائدة 2", "فائدة 3", "فائدة 4"],
  "warnings": [],
  "culturalContext": "cultural info",
  "culturalContextAr": "المعلومات الثقافية",
  "cookingSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "cookTime": 30,
  "difficulty": "easy",
  "prepTime": 10,
  "bestTimeToEat": "any",
  "fitnessGoals": ["general-health"],
  "servingSuggestions": ["suggestion 1"],
  "dietaryCompatibility": {"vegan": false, "vegetarian": false, "glutenFree": false, "dairyFree": false, "halal": true, "keto": false, "paleo": false}
}` }
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(extractJson(raw));
    const nutrition = normalizeNutrition(analysis.nutrition ?? {});
    res.json({ ...analysis, nutrition, drinkPairing: getDrinkPairing(analysis.cuisine ?? "") });
  } catch (err) {
    req.log.error({ err }, "Image analysis failed");
    res.status(500).json({ error: "Vision failed", message: "Could not analyze image" });
  }
});

router.post("/nutrition/generate-recipe", async (req, res) => {
  const { cuisine1, cuisine2, mealType = "main", dietary = [], servings = 2 } = req.body ?? {};
  if (!cuisine1) {
    res.status(400).json({ error: "cuisine1 is required" });
    return;
  }

  const isFusion = cuisine2 && cuisine2 !== cuisine1;
  const recipeType = isFusion ? `${cuisine1}-${cuisine2} fusion` : cuisine1;
  const dietStr = dietary.length > 0 ? `Must be: ${dietary.join(", ")}.` : "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content: `You are an expert ${recipeType} chef. Generate authentic, detailed recipes. Return ONLY valid JSON, no markdown. All numeric values must be real accurate numbers.`
        },
        {
          role: "user",
          content: `Create an authentic ${recipeType} ${mealType} recipe for ${servings} servings. ${dietStr}

Return ONLY this JSON with real values:
{
  "id": "recipe-slug-kebab-case",
  "name": "Dish Name",
  "description": "2-3 sentence description of the dish and what makes it special",
  "cuisine1": "${cuisine1}",
  "cuisine2": "${cuisine2 || ""}",
  "mealType": "${mealType}",
  "servings": ${servings},
  "cookTime": 35,
  "difficulty": "medium",
  "dietaryTags": [],
  "ingredients": [
    {"amount": "2 cups", "item": "basmati rice"},
    {"amount": "500g", "item": "chicken thighs"},
    {"amount": "2 tbsp", "item": "olive oil"}
  ],
  "instructions": [
    "Step 1: Wash the rice under cold water until water runs clear, then soak for 30 minutes.",
    "Step 2: Marinate chicken in spices for at least 15 minutes.",
    "Step 3: Heat oil in a large pot over medium-high heat and brown the chicken 3-4 minutes per side.",
    "Step 4: Add onions and cook until golden, about 5 minutes.",
    "Step 5: Add rice and toast for 2 minutes, then pour in hot broth.",
    "Step 6: Cover and cook on low heat for 18 minutes until rice is tender.",
    "Step 7: Let rest 5 minutes before flipping onto serving dish.",
    "Step 8: Garnish with toasted nuts and fresh herbs. Serve with yogurt."
  ],
  "proTips": [
    "Professional tip 1 about technique or ingredient",
    "Professional tip 2 about flavor or timing"
  ],
  "nutritionInfo": {
    "calories": 520,
    "protein": 32,
    "carbs": 58,
    "fat": 18,
    "fiber": 4
  },
  "pairingNotes": "What drinks or sides pair well with this dish",
  "culturalStory": "1-2 sentences about this dish's cultural significance",
  "allergens": []
}`
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const recipe = JSON.parse(extractJson(raw));
    res.json({ ...recipe, generatedAt: new Date().toISOString(), isGenerated: true });
  } catch (err) {
    req.log.error({ err }, "Recipe generation failed");
    res.status(500).json({ error: "Generation failed", message: "Could not generate recipe" });
  }
});

router.get("/nutrition/history", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: foodAnalysesTable.id,
        food: foodAnalysesTable.food,
        foodNameEn: foodAnalysesTable.foodNameEn,
        foodNameAr: foodAnalysesTable.foodNameAr,
        nutrition: foodAnalysesTable.nutrition,
        cuisine: foodAnalysesTable.cuisine,
        region: foodAnalysesTable.region,
        category: foodAnalysesTable.category,
        tags: foodAnalysesTable.tags,
        analyzedAt: foodAnalysesTable.analyzedAt,
      })
      .from(foodAnalysesTable)
      .orderBy(desc(foodAnalysesTable.analyzedAt))
      .limit(50);
    res.json(rows.map(r => ({ ...r, id: String(r.id), analyzedAt: r.analyzedAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "History fetch failed");
    res.status(500).json({ error: "fetch_failed", message: "Could not fetch history" });
  }
});

router.get("/nutrition/pairings", async (req, res) => {
  const { cuisine } = req.query as { cuisine?: string };
  res.json(getDrinkPairing(cuisine ?? ""));
});

export default router;
