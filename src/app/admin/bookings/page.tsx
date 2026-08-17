import type { Metadata } from "next";
import { listAllBookings } from "@/lib/actions/admin";
import { BookingCard } from "@/components/workflow/BookingCard";
import type { BookingStatus, ServiceType } from "@prisma/client";

export const metadata: Metadata = { title: "All bookings", robots: { index: false } };

const STATUSES: BookingStatus[] = [
  "SUBMITTED",
  "PENDING_ASSIGNMENT",
  "ACCEPTED",
  "IN_COMMUNICATION",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "REASSIGNMENT_REQUIRED",
  "CANCELLED",
];
const SERVICE_TYPES: ServiceType[] = ["DAY_TOUR", "TRANSFER", "HOURLY", "CUSTOM"];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; serviceType?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as BookingStatus) ? (sp.status as BookingStatus) : undefined;
  const serviceType = SERVICE_TYPES.includes(sp.serviceType as ServiceType) ? (sp.serviceType as ServiceType) : undefined;

  const bookings = await listAllBookings({ status, serviceType, from: sp.from, to: sp.to });

  return (
    <div>
      <form className="mb-8 flex flex-wrap items-end gap-3 border-b border-line pb-6" method="get">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Status</span>
          <select name="status" defaultValue={status ?? ""} className="input">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">Service</span>
          <select name="serviceType" defaultValue={serviceType ?? ""} className="input">
            <option value="">All services</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">From</span>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase text-ink/50">To</span>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className="input" />
        </label>
        <button type="submit" className="rounded-sm bg-pine px-4 py-2.5 font-body text-sm text-paper">
          Filter
        </button>
      </form>

      {bookings.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-10 text-center font-body text-sm text-ink/50">
          No bookings match those filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              href={`/admin/bookings/${b.id}`}
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
