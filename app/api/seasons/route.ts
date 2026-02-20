import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, gte, lte, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const includeHidden = searchParams.get("includeHidden") === "true";

  const conditions = [];

  // Only show visible seasons by default
  if (!includeHidden) {
    conditions.push(eq(schema.seasons.visible, true));
  }

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

  const query = db
    .select({
      season: schema.seasons,
      league: schema.leagues,
    })
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();

  const result = query.map(({ season, league }) => ({
    ...season,
    leagueName: league.name,
    organization: league.organization,
    leagueWebsite: league.website,
  }));

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, visible } = body;

  if (typeof id !== "number" || typeof visible !== "boolean") {
    return NextResponse.json({ error: "id (number) and visible (boolean) required" }, { status: 400 });
  }

  db.update(schema.seasons)
    .set({ visible, updatedAt: new Date().toISOString() })
    .where(eq(schema.seasons.id, id))
    .run();

  return NextResponse.json({ ok: true });
}
