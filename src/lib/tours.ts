import { tours } from "@/data/tours";
import { DayTour } from "@/types";

export async function getTours(): Promise<DayTour[]> {
  // Swap this for a fetch()/Prisma/CMS call when a real backend exists.
  // Kept async so call sites don't need to change when that happens.
  return tours;
}

export async function getTourBySlug(slug: string): Promise<DayTour | undefined> {
  return tours.find((t) => t.slug === slug);
}

export async function getTourSlugs(): Promise<string[]> {
  return tours.map((t) => t.slug);
}
