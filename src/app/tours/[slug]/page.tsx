import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTourBySlug, getTourSlugs } from "@/lib/tours";
import { formatMoney } from "@/lib/pricing";
import { RouteLine } from "@/components/ui/RouteLine";
import { LinkButton } from "@/components/ui/Button";
import { Check } from "lucide-react";

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
  return { title: tour.title, description: tour.summary };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const from = tour.stops[0]?.name ?? "";
  const to = tour.stops[tour.stops.length - 1]?.name ?? "";

  return (
    <article>
      <div className="relative h-[42vh] w-full min-h-[280px]">
        <Image src={tour.heroImage} alt={tour.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <span className="font-mono text-xs uppercase tracking-wide text-goldMuted">{tour.region}</span>
          <h1 className="mt-2 font-display text-3xl text-paper sm:text-4xl">{tour.title}</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <RouteLine from={from} to={to} className="text-ink/40" />
          <p className="mt-6 font-body leading-relaxed text-ink/80">{tour.description}</p>

          <h2 className="mt-8 font-display text-xl text-ink">Highlights</h2>
          <ul className="mt-3 space-y-2">
            {tour.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 font-body text-sm text-ink/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {h}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-xl text-ink">What&apos;s included</h2>
          <ul className="mt-3 space-y-2">
            {tour.included.map((i) => (
              <li key={i} className="flex items-start gap-2 font-body text-sm text-ink/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-md border border-line bg-sand/50 p-6">
          <span className="font-mono text-xs uppercase text-ink/50">From</span>
          <div className="font-display text-3xl text-pine">{formatMoney(tour.priceFrom)}</div>
          <p className="font-mono text-xs text-ink/50">per vehicle · {tour.durationHours} hrs</p>
          <LinkButton href={`/tours/${tour.slug}/book`} size="lg" className="mt-5 w-full">
            Check availability
          </LinkButton>
          <p className="mt-3 font-body text-xs text-ink/50">
            Free cancellation up to 24 hours before pickup.
          </p>
        </aside>
      </div>
    </article>
  );
}
