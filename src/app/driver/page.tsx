import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { listMyAssignments } from "@/lib/actions/driver";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Driver", robots: { index: false } };

const SERVICE_LABEL: Record<string, string> = {
  DAY_TOUR: "Day tour",
  TRANSFER: "Transfer",
  HOURLY: "Hourly hire",
  CUSTOM: "Custom trip",
};

export default async function DriverHomePage() {
  const assignments = await listMyAssignments();

  const offered = assignments.filter((a) => a.status === "OFFERED");
  const active = assignments.filter(
    (a) => a.status === "ACCEPTED" && ["ACCEPTED", "IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"].includes(a.bookingRequest.status)
  );
  const completed = assignments.filter((a) => a.status === "ACCEPTED" && a.bookingRequest.status === "COMPLETED");

  return (
    <div className="space-y-10">
      <Section title="Offered to you" empty="No open offers right now." items={offered} />
      <Section title="Upcoming & active" empty="Nothing on the road right now." items={active} />
      <Section title="Completed" empty="No completed trips yet." items={completed} />
    </div>
  );
}

function Section({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Awaited<ReturnType<typeof listMyAssignments>>;
}) {
  return (
    <div>
      <h2 className="mb-4 font-display text-lg text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="font-body text-sm text-ink/45">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.id} href={`/driver/trips/${a.bookingRequest.id}`}>
              <Card hover className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
                      {a.bookingRequest.reference}
                    </span>
                    <h3 className="mt-1 font-display text-lg text-ink">
                      {SERVICE_LABEL[a.bookingRequest.serviceType]}
                    </h3>
                  </div>
                  {a.status === "OFFERED" ? <Badge tone="gold">New offer</Badge> : <StatusBadge status={a.bookingRequest.status} />}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-body text-xs text-ink/55">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {new Date(a.bookingRequest.travelDate).toLocaleDateString("en-NZ", { dateStyle: "medium", timeZone: "Pacific/Auckland" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gold" aria-hidden />
                    {a.bookingRequest.paxCount}
                  </span>
                  {(a.bookingRequest.pickupAddress || a.bookingRequest.dropoffAddress) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                      {a.bookingRequest.pickupAddress ?? "—"} → {a.bookingRequest.dropoffAddress ?? "—"}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
