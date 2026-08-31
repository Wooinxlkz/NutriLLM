# Notice

## Not medical or dietary advice

NutriLLM provides nutritional estimates for informational and educational purposes. It is not a substitute for advice from a registered dietitian, doctor, or other qualified healthcare provider — especially for anyone managing a medical condition, allergy, or specific dietary requirement. Always verify nutrition information independently before making health decisions based on it.

## AI-generated nutrition estimates and the USDA verification layer

Two different paths produce nutrition numbers in this app, with different reliability:

1. **Local library path** (`lib/food-data/src/mena-foods.ts`, `world-foods.ts`): nutrition values were curated by hand/estimated from standard recipe composition, calibrated for internal consistency across entries (e.g. the new Algerian dishes were scaled against the existing Moroccan Couscous entry) — not sourced from a single certified lab database. Treat these as reasonable estimates, not lab measurements.

2. **AI-only analysis path** (dish not in the local library): the LLM is asked to estimate nutrition numbers from its own knowledge, with no built-in grounding. This is the highest-risk place in the app for a confidently-wrong hallucinated number — there was previously nothing to catch it.

### What the USDA verification layer does and does not do

`lib/food-data/src/usda-verify.ts` adds a sanity check to the AI-only path: it queries USDA FoodData Central for the closest-matching food and compares **macronutrient ratios** (what % of calories come from protein/carbs/fat) between the AI estimate and the USDA entry, flagging a result if they differ by more than 25 percentage points.

Specifically:
- **Ratios, not absolute values.** USDA entries are typically per-100g reference values; the AI's estimate is per-serving. Comparing absolute calorie/gram counts directly would be comparing different bases. Ratios are serving-size-independent, so they're the fairer comparison — but this means the check can miss a case where both the ratio *and* the absolute numbers are wrong in the same direction.
- **A "no-match" result is normal, not a failure.** USDA's database skews toward American/generic foods. Most of the regional dishes in this library (the new Algerian ones especially) are unlikely to have a real USDA match — the AI estimate is used as-is in that case, unverified.
- **Optional and non-blocking.** Requires `USDA_API_KEY` (free, no cost — see README). If unset, or if the request fails for any reason (network, timeout, rate limit), verification is skipped entirely and the AI estimate is used as-is. This module never blocks or errors out the analysis flow.
- **The `confidence` field in the analysis response now reflects the actual verification outcome** (0.9 verified / 0.55 deviation-flagged / 0.75 no-match, skipped, or error) instead of a previously hardcoded constant (`0.92`, unconditionally, regardless of what was actually found) — see "What changed in this round," below.

### What has and hasn't been tested

The no-API-key fallback path was tested and confirmed working (returns `skipped-no-api-key`, doesn't throw). **The live USDA API call and response-parsing path has not been tested against a real API response** — the development environment used to build this had no network access to `api.nal.usda.gov` (confirmed via an explicit `host_not_allowed` deny reason, not just a timeout). The request-building and error-handling code follows the same pattern already proven working elsewhere in this codebase (`lib/food-data/src/openfoodfacts.ts`), but the actual USDA response shape assumptions (nutrient name matching, field structure) should be verified against a real response with a real `USDA_API_KEY` before being trusted in production.

## Country-level food taxonomy

`lib/food-data/src/country-taxonomy.ts` adds an optional `country` field to food entries, on top of the existing free-text `region`/`cuisine` fields. Of the 56 original pre-existing MENA entries, **36 were tagged programmatically** based on a clean cuisine→country mapping (e.g. any entry with `cuisine: "Egyptian"` was tagged `country: "eg"`). The remaining 20 were left untagged deliberately — their cuisine value was something genuinely cross-border or ambiguous ("Levantine," "Middle Eastern," "Turkish / Middle Eastern," "Saudi / Gulf," "Iraqi / Levantine") where guessing a single country would have been fabricating precision the dish doesn't have (hummus and falafel, for instance, are claimed by multiple Levant countries — tagging either to one specific country would be a real accuracy problem, not a minor simplification). All 40 newly added dishes (see "Second round" below) are fully tagged since each was specifically selected for a named country.

## Second round: closing every remaining zero-coverage gap

After the first round (Algeria only), an explicit audit of every country in `MENA_REGIONS` found **6 countries still had zero dishes** — Libya, Mauritania, Sudan, Kuwait, Oman, Qatar — and 8 more had only 1-2 entries (Lebanon, Jordan, Palestine, Syria, Tunisia, Saudi Arabia, UAE, Bahrain). This section documents closing that completely, not partially.

**32 additional dishes** were added, each researched individually (not templated or filled generically):
- Libya (4): Bazin, Sharba Libiya, Usban, Libyan Asida
- Mauritania (4): Maru Hout/Thieboudienne, Méchoui Mauritanien, Cherchem, Leksour — sourced from multiple cross-referenced sources given this is a less commonly documented cuisine (Wikipedia's Mauritanian cuisine article, Travel Food Atlas, The Flavor Vortex)
- Sudan (4): Mullah, Kisra, Tamiya (Sudanese chickpea-based falafel, distinct from the fava-bean Levantine version), Sudanese Aseeda
- Kuwait (2): Mutabbaq Samak (Kuwait's own cited national dish — distinct from the already-present Bahraini Machboos and Saudi Jareesh, deliberately not duplicated), Murabyan
- Oman (3): Shuwa (national dish), Omani Halwa, Mashuai
- Qatar (2): Machboos Qatari, Madrouba
- Levant top-ups: Warak Enab + (existing Kibbeh retroactively tagged to Lebanon — see "A duplicate ID bug found and fixed" below), Manakish (Lebanon); Freekeh Pilaf, Zarb (Jordan); Musakhan, Knafeh Nabulsiya (Palestine); Yabraq, Fatteh Dimashqiya (Syria)
- Tunisia top-up (2): Ojja, Tunisian Tajine (explicitly noted in its own description as unrelated to Moroccan tagine despite the shared name, to prevent user confusion)
- Gulf top-ups: Saleeg (Saudi Arabia), Balaleet (UAE), Halwa Bahrainiya (Bahrain)

### A duplicate ID bug found and fixed during this round

The first draft of the Levant top-ups included a new "Kibbeh" entry for Lebanon with id `sl-kibbeh` — which turned out to collide exactly with a pre-existing, already-present Kibbeh entry (tagged generically "Levantine", no country) elsewhere in the file. This was caught by an automated duplicate-ID check (not manual review) run against the full array after the batch insertion. Fixed by tagging the **existing** entry with `country: "lb"` instead of creating a redundant duplicate, and replacing the new entry with a genuinely different Lebanese dish (Warak Enab) so Lebanon's intended +2 dishes were still delivered. This is exactly the kind of error a large batch insertion can introduce, and exactly why the automated re-audit (duplicate IDs, duplicate dish names, invalid country codes, sane calorie ranges) was run again after the insertion rather than assuming the first typecheck pass was sufficient.

### Current state, verified

96 total MENA entries. **Zero countries in the taxonomy have zero dishes** — every one has at least 2 real, researched entries. This was confirmed by an automated audit script (not a manual count), re-run after the duplicate-ID fix: 0 duplicate IDs, 0 duplicate English dish names, 0 invalid country codes, 0 dishes with an out-of-range calorie value, across the full 96-entry array.

## New Algerian dishes — sourcing

The 8 Algerian dishes added (Chorba Frik, Algerian Couscous, Rechta, Mhadjeb, Chakhchoukha, Bourek, Dolma in White Sauce, Zlabia) were selected and described based on web research into authentic Algerian cuisine (recipe descriptions, cultural context, regional origin — cross-referenced across multiple sources including Wikipedia and Algerian recipe sites). Nutrition figures follow the existing library's methodology: reasonable estimates from standard recipe/ingredient composition, calibrated in scale against comparable existing entries (Moroccan Couscous specifically), not independently lab-verified. Chorba Frik's estimate was additionally cross-referenced against several published recipe nutrition calculations (which varied from ~280–540 kcal/serving depending on portion/fat content) and set at a middle-of-range value.

This addressed a real, striking gap: prior to this round of changes, the MENA library contained dishes from Morocco, Egypt, and Tunisia under "North Africa," but **zero explicitly Algerian dishes** — despite this project's own creator being Algerian.

## Drink pairing fix — a bug that went deeper than the missing entries

The original `DRINK_PAIRINGS` lookup in `artifacts/api-server/src/routes/nutrition.ts` only matched a cuisine string if it happened to *contain* one of the dictionary's keys as a substring (e.g. `"levantine".includes("levantine")`). This meant cuisines like "Syrian," "Jordanian," "Palestinian," "Emirati," and "Bahraini" **never matched anything and silently fell through to the generic default pairing**, even before Algeria was considered — the missing-Algeria gap was a symptom of a broader matching-logic bug, not just a missing dictionary entry. Fixed by checking for an exact match first, falling back to substring matching only for genuinely compound cuisine labels (e.g. "Turkish / Middle Eastern"). 13 new country entries were added, and non-alcoholic pairings were prioritized for Gulf countries with real cultural/religious relevance (following the precedent already set by the pre-existing Saudi entry, which was non-alcoholic-only).

## What changed in this round — summary

- Added `country-taxonomy.ts` and an optional `country` field on `StaticFoodItem`; tagged 36/56 existing entries, left 20 honestly untagged.
- Added 8 real, sourced Algerian dishes (0 existed before).
- Fixed the drink-pairing matching bug and added 13 missing country entries.
- Added `usda-verify.ts` as an optional, non-blocking sanity check on AI-generated nutrition.
- Replaced a hardcoded, meaningless `confidence: 0.92` constant with a value derived from the actual USDA verification outcome.
- Added a `nutritionVerification` field to the analysis response and a corresponding visible UI badge — the previous `confidence` field existed in the frontend type but was never rendered anywhere in the UI; this is now surfaced.
- **Found and fixed a pre-existing TypeScript type error** in `nutrition.ts` (`Property 'description' does not exist on type 'AnyFoodItem'`) — confirmed via `git stash` that it predates this round of changes and was not introduced by it. The root `pnpm run typecheck:libs` script doesn't catch it because `artifacts/api-server` isn't wired into that composite TypeScript project — worth being aware of as a gap in the existing typecheck setup, not just this one bug.
- Added a missing `LICENSE` file — the README badge and license section linked to it already, but the file didn't exist in the repository.
- Reverted two files (`package.json`, `pnpm-workspace.yaml`) that were accidentally modified by local sandbox tooling setup (a `pnpm approve-builds` attempt that left a literal placeholder string in `pnpm-workspace.yaml`) — caught before being included in this change, not shipped.

## Verification performed

- All three TypeScript packages affected (`lib/food-data`, `artifacts/api-server`, `artifacts/nutri-llm`) compile cleanly (`tsc --noEmit`, exit code 0) after every change in both rounds, not just at the end.
- The full `MENA_FOODS` array (96 entries as of the second round) was loaded at runtime and checked: no duplicate IDs, no duplicate English dish names, no invalid/unrecognized country codes, no missing required fields, no calorie values outside a sane single-serving range.
- `searchLocalCatalog({ country: X })` was run at runtime for a sample of the newly-covered countries (Algeria, Libya, Mauritania, Sudan, Kuwait, Oman, Qatar) and confirmed to return the expected dish counts; an invalid country code was confirmed to correctly return zero results.
- `verifyNutritionAgainstUSDA()`'s no-API-key fallback path was run at runtime and confirmed to return `skipped-no-api-key` without throwing.
- The live USDA API call path was **not** runtime-tested — see "What has and hasn't been tested" above.

## Feedback and corrections

If you're a native speaker or someone with real culinary knowledge of any covered region and notice something inaccurate in the dish descriptions, nutrition estimates, or country attributions, corrections are genuinely welcome.
