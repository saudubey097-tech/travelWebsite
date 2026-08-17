"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Car, Users, MapPin, ShieldCheck, Check } from "lucide-react";
import { VehicleClass } from "@/types";
import { estimateTransfer, formatMoney, formatDuration, vehicleLabel } from "@/lib/pricing";
import { RouteLine, RouteWaypoints } from "@/components/ui/RouteLine";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const VEHICLES: { id: VehicleClass; seats: number; note: string }[] = [
  { id: "sedan", seats: 4, note: "Best for couples or small families" },
  { id: "van", seats: 8, note: "Room for the whole group plus luggage" },
  { id: "xlVan", seats: 11, note: "Largest option, ideal for tour groups" },
];

const INCLUSIONS = [
  "Private vehicle for your group only",
  "Licensed local driver",
  "Flight tracking for airport pickups",
  "20 minutes of complimentary wait time",
];

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
  const searchParams = useSearchParams();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("sedan");
  const [submitted, setSubmitted] = useState(false);

  // Prefill from a deep link (e.g. the homepage booking panel) once, on mount.
  useEffect(() => {
    const p = searchParams.get("pickup");
    const d = searchParams.get("dropoff");
    if (p) setPickup(p);
    if (d) setDropoff(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const step: "route" | "vehicle" | "summary" = !pickup || !dropoff ? "route" : !quote ? "vehicle" : "summary";

  return (
    <div>
      <RouteWaypoints
        className="mb-8"
        steps={[
          { label: "Route", state: step === "route" ? "active" : "done" },
          { label: "Vehicle", state: step === "route" ? "upcoming" : step === "vehicle" ? "active" : "done" },
          { label: "Quote", state: step === "summary" ? "active" : "upcoming" },
        ]}
      />

      <Card className="p-6 sm:p-8">
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Pickup</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden />
                <input
                  required
                  value={pickup}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setSubmitted(false);
                  }}
                  placeholder="Hotel, airport or address"
                  className="input pl-9"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Drop-off</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden />
                <input
                  required
                  value={dropoff}
                  onChange={(e) => {
                    setDropoff(e.target.value);
                    setSubmitted(false);
                  }}
                  placeholder="Hotel, airport or address"
                  className="input pl-9"
                />
              </div>
            </label>
          </div>

          <fieldset>
            <legend className="font-mono text-xs uppercase text-ink/50">Vehicle</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {VEHICLES.map((v) => {
                const selected = vehicleClass === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => {
                      setVehicleClass(v.id);
                      setSubmitted(false);
                    }}
                    aria-pressed={selected}
                    className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-all duration-200 ${
                      selected
                        ? "border-pine bg-pine text-paper shadow-card"
                        : "border-line text-ink/80 hover:border-pine/50 hover:bg-sand/40"
                    }`}
                  >
                    <Car className={`h-5 w-5 ${selected ? "text-goldMuted" : "text-gold"}`} aria-hidden />
                    <span className="font-display text-base leading-tight">{vehicleLabel(v.id)}</span>
                    <span
                      className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide ${
                        selected ? "text-paper/70" : "text-ink/45"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      Up to {v.seats}
                    </span>
                    <span className={`font-body text-xs ${selected ? "text-paper/70" : "text-ink/50"}`}>
                      {v.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Button type="submit" size="lg">
            Get instant quote
          </Button>
        </form>

        {quote && (
          <div className="mt-8 border-t border-line pt-6">
            <RouteLine from={quote.pickup} to={quote.dropoff} />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="font-body text-sm text-ink/60">
                <div>
                  {quote.distanceKm} km · approx {formatDuration(quote.durationMinutes)}
                </div>
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

            <div className="mt-6 rounded-sm bg-sand/50 p-4">
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/50">Included</span>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {INCLUSIONS.map((inc) => (
                  <li key={inc} className="flex items-start gap-2 font-body text-xs text-ink/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>

            <LinkButton href={bookingHref} size="lg" className="mt-6 w-full">
              Request this trip
            </LinkButton>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-body text-xs text-ink/45">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
              This is a booking request — confirmed by the operator before any payment.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
