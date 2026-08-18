"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { changePassword } from "@/lib/actions/security";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pending && formRef.current) {
      formRef.current.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Current password</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">New password</span>
        <input name="newPassword" type="password" required minLength={10} autoComplete="new-password" className="input" />
        <span className="font-body text-xs text-ink/40">At least 10 characters, with a mix of letters, numbers, and symbols.</span>
      </label>
      {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
      {state !== initialState && state.ok && !pending && <p className="font-body text-sm text-pine">Password updated.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
