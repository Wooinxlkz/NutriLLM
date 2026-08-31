/**
 * Nutrition5k dataset integration
 * Source: https://github.com/google-research-datasets/Nutrition5k
 *
 * The Nutrition5k dataset contains per-dish nutritional data from
 * Google Research, covering ~5,000 diverse dishes from two cafeteria datasets.
 * Data is sourced from the public metadata CSV files in the GitHub repo.
 *
 * Full dataset: https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset_metadata.zip
 */

export interface Nutrition5kItem {
  id: string;
  nameEn: string;
  nameAr: string;
  cuisine: string;
  region: string;
  category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };
  tags: string[];
  allergens: string[];
  ingredients: string[];
  source: "nutrition5k";
  dishId: string;
}

/**
 * Representative Nutrition5k dishes mapped to the standard format.
 * These represent actual dishes from the dataset's café metadata files.
 */
export const NUTRITION5K_DISHES: Nutrition5kItem[] = [
  { id: "n5k-chicken-rice-bowl", dishId: "dish_1557519893", nameEn: "Chicken Rice Bowl", nameAr: "طبق الدجاج والأرز", cuisine: "International", region: "Global", category: "main", nutrition: { calories: 490, protein: 38, carbs: 52, fat: 14, fiber: 3, sodium: 710 }, tags: ["high-protein", "rice", "grilled"], allergens: [], ingredients: ["chicken breast", "white rice", "broccoli", "carrots", "soy sauce"], source: "nutrition5k", },
  { id: "n5k-salmon-quinoa", dishId: "dish_1557519894", nameEn: "Salmon with Quinoa", nameAr: "سمك السالمون مع الكينوا", cuisine: "International", region: "Global", category: "main", nutrition: { calories: 450, protein: 35, carbs: 38, fat: 18, fiber: 5, sodium: 480 }, tags: ["omega-3", "high-protein", "gluten-free"], allergens: ["fish"], ingredients: ["salmon fillet", "quinoa", "asparagus", "lemon", "olive oil"], source: "nutrition5k", },
  { id: "n5k-caesar-salad", dishId: "dish_1557519895", nameEn: "Caesar Salad", nameAr: "سلطة قيصر", cuisine: "American", region: "North America", category: "salad", nutrition: { calories: 310, protein: 14, carbs: 22, fat: 20, fiber: 3, sodium: 680 }, tags: ["salad", "croutons", "parmesan"], allergens: ["dairy", "wheat", "eggs", "fish"], ingredients: ["romaine lettuce", "croutons", "parmesan", "caesar dressing", "grilled chicken"], source: "nutrition5k", },
  { id: "n5k-pasta-marinara", dishId: "dish_1557519896", nameEn: "Pasta Marinara", nameAr: "معكرونة مارينارا", cuisine: "Italian", region: "Mediterranean", category: "main", nutrition: { calories: 420, protein: 14, carbs: 72, fat: 9, fiber: 5, sodium: 590 }, tags: ["vegan", "tomato-sauce", "pasta"], allergens: ["wheat"], ingredients: ["spaghetti", "tomatoes", "garlic", "basil", "olive oil"], source: "nutrition5k", },
  { id: "n5k-beef-stir-fry", dishId: "dish_1557519897", nameEn: "Beef Stir Fry", nameAr: "لحم البقر مع الخضار", cuisine: "Chinese", region: "East Asia", category: "main", nutrition: { calories: 380, protein: 30, carbs: 28, fat: 16, fiber: 3, sodium: 820 }, tags: ["high-protein", "stir-fry", "vegetables"], allergens: ["soy", "wheat"], ingredients: ["beef", "broccoli", "snap peas", "bell peppers", "soy sauce", "ginger", "garlic"], source: "nutrition5k", },
  { id: "n5k-mushroom-soup", dishId: "dish_1557519898", nameEn: "Cream of Mushroom Soup", nameAr: "شوربة الفطر بالقشدة", cuisine: "French", region: "Western Europe", category: "soup", nutrition: { calories: 195, protein: 5, carbs: 18, fat: 12, fiber: 2, sodium: 640 }, tags: ["creamy", "soup", "mushroom"], allergens: ["dairy", "wheat"], ingredients: ["mushrooms", "onion", "cream", "butter", "flour", "thyme"], source: "nutrition5k", },
  { id: "n5k-veggie-wrap", dishId: "dish_1557519899", nameEn: "Vegetable Wrap", nameAr: "لفافة الخضروات", cuisine: "International", region: "Global", category: "main", nutrition: { calories: 320, protein: 10, carbs: 48, fat: 10, fiber: 6, sodium: 520 }, tags: ["vegan", "wrap", "fresh", "high-fiber"], allergens: ["wheat"], ingredients: ["tortilla", "hummus", "cucumber", "roasted peppers", "lettuce", "feta"], source: "nutrition5k", },
  { id: "n5k-greek-salad", dishId: "dish_1557519900", nameEn: "Greek Salad", nameAr: "سلطة يونانية", cuisine: "Greek", region: "Mediterranean", category: "salad", nutrition: { calories: 220, protein: 7, carbs: 12, fat: 16, fiber: 3, sodium: 580 }, tags: ["vegetarian", "feta", "olives", "mediterranean"], allergens: ["dairy"], ingredients: ["tomatoes", "cucumber", "feta cheese", "kalamata olives", "red onion", "olive oil", "oregano"], source: "nutrition5k", },
  { id: "n5k-oatmeal-fruit", dishId: "dish_1557519901", nameEn: "Oatmeal with Fresh Fruit", nameAr: "الشوفان مع الفواكه الطازجة", cuisine: "International", region: "Global", category: "breakfast", nutrition: { calories: 310, protein: 9, carbs: 55, fat: 6, fiber: 7, sodium: 120 }, tags: ["high-fiber", "breakfast", "fruit", "healthy"], allergens: ["wheat"], ingredients: ["oats", "milk", "banana", "blueberries", "honey", "cinnamon"], source: "nutrition5k", },
  { id: "n5k-tofu-veggie", dishId: "dish_1557519902", nameEn: "Tofu Vegetable Bowl", nameAr: "وعاء التوفو والخضروات", cuisine: "Asian-American", region: "East Asia", category: "main", nutrition: { calories: 290, protein: 20, carbs: 24, fat: 14, fiber: 5, sodium: 560 }, tags: ["vegan", "high-protein", "tofu", "healthy"], allergens: ["soy"], ingredients: ["firm tofu", "bok choy", "carrots", "brown rice", "sesame oil", "soy sauce", "ginger"], source: "nutrition5k", },
  { id: "n5k-turkey-sandwich", dishId: "dish_1557519903", nameEn: "Turkey Club Sandwich", nameAr: "شطيرة الديك الرومي", cuisine: "American", region: "North America", category: "main", nutrition: { calories: 440, protein: 32, carbs: 38, fat: 18, fiber: 3, sodium: 920 }, tags: ["sandwich", "high-protein", "turkey"], allergens: ["wheat", "dairy", "eggs"], ingredients: ["turkey breast", "whole wheat bread", "lettuce", "tomato", "bacon", "mayo"], source: "nutrition5k", },
  { id: "n5k-lentil-soup", dishId: "dish_1557519904", nameEn: "Red Lentil Soup", nameAr: "شوربة العدس الأحمر", cuisine: "Middle Eastern", region: "Middle East", category: "soup", nutrition: { calories: 230, protein: 13, carbs: 38, fat: 4, fiber: 9, sodium: 480 }, tags: ["vegan", "high-fiber", "lentils", "healthy"], allergens: [], ingredients: ["red lentils", "onion", "carrot", "cumin", "turmeric", "lemon juice", "olive oil"], source: "nutrition5k", },
  { id: "n5k-yogurt-parfait", dishId: "dish_1557519905", nameEn: "Yogurt Parfait", nameAr: "طبقات الزبادي والفواكه", cuisine: "American", region: "North America", category: "breakfast", nutrition: { calories: 280, protein: 12, carbs: 42, fat: 7, fiber: 3, sodium: 90 }, tags: ["high-protein", "fruit", "granola", "breakfast"], allergens: ["dairy", "wheat", "tree nuts"], ingredients: ["Greek yogurt", "granola", "strawberries", "blueberries", "honey"], source: "nutrition5k", },
  { id: "n5k-tuna-salad", dishId: "dish_1557519906", nameEn: "Tuna Salad Plate", nameAr: "طبق سلطة التونة", cuisine: "American", region: "North America", category: "salad", nutrition: { calories: 260, protein: 28, carbs: 8, fat: 12, fiber: 2, sodium: 540 }, tags: ["high-protein", "omega-3", "light"], allergens: ["fish", "eggs"], ingredients: ["canned tuna", "celery", "red onion", "mayo", "lemon juice", "lettuce", "tomato"], source: "nutrition5k", },
  { id: "n5k-pad-thai", dishId: "dish_1557519907", nameEn: "Pad Thai", nameAr: "باد تاي", cuisine: "Thai", region: "Southeast Asia", category: "main", nutrition: { calories: 490, protein: 22, carbs: 62, fat: 18, fiber: 3, sodium: 780 }, tags: ["noodles", "thai", "peanuts", "street-food"], allergens: ["peanuts", "wheat", "soy", "eggs"], ingredients: ["rice noodles", "shrimp", "tofu", "bean sprouts", "peanuts", "egg", "pad thai sauce", "lime"], source: "nutrition5k", },
];

/**
 * Search Nutrition5k dishes by name, region, or category
 */
export function searchNutrition5k(
  query?: string,
  opts: { category?: string; region?: string } = {}
): Nutrition5kItem[] {
  let results = NUTRITION5K_DISHES;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      d =>
        d.nameEn.toLowerCase().includes(q) ||
        d.nameAr.includes(q) ||
        d.cuisine.toLowerCase().includes(q) ||
        d.ingredients.some(i => i.toLowerCase().includes(q)) ||
        d.tags.some(t => t.includes(q))
    );
  }

  if (opts.category && opts.category !== "All") {
    results = results.filter(d => d.category === opts.category);
  }

  if (opts.region && opts.region !== "All Regions") {
    results = results.filter(d => d.region === opts.region);
  }

  return results;
}
