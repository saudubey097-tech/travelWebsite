import "server-only";
import { getEmailAdapter, type EmailSendResult } from "@/lib/email/adapter";

interface OperatorNotificationInput {
  reference: string;
  bookingType: string;
  travelDate: string;
  guests: number;
  pickup?: string;
  dropoff?: string;
  tour?: string;
  vehicle?: string;
  quotedPrice?: number; // cents
  notes?: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Sends the operator's new-booking-request email through the shared
 * environment-variable-driven adapter (src/lib/email/adapter.ts): logs to
 * the console in local dev/tests, fails closed with an explicit error in
 * production if RESEND_API_KEY/EMAIL_FROM aren't set, and only actually
 * sends when both are configured. Always best-effort from the caller's
 * perspective — the booking_requests row and its audit event are written
 * first and independently in submitBookingRequest, so an email outage or
 * missing configuration never loses a request; it only means the operator
 * has to rely on in-app notifications until email is configured.
 */
export async function sendOperatorNotificationEmail(input: OperatorNotificationInput): Promise<EmailSendResult> {
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
  if (!recipient) {
    return { ok: false, provider: "console", error: "BOOKING_NOTIFICATION_EMAIL is not set." };
  }

  const details = [
    `Reference: ${input.reference}`,
    `Service: ${input.bookingType.replace("_", " ")}`,
    `Travel date: ${input.travelDate}`,
    `Guests: ${input.guests}`,
    input.pickup ? `Pickup: ${input.pickup}` : null,
    input.dropoff ? `Drop-off: ${input.dropoff}` : null,
    input.tour ? `Tour: ${input.tour}` : null,
    input.vehicle ? `Vehicle: ${input.vehicle}` : null,
    input.quotedPrice ? `Indicative quote: NZ$${(input.quotedPrice / 100).toFixed(0)}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return getEmailAdapter().send({
    to: recipient,
    subject: `New Southbound booking request ${input.reference}`,
    text: `${details}\n\nTraveller\n${input.name}\n${input.email}\n${input.phone}`,
    html: `<pre>${details}</pre><p>Traveller: ${input.name} (${input.email}, ${input.phone})</p>`,
  });
}
