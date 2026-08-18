"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { addAdminNote } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function AddNoteForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(addAdminNote, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <textarea name="body" required rows={2} placeholder="Add a private admin note…" className="input resize-y" />
      {state.error && <p className="font-body text-xs text-red-700">{state.error}</p>}
      <Button type="submit" size="sm" variant="secondary" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
