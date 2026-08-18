"use client";

import { useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Inline (non-modal) confirm step used for cancellation, revocation,
 * override, and completion actions — collapses to a trigger button, expands
 * to a confirmation panel with an optional reason field before the real
 * action fires. Kept inline rather than a true modal so it stays inside the
 * surrounding <form>/layout context of the page that uses it.
 */
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel,
  destructive = false,
  requireReason = false,
  showReasonField,
  reasonLabel = "Reason",
  pending = false,
  error,
  onConfirm,
  children,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  requireReason?: boolean;
  /** Show the reason textarea without requiring it. Defaults to requireReason's value. */
  showReasonField?: boolean;
  reasonLabel?: string;
  pending?: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? "font-body text-xs text-pine underline"}
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className={`rounded-md border p-4 ${destructive ? "border-red-200 bg-red-50" : "border-gold/30 bg-gold/10"}`}>
      <p className="flex items-start gap-1.5 font-body text-sm font-medium text-ink">
        {destructive && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />}
        {title}
      </p>
      {description && <p className="mt-1 font-body text-xs text-ink/60">{description}</p>}
      {children}
      {(showReasonField ?? requireReason) && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={requireReason ? `${reasonLabel} (required)` : `${reasonLabel} (optional)`}
          className="input mt-3 resize-y"
        />
      )}
      {error && <p className="mt-2 font-body text-xs text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant={destructive ? "secondary" : "primary"}
          size="sm"
          disabled={pending || (requireReason && reason.trim().length < 3)}
          onClick={() => onConfirm(reason)}
        >
          {pending ? "Working…" : confirmLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
