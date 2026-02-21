import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const leagues = sqliteTable("leagues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  organization: text("organization"),
  sport: text("sport").notNull(),
  website: text("website").notNull(),
  source: text("source").notNull().default("seed"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const seasons = sqliteTable("seasons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  signupStart: text("signup_start"),
  signupEnd: text("signup_end"),
  seasonStart: text("season_start"),
  seasonEnd: text("season_end"),
  ageGroup: text("age_group"),
  detailsUrl: text("details_url"),
  registrationUrl: text("registration_url"),
  rawText: text("raw_text"),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const scrapeLog = sqliteTable("scrape_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leagueId: integer("league_id").notNull().references(() => leagues.id),
  scrapedAt: text("scraped_at").notNull().$defaultFn(() => new Date().toISOString()),
  status: text("status").notNull(),
  changesDetected: integer("changes_detected", { mode: "boolean" }).notNull().default(false),
  errorMessage: text("error_message"),
});
