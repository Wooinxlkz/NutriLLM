import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Globe2, ChefHat, Clock, AlertTriangle, Filter, X, SlidersHorizontal } from "lucide-react";
import { Layout } from "@/components/layout";

interface FoodItem {
  id: string;
  nameEn: string;
  nameAr: string;
  cuisine: string;
  region: string;
  category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  tags: string[];
  imageUrl?: string;
  description?: string;
  allergens?: string[];
  cookTime?: number;
  difficulty?: string;
}

const REGIONS = [
  "All Regions", "North Africa", "Levant", "Arabian Peninsula", "Middle East",
  "South Asia", "East Asia", "Southeast Asia", "Mediterranean", "Western Europe",
  "Latin America", "North America", "East Africa", "West Africa",
];

const CATEGORIES = ["All", "main", "appetizer", "soup", "salad", "dessert", "breakfast", "snack", "beverage", "side"];

function MacroPieChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total === 0) return null;
  const c = 2 * Math.PI * 15.9;
  const pPct = (protein * 4 / total);
  const cPct = (carbs * 4 / total);
  const fPct = (fat * 9 / total);
  let offset = 0;
  const segs = [
    { pct: pPct, color: "#3b82f6" },
    { pct: cPct, color: "#f59e0b" },
    { pct: fPct, color: "#ef4444" },
  ];
  return (
    <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90 shrink-0">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="4" className="dark:stroke-muted" />
      {segs.map((seg, i) => {
        const len = seg.pct * c;
        const el = (
          <circle key={i} cx="18" cy="18" r="15.9"
            fill="none" stroke={seg.color} strokeWidth="4"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export default function Foods() {
  const [, navigate] = useLocation();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function fetchFoods(s?: string, r?: string, c?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    const searchVal = s ?? search;
    const regionVal = r ?? region;
    const catVal = c ?? category;
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (regionVal !== "All Regions") params.set("region", regionVal);
    if (catVal !== "All") params.set("category", catVal);
    try {
      const resp = await fetch(`/api/foods?${params}`);
      const data = await resp.json();
      setFoods(data.foods ?? []);
    } catch {
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFoods(); }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchFoods(search, region, category);
  }

  function setRegionAndFetch(r: string) {
    setRegion(r);
    fetchFoods(search, r, category);
  }

  function setCategoryAndFetch(c: string) {
    setCategory(c);
    fetchFoods(search, region, c);
  }

  function clearSearch() {
    setSearch("");
    fetchFoods("", region, category);
  }

  function imgFallback(id: string) {
    setImgErrors(prev => new Set(prev).add(id));
  }

  function macroPct(n: { protein: number; carbs: number; fat: number }) {
    const cal = n.protein * 4 + n.carbs * 4 + n.fat * 9;
    if (cal === 0) return { protein: 33, carbs: 34, fat: 33 };
    return {
      protein: Math.round((n.protein * 4 / cal) * 100),
      carbs: Math.round((n.carbs * 4 / cal) * 100),
      fat: Math.round((n.fat * 9 / cal) * 100),
    };
  }

  function handleAnalyze(food: FoodItem, e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/analyze?food=${encodeURIComponent(food.nameEn)}`);
  }

  const difficultyColor: Record<string, string> = {
    easy: "text-green-400",
    medium: "text-amber-400",
    hard: "text-red-400",
  };

  const categoryEmoji: Record<string, string> = {
    dessert: "🍮", soup: "🍜", beverage: "🍵", breakfast: "🍳",
    appetizer: "🥗", salad: "🥗", snack: "🥨", side: "🍚", main: "🍽️",
  };

  return (
    <Layout>
      <div className="w-full py-5 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Global Food Library</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {loading ? "Loading…" : `${foods.length} dishes across ${new Set(foods.map(f => f.region)).size} regions`}
            </p>
          </div>
        </div>

        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search foods, cuisines, regions…"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border/50 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {search && (
              <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            className={`sm:hidden px-3 py-2.5 rounded-xl border text-sm transition-colors shrink-0 flex items-center gap-1.5 ${showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>

        <div className={`space-y-3 ${showFilters ? "block" : "hidden sm:block"}`}>
          <div className="flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {REGIONS.slice(0, 8).map(r => (
                <button
                  key={r}
                  onClick={() => setRegionAndFetch(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors whitespace-nowrap ${region === r ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}
                >
                  {r}
                </button>
              ))}
              <select
                value={REGIONS.slice(8).includes(region) ? region : ""}
                onChange={e => e.target.value && setRegionAndFetch(e.target.value)}
                className="text-xs rounded-full border border-border/50 bg-background px-2.5 py-1 focus:outline-none"
              >
                <option value="">More regions…</option>
                {REGIONS.slice(8).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryAndFetch(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border capitalize transition-colors ${category === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ChefHat className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No foods found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search terms</p>
            {(search || region !== "All Regions" || category !== "All") && (
              <button
                onClick={() => { setSearch(""); setRegion("All Regions"); setCategory("All"); fetchFoods("", "All Regions", "All"); }}
                className="mt-4 text-xs text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {foods.map(food => {
              const pct = macroPct(food.nutrition);
              const showImg = food.imageUrl && !imgErrors.has(food.id);
              const isExpanded = expanded === food.id;

              return (
                <div
                  key={food.id}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : food.id)}
                >
                  <div className="relative h-44 bg-muted overflow-hidden">
                    {showImg ? (
                      <img
                        src={food.imageUrl}
                        alt={food.nameEn}
                        className="w-full h-full object-cover"
                        onError={() => imgFallback(food.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <span className="text-5xl">{categoryEmoji[food.category] ?? "🍽️"}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white capitalize">{food.category}</span>
                      {food.difficulty && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-black/60 capitalize ${difficultyColor[food.difficulty] ?? "text-white"}`}>
                          {food.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white font-medium">{food.cuisine}</p>
                      <p className="text-[10px] text-white/70">{food.region}</p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{food.nameEn}</h3>
                        {food.nameAr && food.nameAr !== food.nameEn && (
                          <p className="text-xs text-primary mt-0.5" dir="rtl">{food.nameAr}</p>
                        )}
                      </div>
                      <MacroPieChart protein={food.nutrition.protein} carbs={food.nutrition.carbs} fat={food.nutrition.fat} />
                    </div>

                    <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">{food.nutrition.calories} kcal</span>
                      <span>·</span>
                      <span className="text-blue-500">{food.nutrition.protein}g P</span>
                      <span>·</span>
                      <span className="text-amber-500">{food.nutrition.carbs}g C</span>
                      <span>·</span>
                      <span className="text-red-500">{food.nutrition.fat}g F</span>
                    </div>

                    {food.cookTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {food.cookTime} min
                      </div>
                    )}

                    {(food.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {food.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary capitalize">{t}</span>
                        ))}
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t border-border/30 pt-3 mt-1 space-y-3" onClick={e => e.stopPropagation()}>
                        {food.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{food.description}</p>
                        )}

                        <div>
                          <p className="text-xs font-semibold mb-1.5">Macro Split</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "Protein", value: food.nutrition.protein, unit: "g", color: "bg-blue-500", pct: pct.protein },
                              { label: "Carbs", value: food.nutrition.carbs, unit: "g", color: "bg-amber-500", pct: pct.carbs },
                              { label: "Fat", value: food.nutrition.fat, unit: "g", color: "bg-red-500", pct: pct.fat },
                            ].map(({ label, value, unit, color, pct: p }) => (
                              <div key={label} className="flex items-center gap-2 text-xs">
                                <span className="w-10 text-muted-foreground">{label}</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} />
                                </div>
                                <span className="w-16 text-right text-muted-foreground">{value}{unit} ({p}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(food.allergens ?? []).length > 0 && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Contains allergens</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{food.allergens!.join(", ")}</p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={(e) => handleAnalyze(food, e)}
                          className="block w-full text-center text-xs py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
                        >
                          Analyze this dish with AI →
                        </button>
                      </div>
                    )}

                    {!isExpanded && (
                      <p className="text-[10px] text-muted-foreground/50 mt-auto">Tap to expand</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
