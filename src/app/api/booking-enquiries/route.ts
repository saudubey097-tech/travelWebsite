import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const bookingSchema = z.object({
  bookingType: z.enum(["DAY_TOUR", "TRANSFER", "HOURLY"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(6).max(30),
  travelDate: z.string().date(),
  guests: z.coerce.number().int().min(1).max(11),
  pickup: z.string().trim().max(200).optional(),
  dropoff: z.string().trim().max(200).optional(),
  vehicle: z.enum(["sedan", "van", "xlVan"]).optional(),
  tour: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  quotedPrice: z.coerce.number().int().positive().max(100000).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cleaned = body && typeof body === "object"
    ? Object.fromEntries(Object.entries(body).filter(([, value]) => value !== ""))
    : body;
  const parsed = bookingSchema.safeParse(cleaned);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the booking details and try again." }, { status: 400 });
  }

  const { name, email, phone, travelDate, guests, pickup, dropoff, vehicle, tour, notes, quotedPrice, bookingType } = parsed.data;
  const recipient = process.env.BOOKING_NOTIFICATION_EMAIL;
  const from = process.env.EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  // A booking request is only accepted when it can be delivered. This avoids a
  // misleading success state before the database-backed workflow is enabled.
  if (!recipient || !from || !apiKey) {
    return NextResponse.json(
      { error: "Online booking requests are not configured yet. Please contact the operator directly." },
      { status: 503 }
    );
  }

  const reference = `SB-${Date.now().toString(36).toUpperCase()}`;
  const details = [
    `Reference: ${reference}`,
    `Service: ${bookingType.replace("_", " ")}`,
    `Travel date: ${travelDate}`,
    `Guests: ${guests}`,
    pickup ? `Pickup: ${pickup}` : null,
    dropoff ? `Drop-off: ${dropoff}` : null,
    tour ? `Tour: ${tour}` : null,
    vehicle ? `Vehicle: ${vehicle}` : null,
    quotedPrice ? `Indicative quote: NZ$${quotedPrice}` : null,
    notes ? `Notes: ${notes}` : null,
  ].filter(Boolean).join("\n");

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: recipient,
      replyTo: email,
      subject: `New Southbound booking request ${reference}`,
      text: `${details}\n\nTraveller\n${name}\n${email}\n${phone}`,
    });
    return NextResponse.json({ reference });
  } catch {
    return NextResponse.json({ error: "We could not send your request. Please try again shortly." }, { status: 502 });
  }
}
