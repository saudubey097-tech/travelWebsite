import type { Metadata } from "next";
import { listQueue } from "@/lib/actions/coordinator";
import { BookingCard } from "@/components/workflow/BookingCard";

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
  searchParams: Promise<{ queue?: string }>;
}) {
  const { queue: queueParam } = await searchParams;
  const queue = (VALID_QUEUES as readonly string[]).includes(queueParam ?? "")
    ? (queueParam as (typeof VALID_QUEUES)[number])
    : "NEW";

  const bookings = await listQueue(queue);

  return (
    <div>
      {bookings.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-10 text-center font-body text-sm text-ink/50">
          Nothing in this queue right now.
        </p>
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
