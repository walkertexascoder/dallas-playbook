import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const leagues = await db.select().from(schema.leagues);
  const allSeasons = await db.select().from(schema.seasons);

  const result = leagues.map((league) => ({
    ...league,
    seasons: allSeasons.filter((s) => s.leagueId === league.id),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { name, organization, sport, website } = body;

  if (!name || !sport || !website) {
    return NextResponse.json(
      { error: "name, sport, and website are required" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(schema.leagues)
    .values({
      name,
      organization: organization || null,
      sport,
      website,
      source: "manual",
    })
    .returning();

  return NextResponse.json(result, { status: 201 });
}
