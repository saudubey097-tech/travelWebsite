/**
 * A small, embedded common-password blocklist (lowercased, no network
 * dependency — always available, always fast). This is the primary,
 * always-on defense. src/lib/auth/mfa.ts... see password.ts for the
 * secondary, best-effort HaveIBeenPwned check that additionally runs in
 * production where outbound network access is available.
 */
export const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "123456789", "12345678",
  "1234567890", "qwerty", "qwerty123", "letmein", "welcome", "welcome1",
  "admin123", "iloveyou", "monkey", "dragon", "master", "sunshine",
  "princess", "football", "baseball", "trustno1", "abc123", "abc12345",
  "111111", "123123", "000000", "1q2w3e4r", "1qaz2wsx", "qazwsx",
  "passw0rd", "p@ssw0rd", "p@ssword", "changeme", "changeme123",
  "letmein123", "superman", "batman", "starwars", "whatever",
  "freedom", "shadow", "michael", "jennifer", "hunter2", "temp1234",
  "temppass", "guest1234", "test1234", "companyname1", "southbound1",
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.trim().toLowerCase());
}
