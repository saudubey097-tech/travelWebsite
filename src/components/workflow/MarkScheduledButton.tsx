"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { markScheduled } from "@/lib/actions/coordinator";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function MarkScheduledButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(markScheduled, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && <p className="mb-2 font-body text-xs text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Scheduling…" : "Mark as scheduled"}
      </Button>
    </form>
  );
}
