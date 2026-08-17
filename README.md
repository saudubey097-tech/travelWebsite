# Southbound

An original, independent travel-booking concept for private day tours,
point-to-point transfers, and hourly driver hire in New Zealand — built as
its own product, not a copy of any existing site. It's inspired by the
*category* (per-vehicle private transport booking), not by any single
company's branding, copy, or assets.

## What this is

A working Next.js 15 / React 19 / TypeScript / Tailwind frontend with:

- Home page with a trip-type hero (day tours / transfers / hourly)
- Day tour listing + dynamic detail pages (`/tours`, `/tours/[slug]`)
- A live transfer quote calculator (`/transfers`)
- Hourly hire plans (`/hourly`)
- A booking-request form (`/book`) with server-side validation and Resend email delivery
- A small reusable component library (Button, Card, RouteLine, TourCard)
- A data-access layer (`src/lib/tours.ts`, `src/lib/pricing.ts`) that
  isolates mock data and a placeholder pricing formula so a real
  database, routing API, and payments provider can be dropped in later
  without touching page or component code.

## What this is *not* (yet)

Being upfront about scope: this is a frontend build you can run locally
and extend. It does not include a wired-up database, authentication,
payments, or a deployed backend — those are the natural next steps once
the product direction is validated. Suggested path:

1. **Distance/pricing** — replace `estimateDistanceKm` and
   `estimateTransfer` in `src/lib/pricing.ts` with a real routing API
   call and your actual rate card.
2. **Data** — replace `src/data/tours.ts` and the functions in
   `src/lib/tours.ts` with calls to a database (Prisma + Postgres is a
   solid default) or headless CMS.
3. **Auth** — add NextAuth (or similar) behind the existing `/auth` link.
4. **Booking + payments** — booking requests now deliver to the operator by
   email. Add database persistence, availability/driver assignment and a Stripe
   deposit flow before describing payments as live.
5. **Tests** — add Playwright for the quote flow and tour browsing once
   the above is real, since right now there's no backend behavior to
   meaningfully test end-to-end.

## Design system

- **Palette**: pine green (`#1F3A31`) + warm paper (`#F2EEE3`) + a gold
  accent (`#C99A3C`) used only for route markers, prices, and small
  labels — deliberately not a warm-cream/terracotta or dark/neon default.
- **Type**: Fraunces (display, used in italics for the hero line) +
  Public Sans (body) + IBM Plex Mono (prices, distances, labels).
- **Signature element**: the `RouteLine` component — a dashed line with
  a gold waypoint dot between two labelled points — because every
  product here is fundamentally "point A to point B." It recurs in the
  hero, tour cards, tour detail pages, and the quote result.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. (This environment couldn't run
`npm install` itself — no network access — so dependencies are declared
in `package.json` but not installed or executed; do that on your own
machine.)

## Project structure

```
src/
  app/                  routes (App Router)
    tours/[slug]/       dynamic tour detail
    transfers/          quote calculator page
    hourly/             hourly hire plans
  components/
    layout/             Navbar, Footer
    ui/                 Button, Card, RouteLine
    home/               Hero, ValueProps
    tours/              TourCard
    transfers/          QuoteForm
  lib/                  pricing.ts, tours.ts — the backend-swap seam
  data/                 mock tour data
  types/                shared domain types
```
