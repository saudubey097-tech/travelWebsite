import type { Metadata } from "next";
import { Plus, Car, CalendarClock, CheckCircle2, MessageSquare } from "lucide-react";
import { listMyBookings, getMyBookingSummary } from "@/lib/actions/customer";
import { BookingCard } from "@/components/workflow/BookingCard";
import { DashboardMetricCard } from "@/components/workflow/DashboardMetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

export default async function DashboardPage() {
  const [bookings, summary] = await Promise.all([listMyBookings(), getMyBookingSummary()]);

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard label="Active trips" value={summary.active} icon={Car} />
        <DashboardMetricCard label="Upcoming trips" value={summary.upcoming} icon={CalendarClock} />
        <DashboardMetricCard label="Completed trips" value={summary.completed} icon={CheckCircle2} />
        <DashboardMetricCard label="Unread messages" value={summary.unreadMessages} icon={MessageSquare} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl text-ink">Your trip requests</h2>
        <LinkButton href="/book" size="sm">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New request
        </LinkButton>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="You haven't requested a trip yet."
            description="Once you send a request, it'll show up here with live status updates."
            action={
              <LinkButton href="/book" size="sm">
                Request your first trip
              </LinkButton>
            }
          />
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
