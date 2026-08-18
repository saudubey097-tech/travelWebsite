import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A short-lived, signed cookie that says "this browser just proved the
 * password for userId, and is now expected to complete an MFA challenge."
 * It is NOT a session — no access is granted from this cookie alone. The
 * real security boundary is the TOTP/recovery-code check in
 * src/lib/actions/mfa.ts; this cookie only carries the pending userId
 * across the redirect to /login/mfa so the challenge page knows who it's
 * challenging, and is HMAC-signed so it can't be silently tampered with.
 */
const MFA_PENDING_COOKIE = "sb_mfa_pending";
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export async function setMfaChallengeCookie(userId: string): Promise<void> {
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(MFA_PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

export async function readMfaChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MFA_PENDING_COOKIE)?.value;
  if (!token) return null;

  const [userId, expiresAtStr, signature] = token.split(".");
  if (!userId || !expiresAtStr || !signature) return null;

  const expected = sign(`${userId}.${expiresAtStr}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Number(expiresAtStr) < Date.now()) return null;
  return userId;
}

export async function clearMfaChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MFA_PENDING_COOKIE);
}
