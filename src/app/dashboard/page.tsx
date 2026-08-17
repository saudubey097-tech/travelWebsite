import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listMyBookings } from "@/lib/actions/customer";
import { BookingCard } from "@/components/workflow/BookingCard";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

export default async function DashboardPage() {
  const bookings = await listMyBookings();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Your trip requests</h2>
        <LinkButton href="/book" size="sm">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New request
        </LinkButton>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-line p-10 text-center">
          <p className="font-body text-sm text-ink/55">You haven&apos;t requested a trip yet.</p>
          <LinkButton href="/book" size="sm" className="mt-4">
            Request your first trip
          </LinkButton>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              href={`/dashboard/bookings/${b.id}`}
              booking={{
                id: b.id,
                reference: b.reference,
                serviceType: b.serviceType,
                status: b.status,
                travelDate: b.travelDate,
                paxCount: b.paxCount,
                pickupAddress: b.pickupAddress,
                dropoffAddress: b.dropoffAddress,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
