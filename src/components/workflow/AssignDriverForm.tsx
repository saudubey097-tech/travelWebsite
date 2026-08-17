"use client";

import { useActionState } from "react";
import { Users, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { assignDriver } from "@/lib/actions/coordinator";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export interface EligibleDriver {
  id: string;
  name: string;
  vehicleClass: string | null;
  vehicleCapacity: number | null;
  vehicleDescription: string | null;
}

export function AssignDriverForm({ bookingId, drivers }: { bookingId: string; drivers: EligibleDriver[] }) {
  const [state, formAction, pending] = useActionState(assignDriver, initialState);

  if (drivers.length === 0) {
    return <p className="font-body text-sm text-ink/50">No active drivers available right now.</p>;
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-2 sm:grid-cols-2">
        {drivers.map((d) => (
          <label
            key={d.id}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3.5 has-[:checked]:border-pine has-[:checked]:bg-sand/40"
          >
            <input type="radio" name="driverId" value={d.id} required className="mt-1" />
            <div>
              <p className="font-body text-sm font-medium text-ink">{d.name}</p>
              {d.vehicleClass && (
                <p className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-ink/55">
                  <Car className="h-3 w-3" aria-hidden />
                  {d.vehicleDescription ?? d.vehicleClass}
                  {d.vehicleCapacity && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" aria-hidden />
                      {d.vehicleCapacity}
                    </span>
                  )}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Sending offer…" : "Send assignment offer"}
      </Button>
    </form>
  );
}
