# Route map, roles, and lifecycle

## Route map

| Route | Role(s) | Purpose |
|---|---|---|
| `/`, `/tours`, `/transfers`, `/hourly`, `/book` | Public | Marketing site + booking form (unchanged) |
| `/login`, `/signup` | Public | Sign in; customer self-registration |
| `/dashboard` | Customer | Trip list, summary cards, notifications |
| `/dashboard/bookings/[id]` | Customer (own bookings only) | Detail, messaging, cancel, notes |
| `/coordinator` | Coordinator, Admin | Queue, metrics, search, claim, priority |
| `/coordinator/bookings/[id]` | Coordinator, Admin | Workspace: edit, assign, revoke, schedule, message |
| `/driver` | Driver, Admin | Offered/active/completed trips |
| `/driver/trips/[id]` | Driver (own assignments only), Admin | Accept/decline, status updates, messaging |
| `/admin` | Admin | Metrics, alerts, quick links |
| `/admin/bookings` | Admin | Search, filter, paginate every booking |
| `/admin/bookings/[id]` | Admin | Full audit, override, correct status, notes |
| `/admin/users` | Admin | Tabs by role, create staff, search |
| `/admin/users/[id]` | Admin | Profile, driver info, audit history |

## Role permissions, in one paragraph each

**Customer** — sees and acts on only their own `booking_requests` rows
(every query filters by `customerId = session.user.id`). Can message a
driver only once an `ACCEPTED` assignment exists and status is
`IN_COMMUNICATION`/`SCHEDULED`/`IN_PROGRESS`. Can cancel from any
pre-`IN_PROGRESS` status. Can self-register; cannot become staff.

**Coordinator** — sees every booking. Can review/edit details, set the
confirmed price, assign/reassign/revoke drivers, message customer-visible
or internal, mark scheduled. Cannot manage users or override another
coordinator's claim without unclaiming first. Created by an Admin only.

**Driver** — sees only assignments where `driverId = session.user.id`
(enforced in the query, not the UI). Customer contact details are withheld
until their assignment is `ACCEPTED`. Can accept/decline (decline reason
optional), and once accepted, progress
`ACCEPTED → IN_COMMUNICATION → SCHEDULED → IN_PROGRESS → COMPLETED`.
Created by an Admin only.

**Admin** — sees everything, manages all staff accounts (create,
activate/deactivate, change role — never allowed to remove the last active
admin), can override an assignment or force-correct a status with a
mandatory reason (always logged as an override, never silent), views the
full audit trail. Cannot delete `booking_events` or `booking_messages`.

## Lifecycle

```
SUBMITTED → PENDING_ASSIGNMENT → ACCEPTED → IN_COMMUNICATION → SCHEDULED → IN_PROGRESS → COMPLETED
                    ↕                ↕              ↕              ↕
            REASSIGNMENT_REQUIRED ←──┴──────────────┴──────────────┘
                    ↓
              (coordinator re-offers → PENDING_ASSIGNMENT)

Any pre-IN_PROGRESS status → CANCELLED (customer or coordinator/admin)
```

The full transition table lives in `src/lib/booking/transition.ts`
(`ALLOWED_TRANSITIONS`) — it's the single source of truth every status
change goes through, and it's what writes the matching `booking_events`
row. An Admin's `correctBookingStatus` action is the one deliberate
exception: it bypasses this table but always requires a reason and is
tagged `override: true` in the event.

## Setup

See the root `README.md` and `.env.example` for environment variables.
Quick reference:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name role_workflow
npm run db:seed        # optional — demo accounts, see below
npm run build
npm run lint
npm test               # unit tests (Vitest)
npm run test:e2e       # Playwright — needs a running server + seeded DB
```

## Demo accounts (only if you run `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | ChangeMe123! |
| Coordinator | coordinator@example.com | ChangeMe123! |
| Driver | driver@example.com | ChangeMe123! |
| Customer | customer@example.com | ChangeMe123! |

These are seed-only convenience accounts, not created by default — rotate
or delete before any real deployment.
