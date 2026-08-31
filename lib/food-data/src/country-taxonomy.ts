/**
 * Country-level taxonomy for the MENA food library.
 *
 * `region` and `cuisine` on each StaticFoodItem are historically free-text
 * and useful for display/search, but don't support real country-level
 * queries ("show me Algerian dishes specifically" vs "show me North African
 * dishes broadly"). This file adds that layer without replacing the
 * existing fields.
 *
 * MENA_REGIONS maps a broader culinary region to the countries commonly
 * associated with it — this is the reference taxonomy for the optional
 * `country` field on StaticFoodItem. A country appearing here does NOT mean
 * every dish in that region has been tagged to a specific country yet —
 * see each entry's `country` field: `undefined` honestly means "this dish's
 * regional/cross-border attribution wasn't specific enough to tag to one
 * country" (e.g. hummus, falafel — claimed by multiple Levant countries)
 * rather than implying false precision.
 */

export const MENA_REGIONS: Record<string, string[]> = {
  Maghreb: ["dz", "tn", "ly", "ma", "mr"], // Algeria, Tunisia, Libya, Morocco, Mauritania
  "Nile Valley": ["eg", "sd"], // Egypt, Sudan
  Levant: ["sy", "lb", "jo", "ps"], // Syria, Lebanon, Jordan, Palestine
  "Arabian Peninsula": ["sa", "ae", "kw", "bh", "om", "qa", "ye"], // Saudi, UAE, Kuwait, Bahrain, Oman, Qatar, Yemen
  Iran: ["ir"],
  Turkey: ["tr"],
};

export const COUNTRY_NAMES: Record<string, string> = {
  dz: "Algeria",
  tn: "Tunisia",
  ly: "Libya",
  ma: "Morocco",
  mr: "Mauritania",
  eg: "Egypt",
  sd: "Sudan",
  sy: "Syria",
  lb: "Lebanon",
  jo: "Jordan",
  ps: "Palestine",
  sa: "Saudi Arabia",
  ae: "UAE",
  kw: "Kuwait",
  bh: "Bahrain",
  om: "Oman",
  qa: "Qatar",
  ye: "Yemen",
  ir: "Iran",
  tr: "Turkey",
};

/** All valid country codes, derived from MENA_REGIONS — used for data validation. */
export const VALID_COUNTRY_CODES: Set<string> = new Set(Object.values(MENA_REGIONS).flat());

export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return COUNTRY_NAMES[code];
}

export function regionForCountry(code: string): string | undefined {
  for (const [region, countries] of Object.entries(MENA_REGIONS)) {
    if (countries.includes(code)) return region;
  }
  return undefined;
}
