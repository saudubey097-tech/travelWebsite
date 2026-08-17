"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { transitionBooking } from "@/lib/booking/transition";
import { notify } from "@/lib/booking/notify";
import { sendMessageSchema, cancelBookingSchema } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/auth";

const MESSAGEABLE_STATUSES = ["IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"] as const;

export async function listMyBookings() {
  const user = await requireUser();
  return db.bookingRequest.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      assignments: {
        where: { status: "ACCEPTED" },
        include: { driver: { select: { id: true, name: true, phone: true } } },
      },
    },
  });
}

/**
 * IDOR-safe: the where clause filters by (id AND customerId) together, so a
 * customer requesting someone else's booking id simply gets `null` back —
 * never another customer's data, never a distinguishable error.
 */
export async function getMyBooking(bookingId: string) {
  const user = await requireUser();
  return db.bookingRequest.findFirst({
    where: { id: bookingId, customerId: user.id },
    include: {
      assignments: { include: { driver: { select: { id: true, name: true, phone: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      messages: {
        where: { visibility: "CUSTOMER_VISIBLE" },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

export async function cancelBooking(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = cancelBookingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const user = await requireUser();

  const booking = await db.bookingRequest.findFirst({
    where: { id: parsed.data.bookingId, customerId: user.id },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  try {
    await db.$transaction(async (tx) => {
      await transitionBooking(tx, {
        bookingId: booking.id,
        currentStatus: booking.status,
        newStatus: "CANCELLED",
        actorId: user.id,
        context: { cancelledBy: "customer" },
      });
      if (booking.coordinatorId) {
        await notify(tx, {
          userId: booking.coordinatorId,
          type: "BOOKING_CANCELLED",
          title: "Customer cancelled a request",
          body: `${booking.reference} was cancelled by the customer.`,
          link: `/coordinator/bookings/${booking.id}`,
        });
      }
    });
  } catch {
    return { ok: false, error: "This trip can no longer be cancelled." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function sendCustomerMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    visibility: "CUSTOMER_VISIBLE",
  });
  if (!parsed.success) return { ok: false, error: "Message can't be empty." };
  const user = await requireUser();

  const booking = await db.bookingRequest.findFirst({
    where: { id: parsed.data.bookingId, customerId: user.id },
    include: { assignments: { where: { status: "ACCEPTED" } } },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  const driverAccepted = booking.assignments.length > 0;
  const statusOk = (MESSAGEABLE_STATUSES as readonly string[]).includes(booking.status);
  if (!driverAccepted || !statusOk) {
    return { ok: false, error: "Messaging opens once a driver has accepted your trip." };
  }

  await db.$transaction(async (tx) => {
    await tx.bookingMessage.create({
      data: {
        bookingRequestId: booking.id,
        senderId: user.id,
        visibility: "CUSTOMER_VISIBLE",
        body: parsed.data.body,
      },
    });
    const driverId = booking.assignments[0].driverId;
    await notify(tx, {
      userId: driverId,
      type: "NEW_MESSAGE",
      title: "New message from customer",
      body: `You have a new message about ${booking.reference}.`,
      link: `/driver/trips/${booking.id}`,
    });
  });

  revalidatePath(`/dashboard/bookings/${booking.id}`);
  return { ok: true };
}
