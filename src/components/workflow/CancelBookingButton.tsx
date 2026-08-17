"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cancelBooking } from "@/lib/actions/customer";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(cancelBooking, initialState);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 w-full font-body text-xs text-red-700 underline"
      >
        Cancel this trip
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-4 border-t border-line pt-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="font-body text-xs text-ink/60">Cancel this trip request? This can&apos;t be undone.</p>
      {state.error && <p className="mt-1 font-body text-xs text-red-700">{state.error}</p>}
      <div className="mt-2 flex gap-2">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
      </div>
    </form>
  );
}
