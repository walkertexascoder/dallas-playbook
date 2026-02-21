import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export async function GET() {
  const rows = await db
    .selectDistinct({ sport: schema.seasons.sport })
    .from(schema.seasons)
    .orderBy(schema.seasons.sport);

  const sports = rows.map((r) => r.sport);
  return NextResponse.json(sports);
}
