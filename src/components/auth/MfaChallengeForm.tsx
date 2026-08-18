"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { verifyMfaChallenge } from "@/lib/actions/mfa";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function MfaChallengeForm() {
  const [state, formAction, pending] = useActionState(verifyMfaChallenge, initialState);

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Authenticator code or recovery code</span>
          <input name="code" required autoComplete="one-time-code" placeholder="123456" className="input" />
        </label>
        {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </Card>
  );
}
