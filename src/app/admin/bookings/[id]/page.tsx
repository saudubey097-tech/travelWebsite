import { notFound } from "next/navigation";
import { Calendar, Users, MapPin, Mail, Phone, Lock } from "lucide-react";
import { getFullBookingAudit, getBookingRelatedNotifications } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { Timeline } from "@/components/workflow/Timeline";
import { OverrideAssignmentForm } from "@/components/workflow/OverrideAssignmentForm";
import { CorrectStatusForm } from "@/components/workflow/CorrectStatusForm";
import { AddNoteForm } from "@/components/workflow/AddNoteForm";
import { ResendNotificationButton } from "@/components/workflow/ResendNotificationButton";
import { AssignmentHistory } from "@/components/workflow/AssignmentHistory";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/pricing";
import { formatNZDate, formatNZDateTime } from "@/lib/format";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("ADMIN");
  const [booking, drivers, notifications] = await Promise.all([
    getFullBookingAudit(id),
    db.appUser.findMany({ where: { role: "DRIVER", active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getBookingRelatedNotifications(id),
  ]);
  if (!booking) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wide text-ink/40">{booking.reference}</span>
            <h2 className="mt-1 font-display text-2xl text-ink">{booking.customer.name}</h2>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <Card className="p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Customer</span>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-body text-sm text-ink/75">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gold" aria-hidden />
              {booking.customer.email}
            </span>
            {booking.customer.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
                {booking.customer.phone}
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-2 border-t border-line pt-3 font-body text-sm text-ink/65 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" aria-hidden />
              {formatNZDate(booking.travelDate)}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" aria-hidden />
              {booking.paxCount} guests
            </span>
            {(booking.pickupAddress || booking.dropoffAddress) && (
              <span className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                {booking.pickupAddress ?? "—"} → {booking.dropoffAddress ?? "—"}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-6 border-t border-line pt-3 font-body text-sm">
            <span>
              <span className="block font-mono text-[11px] uppercase text-ink/40">Coordinator</span>
              {booking.coordinator?.name ?? "Unassigned"}
            </span>
            <span>
              <span className="block font-mono text-[11px] uppercase text-ink/40">Confirmed price</span>
              {booking.confirmedPriceCents ? formatMoney({ amount: booking.confirmedPriceCents / 100, currency: "NZD" }) : "—"}
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Assignments</span>
          <div className="mt-2">
            <AssignmentHistory assignments={booking.assignments} />
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <OverrideAssignmentForm bookingId={booking.id} drivers={drivers} />
          </div>
        </Card>

        <Card className="p-5">
          <span className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-ink/45">
            Correct status
          </span>
          <CorrectStatusForm bookingId={booking.id} currentStatus={booking.status} />
        </Card>

        <Card className="p-5">
          <span className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink/45">
            <Lock className="h-3 w-3" aria-hidden />
            All messages (customer-visible + internal)
          </span>
          <ul className="space-y-2">
            {booking.messages.map((m) => (
              <li key={m.id} className="font-body text-sm">
                <span className="font-mono text-[10px] uppercase text-ink/40">
                  {m.sender.name} ({m.sender.role}) · {m.visibility}
                </span>
                <p className="text-ink/75">{m.body}</p>
              </li>
            ))}
            {booking.messages.length === 0 && <li className="font-body text-sm text-ink/40">No messages.</li>}
          </ul>
          <div className="mt-3 border-t border-line pt-3">
            <AddNoteForm bookingId={booking.id} />
          </div>
        </Card>

        {notifications.length > 0 && (
          <Card className="p-5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Notifications sent</span>
            <ul className="mt-2 space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body text-sm text-ink/80">
                      {n.title} <span className="text-ink/40">→ {n.user.name}</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase text-ink/35">{formatNZDateTime(n.createdAt)}</p>
                  </div>
                  <ResendNotificationButton notificationId={n.id} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div>
          <h3 className="mb-4 font-display text-lg text-ink">Audit timeline</h3>
          <Timeline
            events={booking.events.map((e) => ({ ...e, actor: e.actor ? { name: e.actor.name, role: e.actor.role } : null }))}
            dense
          />
          <div className="mt-4 space-y-1.5">
            {booking.events
              .filter((e) => e.context && typeof e.context === "object" && (e.context as Record<string, unknown>).reason)
              .map((e) => (
                <p key={e.id} className="font-body text-xs text-ink/50">
                  <span className="font-mono uppercase text-ink/35">{formatNZDateTime(e.createdAt)}</span> —{" "}
                  {String((e.context as Record<string, unknown>).reason)}
                </p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
