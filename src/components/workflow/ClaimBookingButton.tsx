"use client";

import { useTransition } from "react";
import { claimBooking } from "@/lib/actions/coordinator";

export function ClaimBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const fd = new FormData();
        fd.set("bookingId", bookingId);
        startTransition(() => {
          claimBooking({ ok: true }, fd);
        });
      }}
      className="rounded-sm border border-pine px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-pine transition-colors hover:bg-pine hover:text-paper disabled:opacity-50"
    >
      {pending ? "Claiming…" : "Claim"}
    </button>
  );
}
