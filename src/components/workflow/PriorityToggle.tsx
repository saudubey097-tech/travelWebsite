"use client";

import { useTransition } from "react";
import { Flag } from "lucide-react";
import { togglePriority } from "@/lib/actions/coordinator";

export function PriorityToggle({ bookingId, priority }: { bookingId: string; priority: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={priority}
      aria-label={priority ? "Remove priority flag" : "Mark as priority"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const fd = new FormData();
        fd.set("bookingId", bookingId);
        fd.set("priority", (!priority).toString());
        startTransition(() => {
          togglePriority({ ok: true }, fd);
        });
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
        priority ? "bg-gold/20 text-goldDeep" : "text-ink/30 hover:bg-sand hover:text-ink/60"
      }`}
    >
      <Flag className="h-3.5 w-3.5" aria-hidden fill={priority ? "currentColor" : "none"} />
    </button>
  );
}
