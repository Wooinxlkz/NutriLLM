/**
 * USDA FoodData Central verification layer.
 * https://fdc.nal.usda.gov/api-guide
 *
 * The AI-only analysis path (nutrition.ts "slow path", for dishes not in the
 * local library) asks an LLM to estimate nutrition numbers from its own
 * knowledge, with no grounding check. That's the highest-risk place in this
 * app for a confidently-wrong hallucinated number, since there's nothing to
 * catch it. This module is that check: it queries USDA's free public
 * nutrition database for the closest matching food and compares macronutrient
 * *ratios* (not absolute values — see below) against the AI's estimate,
 * flagging a large deviation instead of silently trusting the AI output.
 *
 * This is deliberately a sanity check, not a replacement for the AI estimate
 * — USDA's database skews toward American/generic foods and often won't have
 * a real match for a specific regional dish (e.g. most of the Algerian dishes
 * added alongside this module). A "no-match" result is expected and normal,
 * not a failure.
 *
 * Requires USDA_API_KEY (free, no cost, signup at https://fdc.nal.usda.gov/api-key-signup)
 * in the environment. If unset, verification is skipped entirely and the AI
 * estimate is used as-is — this module never blocks or breaks the analysis
 * flow, only adds an optional extra signal on top of it.
 */

export interface USDAVerificationResult {
  status: "verified" | "deviation-flagged" | "no-match" | "skipped-no-api-key" | "error";
  matchedFoodName?: string;
  usdaNutrition?: { calories: number; protein: number; carbs: number; fat: number };
  deviations?: { field: string; aiRatioPercent: number; usdaRatioPercent: number; diffPercentPoints: number }[];
  note: string;
}

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// Macronutrient RATIO deviation threshold (percentage points of calorie
// contribution), not an absolute-value threshold. USDA entries are typically
// per-100g reference values while the AI estimate is per-serving — those are
// different bases and directly comparing absolute calorie/gram counts would
// be comparing apples to a different-sized apple. Ratios (what % of calories
// come from protein/carbs/fat) are serving-size-independent, so they're the
// fair comparison here. 25 percentage points is a deliberately generous
// tolerance — dish-level matching against a single closest USDA entry is
// inherently approximate, and this is meant to catch genuinely implausible
// AI output, not to nitpick reasonable recipe variation.
const DEVIATION_THRESHOLD_POINTS = 25;

interface USDAFoodNutrient {
  nutrientName: string;
  value: number;
}

interface USDAFood {
  description: string;
  foodNutrients: USDAFoodNutrient[];
}

function getNutrientValue(food: USDAFood, matchNames: string[]): number | undefined {
  for (const n of food.foodNutrients) {
    if (matchNames.some(name => n.nutrientName.toLowerCase().includes(name.toLowerCase()))) {
      return n.value;
    }
  }
  return undefined;
}

export async function verifyNutritionAgainstUSDA(
  foodName: string,
  aiNutrition: { calories: number; protein: number; carbs: number; fat: number }
): Promise<USDAVerificationResult> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return {
      status: "skipped-no-api-key",
      note: "USDA_API_KEY not configured — verification skipped, AI estimate used as-is.",
    };
  }

  try {
    const url = new URL(`${USDA_BASE}/foods/search`);
    url.searchParams.set("query", foodName);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("dataType", "Survey (FNDDS),SR Legacy,Foundation");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return {
        status: "error",
        note: `USDA API returned HTTP ${res.status} — verification skipped, AI estimate used as-is.`,
      };
    }

    const data = (await res.json()) as { foods?: USDAFood[] };
    const foods = data.foods ?? [];
    if (foods.length === 0) {
      return {
        status: "no-match",
        note: "No matching USDA entry found for this dish — likely too specific/regional for USDA's database. AI estimate used as-is, unverified.",
      };
    }

    // USDA's own relevance ranking — first result is the closest match.
    const best = foods[0];
    const usdaNutrition = {
      calories: getNutrientValue(best, ["Energy"]) ?? 0,
      protein: getNutrientValue(best, ["Protein"]) ?? 0,
      carbs: getNutrientValue(best, ["Carbohydrate"]) ?? 0,
      fat: getNutrientValue(best, ["Total lipid", "fat"]) ?? 0,
    };

    const aiCalFromMacros = aiNutrition.protein * 4 + aiNutrition.carbs * 4 + aiNutrition.fat * 9;
    const usdaCalFromMacros = usdaNutrition.protein * 4 + usdaNutrition.carbs * 4 + usdaNutrition.fat * 9;

    const deviations: USDAVerificationResult["deviations"] = [];
    if (aiCalFromMacros > 0 && usdaCalFromMacros > 0) {
      const macroChecks: Array<{ field: string; aiCals: number; usdaCals: number }> = [
        { field: "protein", aiCals: aiNutrition.protein * 4, usdaCals: usdaNutrition.protein * 4 },
        { field: "carbs", aiCals: aiNutrition.carbs * 4, usdaCals: usdaNutrition.carbs * 4 },
        { field: "fat", aiCals: aiNutrition.fat * 9, usdaCals: usdaNutrition.fat * 9 },
      ];
      for (const { field, aiCals, usdaCals } of macroChecks) {
        const aiRatio = aiCals / aiCalFromMacros;
        const usdaRatio = usdaCals / usdaCalFromMacros;
        const diffPoints = Math.abs(aiRatio - usdaRatio) * 100;
        if (diffPoints > DEVIATION_THRESHOLD_POINTS) {
          deviations.push({
            field,
            aiRatioPercent: Math.round(aiRatio * 100),
            usdaRatioPercent: Math.round(usdaRatio * 100),
            diffPercentPoints: Math.round(diffPoints),
          });
        }
      }
    }

    const flagged = deviations.length > 0;
    return {
      status: flagged ? "deviation-flagged" : "verified",
      matchedFoodName: best.description,
      usdaNutrition,
      deviations: flagged ? deviations : undefined,
      note: flagged
        ? `Macronutrient balance differs notably from the closest USDA match ("${best.description}") — the AI estimate may be inaccurate, treat with extra caution.`
        : `Macronutrient balance is broadly consistent with the closest USDA match ("${best.description}").`,
    };
  } catch {
    return {
      status: "error",
      note: "USDA verification request failed (network/timeout) — AI estimate used as-is, unverified.",
    };
  }
}
