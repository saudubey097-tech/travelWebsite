import bcrypt from "bcryptjs";
import { isCommonPassword } from "@/lib/auth/data/common-passwords";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface PasswordStrengthResult {
  ok: boolean;
  error?: string;
}

/**
 * Always-on password strength checks: length, character variety, and the
 * embedded common-password blocklist. Synchronous and network-free, so it
 * always runs — this is the primary defense, not the best-effort one.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (password.length < 10) {
    return { ok: false, error: "Password must be at least 10 characters." };
  }
  if (password.length > 200) {
    return { ok: false, error: "Password is too long." };
  }
  const varietyClasses = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password));
  if (varietyClasses.length < 3) {
    return { ok: false, error: "Use a mix of upper/lowercase letters, numbers, and symbols." };
  }
  if (isCommonPassword(password)) {
    return { ok: false, error: "That password is too common. Choose something less guessable." };
  }
  return { ok: true };
}

/**
 * Best-effort compromised-password check via the HaveIBeenPwned range API
 * (k-anonymity: only the first 5 hash chars are sent, never the password
 * or full hash). This makes a real outbound HTTPS call, so it needs
 * network access — it fails OPEN (never blocks sign-up) if the request
 * errors or times out, since availability of sign-up matters more than
 * this secondary check.
 *
 * NOT exercised in this sandbox (api.pwnedpasswords.com isn't in the
 * dev-environment network allowlist here) — verify this call actually
 * succeeds once deployed with normal outbound network access.
 */
export async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    const { createHash } = await import("node:crypto");
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { "Add-Padding": "true" },
    });
    clearTimeout(timeout);
    if (!response.ok) return false;

    const body = await response.text();
    return body.split("\n").some((line) => line.split(":")[0]?.trim() === suffix);
  } catch {
    // Network unavailable, timed out, or API down — fail open.
    return false;
  }
}
