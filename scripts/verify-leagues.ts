import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { verifyUrl, verifyUrlWithBrowser } from "../lib/verify-url";

async function verifyAllLeagues() {
  const leagues = db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.active, true))
    .all();

  console.log(`Verifying ${leagues.length} active league URLs...\n`);

  const flagged: { league: typeof leagues[0]; reason: string }[] = [];

  for (const league of leagues) {
    process.stdout.write(`  Checking: ${league.name}... `);

    // First pass: fast fetch-based check
    const result = await verifyUrl(league.website);

    if (!result.safe) {
      // Second pass: confirm with browser for redirect-based hijacks
      console.log("SUSPECT — running browser check...");
      const browserResult = await verifyUrlWithBrowser(league.website);

      if (!browserResult.safe) {
        console.log(`  UNSAFE: ${browserResult.reason}`);
        flagged.push({ league, reason: browserResult.reason || result.reason || "Unknown" });

        // Auto-deactivate unsafe leagues
        db.update(schema.leagues)
          .set({ active: false, updatedAt: new Date().toISOString() })
          .where(eq(schema.leagues.id, league.id))
          .run();
        console.log(`  -> Deactivated league #${league.id}`);
      } else {
        // Fetch flagged it but browser says OK — log but don't deactivate
        console.log(`OK (browser override: ${result.reason})`);
      }
    } else {
      console.log("OK");
    }
  }

  console.log(`\n--- Verification Complete ---`);
  console.log(`Checked: ${leagues.length} leagues`);
  console.log(`Flagged: ${flagged.length}`);

  if (flagged.length > 0) {
    console.log(`\nDeactivated leagues:`);
    for (const { league, reason } of flagged) {
      console.log(`  - ${league.name} (${league.website})`);
      console.log(`    Reason: ${reason}`);
    }
  }
}

verifyAllLeagues();
