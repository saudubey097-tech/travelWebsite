"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { updateMyBookingNotes } from "@/lib/actions/customer";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function BookingNotesForm({ bookingId, notes }: { bookingId: string; notes?: string | null }) {
  const [state, formAction, pending] = useActionState(updateMyBookingNotes, initialState);

  return (
    <form action={formAction} className="mt-4 border-t border-line pt-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Trip notes</span>
        <textarea name="notes" defaultValue={notes ?? ""} rows={3} className="input resize-y" maxLength={2000} />
      </label>
      {state.error && <p className="mt-1 font-body text-xs text-red-700">{state.error}</p>}
      <Button type="submit" size="sm" variant="secondary" disabled={pending} className="mt-2">
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}
