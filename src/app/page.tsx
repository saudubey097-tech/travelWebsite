import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { ValueProps } from "@/components/home/ValueProps";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Destinations } from "@/components/home/Destinations";
import { FaqPreview } from "@/components/home/FaqPreview";
import { FinalCta } from "@/components/home/FinalCta";
import { TourCard } from "@/components/tours/TourCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { getTours } from "@/lib/tours";

export default async function HomePage() {
  const tours = await getTours();

  return (
    <>
      <Hero />

      <ValueProps />

      <section className="border-t border-line bg-stone/40">
        <div className="container-edit py-20 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <SectionHeading eyebrow="Popular day tours" title="Iconic days out, one vehicle, one driver." />
            </Reveal>
            <Link
              href="/tours"
              className="hidden items-center gap-1.5 font-body text-sm text-pine transition-colors hover:text-pineLight sm:inline-flex"
            >
              All day tours
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tours.map((tour, i) => (
              <Reveal key={tour.slug} delay={i * 0.05}>
                <TourCard tour={tour} />
              </Reveal>
            ))}
          </div>

          <Link
            href="/tours"
            className="mt-8 flex items-center justify-center gap-1.5 font-body text-sm text-pine sm:hidden"
          >
            All day tours
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <HowItWorks />
      <Destinations />
      <FaqPreview />
      <FinalCta />
    </>
  );
}
