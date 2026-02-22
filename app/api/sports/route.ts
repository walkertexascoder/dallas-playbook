import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .selectDistinct({ sport: schema.seasons.sport })
    .from(schema.seasons)
    .innerJoin(schema.leagues, eq(schema.seasons.leagueId, schema.leagues.id))
    .where(
      and(
        eq(schema.leagues.approved, true),
        eq(schema.leagues.visible, true),
        eq(schema.seasons.approved, true),
        eq(schema.seasons.visible, true)
      )
    )
    .orderBy(schema.seasons.sport);

  const sports = rows.map((r) => r.sport);
  return NextResponse.json(sports);
}
