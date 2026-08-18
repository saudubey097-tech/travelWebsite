"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { transitionBooking } from "@/lib/booking/transition";
import { recordEvent } from "@/lib/booking/events";
import { notify } from "@/lib/booking/notify";
import {
  updateBookingDetailsSchema,
  assignDriverSchema,
  sendMessageSchema,
  claimBookingSchema,
  revokeAssignmentSchema,
  togglePrioritySchema,
} from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/auth";
import type { BookingStatus } from "@prisma/client";

const QUEUE_FILTERS: Record<string, BookingStatus[]> = {
  NEW: ["SUBMITTED"],
  PENDING_ASSIGNMENT: ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"],
  DRIVER_DECLINED: ["REASSIGNMENT_REQUIRED"],
  SCHEDULED: ["SCHEDULED"],
  IN_PROGRESS: ["IN_PROGRESS"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

export async function listQueue(queue: keyof typeof QUEUE_FILTERS | "ALL", search?: string) {
  await requireRole("COORDINATOR", "ADMIN");
  const where: Record<string, unknown> = queue === "ALL" ? {} : { status: { in: QUEUE_FILTERS[queue] } };
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { reference: { contains: term, mode: "insensitive" } },
      { pickupAddress: { contains: term, mode: "insensitive" } },
      { dropoffAddress: { contains: term, mode: "insensitive" } },
      { customer: { name: { contains: term, mode: "insensitive" } } },
    ];
  }
  return db.bookingRequest.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      assignments: { orderBy: { createdAt: "desc" }, include: { driver: { select: { id: true, name: true } } } },
    },
  });
}

/** Metrics for the coordinator dashboard cards. */
export async function getCoordinatorSummary() {
  await requireRole("COORDINATOR", "ADMIN");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [newRequests, awaitingAssignment, driverDeclines, scheduledToday, activeTrips] = await Promise.all([
    db.bookingRequest.count({ where: { status: "SUBMITTED" } }),
    db.bookingRequest.count({ where: { status: { in: ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"] } } }),
    db.bookingAssignment.count({ where: { status: "DECLINED" } }),
    db.bookingRequest.count({ where: { status: "SCHEDULED", travelDate: { gte: startOfToday, lt: endOfToday } } }),
    db.bookingRequest.count({ where: { status: { in: ["IN_COMMUNICATION", "IN_PROGRESS"] } } }),
  ]);

  return { newRequests, awaitingAssignment, driverDeclines, scheduledToday, activeTrips };
}

export async function getBookingDetail(bookingId: string) {
  await requireRole("COORDINATOR", "ADMIN");
  return db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      coordinator: { select: { id: true, name: true } },
      assignments: { orderBy: { createdAt: "desc" }, include: { driver: { select: { id: true, name: true, phone: true, vehicleClass: true, vehicleCapacity: true } } } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, role: true } } } },
    },
  });
}

/** Lists active, available drivers — used to populate the assignment picker. */
export async function listEligibleDrivers() {
  await requireRole("COORDINATOR", "ADMIN");
  return db.appUser.findMany({
    where: { role: "DRIVER", active: true, driverAvailable: true },
    select: { id: true, name: true, vehicleClass: true, vehicleCapacity: true, vehicleDescription: true },
    orderBy: { name: "asc" },
  });
}

export async function updateBookingDetails(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const parsed = updateBookingDetailsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the trip details." };
  const { bookingId, ...updates } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: bookingId },
      data: {
        coordinatorId: booking.coordinatorId ?? user.id,
        travelDate: updates.travelDate ? new Date(updates.travelDate) : undefined,
        paxCount: updates.paxCount,
        pickupAddress: updates.pickupAddress,
        dropoffAddress: updates.dropoffAddress,
        vehicleClass: updates.vehicleClass,
        notes: updates.notes,
        confirmedPriceCents: updates.confirmedPrice ? Math.round(updates.confirmedPrice * 100) : undefined,
      },
    });

    // First time a coordinator touches a fresh request, move it into the
    // review queue automatically.
    if (booking.status === "SUBMITTED") {
      await transitionBooking(tx, {
        bookingId,
        currentStatus: "SUBMITTED",
        newStatus: "PENDING_ASSIGNMENT",
        actorId: user.id,
        context: { reason: "coordinator_reviewed" },
      });
      await notify(tx, {
        userId: booking.customerId,
        type: "STATUS_UPDATE",
        title: "Your request is being arranged",
        body: "A coordinator is reviewing your trip and arranging a driver.",
        link: `/dashboard/bookings/${bookingId}`,
      });
    }
  });

  revalidatePath(`/coordinator/bookings/${bookingId}`);
  return { ok: true };
}

export async function assignDriver(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const parsed = assignDriverSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Choose a driver first." };
  const { bookingId, driverId } = parsed.data;

  const [booking, driver] = await Promise.all([
    db.bookingRequest.findUnique({ where: { id: bookingId } }),
    db.appUser.findUnique({ where: { id: driverId } }),
  ]);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!driver || driver.role !== "DRIVER" || !driver.active) {
    return { ok: false, error: "That driver isn't available." };
  }
  if (!["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"].includes(booking.status)) {
    return { ok: false, error: "This booking isn't awaiting assignment." };
  }

  await db.$transaction(async (tx) => {
    await tx.bookingAssignment.create({
      data: { bookingRequestId: bookingId, driverId, offeredById: user.id, status: "OFFERED" },
    });
    await recordEvent(tx, {
      bookingRequestId: bookingId,
      actorId: user.id,
      previousStatus: booking.status,
      newStatus: booking.status,
      context: { action: "assignment_offered", driverId },
    });
    await notify(tx, {
      userId: driverId,
      type: "TRIP_OFFERED",
      title: "New trip offer",
      body: `You've been offered a ${booking.serviceType.toLowerCase().replace("_", " ")} on ${booking.travelDate.toDateString()}.`,
      link: `/driver/trips/${bookingId}`,
    });
  });

  revalidatePath(`/coordinator/bookings/${bookingId}`);
  return { ok: true };
}

export async function sendCoordinatorMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const visibility = formData.get("internalOnly") ? "INTERNAL" : "CUSTOMER_VISIBLE";
  const parsed = sendMessageSchema.safeParse({
    bookingId: formData.get("bookingId"),
    body: formData.get("body"),
    visibility,
  });
  if (!parsed.success) return { ok: false, error: "Message can't be empty." };
  const { bookingId, body } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.$transaction(async (tx) => {
    await tx.bookingMessage.create({
      data: { bookingRequestId: bookingId, senderId: user.id, visibility, body },
    });
    if (visibility === "CUSTOMER_VISIBLE") {
      await notify(tx, {
        userId: booking.customerId,
        type: "NEW_MESSAGE",
        title: "New message about your trip",
        body: `You have a new message about ${booking.reference}.`,
        link: `/dashboard/bookings/${bookingId}`,
      });
    }
  });

  revalidatePath(`/coordinator/bookings/${bookingId}`);
  return { ok: true };
}

export async function markScheduled(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const bookingId = String(formData.get("bookingId") ?? "");
  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  try {
    await db.$transaction(async (tx) => {
      await transitionBooking(tx, {
        bookingId,
        currentStatus: booking.status,
        newStatus: "SCHEDULED",
        actorId: user.id,
      });
      await notify(tx, {
        userId: booking.customerId,
        type: "STATUS_UPDATE",
        title: "Trip scheduled",
        body: "Your trip is scheduled and ready to go.",
        link: `/dashboard/bookings/${bookingId}`,
      });
    });
  } catch {
    return { ok: false, error: "This booking can't be scheduled from its current status." };
  }

  revalidatePath(`/coordinator/bookings/${bookingId}`);
  return { ok: true };
}

/** Coordinator "claims" an unclaimed request as their own — first-touch
 *  ownership, not a status change, so it doesn't go through transitionBooking. */
export async function claimBooking(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const parsed = claimBookingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const booking = await db.bookingRequest.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.coordinatorId && booking.coordinatorId !== user.id) {
    return { ok: false, error: "Already claimed by another coordinator." };
  }

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.update({ where: { id: booking.id }, data: { coordinatorId: user.id } });
    await recordEvent(tx, {
      bookingRequestId: booking.id,
      actorId: user.id,
      previousStatus: booking.status,
      newStatus: booking.status,
      context: { action: "claimed" },
    });
  });

  revalidatePath("/coordinator");
  return { ok: true };
}

export async function togglePriority(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const parsed = togglePrioritySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const priority = parsed.data.priority === "true";

  const booking = await db.bookingRequest.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.update({ where: { id: booking.id }, data: { priority } });
    await recordEvent(tx, {
      bookingRequestId: booking.id,
      actorId: user.id,
      previousStatus: booking.status,
      newStatus: booking.status,
      context: { action: priority ? "marked_priority" : "unmarked_priority" },
    });
  });

  revalidatePath("/coordinator");
  return { ok: true };
}

/** Withdraws an offer the driver hasn't responded to yet — e.g. the
 *  coordinator found a better-suited driver before the original replied. */
export async function revokeAssignment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("COORDINATOR", "ADMIN");
  const parsed = revokeAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "A reason is required to revoke an offer." };

  const assignment = await db.bookingAssignment.findUnique({ where: { id: parsed.data.assignmentId } });
  if (!assignment) return { ok: false, error: "Assignment not found." };
  if (assignment.status !== "OFFERED") {
    return { ok: false, error: "Only a pending (unaccepted) offer can be revoked." };
  }
  const booking = await db.bookingRequest.findUnique({ where: { id: assignment.bookingRequestId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.$transaction(async (tx) => {
    await tx.bookingAssignment.update({
      where: { id: assignment.id },
      data: { status: "REVOKED", respondedAt: new Date() },
    });
    await recordEvent(tx, {
      bookingRequestId: assignment.bookingRequestId,
      actorId: user.id,
      previousStatus: booking.status,
      newStatus: booking.status,
      context: { action: "assignment_revoked", assignmentId: assignment.id, reason: parsed.data.reason },
    });
    await notify(tx, {
      userId: assignment.driverId,
      type: "ASSIGNMENT_REVOKED",
      title: "Trip offer withdrawn",
      body: "A coordinator withdrew a trip offer before you responded.",
      link: "/driver",
    });
  });

  revalidatePath(`/coordinator/bookings/${assignment.bookingRequestId}`);
  return { ok: true };
}
