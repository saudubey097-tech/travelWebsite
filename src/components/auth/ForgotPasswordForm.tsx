"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requestPasswordReset } from "@/lib/actions/security";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.ok) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="font-body text-sm text-ink/75">
          If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in 1 hour.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Email</span>
          <input name="email" type="email" required autoComplete="email" className="input" />
        </label>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </Card>
  );
}
