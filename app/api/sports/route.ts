import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export async function GET() {
  const sports = db
    .selectDistinct({ sport: schema.seasons.sport })
    .from(schema.seasons)
    .orderBy(schema.seasons.sport)
    .all()
    .map((r) => r.sport);

  return NextResponse.json(sports);
}
