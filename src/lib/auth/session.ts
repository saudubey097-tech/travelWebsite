import "server-only";
import { cookies, headers } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { AppUser, Role } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/** Only the fields safe to hold in memory/pass to client components. */
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

function toSafeUser(user: AppUser): SafeUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active };
}

function hashToken(token: string): string {
  // We never store the raw session token — only a hash of it — so a
  // database read/leak can't be replayed as a live session cookie.
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new DB-backed session for the user and sets the session cookie.
 * Called after successful sign-up/sign-in.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 255);

  await db.session.create({ data: { userId, tokenHash, expiresAt, userAgent } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Reads the session cookie and returns the authenticated user, or null. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return null;
  }

  return toSafeUser(session.user);
}

/** Throws-free guard for use at the top of Server Actions and route handlers. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED", "You need to sign in to do that.");
  return user;
}

/** Guard that also enforces role membership. Use for coordinator/driver/admin-only actions. */
export async function requireRole(...roles: Role[]): Promise<SafeUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("FORBIDDEN", "You don't have permission to do that.");
  }
  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await db.session.deleteMany({ where: { tokenHash } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Distinguishes auth failures from validation failures for callers/UI. */
export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}
