import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/bookings/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Request a Booking",
  description: "Send Southbound your trip details and receive a confirmed booking response.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <section className="container-edit max-w-2xl py-16 sm:py-20">
      <SectionHeading
        eyebrow="Booking request"
        title="Tell us about your trip."
        description="Send your dates and trip details. We will confirm availability and your final price before taking any payment."
      />
      <div className="mt-10">
        <Suspense>
          <BookingForm />
        </Suspense>
      </div>
    </section>
  );
}
