import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export async function GET() {
  const leagues = await db.select().from(schema.leagues);
  return NextResponse.json(leagues);
}
