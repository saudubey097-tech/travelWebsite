import type { Metadata } from "next";
import { Check, Clock, Gauge, Sparkles } from "lucide-react";
import { HourlyPlan } from "@/types";
import { formatMoney, vehicleLabel } from "@/lib/pricing";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Hourly Driver Hire",
  description: "A private driver by the hour, for flexible sightseeing or events.",
  alternates: { canonical: "/hourly" },
};

interface Plan extends HourlyPlan {
  recommended?: boolean;
  useCases: string[];
}

const PLANS: Plan[] = [
  {
    vehicleClass: "sedan",
    ratePerHour: { amount: 80, currency: "NZD" },
    minimumHours: 3,
    includedKmPerHour: 40,
    useCases: ["Cruise-ship days for two", "Wine-region tastings", "Point-to-point sightseeing"],
  },
  {
    vehicleClass: "van",
    ratePerHour: { amount: 105, currency: "NZD" },
    minimumHours: 3,
    includedKmPerHour: 40,
    recommended: true,
    useCases: ["Family sightseeing days", "Small group shopping trips", "Multi-stop city tours"],
  },
  {
    vehicleClass: "xlVan",
    ratePerHour: { amount: 130, currency: "NZD" },
    minimumHours: 3,
    includedKmPerHour: 40,
    useCases: ["Weddings and events", "Tour groups up to 11", "Corporate off-sites"],
  },
];

export default function HourlyPage() {
  return (
    <section className="container-edit py-16 sm:py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Hourly hire"
          title="A private driver by the hour."
          description="Perfect for cruise days, shopping, weddings or flexible sightseeing — pay for the time you actually use, with a fixed rate agreed up front."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.vehicleClass} delay={i * 0.06}>
            <Card
              hover
              className={`relative flex h-full flex-col p-6 ${plan.recommended ? "border-pine ring-1 ring-pine" : ""}`}
            >
              {plan.recommended && (
                <Badge tone="pine" className="absolute -top-3 left-6 gap-1 bg-pine text-paper">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Recommended
                </Badge>
              )}

              <h3 className="font-display text-lg text-ink">{vehicleLabel(plan.vehicleClass)}</h3>
              <div className="mt-3 font-display text-3xl text-pine">
                {formatMoney(plan.ratePerHour)}
                <span className="font-body text-sm text-ink/50">/hr</span>
              </div>

              <ul className="mt-5 space-y-2 font-body text-sm text-ink/70">
                <li className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-gold" aria-hidden />
                  {plan.includedKmPerHour} km included per hour
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gold" aria-hidden />
                  Minimum {plan.minimumHours} hours
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" aria-hidden />
                  One driver, one vehicle
                </li>
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Good for</span>
                <ul className="mt-2.5 space-y-1.5">
                  {plan.useCases.map((use) => (
                    <li key={use} className="font-body text-sm text-ink/65">
                      {use}
                    </li>
                  ))}
                </ul>
              </div>

              <LinkButton
                href={`/book?type=HOURLY&vehicle=${plan.vehicleClass}`}
                size="md"
                variant={plan.recommended ? "primary" : "secondary"}
                className="mt-6"
              >
                Book by the hour
              </LinkButton>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="mt-10 max-w-2xl font-body text-sm leading-relaxed text-ink/55">
          Rates cover the vehicle and driver for your booked hours, with the included
          kilometres above. Extra kilometres and any additional time on the day are billed
          at the same hourly rate — your driver will confirm the total before you travel.
        </p>
      </Reveal>
    </section>
  );
}
