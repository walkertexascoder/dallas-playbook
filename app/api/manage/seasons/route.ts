import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/require-auth";

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { leagueId, name, sport } = body;

  if (!leagueId || !name || !sport) {
    return NextResponse.json(
      { error: "leagueId, name, and sport are required" },
      { status: 400 }
    );
  }

  const [result] = await db
    .insert(schema.seasons)
    .values({
      leagueId,
      name,
      sport,
      ageGroup: body.ageGroup || null,
      signupStart: body.signupStart || null,
      signupEnd: body.signupEnd || null,
      seasonStart: body.seasonStart || null,
      seasonEnd: body.seasonEnd || null,
      detailsUrl: body.detailsUrl || null,
      registrationUrl: body.registrationUrl || null,
      visible: body.visible !== undefined ? body.visible : true,
    })
    .returning();

  return NextResponse.json(result, { status: 201 });
}
