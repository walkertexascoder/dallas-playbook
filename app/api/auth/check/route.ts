import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authenticated = !!token && validateSession(token);
  return NextResponse.json({ authenticated });
}
