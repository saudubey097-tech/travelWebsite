"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { correctBookingStatus } from "@/lib/actions/admin";
import type { BookingStatus } from "@prisma/client";

const STATUSES: BookingStatus[] = [
  "SUBMITTED",
  "PENDING_ASSIGNMENT",
  "ACCEPTED",
  "DECLINED",
  "REASSIGNMENT_REQUIRED",
  "IN_COMMUNICATION",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function CorrectStatusForm({ bookingId, currentStatus }: { bookingId: string; currentStatus: BookingStatus }) {
  const [target, setTarget] = useState<BookingStatus>(currentStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col gap-2">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value as BookingStatus)}
        className="input"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <ConfirmDialog
        triggerLabel="Correct status"
        triggerClassName="rounded-sm border border-red-300 px-3.5 py-1.5 font-body text-xs text-red-700 hover:bg-red-50"
        title={`Force status to ${target.replace(/_/g, " ")}?`}
        description="This bypasses the normal workflow and is logged as an admin override."
        confirmLabel="Confirm override"
        destructive
        requireReason
        pending={pending}
        error={error}
        onConfirm={(reason) => {
          setError(undefined);
          const fd = new FormData();
          fd.set("bookingId", bookingId);
          fd.set("newStatus", target);
          fd.set("reason", reason);
          startTransition(async () => {
            const result = await correctBookingStatus({ ok: true }, fd);
            if (!result.ok) setError(result.error);
          });
        }}
      />
    </div>
  );
}
