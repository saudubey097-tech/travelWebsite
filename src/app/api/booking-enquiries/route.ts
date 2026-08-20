import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { submitBookingRequest } from "@/lib/booking/submit";
import { sendOperatorNotificationEmail } from "@/lib/email/notify-operator";

// Field names/shape here match the existing public BookingForm.tsx
// (bookingType, guests, quotedPrice in whole NZD) — this route is the
// integration seam that translates that public contract into the
// booking_requests domain model (serviceType, paxCount, cents).
//
// NOTE: the public form only exposes DAY_TOUR/TRANSFER/HOURLY today.
// CUSTOM (multi-day/bespoke) requests are supported at the schema and
// submitBookingRequest level for a future coordinator-created or extended
// public flow, but there's no dedicated UI section for it yet — tracked
// as a known gap, not silently claimed as built.
const bookingSchema = z
  .object({
    bookingType: z.enum(["DAY_TOUR", "TRANSFER", "HOURLY"]),
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(6).max(30),
    travelDate: z.string().date(),
    guests: z.coerce.number().int().min(1).max(11),
    pickup: z.string().trim().max(200).optional(),
    dropoff: z.string().trim().max(200).optional(),
    vehicle: z.enum(["sedan", "van", "xlVan"]).optional(),
    tour: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
    quotedPrice: z.coerce.number().int().positive().max(100000).optional(),
  })
  .superRefine((data, ctx) => {
    // Server-side field-by-service-type enforcement — a direct API call
    // can't skip this the way it could skip the form's `required` attrs.
    if (data.bookingType === "TRANSFER") {
      if (!data.pickup) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pickup"], message: "Pickup is required for a transfer." });
      if (!data.dropoff) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dropoff"], message: "Drop-off is required for a transfer." });
    }
    if (data.bookingType === "DAY_TOUR" && !data.tour) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tour"], message: "Choose which tour you'd like to book." });
    }
    if (data.bookingType === "HOURLY" && !data.vehicle) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vehicle"], message: "Choose a vehicle size for hourly hire." });
    }
  });

const VEHICLE_MAP = { sedan: "SEDAN", van: "VAN", xlVan: "XL_VAN" } as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cleaned =
    body && typeof body === "object"
      ? Object.fromEntries(Object.entries(body).filter(([, value]) => value !== ""))
      : body;
  const parsed = bookingSchema.safeParse(cleaned);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Please check the booking details and try again." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Identity comes from the session, never from the form, once signed in —
  // a logged-in customer can't submit a request as (or notify) someone
  // else by editing the name/email/phone fields. Anonymous visitors still
  // supply their own contact details, since there's no account yet.
  const currentUser = await getCurrentUser();
  const authedUserId = currentUser?.role === "CUSTOMER" ? currentUser.id : null;
  const identity = authedUserId
    ? { name: currentUser!.name, email: currentUser!.email, phone: data.phone }
    : { name: data.name, email: data.email, phone: data.phone };

  let created;
  try {
    created = await submitBookingRequest({
      serviceType: data.bookingType,
      name: identity.name,
      email: identity.email,
      phone: identity.phone,
      travelDate: data.travelDate,
      paxCount: data.guests,
      pickup: data.pickup,
      dropoff: data.dropoff,
      vehicleClass: data.vehicle ? VEHICLE_MAP[data.vehicle] : undefined,
      tourSlug: data.tour,
      notes: data.notes,
      quotedPriceCents: data.quotedPrice ? data.quotedPrice * 100 : undefined,
      authedUserId,
    });
  } catch {
    return NextResponse.json({ error: "We could not save your request. Please try again shortly." }, { status: 500 });
  }

  // Best-effort operator email — the request is already durably saved above,
  // so an email-provider outage never loses a booking request, and we never
  // claim delivery happened when it didn't (see sendOperatorNotificationEmail).
  await sendOperatorNotificationEmail({
    reference: created.reference,
    bookingType: data.bookingType,
    travelDate: data.travelDate,
    guests: data.guests,
    pickup: data.pickup,
    dropoff: data.dropoff,
    tour: data.tour,
    vehicle: data.vehicle,
    quotedPrice: data.quotedPrice ? data.quotedPrice * 100 : undefined,
    notes: data.notes,
    name: identity.name,
    email: identity.email,
    phone: identity.phone,
  }).catch(() => null);

  return NextResponse.json({ reference: created.reference, status: created.status, bookingId: created.id });
}
