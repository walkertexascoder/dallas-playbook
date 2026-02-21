import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/require-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const id = Number(params.id);
  const body = await request.json();

  const [result] = await db
    .update(schema.leagues)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.leagues.id, id))
    .returning();

  if (!result) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
