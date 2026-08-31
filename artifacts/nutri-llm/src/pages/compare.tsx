import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import {
  Scale, Search, X, Trophy, AlertTriangle, Leaf, Droplets,
  Flame, Zap, ChefHat, Globe2, Clock, ArrowRight, PlusCircle, Check,
} from "lucide-react";
import { Layout } from "@/components/layout";

interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  cuisine: string;
  region: string;
  category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number };
  tags: string[];
  description?: string;
  allergens?: string[];
  cookTime?: number;
  difficulty?: string;
  ingredients?: string[];
  imageUrl?: string;
}

const NUTRIENTS: Array<{ key: keyof FoodItem["nutrition"]; label: string; unit: string; lowerBetter?: boolean; color: string }> = [
  { key: "calories", label: "Calories", unit: "kcal", color: "text-orange-500" },
  { key: "protein", label: "Protein", unit: "g", color: "text-blue-500" },
  { key: "carbs", label: "Carbohydrates", unit: "g", color: "text-amber-500" },
  { key: "fat", label: "Fat", unit: "g", color: "text-red-500", lowerBetter: true },
  { key: "fiber", label: "Fiber", unit: "g", color: "text-emerald-500" },
  { key: "sodium", label: "Sodium", unit: "mg", color: "text-sky-500", lowerBetter: true },
];

const BAR_COLORS: Record<string, string> = {
  calories: "bg-orange-500", protein: "bg-blue-500", carbs: "bg-amber-500",
  fat: "bg-red-500", fiber: "bg-emerald-500", sodium: "bg-sky-500",
};

function addFoodToTracker(food: FoodItem): boolean {
  try {
    const entry = {
      id: `compare_${food.id}_${Date.now()}`,
      nameEn: food.nameEn,
      nameAr: food.nameAr,
      nutrition: food.nutrition,
      loggedAt: new Date().toISOString(),
      portion: 1,
    };
    const existing = JSON.parse(localStorage.getItem("nutrillm_tracker") ?? "[]");
    localStorage.setItem("nutrillm_tracker", JSON.stringify([...existing, entry]));
    return true;
  } catch { return false; }
}

function FoodPicker({ label, selected, onSelect }: { label: string; selected: FoodItem | null; onSelect: (f: FoodItem | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch(`/api/foods?search=${encodeURIComponent(query)}`);
      const data = await resp.json();
      setResults((data.foods ?? []).slice(0, 8));
      setOpen(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }

  if (selected) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 relative space-y-3">
        <button onClick={() => { onSelect(null); setLogged(false); }} className="absolute top-3 right-3 p-1 rounded-full bg-muted hover:bg-muted/70 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
        {selected.imageUrl && (
          <img src={selected.imageUrl} alt={selected.nameEn} className="w-full h-32 object-cover rounded-xl" onError={e => (e.currentTarget.style.display = "none")} />
        )}
        <div>
          <p className="font-bold text-base">{selected.nameEn}</p>
          {selected.nameAr && selected.nameAr !== selected.nameEn && (
            <p className="text-sm text-primary" dir="rtl">{selected.nameAr}</p>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">{selected.cuisine}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">{selected.region}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground capitalize">{selected.category}</span>
        </div>
        <button
          onClick={() => { const ok = addFoodToTracker(selected); setLogged(ok); }}
          disabled={logged}
          className={`w-full py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors ${
            logged ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" : "border-primary/30 text-primary hover:bg-primary/5"
          }`}
        >
          {logged ? <><Check className="h-3 w-3" /> Added to Tracker</> : <><PlusCircle className="h-3 w-3" /> Add to Daily Tracker</>}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card p-4 space-y-3">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <form onSubmit={e => { e.preventDefault(); search(); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a food name…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <button type="submit" disabled={searching}
          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
          {searching ? "…" : "Find"}
        </button>
      </form>

      {open && results.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30 max-h-56 overflow-y-auto">
          {results.map(f => (
            <button key={f.id} onClick={() => { onSelect(f); setOpen(false); setQuery(""); setResults([]); }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/5 text-left transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{f.nameEn}</p>
                {f.nameAr && f.nameAr !== f.nameEn && <p className="text-[10px] text-primary" dir="rtl">{f.nameAr}</p>}
                <p className="text-[10px] text-muted-foreground">{f.cuisine} · {f.category}</p>
              </div>
              <span className="text-xs font-bold text-orange-500 shrink-0 ml-2">{f.nutrition.calories} kcal</span>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !searching && (
        <p className="text-xs text-center text-muted-foreground py-2">No results found — try different terms</p>
      )}
    </div>
  );
}

export default function Compare() {
  const searchStr = useSearch();
  const [foodA, setFoodA] = useState<FoodItem | null>(null);
  const [foodB, setFoodB] = useState<FoodItem | null>(null);
  const [foodC, setFoodC] = useState<FoodItem | null>(null);
  const [showThird, setShowThird] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const aId = params.get("a");
    const bId = params.get("b");
    if (aId || bId) {
      (async () => {
        if (aId) {
          const r = await fetch(`/api/foods?search=${encodeURIComponent(aId.replace(/-/g, " "))}`);
          const d = await r.json();
          const found = (d.foods ?? []).find((f: FoodItem) => f.id === aId) ?? (d.foods ?? [])[0];
          if (found) setFoodA(found);
        }
        if (bId) {
          const r = await fetch(`/api/foods?search=${encodeURIComponent(bId.replace(/-/g, " "))}`);
          const d = await r.json();
          const found = (d.foods ?? []).find((f: FoodItem) => f.id === bId) ?? (d.foods ?? [])[0];
          if (found) setFoodB(found);
        }
      })();
    }
  }, []);

  const foods = [foodA, foodB, showThird ? foodC : null].filter(Boolean) as FoodItem[];
  const hasTwoPlus = foods.length >= 2;

  function winner(key: keyof FoodItem["nutrition"], lowerBetter = false): string {
    if (foods.length < 2) return "";
    const vals = foods.map(f => f.nutrition[key] ?? 0);
    const best = lowerBetter ? Math.min(...vals) : Math.max(...vals);
    const idx = vals.indexOf(best);
    if (vals.filter(v => v === best).length > 1) return "tie";
    return String.fromCharCode(65 + idx); // A, B, C
  }

  const maxVals: Record<string, number> = {};
  NUTRIENTS.forEach(({ key }) => {
    maxVals[key] = Math.max(...foods.map(f => f.nutrition[key] ?? 0), 1);
  });

  const wins = foods.map((_, i) => {
    const letter = String.fromCharCode(65 + i);
    return NUTRIENTS.filter(n => winner(n.key, n.lowerBetter) === letter).length;
  });
  const maxWins = Math.max(...wins);
  const overallWinnerIdx = wins.filter(w => w === maxWins).length === 1 ? wins.indexOf(maxWins) : -1;

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto py-5 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
            <Scale className="h-7 w-7 text-primary" /> Food Compare
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">Compare up to 3 dishes — nutrition, ingredients, health stats</p>
        </div>

        {/* Pickers */}
        <div className={`grid gap-4 ${showThird ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          <FoodPicker label="Food A" selected={foodA} onSelect={setFoodA} />
          <FoodPicker label="Food B" selected={foodB} onSelect={setFoodB} />
          {showThird && <FoodPicker label="Food C" selected={foodC} onSelect={setFoodC} />}
        </div>

        {/* Toggle third food */}
        <div className="flex justify-center">
          <button onClick={() => { setShowThird(s => !s); if (showThird) setFoodC(null); }}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-full border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary">
            {showThird ? <><X className="h-3.5 w-3.5" /> Remove 3rd food</> : <><PlusCircle className="h-3.5 w-3.5" /> Add a 3rd food to compare</>}
          </button>
        </div>

        {/* Overall verdict */}
        {hasTwoPlus && (
          <div className={`rounded-2xl p-5 text-center border ${overallWinnerIdx >= 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30 border-border/50"}`}>
            <Trophy className={`h-8 w-8 mx-auto mb-2 ${overallWinnerIdx >= 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            {overallWinnerIdx >= 0 ? (
              <>
                <p className="text-lg font-black">{foods[overallWinnerIdx].nameEn} wins!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Wins {wins[overallWinnerIdx]} of {NUTRIENTS.length} nutrition categories
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold">It's a tie!</p>
                <p className="text-sm text-muted-foreground mt-1">Foods are evenly matched across categories</p>
              </>
            )}
          </div>
        )}

        {/* Comparison table */}
        {hasTwoPlus && (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {/* Column headers */}
            <div className={`grid bg-muted/30 border-b border-border/30 px-4 py-3 gap-3 items-center ${showThird && foodC ? "grid-cols-[1fr_60px_1fr_60px_1fr]" : "grid-cols-[1fr_60px_1fr]"}`}>
              {foods.map((food, idx) => (
                <>
                  <div key={food.id} className="text-center">
                    <p className="font-bold text-sm">{food.nameEn}</p>
                    {food.nameAr && food.nameAr !== food.nameEn && <p className="text-[10px] text-primary" dir="rtl">{food.nameAr}</p>}
                    <p className="text-[10px] text-muted-foreground">{food.cuisine}</p>
                  </div>
                  {idx < foods.length - 1 && (
                    <div key={`vs-${idx}`} className="text-center">
                      <p className="text-xs text-muted-foreground font-medium">vs</p>
                    </div>
                  )}
                </>
              ))}
            </div>

            {/* Nutrient rows */}
            <div className="divide-y divide-border/20">
              {NUTRIENTS.map(({ key, label, unit, lowerBetter, color }) => {
                const vals = foods.map(f => f.nutrition[key] ?? 0);
                const w = winner(key, lowerBetter);
                const barColor = BAR_COLORS[key] ?? "bg-primary";
                return (
                  <div key={key} className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center mb-2">{label} {lowerBetter && <span className="normal-case">(lower = better)</span>}</p>
                    <div className={`grid gap-3 items-center ${showThird && foodC ? "grid-cols-3" : "grid-cols-2"}`}>
                      {foods.map((food, idx) => {
                        const val = vals[idx];
                        const pct = (val / maxVals[key]) * 100;
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div key={food.id} className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              {w === letter && <Trophy className="h-3 w-3 text-amber-500" />}
                              <span className={`text-sm font-bold ${color}`}>{val}{unit}</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score row */}
            <div className={`bg-muted/20 border-t border-border/30 px-4 py-3 grid gap-3 ${showThird && foodC ? "grid-cols-3" : "grid-cols-2"}`}>
              {foods.map((food, idx) => (
                <div key={food.id} className="text-center">
                  <p className={`text-xl font-black ${overallWinnerIdx === idx ? "text-amber-500" : "text-foreground"}`}>{wins[idx]}</p>
                  <p className="text-[10px] text-muted-foreground">wins</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick calorie + macro stats */}
        {hasTwoPlus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Lowest Cal", food: foods.reduce((a, b) => a.nutrition.calories < b.nutrition.calories ? a : b) },
              { label: "Most Protein", food: foods.reduce((a, b) => a.nutrition.protein > b.nutrition.protein ? a : b) },
              { label: "Most Fiber", food: foods.reduce((a, b) => (a.nutrition.fiber ?? 0) > (b.nutrition.fiber ?? 0) ? a : b) },
              { label: "Least Fat", food: foods.reduce((a, b) => a.nutrition.fat < b.nutrition.fat ? a : b) },
            ].map(({ label, food }) => (
              <div key={label} className="rounded-xl border border-border/50 bg-card p-3">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
                <p className="text-sm font-bold truncate">{food.nameEn}</p>
              </div>
            ))}
          </div>
        )}

        {/* Extra details side by side */}
        {hasTwoPlus && (
          <div className={`grid gap-4 ${showThird && foodC ? "grid-cols-3" : "grid-cols-2"}`}>
            {foods.map((food) => (
              <div key={food.id} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-bold text-sm flex items-center gap-1.5"><ChefHat className="h-4 w-4 text-amber-500" /> {food.nameEn}</p>
                {food.description && <p className="text-xs text-muted-foreground leading-relaxed">{food.description}</p>}
                {(food.ingredients ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Ingredients</p>
                    <div className="flex flex-wrap gap-1">
                      {food.ingredients!.slice(0, 6).map(ing => (
                        <span key={ing} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50 border border-border/30 text-muted-foreground capitalize">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(food.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {food.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary capitalize">{t}</span>
                    ))}
                  </div>
                )}
                {food.cookTime && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {food.cookTime} min · <span className="capitalize">{food.difficulty ?? "medium"}</span>
                  </p>
                )}
                {(food.allergens ?? []).length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{food.allergens!.join(", ")}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-center mt-1">
                  <button
                    onClick={() => window.open(`/analyze?food=${encodeURIComponent(food.nameEn)}`, "_self")}
                    className="py-1.5 rounded-xl border border-primary/30 text-primary text-[11px] font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                  >
                    <Zap className="h-3 w-3" /> Full Analysis
                  </button>
                  <button
                    onClick={() => addFoodToTracker(food)}
                    className="py-1.5 rounded-xl border border-border/50 text-muted-foreground text-[11px] font-medium hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder when nothing picked */}
        {!foodA && !foodB && (
          <div className="text-center py-16 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Select two (or three) foods above to start comparing</p>
            <p className="text-xs mt-1">You can also use the Compare button on any food card in the Catalog</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
