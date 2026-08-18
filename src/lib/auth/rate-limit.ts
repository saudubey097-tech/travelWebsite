import "server-only";
import { db } from "@/lib/db";

/**
 * DB-backed rate limiting/lockout, deliberately not in-memory: serverless
 * function instances don't share memory, so an in-process counter resets
 * on every cold start and silently stops limiting anything. Backing this
 * with security_audit_logs means it works correctly across instances at
 * the cost of a couple of extra queries per attempt — an acceptable trade
 * for an auth endpoint.
 */

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;

/** Returns how many failed sign-in attempts this email has had in the
 *  lockout window, and whether that's enough to lock them out now. */
export async function checkLoginLockout(email: string): Promise<{ locked: boolean; attempts: number; retryAfterMs?: number }> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const recentFailures = await db.securityEvent.findMany({
    where: { email, type: "SIGN_IN_FAILED", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: LOGIN_MAX_ATTEMPTS,
  });

  if (recentFailures.length < LOGIN_MAX_ATTEMPTS) {
    return { locked: false, attempts: recentFailures.length };
  }

  const oldestOfWindow = recentFailures[recentFailures.length - 1];
  const retryAfterMs = LOGIN_WINDOW_MS - (Date.now() - oldestOfWindow.createdAt.getTime());
  return { locked: retryAfterMs > 0, attempts: recentFailures.length, retryAfterMs: Math.max(0, retryAfterMs) };
}

/**
 * Generic per-action rate limit for sign-up, password-reset requests,
 * booking submission, messages, and contact forms — counts security
 * events (or any event type you pass) from this identifier (email or IP)
 * within a window.
 */
export async function checkActionRateLimit(params: {
  identifier: string;
  type: string;
  windowMs: number;
  max: number;
}): Promise<{ limited: boolean; count: number }> {
  const since = new Date(Date.now() - params.windowMs);
  const count = await db.securityEvent.count({
    where: {
      type: params.type,
      createdAt: { gte: since },
      OR: [{ email: params.identifier }, { ipAddress: params.identifier }],
    },
  });
  return { limited: count >= params.max, count };
}
