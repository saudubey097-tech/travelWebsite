"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { RouteLine } from "@/components/ui/RouteLine";
import { LinkButton, Button } from "@/components/ui/Button";
import { TripType } from "@/types";
import { HERO_IMAGE } from "@/data/site-content";

const TRIP_TYPES: TripType[] = [
  { id: "day-tours", label: "Day Tour" },
  { id: "transfers", label: "Transfer" },
  { id: "hourly", label: "Hourly Hire" },
];

export function Hero() {
  const [active, setActive] = useState<TripType["id"]>("day-tours");
  const reduceMotion = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="relative">
      {/* Cinematic full-bleed hero */}
      <div className="relative flex min-h-[86vh] items-end overflow-hidden bg-pineDark sm:min-h-[92vh]">
        <Image
          src={HERO_IMAGE}
          alt="Mitre Peak rising above the still, dark water of Milford Sound in Fiordland, New Zealand"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />

        <div className="container-edit relative z-10 pb-40 pt-32 sm:pb-48 sm:pt-40">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <RouteLine from="Cape Reinga" to="Bluff" tone="dark" className="mb-7 text-paper/50" />
          </motion.div>

          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
            className="max-w-3xl font-display text-4xl italic leading-[1.08] text-paper sm:text-6xl lg:text-[4.25rem]"
          >
            New Zealand, at the pace of a private road.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease }}
            className="mt-6 max-w-xl font-body text-lg leading-relaxed text-paper/80"
          >
            A private vehicle and a local driver, the length of the country. Day trips,
            transfers and hourly hire — one fixed price, no one else&apos;s itinerary.
          </motion.p>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease }}
            className="mt-9"
          >
            <LinkButton href="/book" variant="gold" size="lg">
              Request a booking
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LinkButton>
          </motion.div>
        </div>
      </div>

      {/* Compact booking panel, overlapping the hero for depth */}
      <div className="container-edit relative z-20 -mt-24 sm:-mt-28">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="overflow-hidden rounded-lg border border-lineDark bg-pineDark/95 shadow-panel backdrop-blur-md"
        >
          <div className="flex flex-wrap gap-1 border-b border-lineDark p-2 sm:p-3">
            {TRIP_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-sm px-4 py-2.5 font-body text-sm transition-colors duration-200 ${
                  active === t.id ? "bg-gold text-ink" : "text-paper/65 hover:bg-paper/10 hover:text-paper"
                }`}
                aria-pressed={active === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-7">
            {active === "day-tours" && <DayTourPanel />}
            {active === "transfers" && <TransferPanel />}
            {active === "hourly" && <HourlyPanel />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DayTourPanel() {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-body text-sm text-paper/75 sm:max-w-md">
        Return day trips to the places worth the drive, at a flat per-vehicle price —
        browse the full list of tours on offer.
      </p>
      <LinkButton href="/tours" variant="gold" className="w-full sm:w-auto">
        Browse day tours
        <ArrowRight className="h-4 w-4" aria-hidden />
      </LinkButton>
    </div>
  );
}

function TransferPanel() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    router.push(`/transfers${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-paper/50">Pickup</span>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/40" aria-hidden />
          <input
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Hotel, airport or address"
            className="input-dark pl-9"
          />
        </div>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-paper/50">Drop-off</span>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/40" aria-hidden />
          <input
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="Hotel, airport or address"
            className="input-dark pl-9"
          />
        </div>
      </label>
      <Button type="submit" variant="gold" className="w-full sm:w-auto">
        Get instant quote
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}

function HourlyPanel() {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-body text-sm text-paper/75 sm:max-w-md">
        Keep a private driver on call by the hour — for cruise days, events or flexible
        sightseeing. See rates by vehicle size.
      </p>
      <LinkButton href="/hourly" variant="gold" className="w-full sm:w-auto">
        See hourly rates
        <ArrowRight className="h-4 w-4" aria-hidden />
      </LinkButton>
    </div>
  );
}
