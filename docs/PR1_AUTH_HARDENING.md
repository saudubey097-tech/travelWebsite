# PR1 — Authentication hardening

Branch: `pr1/auth-hardening`. This document is written to be pasted into
the PR description.

## Summary

Adds staff invitations (single-use tokens, no admin-chosen passwords),
customer email verification, forgot/reset password, forced password
change, Admin TOTP MFA with recovery codes, session management (list/
revoke/revoke-all), login lockout, password strength + common-password
blocklist + best-effort breach checking, and a full security-event audit
trail — on top of the existing role-workflow app, without weakening any
existing authorization rule.

**No live email/MFA provider configuration is required to use any of
this.** Every email (verification, password reset, staff invitation) logs
to the server console instead of sending when `RESEND_API_KEY`/`EMAIL_FROM`
aren't set, so the complete flow — sign up, verify, invite, accept, reset,
enable MFA — works locally out of the box. Set the Resend variables to
send real email instead.

## What's new

### Schema (`prisma/schema.prisma`)
- `AppUser` gained: `emailVerifiedAt`, `mustChangePassword`,
  `passwordUpdatedAt`, `mfaEnabled`, `mfaSecretCipher`, `mfaEnabledAt`.
- New tables: `RecoveryCode` (→ `recovery_codes`), `EmailVerificationToken`
  (→ `email_verification_tokens`), `PasswordResetToken` (→
  `password_reset_tokens`), `StaffInvitationToken` (→
  `staff_invitation_tokens`), `SecurityEvent` (→ `security_audit_logs`).
- `Session` (→ `sessions`) extended with `ipAddress`, `lastActiveAt`,
  `revokedAt` for device management.

All additive — no columns removed, no existing data touched. Run
`npx prisma migrate dev --name auth_hardening` once you have a real
`DATABASE_URL`/`DIRECT_DATABASE_URL`.

### Staff invitations replace direct creation
An Admin no longer chooses a temporary password for a new Coordinator/
Driver/Admin. `inviteStaff` creates a `StaffInvitationToken` (no `AppUser`
row yet, so an expired unused invite never leaves an orphan account) and
emails a link to `/invite/[token]`; the invitee sets their own password
there. `createStaffUser` in `actions/admin.ts` is kept as a thin wrapper
around `inviteStaff` so nothing else needs to change.

### Two-stage login for MFA-enabled Admins
`signIn` verifies the password, and if the account has MFA enabled, sets a
short-lived **signed, HMAC'd** cookie (`AUTH_SECRET`) carrying only the
pending user id — not a session — and redirects to `/login/mfa`. The real
session is created only after `verifyMfaChallenge` accepts a TOTP code (or
a one-time recovery code). See `src/lib/auth/mfa-challenge.ts` for why an
unsigned cookie would still be safe here (the code check is the actual
boundary) but is signed anyway as defense in depth.

### Rate limiting and lockout are DB-backed, not in-memory
Serverless function instances don't share memory, so an in-process
counter resets on every cold start. `src/lib/auth/rate-limit.ts` counts
recent `security_audit_logs` rows instead — works correctly across
instances. Sign-in locks out for 15 minutes after 5 failed attempts per
email; sign-up and password-reset-request are similarly rate-limited.

### Password strength
`src/lib/auth/password.ts`: always-on length/variety checks plus an
embedded common-password blocklist (no network dependency, so it's
testable and always active). A secondary, best-effort HaveIBeenPwned
k-anonymity check runs too, but **fails open** on any network error and
**was not exercised in the sandbox this was built in** (that API domain
isn't reachable there) — verify it once deployed with normal outbound
network access.

### MFA secret storage
TOTP secrets are AES-256-GCM encrypted at rest (`MFA_ENCRYPTION_KEY`, 32
random bytes) — never plaintext, and unlike a password they must be
recoverable to verify codes, so they're encrypted rather than hashed.
Recovery codes, by contrast, are hashed (bcrypt) since they're only ever
compared, never decrypted.

## Testing

`npm test` — **45 passing tests across 15 files** (21 new this round).
New coverage: MFA secret encryption round-trip and TOTP accept/reject
(`mfa-crypto.test.ts`), password strength rules
(`password-strength.test.ts`), DB-backed login lockout
(`login-lockout.test.ts`), the full invite → accept → duplicate-use-
rejected flow using the real captured token from the test email adapter
(`staff-invitations.test.ts`), and session-revoke IDOR plus the full
password-reset flow including session revocation on reset
(`security-actions.test.ts`).

Building these tests required two additions to the test harness worth
noting: a `next/navigation` mock so `redirect()` (which throws in real
Next.js) is catchable via a new `tests/helpers.ts#expectRedirect`, and a
`next/headers` stub since several new auth code paths call `headers()`/
`cookies()` outside a request context. A pre-existing fake-DB gap was also
found and fixed along the way: unset nullable columns were left absent
from a row instead of defaulting to `null` the way Postgres would, which
silently broke a `where: { consumedAt: null }` lookup.

## Verification performed

- `npx tsc --noEmit` — clean except the pre-existing Prisma-client-stub
  cascade (this sandbox can't reach `binaries.prisma.sh` to run
  `prisma generate`; see the root `docs/PR_NOTES.md` for the full
  explanation, unchanged from prior rounds).
- `npx eslint .` — clean.
- `npx vitest run` — 45/45 passing.
- `npm run build` — verified twice: once for real (stops at the Google
  Fonts network call, same pre-existing sandbox limitation), and once
  with fonts stubbed purely to check further — webpack compiled
  successfully and stopped at exactly the same Prisma-stub cascade `tsc`
  already found, confirming nothing else broke.

## Environment variables added

See `.env.example`. New: `AUTH_SECRET` (signs the MFA-pending cookie,
required once any admin might sign in with MFA — throws a clear error if
missing rather than silently failing insecurely), `MFA_ENCRYPTION_KEY`
(encrypts TOTP secrets at rest, required once MFA is enabled). Both:
generate with `openssl rand -base64 32`.

## What I couldn't do from this environment

Same constraints as prior rounds (no live database, no GitHub/Vercel
access, no `binaries.prisma.sh` access) — see `docs/PR_NOTES.md`. Nothing
new to add there. Additionally for this PR specifically:

- The HaveIBeenPwned breach-check call was never actually exercised
  (network-restricted sandbox) — code review + the fail-open design should
  make this safe either way, but confirm it works once deployed.
- TOTP verification was tested against the `otpauth` library generating
  its own valid codes in-process — never against a real authenticator app
  (Google Authenticator, 1Password, etc.). The `otpauth://` URL format is
  standard, but do one real manual enrollment before considering this done.
- No live email was sent or received at any point — every email in this
  PR was captured by the in-memory test adapter or logged to console.
