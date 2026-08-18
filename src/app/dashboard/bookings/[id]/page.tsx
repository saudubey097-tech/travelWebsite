import { notFound } from "next/navigation";
import { Calendar, Users, MapPin, Car, TriangleAlert } from "lucide-react";
import { getMyBooking, sendCustomerMessage, listMyNotificationHistory } from "@/lib/actions/customer";
import { requireUser } from "@/lib/auth/session";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { Timeline } from "@/components/workflow/Timeline";
import { ConversationPanel } from "@/components/workflow/ConversationPanel";
import { Card } from "@/components/ui/Card";
import { formatMoney, vehicleLabel } from "@/lib/pricing";
import { formatNZDate } from "@/lib/format";
import { CancelBookingButton } from "@/components/workflow/CancelBookingButton";
import { BookingNotesForm } from "@/components/workflow/BookingNotesForm";
import { NotificationHistoryPanel } from "@/components/workflow/NotificationHistoryPanel";

const MESSAGEABLE = ["IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"];
const CANCELLABLE = ["SUBMITTED", "PENDING_ASSIGNMENT", "ACCEPTED", "IN_COMMUNICATION", "SCHEDULED", "REASSIGNMENT_REQUIRED"];
const NOTES_EDITABLE = ["SUBMITTED", "PENDING_ASSIGNMENT"];

export default async function CustomerBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, booking, notifications] = await Promise.all([requireUser(), getMyBooking(id), listMyNotificationHistory()]);
  if (!booking) notFound();

  const acceptedAssignment = booking.assignments.find((a) => a.status === "ACCEPTED");
  const canMessage = Boolean(acceptedAssignment) && MESSAGEABLE.includes(booking.status);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wide text-ink/40">{booking.reference}</span>
            <h2 className="mt-1 font-display text-2xl text-ink">Trip details</h2>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <Card className="mt-5 p-5">
          <dl className="grid gap-3 font-body text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" aria-hidden />
              {formatNZDate(booking.travelDate, "full")}
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
            {booking.vehicleClass && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gold" aria-hidden />
                {vehicleLabel(booking.vehicleClass === "XL_VAN" ? "xlVan" : booking.vehicleClass.toLowerCase() as "sedan" | "van")}
              </div>
            )}
          </dl>
          {booking.notes && (
            <p className="mt-4 border-t border-line pt-4 font-body text-sm text-ink/65">{booking.notes}</p>
          )}
          {NOTES_EDITABLE.includes(booking.status) && (
            <BookingNotesForm bookingId={booking.id} notes={booking.notes} />
          )}
        </Card>

        {acceptedAssignment && (
          <Card className="mt-5 p-5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Your driver</span>
            <p className="mt-1 font-display text-lg text-ink">{acceptedAssignment.driver.name}</p>
            {acceptedAssignment.driver.phone && (
              <p className="font-body text-sm text-ink/60">{acceptedAssignment.driver.phone}</p>
            )}
          </Card>
        )}

        <div className="mt-8">
          <h3 className="mb-4 font-display text-lg text-ink">Timeline</h3>
          <Timeline events={booking.events} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card className="p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">
            {booking.confirmedPriceCents ? "Confirmed price" : "Indicative price"}
          </span>
          <div className="mt-1 font-display text-2xl text-pine">
            {booking.confirmedPriceCents
              ? formatMoney({ amount: booking.confirmedPriceCents / 100, currency: "NZD" })
              : booking.quotedPriceCents
                ? formatMoney({ amount: booking.quotedPriceCents / 100, currency: "NZD" })
                : "Pending"}
          </div>
          {!booking.confirmedPriceCents && (
            <p className="mt-2 flex items-start gap-1.5 font-body text-xs text-ink/50">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
              Not confirmed yet — a coordinator will confirm your final price.
            </p>
          )}
          {CANCELLABLE.includes(booking.status) && <CancelBookingButton bookingId={booking.id} />}
        </Card>

        <ConversationPanel
          bookingId={booking.id}
          messages={booking.messages}
          canSend={canMessage}
          disabledReason="Messaging opens once a driver has accepted your trip."
          action={sendCustomerMessage}
          currentUserId={user.id}
        />

        <NotificationHistoryPanel notifications={notifications} />
      </div>
    </div>
  );
}
