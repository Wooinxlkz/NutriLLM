import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Database, Terminal, Search, Sparkles, Activity } from "lucide-react";
import { useAnalyzeFood } from "@workspace/api-client-react";
import { useState } from "react";

export default function Home() {
  const [food, setFood] = useState("");
  const analyze = useAnalyzeFood();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim()) return;
    analyze.mutate({ data: { food } });
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center bg-card border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="relative z-10 max-w-[800px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground">
              Food Intelligence for <span className="text-primary italic">MENA Cuisine</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto font-mono">
              The first AI model built specifically to understand Arabic food culture, regional variations, and precise nutritional data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/analyze">
                <Button size="lg" className="text-lg h-14 px-8 rounded-none">
                  Open Analyzer <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="text-lg h-14 px-8 rounded-none border-primary/20 hover:bg-primary/5">
                  Read API Docs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 px-6 lg:px-8 bg-background">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-serif font-bold">Try NutriLLM</h2>
              <p className="text-muted-foreground font-mono">Understand any MENA dish instantly.</p>
            </div>

            <div className="bg-card border border-border p-6 shadow-xl animate-in zoom-in-95 duration-700">
              <form onSubmit={handleAnalyze} className="flex gap-4">
                <Input
                  type="text"
                  placeholder="e.g. طاجين دجاج مع الزيتون or Chicken Tagine"
                  className="h-14 text-lg bg-background"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  dir="auto"
                />
                <Button type="submit" disabled={analyze.isPending} className="h-14 px-8 rounded-none">
                  {analyze.isPending ? <Activity className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
              </form>

              {analyze.data && (
                <div className="mt-8 grid md:grid-cols-2 gap-8 border-t border-border pt-8 animate-in slide-in-from-top-4">
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl">{analyze.data.foodNameEn}</h3>
                    <h3 className="font-bold text-2xl font-serif text-right" dir="rtl">{analyze.data.foodNameAr}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-mono">{analyze.data.cuisine}</span>
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-sm font-mono">{analyze.data.category}</span>
                    </div>
                  </div>
                  <div className="bg-background p-6 border border-border/50">
                    <h4 className="font-mono text-sm text-muted-foreground mb-4 uppercase tracking-wider">Nutrition per {analyze.data.servingSize || 'serving'}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-3xl font-bold text-primary">{analyze.data.nutrition.calories}</div>
                        <div className="text-sm text-muted-foreground">Calories</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{analyze.data.nutrition.protein}g</div>
                        <div className="text-sm text-muted-foreground">Protein</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{analyze.data.nutrition.carbs}g</div>
                        <div className="text-sm text-muted-foreground">Carbs</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{analyze.data.nutrition.fat}g</div>
                        <div className="text-sm text-muted-foreground">Fat</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section className="py-24 px-6 lg:px-8 bg-muted/30 border-y border-border/40">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-serif font-bold">The NutriLLM Ecosystem</h2>
              <p className="text-muted-foreground font-mono">From dataset to interface, a complete stack.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4 p-6 bg-card border border-border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">HuggingFace Dataset</h3>
                <p className="text-sm text-muted-foreground">Curated nutritional profiles for 10k+ MENA foods.</p>
              </div>
              <div className="space-y-4 p-6 bg-card border border-border shadow-sm">
                <div className="h-12 w-12 bg-secondary/10 text-secondary flex items-center justify-center rounded">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">AI Model</h3>
                <p className="text-sm text-muted-foreground">Fine-tuned to understand cultural context and Arabic text.</p>
              </div>
              <div className="space-y-4 p-6 bg-card border border-border shadow-sm">
                <div className="h-12 w-12 bg-chart-4/10 text-chart-4 flex items-center justify-center rounded">
                  <Terminal className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">PyPI Library</h3>
                <p className="text-sm text-muted-foreground">Native Python bindings for data scientists.</p>
              </div>
              <div className="space-y-4 p-6 bg-card border border-border shadow-sm border-primary">
                <div className="h-12 w-12 bg-primary flex items-center justify-center rounded text-primary-foreground">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">Web API & App</h3>
                <p className="text-sm text-muted-foreground">This platform: REST API and interactive explorer.</p>
              </div>
            </div>

            <div className="bg-foreground text-background p-6 md:p-8 rounded-none font-mono text-sm overflow-x-auto">
              <pre><code>{`from nutri_llm import analyze\n\n# Understands Arabic and English\nresult = analyze("طاجين دجاج مع الزيتون")\n\nprint(result.nutrition.calories)\n# => 420\n\nprint(result.cultural_context)\n# => "A classic Moroccan dish traditionally slow-cooked..."`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
