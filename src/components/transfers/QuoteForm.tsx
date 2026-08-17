"use client";

import { useMemo, useState } from "react";
import { VehicleClass } from "@/types";
import { estimateTransfer, formatMoney, formatDuration, vehicleLabel } from "@/lib/pricing";
import { RouteLine } from "@/components/ui/RouteLine";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const VEHICLES: VehicleClass[] = ["sedan", "van", "xlVan"];

/**
 * NOTE ON DISTANCE: a real deployment would call a routing/geocoding API
 * (e.g. a maps distance-matrix service) here. That call is isolated to
 * this one function so it can be replaced without touching the form UI.
 */
function estimateDistanceKm(pickup: string, dropoff: string): number {
  if (!pickup || !dropoff) return 0;
  // Deterministic placeholder so the demo behaves consistently.
  const seed = (pickup + dropoff).length * 7;
  return 20 + (seed % 180);
}

export function QuoteForm() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("sedan");
  const [submitted, setSubmitted] = useState(false);

  const distanceKm = useMemo(() => estimateDistanceKm(pickup, dropoff), [pickup, dropoff]);
  const quote = useMemo(
    () => (submitted && distanceKm > 0 ? estimateTransfer(pickup, dropoff, vehicleClass, distanceKm) : null),
    [submitted, distanceKm, pickup, dropoff, vehicleClass]
  );
  const bookingHref = quote
    ? `/book?${new URLSearchParams({
        type: "TRANSFER",
        pickup: quote.pickup,
        dropoff: quote.dropoff,
        vehicle: quote.vehicleClass,
        quotedPrice: String(quote.price.amount),
      }).toString()}`
    : "/book";

  return (
    <Card className="p-6 sm:p-8">
      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <label className="flex flex-col gap-1.5 sm:col-span-1">
          <span className="font-mono text-xs uppercase text-ink/50">Pickup</span>
          <input
            required
            value={pickup}
            onChange={(e) => {
              setPickup(e.target.value);
              setSubmitted(false);
            }}
            placeholder="Hotel, airport or address"
            className="rounded-sm border border-line bg-paper px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink/40 focus:border-pine focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-1">
          <span className="font-mono text-xs uppercase text-ink/50">Drop-off</span>
          <input
            required
            value={dropoff}
            onChange={(e) => {
              setDropoff(e.target.value);
              setSubmitted(false);
            }}
            placeholder="Hotel, airport or address"
            className="rounded-sm border border-line bg-paper px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink/40 focus:border-pine focus:outline-none"
          />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="font-mono text-xs uppercase text-ink/50">Vehicle</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {VEHICLES.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setVehicleClass(v)}
                className={`rounded-sm border px-4 py-2.5 text-left font-body text-sm transition-colors ${
                  vehicleClass === v
                    ? "border-pine bg-pine text-paper"
                    : "border-line text-ink/70 hover:border-pine"
                }`}
              >
                {vehicleLabel(v)}
              </button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" className="sm:col-span-2">
          Get instant quote
        </Button>
      </form>

      {quote && (
        <div className="mt-8 border-t border-line pt-6">
          <RouteLine from={quote.pickup} to={quote.dropoff} className="text-ink/50" />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div className="font-body text-sm text-ink/60">
              <div>{quote.distanceKm} km · approx {formatDuration(quote.durationMinutes)}</div>
              <div>{vehicleLabel(quote.vehicleClass)}</div>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[11px] uppercase text-ink/40">Total price</span>
              <span className="font-display text-3xl text-pine">{formatMoney(quote.price)}</span>
              <span className="block font-body text-xs text-ink/50">
                {quote.depositPct}% deposit to confirm, balance on the day
              </span>
            </div>
          </div>
          <LinkButton href={bookingHref} size="lg" className="mt-6 w-full">
            Confirm with {quote.depositPct}% deposit
          </LinkButton>
        </div>
      )}
    </Card>
  );
}
