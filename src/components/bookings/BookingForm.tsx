"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const today = new Date().toISOString().slice(0, 10);
type BookingType = "DAY_TOUR" | "TRANSFER" | "HOURLY";

export function BookingForm() {
  const search = useSearchParams();
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const initialType = (search.get("type") as BookingType | null) ?? "TRANSFER";

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
    setStatus({ kind: "success", message: `Request sent. Your reference is ${result.reference}. We will reply shortly.` });
    event.currentTarget.reset();
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <input type="hidden" name="bookingType" value={initialType} />
        <input type="hidden" name="pickup" value={search.get("pickup") ?? ""} />
        <input type="hidden" name="dropoff" value={search.get("dropoff") ?? ""} />
        <input type="hidden" name="vehicle" value={search.get("vehicle") ?? ""} />
        <input type="hidden" name="tour" value={search.get("tour") ?? ""} />
        <input type="hidden" name="quotedPrice" value={search.get("quotedPrice") ?? ""} />
        <Field label="Your name" name="name" required placeholder="Full name" />
        <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
        <Field label="Phone" name="phone" type="tel" required placeholder="Including country code" />
        <label className="flex flex-col gap-1.5"><span className="font-mono text-xs uppercase text-ink/50">Travel date</span><input required min={today} name="travelDate" type="date" className="input" /></label>
        <label className="flex flex-col gap-1.5"><span className="font-mono text-xs uppercase text-ink/50">Guests</span><input required defaultValue="2" min="1" max="11" name="guests" type="number" className="input" /></label>
        <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="font-mono text-xs uppercase text-ink/50">Notes or special requests</span><textarea name="notes" rows={4} maxLength={2000} placeholder="Flight number, child seats, accessibility needs, or itinerary details" className="input resize-y" /></label>
        {status.kind !== "idle" && <p role="status" className={`sm:col-span-2 font-body text-sm ${status.kind === "success" ? "text-pine" : "text-red-700"}`}>{status.message}</p>}
        <Button type="submit" size="lg" className="sm:col-span-2">Send booking request</Button>
      </form>
    </Card>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="flex flex-col gap-1.5"><span className="font-mono text-xs uppercase text-ink/50">{label}</span><input name={name} type={type} required={required} placeholder={placeholder} className="input" /></label>;
}
