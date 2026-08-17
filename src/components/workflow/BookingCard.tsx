import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import type { BookingStatus, ServiceType } from "@prisma/client";

const SERVICE_LABEL: Record<ServiceType, string> = {
  DAY_TOUR: "Day tour",
  TRANSFER: "Transfer",
  HOURLY: "Hourly hire",
  CUSTOM: "Custom trip",
};

export interface BookingCardData {
  id: string;
  reference: string;
  serviceType: ServiceType;
  status: BookingStatus;
  travelDate: Date | string;
  paxCount: number;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  customerName?: string;
}

export function BookingCard({ booking, href }: { booking: BookingCardData; href: string }) {
  return (
    <Link href={href} className="block">
      <Card hover className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">{booking.reference}</span>
            <h3 className="mt-1 font-display text-lg text-ink">{SERVICE_LABEL[booking.serviceType]}</h3>
            {booking.customerName && <p className="mt-0.5 font-body text-sm text-ink/60">{booking.customerName}</p>}
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-body text-xs text-ink/55">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden />
            {new Date(booking.travelDate).toLocaleDateString("en-NZ", { dateStyle: "medium", timeZone: "Pacific/Auckland" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gold" aria-hidden />
            {booking.paxCount} guest{booking.paxCount === 1 ? "" : "s"}
          </span>
          {(booking.pickupAddress || booking.dropoffAddress) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
              {booking.pickupAddress ?? "—"} → {booking.dropoffAddress ?? "—"}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
