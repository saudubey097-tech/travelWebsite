"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, SESSION_COOKIE } from "@/lib/auth/session";
import { hashPassword, verifyPassword, checkPasswordStrength, isPasswordCompromised } from "@/lib/auth/password";
import { generateToken, isExpired } from "@/lib/auth/tokens";
import { recordSecurityEvent } from "@/lib/auth/security-log";
import { checkActionRateLimit } from "@/lib/auth/rate-limit";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/auth-emails";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  revokeSessionSchema,
} from "@/lib/validation/auth";
import type { ActionResult } from "@/lib/actions/auth";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------- Sessions ----------

export async function listMySessions() {
  const user = await requireUser();
  return db.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, userAgent: true, ipAddress: true, lastActiveAt: true, createdAt: true },
  });
}

/** IDOR-safe: only revokes a session that belongs to the caller. */
export async function revokeSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = revokeSessionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid session." };

  const result = await db.session.updateMany({
    where: { id: parsed.data.sessionId, userId: user.id },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, error: "Session not found." };

  await recordSecurityEvent({ userId: user.id, type: "SESSION_REVOKED", metadata: { sessionId: parsed.data.sessionId } });
  revalidatePath("/account/security");
  return { ok: true };
}

/** Revokes every session except the one making this request. */
export async function revokeAllOtherSessions(): Promise<ActionResult> {
  const user = await requireUser();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = token ? createHash("sha256").update(token).digest("hex") : null;

  await db.session.updateMany({
    where: { userId: user.id, revokedAt: null, ...(currentHash ? { tokenHash: { not: currentHash } } : {}) },
    data: { revokedAt: new Date() },
  });
  await recordSecurityEvent({ userId: user.id, type: "ALL_SESSIONS_REVOKED" });
  revalidatePath("/account/security");
  return { ok: true };
}

// ---------- Change password (while signed in) ----------

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check both password fields." };

  const record = await db.appUser.findUnique({ where: { id: user.id } });
  if (!record) return { ok: false, error: "Account not found." };

  const validCurrent = await verifyPassword(parsed.data.currentPassword, record.passwordHash);
  if (!validCurrent) return { ok: false, error: "Current password is incorrect." };

  const strength = checkPasswordStrength(parsed.data.newPassword);
  if (!strength.ok) return { ok: false, error: strength.error };
  if (await isPasswordCompromised(parsed.data.newPassword)) {
    return { ok: false, error: "That password has appeared in a known data breach. Please choose another." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.appUser.update({
    where: { id: user.id },
    data: { passwordHash: newHash, mustChangePassword: false, passwordUpdatedAt: new Date() },
  });
  await recordSecurityEvent({ userId: user.id, type: "PASSWORD_CHANGED" });
  revalidatePath("/account/security");
  return { ok: true };
}

// ---------- Forgot / reset password (signed out) ----------

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  const { email } = parsed.data;

  const rate = await checkActionRateLimit({ identifier: email, type: "PASSWORD_RESET_REQUESTED", windowMs: 60 * 60 * 1000, max: 5 });
  // Always return the same success message either way — never reveal
  // whether the rate limit or a missing account is why nothing arrives.
  const genericOk: ActionResult = { ok: true };
  if (rate.limited) return genericOk;

  const user = await db.appUser.findUnique({ where: { email } });
  if (!user) return genericOk; // don't confirm whether the email exists

  const { raw, hash } = generateToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  await recordSecurityEvent({ userId: user.id, email, type: "PASSWORD_RESET_REQUESTED" });
  await sendPasswordResetEmail({ to: email, name: user.name, token: raw }).catch(() => null);

  return genericOk;
}

export async function resetPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.consumedAt || isExpired(record.expiresAt)) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.ok) return { ok: false, error: strength.error };
  if (await isPasswordCompromised(parsed.data.password)) {
    return { ok: false, error: "That password has appeared in a known data breach. Please choose another." };
  }

  const newHash = await hashPassword(parsed.data.password);
  await db.$transaction(async (tx) => {
    await tx.appUser.update({
      where: { id: record.userId },
      data: { passwordHash: newHash, mustChangePassword: false, passwordUpdatedAt: new Date() },
    });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    // A password reset is a strong signal to end every other session —
    // if someone else had access, this locks them out immediately.
    await tx.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  });
  await recordSecurityEvent({ userId: record.userId, type: "PASSWORD_RESET_COMPLETED" });

  redirect("/login");
}

// ---------- Email verification ----------

export async function verifyEmail(token: string): Promise<ActionResult> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.consumedAt || isExpired(record.expiresAt)) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }

  await db.$transaction(async (tx) => {
    await tx.appUser.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    await tx.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  });
  await recordSecurityEvent({ userId: record.userId, type: "EMAIL_VERIFIED" });
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function resendVerificationEmail(): Promise<ActionResult> {
  const user = await requireUser();
  if (user.emailVerifiedAt) return { ok: true };

  const rate = await checkActionRateLimit({ identifier: user.email, type: "EMAIL_VERIFICATION_RESENT", windowMs: 15 * 60 * 1000, max: 3 });
  if (rate.limited) return { ok: false, error: "Please wait a few minutes before requesting another verification email." };

  const { raw, hash } = generateToken();
  await db.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const result = await sendVerificationEmail({ to: user.email, name: user.name, token: raw });
  await recordSecurityEvent({ userId: user.id, type: "EMAIL_VERIFICATION_RESENT", metadata: { delivered: result.ok } }).catch(() => null);

  if (!result.ok) return { ok: false, error: "We couldn't send that email right now. Please try again shortly." };
  return { ok: true };
}
