# Southbound — System Design (Phase 2)

This extends the running Phase-1 scaffold (home/tours/transfers/hourly pages
already built) into a full production architecture. Nothing here is
theoretical filler — every piece below maps to a real file that either
already exists or is named exactly as it will be created in Phase 3.

## 1. Folder structure (target state)

```
southbound/
  prisma/
    schema.prisma          ✅ written (this phase)
    seed.ts                 – Phase 3
  src/
    app/
      (marketing)/          – public pages, grouped so they can share a layout
        page.tsx             ✅ home
        about/page.tsx        – Phase 3
        how-it-works/page.tsx – Phase 3
        contact/page.tsx      – Phase 3
        faq/page.tsx           – Phase 3
        blog/
          page.tsx             – Phase 3 (listing)
          [slug]/page.tsx      – Phase 3 (post)
      tours/
        page.tsx             ✅
        [slug]/page.tsx      ✅
      transfers/page.tsx     ✅
      hourly/page.tsx        ✅
      (auth)/
        sign-in/page.tsx     – Phase 3
        sign-up/page.tsx     – Phase 3
      (customer)/
        dashboard/
          page.tsx             – Phase 3 (bookings list)
          bookings/[id]/page.tsx – Phase 3
      (admin)/
        admin/
          page.tsx             – Phase 3 (overview)
          tours/page.tsx        – Phase 3 (CRUD)
          bookings/page.tsx     – Phase 3
          drivers/page.tsx      – Phase 3
      api/
        auth/[...nextauth]/route.ts   – Phase 3, NextAuth handler
        tours/route.ts                – Phase 3, GET list / POST (admin)
        tours/[id]/route.ts           – Phase 3, GET/PATCH/DELETE (admin)
        transfers/quote/route.ts      – Phase 3, POST → live quote
        bookings/route.ts             – Phase 3, POST create / GET list (mine)
        bookings/[id]/route.ts        – Phase 3, GET/PATCH (status)
        payments/deposit/route.ts     – Phase 3, POST → Stripe intent
        payments/webhook/route.ts     – Phase 3, Stripe webhook
        reviews/route.ts              – Phase 3, POST/GET
        admin/drivers/[id]/route.ts   – Phase 3, PATCH (approve/suspend)
    components/
      layout/            ✅ Navbar, Footer
      ui/                ✅ Button, Card, RouteLine  → + shadcn primitives (Phase 3)
      home/              ✅ Hero, ValueProps
      tours/             ✅ TourCard  → + TourFilters, TourSearch (Phase 3)
      transfers/         ✅ QuoteForm
      booking/           – Phase 3: BookingForm, BookingSummary, DepositCTA
      dashboard/         – Phase 3: BookingsTable, BookingStatusBadge
      admin/             – Phase 3: AdminTable, TourEditor, DriverApprovalRow
    lib/
      tours.ts           ✅ → becomes a thin wrapper over Prisma queries
      pricing.ts         ✅ → distance calc swapped for a real routing call
      auth.ts             – Phase 3, NextAuth config + helpers
      prisma.ts           – Phase 3, singleton Prisma client
      stripe.ts           – Phase 3, Stripe client
      email.ts            – Phase 3, Resend client + templates
      validation/         – Phase 3, Zod schemas (one file per domain: tour.ts, booking.ts, transfer.ts)
    hooks/                – Phase 3, TanStack Query hooks (useTours, useCreateBooking, ...)
    types/               ✅ → generated Prisma types re-exported alongside these
    data/                ✅ mock data, deleted once Prisma is wired in Phase 3
  docs/
    ARCHITECTURE.md       ✅ this file
    API.md                ✅ endpoint reference
```

## 2. Database schema

See `prisma/schema.prisma`. Key modeling decisions:

- **One `Booking` model for all three products** (day tour / transfer /
  hourly), discriminated by `type`, with the transfer/hourly-only fields
  left nullable. Simpler than three separate tables, and every booking
  shares the same status/payment lifecycle regardless of product type.
- **Money stored as integer cents** (`totalCents`, `amountCents`) to avoid
  floating-point rounding in financial data — formatted back to display
  currency only at the UI layer.
- **`Payment` is separate from `Booking`** (one-to-many) so the
  deposit-then-balance flow is just two `Payment` rows against one
  booking, and refunds/failed charges don't corrupt the booking record.
- **`Driver` and `Vehicle` are separate from `User`** because a driver
  account can own multiple vehicles, and not every `User` is a driver.
- **NextAuth's required models** (`Account`, `Session`,
  `VerificationToken`) are included as-is per the Prisma adapter's schema
  contract, so auth works with zero custom glue code.

## 3. API architecture

REST-ish route handlers under `src/app/api/**`, not a separate backend —
Next.js API routes are sufficient at this scale and keep one deployable
unit. Every route validates its input with a **Zod** schema from
`src/lib/validation/` before touching Prisma; no handler trusts raw
`request.json()`.

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/tours` | GET | public | list active tours (filter by region/query params) |
| `/api/tours` | POST | admin | create tour |
| `/api/tours/[id]` | PATCH/DELETE | admin | edit/retire tour |
| `/api/transfers/quote` | POST | public | pickup/dropoff/vehicleClass → live price (calls routing provider) |
| `/api/bookings` | POST | authenticated | create a booking (any of the 3 types) → status `PENDING` |
| `/api/bookings` | GET | authenticated | list the current user's bookings |
| `/api/bookings/[id]` | GET | owner or admin | booking detail |
| `/api/bookings/[id]` | PATCH | admin | change status (confirm/cancel/complete) |
| `/api/payments/deposit` | POST | authenticated | create a Stripe PaymentIntent for a booking's deposit |
| `/api/payments/webhook` | POST | Stripe signature | mark `Payment`/`Booking` status on `payment_intent.succeeded` |
| `/api/reviews` | POST | authenticated | submit a review tied to a completed booking |
| `/api/reviews` | GET | public | published reviews for a tour |
| `/api/admin/drivers/[id]` | PATCH | admin | approve/suspend a driver |

Full request/response shapes are in `docs/API.md`.

## 4. Authentication design (NextAuth)

- **Providers**: Credentials (email + password, hashed with bcrypt) +
  Google OAuth as the fast path — both write into the same `User` table.
- **Session strategy**: database sessions (not JWT) since we already have
  Postgres via Prisma — makes server-side revocation and role checks
  trivial (`session.user.role`).
- **Authorization**: role check (`TRAVELER` / `DRIVER` / `ADMIN`) enforced
  in a small `requireRole()` helper in `src/lib/auth.ts`, called at the
  top of every protected route handler and in a `middleware.ts` for page
  routes under `(admin)/` and `(customer)/`.
- **Driver onboarding** is a distinct state machine, not a role you get at
  signup: a `User` becomes `DRIVER` role only after an admin approves
  their `Driver` record (`status: APPLIED → APPROVED`), so "Drive With
  Us" submissions don't silently grant access.

## 5. Component architecture

Unchanged principle from Phase 1: **pages compose components, components
never fetch their own data via `useEffect`** — server components fetch
(via Prisma or a TanStack Query prefetch) and pass data down; client
components (forms, the quote calculator, filters) handle interaction
only. Phase 3 adds shadcn/ui primitives (`Dialog`, `Select`, `Tabs`,
`Table`) underneath the existing custom `Button`/`Card`/`RouteLine` —
shadcn components are copied into `components/ui/` and re-themed with the
existing Tailwind tokens, not used with their default styling.

## 6. State management strategy

- **Server state** (tours, bookings, reviews): **TanStack Query**, with
  server components doing the initial fetch/prefetch and query hooks
  (`useBookings`, `useTourQuote`) handling client-side refetching,
  optimistic updates (e.g. cancelling a booking), and cache invalidation
  after mutations.
- **Form state**: **React Hook Form + Zod** resolver for every form
  (booking, contact, review, admin tour editor) — one schema shared
  between client validation and the API route's server-side validation,
  so the rules can't drift apart.
- **Global client state**: intentionally minimal — no Redux/Zustand.
  The only genuinely global client state is auth session (via NextAuth's
  `useSession`) and UI-only state (open/closed dialogs), which stays local
  to the component that owns it.

## What's next (Phase 3)

Backend implementation, in this order: `lib/prisma.ts` + `lib/auth.ts` →
Zod schemas → the API routes in the table above → booking/dashboard/admin
UI → email templates → Stripe wiring → seed data. Say the word and I'll
start generating those files into the same codebase.
