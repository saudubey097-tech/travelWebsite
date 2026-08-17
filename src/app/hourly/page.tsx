import type { Metadata } from "next";
import { HourlyPlan } from "@/types";
import { formatMoney, vehicleLabel } from "@/lib/pricing";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Hourly Driver Hire",
  description: "A private driver by the hour, for flexible sightseeing or events.",
};

const PLANS: HourlyPlan[] = [
  { vehicleClass: "sedan", ratePerHour: { amount: 80, currency: "NZD" }, minimumHours: 3, includedKmPerHour: 40 },
  { vehicleClass: "van", ratePerHour: { amount: 105, currency: "NZD" }, minimumHours: 3, includedKmPerHour: 40 },
  { vehicleClass: "xlVan", ratePerHour: { amount: 130, currency: "NZD" }, minimumHours: 3, includedKmPerHour: 40 },
];

export default function HourlyPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <span className="font-mono text-xs uppercase tracking-wide text-gold">Hourly hire</span>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">A private driver by the hour.</h1>
      <p className="mt-3 max-w-xl font-body text-ink/70">
        Perfect for cruise days, shopping, weddings or flexible sightseeing — pay for the
        time you actually use.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.vehicleClass} className="flex flex-col p-6">
            <h3 className="font-display text-lg text-ink">{vehicleLabel(plan.vehicleClass)}</h3>
            <div className="mt-4 font-display text-3xl text-pine">
              {formatMoney(plan.ratePerHour)}
              <span className="font-body text-sm text-ink/50">/hr</span>
            </div>
            <ul className="mt-4 space-y-1.5 font-body text-sm text-ink/65">
              <li>{plan.includedKmPerHour} km included per hour</li>
              <li>Minimum {plan.minimumHours} hours</li>
              <li>One driver, one vehicle</li>
            </ul>
            <LinkButton href={`/book?type=HOURLY&vehicle=${plan.vehicleClass}`} size="md" className="mt-6">
              Book by the hour
            </LinkButton>
          </Card>
        ))}
      </div>
    </section>
  );
}
