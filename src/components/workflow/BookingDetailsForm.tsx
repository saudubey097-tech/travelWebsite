"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { updateBookingDetails } from "@/lib/actions/coordinator";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function BookingDetailsForm({
  bookingId,
  travelDate,
  paxCount,
  pickupAddress,
  dropoffAddress,
  notes,
  confirmedPriceCents,
}: {
  bookingId: string;
  travelDate: string;
  paxCount: number;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  notes?: string | null;
  confirmedPriceCents?: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateBookingDetails, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Travel date</span>
          <input type="date" name="travelDate" defaultValue={travelDate} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Guests</span>
          <input type="number" name="paxCount" min={1} max={11} defaultValue={paxCount} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Pickup</span>
          <input name="pickupAddress" defaultValue={pickupAddress ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Drop-off</span>
          <input name="dropoffAddress" defaultValue={dropoffAddress ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="font-mono text-xs uppercase text-ink/50">Internal notes</span>
          <textarea name="notes" rows={3} defaultValue={notes ?? ""} className="input resize-y" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Confirmed price (NZD)</span>
          <input
            type="number"
            name="confirmedPrice"
            min={1}
            step={1}
            placeholder="e.g. 950"
            defaultValue={confirmedPriceCents ? confirmedPriceCents / 100 : undefined}
            onWheel={(e) => e.currentTarget.blur()}
            className="input"
          />
        </label>
      </div>
      {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
