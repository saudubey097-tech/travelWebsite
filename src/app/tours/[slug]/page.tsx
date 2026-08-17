import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTourBySlug, getTourSlugs } from "@/lib/tours";
import { formatMoney } from "@/lib/pricing";
import { RouteLine } from "@/components/ui/RouteLine";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, Clock, Users } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getTourSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return {};
  return {
    title: tour.title,
    description: tour.summary,
    alternates: { canonical: `/tours/${slug}` },
    openGraph: { title: tour.title, description: tour.summary, images: [tour.heroImage] },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const from = tour.stops[0]?.name ?? "";
  const to = tour.stops[tour.stops.length - 1]?.name ?? "";

  return (
    <article>
      <div className="relative h-[50vh] min-h-[340px] w-full sm:h-[56vh]">
        <Image src={tour.heroImage} alt={tour.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
        <div className="container-edit absolute bottom-0 left-0 right-0 pb-9 sm:pb-12">
          <span className="font-mono text-xs uppercase tracking-wide text-goldMuted">{tour.region}</span>
          <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-paper sm:text-4xl lg:text-5xl">
            {tour.title}
          </h1>
          {tour.tags && tour.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tour.tags.map((tag) => (
                <Badge key={tag} tone="ink" className="border-paper/20 bg-ink/50 text-paper">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-edit grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_340px]">
        <div>
          <RouteLine from={from} to={to} size="lg" />

          <div className="mt-6 flex flex-wrap gap-6 border-y border-line py-4 font-mono text-xs uppercase tracking-wide text-ink/50">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" aria-hidden />
              {tour.durationHours} hours
            </span>
            {tour.maxGroupSize && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" aria-hidden />
                Up to {tour.maxGroupSize} guests
              </span>
            )}
          </div>

          <p className="mt-8 font-body text-base leading-relaxed text-ink/80">{tour.description}</p>

          <h2 className="mt-10 font-display text-xl text-ink">Highlights</h2>
          <ul className="mt-4 space-y-2.5">
            {tour.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 font-body text-sm text-ink/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {h}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-display text-xl text-ink">What&apos;s included</h2>
          <ul className="mt-4 space-y-2.5">
            {tour.included.map((i) => (
              <li key={i} className="flex items-start gap-2.5 font-body text-sm text-ink/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-md border border-line bg-sand/50 p-6 shadow-card lg:sticky lg:top-24">
          <span className="font-mono text-xs uppercase text-ink/50">From</span>
          <div className="font-display text-3xl text-pine">{formatMoney(tour.priceFrom)}</div>
          <p className="font-mono text-xs text-ink/50">
            per vehicle · {tour.durationHours} hrs{tour.maxGroupSize ? ` · up to ${tour.maxGroupSize} guests` : ""}
          </p>
          <LinkButton href={`/book?type=DAY_TOUR&tour=${encodeURIComponent(tour.slug)}`} size="lg" className="mt-5 w-full">
            Check availability
          </LinkButton>
          <p className="mt-3 font-body text-xs leading-relaxed text-ink/50">
            Free cancellation up to 24 hours before pickup. This confirms a request — the
            operator will reply with availability and a final price.
          </p>
        </aside>
      </div>
    </article>
  );
}
