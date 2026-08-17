import type { Metadata } from "next";
import { getTours } from "@/lib/tours";
import { TourCard } from "@/components/tours/TourCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Day Tours",
  description: "Private return day trips across New Zealand, one flat price per vehicle.",
  alternates: { canonical: "/tours" },
};

export default async function ToursPage() {
  const tours = await getTours();

  return (
    <section className="container-edit py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Day tours"
          title="Private day trips, priced per vehicle."
          description="Every tour includes a private vehicle, a local driver, and a flat price for your whole group. Pick a day, we handle the rest."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour, i) => (
          <Reveal key={tour.slug} delay={i * 0.05}>
            <TourCard tour={tour} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
