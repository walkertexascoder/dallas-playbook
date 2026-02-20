import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { scrapePageText } from "../lib/scraper";
import { extractSeasons } from "../lib/claude";

async function scrapeOne(id: number) {
  const league = db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.id, id))
    .get();
  if (!league) {
    console.log(`League ${id} not found`);
    return;
  }
  console.log(`Scraping: ${league.name} (${league.website})`);
  try {
    const text = await scrapePageText(league.website);
    console.log(`  Got ${text.length} chars`);
    const seasons = await extractSeasons(text, league.website);
    console.log(`  Extracted ${seasons.length} seasons`);
    for (const s of seasons) {
      db.insert(schema.seasons)
        .values({
          leagueId: league.id,
          name: s.name,
          sport: s.sport || "Baseball",
          signupStart: s.signup_start,
          signupEnd: s.signup_end,
          seasonStart: s.season_start,
          seasonEnd: s.season_end,
          ageGroup: s.age_group,
          detailsUrl: s.details_url,
          rawText: text.slice(0, 5000),
        })
        .run();
      console.log(`  Added: ${s.name}`);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`  Error: ${msg}`);
  }
}

const ids = process.argv.slice(2).map(Number);
if (ids.length === 0) {
  console.log("Usage: npx tsx scripts/scrape-one.ts <id> [id...]");
  process.exit(1);
}

async function main() {
  for (const id of ids) {
    await scrapeOne(id);
  }
}
main();
