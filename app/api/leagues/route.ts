import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagues = await db
    .select()
    .from(schema.leagues)
    .where(and(eq(schema.leagues.approved, true), eq(schema.leagues.visible, true)));
  return NextResponse.json(leagues);
}
