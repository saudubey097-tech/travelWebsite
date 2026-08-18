import type { Metadata } from "next";
import { Inbox, Clock, XCircle, CalendarCheck, Car } from "lucide-react";
import { listQueue, getCoordinatorSummary } from "@/lib/actions/coordinator";
import { BookingCard } from "@/components/workflow/BookingCard";
import { ClaimBookingButton } from "@/components/workflow/ClaimBookingButton";
import { PriorityToggle } from "@/components/workflow/PriorityToggle";
import { DashboardMetricCard } from "@/components/workflow/DashboardMetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Coordinator", robots: { index: false } };

const VALID_QUEUES = [
  "NEW",
  "PENDING_ASSIGNMENT",
  "DRIVER_DECLINED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function CoordinatorQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ queue?: string; q?: string }>;
}) {
  const { queue: queueParam, q } = await searchParams;
  const queue = (VALID_QUEUES as readonly string[]).includes(queueParam ?? "")
    ? (queueParam as (typeof VALID_QUEUES)[number])
    : "NEW";

  const [user, bookings, summary] = await Promise.all([
    requireRole("COORDINATOR", "ADMIN"),
    listQueue(queue, q),
    getCoordinatorSummary(),
  ]);

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardMetricCard label="New requests" value={summary.newRequests} icon={Inbox} />
        <DashboardMetricCard label="Awaiting assignment" value={summary.awaitingAssignment} icon={Clock} />
        <DashboardMetricCard label="Driver declines" value={summary.driverDeclines} icon={XCircle} />
        <DashboardMetricCard label="Scheduled today" value={summary.scheduledToday} icon={CalendarCheck} />
        <DashboardMetricCard label="Active trips" value={summary.activeTrips} icon={Car} />
      </div>

      <form method="get" className="mb-6 flex gap-2">
        <input type="hidden" name="queue" value={queue} />
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by reference, customer, or route…"
          className="input max-w-sm"
        />
        <button type="submit" className="rounded-sm bg-pine px-4 py-2.5 font-body text-sm text-paper">
          Search
        </button>
      </form>

      {bookings.length === 0 ? (
        <EmptyState title="Nothing in this queue right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              href={`/coordinator/bookings/${b.id}`}
              booking={{
                id: b.id,
                reference: b.reference,
                serviceType: b.serviceType,
                status: b.status,
                travelDate: b.travelDate,
                paxCount: b.paxCount,
                pickupAddress: b.pickupAddress,
                dropoffAddress: b.dropoffAddress,
                customerName: b.customer.name,
                priority: b.priority,
              }}
              actions={
                <>
                  <PriorityToggle bookingId={b.id} priority={b.priority} />
                  {!b.coordinatorId && <ClaimBookingButton bookingId={b.id} />}
                  {b.coordinatorId === user.id && (
                    <span className="font-mono text-[10px] uppercase text-pine">You</span>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
