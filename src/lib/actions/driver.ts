"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordEvent } from "@/lib/booking/events";
import { transitionBooking } from "@/lib/booking/transition";
import { notify } from "@/lib/booking/notify";
import {
  respondToAssignmentSchema,
  updateTripStatusSchema,
  sendMessageSchema,
} from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/auth";
import { AlreadyClaimedError } from "@/lib/booking/errors";

/** Every offer or active job for the signed-in driver — never another driver's. */
export async function listMyAssignments() {
  const user = await requireRole("DRIVER", "ADMIN");
  return db.bookingAssignment.findMany({
    where: { driverId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      bookingRequest: {
        select: {
          id: true,
          reference: true,
          serviceType: true,
          status: true,
          travelDate: true,
          paxCount: true,
          pickupAddress: true,
          dropoffAddress: true,
          notes: true,
          tourSlug: true,
        },
      },
    },
  });
}

/**
 * IDOR-safe trip detail: only returns data if the requesting driver holds
 * an assignment (of any status) for this booking. Customer contact details
 * are included only once that assignment is ACCEPTED, per spec.
 */
export async function getMyTrip(bookingId: string) {
  const user = await requireRole("DRIVER", "ADMIN");
  const assignment = await db.bookingAssignment.findFirst({
    where: { bookingRequestId: bookingId, driverId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!assignment) return null;

  const contactVisible = assignment.status === "ACCEPTED";
  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          // Contact info only surfaces to the driver once they've accepted.
          email: contactVisible,
          phone: contactVisible,
        },
      },
      messages: {
        where: { visibility: "CUSTOMER_VISIBLE" },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  return booking ? { booking, assignment } : null;
}

export async function respondToAssignment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("DRIVER");
  const parsed = respondToAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid response." };
  const { assignmentId, decision, declineReason } = parsed.data;

  const assignment = await db.bookingAssignment.findFirst({
    where: { id: assignmentId, driverId: user.id },
    include: { bookingRequest: true },
  });
  if (!assignment) return { ok: false, error: "Assignment not found." };
  if (assignment.status !== "OFFERED") return { ok: false, error: "This offer has already been responded to." };

  if (decision === "DECLINE") {
    await db.$transaction(async (tx) => {
      await tx.bookingAssignment.update({
        where: { id: assignmentId },
        data: { status: "DECLINED", respondedAt: new Date(), declineReason },
      });
      await transitionBooking(tx, {
        bookingId: assignment.bookingRequestId,
        currentStatus: assignment.bookingRequest.status,
        newStatus: "REASSIGNMENT_REQUIRED",
        actorId: user.id,
        eventType: "DRIVER_DECLINED",
        context: { assignmentId, declineReason },
      });
      await notify(tx, {
        userId: assignment.offeredById,
        type: "ASSIGNMENT_DECLINED",
        title: "Driver declined a trip offer",
        body: `${assignment.bookingRequest.reference} needs a new driver.`,
        link: `/coordinator/bookings/${assignment.bookingRequestId}`,
      });
    });
    revalidatePath("/driver");
    return { ok: true };
  }

  // ACCEPT — atomic: a conditional UPDATE on the parent booking's status is
  // the real lock. Only the first transaction to flip it away from
  // PENDING_ASSIGNMENT/REASSIGNMENT_REQUIRED succeeds; every concurrent
  // acceptance attempt (this driver twice, or a second offered driver)
  // updates zero rows and is rejected.
  try {
    await db.$transaction(async (tx) => {
      const bookingFlip = await tx.bookingRequest.updateMany({
        where: {
          id: assignment.bookingRequestId,
          status: { in: ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"] },
        },
        data: { status: "ACCEPTED" },
      });
      if (bookingFlip.count === 0) throw new AlreadyClaimedError();

      const assignmentFlip = await tx.bookingAssignment.updateMany({
        where: { id: assignmentId, status: "OFFERED" },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      if (assignmentFlip.count === 0) throw new AlreadyClaimedError();

      await tx.bookingAssignment.updateMany({
        where: { bookingRequestId: assignment.bookingRequestId, status: "OFFERED", NOT: { id: assignmentId } },
        data: { status: "REVOKED", respondedAt: new Date() },
      });

      await recordEvent(tx, {
        bookingRequestId: assignment.bookingRequestId,
        actorId: user.id,
        eventType: "DRIVER_ACCEPTED_ASSIGNMENT",
        previousStatus: assignment.bookingRequest.status,
        newStatus: "ACCEPTED",
        context: { assignmentId },
      });

      await notify(tx, {
        userId: assignment.bookingRequest.customerId,
        type: "DRIVER_CONFIRMED",
        title: "Driver confirmed",
        body: "A driver has been confirmed for your trip.",
        link: `/dashboard/bookings/${assignment.bookingRequestId}`,
      });
    });
  } catch (err) {
    if (err instanceof AlreadyClaimedError) {
      return { ok: false, error: "This trip was already claimed by another driver." };
    }
    return { ok: false, error: "Something went wrong accepting this trip." };
  }

  revalidatePath("/driver");
  return { ok: true };
}

const DRIVER_STATUS_LABEL: Record<string, string> = {
  IN_COMMUNICATION: "in communication with the customer",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in progress",
  COMPLETED: "completed",
};

export async function updateTripStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("DRIVER");
  const parsed = updateTripStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  const { bookingId, status } = parsed.data;

  const assignment = await db.bookingAssignment.findFirst({
    where: { bookingRequestId: bookingId, driverId: user.id, status: "ACCEPTED" },
    include: { bookingRequest: true },
  });
  if (!assignment) return { ok: false, error: "You don't have an accepted assignment for this trip." };

  const DRIVER_EVENT_TYPE: Record<string, string> = {
    IN_COMMUNICATION: "DRIVER_STARTED_COMMUNICATION",
    SCHEDULED: "TRIP_SCHEDULED_BY_DRIVER",
    IN_PROGRESS: "TRIP_STARTED",
    COMPLETED: "TRIP_COMPLETED",
  };

  try {
    await db.$transaction(async (tx) => {
      await transitionBooking(tx, {
        bookingId,
        currentStatus: assignment.bookingRequest.status,
        newStatus: status,
        actorId: user.id,
        eventType: DRIVER_EVENT_TYPE[status],
      });
      await notify(tx, {
        userId: assignment.bookingRequest.customerId,
        type: "STATUS_UPDATE",
        title: "Trip update",
        body: `Your trip is now ${DRIVER_STATUS_LABEL[status] ?? status.toLowerCase()}.`,
        link: `/dashboard/bookings/${bookingId}`,
      });
    });
  } catch {
    return { ok: false, error: "That status change isn't allowed right now." };
  }

  revalidatePath(`/driver/trips/${bookingId}`);
  return { ok: true };
}

const MESSAGEABLE_STATUSES = ["IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"] as const;

export async function sendDriverMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireRole("DRIVER");
  const parsed = sendMessageSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    visibility: "CUSTOMER_VISIBLE",
  });
  if (!parsed.success) return { ok: false, error: "Message can't be empty." };
  const { bookingId, body } = parsed.data;

  const assignment = await db.bookingAssignment.findFirst({
    where: { bookingRequestId: bookingId, driverId: user.id, status: "ACCEPTED" },
    include: { bookingRequest: true },
  });
  if (!assignment) return { ok: false, error: "You can message this customer once you've accepted the trip." };
  if (!(MESSAGEABLE_STATUSES as readonly string[]).includes(assignment.bookingRequest.status)) {
    return { ok: false, error: "Messaging isn't open for this trip right now." };
  }

  await db.$transaction(async (tx) => {
    await tx.bookingMessage.create({
      data: { bookingRequestId: bookingId, senderId: user.id, visibility: "CUSTOMER_VISIBLE", body },
    });
    await notify(tx, {
      userId: assignment.bookingRequest.customerId,
      type: "NEW_MESSAGE",
      title: "New message from your driver",
      body: `You have a new message about ${assignment.bookingRequest.reference}.`,
      link: `/dashboard/bookings/${bookingId}`,
    });
  });

  revalidatePath(`/driver/trips/${bookingId}`);
  return { ok: true };
}
