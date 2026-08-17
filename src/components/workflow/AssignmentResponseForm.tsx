"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { respondToAssignment } from "@/lib/actions/driver";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function AssignmentResponseForm({ assignmentId }: { assignmentId: string }) {
  const [declining, setDeclining] = useState(false);
  const [state, formAction, pending] = useActionState(respondToAssignment, initialState);

  return (
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4">
      <p className="font-body text-sm font-medium text-ink">You&apos;ve been offered this trip.</p>
      {state.error && <p className="mt-2 font-body text-sm text-red-700">{state.error}</p>}

      {!declining ? (
        <div className="mt-3 flex gap-2">
          <form action={formAction}>
            <input type="hidden" name="assignmentId" value={assignmentId} />
            <input type="hidden" name="decision" value="ACCEPT" />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Accepting…" : "Accept trip"}
            </Button>
          </form>
          <Button type="button" variant="secondary" size="sm" onClick={() => setDeclining(true)} disabled={pending}>
            Decline
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="decision" value="DECLINE" />
          <textarea
            name="declineReason"
            required
            minLength={3}
            rows={2}
            placeholder="Let the coordinator know why (required)"
            className="input resize-y"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Confirm decline"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeclining(false)}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
