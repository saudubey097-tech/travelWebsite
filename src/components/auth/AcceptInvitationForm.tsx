"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { acceptInvitation } from "@/lib/actions/invitations";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitation, initialState);

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Choose a password</span>
          <input name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
          <span className="font-body text-xs text-ink/40">At least 10 characters, with a mix of letters, numbers, and symbols.</span>
        </label>
        {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Setting up your account…" : "Set password and continue"}
        </Button>
      </form>
    </Card>
  );
}
