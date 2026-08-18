import "server-only";
import type { Prisma, BookingStatus } from "@prisma/client";

/**
 * Writes a booking_events row. MUST be called with the same transaction
 * client (`tx`) as the status change it's recording, so the event and the
 * mutation it describes always land together or not at all.
 */
export async function recordEvent(
  tx: Prisma.TransactionClient,
  params: {
    bookingRequestId: string;
    actorId: string | null;
    eventType?: string;
    previousStatus: BookingStatus | null;
    newStatus: BookingStatus;
    context?: Record<string, unknown>;
  }
) {
  await tx.bookingEvent.create({
    data: {
      bookingRequestId: params.bookingRequestId,
      actorId: params.actorId,
      eventType: params.eventType ?? "STATUS_CHANGED",
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      context: params.context as Prisma.InputJsonValue | undefined,
    },
  });
}

export function generateReference(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SB-${Date.now().toString(36).toUpperCase()}${rand}`;
}
