import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { TourCard } from "@/components/tours/TourCard";
import { getTours } from "@/lib/tours";

export default async function HomePage() {
  const tours = await getTours();

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wide text-gold">Popular day tours</span>
            <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">
              Iconic days out, one vehicle, one driver.
            </h2>
          </div>
          <Link href="/tours" className="hidden font-body text-sm text-pine hover:underline sm:inline">
            All day tours →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </section>

      <ValueProps />
    </>
  );
}
