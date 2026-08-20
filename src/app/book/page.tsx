import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "@/components/bookings/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getTours } from "@/lib/tours";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Request a Booking",
  description: "Send Southbound your trip details and receive a confirmed booking response.",
  alternates: { canonical: "/book" },
};

export default async function BookPage() {
  const [tours, user] = await Promise.all([getTours(), getCurrentUser()]);

  return (
    <section className="container-edit max-w-2xl py-16 sm:py-20">
      <SectionHeading
        eyebrow="Booking request"
        title="Tell us about your trip."
        description="Send your dates and trip details. We will confirm availability and your final price before taking any payment."
      />
      <div className="mt-10">
        <Suspense>
          <BookingForm
            tours={tours.map((t) => ({ slug: t.slug, title: t.title }))}
            prefill={user ? { name: user.name, email: user.email } : undefined}
          />
        </Suspense>
      </div>
    </section>
  );
}
