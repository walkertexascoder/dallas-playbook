import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, validateSession } from "./auth";

export function requireAuth(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
