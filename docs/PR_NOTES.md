# Role-based booking workflow — implementation notes

These notes are written to be pasted into the draft PR description (I don't
have GitHub access from this environment — see "What I couldn't do" below).
This document covers two rounds of work: the initial workflow build, and a
follow-up pass that added coordinator claim/priority/revoke, admin overrides
and alerts, the `/admin/users/[id]` page, search/pagination throughout, and
a wider automated-test surface.

## Summary

Adds the full customer → coordinator → driver → admin booking workflow on
top of the existing premium public site, without touching its design system
or any of `/tours`, `/transfers`, `/hourly`, the quote calculator, or the
booking-request API's external contract.

## Database

Replaced the previous `prisma/schema.prisma` — a NextAuth/Stripe/Tour-catalog
design that had **never been migrated** (no `prisma/migrations/` existed in
the repo) — with one mapped directly onto the six specified tables:
`app_users`, `booking_requests`, `booking_assignments`, `booking_messages`,
`booking_events`, `notifications` (all `@@map`'d to snake_case). One addition
beyond the spec: a `sessions` table, required for secure server-side session
handling — flagged clearly in the schema comments as an addition, not a
duplicate.

Money is stored as integer cents (`quotedPriceCents`, `confirmedPriceCents`)
and only formatted to NZD at render time. Dates are stored as UTC `DateTime`
and rendered in `Pacific/Auckland` throughout the UI.

**Migration:** run `npx prisma migrate dev --name role_workflow` against a
real `DATABASE_URL`/`DIRECT_DATABASE_URL` (Neon pooled + direct connection
strings — see `.env.example`). No prior schema was in production, so this is
a clean initial migration, not a data-preserving alter.

**Seeding:** `npm run db:seed` creates one demo account per role
(`admin@example.com`, `coordinator@example.com`, `driver@example.com`,
`customer@example.com`, all password `ChangeMe123!` — rotate before any real
use).

## Roles & permissions

- **Customer** — self-registers via `/signup`. `/dashboard`: own bookings
  only (enforced by `WHERE id = ? AND customerId = ?` in every query, not
  just route hiding), create requests, cancel before the trip starts,
  message their driver once accepted.
- **Coordinator** — created by an Admin only. `/coordinator`: queue view,
  edit trip details, set confirmed price, assign/reassign drivers, message
  (customer-visible or internal), mark scheduled.
- **Driver** — created by an Admin only. `/driver`: own assignments only
  (same ownership-filtered-query pattern), accept/decline with required
  decline reason, progress the trip through
  `IN_COMMUNICATION → SCHEDULED → IN_PROGRESS → COMPLETED`, message the
  customer once accepted. Customer contact info is withheld until acceptance
  (enforced in the query itself, not just the UI).
- **Admin** — full visibility, staff user management, assignment override
  (with required reason), operational summary metrics, immutable audit
  trail.

Every server action starts with `requireUser()`/`requireRole(...)` from
`src/lib/auth/session.ts` — this is the actual authorization boundary. The
`middleware.ts` at the repo root only checks for a session *cookie's
presence* to bounce obviously-signed-out visitors before a page renders; it
runs on the Edge runtime and can't reach Postgres, so it is explicitly
documented in-file as a UX shortcut, not a security control.

## Lifecycle & audit trail

`src/lib/booking/transition.ts` holds the one legal-transitions map
(`ALLOWED_TRANSITIONS`) and is the only code path allowed to write
`booking_requests.status` — it always writes the matching `booking_events`
row in the same transaction, so the audit trail can't drift from reality.

## Atomic driver acceptance

`respondToAssignment` in `src/lib/actions/driver.ts` uses a
compare-and-swap `updateMany` on `booking_requests.status` as the actual
lock: only the first transaction to flip it away from
`PENDING_ASSIGNMENT`/`REASSIGNMENT_REQUIRED` succeeds; a concurrent
acceptance updates zero rows and is rejected with "already claimed by
another driver." Sibling `OFFERED` assignments are withdrawn in the same
transaction. See `tests/driver-atomic-accept.test.ts` for both the
sequential-rejection path and a direct simulation of the deep transactional
guard.

## Public booking form → real workflow

`src/app/api/booking-enquiries/route.ts` (used by the existing, unmodified
`BookingForm.tsx`) now persists a `booking_requests` row via
`src/lib/booking/submit.ts`, writes the audit event, notifies every active
coordinator/admin, and — as a **separate, best-effort step after the DB
write** — sends the operator email through Resend. This is a deliberate
behavior change from before: previously a missing Resend config made the
route return an error and refuse the booking; now the database record is
the source of truth and an email-provider outage never loses a request.

**Known limitation:** an anonymous submission that creates a brand-new
customer account gets a random, never-disclosed password (there's no
password-reset/magic-link flow yet), so that customer can't sign in to
track their request online until one is added.

## Messaging & notifications

`ConversationPanel` enforces visibility in the *server actions*
(`sendCustomerMessage`, `sendDriverMessage`, `sendCoordinatorMessage`), not
just by hiding UI — a customer's action rejects sending unless an
`ACCEPTED` assignment exists and the booking is in a messageable status.
`NotificationBell` reads/marks-read through IDOR-safe queries scoped to the
current user.

## Testing

`npm test` (Vitest) — 18 passing tests across 8 files, covering all 8
required scenarios. These are **logic-level unit tests** against an
in-memory fake of the Prisma client (`tests/fakeDb.ts`) with a mocked
session layer — see `tests/README.md` for exactly what this does and
doesn't prove. Notably it proved out a real design property during
development: the atomic-acceptance guard has two layers (a cheap
"already responded to" check on the assignment itself, and a deep
transactional compare-and-swap on the booking) — the test suite exercises
both explicitly.

**Before production:** add an integration suite against a real (disposable)
Postgres instance — a Neon branch works well for this — to exercise genuine
`$transaction` isolation under concurrent load, which the in-memory fake
can't reproduce.

## Second round — operational depth

- **Schema addition:** `booking_requests.priority` (boolean) for the
  coordinator's urgency flag, and the `audit_logs` table described above
  for account-level changes.
- **Coordinator:** claim/self-assign, priority flag, revoke an unaccepted
  offer (with mandatory reason), search across reference/customer/route,
  a fuller metrics strip.
- **Admin:** `/admin` now shows completion rate, driver acceptance rate,
  reassignment count, and an alerts panel (unassigned >24h, offers a driver
  hasn't responded to in >24h, bookings stuck in `REASSIGNMENT_REQUIRED`).
  `/admin/bookings` gained search + real pagination. `/admin/bookings/[id]`
  gained a status-correction override (bypasses the normal transition
  guard, always requires a reason, always logged as `override: true` in
  the event context so it's never confused with a routine transition),
  private admin notes, and a "resend notification" action (re-delivers as
  a fresh in-app notification — see limitation below). New
  `/admin/users/[id]` page with driver profile editing and per-account
  audit history.
- **Last-active-admin protection:** deactivating or role-changing the only
  active admin is refused server-side, not just hidden in the UI.
- **Decline reason changed from required to optional**, per this round's
  explicit spec wording (the first round had required it).
- **Shared components added:** `EmptyState`, `ErrorState`, `ConfirmDialog`
  (inline confirm-with-optional-or-required-reason, used for cancel/
  decline/revoke/override), `Pagination`, `SearchFilterToolbar`,
  `AssignmentHistory`, plus a shared NZ date-formatting util.
- **Tests:** added `tests/reassignment-and-cancellation.test.ts` (decline →
  `REASSIGNMENT_REQUIRED` → reassign → second driver accepts, plus
  cancel-with-reason and the in-progress-can't-cancel guard) and
  `tests/admin-overrides.test.ts` (last-active-admin protection,
  status-correction override auditing, and that a customer can't reach it).
  24 tests across 10 files, all passing.
- **`e2e/full-workflow.spec.ts`** — a real Playwright spec covering
  Customer request → Coordinator assignment → Driver accept → Messaging →
  Driver completes → Admin audit review, using the seeded demo accounts.
  **Not executed here** (no browser binaries, no live server/database in
  this sandbox) — see `e2e/README.md` for how to run it once you have both.

**Known limitation (resend notifications):** `resendNotification` creates a
fresh in-app notification row for the same recipient; it does not re-send
an external email. Notifications are correlated to a booking by searching
for the booking id inside each notification's `link` field, since
`notifications` is user-scoped rather than booking-scoped in the schema —
a pragmatic choice to avoid adding a stricter relation for a minor feature,
but worth tightening if resend becomes a heavily-used action.

## What I couldn't do from this environment

I was building this without a live database connection, GitHub access, or
Vercel access (confirmed with the requester up front — this is the
"build the code here, apply/deploy it yourself" path):

1. **`npx prisma generate` fails here** — it needs to download engine
   binaries from `binaries.prisma.sh`, which isn't reachable from this
   sandbox's network allowlist. Everything downstream of that (the real
   generated `@prisma/client` types — `BookingStatus`, `Role`, `AppUser`,
   etc.) is unavailable, so `@prisma/client` sits at its untyped
   placeholder stub here.
   - **What I verified anyway:** `npx tsc --noEmit` was run and diffed
     against this exact failure mode — every remaining error is either
     "Module has no exported member X" (an enum/model Prisma hasn't
     generated) or an implicit-`any` parameter that cascades from that. I
     fixed every error that *wasn't* downstream of this (a
     `noUncheckedIndexedAccess` issue in `StatusBadge`, a `<form action>`
     type mismatch in `UserRow`, and a couple of test-file strict-mode
     index accesses).
   - **`npm run build` was run twice**: once for real (stopped at the font
     step below), and once with Google Fonts stubbed out purely to see how
     much further it would get — webpack compiled successfully and it
     stopped at exactly the same Prisma-stub cascade `tsc` had already
     found, confirming there's no additional build-only failure hiding
     behind it.
   - **Action needed from you:** run `npx prisma generate` (or
     `npm run build`, which triggers it) in an environment that can reach
     `binaries.prisma.sh`, then re-run `npx tsc --noEmit` — it should come
     back clean. If it doesn't, the remaining diff will be small and
     specific, not the ~50-line cascade seen here.
2. **`next/font/google` also needs network access this sandbox doesn't
   have** (`fonts.googleapis.com`) — this is a pre-existing constraint of
   this project, not something introduced in this change; it'll resolve
   itself in any normal environment.
3. **Migration was never run against a real database** — the schema is
   new and internally consistent, but hasn't been validated against actual
   Postgres/Neon DDL execution. Run the migration in a preview branch first.
4. **No GitHub PR update, no Vercel preview link** — no repo or deployment
   access from here. All of the above is ready to commit and push yourself,
   or hand to an environment (e.g. Claude Code with your repo/DB connected)
   that can run the remaining steps end-to-end.

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | ChangeMe123! |
| Coordinator | coordinator@example.com | ChangeMe123! |
| Driver | driver@example.com | ChangeMe123! |
| Customer | customer@example.com | ChangeMe123! |

Rotate or delete these before any production use.
