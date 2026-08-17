"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { CheckCircle2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RouteWaypoints } from "@/components/ui/RouteLine";
import { formatMoney, vehicleLabel } from "@/lib/pricing";
import { VehicleClass } from "@/types";

const today = new Date().toISOString().slice(0, 10);
type BookingType = "DAY_TOUR" | "TRANSFER" | "HOURLY";

const TYPE_LABEL: Record<BookingType, string> = {
  DAY_TOUR: "Day tour",
  TRANSFER: "Transfer",
  HOURLY: "Hourly hire",
};

function isVehicleClass(v: string | null): v is VehicleClass {
  return v === "sedan" || v === "van" || v === "xlVan";
}

/** Turns a tour slug like "northland-harbour-day" into "Northland harbour day" for display only. */
function humanizeSlug(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function BookingForm() {
  const search = useSearchParams();
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string; reference?: string }>({
    kind: "idle",
  });
  const initialType = (search.get("type") as BookingType | null) ?? "TRANSFER";
  const pickup = search.get("pickup");
  const dropoff = search.get("dropoff");
  const vehicle = search.get("vehicle");
  const tour = search.get("tour");
  const quotedPrice = search.get("quotedPrice");

  const hasTripSummary = Boolean(pickup || dropoff || vehicle || tour || quotedPrice);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "idle" });
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/booking-enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus({ kind: "error", message: result.error ?? "Something went wrong. Please try again." });
      return;
    }
    setStatus({ kind: "success", message: "We will reply shortly with availability and a confirmed price.", reference: result.reference });
    event.currentTarget.reset();
  }

  if (status.kind === "success") {
    return (
      <Card className="p-8 text-center sm:p-12">
        <RouteWaypoints
          className="mx-auto mb-8 max-w-xs"
          steps={[
            { label: "Trip details", state: "done" },
            { label: "Confirmed", state: "active" },
          ]}
        />
        <CheckCircle2 className="mx-auto h-10 w-10 text-pine" aria-hidden />
        <h2 className="mt-4 font-display text-2xl text-ink">Request sent.</h2>
        {status.reference && (
          <p className="mt-2 font-mono text-sm text-ink/60">
            Reference <span className="text-pine">{status.reference}</span>
          </p>
        )}
        <p className="mx-auto mt-3 max-w-sm font-body text-sm leading-relaxed text-ink/65">{status.message}</p>
        <p className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-1.5 font-body text-xs text-ink/45">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
          This is a confirmed request, not a paid booking — no payment has been taken.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <RouteWaypoints
        className="mb-8 max-w-xs"
        steps={[
          { label: "Trip details", state: "active" },
          { label: "Confirmed", state: "upcoming" },
        ]}
      />

      {hasTripSummary && (
        <Card className="mb-6 p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Your trip</span>
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 font-body text-sm text-ink/75 sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-ink/45">Service</dt>
              <dd>{TYPE_LABEL[initialType]}</dd>
            </div>
            {tour && (
              <div className="flex gap-2">
                <dt className="text-ink/45">Tour</dt>
                <dd>{humanizeSlug(tour)}</dd>
              </div>
            )}
            {pickup && (
              <div className="flex gap-2">
                <dt className="text-ink/45">Pickup</dt>
                <dd>{pickup}</dd>
              </div>
            )}
            {dropoff && (
              <div className="flex gap-2">
                <dt className="text-ink/45">Drop-off</dt>
                <dd>{dropoff}</dd>
              </div>
            )}
            {isVehicleClass(vehicle) && (
              <div className="flex gap-2">
                <dt className="text-ink/45">Vehicle</dt>
                <dd>{vehicleLabel(vehicle)}</dd>
              </div>
            )}
            {quotedPrice && !Number.isNaN(Number(quotedPrice)) && (
              <div className="flex gap-2">
                <dt className="text-ink/45">Indicative price</dt>
                <dd className="text-pine">{formatMoney({ amount: Number(quotedPrice), currency: "NZD" })}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="grid gap-6">
          <input type="hidden" name="bookingType" value={initialType} />
          <input type="hidden" name="pickup" value={pickup ?? ""} />
          <input type="hidden" name="dropoff" value={dropoff ?? ""} />
          <input type="hidden" name="vehicle" value={vehicle ?? ""} />
          <input type="hidden" name="tour" value={tour ?? ""} />
          <input type="hidden" name="quotedPrice" value={quotedPrice ?? ""} />

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink/45 sm:col-span-2">
              Trip
            </legend>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Travel date</span>
              <input required min={today} name="travelDate" type="date" className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Guests</span>
              <input required defaultValue="2" min="1" max="11" name="guests" type="number" className="input" />
            </label>
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink/45 sm:col-span-2">
              Your details
            </legend>
            <Field label="Your name" name="name" required placeholder="Full name" />
            <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
            <Field label="Phone" name="phone" type="tel" required placeholder="Including country code" />
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink/45">Anything else</legend>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Notes or special requests</span>
              <textarea
                name="notes"
                rows={4}
                maxLength={2000}
                placeholder="Flight number, child seats, accessibility needs, or itinerary details"
                className="input resize-y"
              />
            </label>
          </fieldset>

          {status.kind === "error" && (
            <p role="status" className="flex items-start gap-2 font-body text-sm text-red-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {status.message}
            </p>
          )}

          <Button type="submit" size="lg">
            Send booking request
          </Button>

          <p className="flex items-center justify-center gap-1.5 font-body text-xs text-ink/45">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
            Your details go directly to the operator. This is a request — nothing is charged now.
          </p>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase text-ink/50">{label}</span>
      <input name={name} type={type} required={required} placeholder={placeholder} className="input" />
    </label>
  );
}
