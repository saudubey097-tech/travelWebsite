import "server-only";
import type { BookingStatus, Prisma } from "@prisma/client";
import { recordEvent } from "@/lib/booking/events";

/** The single source of truth for which booking_requests.status moves are legal. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  SUBMITTED: ["PENDING_ASSIGNMENT", "CANCELLED"],
  PENDING_ASSIGNMENT: ["ACCEPTED", "REASSIGNMENT_REQUIRED", "CANCELLED"],
  ACCEPTED: ["IN_COMMUNICATION", "REASSIGNMENT_REQUIRED", "CANCELLED"],
  IN_COMMUNICATION: ["SCHEDULED", "REASSIGNMENT_REQUIRED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "REASSIGNMENT_REQUIRED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  DECLINED: ["REASSIGNMENT_REQUIRED", "CANCELLED"],
  REASSIGNMENT_REQUIRED: ["PENDING_ASSIGNMENT", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Cannot move a booking from ${from} to ${to}.`);
    this.name = "InvalidTransitionError";
  }
}

/**
 * Moves a booking_requests row to a new status inside the given
 * transaction, validating the move against ALLOWED_TRANSITIONS and writing
 * the matching booking_events row atomically. Every status-changing action
 * in the app (coordinator, driver, admin) should call this rather than
 * writing `status` directly, so the audit trail can never drift from
 * reality.
 */
export async function transitionBooking(
  tx: Prisma.TransactionClient,
  params: {
    bookingId: string;
    currentStatus: BookingStatus;
    newStatus: BookingStatus;
    actorId: string | null;
    eventType?: string;
    context?: Record<string, unknown>;
  }
) {
  const allowed = ALLOWED_TRANSITIONS[params.currentStatus] ?? [];
  if (!allowed.includes(params.newStatus)) {
    throw new InvalidTransitionError(params.currentStatus, params.newStatus);
  }

  await tx.bookingRequest.update({
    where: { id: params.bookingId },
    data: { status: params.newStatus },
  });

  await recordEvent(tx, {
    bookingRequestId: params.bookingId,
    actorId: params.actorId,
    eventType: params.eventType ?? `STATUS_${params.newStatus}`,
    previousStatus: params.currentStatus,
    newStatus: params.newStatus,
    context: params.context,
  });
}
