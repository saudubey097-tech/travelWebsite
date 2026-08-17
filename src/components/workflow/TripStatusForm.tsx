"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { updateTripStatus } from "@/lib/actions/driver";
import type { ActionResult } from "@/lib/actions/auth";
import type { BookingStatus } from "@prisma/client";

const initialState: ActionResult = { ok: true };

const NEXT_STATUS: Partial<Record<BookingStatus, { value: string; label: string }>> = {
  ACCEPTED: { value: "IN_COMMUNICATION", label: "Start communicating with customer" },
  IN_COMMUNICATION: { value: "SCHEDULED", label: "Mark as scheduled" },
  SCHEDULED: { value: "IN_PROGRESS", label: "Start trip" },
  IN_PROGRESS: { value: "COMPLETED", label: "Mark trip completed" },
};

export function TripStatusForm({ bookingId, currentStatus }: { bookingId: string; currentStatus: BookingStatus }) {
  const [state, formAction, pending] = useActionState(updateTripStatus, initialState);
  const next = NEXT_STATUS[currentStatus];
  if (!next) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="status" value={next.value} />
      {state.error && <p className="mb-2 font-body text-xs text-red-700">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Updating…" : next.label}
      </Button>
    </form>
  );
}
