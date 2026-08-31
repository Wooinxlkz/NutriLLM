import { useState, useEffect, useRef, useCallback } from "react";
import {
  Flame, Zap, Droplets, Leaf, Trash2, Plus, BarChart3,
  Calendar, ChefHat, Target, TrendingUp, Clock, Settings2,
  Coffee, Sun, Sunset, Moon, Check, Search, SlidersHorizontal,
  X, Filter,
} from "lucide-react";
import { Layout } from "@/components/layout";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface TrackerEntry {
  id: string;
  nameEn: string;
  nameAr?: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number };
  loggedAt: string;
  portion: number;
  mealType?: MealType;
}

interface Goals { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number; water: number; }

interface FoodItem {
  id: string; nameEn: string; nameAr: string; cuisine: string; region: string; category: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number };
  tags: string[]; imageUrl?: string; cookTime?: number; difficulty?: string;
}

const DEFAULT_GOALS: Goals = { calories: 2000, protein: 50, carbs: 300, fat: 65, fiber: 25, sodium: 2300, water: 8 };

const MEAL_TYPES: { key: MealType; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  { key: "lunch", label: "Lunch", icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  { key: "dinner", label: "Dinner", icon: Sunset, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  { key: "snack", label: "Snack", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30" },
];

const FOOD_CATS = ["All", "main", "appetizer", "breakfast", "soup", "salad", "dessert", "snack", "side"];

function todayKey() { return new Date().toISOString().slice(0, 10); }

function getLog(): TrackerEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem("nutrillm_tracker") ?? "[]") as TrackerEntry[];
    return raw.filter(e => e.loggedAt.startsWith(todayKey()));
  } catch { return []; }
}

function saveLog(entries: TrackerEntry[]) {
  const allRaw = JSON.parse(localStorage.getItem("nutrillm_tracker") ?? "[]") as TrackerEntry[];
  const past = allRaw.filter(e => !e.loggedAt.startsWith(todayKey()));
  localStorage.setItem("nutrillm_tracker", JSON.stringify([...past, ...entries]));
}

function loadGoals(): Goals {
  try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem("nutrillm_goals") ?? "{}") }; }
  catch { return DEFAULT_GOALS; }
}
function saveGoalsLS(g: Goals) { try { localStorage.setItem("nutrillm_goals", JSON.stringify(g)); } catch {} }

function getWaterLS(): number { try { return Number(JSON.parse(localStorage.getItem(`nutrillm_water_${todayKey()}`) ?? "0")); } catch { return 0; } }
function setWaterLS(n: number) { try { localStorage.setItem(`nutrillm_water_${todayKey()}`, JSON.stringify(n)); } catch {} }

function Ring({ value, max, color, size = 88 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / (max || 1));
  const over = value > max;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={over ? "#ef4444" : color} strokeWidth="6"
        strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

function SmallRing({ value, max, color }: { value: number; max: number; color: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / (max || 1));
  return (
    <svg width={50} height={50} className="-rotate-90">
      <circle cx={25} cy={25} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
      <circle cx={25} cy={25} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

export default function Tracker() {
  const [log, setLog] = useState<TrackerEntry[]>([]);
  const [goals, setGoalsState] = useState<Goals>(DEFAULT_GOALS);
  const [showGoals, setShowGoals] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Goals>(DEFAULT_GOALS);
  const [water, setWaterState] = useState(0);
  const [activeFilter, setActiveFilter] = useState<MealType | "all">("all");
  const [pendingMealType, setPendingMealType] = useState<MealType>("lunch");

  // Custom food form
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCals, setCustomCals] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  // Sidebar food browser
  const [sideSearch, setSideSearch] = useState("");
  const [sideCategory, setSideCategory] = useState("All");
  const [sideResults, setSideResults] = useState<FoodItem[]>([]);
  const [sideLoading, setSideLoading] = useState(false);
  const [sideOpen, setSideOpen] = useState(false); // mobile drawer
  const [recentAdded, setRecentAdded] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLog(getLog());
    setGoalsState(loadGoals());
    setDraftGoals(loadGoals());
    setWaterState(getWaterLS());
    fetchSidebarFoods("", "All");
  }, []);

  async function fetchSidebarFoods(q: string, cat: string) {
    setSideLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("search", q.trim());
      if (cat !== "All") params.set("category", cat);
      params.set("limit", "60");
      const resp = await fetch(`/api/foods?${params}`);
      const data = await resp.json();
      setSideResults(data.foods ?? []);
    } catch { setSideResults([]); }
    finally { setSideLoading(false); }
  }

  const handleSideSearch = useCallback((q: string) => {
    setSideSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSidebarFoods(q, sideCategory), 350);
  }, [sideCategory]);

  function handleSideCategory(cat: string) {
    setSideCategory(cat);
    fetchSidebarFoods(sideSearch, cat);
  }

  function addFoodToLog(food: FoodItem) {
    const entry: TrackerEntry = {
      id: food.id + "_" + Date.now(),
      nameEn: food.nameEn,
      nameAr: food.nameAr,
      nutrition: food.nutrition,
      loggedAt: new Date().toISOString(),
      portion: 1,
      mealType: pendingMealType,
    };
    const next = [...log, entry];
    setLog(next);
    saveLog(next);
    setRecentAdded(s => new Set([...s, food.id]));
    setTimeout(() => setRecentAdded(s => { const n = new Set(s); n.delete(food.id); return n; }), 2000);
  }

  function addCustom() {
    if (!customName.trim() || !customCals) return;
    const entry: TrackerEntry = {
      id: "custom_" + Date.now(),
      nameEn: customName,
      nutrition: { calories: Number(customCals)||0, protein: Number(customProtein)||0, carbs: Number(customCarbs)||0, fat: Number(customFat)||0 },
      loggedAt: new Date().toISOString(),
      portion: 1,
      mealType: pendingMealType,
    };
    const next = [...log, entry];
    setLog(next); saveLog(next);
    setCustomName(""); setCustomCals(""); setCustomProtein(""); setCustomCarbs(""); setCustomFat("");
    setShowCustom(false);
  }

  function updatePortion(id: string, portion: number) {
    const next = log.map(e => e.id === id ? { ...e, portion: Math.max(0.25, portion) } : e);
    setLog(next); saveLog(next);
  }

  function removeEntry(id: string) {
    const next = log.filter(e => e.id !== id);
    setLog(next); saveLog(next);
  }

  function saveGoalEdit() { setGoalsState(draftGoals); saveGoalsLS(draftGoals); setShowGoals(false); }

  function addWater(n: number) {
    const next = Math.max(0, water + n);
    setWaterState(next); setWaterLS(next);
  }

  const totals = log.reduce((acc, e) => ({
    calories: acc.calories + e.nutrition.calories * e.portion,
    protein: acc.protein + e.nutrition.protein * e.portion,
    carbs: acc.carbs + e.nutrition.carbs * e.portion,
    fat: acc.fat + e.nutrition.fat * e.portion,
    fiber: acc.fiber + (e.nutrition.fiber ?? 0) * e.portion,
    sodium: acc.sodium + (e.nutrition.sodium ?? 0) * e.portion,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });

  const filteredLog = activeFilter === "all" ? log : log.filter(e => e.mealType === activeFilter);

  const mealGroups = MEAL_TYPES.map(m => ({
    ...m,
    count: log.filter(e => e.mealType === m.key).length,
    cal: log.filter(e => e.mealType === m.key).reduce((s, e) => s + e.nutrition.calories * e.portion, 0),
  }));

  const calPct = Math.round((totals.calories / (goals.calories || 1)) * 100);

  // ── Sidebar food browser panel ────────────────────────────────────────────────
  const FoodBrowserPanel = (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b border-border/40 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={sideSearch}
              onChange={e => handleSideSearch(e.target.value)}
              placeholder="Search foods…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {sideSearch && (
              <button onClick={() => { setSideSearch(""); fetchSidebarFoods("", sideCategory); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setSideOpen(false)} className="lg:hidden p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FOOD_CATS.map(cat => (
            <button key={cat} onClick={() => handleSideCategory(cat)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                sideCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50 text-muted-foreground"
              }`}>{cat}</button>
          ))}
        </div>
        {/* Meal type for adding */}
        <div className="flex gap-1.5">
          {MEAL_TYPES.map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setPendingMealType(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-[10px] font-medium transition-colors ${
                pendingMealType === key ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"
              }`}>
              <Icon className={`h-3.5 w-3.5 ${pendingMealType === key ? "" : color}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto">
        {sideLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading foods…</div>
        ) : sideResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
            <ChefHat className="h-8 w-8 opacity-30" />
            No foods found
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {sideResults.map(food => {
              const added = recentAdded.has(food.id);
              return (
                <div key={food.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                  {food.imageUrl ? (
                    <img src={food.imageUrl} alt={food.nameEn}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{food.nameEn}</p>
                    {food.nameAr && food.nameAr !== food.nameEn && (
                      <p className="text-[10px] text-primary truncate" dir="rtl">{food.nameAr}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{food.cuisine} · {food.nutrition.calories} kcal</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground leading-none">{food.nutrition.protein}g P</p>
                    <p className="text-[10px] text-muted-foreground leading-none">{food.nutrition.carbs}g C</p>
                    <p className="text-[10px] text-muted-foreground leading-none">{food.nutrition.fat}g F</p>
                  </div>
                  <button onClick={() => addFoodToLog(food)}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      added ? "bg-green-500 text-white scale-110" : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}>
                    {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom food entry */}
      <div className="border-t border-border/40 p-3">
        <button onClick={() => setShowCustom(s => !s)}
          className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 py-1">
          <Plus className="h-3.5 w-3.5" /> Add custom food manually
        </button>
        {showCustom && (
          <div className="mt-2 space-y-2">
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Food name"
              className="w-full px-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { v: customCals, s: setCustomCals, l: "Cal" },
                { v: customProtein, s: setCustomProtein, l: "Pro" },
                { v: customCarbs, s: setCustomCarbs, l: "Carb" },
                { v: customFat, s: setCustomFat, l: "Fat" },
              ].map(({ v, s, l }) => (
                <input key={l} type="number" value={v} onChange={e => s(e.target.value)} placeholder={l} min="0"
                  className="px-2 py-1.5 rounded-lg border border-border/50 bg-background text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/50" />
              ))}
            </div>
            <button onClick={addCustom} disabled={!customName.trim() || !customCals}
              className="w-full py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              Add Custom Food
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex-1 flex flex-col w-full">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border/30 bg-card/30">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Daily Tracker</h1>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGoals(s => !s)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <Settings2 className="h-3.5 w-3.5" /> Goals
            </button>
            {/* Mobile: toggle food panel */}
            <button onClick={() => setSideOpen(s => !s)}
              className="lg:hidden flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Food
            </button>
          </div>
        </div>

        {/* Goal editor */}
        {showGoals && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-primary flex items-center gap-2"><Settings2 className="h-4 w-4" /> Daily Goals</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {(["calories", "protein", "carbs", "fat", "fiber", "sodium", "water"] as const).map(key => (
                <div key={key}>
                  <label className="text-[10px] text-muted-foreground capitalize mb-1 block">
                    {key} {key === "calories" ? "(kcal)" : key === "water" ? "(cups)" : key === "sodium" ? "(mg)" : "(g)"}
                  </label>
                  <input type="number" value={draftGoals[key]}
                    onChange={e => setDraftGoals(g => ({ ...g, [key]: Number(e.target.value) || 0 }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-border/50 bg-background text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveGoalEdit} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> Save Goals
              </button>
              <button onClick={() => setShowGoals(false)} className="px-4 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Main two-column layout */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT: Stats + Log ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

            {/* Calorie ring + macro mini rings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* Main calorie card */}
              <div className="rounded-2xl border border-border/50 bg-card p-5 sm:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <Ring value={totals.calories} max={goals.calories} color="#f97316" size={88} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black leading-none">{Math.round(totals.calories)}</span>
                      <span className="text-[9px] text-muted-foreground leading-none">kcal</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-sm">Calorie Goal</span>
                      <span className={`text-xs ml-auto font-bold ${calPct > 100 ? "text-red-500" : "text-muted-foreground"}`}>{calPct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all ${totals.calories > goals.calories ? "bg-red-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(100, calPct)}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center"><p className="text-muted-foreground text-[10px]">Eaten</p><p className="font-bold">{Math.round(totals.calories)}</p></div>
                      <div className="text-center"><p className="text-muted-foreground text-[10px]">Goal</p><p className="font-bold">{goals.calories}</p></div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-[10px]">Left</p>
                        <p className={`font-bold ${totals.calories > goals.calories ? "text-red-500" : "text-emerald-500"}`}>
                          {totals.calories > goals.calories ? "Over!" : Math.round(goals.calories - totals.calories)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro rings */}
              {[
                { label: "Protein", value: totals.protein, goal: goals.protein, unit: "g", color: "#3b82f6" },
                { label: "Carbs", value: totals.carbs, goal: goals.carbs, unit: "g", color: "#f59e0b" },
              ].map(({ label, value, goal, unit, color }) => (
                <div key={label} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <SmallRing value={value} max={goal} color={color} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-bold">{Math.round(value)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(value)}{unit} / {goal}{unit}</p>
                    <p className="text-[10px] text-muted-foreground">{Math.round((value / (goal || 1)) * 100)}% of goal</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fat + Fiber + Water + Sodium */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Fat", value: totals.fat, goal: goals.fat, unit: "g", color: "#ef4444" },
                { label: "Fiber", value: totals.fiber, goal: goals.fiber, unit: "g", color: "#22c55e" },
              ].map(({ label, value, goal, unit, color }) => (
                <div key={label} className="rounded-xl border border-border/50 bg-card p-3 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <SmallRing value={value} max={goal} color={color} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold">{Math.round(value)}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{Math.round(value)}{unit} / {goal}{unit}</p>
                  </div>
                </div>
              ))}

              {/* Water */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 flex items-center gap-3">
                <Droplets className="h-5 w-5 text-sky-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">Water</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden my-1">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, (water / (goals.water || 1)) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{water} / {goals.water} cups</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => addWater(1)} className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center hover:bg-sky-600">+</button>
                  <button onClick={() => addWater(-1)} className="w-6 h-6 rounded-full border border-border/50 text-xs font-bold flex items-center justify-center hover:bg-muted/60">−</button>
                </div>
              </div>

              {/* Sodium */}
              <div className={`rounded-xl border p-3 flex items-center gap-3 ${totals.sodium > goals.sodium ? "bg-red-500/10 border-red-500/30" : "bg-card border-border/50"}`}>
                <Droplets className={`h-5 w-5 shrink-0 ${totals.sodium > goals.sodium ? "text-red-500" : "text-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Sodium {totals.sodium > goals.sodium && <span className="text-red-500">⚠</span>}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden my-1">
                    <div className={`h-full rounded-full ${totals.sodium > goals.sodium ? "bg-red-500" : "bg-blue-400"}`}
                      style={{ width: `${Math.min(100, (totals.sodium / (goals.sodium || 1)) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{Math.round(totals.sodium)}mg / {goals.sodium}mg</p>
                </div>
              </div>
            </div>

            {/* Meal type breakdown tabs */}
            {log.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {mealGroups.map(({ key, label, icon: Icon, color, bg, count, cal }) => (
                  <button key={key}
                    onClick={() => setActiveFilter(activeFilter === key ? "all" : key)}
                    className={`rounded-xl border p-3 text-center transition-all hover:scale-105 ${activeFilter === key ? `${bg} border-current` : "border-border/50 bg-card hover:border-primary/30"}`}>
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                    <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold">{Math.round(cal)}<span className="text-[9px] font-normal text-muted-foreground"> kcal</span></p>
                    <p className="text-[10px] text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Logged meals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {activeFilter === "all" ? `All Meals (${log.length})` : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} (${filteredLog.length})`}
                </p>
                {activeFilter !== "all" && (
                  <button onClick={() => setActiveFilter("all")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Show all</button>
                )}
              </div>

              {filteredLog.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 py-12 text-center text-muted-foreground">
                  <ChefHat className="h-9 w-9 mx-auto mb-2 opacity-25" />
                  <p className="text-sm font-medium">{log.length === 0 ? "No meals logged today" : `No ${activeFilter} meals yet`}</p>
                  <p className="text-xs mt-1">Use the food panel to add your meals</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLog.map(entry => {
                    const mt = MEAL_TYPES.find(m => m.key === entry.mealType);
                    const Icon = mt?.icon ?? ChefHat;
                    return (
                      <div key={entry.id} className="rounded-xl border border-border/50 bg-card px-4 py-3 flex items-start gap-3">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${mt?.color ?? "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="font-semibold text-sm truncate">{entry.nameEn}</p>
                            {entry.nameAr && entry.nameAr !== entry.nameEn && (
                              <p className="text-[10px] text-primary shrink-0" dir="rtl">{entry.nameAr}</p>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(entry.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {entry.mealType && <span className="capitalize"> · {entry.mealType}</span>}
                          </p>
                          <div className="flex gap-3 mt-1.5 text-xs">
                            <span className="text-orange-500 font-bold">{Math.round(entry.nutrition.calories * entry.portion)} kcal</span>
                            <span className="text-blue-500">{Math.round(entry.nutrition.protein * entry.portion)}g P</span>
                            <span className="text-amber-500">{Math.round(entry.nutrition.carbs * entry.portion)}g C</span>
                            <span className="text-red-500">{Math.round(entry.nutrition.fat * entry.portion)}g F</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updatePortion(entry.id, entry.portion - 0.25)}
                            className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold hover:bg-muted/70">−</button>
                          <span className="text-xs font-semibold w-7 text-center">{entry.portion}×</span>
                          <button onClick={() => updatePortion(entry.id, entry.portion + 0.25)}
                            className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold hover:bg-muted/70">+</button>
                          <button onClick={() => removeEntry(entry.id)} className="ml-1 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary row */}
            {log.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <p className="text-sm font-semibold flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-primary" /> Daily Summary</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                  {[
                    { icon: <Flame className="h-3.5 w-3.5 text-orange-500 mx-auto mb-0.5" />, label: "Calories", value: `${Math.round(totals.calories)} kcal` },
                    { icon: <Zap className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />, label: "Protein", value: `${Math.round(totals.protein)}g` },
                    { icon: <Leaf className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-0.5" />, label: "Fiber", value: `${Math.round(totals.fiber)}g` },
                    { icon: <Target className="h-3.5 w-3.5 text-purple-500 mx-auto mb-0.5" />, label: "Goal", value: `${calPct}%` },
                    { icon: <BarChart3 className="h-3.5 w-3.5 text-amber-500 mx-auto mb-0.5" />, label: "Meals", value: `${log.length}` },
                    { icon: <Droplets className="h-3.5 w-3.5 text-sky-500 mx-auto mb-0.5" />, label: "Water", value: `${water}/${goals.water} cups` },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="bg-background/60 rounded-xl p-2.5 border border-border/30">
                      {icon}
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-xs font-bold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Food Browser Sidebar (desktop always visible) ────────────── */}
          <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border/40 bg-card/20 flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
            <div className="px-4 pt-4 pb-2 border-b border-border/30">
              <p className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add Food</p>
            </div>
            {FoodBrowserPanel}
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom drawer overlay ──────────────────────────────────────── */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          <div className="relative bg-background rounded-t-3xl border-t border-border/50 flex flex-col"
            style={{ maxHeight: "85vh" }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <p className="font-semibold text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add Food</p>
              <button onClick={() => setSideOpen(false)} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {FoodBrowserPanel}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
