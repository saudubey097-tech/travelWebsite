import "server-only";
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * The full set of security-relevant event types this app records. Kept as
 * a union (not a Prisma enum) so PR1 can add new event types later without
 * a migration — `type` is a plain string column on security_audit_logs.
 */
export type SecurityEventType =
  | "SIGN_IN_SUCCESS"
  | "SIGN_IN_FAILED"
  | "SIGN_UP"
  | "EMAIL_VERIFIED"
  | "EMAIL_VERIFICATION_RESENT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "PASSWORD_CHANGED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "MFA_CHALLENGE_SUCCESS"
  | "MFA_CHALLENGE_FAILED"
  | "MFA_RECOVERY_CODE_USED"
  | "RECOVERY_CODES_REGENERATED"
  | "SESSION_REVOKED"
  | "ALL_SESSIONS_REVOKED"
  | "ROLE_CHANGED"
  | "ACCOUNT_LOCKED_OUT"
  | "STAFF_INVITED"
  | "STAFF_INVITATION_ACCEPTED"
  | "STAFF_INVITATION_REVOKED";

export async function recordSecurityEvent(params: {
  userId?: string | null;
  email?: string | null;
  type: SecurityEventType;
  metadata?: Record<string, unknown>;
}) {
  const h = await headers();
  await db.securityEvent.create({
    data: {
      userId: params.userId ?? null,
      email: params.email ?? null,
      type: params.type,
      ipAddress: clientIp(h),
      userAgent: h.get("user-agent")?.slice(0, 255),
      metadata: params.metadata,
    },
  });
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
function clientIp(h: Headers): string | undefined {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return h.get("x-real-ip") ?? undefined;
}
