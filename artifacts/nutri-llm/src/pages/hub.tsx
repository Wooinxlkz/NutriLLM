import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import {
  BarChart3, Wand2, BookOpen, Package, CalendarDays,
  Dna, Columns3, Trophy, Sliders, ChefHat, Globe2,
  Flame, Star, Plus, X, Trash2, Lock, Unlock, RotateCcw,
  Shuffle, Utensils, Clock, Users, Check, AlertTriangle,
} from "lucide-react";
import { loadCookbook, addToCookbook, removeFromCookbook, updateSavedRecipe, type SavedRecipe } from "../lib/cookbook";
import { loadPantry, savePantry, togglePantryItem, COMMON_PANTRY } from "../lib/pantry";
import { loadPlan, addToPlan, removeFromPlan, clearPlan, WEEK_DAYS, type WeekDay, type WeekPlan } from "../lib/mealPlan";
import { loadCookLog, addCookLogEntry, computeStreak, todayTotals, dayKey, type CookLogEntry } from "../lib/cookLog";
import { loadAllergens, toggleAllergen, scanForAllergens, COMMON_ALLERGENS } from "../lib/allergens";

const CUISINES = [
  "Lebanese", "Palestinian", "Jordanian", "Saudi Arabian", "Egyptian", "Moroccan",
  "Emirati", "Yemeni", "Syrian", "Iraqi", "Tunisian", "Algerian", "Iranian",
  "Turkish", "Italian", "Japanese", "Mexican", "Indian", "French", "Thai",
  "Chinese", "American", "Mediterranean", "Korean", "Vietnamese", "Greek",
  "Spanish", "Ethiopian", "Brazilian", "Peruvian", "Filipino", "Indonesian",
  "West African", "Argentine", "Pakistani",
];

const MEAL_TYPES = ["starter", "soup", "main", "dessert"];
const DIETARY = ["vegan", "vegetarian", "gluten-free", "keto", "paleo", "dairy-free", "halal", "nut-free"];

type Section = "dashboard" | "generator" | "cookbook" | "pantry" | "planner" | "analytics" | "dna" | "milestones" | "algorithm";

const NAV: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "cookbook", label: "Cookbook", icon: BookOpen },
  { id: "pantry", label: "Pantry", icon: Package },
  { id: "planner", label: "Planner", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: Flame },
  { id: "dna", label: "Recipe DNA", icon: Dna },
  { id: "milestones", label: "Milestones", icon: Trophy },
  { id: "algorithm", label: "Algorithm", icon: Sliders },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function Hub() {
  const [section, setSection] = useState<Section>("dashboard");

  return (
    <Layout>
      {/* Mobile: horizontal scrollable tab bar */}
      <div className="sm:hidden border-b border-border/40 bg-card/30 overflow-x-auto">
        <div className="flex gap-0 px-1 py-1 min-w-max">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                section === id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px-49px)] sm:h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden sm:flex w-52 border-r border-border/50 bg-card/30 flex-col py-4 overflow-y-auto shrink-0">
          <div className="px-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Hub</p>
          </div>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full text-left ${
                section === id
                  ? "text-primary bg-primary/10 border-r-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "generator" && <GeneratorSection />}
          {section === "cookbook" && <CookbookSection />}
          {section === "pantry" && <PantrySection />}
          {section === "planner" && <PlannerSection />}
          {section === "analytics" && <AnalyticsSection />}
          {section === "dna" && <DNASection />}
          {section === "milestones" && <MilestonesSection />}
          {section === "algorithm" && <AlgorithmSection />}
        </main>
      </div>
    </Layout>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardSection() {
  const log = loadCookLog();
  const cookbook = loadCookbook();
  const streak = computeStreak(log);
  const today = todayTotals(log);
  const uniqueCuisines = new Set(cookbook.map(r => r.cuisine1).filter(Boolean)).size;

  const macroAvg = useMemo(() => {
    if (!log.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const totals = log.reduce((a, e) => ({
      calories: a.calories + (e.nutrition?.calories ?? 0),
      protein: a.protein + (e.nutrition?.protein ?? 0),
      carbs: a.carbs + (e.nutrition?.carbs ?? 0),
      fat: a.fat + (e.nutrition?.fat ?? 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return {
      calories: Math.round(totals.calories / log.length),
      protein: Math.round(totals.protein / log.length),
      carbs: Math.round(totals.carbs / log.length),
      fat: Math.round(totals.fat / log.length),
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your global food intelligence hub</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Cook Streak", value: `${streak}d`, icon: Flame, color: "text-orange-500" },
          { label: "Saved Recipes", value: cookbook.length, icon: BookOpen, color: "text-primary" },
          { label: "Meals Logged", value: log.length, icon: ChefHat, color: "text-green-500" },
          { label: "Cuisines", value: uniqueCuisines, icon: Globe2, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-card p-4">
            <Icon className={`h-5 w-5 mb-2 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Today's macros */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" /> Today's Nutrition
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Calories", value: today.calories, unit: "kcal", max: 2000, color: "bg-orange-500" },
            { label: "Protein", value: today.protein, unit: "g", max: 150, color: "bg-blue-500" },
            { label: "Carbs", value: today.carbs, unit: "g", max: 250, color: "bg-yellow-500" },
            { label: "Fat", value: today.fat, unit: "g", max: 80, color: "bg-red-500" },
          ].map(({ label, value, unit, max, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}{unit}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {log.length === 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">Generate and log recipes to see your daily nutrition</p>
        )}
      </div>

      {/* Average macros from cookbook */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Average Recipe Macros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Calories", value: macroAvg.calories, unit: "kcal", max: 800, color: "bg-primary" },
            { label: "Protein", value: macroAvg.protein, unit: "g", max: 50, color: "bg-blue-500" },
            { label: "Carbs", value: macroAvg.carbs, unit: "g", max: 100, color: "bg-yellow-500" },
            { label: "Fat", value: macroAvg.fat, unit: "g", max: 40, color: "bg-red-500" },
          ].map(({ label, value, unit, max, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}{unit}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {log.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">Based on logged meals — generate recipes to populate this</p>
        )}
      </div>
    </div>
  );
}

// ─── GENERATOR ────────────────────────────────────────────────────────────────
function GeneratorSection() {
  const [cuisine1, setCuisine1] = useState(CUISINES[0]);
  const [cuisine2, setCuisine2] = useState(CUISINES[1]);
  const [mealType, setMealType] = useState("main");
  const [servings, setServings] = useState(2);
  const [dietary, setDietary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [saved, setSaved] = useState(false);
  const [loggedMsg, setLoggedMsg] = useState(false);

  function shuffle() {
    const a = pick(CUISINES);
    let b = pick(CUISINES);
    while (b === a) b = pick(CUISINES);
    setCuisine1(a);
    setCuisine2(b);
  }

  function toggleDiet(d: string) {
    setDietary(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function generate() {
    setLoading(true);
    setRecipe(null);
    setSaved(false);
    try {
      const resp = await fetch("/api/nutrition/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuisine1, cuisine2, mealType, dietary, servings }),
      });
      const data = await resp.json();
      setRecipe(data);
    } catch {
      alert("Generation failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveRecipe() {
    if (!recipe) return;
    addToCookbook(recipe);
    setSaved(true);
  }

  function logMeal() {
    if (!recipe) return;
    addCookLogEntry({ id: recipe.id, name: recipe.name, servings: recipe.servings, nutritionInfo: recipe.nutritionInfo });
    setLoggedMsg(true);
    setTimeout(() => setLoggedMsg(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recipe Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered fusion recipe from any two world cuisines</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
        {/* Cuisine Shuffle */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Cuisine 1</label>
            <select value={cuisine1} onChange={e => setCuisine1(e.target.value)} className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm">
              {CUISINES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={shuffle} className="mt-5 p-2 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors">
            <Shuffle className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Cuisine 2 (fusion)</label>
            <select value={cuisine2} onChange={e => setCuisine2(e.target.value)} className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm">
              {CUISINES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Meal type + servings */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Meal Type</label>
            <div className="flex gap-2 flex-wrap">
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setMealType(m)} className={`px-3 py-1 rounded-full text-xs capitalize border transition-colors ${mealType === m ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="w-28">
            <label className="text-xs text-muted-foreground mb-1 block">Servings</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-7 h-7 rounded border border-border/50 flex items-center justify-center text-sm hover:bg-muted/40">-</button>
              <span className="text-sm font-medium w-4 text-center">{servings}</span>
              <button onClick={() => setServings(Math.min(12, servings + 1))} className="w-7 h-7 rounded border border-border/50 flex items-center justify-center text-sm hover:bg-muted/40">+</button>
            </div>
          </div>
        </div>

        {/* Dietary */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Dietary Restrictions</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map(d => (
              <button key={d} onClick={() => toggleDiet(d)} className={`px-3 py-1 rounded-full text-xs capitalize border transition-colors ${dietary.includes(d) ? "bg-green-600 text-white border-green-600" : "border-border/50 hover:border-green-400"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-colors">
          <Wand2 className="h-4 w-4" />
          {loading ? "Generating fusion recipe..." : `Generate ${cuisine1}${cuisine2 !== cuisine1 ? " × " + cuisine2 : ""} ${mealType}`}
        </button>
      </div>

      {/* Recipe Result */}
      {recipe && (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{recipe.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{recipe.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={saveRecipe} disabled={saved} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${saved ? "bg-green-600 text-white border-green-600" : "border-border/50 hover:border-primary/50"}`}>
                {saved ? "✓ Saved" : "Save"}
              </button>
              <button onClick={logMeal} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 hover:border-primary/50 transition-colors">
                {loggedMsg ? "✓ Logged!" : "Log Meal"}
              </button>
            </div>
          </div>

          {recipe.culturalStory && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{recipe.culturalStory}</p>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {recipe.cookTime && <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted/50 border border-border/30"><Clock className="h-3 w-3" />{recipe.cookTime}min</span>}
            {recipe.servings && <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted/50 border border-border/30"><Users className="h-3 w-3" />{recipe.servings} servings</span>}
            {recipe.difficulty && <span className="text-xs px-2 py-1 rounded-full bg-muted/50 border border-border/30 capitalize">{recipe.difficulty}</span>}
            {(recipe.dietaryTags ?? []).map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 capitalize">{t}</span>
            ))}
          </div>

          {/* Nutrition */}
          {recipe.nutritionInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/20">
              {[
                { label: "Calories", value: recipe.nutritionInfo.calories, unit: "kcal" },
                { label: "Protein", value: recipe.nutritionInfo.protein, unit: "g" },
                { label: "Carbs", value: recipe.nutritionInfo.carbs, unit: "g" },
                { label: "Fat", value: recipe.nutritionInfo.fat, unit: "g" },
              ].map(({ label, value, unit }) => (
                <div key={label} className="text-center">
                  <div className="text-lg font-bold">{value}</div>
                  <div className="text-[10px] text-muted-foreground">{unit} {label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Ingredients</h3>
              <ul className="grid grid-cols-2 gap-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-1">
                    <span className="text-primary">·</span>
                    <span><strong>{ing.amount}</strong> {ing.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Instructions</h3>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Pro Tips */}
          {recipe.proTips && recipe.proTips.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Chef Tips</p>
              {recipe.proTips.map((tip, i) => <p key={i} className="text-xs text-amber-600 dark:text-amber-300">• {tip}</p>)}
            </div>
          )}

          {/* Pairing */}
          {recipe.pairingNotes && (
            <p className="text-xs text-muted-foreground border-t border-border/30 pt-3">🍷 <strong>Pairing:</strong> {recipe.pairingNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COOKBOOK ─────────────────────────────────────────────────────────────────
function CookbookSection() {
  const [cookbook, setCookbook] = useState<SavedRecipe[]>(() => loadCookbook());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorite" | "made" | "planned">("all");

  function remove(id: string) {
    setCookbook(removeFromCookbook(id));
  }

  function setFlair(id: string, flair: "favorite" | "made" | "planned") {
    const r = cookbook.find(c => c.id === id);
    if (!r) return;
    const next = r.flair === flair ? undefined : flair;
    setCookbook(updateSavedRecipe(id, { flair: next }));
  }

  function logFromCookbook(r: SavedRecipe) {
    addCookLogEntry({ id: r.id, name: r.name, servings: r.servings, nutritionInfo: r.nutritionInfo });
  }

  const filtered = filter === "all" ? cookbook : cookbook.filter(r => r.flair === filter);

  if (cookbook.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Your cookbook is empty</p>
        <p className="text-xs text-muted-foreground">Generate a recipe in the Generator and save it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cookbook</h1>
          <p className="text-muted-foreground text-sm mt-1">{cookbook.length} saved {cookbook.length === 1 ? "recipe" : "recipes"}</p>
        </div>
        <div className="flex gap-2">
          {(["all", "favorite", "made", "planned"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{r.name}</span>
                  {r.flair === "favorite" && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                  {r.flair === "made" && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                  {r.flair === "planned" && <CalendarDays className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.cuisine1 && <span className="text-xs text-muted-foreground">{r.cuisine1}{r.cuisine2 && r.cuisine2 !== r.cuisine1 ? ` × ${r.cuisine2}` : ""}</span>}
                  {r.nutritionInfo && <span className="text-xs text-muted-foreground">· {r.nutritionInfo.calories} kcal · {r.nutritionInfo.protein}g protein</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); setFlair(r.id, "favorite"); }} title="Favorite" className={`p-1.5 rounded hover:bg-muted/40 transition-colors ${r.flair === "favorite" ? "text-yellow-500" : "text-muted-foreground"}`}>
                  <Star className="h-3.5 w-3.5" />
                </button>
                <button onClick={e => { e.stopPropagation(); setFlair(r.id, "made"); }} title="Mark as made" className={`p-1.5 rounded hover:bg-muted/40 transition-colors ${r.flair === "made" ? "text-green-500" : "text-muted-foreground"}`}>
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={e => { e.stopPropagation(); logFromCookbook(r); }} title="Log meal" className="p-1.5 rounded hover:bg-muted/40 transition-colors text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />
                </button>
                <button onClick={e => { e.stopPropagation(); remove(r.id); }} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {expanded === r.id && (
              <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                {r.ingredients && r.ingredients.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Ingredients</p>
                    <ul className="grid grid-cols-2 gap-1">
                      {r.ingredients.map((ing, i) => (
                        <li key={i} className="text-xs text-muted-foreground">· <strong>{ing.amount}</strong> {ing.item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {r.instructions && r.instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Instructions</p>
                    <ol className="space-y-1">
                      {r.instructions.map((s, i) => <li key={i} className="text-xs text-muted-foreground">{i + 1}. {s}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PANTRY ───────────────────────────────────────────────────────────────────
function PantrySection() {
  const [items, setItems] = useState<string[]>(() => loadPantry());
  const [draft, setDraft] = useState("");
  const cookbook = loadCookbook();

  function add() {
    if (!draft.trim()) return;
    setItems(togglePantryItem(draft));
    setDraft("");
  }

  function toggle(item: string) {
    setItems(togglePantryItem(item));
  }

  const matches = useMemo(() => {
    if (!items.length || !cookbook.length) return [];
    return cookbook.filter(r => {
      const ings = (r.ingredients ?? []).map(i => i.item.toLowerCase());
      return items.filter(p => ings.some(i => i.includes(p.toLowerCase()))).length >= 2;
    });
  }, [items, cookbook]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pantry</h1>
        <p className="text-muted-foreground text-sm mt-1">Track what's in your kitchen · {items.length} items</p>
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add ingredient..."
          className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button onClick={add} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Common quick-add */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PANTRY.filter(p => !items.map(i => i.toLowerCase()).includes(p)).slice(0, 16).map(p => (
            <button key={p} onClick={() => setItems(togglePantryItem(p))} className="text-xs px-2.5 py-1 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* Current pantry */}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">In My Pantry</p>
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <button key={item} onClick={() => toggle(item)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-300 transition-colors">
                {item} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
          <button onClick={() => { savePantry([]); setItems([]); }} className="mt-2 text-xs text-muted-foreground hover:text-red-500 transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Recipe matches */}
      {matches.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 text-green-600 dark:text-green-400">✓ {matches.length} cookbook recipes match your pantry</p>
          <div className="space-y-2">
            {matches.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                <ChefHat className="h-4 w-4 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.nutritionInfo?.calories ?? "?"} kcal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PLANNER ──────────────────────────────────────────────────────────────────
function PlannerSection() {
  const [plan, setPlan] = useState<WeekPlan>(() => loadPlan());
  const cookbook = loadCookbook();
  const [adding, setAdding] = useState<WeekDay | null>(null);

  function addRecipe(day: WeekDay, r: SavedRecipe) {
    setPlan(addToPlan(day, { recipeId: r.id, recipeName: r.name }));
    setAdding(null);
  }

  function remove(day: WeekDay, i: number) {
    setPlan(removeFromPlan(day, i));
  }

  const plannedCalories = useMemo(() => {
    let total = 0;
    (Object.keys(plan) as WeekDay[]).forEach(d => {
      plan[d].forEach(slot => {
        const r = cookbook.find(c => c.id === slot.recipeId);
        total += r?.nutritionInfo?.calories ?? 0;
      });
    });
    return total;
  }, [plan, cookbook]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">{plannedCalories > 0 ? `${plannedCalories} total planned calories` : "Plan your meals for the week"}</p>
        </div>
        <button onClick={() => { setPlan(clearPlan()); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors border border-border/50 px-3 py-1.5 rounded-lg hover:border-red-300">
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEK_DAYS.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-border/50 bg-card p-3 min-h-[140px]">
            <p className="text-xs font-semibold text-center mb-2">{label}</p>
            <div className="space-y-1.5">
              {plan[key].map((slot, i) => (
                <div key={i} className="flex items-start gap-1 group">
                  <span className="text-[10px] text-muted-foreground flex-1 leading-tight">{slot.recipeName}</span>
                  <button onClick={() => remove(key, i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            {cookbook.length > 0 && (
              <button onClick={() => setAdding(adding === key ? null : key)} className="mt-2 w-full text-[10px] text-muted-foreground hover:text-primary flex items-center justify-center gap-0.5 transition-colors">
                <Plus className="h-3 w-3" /> Add
              </button>
            )}
            {adding === key && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {cookbook.map(r => (
                  <button key={r.id} onClick={() => addRecipe(key, r)} className="w-full text-[10px] text-left px-1.5 py-1 rounded hover:bg-primary/10 hover:text-primary transition-colors truncate">
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {cookbook.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">Save recipes to your Cookbook first to add them to the planner</p>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsSection() {
  const log = useMemo(() => loadCookLog(), []);
  const streak = computeStreak(log);

  const weeklyData = useMemo(() => {
    const days: { label: string; calories: number; protein: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d.getTime());
      const dayLogs = log.filter(e => dayKey(e.at) === key);
      days.push({
        label: d.toLocaleDateString("en", { weekday: "short" }),
        calories: dayLogs.reduce((s, e) => s + (e.nutrition?.calories ?? 0), 0),
        protein: dayLogs.reduce((s, e) => s + (e.nutrition?.protein ?? 0), 0),
      });
    }
    return days;
  }, [log]);

  const maxCal = Math.max(...weeklyData.map(d => d.calories), 1);

  const cuisineBreakdown = useMemo(() => {
    const cookbook = loadCookbook();
    const counts: Record<string, number> = {};
    log.forEach(e => {
      const r = cookbook.find(c => c.id === e.recipeId);
      const cuisine = r?.cuisine1 ?? "Unknown";
      counts[cuisine] = (counts[cuisine] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [log]);

  const COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-red-500", "bg-purple-500", "bg-cyan-500"];

  if (log.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">No meal data yet</p>
        <p className="text-xs text-muted-foreground">Log meals from the Generator or Cookbook to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">{log.length} meals logged · {streak} day streak</p>
      </div>

      {/* Weekly Calorie Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="font-semibold text-sm mb-4">Weekly Calories</h2>
        <div className="flex items-end gap-3 h-32">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{d.calories > 0 ? d.calories : ""}</span>
              <div className="w-full rounded-t-sm bg-primary/20 relative overflow-hidden" style={{ height: "80px" }}>
                <div className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all" style={{ height: `${(d.calories / maxCal) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cuisine distribution */}
      {cuisineBreakdown.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Cuisine Distribution</h2>
          <div className="space-y-2.5">
            {cuisineBreakdown.map(([cuisine, count], i) => {
              const pct = Math.round((count / log.length) * 100);
              return (
                <div key={cuisine}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{cuisine}</span>
                    <span className="text-muted-foreground">{count} meals · {pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${COLORS[i % COLORS.length]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent log */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="font-semibold text-sm mb-3">Recent Meals</h2>
        <div className="space-y-2">
          {log.slice(0, 10).map(e => (
            <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
              <span className="truncate flex-1">{e.recipeName}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-3">
                {e.nutrition && <span>{e.nutrition.calories} kcal</span>}
                <span>{new Date(e.at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RECIPE DNA ───────────────────────────────────────────────────────────────
function DNASection() {
  const cookbook = loadCookbook();
  const [allergens, setAllergens] = useState<string[]>(() => loadAllergens());
  const [selected, setSelected] = useState<string | null>(null);

  function toggleA(a: string) { setAllergens(toggleAllergen(a)); }

  const selectedRecipe = cookbook.find(r => r.id === selected);
  const allergenHits = selectedRecipe
    ? scanForAllergens(
        (selectedRecipe.ingredients ?? []).map(i => i.item),
        allergens
      )
    : [];

  function macroPct(r: SavedRecipe) {
    const n = r.nutritionInfo;
    if (!n) return null;
    const total = n.protein * 4 + n.carbs * 4 + n.fat * 9;
    if (total === 0) return null;
    return {
      protein: Math.round((n.protein * 4 / total) * 100),
      carbs: Math.round((n.carbs * 4 / total) * 100),
      fat: Math.round((n.fat * 9 / total) * 100),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recipe DNA</h1>
        <p className="text-muted-foreground text-sm mt-1">Allergen scanner · Macro breakdown · Recipe analysis</p>
      </div>

      {/* Allergen profile */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> My Allergen Profile</h2>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map(a => (
            <button
              key={a}
              onClick={() => toggleA(a)}
              className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${allergens.includes(a) ? "bg-red-500 text-white border-red-500" : "border-border/50 hover:border-red-300"}`}
            >
              {allergens.includes(a) ? "✗ " : ""}{a}
            </button>
          ))}
        </div>
        {allergens.length > 0 && <p className="text-xs text-muted-foreground mt-2">Select a recipe below to scan it for your allergens</p>}
      </div>

      {cookbook.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">Save recipes to your Cookbook to analyze them</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">Select recipe to analyze</p>
          <div className="grid gap-3">
            {cookbook.map(r => {
              const pct = macroPct(r);
              const hits = scanForAllergens((r.ingredients ?? []).map(i => i.item), allergens);
              const isSelected = selected === r.id;

              return (
                <div key={r.id} className={`rounded-xl border p-4 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:border-primary/30"}`} onClick={() => setSelected(isSelected ? null : r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      {r.cuisine1 && <p className="text-xs text-muted-foreground">{r.cuisine1}{r.cuisine2 && r.cuisine2 !== r.cuisine1 ? ` × ${r.cuisine2}` : ""}</p>}
                    </div>
                    {hits.length > 0 && (
                      <div className="flex items-center gap-1 text-red-500 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{hits.length} allergen{hits.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 space-y-3 border-t border-border/30 pt-3">
                      {/* Macro bars */}
                      {pct && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Macro Split (% of calories)</p>
                          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                            <div className="bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${pct.protein}%` }}>{pct.protein}%</div>
                            <div className="bg-yellow-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${pct.carbs}%` }}>{pct.carbs}%</div>
                            <div className="bg-red-500 flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${pct.fat}%` }}>{pct.fat}%</div>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Protein {pct.protein}%</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Carbs {pct.carbs}%</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Fat {pct.fat}%</span>
                          </div>
                        </div>
                      )}

                      {/* Allergen warnings */}
                      {allergens.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Allergen Scan</p>
                          {hits.length === 0 ? (
                            <p className="text-xs text-green-600 dark:text-green-400">✓ No allergen conflicts found</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {hits.map(h => <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 capitalize">{h}</span>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ingredients list */}
                      {r.ingredients && r.ingredients.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Ingredients ({r.ingredients.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {r.ingredients.map((ing, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${hits.some(h => ing.item.toLowerCase().includes(h)) ? "bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400" : "border-border/40 text-muted-foreground"}`}>
                                {ing.item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MILESTONES ───────────────────────────────────────────────────────────────
function MilestonesSection() {
  const log = useMemo(() => loadCookLog(), []);
  const cookbook = loadCookbook();
  const streak = computeStreak(log);
  const totalMeals = log.length;
  const uniqueRecipes = new Set(log.map(e => e.recipeId)).size;
  const uniqueCuisines = new Set(cookbook.map(r => r.cuisine1).filter(Boolean)).size;

  const milestones = [
    { id: "first", title: "First Bite", desc: "Generate and log your first recipe", icon: ChefHat, color: "text-amber-500", achieved: totalMeals >= 1, current: Math.min(1, totalMeals), target: 1, unit: "meal" },
    { id: "week", title: "Week Warrior", desc: "Log 7 meals", icon: Flame, color: "text-orange-500", achieved: totalMeals >= 7, current: totalMeals, target: 7, unit: "meals" },
    { id: "streak3", title: "Hat Trick", desc: "3-day cooking streak", icon: Trophy, color: "text-yellow-500", achieved: streak >= 3, current: streak, target: 3, unit: "days" },
    { id: "streak7", title: "Week Streak", desc: "7-day cooking streak", icon: Trophy, color: "text-yellow-400", achieved: streak >= 7, current: streak, target: 7, unit: "days" },
    { id: "recipes5", title: "Variety Pack", desc: "Try 5 different recipes", icon: Wand2, color: "text-purple-500", achieved: uniqueRecipes >= 5, current: uniqueRecipes, target: 5, unit: "recipes" },
    { id: "cuisines3", title: "World Tour", desc: "Explore 3 different cuisines", icon: Globe2, color: "text-blue-500", achieved: uniqueCuisines >= 3, current: uniqueCuisines, target: 3, unit: "cuisines" },
    { id: "saved10", title: "Collector", desc: "Save 10 recipes to cookbook", icon: BookOpen, color: "text-green-500", achieved: cookbook.length >= 10, current: cookbook.length, target: 10, unit: "recipes" },
    { id: "meals50", title: "Centurion", desc: "Log 50 meals", icon: Star, color: "text-rose-500", achieved: totalMeals >= 50, current: totalMeals, target: 50, unit: "meals" },
  ];

  const achieved = milestones.filter(m => m.achieved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Milestones</h1>
        <p className="text-muted-foreground text-sm mt-1">{achieved} / {milestones.length} achieved</p>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all" style={{ width: `${(achieved / milestones.length) * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {milestones.map(m => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          const Icon = m.icon;
          return (
            <div key={m.id} className={`rounded-xl border p-4 transition-all ${m.achieved ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card opacity-70"}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${m.achieved ? "bg-primary/15" : "bg-muted/50"}`}>
                  <Icon className={`h-4 w-4 ${m.achieved ? m.color : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm">{m.title}</p>
                    {m.achieved && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                    {!m.achieved && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{m.current} / {m.target} {m.unit}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.achieved ? "bg-primary" : "bg-muted-foreground/40"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ALGORITHM ────────────────────────────────────────────────────────────────
const WEIGHT_KEY = "nutri_weights_v1";
interface Weights { protein: number; variety: number; cookTime: number; allergenSafety: number; pantryMatch: number; }
const DEFAULT_WEIGHTS: Weights = { protein: 50, variety: 50, cookTime: 30, allergenSafety: 100, pantryMatch: 50 };
const WEIGHT_META: Record<keyof Weights, { label: string; desc: string }> = {
  protein: { label: "Protein Density", desc: "Reward high-protein recipes" },
  variety: { label: "Variety", desc: "Penalize recently cooked recipes" },
  cookTime: { label: "Cook Time", desc: "Prefer quicker recipes" },
  allergenSafety: { label: "Allergen Safety", desc: "Penalize allergen conflicts" },
  pantryMatch: { label: "Pantry Match", desc: "Reward pantry ingredient overlap" },
};

function loadWeights(): Weights {
  try { return JSON.parse(localStorage.getItem(WEIGHT_KEY) ?? "{}") as Weights; } catch { return DEFAULT_WEIGHTS; }
}
function saveWeights(w: Weights) { try { localStorage.setItem(WEIGHT_KEY, JSON.stringify(w)); } catch {} }

function scoreRecipes(weights: Weights): Array<SavedRecipe & { score: number }> {
  const cookbook = loadCookbook();
  const log = loadCookLog();
  const pantry = loadPantry();
  const allergens = loadAllergens();
  const recentIds = new Set(log.slice(0, 5).map(e => e.recipeId));

  return cookbook
    .map(r => {
      let score = 0;
      const protein = r.nutritionInfo?.protein ?? 0;
      score += (protein / 50) * (weights.protein / 100) * 30;
      if (recentIds.has(r.id)) score -= (weights.variety / 100) * 20;
      const cookTime = r.cookTime ?? 60;
      if (cookTime <= 30) score += (weights.cookTime / 100) * 15;
      const ings = (r.ingredients ?? []).map(i => i.item.toLowerCase());
      const pantryHits = pantry.filter(p => ings.some(i => i.includes(p.toLowerCase()))).length;
      score += (pantryHits / Math.max(1, ings.length)) * (weights.pantryMatch / 100) * 25;
      const allergenHits = scanForAllergens(ings, allergens);
      if (allergenHits.length > 0) score -= allergenHits.length * (weights.allergenSafety / 100) * 30;
      return { ...r, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score);
}

function AlgorithmSection() {
  const [weights, setWeights] = useState<Weights>(() => ({ ...DEFAULT_WEIGHTS, ...loadWeights() }));

  const ranked = useMemo(() => scoreRecipes(weights), [weights]);

  function update(k: keyof Weights, v: number) {
    const next = { ...weights, [k]: v };
    setWeights(next);
    saveWeights(next);
  }

  function reset() {
    setWeights(DEFAULT_WEIGHTS);
    saveWeights(DEFAULT_WEIGHTS);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Algorithm</h1>
          <p className="text-muted-foreground text-sm mt-1">Tune how recipes are scored and ranked</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs border border-border/50 px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Weight sliders */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
          <h2 className="font-semibold text-sm">Scoring Weights</h2>
          {(Object.keys(WEIGHT_META) as Array<keyof Weights>).map(k => (
            <div key={k}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{WEIGHT_META[k].label}</span>
                <span className="text-muted-foreground">{weights[k]}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{WEIGHT_META[k].desc}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[k]}
                onChange={e => update(k, Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          ))}
        </div>

        {/* Ranked results */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="font-semibold text-sm mb-3">Ranked Recipes</h2>
          {ranked.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No saved recipes to rank yet</p>
          ) : (
            <div className="space-y-2">
              {ranked.slice(0, 8).map((r, i) => {
                const maxScore = Math.max(...ranked.map(x => Math.abs(x.score)), 1);
                const pct = Math.max(0, Math.min(100, ((r.score + maxScore) / (2 * maxScore)) * 100));
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.name}</p>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${r.score >= 0 ? "text-green-500" : "text-red-400"}`}>{r.score > 0 ? "+" : ""}{r.score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
