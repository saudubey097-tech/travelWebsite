import { notFound } from "next/navigation";
import { Calendar, Users, MapPin, Mail, Phone } from "lucide-react";
import { getBookingDetail, listEligibleDrivers, sendCoordinatorMessage } from "@/lib/actions/coordinator";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { Timeline } from "@/components/workflow/Timeline";
import { ConversationPanel } from "@/components/workflow/ConversationPanel";
import { BookingDetailsForm } from "@/components/workflow/BookingDetailsForm";
import { AssignDriverForm } from "@/components/workflow/AssignDriverForm";
import { MarkScheduledButton } from "@/components/workflow/MarkScheduledButton";
import { ClaimBookingButton } from "@/components/workflow/ClaimBookingButton";
import { PriorityToggle } from "@/components/workflow/PriorityToggle";
import { RevokeAssignmentButton } from "@/components/workflow/RevokeAssignmentButton";
import { AssignmentHistory } from "@/components/workflow/AssignmentHistory";
import { Card } from "@/components/ui/Card";
import { formatNZDate } from "@/lib/format";

const ASSIGNABLE = ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"];

export default async function CoordinatorBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, booking] = await Promise.all([requireRole("COORDINATOR", "ADMIN"), getBookingDetail(id)]);
  if (!booking) notFound();

  const eligibleDrivers = ASSIGNABLE.includes(booking.status) ? await listEligibleDrivers() : [];
  const canSchedule = ["ACCEPTED", "IN_COMMUNICATION"].includes(booking.status);
  const openOffer = booking.assignments.find((a) => a.status === "OFFERED");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wide text-ink/40">{booking.reference}</span>
            <h2 className="mt-1 font-display text-2xl text-ink">{booking.customer.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <PriorityToggle bookingId={booking.id} priority={booking.priority} />
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {!booking.coordinatorId ? (
          <div className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/10 px-4 py-3">
            <span className="font-body text-sm text-ink/75">Unclaimed request.</span>
            <ClaimBookingButton bookingId={booking.id} />
          </div>
        ) : booking.coordinator && booking.coordinator.id !== user.id ? (
          <p className="font-body text-xs text-ink/45">Handled by {booking.coordinator.name}.</p>
        ) : null}

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
        </Card>

        <Card className="p-5">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-wide text-ink/45">Trip details</span>
          <BookingDetailsForm
            bookingId={booking.id}
            travelDate={booking.travelDate.toISOString().slice(0, 10)}
            paxCount={booking.paxCount}
            pickupAddress={booking.pickupAddress}
            dropoffAddress={booking.dropoffAddress}
            notes={booking.notes}
            confirmedPriceCents={booking.confirmedPriceCents}
          />
        </Card>

        {ASSIGNABLE.includes(booking.status) && (
          <Card className="p-5">
            <span className="mb-3 block font-mono text-[11px] uppercase tracking-wide text-ink/45">
              Assign a driver
            </span>
            <AssignDriverForm bookingId={booking.id} drivers={eligibleDrivers} />
          </Card>
        )}

        {booking.assignments.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Assignment history</span>
              {openOffer && <RevokeAssignmentButton assignmentId={openOffer.id} />}
            </div>
            <AssignmentHistory assignments={booking.assignments} />
          </Card>
        )}

        {canSchedule && (
          <Card className="p-5">
            <p className="mb-3 font-body text-sm text-ink/65">
              Driver is confirmed. Mark this trip as scheduled once the itinerary is set.
            </p>
            <MarkScheduledButton bookingId={booking.id} />
          </Card>
        )}

        <div>
          <h3 className="mb-4 font-display text-lg text-ink">Timeline</h3>
          <Timeline
            events={booking.events.map((e) => ({ ...e, actor: e.actor ? { name: e.actor.name, role: e.actor.role } : null }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card className="p-5 font-body text-sm text-ink/65">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Quick facts</span>
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" aria-hidden />
            {formatNZDate(booking.travelDate)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" aria-hidden />
            {booking.paxCount} guests
          </div>
          {(booking.pickupAddress || booking.dropoffAddress) && (
            <div className="mt-1.5 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {booking.pickupAddress ?? "—"} → {booking.dropoffAddress ?? "—"}
            </div>
          )}
        </Card>

        <ConversationPanel
          bookingId={booking.id}
          messages={booking.messages}
          canSend
          allowInternal
          action={sendCoordinatorMessage}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
