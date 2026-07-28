import Image from "next/image";
import Link from "next/link";
import { DayTour } from "@/types";
import { formatMoney } from "@/lib/pricing";
import { RouteLine } from "@/components/ui/RouteLine";

export function TourCard({ tour }: { tour: DayTour }) {
  const from = tour.stops[0]?.name ?? "";
  const to = tour.stops[tour.stops.length - 1]?.name ?? "";

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group block overflow-hidden rounded-md border border-line bg-paper transition-shadow hover:shadow-md"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-paper">
          {tour.region}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-ink">{tour.title}</h3>
        <p className="mt-1 line-clamp-2 font-body text-sm text-ink/65">{tour.summary}</p>

        <RouteLine from={from} to={to} className="mt-4 text-ink/40" />

        <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
          <span className="font-mono text-xs text-ink/50">{tour.durationHours} hrs</span>
          <span className="text-right">
            <span className="block font-mono text-[11px] uppercase text-ink/40">From</span>
            <span className="font-display text-lg text-pine">{formatMoney(tour.priceFrom)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
