"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { updateDriverProfile } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/auth";
import type { VehicleClass } from "@prisma/client";

const initialState: ActionResult = { ok: true };

export function DriverProfileForm({
  userId,
  driverLicenseNo,
  vehicleClass,
  vehicleCapacity,
  vehicleDescription,
  driverAvailable,
}: {
  userId: string;
  driverLicenseNo?: string | null;
  vehicleClass?: VehicleClass | null;
  vehicleCapacity?: number | null;
  vehicleDescription?: string | null;
  driverAvailable: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateDriverProfile, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">License number</span>
        <input name="driverLicenseNo" defaultValue={driverLicenseNo ?? ""} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Vehicle class</span>
        <select name="vehicleClass" defaultValue={vehicleClass ?? "SEDAN"} className="input">
          <option value="SEDAN">Sedan</option>
          <option value="VAN">Van</option>
          <option value="XL_VAN">XL Van</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Vehicle capacity</span>
        <input type="number" name="vehicleCapacity" min={1} max={20} defaultValue={vehicleCapacity ?? undefined} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase text-ink/50">Vehicle description</span>
        <input name="vehicleDescription" defaultValue={vehicleDescription ?? ""} className="input" />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="font-mono text-xs uppercase text-ink/50">Availability</span>
        <select name="driverAvailable" defaultValue={driverAvailable ? "true" : "false"} className="input">
          <option value="true">Available for new assignments</option>
          <option value="false">Not currently available</option>
        </select>
      </label>
      {state.error && <p className="font-body text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
        {pending ? "Saving…" : "Save driver profile"}
      </Button>
    </form>
  );
}
