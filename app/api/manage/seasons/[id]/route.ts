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

  const result = db
    .update(schema.seasons)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.seasons.id, id))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const id = Number(params.id);

  const existing = db
    .select()
    .from(schema.seasons)
    .where(eq(schema.seasons.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Season not found" }, { status: 404 });
  }

  db.delete(schema.seasons).where(eq(schema.seasons.id, id)).run();

  return NextResponse.json({ success: true });
}
