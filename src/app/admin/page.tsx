import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Clock, CalendarCheck, Car, CheckCircle2, XCircle, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
import { getAdminSummary, getAdminAlerts } from "@/lib/actions/admin";
import { DashboardMetricCard } from "@/components/workflow/DashboardMetricCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNZDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

export default async function AdminOverviewPage() {
  const [summary, alerts] = await Promise.all([getAdminSummary(), getAdminAlerts()]);

  const hasAlerts =
    alerts.unassigned.length > 0 || alerts.overdueOffers.length > 0 || alerts.reassignmentRequired.length > 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard label="Total bookings" value={summary.totalBookings} icon={Inbox} />
        <DashboardMetricCard label="New requests" value={summary.newRequests} icon={Clock} />
        <DashboardMetricCard label="Awaiting assignment" value={summary.awaitingAssignment} icon={RefreshCw} />
        <DashboardMetricCard label="Scheduled today" value={summary.scheduledToday} icon={CalendarCheck} />
        <DashboardMetricCard label="Active trips" value={summary.activeTrips} icon={Car} />
        <DashboardMetricCard label="Completed trips" value={summary.completedTrips} icon={CheckCircle2} />
        <DashboardMetricCard label="Completion rate" value={summary.completionRate} icon={TrendingUp} />
        <DashboardMetricCard label="Driver acceptance rate" value={summary.driverAcceptanceRate} icon={TrendingUp} />
        <DashboardMetricCard label="Reassignments" value={summary.reassignmentCount} icon={XCircle} />
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg text-ink">
          <AlertTriangle className="h-4 w-4 text-gold" aria-hidden />
          Needs attention
        </h2>
        {!hasAlerts ? (
          <EmptyState title="Nothing needs attention right now." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {alerts.unassigned.length > 0 && (
              <Card className="p-5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">
                  Unassigned over 24h
                </span>
                <ul className="mt-2 space-y-1.5">
                  {alerts.unassigned.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/bookings/${b.id}`} className="font-body text-sm text-pine hover:underline">
                        {b.reference}
                      </Link>
                      <span className="ml-2 font-mono text-[10px] uppercase text-ink/40">
                        {formatNZDateTime(b.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {alerts.overdueOffers.length > 0 && (
              <Card className="p-5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">
                  Driver hasn&apos;t responded
                </span>
                <ul className="mt-2 space-y-1.5">
                  {alerts.overdueOffers.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/bookings/${a.bookingRequestId}`}
                        className="font-body text-sm text-pine hover:underline"
                      >
                        {a.driver.name}
                      </Link>
                      <span className="ml-2 font-mono text-[10px] uppercase text-ink/40">
                        {formatNZDateTime(a.offeredAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {alerts.reassignmentRequired.length > 0 && (
              <Card className="p-5">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">
                  Needs reassignment
                </span>
                <ul className="mt-2 space-y-1.5">
                  {alerts.reassignmentRequired.map((b) => (
                    <li key={b.id}>
                      <Link href={`/admin/bookings/${b.id}`} className="font-body text-sm text-pine hover:underline">
                        {b.reference}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/bookings" className="rounded-sm border border-pine px-4 py-2 font-body text-sm text-pine hover:bg-pine hover:text-paper">
          All bookings
        </Link>
        <Link href="/admin/users" className="rounded-sm border border-pine px-4 py-2 font-body text-sm text-pine hover:bg-pine hover:text-paper">
          Manage users
        </Link>
      </div>
    </div>
  );
}
