import type { Metadata } from "next";
import { Inbox, Clock, CalendarCheck, Car, CheckCircle2, XCircle } from "lucide-react";
import { getAdminSummary } from "@/lib/actions/admin";
import { DashboardMetricCard } from "@/components/workflow/DashboardMetricCard";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

export default async function AdminOverviewPage() {
  const summary = await getAdminSummary();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardMetricCard label="New requests" value={summary.newRequests} icon={Inbox} />
      <DashboardMetricCard label="Awaiting assignment" value={summary.awaitingAssignment} icon={Clock} />
      <DashboardMetricCard label="Scheduled today" value={summary.scheduledToday} icon={CalendarCheck} />
      <DashboardMetricCard label="Active trips" value={summary.activeTrips} icon={Car} />
      <DashboardMetricCard label="Completed trips" value={summary.completedTrips} icon={CheckCircle2} />
      <DashboardMetricCard label="Declined assignments" value={summary.declinedAssignments} icon={XCircle} />
    </div>
  );
}
