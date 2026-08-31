<div align="center">

<br/>

# 🥗 NutriLLM

**The first AI food intelligence platform built for MENA cuisine.**

Analyze any dish — in Arabic or English — and get a complete nutrition breakdown, step-by-step recipe, cultural origin story, regional variations, and personalized health insights. Instantly.

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Try_Now-22c55e?style=for-the-badge)](https://nutri-llm--bettyejaap.replit.app)
[![Stars](https://img.shields.io/github/stars/Wooinxlkz/NutriLLM?style=for-the-badge&color=facc15&logo=github)](https://github.com/Wooinxlkz/NutriLLM/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node 24](https://img.shields.io/badge/Node.js-24-5fa04e?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-f69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

<br/>

> Type `حمص` or `Chicken Tagine` — NutriLLM understands both. You get full macros, vitamins, minerals, GI index, allergens, cooking steps, drink pairings, and cultural context. All in seconds.

<br/>

**[🌐 Live App](https://nutri-llm--bettyejaap.replit.app)** · **[📖 API Docs](#-api-reference)** · **[🐛 Report Bug](https://github.com/Wooinxlkz/NutriLLM/issues)** · **[✨ Request Feature](https://github.com/Wooinxlkz/NutriLLM/issues)**

</div>

---

## 📸 Screenshots

<img width="1347" height="630" alt="image" src="https://github.com/user-attachments/assets/911e30bf-808c-4458-afed-e8d81ae1d357" />


---

## ✨ What NutriLLM Does

NutriLLM is not another calorie counter. It's a **full food intelligence stack** — from curated dataset to streaming AI analysis — purpose-built for the cultural richness of Middle Eastern and North African cuisine, while also covering global dishes.

### Core Features

| Feature | Details |
|---|---|
| **🔍 AI Food Analyzer** | Type any dish in Arabic or English, get full nutrition + cultural context via streaming SSE |
| **📷 Vision Analysis** | Upload a food photo — the AI identifies the dish and returns a complete nutrition profile |
| **🥦 Food Catalog** | Searchable database merging a hand-curated MENA library, Nutrition5k, and live OpenFoodFacts |
| **⚖️ Food Comparator** | Side-by-side nutritional comparison of any two dishes with visual bar charts |
| **📅 Daily Tracker** | Log meals by type (breakfast/lunch/dinner/snack), track macros vs. personal goals |
| **🍽️ Community Hub** | Meal planner, cookbook, pantry manager, cooking streaks, recipe DNA, milestones |
| **📡 REST API** | Fully documented JSON API — use NutriLLM as a backend for your own app |
| **🌍 Bilingual** | Full Arabic RTL + English support throughout the UI and data |

### Analysis Depth

Every analysis returns:

- ✅ Full macros: calories, protein, carbs, fat, fiber, sugar, saturated fat, cholesterol
- ✅ Micronutrients: sodium, potassium, calcium, iron, Vitamins C/A/D/B12, Omega-3
- ✅ % Daily Values with visual progress bars
- ✅ Health grade (A–F) with scoring algorithm
- ✅ Macro donut chart
- ✅ Glycemic Index with Low/Medium/High classification
- ✅ Dietary flags: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Halal, Kosher, Keto, Paleo, Low-Carb, High-Protein
- ✅ Fitness goal alignment: Weight Loss, Muscle Gain, Endurance, Heart Health, Energy
- ✅ Step-by-step recipe with numbered cooking steps
- ✅ Serving suggestions & storage tips
- ✅ Drink pairings (wine, beer, non-alcoholic) by cuisine
- ✅ Regional variations across MENA and global cuisines
- ✅ Cultural context & origin story in English and Arabic

---

## 🚀 Quick Start

### Try it now — no setup needed

👉 **[Open the Live App](https://nutri-llm--bettyejaap.replit.app)**

### Run it locally

**Requirements:** Node.js ≥ 24, pnpm, PostgreSQL

```bash
# 1. Clone
git clone https://github.com/Wooinxlkz/NutriLLM.git
cd NutriLLM

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Add your OpenAI API key and database URL to .env

# 4. Push DB schema
pnpm --filter @workspace/db run push

# 5. Start the API server
pnpm --filter @workspace/api-server run dev

# 6. Start the frontend (in a new terminal)
pnpm --filter @workspace/nutri-llm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the analyzer is ready.

---

## 🏗️ Architecture

NutriLLM is a **pnpm monorepo** with cleanly separated packages:

```
NutriLLM/
├── artifacts/
│   ├── nutri-llm/           # React + Vite frontend (Tailwind v4, shadcn/ui, wouter)
│   └── api-server/          # Express 5 backend (TypeScript, Drizzle ORM)
│
├── lib/
│   ├── food-data/           # Static food library (MENA curated + Nutrition5k + OpenFoodFacts)
│   ├── db/                  # PostgreSQL schema + Drizzle ORM
│   ├── api-spec/            # OpenAPI specification (source of truth)
│   ├── api-zod/             # Auto-generated Zod validation schemas (from OpenAPI)
│   ├── api-client-react/    # Auto-generated React Query hooks (from OpenAPI)
│   ├── integrations/        # Shared integration interfaces
│   ├── integrations-openai-ai-react/   # OpenAI client for frontend
│   └── integrations-openai-ai-server/  # OpenAI client for backend (via Replit proxy)
│
└── scripts/                 # Build tooling + post-merge hooks
```

### Data Flow

```
User Input (text / image)
        │
        ▼
  Express API Server
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Local      GPT-5-nano
Catalog    (streaming SSE)
(instant)  (deep analysis)
   │         │
   └────┬────┘
        │
        ▼
  Merged Result
  (catalog enriches AI output)
        │
        ▼
  React Frontend
  (streaming render)
```

---

## 🍛 Food Data

NutriLLM's food library merges three sources, deduplicated by name:

### 1. MENA Curated Library (`lib/food-data/src/mena-foods.ts`)
**96 hand-curated dishes** across the entire MENA region — every entry includes Arabic name, full nutrition, allergens, cook time, difficulty, ingredients, and tags. Entries also carry an optional `country` field (ISO-3166 code) for country-level filtering beyond the broader `region`/`cuisine` strings — see `lib/food-data/src/country-taxonomy.ts`. **Every country in the taxonomy now has real dish coverage — zero are at zero.** Coverage:

| Region | Sample Dishes |
|---|---|
| **Levant** | Hummus حمص, Falafel فلافل, Shawarma شاورما, Tabbouleh تبولة, Fattoush فتوش |
| **North Africa** | Chicken Tagine طاجين, Couscous كسكس, Shakshuka شكشوكة, Chorba Frik شربة فريك (Algeria), Chakhchoukha شخشوخة (Algeria) |
| **Gulf** | Kabsa كبسة, Machboos مجبوس, Harees هريس |
| **Egypt** | Koshari كشري, Ful Medames فول مدمس, Molokhia ملوخية |
| **Desserts** | Knafeh كنافة, Baklava بقلاوة, Maamoul معمول, Zlabia زلابية (Algeria) |

Country-level attribution is real but partial: 36 of the original pre-existing entries were tagged where their cuisine mapped cleanly to one country (e.g. "Egyptian" → Egypt); genuinely cross-border dishes (hummus, falafel — claimed by multiple Levant countries under "Levantine"/"Middle Eastern") were deliberately left untagged rather than guessed (20 entries remain untagged for this reason). All 40 newly added dishes — covering every country that previously had zero or minimal representation (Algeria, Libya, Mauritania, Sudan, Kuwait, Oman, Qatar, plus top-ups for Lebanon, Jordan, Palestine, Syria, Tunisia, Saudi Arabia, UAE, and Bahrain) — are fully tagged.

### 2. World Foods Library (`lib/food-data/src/world-foods.ts`)
**97 global dishes** — Ramen, Biryani, Pad Thai, Carbonara, Tacos, Bibimbap, and more — enabling true global-to-regional comparison.

### 3. Nutrition5k Dataset
15 representative dishes mapped from Google Research's Nutrition5k dataset for research-grade nutritional accuracy.

### 4. OpenFoodFacts Live API
Real-time product search from the world's largest open food database — covers packaged goods and branded products.

### 5. USDA FoodData Central (verification layer, not a library)
Unlike the four sources above, this isn't a browsable library — it's a background sanity check (`lib/food-data/src/usda-verify.ts`) that cross-checks AI-*generated* nutrition estimates (used when a dish isn't in the local library) against real USDA reference data, flagging results that deviate significantly instead of trusting the AI output unconditionally. Optional — see Environment Variables. See NOTICE.md for exactly how it compares values and its known limitations.

---

## 📡 API Reference

The API is driven by an OpenAPI specification (`lib/api-spec`). All types, validation, and React hooks are auto-generated via Orval.

**Base URL:** `https://nutri-llm--bettyejaap.replit.app/api`

### `GET /api/foods` — Search food catalog

```bash
GET /api/foods?search=hummus&limit=10
```

```json
{
  "foods": [
    {
      "id": "sl-hummus",
      "nameEn": "Hummus",
      "nameAr": "حمص",
      "cuisine": "Levantine",
      "region": "Levant",
      "category": "appetizer",
      "nutrition": { "calories": 177, "protein": 8, "carbs": 20, "fat": 8, "fiber": 6, "sodium": 300 },
      "tags": ["vegan", "gluten-free", "high-fiber", "mezze"],
      "allergens": ["sesame"],
      "imageUrl": "https://..."
    }
  ]
}
```

### `POST /api/nutrition/analyze` — Analyze a dish

```bash
curl -X POST .../api/nutrition/analyze \
  -H "Content-Type: application/json" \
  -d '{"food": "منسف", "servingSize": "1 bowl"}'
```

### `POST /api/nutrition/analyze/stream` — Streaming analysis (SSE)

Same as above, but streams status events in real time:

```javascript
const res = await fetch('/api/nutrition/analyze/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ food: 'طاجين دجاج', servingSize: '1 serving' })
});

const reader = res.body.getReader();
// Stream events:
// { type: 'status', message: 'Looking up in food library...' }
// { type: 'done',   result: { foodNameEn, foodNameAr, nutrition, ... } }
// { type: 'error',  message: '...' }
```

### `POST /api/nutrition/analyze-image` — Vision analysis

```bash
curl -X POST .../api/nutrition/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "<base64>", "mimeType": "image/jpeg"}'
```

### `GET /api/nutrition/history` — Analysis history

Returns the last 50 analyses stored in the database.

### `GET /api/health` — Health check

---

## 🖥️ Frontend Routes

| Route | Description |
|---|---|
| `/` | Home — hero, live demo widget, ecosystem overview |
| `/analyze` | Full analyzer — text input, image upload, streaming results |
| `/foods` | Browsable food catalog with search and filters |
| `/compare` | Side-by-side nutritional comparison of two dishes |
| `/tracker` | Daily food log with meal types and macro goals |
| `/hub` | Community hub — meal planner, cookbook, pantry, cook log, streaks, milestones |
| `/docs` | Interactive API documentation |

---

## ⚙️ Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-...

# PostgreSQL (Drizzle ORM)
DATABASE_URL=postgresql://user:password@host:5432/nutrillm

# Optional
PORT=3000

# Optional — enables real-data sanity-checking of AI-generated nutrition
# estimates (for dishes not in the local library) against USDA FoodData
# Central. Free, no cost — sign up at https://fdc.nal.usda.gov/api-key-signup.
# If unset, that verification step is skipped entirely and the AI estimate
# is used as-is; nothing else breaks. See NOTICE.md for exactly how this
# check works and its limitations.
USDA_API_KEY=
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Routing** | Wouter |
| **State / Data Fetching** | TanStack Query v5 (auto-generated hooks via Orval) |
| **Backend** | Express 5, Node.js 24, TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |
| **Validation** | Zod v4, drizzle-zod |
| **AI** | OpenAI GPT-5-nano (streaming SSE + vision) |
| **API Codegen** | Orval (OpenAPI → Zod schemas + React Query hooks) |
| **Build** | esbuild, pnpm workspaces |
| **Hosting** | Replit |

---

## 🗺️ Roadmap

- [x] AI text analysis with streaming SSE
- [x] Vision / image analysis
- [x] 100+ curated MENA + world foods library
- [x] OpenFoodFacts live integration
- [x] Food comparator
- [x] Daily macro tracker
- [x] Community hub (meal planner, cookbook, pantry, cook log, streaks)
- [x] Full Arabic RTL bilingual support
- [x] REST API with OpenAPI spec + auto-generated client
- [x] Country-level food taxonomy (beyond broad region/cuisine strings)
- [x] USDA FoodData Central verification layer for AI-generated nutrition estimates
- [ ] 📦 `nutri-llm` Python package published on PyPI
- [ ] 🤗 MENA foods dataset published on HuggingFace
- [ ] 🔐 User accounts and persistent history
- [ ] 📱 React Native mobile app
- [ ] 📸 Barcode scanner integration
- [ ] 🌐 Multi-language support (French, Turkish, Farsi)
- [ ] 🧬 Fine-tuned model on MENA nutrition data

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/your-feature`
5. Open a **Pull Request**

### Good first contributions

- Add dishes to `lib/food-data/src/mena-foods.ts` or `world-foods.ts`
- Improve Arabic translations in the UI
- Add a new cuisine to the drink pairings map in `artifacts/api-server/src/routes/nutrition.ts`
- Write integration tests for the food catalog search

---

## ⚠️ Notice & Limitations

Full details in [`NOTICE.md`](NOTICE.md) — short version:

- **Not medical or dietary advice.** Nutrition figures, especially for dishes generated by the AI-only analysis path (not in the local library), are estimates, not lab measurements. The USDA verification layer catches some implausible AI outputs but not all — see NOTICE.md for exactly what it does and doesn't catch.
- **Country-level food tagging is real but partial** — see the Food Data section above.
- **The USDA verification integration's live API call path has not been tested against a real response** during this round of changes (network-restricted dev environment) — the no-API-key fallback path is verified working; the actual API response parsing should be tested against a real `USDA_API_KEY` before being trusted in production.

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for the GPT API
- [OpenFoodFacts](https://world.openfoodfacts.org) for the open food database
- [shadcn/ui](https://ui.shadcn.com) for the component library

---

<div align="center">

**If NutriLLM helped you, please give it a ⭐ — it helps others discover it!**

Built with ❤️ by **[@Wooinxlkz](https://github.com/Wooinxlkz)**

</div>
