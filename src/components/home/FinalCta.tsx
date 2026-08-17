import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { RouteLine } from "@/components/ui/RouteLine";
import { ROAD_IMAGE } from "@/data/site-content";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[420px] w-full sm:h-[460px]">
        <Image
          src={ROAD_IMAGE}
          alt="An open highway winding toward snow-capped mountains in New Zealand's South Island"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="absolute inset-0 flex items-center">
          <div className="container-edit">
            <Reveal>
              <RouteLine from="Your hotel" to="Your itinerary" tone="dark" className="mb-6 max-w-sm text-paper/50" />
              <h2 className="max-w-xl font-display text-3xl italic leading-[1.12] text-paper sm:text-4xl">
                Tell us where you&apos;re headed. We&apos;ll take it from there.
              </h2>
              <p className="mt-4 max-w-md font-body text-paper/70">
                Send your trip details and hear back with a confirmed price and driver —
                usually within one business day.
              </p>
              <LinkButton href="/book" variant="gold" size="lg" className="mt-8">
                Request a booking
                <ArrowRight className="h-4 w-4" aria-hidden />
              </LinkButton>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
