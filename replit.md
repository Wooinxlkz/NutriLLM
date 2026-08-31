# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### NutriLLM (`artifacts/nutri-llm`)
React + Vite food intelligence app focused on MENA cuisine. Routes: `/` (home), `/analyze` (AI food analysis), `/foods` (catalog), `/hub` (community), `/docs` (API docs).

### API Server (`artifacts/api-server`)
Express 5 backend serving `/api/*`. Key routes:
- `GET /api/foods` — merged catalog (database + library + OpenFoodFacts)
- `POST /api/nutrition/analyze/stream` — AI food analysis (SSE)
- `GET /api/nutrition/history` — analysis history

## Libraries

### `lib/food-data`
Static food data library. Three data sources:
1. **MENA curated library** (`src/mena-foods.ts`) — 56 hand-curated MENA/Middle East dishes with full nutrition, Arabic names, allergens, cook times, descriptions
2. **Nutrition5k** (`src/nutrition5k.ts`) — 15 representative dishes mapped from Google Research's Nutrition5k dataset
3. **OpenFoodFacts live API** (`src/openfoodfacts.ts`) — live product search from https://world.openfoodfacts.org
4. **Food images** (`src/food-images.ts`) — `FOOD_IMAGES` record mapping food IDs → image URLs (Wikimedia + Unsplash); injected into `LOCAL_CATALOG` at build time; `imageUrl` is included in `/api/foods` response

The `GET /api/foods` endpoint merges all three with database results, deduplicating by name.

## AI Analysis
- All analysis endpoints use `gpt-5-nano` with `max_completion_tokens: 1500` for fast responses
- Streaming endpoint: `POST /api/nutrition/analyze/stream` (SSE)
- Image analysis: `POST /api/nutrition/analyze-image` (vision)
- Non-streaming: `POST /api/nutrition/analyze`

## SEO
- `artifacts/nutri-llm/index.html` has full Open Graph, Twitter Card, meta description tags
- Favicon: `artifacts/nutri-llm/public/favicon.svg` (red bowl SVG)

### `lib/integrations-openai-ai-server`
OpenAI integration via Replit AI Integrations proxy. Used for food analysis in the nutrition route.
