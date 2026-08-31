import { pgTable, text, serial, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodAnalysesTable = pgTable("food_analyses", {
  id: serial("id").primaryKey(),
  food: text("food").notNull(),
  foodNameEn: text("food_name_en").notNull(),
  foodNameAr: text("food_name_ar").notNull(),
  servingSize: text("serving_size").default("1 serving"),
  nutrition: jsonb("nutrition").notNull(),
  culturalContext: text("cultural_context").notNull(),
  culturalContextAr: text("cultural_context_ar").notNull(),
  regionalVariations: jsonb("regional_variations").notNull(),
  healthInsights: jsonb("health_insights").notNull(),
  healthInsightsAr: jsonb("health_insights_ar").notNull(),
  ingredients: jsonb("ingredients").notNull(),
  cuisine: text("cuisine").notNull(),
  region: text("region").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const insertFoodAnalysisSchema = createInsertSchema(foodAnalysesTable).omit({ id: true, analyzedAt: true });
export type InsertFoodAnalysis = z.infer<typeof insertFoodAnalysisSchema>;
export type FoodAnalysis = typeof foodAnalysesTable.$inferSelect;

export const foodCatalogTable = pgTable("food_catalog", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  cuisine: text("cuisine").notNull(),
  region: text("region").notNull(),
  category: text("category").notNull(),
  nutrition: jsonb("nutrition").notNull(),
  tags: jsonb("tags").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  allergens: jsonb("allergens"),
  cookTime: integer("cook_time"),
  difficulty: text("difficulty"),
});

export const insertFoodCatalogSchema = createInsertSchema(foodCatalogTable).omit({ id: true });
export type InsertFoodCatalog = z.infer<typeof insertFoodCatalogSchema>;
export type FoodCatalogItem = typeof foodCatalogTable.$inferSelect;
