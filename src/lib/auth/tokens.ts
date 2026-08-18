import "server-only";
import { randomBytes, createHash } from "node:crypto";

/**
 * Shared primitive for every single-use, expiring token in the app (email
 * verification, password reset, staff invitations): generate a random
 * token, return the raw value to embed in a URL, and store only its hash.
 * A leaked database row can never be replayed as a live token.
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
