# Changelog

## [Unreleased] — Country taxonomy, real Algerian dishes, USDA verification engine

### Added
- `lib/food-data/src/country-taxonomy.ts` — `MENA_REGIONS`, `COUNTRY_NAMES`, `VALID_COUNTRY_CODES`, and helper functions (`countryName`, `regionForCountry`) for country-level food attribution, on top of the existing free-text `region`/`cuisine` fields.
- Optional `country` field on `StaticFoodItem`. Tagged 36 of 56 pre-existing MENA entries programmatically via a clean cuisine→country mapping; 20 genuinely cross-border/ambiguous entries left untagged rather than guessed (see NOTICE.md).
- `country` filter added to `SearchOptions`/`searchLocalCatalog`.
- **8 new Algerian dishes** in `mena-foods.ts`: Chorba Frik, Algerian Couscous, Rechta, Mhadjeb, Chakhchoukha, Bourek, Dolma in White Sauce, Zlabia. This closed the most visible gap — the MENA library previously had Moroccan, Egyptian, and Tunisian dishes under "North Africa" but zero Algerian ones.
- **32 more dishes added in a second round**, after an explicit country-by-country audit found 6 countries still at zero (Libya, Mauritania, Sudan, Kuwait, Oman, Qatar) and 8 more with only 1-2 entries. Every country in the taxonomy now has real coverage — see NOTICE.md "Second round" for the full per-country breakdown and sourcing. Total MENA library: 96 dishes (up from the original 56).
- A duplicate-ID bug (a new "Kibbeh" entry colliding with a pre-existing untagged one) was found by an automated re-audit after the batch insertion and fixed — see NOTICE.md for detail. This is also why the verification section below explicitly re-ran duplicate/consistency checks after the second round, not just after the first.
- `lib/food-data/src/usda-verify.ts` — optional, non-blocking sanity check that cross-references AI-generated nutrition estimates (for dishes not in the local library) against USDA FoodData Central, comparing macronutrient ratios with a documented tolerance. Requires `USDA_API_KEY`; gracefully skips if unset or on any request failure.
- `nutritionVerification` field added to the `/api/nutrition/analyze` response; corresponding UI badge added in `artifacts/nutri-llm/src/pages/analyze.tsx`.
- `LICENSE` file (MIT) — was referenced by the README badge and license section but did not exist in the repository.
- `NOTICE.md` — full methodology and limitations for everything in this round.

### Changed
- 13 new country entries added to `DRINK_PAIRINGS` in `artifacts/api-server/src/routes/nutrition.ts` (algerian, tunisian, syrian, jordanian, palestinian, iraqi, yemeni, emirati, bahraini, qatari, kuwaiti, omani), plus a fix to the matching logic itself — the previous substring-only matching meant several existing cuisines (Syrian, Jordanian, Palestinian, Emirati, Bahraini) never matched anything and silently fell through to the generic default, independent of the Algeria gap.
- `confidence` in the analyze response changed from a hardcoded constant (`0.92`, always) to a value derived from the actual USDA verification outcome (0.9 verified / 0.55 deviation-flagged / 0.75 no-match, skipped, or error).
- README: corrected stale dish counts ("57 hand-curated dishes" → 64; "47 global dishes" → 97, the actual `world-foods.ts` count), added country-taxonomy and USDA verification documentation, added `USDA_API_KEY` to the environment variables section, added a Notice & Limitations section, updated the roadmap.

### Fixed
- **Pre-existing TypeScript type error** in `nutrition.ts` (`Property 'description' does not exist on type 'AnyFoodItem'`) — confirmed via `git stash` to predate this round of changes; not introduced by it, but fixed here since it was found during typecheck verification. Root cause: `artifacts/api-server` isn't wired into the repo's composite `tsc --build` project, so the top-level `pnpm run typecheck:libs` script doesn't catch errors in it.
- The frontend `confidence` field existed in the `AnalysisResult` type but was never rendered anywhere in the UI — now surfaced alongside the new verification badge.

### Notes
- All three affected TypeScript packages (`lib/food-data`, `artifacts/api-server`, `artifacts/nutri-llm`) verified to compile cleanly after every change, not just at the end.
- The new Algerian dish data, the country taxonomy, and the `searchLocalCatalog` country filter were all runtime-tested (not just typechecked) — see NOTICE.md "Verification performed."
- The USDA verification module's live API call path could not be runtime-tested in the development environment used (network access to `api.nal.usda.gov` was blocked — confirmed via explicit deny reason, not just a timeout). The no-API-key fallback path was tested and confirmed working. Test the live path with a real `USDA_API_KEY` before relying on it in production.
