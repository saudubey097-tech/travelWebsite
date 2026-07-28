"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { RouteLine } from "@/components/ui/RouteLine";
import { TripType } from "@/types";

const TRIP_TYPES: TripType[] = [
  { id: "day-tours", label: "Day tours" },
  { id: "transfers", label: "Transfers" },
  { id: "hourly", label: "Hourly driver" },
];

const TAB_CONTENT: Record<TripType["id"], { copy: string; cta: string; href: string }> = {
  "day-tours": {
    copy: "Return day trips to the places worth the drive, at a flat per-vehicle price.",
    cta: "Browse day tours",
    href: "/tours",
  },
  transfers: {
    copy: "Any pickup, any drop-off. Enter both ends and get a live price in seconds.",
    cta: "Get an instant quote",
    href: "/transfers",
  },
  hourly: {
    copy: "Keep a driver on call by the hour — for cruise days, events or flexible sightseeing.",
    cta: "See hourly rates",
    href: "/hourly",
  },
};

export function Hero() {
  const [active, setActive] = useState<TripType["id"]>("day-tours");
  const content = TAB_CONTENT[active];

  return (
    <section className="border-b border-line bg-gradient-to-b from-sand/70 to-paper">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <RouteLine from="Cape Reinga" to="Bluff" className="mb-6 text-ink/40" />

        <h1 className="max-w-2xl font-display text-4xl italic leading-[1.1] text-ink sm:text-5xl">
          Point A to point B, the easy way.
        </h1>
        <p className="mt-5 max-w-xl font-body text-lg text-ink/70">
          Private drivers, day trips and transfers the length of New Zealand — one
          booking, one vehicle, one local driver.
        </p>

        <div className="mt-9 inline-flex rounded-sm border border-line bg-paper p-1">
          {TRIP_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-sm px-4 py-2 font-body text-sm transition-colors ${
                active === t.id ? "bg-pine text-paper" : "text-ink/60 hover:text-ink"
              }`}
              aria-pressed={active === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <p className="font-body text-ink/70">{content.copy}</p>
          <LinkButton href={content.href} size="lg">
            {content.cta}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
