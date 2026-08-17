import "server-only";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { recordEvent, generateReference } from "@/lib/booking/events";
import { notify } from "@/lib/booking/notify";
import { randomBytes } from "node:crypto";
import type { ServiceType, VehicleClass } from "@prisma/client";

export interface SubmitBookingInput {
  serviceType: ServiceType;
  name: string;
  email: string;
  phone: string;
  travelDate: string; // ISO date, e.g. "2026-09-01"
  paxCount: number;
  pickup?: string;
  dropoff?: string;
  vehicleClass?: VehicleClass;
  tourSlug?: string;
  notes?: string;
  quotedPriceCents?: number;
  /** Pass the signed-in user's id when the submitter has a session; null for anonymous visitors. */
  authedUserId: string | null;
}

/**
 * The single place a booking_requests row gets created, used by both the
 * public booking form (anonymous or signed-in) and any future internal
 * "create on behalf of a customer" flow. Wraps: find-or-create customer,
 * create the request in SUBMITTED, write the audit event, and notify every
 * active coordinator/admin — all inside one transaction.
 *
 * KNOWN LIMITATION: an anonymous submission that creates a brand-new
 * customer account gets a random, never-disclosed password. There's no
 * password-reset/magic-link flow yet, so that customer can't sign in to
 * track the request online until one is added — see PR notes.
 */
export async function submitBookingRequest(input: SubmitBookingInput) {
  let customerId: string;

  if (input.authedUserId) {
    customerId = input.authedUserId;
  } else {
    const existing = await db.appUser.findUnique({ where: { email: input.email } });
    if (existing) {
      customerId = existing.id;
    } else {
      const randomPassword = randomBytes(24).toString("base64url");
      const passwordHash = await hashPassword(randomPassword);
      const created = await db.appUser.create({
        data: { name: input.name, email: input.email, phone: input.phone, passwordHash, role: "CUSTOMER" },
      });
      customerId = created.id;
    }
  }

  const reference = generateReference();

  return db.$transaction(async (tx) => {
    const created = await tx.bookingRequest.create({
      data: {
        reference,
        customerId,
        serviceType: input.serviceType,
        status: "SUBMITTED",
        tourSlug: input.tourSlug,
        pickupAddress: input.pickup,
        dropoffAddress: input.dropoff,
        vehicleClass: input.vehicleClass,
        travelDate: new Date(input.travelDate),
        paxCount: input.paxCount,
        notes: input.notes,
        quotedPriceCents: input.quotedPriceCents,
      },
    });

    await recordEvent(tx, {
      bookingRequestId: created.id,
      actorId: input.authedUserId,
      previousStatus: null,
      newStatus: "SUBMITTED",
      context: { source: input.authedUserId ? "authenticated" : "public_form" },
    });

    const staff = await tx.appUser.findMany({
      where: { role: { in: ["COORDINATOR", "ADMIN"] }, active: true },
      select: { id: true },
    });
    for (const person of staff) {
      await notify(tx, {
        userId: person.id,
        type: "NEW_BOOKING_REQUEST",
        title: "New booking request",
        body: `${input.name} requested a ${input.serviceType.toLowerCase().replace("_", " ")} (${reference}).`,
        link: `/coordinator/bookings/${created.id}`,
      });
    }

    return created;
  });
}
