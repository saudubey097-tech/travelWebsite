"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";
import { signUpSchema, signInSchema } from "@/lib/validation/auth";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Customer self-registration only. Staff accounts are created by an Admin (see actions/admin.ts). */
export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await db.appUser.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't confirm which emails are registered.
    return { ok: false, error: "We couldn't create that account. Try signing in instead." };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.appUser.create({
    data: { name, email, phone, passwordHash, role: "CUSTOMER" },
  });

  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const user = await db.appUser.findUnique({ where: { email } });
  // Always run a bcrypt compare, even for a missing user, so response
  // timing doesn't reveal whether the email exists.
  const validHash = user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsaltuuxxxxxxxxxxxxxxxxxxx";
  const valid = await verifyPassword(password, validHash);

  if (!user || !valid) {
    return { ok: false, error: "Incorrect email or password." };
  }
  if (!user.active) {
    return { ok: false, error: "This account has been deactivated. Contact an administrator." };
  }

  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}
