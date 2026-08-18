"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { resendNotification } from "@/lib/actions/admin";

export function ResendNotificationButton({ notificationId }: { notificationId: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <button
      type="button"
      disabled={pending || sent}
      onClick={() => {
        const fd = new FormData();
        fd.set("notificationId", notificationId);
        startTransition(async () => {
          const result = await resendNotification({ ok: true }, fd);
          if (result.ok) setSent(true);
        });
      }}
      className="flex items-center gap-1 font-mono text-[10px] uppercase text-pine disabled:text-ink/30"
    >
      <RefreshCw className="h-3 w-3" aria-hidden />
      {sent ? "Resent" : pending ? "Resending…" : "Resend"}
    </button>
  );
}
