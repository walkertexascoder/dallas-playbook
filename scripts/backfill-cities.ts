import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { scrapePageText } from "../lib/scraper";
import { extractCityFromPage } from "../lib/claude";

async function backfillCities() {
  const leagues = await db.select().from(schema.leagues);
  console.log(`Found ${leagues.length} leagues to process...\n`);

  let updated = 0;
  let failed = 0;

  for (const league of leagues) {
    console.log(`${league.name} (${league.website})`);

    if (league.city) {
      console.log(`  Already has city: ${league.city}, skipping\n`);
      continue;
    }

    try {
      const pageText = await scrapePageText(league.website);
      const city = await extractCityFromPage(pageText);

      if (city) {
        await db.update(schema.leagues)
          .set({ city, updatedAt: new Date().toISOString() })
          .where(eq(schema.leagues.id, league.id));
        updated++;
        console.log(`  -> ${city}\n`);
      } else {
        console.log(`  No address found on page\n`);
      }
    } catch (err) {
      failed++;
      console.log(`  Error: ${err}\n`);
    }
  }

  console.log(`Done! Updated ${updated} leagues. ${failed} failed.`);
}

backfillCities();
