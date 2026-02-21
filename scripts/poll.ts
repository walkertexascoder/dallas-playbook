import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { scrapePageText } from "../lib/scraper";
import { extractSeasons } from "../lib/claude";

async function poll() {
  const activeLeagues = await db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.active, true));

  console.log(`Polling ${activeLeagues.length} active leagues...`);

  for (const league of activeLeagues) {
    console.log(`\nScraping: ${league.name} (${league.website})`);

    try {
      const pageText = await scrapePageText(league.website);
      console.log(`  Got ${pageText.length} chars of text`);

      const seasons = await extractSeasons(pageText, league.website);
      console.log(`  Extracted ${seasons.length} seasons`);

      let changesDetected = false;

      for (const season of seasons) {
        // Check if this season already exists (by name, or by detailsUrl as fallback)
        const leagueSeasons = await db
          .select()
          .from(schema.seasons)
          .where(eq(schema.seasons.leagueId, league.id));
        const existing =
          leagueSeasons.find((s) => s.name === season.name) ||
          (season.details_url
            ? leagueSeasons.find((s) => s.detailsUrl === season.details_url)
            : undefined);

        if (existing) {
          // Update existing season
          await db.update(schema.seasons)
            .set({
              sport: season.sport || existing.sport,
              signupStart: season.signup_start || existing.signupStart,
              signupEnd: season.signup_end || existing.signupEnd,
              seasonStart: season.season_start || existing.seasonStart,
              seasonEnd: season.season_end || existing.seasonEnd,
              ageGroup: season.age_group || existing.ageGroup,
              detailsUrl: season.details_url || existing.detailsUrl,
              rawText: pageText.slice(0, 5000),
              updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.seasons.id, existing.id));
          console.log(`  Updated: ${season.name}`);
        } else {
          // Insert new season
          await db.insert(schema.seasons)
            .values({
              leagueId: league.id,
              name: season.name,
              sport: season.sport || league.sport,
              signupStart: season.signup_start,
              signupEnd: season.signup_end,
              seasonStart: season.season_start,
              seasonEnd: season.season_end,
              ageGroup: season.age_group,
              detailsUrl: season.details_url,
              rawText: pageText.slice(0, 5000),
            });
          changesDetected = true;
          console.log(`  Added: ${season.name}`);
        }
      }

      // Log success
      await db.insert(schema.scrapeLog)
        .values({
          leagueId: league.id,
          status: "success",
          changesDetected,
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Error: ${message}`);

      await db.insert(schema.scrapeLog)
        .values({
          leagueId: league.id,
          status: "error",
          errorMessage: message,
        });
    }
  }

  console.log("\nPolling complete!");
}

poll();
