import type { Metadata } from "next";
import { getTours } from "@/lib/tours";
import { TourCard } from "@/components/tours/TourCard";

export const metadata: Metadata = {
  title: "Day Tours",
  description: "Private return day trips across New Zealand, one flat price per vehicle.",
};

export default async function ToursPage() {
  const tours = await getTours();

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <span className="font-mono text-xs uppercase tracking-wide text-gold">Day tours</span>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
        Private day trips, priced per vehicle.
      </h1>
      <p className="mt-3 max-w-xl font-body text-ink/70">
        Every tour includes a private vehicle, a local driver, and a flat price for your
        whole group. Pick a day, we handle the rest.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour.slug} tour={tour} />
        ))}
      </div>
    </section>
  );
}
