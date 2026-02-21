import { randomBytes, timingSafeEqual } from "crypto";

// Use globalThis so the session set is shared across all route modules
// (Next.js dev mode creates separate module instances per route)
const g = globalThis as unknown as { __manageSessions?: Set<string> };
if (!g.__manageSessions) g.__manageSessions = new Set<string>();
const sessions = g.__manageSessions;

export const COOKIE_NAME = "manage_session";

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still do a comparison to avoid timing leak on length
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  sessions.add(token);
  return token;
}

export function validateSession(token: string): boolean {
  return sessions.has(token);
}

export function destroySession(token: string): void {
  sessions.delete(token);
}
