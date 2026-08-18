"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, checkPasswordStrength, isPasswordCompromised } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";
import { signUpSchema, signInSchema } from "@/lib/validation/auth";
import { generateToken } from "@/lib/auth/tokens";
import { recordSecurityEvent } from "@/lib/auth/security-log";
import { checkLoginLockout, checkActionRateLimit } from "@/lib/auth/rate-limit";
import { setMfaChallengeCookie } from "@/lib/auth/mfa-challenge";
import { sendVerificationEmail } from "@/lib/email/auth-emails";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/** Customer self-registration only. Staff accounts come through the invitation flow (see actions/invitations.ts). */
export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { name, email, phone, password } = parsed.data;

  const rate = await checkActionRateLimit({ identifier: email, type: "SIGN_UP", windowMs: 60 * 60 * 1000, max: 5 });
  if (rate.limited) {
    return { ok: false, error: "Too many sign-up attempts. Try again later." };
  }

  const strength = checkPasswordStrength(password);
  if (!strength.ok) {
    return { ok: false, error: strength.error };
  }
  // Best-effort, network-dependent — see isPasswordCompromised's own doc
  // comment. Never blocks sign-up on a network failure.
  if (await isPasswordCompromised(password)) {
    return { ok: false, error: "That password has appeared in a known data breach. Please choose another." };
  }

  const existing = await db.appUser.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't confirm which emails are registered.
    return { ok: false, error: "We couldn't create that account. Try signing in instead." };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.appUser.create({
    data: { name, email, phone, passwordHash, role: "CUSTOMER" },
  });
  await recordSecurityEvent({ userId: user.id, email, type: "SIGN_UP" });

  const { raw, hash } = generateToken();
  await db.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS) },
  });
  // Best-effort: the account exists either way — an email outage shouldn't
  // block sign-up, only the verification-gated areas of the app.
  await sendVerificationEmail({ to: email, name, token: raw }).catch(() => null);

  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const lockout = await checkLoginLockout(email);
  if (lockout.locked) {
    await recordSecurityEvent({ email, type: "ACCOUNT_LOCKED_OUT", metadata: { attempts: lockout.attempts } });
    const minutes = Math.ceil((lockout.retryAfterMs ?? 0) / 60000);
    return { ok: false, error: `Too many failed attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const user = await db.appUser.findUnique({ where: { email } });
  // Always run a bcrypt compare, even for a missing user, so response
  // timing doesn't reveal whether the email exists.
  const validHash = user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsaltuuxxxxxxxxxxxxxxxxxxx";
  const valid = await verifyPassword(password, validHash);

  if (!user || !valid) {
    await recordSecurityEvent({ email, userId: user?.id, type: "SIGN_IN_FAILED" });
    return { ok: false, error: "Incorrect email or password." };
  }
  if (!user.active) {
    await recordSecurityEvent({ email, userId: user.id, type: "SIGN_IN_FAILED", metadata: { reason: "inactive" } });
    return { ok: false, error: "This account has been deactivated. Contact an administrator." };
  }

  if (user.mfaEnabled) {
    // Password verified, but the session isn't created yet — the MFA
    // challenge is the remaining half of authentication.
    await setMfaChallengeCookie(user.id);
    redirect("/login/mfa");
  }

  await recordSecurityEvent({ email, userId: user.id, type: "SIGN_IN_SUCCESS" });
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/account/change-password" : homeRouteForRole(user.role));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}
