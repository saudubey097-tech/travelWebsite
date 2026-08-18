"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { revokeAssignment } from "@/lib/actions/coordinator";

export function RevokeAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <ConfirmDialog
      triggerLabel="Revoke offer"
      title="Revoke this driver offer?"
      description="The driver hasn't responded yet — they'll no longer see this offer."
      confirmLabel="Revoke"
      destructive
      requireReason
      pending={pending}
      error={error}
      onConfirm={(reason) => {
        setError(undefined);
        const fd = new FormData();
        fd.set("assignmentId", assignmentId);
        fd.set("reason", reason);
        startTransition(async () => {
          const result = await revokeAssignment({ ok: true }, fd);
          if (!result.ok) setError(result.error);
        });
      }}
    />
  );
}
