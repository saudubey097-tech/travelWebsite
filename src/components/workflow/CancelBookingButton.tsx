"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cancelBooking } from "@/lib/actions/customer";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="mt-4 border-t border-line pt-4">
      <ConfirmDialog
        triggerLabel="Cancel this trip"
        triggerClassName="w-full font-body text-xs text-red-700 underline"
        title="Cancel this trip request?"
        description="This can't be undone."
        confirmLabel="Yes, cancel"
        destructive
        showReasonField
        reasonLabel="Reason (helps us improve)"
        pending={pending}
        error={error}
        onConfirm={(reason) => {
          setError(undefined);
          const fd = new FormData();
          fd.set("bookingId", bookingId);
          if (reason) fd.set("reason", reason);
          startTransition(async () => {
            const result = await cancelBooking({ ok: true }, fd);
            if (!result.ok) setError(result.error);
          });
        }}
      />
    </div>
  );
}
