/**
 * Curated food images — ALL from Wikimedia Commons, verified 200 OK.
 * Uses Special:FilePath stable redirect so browsers always get the correct CDN URL.
 * Foods without a verified matching image are simply omitted → emoji category fallback shown.
 * DO NOT add an entry unless it has been manually verified to show the correct food.
 */

function wc(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
}

export const FOOD_IMAGES: Record<string, string> = {
  // ── Levant ──────────────────────────────────────────────────────────────────
  "sl-hummus":            wc("Hummus_from_The_Nile.jpg"),
  "sl-falafel":           wc("Falafel_balls.jpg"),
  "sl-shawarma-chicken":  wc("Shawarma.jpg"),
  "sl-tabbouleh":         wc("Tabbouleh.jpg"),
  "sl-fattoush":          wc("Fattoush.jpg"),
  "sl-kibbeh":            wc("Kibbeh.jpg"),
  "sl-mansaf":            wc("Mansaf.jpg"),
  "sl-mujaddara":         wc("Mujaddara.jpg"),
  "sl-baba-ghanoush":     wc("Baba_Ghanoush.jpg"),
  "sl-knafeh":            wc("Knafeh.jpg"),
  "sl-makloubeh":         wc("Maqluba.jpg"),

  // ── North Africa ─────────────────────────────────────────────────────────────
  "na-tagine-chicken":    wc("Moroccan_tagine.jpg"),
  "na-couscous":          wc("Moroccan_Couscous_1.jpg"),
  "na-bastilla":          wc("Pastilla.jpg"),
  "na-shakshuka":         wc("Shakshuka.jpg"),
  "na-koshari":           wc("Koshary.jpg"),
  "na-ful-medames":       wc("Ful_medames.jpg"),
  "na-mahshi":            wc("Mahshi.jpg"),
  "na-brik":              wc("Brik.jpg"),
  "na-lablabi":           wc("Lablabi.jpg"),

  // ── Arabian Peninsula ────────────────────────────────────────────────────────
  "ap-kabsa":             wc("Kabsa.jpg"),
  "ap-mandi":             wc("Mandi.jpg"),

  // ── Persia / Iran ─────────────────────────────────────────────────────────────
  "prs-ghormeh-sabzi":    wc("Ghormeh_sabzi.jpg"),
  "prs-zereshk-polo":     wc("Zereshk_polo.jpg"),

  // ── Turkey ───────────────────────────────────────────────────────────────────
  "tr-doner-kebab":       wc("Döner_kebab.jpg"),
  "tr-baklava":           wc("Baklava.jpg"),
  "tr-iskender":          wc("Iskender_kebap.jpg"),
  "tr-manti":             wc("Mantı.jpg"),
  "tr-simit":             wc("Simit.jpg"),

  // ── Shared / cross-region ────────────────────────────────────────────────────
  "sh-samosa":            wc("Samosa.jpg"),
  "sh-luqaimat":          wc("Luqaimat.jpg"),
  "sh-muhammara":         wc("Muhammara.jpg"),
  "sh-qatayef":           wc("Qatayef.jpg"),
  "sh-ayran":             wc("Ayran.jpg"),

  // ── Desserts ─────────────────────────────────────────────────────────────────
  "sw-umm-ali":           wc("Om_ali.jpg"),
  "sw-halwa":             wc("Halva.jpg"),
  "sw-basbousa":          wc("Basboosa.jpg"),

  // ── Beverages ────────────────────────────────────────────────────────────────
  "bv-qahwa":             wc("Arabic_coffee_2.jpg"),
  "bv-jallab":            wc("Jallab.jpg"),
  "bv-karkade":           wc("Hibiscus_tea.jpg"),

  // ── Nutrition5k global dishes ────────────────────────────────────────────────
  "n5k-chicken-rice-bowl": wc("Hainanese_chicken_rice.jpg"),
  "n5k-salmon-quinoa":     wc("Grilled_salmon.jpg"),
  "n5k-caesar-salad":      wc("Caesar_salad.jpg"),
  "n5k-pasta-marinara":    wc("Pasta_al_pomodoro.jpg"),
  "n5k-mushroom-soup":     wc("Cream_of_mushroom_soup.jpg"),
  "n5k-greek-salad":       wc("Greek_salad.jpg"),
  "n5k-oatmeal-fruit":     wc("Oatmeal.jpg"),
  "n5k-lentil-soup":       wc("Red_lentil_soup.jpg"),
  "n5k-pad-thai":          wc("Pad_thai.jpg"),

  // ── Germany (additional) ─────────────────────────────────────────────────────
  "de-bratwurst":          wc("Paar_Bratwuerste.jpg"),
  "de-pretzel":            wc("Pretzel_from_wikipedia.jpg"),
  "de-apple-strudel":      wc("Apfelstrudel_-_stoeffel.jpg"),

  // ── United Kingdom ───────────────────────────────────────────────────────────
  "uk-fish-chips":         wc("Fish_and_chips_blackpool.jpg"),
  "uk-full-english":       wc("Full_English_breakfast.jpg"),
  "uk-shepherds-pie":      wc("Shepherd's_pie.jpg"),
  "uk-sticky-toffee":      wc("Sticky_toffee_pudding.jpg"),

  // ── Spain (additional) ───────────────────────────────────────────────────────
  "es-gazpacho":           wc("Gazpacho.jpg"),
  "es-tortilla":           wc("Spanish_omelette.jpg"),
  "es-churros":            wc("Churros_con_chocolate.jpg"),
  "es-patatas-bravas":     wc("Patatas_bravas.jpg"),

  // ── France (additional) ──────────────────────────────────────────────────────
  "fr-boeuf-bourguignon":  wc("Boeuf_bourguignon.jpg"),
  "fr-french-onion-soup":  wc("Soupe_a_l'oignon.jpg"),
  "fr-crepes":             wc("Crepeau_chocolat.jpg"),
  "fr-ratatouille":        wc("Ratatouille.jpg"),

  // ── Portugal ─────────────────────────────────────────────────────────────────
  "pt-pastel-de-nata":     wc("Lisbon_May_2015-10a.jpg"),
  "pt-bacalhau":           wc("Bacalhau_à_Brás.jpg"),

  // ── Scandinavia ──────────────────────────────────────────────────────────────
  "se-kottbullar":         wc("Swedish_meatballs.jpg"),
  "se-gravlax":            wc("Gravlax.jpg"),

  // ── Poland / Eastern Europe ──────────────────────────────────────────────────
  "pl-pierogi":            wc("Pierogi_z_miesem.jpg"),

  // ── Russia ───────────────────────────────────────────────────────────────────
  "ru-borscht":            wc("Borscht_(beet_soup).jpg"),
  "ru-beef-stroganoff":    wc("Beef_stroganoff.jpg"),
  "ru-pelmeni":            wc("Пельмени.jpg"),

  // ── Argentina ────────────────────────────────────────────────────────────────
  "ar-empanadas":          wc("Argentinian_empanadas.jpg"),
  "ar-asado":              wc("Asado_en_Argentina.jpg"),

  // ── Caribbean ────────────────────────────────────────────────────────────────
  "jm-jerk-chicken":       wc("Jerk_chicken.jpg"),
  "tt-doubles":            wc("Doubles_channa_Trinidad.jpg"),

  // ── Philippines ──────────────────────────────────────────────────────────────
  "ph-adobo":              wc("Adobo_-_Filipino_chicken_adobo.jpg"),
  "ph-sinigang":           wc("Sinigang_na_hipon.jpg"),
  "ph-lechon":             wc("Lechon_de_leche.jpg"),

  // ── Malaysia / Singapore ─────────────────────────────────────────────────────
  "my-laksa":              wc("Laksa.jpg"),
  "my-nasi-lemak":         wc("Nasi_Lemak_with_Mutton_Rendang.jpg"),
  "sg-char-kway-teow":     wc("Char_Kway_Teow.jpg"),

  // ── Japan (additional) ───────────────────────────────────────────────────────
  "jp-yakitori":           wc("Yakitori_by_jetalone.jpg"),
  "jp-okonomiyaki":        wc("Okonomiyaki_Osaka_style.jpg"),
  "jp-onigiri":            wc("Onigiri_2014.jpg"),

  // ── China (additional) ───────────────────────────────────────────────────────
  "cn-xiao-long-bao":      wc("Xiao_long_bao_by_llee_wu.jpg"),
  "cn-fried-rice":         wc("Yangzhou_fried_rice.jpg"),

  // ── Korea (additional) ───────────────────────────────────────────────────────
  "kr-korean-fried-chicken": wc("Korean_fried_chicken_(7364011626).jpg"),

  // ── Thailand (additional) ────────────────────────────────────────────────────
  "th-mango-sticky-rice":  wc("Mango_and_Sticky_Rice.jpg"),
  "th-pad-see-ew":         wc("Pad_see_ew.jpg"),

  // ── Vietnam (additional) ─────────────────────────────────────────────────────
  "vn-goi-cuon":           wc("Cha_Gio_and_Goi_Cuon.jpg"),

  // ── India (additional) ───────────────────────────────────────────────────────
  "in-tandoori-chicken":   wc("Tandoori_chicken.jpg"),
  "in-naan":               wc("Naan_on_stone.jpg"),

  // ── USA (additional) ─────────────────────────────────────────────────────────
  "us-cheeseburger":       wc("Cheeseburger.jpg"),
  "us-mac-cheese":         wc("Macaroni_and_cheese.jpg"),

  // ── Brazil (additional) ──────────────────────────────────────────────────────
  "br-churrasco":          wc("Churrasco_brasileiro.jpg"),
  "br-brigadeiro":         wc("Brigadeiro.jpg"),

  // ── Mexico (additional) ──────────────────────────────────────────────────────
  "mx-pozole":             wc("Pozole_Rojo.jpg"),
  "mx-enchiladas":         wc("Enchiladas_suizas.jpg"),
};

export function getFoodImage(id: string): string | undefined {
  return FOOD_IMAGES[id];
}
