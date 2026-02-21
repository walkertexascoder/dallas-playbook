import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const leagues = db.select().from(schema.leagues).all();
  const allSeasons = db.select().from(schema.seasons).all();

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

  const result = db
    .insert(schema.leagues)
    .values({
      name,
      organization: organization || null,
      sport,
      website,
      source: "manual",
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
