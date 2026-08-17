import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ArrowUpRight } from "lucide-react";
import { DayTour } from "@/types";
import { formatMoney } from "@/lib/pricing";
import { RouteLine } from "@/components/ui/RouteLine";
import { Badge } from "@/components/ui/Badge";

export function TourCard({ tour }: { tour: DayTour }) {
  const from = tour.stops[0]?.name ?? "";
  const to = tour.stops[tour.stops.length - 1]?.name ?? "";

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group block overflow-hidden rounded-md border border-line bg-paper shadow-card transition-all duration-300 ease-signature hover:-translate-y-1.5 hover:shadow-card-hover"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={tour.heroImage}
          alt={tour.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-signature group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-paper">
          {tour.region}
        </span>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="p-5">
        {tour.tags && tour.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tour.tags.map((tag) => (
              <Badge key={tag} tone="gold">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <h3 className="font-display text-lg leading-snug text-ink">{tour.title}</h3>
        <p className="mt-1.5 line-clamp-2 font-body text-sm text-ink/65">{tour.summary}</p>

        <RouteLine from={from} to={to} className="mt-4" />

        <div className="mt-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-wide text-ink/45">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {tour.durationHours} hrs
          </span>
          {tour.maxGroupSize && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden />
              Up to {tour.maxGroupSize}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-line pt-3.5">
          <span className="font-body text-sm font-medium text-pine transition-colors group-hover:text-pineLight">
            View trip
          </span>
          <span className="text-right">
            <span className="block font-mono text-[11px] uppercase text-ink/40">From</span>
            <span className="font-display text-xl text-pine">{formatMoney(tour.priceFrom)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
