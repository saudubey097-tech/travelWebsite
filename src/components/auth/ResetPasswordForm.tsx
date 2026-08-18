"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resetPassword } from "@/lib/actions/security";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">New password</span>
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
          <span className="font-body text-xs text-ink/40">At least 10 characters, with a mix of letters, numbers, and symbols.</span>
        </label>
        {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </Card>
  );
}
