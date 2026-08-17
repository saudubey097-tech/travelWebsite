"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { overrideAssignment } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function OverrideAssignmentForm({
  bookingId,
  drivers,
}: {
  bookingId: string;
  drivers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(overrideAssignment, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="font-body text-xs text-pine underline">
        Override assignment
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-3 grid gap-3 rounded-md border border-gold/30 bg-gold/5 p-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Assign driver</span>
        <select name="driverId" required className="input">
          <option value="">Choose a driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Reason (required)</span>
        <textarea name="reason" required minLength={3} rows={2} className="input resize-y" />
      </label>
      {state.error && <p className="font-body text-xs text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Overriding…" : "Confirm override"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
