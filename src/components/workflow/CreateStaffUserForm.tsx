"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createStaffUser } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function CreateStaffUserForm() {
  const [state, formAction, pending] = useActionState(createStaffUser, initialState);
  const [role, setRole] = useState<"COORDINATOR" | "DRIVER" | "ADMIN">("COORDINATOR");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <Card className="p-5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Add a staff account</span>
      <form ref={formRef} action={formAction} className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Full name</span>
          <input name="name" required className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Email</span>
          <input name="email" type="email" required className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Phone</span>
          <input name="phone" type="tel" className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Role</span>
          <select name="role" value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="input">
            <option value="COORDINATOR">Coordinator</option>
            <option value="DRIVER">Driver</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="font-mono text-xs uppercase text-ink/50">Temporary password</span>
          <input name="temporaryPassword" type="text" required minLength={10} className="input" />
          <span className="font-body text-xs text-ink/40">
            Share this with the new user directly — there&apos;s no reset-link email flow yet, so send it
            through a secure channel and ask them to change it after their first sign-in.
          </span>
        </label>

        {role === "DRIVER" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">License number</span>
              <input name="driverLicenseNo" className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Vehicle class</span>
              <select name="vehicleClass" className="input">
                <option value="SEDAN">Sedan</option>
                <option value="VAN">Van</option>
                <option value="XL_VAN">XL Van</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Vehicle capacity</span>
              <input name="vehicleCapacity" type="number" min={1} max={20} className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Vehicle description</span>
              <input name="vehicleDescription" placeholder="e.g. Black Toyota Hiace" className="input" />
            </label>
          </>
        )}

        {state.error && <p className="font-body text-sm text-red-700 sm:col-span-2">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
