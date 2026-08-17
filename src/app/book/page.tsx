import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/bookings/BookingForm";

export const metadata: Metadata = {
  title: "Request a Booking",
  description: "Send Southbound your trip details and receive a confirmed booking response.",
};

export default function BookPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <span className="font-mono text-xs uppercase tracking-wide text-gold">Booking request</span>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Tell us about your trip.</h1>
      <p className="mt-3 max-w-2xl font-body text-ink/70">
        Send your dates and trip details. We will confirm availability and your final price before taking any payment.
      </p>
      <div className="mt-8"><Suspense><BookingForm /></Suspense></div>
    </section>
  );
}
