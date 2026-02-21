import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, gte, lte, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const conditions = [];

  if (sport) {
    conditions.push(eq(schema.seasons.sport, sport));
  }

  if (month && year) {
    const monthStart = `${year}-${month.padStart(2, "0")}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const monthEnd = `${year}-${month.padStart(2, "0")}-${lastDay}`;

    conditions.push(
      or(
        and(
          lte(schema.seasons.signupStart, monthEnd),
          gte(schema.seasons.signupEnd, monthStart)
        ),
        and(
          lte(schema.seasons.seasonStart, monthEnd),
          gte(schema.seasons.seasonEnd, monthStart)
        ),
        and(
          lte(schema.seasons.signupStart, monthEnd),
          gte(schema.seasons.seasonEnd, monthStart)
        )
      )!
    );
  }

  const query = await db
    .select({
      season: schema.seasons,
      league: schema.leagues,
    })
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const result = query.map(({ season, league }) => ({
    ...season,
    leagueName: league.name,
    organization: league.organization,
    leagueWebsite: league.website,
  }));

  return NextResponse.json(result);
}
