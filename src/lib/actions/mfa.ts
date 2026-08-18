"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, createSession } from "@/lib/auth/session";
import { readMfaChallengeCookie, clearMfaChallengeCookie } from "@/lib/auth/mfa-challenge";
import {
  generateTotpSecret,
  encryptSecret,
  decryptSecret,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from "@/lib/auth/mfa";
import { recordSecurityEvent } from "@/lib/auth/security-log";
import { homeRouteForRole } from "@/lib/auth/routing";
import { mfaVerifySchema } from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/actions/auth";

/**
 * Step 1 of enrollment: generates a new TOTP secret and returns the
 * otpauth URL for the QR code, but does NOT enable MFA yet — that only
 * happens once the admin proves they scanned it correctly by submitting a
 * real code (confirmMfaEnrollment). The secret is held in an httpOnly,
 * signed-adjacent short-lived cookie-free approach: we store it encrypted
 * on the user row immediately but `mfaEnabled` stays false until confirmed,
 * so an abandoned enrollment never silently starts requiring MFA.
 */
export async function startMfaEnrollment(): Promise<{ ok: true; otpauthUrl: string } | ActionResult> {
  const user = await requireRole("ADMIN");
  try {
    const { secret, otpauthUrl } = generateTotpSecret(user.email);
    await db.appUser.update({ where: { id: user.id }, data: { mfaSecretCipher: encryptSecret(secret) } });
    return { ok: true, otpauthUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not start MFA setup." };
  }
}

export async function confirmMfaEnrollment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult & { recoveryCodes?: string[] }> {
  const user = await requireRole("ADMIN");
  const parsed = mfaVerifySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Enter the 6-digit code from your authenticator app." };

  const record = await db.appUser.findUnique({ where: { id: user.id } });
  if (!record?.mfaSecretCipher) return { ok: false, error: "Start MFA setup again." };

  const secret = decryptSecret(record.mfaSecretCipher);
  if (!verifyTotpCode(secret, parsed.data.code)) {
    await recordSecurityEvent({ userId: user.id, type: "MFA_CHALLENGE_FAILED", metadata: { stage: "enrollment" } });
    return { ok: false, error: "That code didn't match. Check the time on your device and try again." };
  }

  const { plain, hashed } = await generateRecoveryCodes();
  await db.$transaction(async (tx) => {
    await tx.appUser.update({ where: { id: user.id }, data: { mfaEnabled: true, mfaEnabledAt: new Date() } });
    await tx.recoveryCode.deleteMany({ where: { userId: user.id } });
    await tx.recoveryCode.createMany({ data: hashed.map((h) => ({ userId: user.id, codeHash: h.codeHash })) });
  });
  await recordSecurityEvent({ userId: user.id, type: "MFA_ENABLED" });

  return { ok: true, recoveryCodes: plain };
}

export async function disableMfa(): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  await db.$transaction(async (tx) => {
    await tx.appUser.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaEnabledAt: null, mfaSecretCipher: null },
    });
    await tx.recoveryCode.deleteMany({ where: { userId: user.id } });
  });
  await recordSecurityEvent({ userId: user.id, type: "MFA_DISABLED" });
  return { ok: true };
}

export async function regenerateRecoveryCodes(): Promise<(ActionResult & { recoveryCodes?: string[] })> {
  const user = await requireRole("ADMIN");
  const record = await db.appUser.findUnique({ where: { id: user.id } });
  if (!record?.mfaEnabled) return { ok: false, error: "Enable MFA before generating recovery codes." };

  const { plain, hashed } = await generateRecoveryCodes();
  await db.$transaction(async (tx) => {
    await tx.recoveryCode.deleteMany({ where: { userId: user.id } });
    await tx.recoveryCode.createMany({ data: hashed.map((h) => ({ userId: user.id, codeHash: h.codeHash })) });
  });
  await recordSecurityEvent({ userId: user.id, type: "RECOVERY_CODES_REGENERATED" });
  return { ok: true, recoveryCodes: plain };
}

/**
 * The second half of sign-in for an MFA-enabled admin: verifies a TOTP
 * code (or a recovery code as fallback) against the pending challenge
 * cookie set by signIn(), and only then creates the real session.
 */
export async function verifyMfaChallenge(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = await readMfaChallengeCookie();
  if (!userId) return { ok: false, error: "Your sign-in attempt expired. Please sign in again." };

  const parsed = mfaVerifySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Enter your 6-digit code or a recovery code." };

  const user = await db.appUser.findUnique({ where: { id: userId } });
  if (!user || !user.mfaEnabled || !user.mfaSecretCipher) {
    return { ok: false, error: "Your sign-in attempt expired. Please sign in again." };
  }

  const code = parsed.data.code.trim();
  let success = false;
  let usedRecoveryCode = false;

  if (/^\d{6}$/.test(code)) {
    success = verifyTotpCode(decryptSecret(user.mfaSecretCipher), code);
  } else {
    const candidates = await db.recoveryCode.findMany({ where: { userId: user.id, usedAt: null } });
    for (const candidate of candidates) {
      if (await verifyRecoveryCode(code, candidate.codeHash)) {
        await db.recoveryCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } });
        success = true;
        usedRecoveryCode = true;
        break;
      }
    }
  }

  if (!success) {
    await recordSecurityEvent({ userId: user.id, type: "MFA_CHALLENGE_FAILED" });
    return { ok: false, error: "That code wasn't right." };
  }

  await recordSecurityEvent({
    userId: user.id,
    type: usedRecoveryCode ? "MFA_RECOVERY_CODE_USED" : "MFA_CHALLENGE_SUCCESS",
  });
  await recordSecurityEvent({ userId: user.id, type: "SIGN_IN_SUCCESS" });
  await clearMfaChallengeCookie();
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/account/change-password" : homeRouteForRole(user.role));
}
