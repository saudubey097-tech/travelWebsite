"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { respondToAssignment } from "@/lib/actions/driver";

export function AssignmentResponseForm({ assignmentId }: { assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function accept() {
    setError(undefined);
    const fd = new FormData();
    fd.set("assignmentId", assignmentId);
    fd.set("decision", "ACCEPT");
    startTransition(async () => {
      const result = await respondToAssignment({ ok: true }, fd);
      if (!result.ok) setError(result.error);
    });
  }

  function decline(reason: string) {
    setError(undefined);
    const fd = new FormData();
    fd.set("assignmentId", assignmentId);
    fd.set("decision", "DECLINE");
    if (reason) fd.set("declineReason", reason);
    startTransition(async () => {
      const result = await respondToAssignment({ ok: true }, fd);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4">
      <p className="font-body text-sm font-medium text-ink">You&apos;ve been offered this trip.</p>
      {error && <p className="mt-2 font-body text-sm text-red-700">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={accept}>
          {pending ? "Accepting…" : "Accept trip"}
        </Button>
        <ConfirmDialog
          triggerLabel="Decline"
          triggerClassName="rounded-sm border border-pine px-3.5 py-1.5 font-body text-xs text-pine transition-colors hover:bg-pine hover:text-paper"
          title="Decline this trip offer?"
          confirmLabel="Confirm decline"
          showReasonField
          reasonLabel="Reason (optional, helps your coordinator)"
          pending={pending}
          onConfirm={decline}
        />
      </div>
    </div>
  );
}
