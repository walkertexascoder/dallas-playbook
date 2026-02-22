import { db, schema } from "@/db";
import { eq, and, or, isNotNull } from "drizzle-orm";
import LeagueDirectory from "@/components/LeagueDirectory";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const leagues = await db
    .select()
    .from(schema.leagues)
    .where(and(eq(schema.leagues.approved, true), eq(schema.leagues.visible, true)));

  // Fetch approved+visible seasons that have at least one date
  const seasons = await db
    .select()
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(
      and(
        eq(schema.leagues.approved, true),
        eq(schema.leagues.visible, true),
        eq(schema.seasons.approved, true),
        eq(schema.seasons.visible, true),
        or(
          isNotNull(schema.seasons.signupStart),
          isNotNull(schema.seasons.signupEnd),
          isNotNull(schema.seasons.seasonStart),
          isNotNull(schema.seasons.seasonEnd)
        )
      )
    );

  const flatSeasons = seasons.map((row) => row.seasons);

  return <LeagueDirectory leagues={leagues} seasons={flatSeasons} />;
}
