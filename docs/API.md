# API Reference (Phase 2 design — implemented in Phase 3)

All routes live under `src/app/api/`. Request bodies are validated with
Zod schemas from `src/lib/validation/` before any Prisma call — a request
that fails validation gets a `400` with a field-level error list, never a
raw stack trace.

## GET /api/tours
Public. Query params: `region?`, `q?` (search), `page?`, `pageSize?`.
```json
// 200
{
  "items": [{ "id": "...", "slug": "geothermal-valley-day", "title": "...", "priceFromCents": 88000, "region": "Bay of Plenty" }],
  "page": 1,
  "pageSize": 12,
  "total": 4
}
```

## POST /api/tours (admin)
```json
// request
{ "slug": "new-tour", "title": "...", "regionId": "...", "durationHours": 10,
  "priceFromCents": 80000, "heroImageUrl": "https://res.cloudinary.com/...",
  "highlights": ["..."], "included": ["..."], "stops": [{ "name": "...", "region": "...", "sequence": 0 }] }
```
`201` with the created tour, `403` if `session.user.role !== "ADMIN"`.

## POST /api/transfers/quote
Public.
```json
// request
{ "pickup": "Auckland Airport", "dropoff": "Sky Tower, Auckland", "vehicleClass": "SEDAN" }
// 200
{ "distanceKm": 21.4, "durationMinutes": 32, "priceCents": 7370, "currency": "NZD", "depositPct": 20 }
```
Internally calls a routing provider (placeholder in Phase 1 code,
real provider wired in Phase 3) — this is the only place that changes.

## POST /api/bookings
Authenticated.
```json
// request (transfer example)
{ "type": "TRANSFER", "pickupAddress": "...", "dropoffAddress": "...",
  "vehicleClass": "SEDAN", "scheduledAt": "2026-08-10T09:00:00Z", "paxCount": 2 }
// 201
{ "id": "...", "status": "PENDING", "totalCents": 7370, "currency": "NZD" }
```
Server re-derives price from `/api/transfers/quote` logic server-side —
never trusts a client-supplied price.

## GET /api/bookings
Authenticated. Returns the caller's own bookings (or all, if admin and
`?all=true`). Paginated like `/api/tours`.

## PATCH /api/bookings/[id]
Admin only, or the owning user for `status: "CANCELLED"` (subject to the
24-hour free-cancellation window, enforced server-side against
`scheduledAt`).

## POST /api/payments/deposit
Authenticated, must own the booking.
```json
// request
{ "bookingId": "..." }
// 200
{ "clientSecret": "pi_..._secret_..." }  // Stripe PaymentIntent client secret
```

## POST /api/payments/webhook
Stripe signature verified via `STRIPE_WEBHOOK_SECRET`. On
`payment_intent.succeeded`, marks the matching `Payment.status = PAID`
and, if it was the deposit, `Booking.status = CONFIRMED`; sends a
confirmation email via Resend.

## POST /api/reviews
Authenticated, requires a `COMPLETED` booking owned by the caller with no
existing review.
```json
{ "bookingId": "...", "rating": 5, "body": "..." }
```

## GET /api/reviews?tourId=...
Public. Returns only `published: true` reviews.

## PATCH /api/admin/drivers/[id]
Admin only.
```json
{ "status": "APPROVED" }
```
Approving sets the linked `User.role = "DRIVER"`.

---

**Error shape (all routes)**
```json
// 400
{ "error": "ValidationError", "issues": [{ "path": ["pickup"], "message": "Required" }] }
// 401 / 403
{ "error": "Unauthorized" }
// 404
{ "error": "NotFound" }
```
