"use client";

import { useTransition, useState } from "react";
import { MailWarning } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions/security";

export function EmailVerificationBanner() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-gold/30 bg-gold/10 px-4 py-3">
      <p className="flex items-center gap-2 font-body text-sm text-ink/75">
        <MailWarning className="h-4 w-4 shrink-0 text-goldDeep" aria-hidden />
        Please verify your email address to unlock all features.
      </p>
      <button
        type="button"
        disabled={pending || sent}
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const result = await resendVerificationEmail();
            if (result.ok) setSent(true);
            else setError(result.error);
          });
        }}
        className="font-body text-xs text-pine underline disabled:opacity-60"
      >
        {sent ? "Verification email sent" : pending ? "Sending…" : "Resend verification email"}
      </button>
      {error && <p className="w-full font-body text-xs text-red-700">{error}</p>}
    </div>
  );
}
