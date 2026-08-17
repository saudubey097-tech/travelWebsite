import { notFound } from "next/navigation";
import { Calendar, Users, MapPin, Mail, Phone } from "lucide-react";
import { getMyTrip, sendDriverMessage } from "@/lib/actions/driver";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { Timeline } from "@/components/workflow/Timeline";
import { ConversationPanel } from "@/components/workflow/ConversationPanel";
import { AssignmentResponseForm } from "@/components/workflow/AssignmentResponseForm";
import { TripStatusForm } from "@/components/workflow/TripStatusForm";
import { Card } from "@/components/ui/Card";

const MESSAGEABLE = ["IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"];

export default async function DriverTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, result] = await Promise.all([requireRole("DRIVER", "ADMIN"), getMyTrip(id)]);
  if (!result) notFound();
  const { booking, assignment } = result;

  const canMessage = assignment.status === "ACCEPTED" && MESSAGEABLE.includes(booking.status);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-wide text-ink/40">{booking.reference}</span>
          <StatusBadge status={booking.status} />
        </div>

        {assignment.status === "OFFERED" && <AssignmentResponseForm assignmentId={assignment.id} />}

        <Card className="p-5">
          <dl className="grid gap-3 font-body text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" aria-hidden />
              {new Date(booking.travelDate).toLocaleDateString("en-NZ", { dateStyle: "full", timeZone: "Pacific/Auckland" })}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold" aria-hidden />
              {booking.paxCount} guest{booking.paxCount === 1 ? "" : "s"}
            </div>
            {(booking.pickupAddress || booking.dropoffAddress) && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                {booking.pickupAddress ?? "—"} → {booking.dropoffAddress ?? "—"}
              </div>
            )}
          </dl>
          {booking.notes && <p className="mt-4 border-t border-line pt-4 font-body text-sm text-ink/65">{booking.notes}</p>}
        </Card>

        {assignment.status === "ACCEPTED" && (
          <Card className="p-5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Customer contact</span>
            <p className="mt-1 font-display text-lg text-ink">{booking.customer.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm text-ink/70">
              {booking.customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gold" aria-hidden />
                  {booking.customer.email}
                </span>
              )}
              {booking.customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
                  {booking.customer.phone}
                </span>
              )}
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <TripStatusForm bookingId={booking.id} currentStatus={booking.status} />
            </div>
          </Card>
        )}

        <div>
          <h3 className="mb-4 font-display text-lg text-ink">Timeline</h3>
          <Timeline events={booking.events} />
        </div>
      </div>

      <div>
        <ConversationPanel
          bookingId={booking.id}
          messages={booking.messages}
          canSend={canMessage}
          disabledReason="Messaging opens once you've accepted this trip."
          action={sendDriverMessage}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
