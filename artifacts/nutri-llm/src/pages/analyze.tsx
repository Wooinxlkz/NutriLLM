import { useState, useRef, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import {
  Search, Camera, Upload, X, Loader2, Globe2, BookOpen,
  AlertTriangle, Clock, ChefHat, Wine, Leaf, Sparkles, Heart,
  FlameIcon, Zap, Droplets, BarChart3, ShieldCheck, Target,
  Utensils, Refrigerator, TrendingUp, Info, Star, Apple,
  ListOrdered, PlusCircle, Check,
} from "lucide-react";
import { Layout } from "@/components/layout";

interface CatalogFood {
  id: string; nameEn: string; nameAr: string; cuisine: string; region: string;
  category: string; nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sodium?: number };
  description?: string; ingredients?: string[]; allergens?: string[]; tags?: string[];
  cookTime?: number; difficulty?: string; imageUrl?: string;
}

interface Nutrition {
  calories: number; protein: number; carbs: number; fat: number;
  fiber?: number; sugar?: number; sodium?: number; saturatedFat?: number;
  cholesterol?: number; potassium?: number; calcium?: number; iron?: number;
  vitaminC?: number; vitaminA?: number; vitaminD?: number; vitaminB12?: number;
  omega3?: number; glycemicIndex?: number;
}

interface DailyValues {
  calories?: number; protein?: number; carbs?: number; fat?: number;
  fiber?: number; sodium?: number; calcium?: number; iron?: number;
  vitaminC?: number; vitaminA?: number; vitaminD?: number; potassium?: number;
}

interface RegionalVariation {
  region: string; regionAr?: string; description: string; descriptionAr?: string; keyDifferences?: string[];
}

interface DrinkPairing { wine?: string; beer?: string; nonAlcoholic: string; source?: string; }

interface DietaryCompatibility {
  vegan?: boolean; vegetarian?: boolean; glutenFree?: boolean; dairyFree?: boolean;
  halal?: boolean; kosher?: boolean; keto?: boolean; paleo?: boolean;
  lowCarb?: boolean; highProtein?: boolean;
}

interface NutritionVerification {
  status: "verified" | "deviation-flagged" | "no-match" | "skipped-no-api-key" | "error";
  matchedFoodName?: string;
  note: string;
}

interface AnalysisResult {
  foodNameEn: string; foodNameAr?: string; servingSize?: string;
  nutrition?: Nutrition; dailyValues?: DailyValues;
  culturalContext?: string; culturalContextAr?: string;
  originStory?: string;
  bestTimeToEat?: string; fitnessGoals?: string[];
  regionalVariations?: RegionalVariation[];
  healthInsights?: string[]; healthInsightsAr?: string[];
  warnings?: string[];
  ingredients?: string[]; cookingMethod?: string;
  cookingSteps?: string[];
  cuisine?: string; region?: string; category?: string;
  tags?: string[]; allergens?: string[];
  prepTime?: number; cookTime?: number; difficulty?: string;
  servingSuggestions?: string[]; storageTips?: string;
  drinkPairing?: DrinkPairing;
  dietaryCompatibility?: DietaryCompatibility;
  confidence?: number; identifiedFoods?: string[];
  portionNotes?: string; imageUrl?: string;
  source?: string;
  nutritionVerification?: NutritionVerification;
}

type Mode = "text" | "image";
type DisplayLang = "en" | "ar" | "both";

const STREAM_PHASES = [
  "Looking up in food library...",
  "Calculating full nutrition profile...",
  "Researching cultural context...",
  "Writing step-by-step recipe...",
  "Building health insights...",
  "Finalizing analysis...",
];

const EXAMPLES = ["حمص", "منسف", "طاجين دجاج", "كبسة", "Ramen", "Biryani", "Pad Thai", "Moussaka"];

function HealthGrade({ n }: { n: Nutrition }) {
  const score = Math.min(100, Math.max(0,
    50
    + Math.min(20, (n.protein / 2))
    + Math.min(15, ((n.fiber ?? 0) * 3))
    - Math.min(25, ((n.fat > 20 ? n.fat - 20 : 0) * 0.8))
    - Math.min(20, ((n.sodium ?? 0) > 600 ? (n.sodium! - 600) / 50 : 0))
    - Math.min(15, ((n.calories > 600 ? (n.calories - 600) / 30 : 0)))
  ));
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";
  const color = score >= 80 ? "text-green-500 bg-green-500/10 border-green-500/30"
    : score >= 65 ? "text-lime-500 bg-lime-500/10 border-lime-500/30"
    : score >= 50 ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
    : score >= 35 ? "text-orange-500 bg-orange-500/10 border-orange-500/30"
    : "text-red-500 bg-red-500/10 border-red-500/30";
  const label = score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Moderate" : score >= 35 ? "Fair" : "Poor";
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-3 min-w-[64px] ${color}`}>
      <span className="text-3xl font-black">{grade}</span>
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </div>
  );
}

function MacroDonut({ n }: { n: Nutrition }) {
  const p = Number(n.protein) || 0;
  const c = Number(n.carbs) || 0;
  const f = Number(n.fat) || 0;
  const cal = p * 4 + c * 4 + f * 9;
  if (cal === 0) return null;
  const pct = { protein: (p * 4) / cal, carbs: (c * 4) / cal, fat: (f * 9) / cal };
  const circumference = 2 * Math.PI * 15.9;
  let offset = 0;
  const segs = [
    { pct: pct.protein, color: "#3b82f6" },
    { pct: pct.carbs, color: "#f59e0b" },
    { pct: pct.fat, color: "#ef4444" },
  ];
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
        {segs.map((seg, i) => {
          const len = seg.pct * circumference;
          const el = (
            <circle key={i} cx="18" cy="18" r="15.9"
              fill="none" stroke={seg.color} strokeWidth="3.5"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={`${-offset}`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none">{Math.round(Number(n.calories) || 0)}</span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5">kcal</span>
      </div>
    </div>
  );
}

function DVBar({ label, value, dv, unit, color }: { label: string; value: number; dv?: number; unit: string; color: string }) {
  const pct = dv ?? 0;
  const clamp = Math.min(pct, 120);
  const dvColor = pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : color;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${dvColor} rounded-full transition-all`} style={{ width: `${clamp}%` }} />
      </div>
      <span className="font-semibold w-28 text-right text-muted-foreground shrink-0">
        {value}{unit} {dv !== undefined && dv > 0 ? <span className={pct >= 100 ? "text-green-500 font-bold" : ""}>{pct}% DV</span> : null}
      </span>
    </div>
  );
}

const DIETARY_LABELS: Record<string, { label: string; emoji: string }> = {
  vegan: { label: "Vegan", emoji: "🌱" },
  vegetarian: { label: "Vegetarian", emoji: "🥦" },
  glutenFree: { label: "Gluten-Free", emoji: "🌾" },
  dairyFree: { label: "Dairy-Free", emoji: "🥛" },
  halal: { label: "Halal", emoji: "☪️" },
  kosher: { label: "Kosher", emoji: "✡️" },
  keto: { label: "Keto", emoji: "🥑" },
  paleo: { label: "Paleo", emoji: "🦴" },
  lowCarb: { label: "Low-Carb", emoji: "📉" },
  highProtein: { label: "High-Protein", emoji: "💪" },
};

const FITNESS_LABELS: Record<string, string> = {
  "weight-loss": "⚖️ Weight Loss",
  "muscle-gain": "💪 Muscle Gain",
  "endurance": "🏃 Endurance",
  "general-health": "❤️ General Health",
  "heart-health": "🫀 Heart Health",
  "energy": "⚡ Energy Boost",
};

const BEST_TIME_LABELS: Record<string, { label: string; color: string }> = {
  breakfast: { label: "Breakfast", color: "text-orange-500" },
  lunch: { label: "Lunch", color: "text-amber-500" },
  dinner: { label: "Dinner", color: "text-blue-500" },
  snack: { label: "Snack", color: "text-green-500" },
  any: { label: "Any Time", color: "text-muted-foreground" },
};

const difficultyColor: Record<string, string> = {
  easy: "text-green-500",
  medium: "text-amber-500",
  hard: "text-red-500",
};

function addToTracker(result: AnalysisResult): boolean {
  try {
    const entry = {
      id: `analyzed_${Date.now()}`,
      nameEn: result.foodNameEn,
      nameAr: result.foodNameAr,
      nutrition: {
        calories: Number(result.nutrition?.calories) || 0,
        protein: Number(result.nutrition?.protein) || 0,
        carbs: Number(result.nutrition?.carbs) || 0,
        fat: Number(result.nutrition?.fat) || 0,
        fiber: Number(result.nutrition?.fiber) || 0,
        sodium: Number(result.nutrition?.sodium) || 0,
      },
      loggedAt: new Date().toISOString(),
      portion: 1,
    };
    const existing = JSON.parse(localStorage.getItem("nutrillm_tracker") ?? "[]");
    localStorage.setItem("nutrillm_tracker", JSON.stringify([...existing, entry]));
    return true;
  } catch {
    return false;
  }
}

export default function Analyze() {
  const searchStr = useSearch();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("text");
  const [food, setFood] = useState("");
  const [servingSize, setServingSize] = useState("1 serving");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<DisplayLang>("both");
  const [image, setImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const fileRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [trackerAdded, setTrackerAdded] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const foodParam = params.get("food");
    if (foodParam?.trim()) {
      setFood(foodParam.trim());
      setTimeout(() => analyzeTextWithFood(foodParam.trim()), 100);
    }
  }, []);

  useEffect(() => {
    if (!loading) { setElapsedSecs(0); return; }
    setElapsedSecs(0);
    const start = Date.now();
    const tick = setInterval(() => setElapsedSecs(Math.floor((Date.now() - start) / 1000)), 1000);
    const phase = setInterval(() => setPhaseIdx(p => Math.min(p + 1, STREAM_PHASES.length - 1)), 4500);
    return () => { clearInterval(tick); clearInterval(phase); };
  }, [loading]);

  async function analyzeTextWithFood(foodName: string) {
    if (!foodName.trim()) return;
    setLoading(true); setError(""); setResult(null); setPhaseIdx(0); setTrackerAdded(false);
    navigate("/analyze");

    try {
      const [catalogResp, streamResp] = await Promise.all([
        fetch(`/api/foods?search=${encodeURIComponent(foodName)}`),
        fetch("/api/nutrition/analyze/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ food: foodName.trim(), servingSize }),
        }),
      ]);

      const catalogData = await catalogResp.json();
      const catalogFood = catalogData.foods?.[0] as CatalogFood | undefined;

      if (!streamResp.ok || !streamResp.body) throw new Error("Stream failed");
      const reader = streamResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "status") setStatusMsg(event.message);
            else if (event.type === "done" && event.result) {
              const analyzed = event.result as AnalysisResult;
              if (catalogFood && !analyzed.imageUrl) analyzed.imageUrl = catalogFood.imageUrl;
              if (!analyzed.ingredients?.length && catalogFood?.ingredients) analyzed.ingredients = catalogFood.ingredients;
              if (!analyzed.allergens?.length && catalogFood?.allergens) analyzed.allergens = catalogFood.allergens;
              if (!analyzed.cookTime && catalogFood?.cookTime) analyzed.cookTime = catalogFood.cookTime;
              if (!analyzed.difficulty && catalogFood?.difficulty) analyzed.difficulty = catalogFood.difficulty;
              setResult(analyzed);
              setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            } else if (event.type === "error") {
              setError(event.message || "Analysis failed. Please try again.");
            }
          } catch {}
        }
      }
    } catch {
      setError("Could not analyze this food. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeImage() {
    if (!image) return;
    setLoading(true); setError(""); setResult(null); setPhaseIdx(0); setTrackerAdded(false);
    try {
      const base64 = image.split(",")[1];
      const resp = await fetch("/api/nutrition/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: imageMime }),
      });
      if (!resp.ok) throw new Error("Vision failed");
      setResult(await resp.json());
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Could not analyze this image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto py-5 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-4">

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Analyze Any Dish</h1>
          <p className="text-muted-foreground mt-1 text-sm">Full nutrition · step-by-step recipe · cultural context</p>
        </div>

        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
          <button onClick={() => setMode("text")} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === "text" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Search className="h-4 w-4" /> Text Input
          </button>
          <button onClick={() => setMode("image")} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === "image" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Camera className="h-4 w-4" /> Image Vision
          </button>
        </div>

        {mode === "text" ? (
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <input
              value={food}
              onChange={e => setFood(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyzeTextWithFood(food)}
              placeholder="e.g. حمص، منسف، طاجين، Biryani, Ramen, Pad Thai…"
              className="w-full bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-muted-foreground/60"
              dir="auto"
              disabled={loading}
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t border-border/30 pt-3">
              <div className="flex items-center gap-2 w-full sm:flex-1">
                <label className="text-xs text-muted-foreground shrink-0">Serving:</label>
                <input
                  value={servingSize}
                  onChange={e => setServingSize(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-b border-border/30 focus:outline-none focus:border-primary pb-0.5"
                  placeholder="1 serving, 200g, 1 bowl..."
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => analyzeTextWithFood(food)}
                disabled={!food.trim() || loading}
                className="w-full sm:w-auto px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setFood(ex); analyzeTextWithFood(ex); }} disabled={loading}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground disabled:opacity-40">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            {!image ? (
              <div
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-xl p-8 sm:p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">Drop a food image or click to upload</p>
                <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP supported</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="relative">
                <img src={image} alt="Food" className="w-full rounded-xl object-cover max-h-64" />
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"><X className="h-4 w-4" /></button>
              </div>
            )}
            {image && (
              <button onClick={analyzeImage} disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {loading ? "Analyzing with Vision AI..." : "Analyze with Vision"}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono text-muted-foreground">{elapsedSecs}s</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm">{statusMsg || STREAM_PHASES[phaseIdx]}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {elapsedSecs < 5 ? "Checking food library..." : elapsedSecs < 15 ? "AI analysis in progress..." : "Almost done!"}
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {STREAM_PHASES.slice(0, 6).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === phaseIdx ? "w-6 bg-primary" : i < phaseIdx ? "w-3 bg-primary/40" : "w-3 bg-muted"}`} />
              ))}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3" ref={resultRef}>

            {/* Hero Image */}
            {result.imageUrl && (
              <div className="relative">
                <img src={result.imageUrl} alt={result.foodNameEn} className="w-full h-52 object-cover rounded-2xl" onError={e => (e.currentTarget.style.display = "none")} />
                {result.source === "nutri-llm-library" && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-green-600/90 text-white font-medium">✓ Library Data</span>
                )}
              </div>
            )}

            {/* Header Card */}
            <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold leading-tight">{result.foodNameEn}</h2>
                  {result.foodNameAr && result.foodNameAr !== result.foodNameEn && (
                    <p className="text-base sm:text-lg text-primary font-medium mt-1" dir="rtl">{result.foodNameAr}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                  {(["en", "ar", "both"] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors ${lang === l ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:border-primary/50"}`}>
                      {l === "en" ? "EN" : l === "ar" ? "AR" : "Both"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-1.5">
                {result.cuisine && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30"><Globe2 className="h-3 w-3" /> {result.cuisine}</span>}
                {result.region && <span className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30">{result.region}</span>}
                {result.category && <span className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 capitalize">{result.category}</span>}
                {(result.prepTime || result.cookTime) && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30">
                    <Clock className="h-3 w-3" />
                    {result.prepTime ? `${result.prepTime}min prep` : ""}{result.prepTime && result.cookTime ? " + " : ""}{result.cookTime ? `${result.cookTime}min cook` : ""}
                  </span>
                )}
                {result.difficulty && (
                  <span className={`text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 capitalize font-medium ${difficultyColor[result.difficulty] ?? ""}`}>
                    {result.difficulty}
                  </span>
                )}
                {result.bestTimeToEat && result.bestTimeToEat !== "any" && (
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 ${BEST_TIME_LABELS[result.bestTimeToEat]?.color ?? ""}`}>
                    <Star className="h-3 w-3" /> Best: {BEST_TIME_LABELS[result.bestTimeToEat]?.label ?? result.bestTimeToEat}
                  </span>
                )}
              </div>

              {(result.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.tags!.map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary capitalize">{t}</span>
                  ))}
                </div>
              )}

              {(result.identifiedFoods ?? []).length > 0 && (
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/40">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Identified in image</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">{result.identifiedFoods!.join(", ")}</p>
                </div>
              )}

              {(result.allergens ?? []).length > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Contains: {result.allergens!.join(", ")}</span>
                </div>
              )}

              {(result.warnings ?? []).length > 0 && (
                <div className="space-y-1.5">
                  {result.warnings!.map((w, i) => (
                    <div key={i} className="flex gap-2 items-start p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40">
                      <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">{w}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add to Tracker button */}
              <button
                onClick={() => { const ok = addToTracker(result); setTrackerAdded(ok); }}
                disabled={trackerAdded}
                className={`w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-colors ${
                  trackerAdded
                    ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                    : "border-primary/30 text-primary hover:bg-primary/5"
                }`}
              >
                {trackerAdded ? <><Check className="h-4 w-4" /> Added to Daily Tracker</> : <><PlusCircle className="h-4 w-4" /> Add to Daily Tracker</>}
              </button>
            </div>

            {/* Nutrition Facts */}
            {result.nutrition && (
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-3 border-b border-border/30">
                  <span className="font-bold text-sm sm:text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Nutrition Facts</span>
                  <span className="text-xs text-muted-foreground">{result.servingSize ?? "1 serving"}</span>
                </div>
                <div className="p-4 space-y-4">

                  {/* Hero row */}
                  <div className="flex items-center gap-4">
                    <MacroDonut n={result.nutrition} />
                    <HealthGrade n={result.nutrition} />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
                        <FlameIcon className="h-3.5 w-3.5 text-orange-500 mb-0.5" />
                        <span className="text-sm font-bold">{Math.round(Number(result.nutrition.calories) || 0)}</span>
                        <span className="text-[9px] text-muted-foreground">Calories</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
                        <Zap className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                        <span className="text-sm font-bold">{Number(result.nutrition.protein) || 0}g</span>
                        <span className="text-[9px] text-muted-foreground">Protein</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro split legend */}
                  <div className="flex gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Protein {Number(result.nutrition.protein) || 0}g</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Carbs {Number(result.nutrition.carbs) || 0}g</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Fat {Number(result.nutrition.fat) || 0}g</span>
                  </div>

                  {/* Glycemic Index badge */}
                  {(Number(result.nutrition.glycemicIndex) || 0) > 0 && (
                    <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                      Number(result.nutrition.glycemicIndex) < 55 ? "bg-green-500/10 text-green-600 border border-green-500/20" :
                      Number(result.nutrition.glycemicIndex) < 70 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                      "bg-red-500/10 text-red-600 border border-red-500/20"
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      Glycemic Index: {result.nutrition.glycemicIndex} — {Number(result.nutrition.glycemicIndex) < 55 ? "Low GI" : Number(result.nutrition.glycemicIndex) < 70 ? "Medium GI" : "High GI"}
                    </div>
                  )}

                  {/* Macros with DV bars */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Macronutrients</p>
                    <DVBar label="Calories" value={Math.round(Number(result.nutrition.calories) || 0)} dv={result.dailyValues?.calories} unit=" kcal" color="bg-orange-500" />
                    <DVBar label="Protein" value={Number(result.nutrition.protein) || 0} dv={result.dailyValues?.protein} unit="g" color="bg-blue-500" />
                    <DVBar label="Carbs" value={Number(result.nutrition.carbs) || 0} dv={result.dailyValues?.carbs} unit="g" color="bg-amber-500" />
                    <DVBar label="Fat" value={Number(result.nutrition.fat) || 0} dv={result.dailyValues?.fat} unit="g" color="bg-red-500" />
                    {(Number(result.nutrition.saturatedFat) || 0) > 0 && (
                      <DVBar label="Sat. Fat" value={Number(result.nutrition.saturatedFat) || 0} unit="g" color="bg-red-400" />
                    )}
                    {(Number(result.nutrition.fiber) || 0) > 0 && (
                      <DVBar label="Fiber" value={Number(result.nutrition.fiber) || 0} dv={result.dailyValues?.fiber} unit="g" color="bg-green-500" />
                    )}
                    {(Number(result.nutrition.sugar) || 0) > 0 && (
                      <DVBar label="Sugar" value={Number(result.nutrition.sugar) || 0} unit="g" color="bg-pink-500" />
                    )}
                  </div>

                  {/* Micronutrients */}
                  {((Number(result.nutrition.sodium) || 0) > 0 || (Number(result.nutrition.potassium) || 0) > 0 ||
                    (Number(result.nutrition.calcium) || 0) > 0 || (Number(result.nutrition.iron) || 0) > 0 ||
                    (Number(result.nutrition.cholesterol) || 0) > 0) && (
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Minerals</p>
                      {(Number(result.nutrition.sodium) || 0) > 0 && (
                        <DVBar label="Sodium" value={Number(result.nutrition.sodium) || 0} dv={result.dailyValues?.sodium} unit="mg" color={Number(result.nutrition.sodium) > 800 ? "bg-red-500" : "bg-blue-500"} />
                      )}
                      {(Number(result.nutrition.potassium) || 0) > 0 && (
                        <DVBar label="Potassium" value={Number(result.nutrition.potassium) || 0} dv={result.dailyValues?.potassium} unit="mg" color="bg-purple-500" />
                      )}
                      {(Number(result.nutrition.calcium) || 0) > 0 && (
                        <DVBar label="Calcium" value={Number(result.nutrition.calcium) || 0} dv={result.dailyValues?.calcium} unit="mg" color="bg-slate-500" />
                      )}
                      {(Number(result.nutrition.iron) || 0) > 0 && (
                        <DVBar label="Iron" value={Number(result.nutrition.iron) || 0} dv={result.dailyValues?.iron} unit="mg" color="bg-red-700" />
                      )}
                      {(Number(result.nutrition.cholesterol) || 0) > 0 && (
                        <DVBar label="Cholesterol" value={Number(result.nutrition.cholesterol) || 0} unit="mg" color="bg-yellow-600" />
                      )}
                    </div>
                  )}

                  {/* Vitamins */}
                  {((Number(result.nutrition.vitaminC) || 0) > 0 || (Number(result.nutrition.vitaminA) || 0) > 0 ||
                    (Number(result.nutrition.vitaminD) || 0) > 0 || (Number(result.nutrition.vitaminB12) || 0) > 0 ||
                    (Number(result.nutrition.omega3) || 0) > 0) && (
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vitamins & Omega</p>
                      {(Number(result.nutrition.vitaminC) || 0) > 0 && (
                        <DVBar label="Vitamin C" value={Number(result.nutrition.vitaminC) || 0} dv={result.dailyValues?.vitaminC} unit="mg" color="bg-orange-400" />
                      )}
                      {(Number(result.nutrition.vitaminA) || 0) > 0 && (
                        <DVBar label="Vitamin A" value={Number(result.nutrition.vitaminA) || 0} dv={result.dailyValues?.vitaminA} unit="mcg" color="bg-yellow-500" />
                      )}
                      {(Number(result.nutrition.vitaminD) || 0) > 0 && (
                        <DVBar label="Vitamin D" value={Number(result.nutrition.vitaminD) || 0} dv={result.dailyValues?.vitaminD} unit="mcg" color="bg-yellow-400" />
                      )}
                      {(Number(result.nutrition.vitaminB12) || 0) > 0 && (
                        <DVBar label="Vitamin B12" value={Number(result.nutrition.vitaminB12) || 0} unit="mcg" color="bg-red-400" />
                      )}
                      {(Number(result.nutrition.omega3) || 0) > 0 && (
                        <DVBar label="Omega-3" value={Number(result.nutrition.omega3) || 0} unit="g" color="bg-blue-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Compatibility */}
            {result.dietaryCompatibility && Object.keys(result.dietaryCompatibility).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Dietary Compatibility</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.dietaryCompatibility).map(([key, val]) => {
                    const meta = DIETARY_LABELS[key];
                    if (!meta) return null;
                    return (
                      <div key={key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                        val ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" : "bg-muted/30 border-border/30 text-muted-foreground line-through opacity-50"
                      }`}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fitness Goals */}
            {(result.fitnessGoals ?? []).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                <p className="font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /> Good For</p>
                <div className="flex flex-wrap gap-2">
                  {result.fitnessGoals!.map(g => (
                    <span key={g} className="text-xs px-2.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-medium">
                      {FITNESS_LABELS[g] ?? g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {(result.ingredients ?? []).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><Apple className="h-4 w-4 text-green-500" /> Ingredients ({result.ingredients!.length})</p>
                <div className="flex flex-wrap gap-2">
                  {result.ingredients!.map((ing, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-muted/20 capitalize">{ing}</span>
                  ))}
                </div>
                {result.cookingMethod && (
                  <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">{result.cookingMethod}</p>
                )}
              </div>
            )}

            {/* Step-by-Step Recipe — cookbook style */}
            {(result.cookingSteps ?? []).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><ListOrdered className="h-4 w-4 text-amber-500" /> Step-by-Step Recipe</p>
                <ol className="space-y-3">
                  {result.cookingSteps!.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">{i + 1}</span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.replace(/^Step \d+:\s*/i, "")}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Serving & Storage */}
            {((result.servingSuggestions ?? []).length > 0 || result.storageTips) && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> Serving & Storage</p>
                {(result.servingSuggestions ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">Serving Suggestions</p>
                    {result.servingSuggestions!.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary font-bold shrink-0">·</span> {s}
                      </p>
                    ))}
                  </div>
                )}
                {result.storageTips && (
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/40">
                    <Refrigerator className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-400">{result.storageTips}</p>
                  </div>
                )}
              </div>
            )}

            {/* Health Insights */}
            {(result.healthInsights ?? []).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                <p className="font-semibold text-sm flex items-center gap-2"><Leaf className="h-4 w-4 text-green-500" /> Health Insights</p>
                <div className="space-y-2">
                  {(lang === "en" || lang === "both") && result.healthInsights!.filter(Boolean).map((h, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                      <p>{h}</p>
                    </div>
                  ))}
                  {(lang === "ar" || lang === "both") && (result.healthInsightsAr ?? []).filter(Boolean).map((h, i) => (
                    <div key={`ar-${i}`} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed p-2.5 rounded-lg bg-green-500/5 border border-green-500/10 text-right" dir="rtl">
                      <span className="text-green-500 font-bold shrink-0">✓</span>
                      <p>{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Context */}
            {(result.culturalContext || result.originStory) && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                <p className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Cultural Context</p>
                {result.originStory && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-semibold text-primary mb-1">Origin Story</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.originStory}</p>
                  </div>
                )}
                {(lang === "en" || lang === "both") && result.culturalContext && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.culturalContext}</p>
                )}
                {(lang === "ar" || lang === "both") && result.culturalContextAr && (
                  <p className="text-sm text-muted-foreground text-right leading-relaxed mt-2 pt-2 border-t border-border/20" dir="rtl">{result.culturalContextAr}</p>
                )}
              </div>
            )}

            {/* Regional Variations */}
            {(result.regionalVariations ?? []).filter(v => v.region && v.description).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /> Regional Variations</p>
                <div className="space-y-3">
                  {result.regionalVariations!.filter(v => v.region && v.description).map((v, i) => (
                    <div key={i} className="border-l-2 border-primary/40 pl-3 space-y-1">
                      <p className="font-medium text-sm">{v.region}</p>
                      {(lang === "en" || lang === "both") && <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>}
                      {(lang === "ar" || lang === "both") && v.descriptionAr && (
                        <p className="text-xs text-muted-foreground leading-relaxed text-right" dir="rtl">{v.descriptionAr}</p>
                      )}
                      {(v.keyDifferences ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.keyDifferences!.map((d, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20 text-primary">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition verification against USDA reference data (AI-analysis path only) */}
            {result.nutritionVerification && (
              <div
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  result.nutritionVerification.status === "verified"
                    ? "border-green-200/50 bg-green-50 dark:bg-green-950/20"
                    : result.nutritionVerification.status === "deviation-flagged"
                    ? "border-amber-200/50 bg-amber-50 dark:bg-amber-950/20"
                    : "border-border/50 bg-card"
                }`}
              >
                <ShieldCheck
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    result.nutritionVerification.status === "verified"
                      ? "text-green-600"
                      : result.nutritionVerification.status === "deviation-flagged"
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm">
                    {result.nutritionVerification.status === "verified" && "Verified against USDA reference data"}
                    {result.nutritionVerification.status === "deviation-flagged" && "Nutrition estimate flagged for review"}
                    {(result.nutritionVerification.status === "no-match" ||
                      result.nutritionVerification.status === "skipped-no-api-key" ||
                      result.nutritionVerification.status === "error") && "Unverified AI estimate"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{result.nutritionVerification.note}</p>
                </div>
              </div>
            )}

            {/* Drink Pairings */}
            {result.drinkPairing && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-2"><Wine className="h-4 w-4 text-purple-500" /> Drink Pairings</p>
                <div className="grid grid-cols-1 gap-2">
                  {result.drinkPairing.wine && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/40">
                      <span className="text-xl shrink-0">🍷</span>
                      <div><p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wide">Wine</p><p className="text-sm">{result.drinkPairing.wine}</p></div>
                    </div>
                  )}
                  {result.drinkPairing.beer && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40">
                      <span className="text-xl shrink-0">🍺</span>
                      <div><p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">Beer</p><p className="text-sm">{result.drinkPairing.beer}</p></div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/40">
                    <span className="text-xl shrink-0">🧃</span>
                    <div><p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">Non-alcoholic</p><p className="text-sm">{result.drinkPairing.nonAlcoholic}</p></div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { const ok = addToTracker(result); setTrackerAdded(ok); }}
                disabled={trackerAdded}
                className={`py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-colors ${
                  trackerAdded ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" : "border-primary/30 text-primary hover:bg-primary/5"
                }`}
              >
                {trackerAdded ? <><Check className="h-4 w-4" /> Logged!</> : <><PlusCircle className="h-4 w-4" /> Log to Tracker</>}
              </button>
              <button
                onClick={() => window.open(`/compare?a=${encodeURIComponent(result.foodNameEn)}`, "_self")}
                className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
              >
                <Heart className="h-4 w-4" /> Compare
              </button>
            </div>

            <button
              onClick={() => { setResult(null); setFood(""); setError(""); setTrackerAdded(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full py-3 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Analyze another dish
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
