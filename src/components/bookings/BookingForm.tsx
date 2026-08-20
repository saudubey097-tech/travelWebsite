"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
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

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Request received",
};

function isVehicleClass(v: string | null): v is VehicleClass {
  return v === "sedan" || v === "van" || v === "xlVan";
}

/** Turns a tour slug like "northland-harbour-day" into "Northland harbour day" for display only. */
function humanizeSlug(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

interface BookingFormProps {
  tours?: { slug: string; title: string }[];
  /** Present when the visitor is signed in — their account identity is
   *  used for the booking regardless of what (if anything) is shown here. */
  prefill?: { name: string; email: string };
}

export function BookingForm({ tours = [], prefill }: BookingFormProps) {
  const search = useSearchParams();
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message?: string;
    reference?: string;
    bookingStatus?: string;
    bookingId?: string;
  }>({ kind: "idle" });
  const initialType = (search.get("type") as BookingType | null) ?? "TRANSFER";
  const [serviceType, setServiceType] = useState<BookingType>(initialType);
  const [pickup, setPickup] = useState(search.get("pickup") ?? "");
  const [dropoff, setDropoff] = useState(search.get("dropoff") ?? "");
  const [tour, setTour] = useState(search.get("tour") ?? "");
  const vehicleParam = search.get("vehicle");
  const [vehicle, setVehicle] = useState(isVehicleClass(vehicleParam) ? vehicleParam : "");
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
    setStatus({
      kind: "success",
      message: "We will reply shortly with availability and a confirmed price.",
      reference: result.reference,
      bookingStatus: result.status,
      bookingId: result.bookingId,
    });
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
        {status.bookingStatus && (
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-goldDeep">
            Status: {STATUS_LABEL[status.bookingStatus] ?? status.bookingStatus}
          </p>
        )}
        <p className="mx-auto mt-3 max-w-sm font-body text-sm leading-relaxed text-ink/65">{status.message}</p>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm text-ink/65">
          <strong>Next:</strong> a coordinator will review your request and confirm your price and driver.
        </p>
        {prefill && status.bookingId && (
          <Link
            href={`/dashboard/bookings/${status.bookingId}`}
            className="mt-4 inline-block font-body text-sm text-pine underline"
          >
            Track this request in your dashboard
          </Link>
        )}
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
          <input type="hidden" name="bookingType" value={serviceType} />
          <input type="hidden" name="quotedPrice" value={quotedPrice ?? ""} />
          {prefill && <input type="hidden" name="name" value={prefill.name} />}
          {prefill && <input type="hidden" name="email" value={prefill.email} />}

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink/45 sm:col-span-2">
              Trip
            </legend>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Service</span>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as BookingType)}
                className="input"
              >
                <option value="TRANSFER">Transfer</option>
                <option value="DAY_TOUR">Day tour</option>
                <option value="HOURLY">Hourly hire</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Travel date</span>
              <input required min={today} name="travelDate" type="date" className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase text-ink/50">Guests</span>
              <input required defaultValue="2" min="1" max="11" name="guests" type="number" className="input" />
            </label>

            {serviceType === "TRANSFER" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs uppercase text-ink/50">Pickup</span>
                  <input
                    required
                    name="pickup"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Hotel, airport or address"
                    className="input"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs uppercase text-ink/50">Drop-off</span>
                  <input
                    required
                    name="dropoff"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="Hotel, airport or address"
                    className="input"
                  />
                </label>
              </>
            )}

            {serviceType === "DAY_TOUR" && (
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="font-mono text-xs uppercase text-ink/50">Tour</span>
                <select required name="tour" value={tour} onChange={(e) => setTour(e.target.value)} className="input">
                  <option value="" disabled>
                    Choose a tour…
                  </option>
                  {tours.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {serviceType === "HOURLY" && (
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase text-ink/50">Vehicle</span>
                <select
                  required
                  name="vehicle"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="input"
                >
                  <option value="" disabled>
                    Choose a vehicle…
                  </option>
                  <option value="sedan">{vehicleLabel("sedan")}</option>
                  <option value="van">{vehicleLabel("van")}</option>
                  <option value="xlVan">{vehicleLabel("xlVan")}</option>
                </select>
              </label>
            )}
          </fieldset>

          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink/45 sm:col-span-2">
              Your details
            </legend>
            {prefill ? (
              <div className="sm:col-span-2">
                <span className="font-mono text-xs uppercase text-ink/50">Booking as</span>
                <p className="font-body text-sm text-ink/80">
                  {prefill.name} · {prefill.email}
                </p>
                <p className="font-body text-xs text-ink/45">Using your signed-in account.</p>
              </div>
            ) : (
              <>
                <Field label="Your name" name="name" required placeholder="Full name" />
                <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
              </>
            )}
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
