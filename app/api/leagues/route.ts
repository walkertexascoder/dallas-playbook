import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagues = await db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.approved, true));
  return NextResponse.json(leagues);
}
