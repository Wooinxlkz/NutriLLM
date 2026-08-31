import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Docs() {
  return (
    <Layout>
      <div className="flex-1 px-6 lg:px-8 py-12 md:py-16 bg-background">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-bold text-foreground">API Documentation</h1>
            <p className="text-muted-foreground font-mono text-lg">Integrate NutriLLM into your applications.</p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Overview</h2>
              <p className="text-foreground/80 leading-relaxed">
                NutriLLM provides a powerful REST API for analyzing MENA cuisine. It accepts both English and Arabic food names, automatically detects the language, and returns detailed nutritional profiles, cultural context, and regional variations.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Analyze Endpoint</h2>
              <p className="text-foreground/80">
                Analyze a food item to get its nutritional data and cultural context.
              </p>

              <div className="bg-card border border-border overflow-hidden">
                <div className="flex items-center px-4 py-3 bg-muted/50 border-b border-border">
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 mr-3">POST</Badge>
                  <code className="font-mono text-sm">/api/nutrition/analyze</code>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                    <pre className="bg-background p-4 rounded border border-border text-sm font-mono overflow-x-auto">
{`{
  "food": "طاجين دجاج مع الزيتون",
  "servingSize": "1 plate" // optional
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python (PyPI)</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl" className="mt-4">
                  <div className="relative group">
                    <pre className="bg-[#1a1b26] text-[#a9b1d6] p-6 rounded border border-border text-sm font-mono overflow-x-auto">
{`curl -X POST https://api.nutrillm.com/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"food": "chicken tagine"}'`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <div className="relative group">
                    <pre className="bg-[#1a1b26] text-[#a9b1d6] p-6 rounded border border-border text-sm font-mono overflow-x-auto">
{`from nutri_llm import Client

client = Client(api_key="YOUR_API_KEY")

# Analyze a food (supports Arabic and English)
result = client.analyze("طاجين دجاج مع الزيتون")

print(f"Calories: {result.nutrition.calories}")
print(f"Cultural Context: {result.cultural_context}")
print(f"Regional Variations: {len(result.regional_variations)}")`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="js" className="mt-4">
                  <div className="relative group">
                    <pre className="bg-[#1a1b26] text-[#a9b1d6] p-6 rounded border border-border text-sm font-mono overflow-x-auto">
{`const response = await fetch('https://api.nutrillm.com/v1/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    food: 'chicken tagine'
  })
});

const data = await response.json();
console.log(data.nutrition.calories);`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            <section className="space-y-6 pt-8">
              <h2 className="text-2xl font-bold border-b border-border pb-2">Response Format</h2>
              <div className="bg-[#1a1b26] text-[#a9b1d6] p-6 rounded border border-border text-sm font-mono overflow-x-auto">
{`{
  "id": "1a2b3c4d",
  "food": "طاجين دجاج مع الزيتون",
  "foodNameEn": "Chicken Tagine with Olives",
  "foodNameAr": "طاجين دجاج مع الزيتون",
  "nutrition": {
    "calories": 420,
    "protein": 35.5,
    "carbs": 12.0,
    "fat": 24.5,
    "fiber": 3.2
  },
  "culturalContext": "A classic Moroccan dish...",
  "culturalContextAr": "طبق مغربي كلاسيكي...",
  "regionalVariations": [
    {
      "region": "Algeria",
      "regionAr": "الجزائر",
      "description": "Often made with...",
      "keyDifferences": ["Uses more tomatoes", "Different spice blend"]
    }
  ],
  "cuisine": "Moroccan",
  "category": "main"
}`}
              </div>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}