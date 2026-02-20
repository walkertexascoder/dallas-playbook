import { NextResponse } from "next/server";
import { db, schema } from "@/db";

export async function GET() {
  const leagues = db.select().from(schema.leagues).all();
  return NextResponse.json(leagues);
}
