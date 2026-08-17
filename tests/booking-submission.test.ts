import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeDb } from "./fakeDb";

const fakeDb = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakeDb> | null }));

vi.mock("@/lib/db", () => ({ get db() { return fakeDb.current; } }));

const { submitBookingRequest } = await import("@/lib/booking/submit");

// Scenario 7: the public booking form's underlying submission path creates
// a booking_requests row (SUBMITTED), a booking_events row, and a
// notification for staff — used by both the anonymous marketing form and
// any authenticated flow.
describe("submitBookingRequest", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
  });

  it("creates a booking, an audit event, and staff notifications for an anonymous visitor", async () => {
    const db = fakeDb.current!;
    const coordinator = await db.appUser.create({
      data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR", active: true },
    });

    const result = await submitBookingRequest({
      serviceType: "TRANSFER",
      name: "Jamie Traveller",
      email: "jamie@example.com",
      phone: "+64211234567",
      travelDate: "2026-12-01",
      paxCount: 2,
      pickup: "Auckland Airport",
      dropoff: "Sky City",
      authedUserId: null,
    });

    expect(result.status).toBe("SUBMITTED");
    expect(result.reference).toMatch(/^SB-/);

    const customer = await db.appUser.findUnique({ where: { email: "jamie@example.com" } });
    expect(customer).not.toBeNull();
    expect(customer?.role).toBe("CUSTOMER");

    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: result.id } });
    expect(events).toHaveLength(1);
    expect(events[0]!.newStatus).toBe("SUBMITTED");

    const notifications = await db.notification.findMany({ where: { userId: coordinator.id } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.type).toBe("NEW_BOOKING_REQUEST");
  });

  it("reuses an existing customer account by email instead of creating a duplicate", async () => {
    const db = fakeDb.current!;
    const existing = await db.appUser.create({
      data: { email: "returning@example.com", name: "Returning Customer", passwordHash: "x", role: "CUSTOMER" },
    });

    await submitBookingRequest({
      serviceType: "DAY_TOUR",
      name: "Returning Customer",
      email: "returning@example.com",
      phone: "+64211234567",
      travelDate: "2026-12-05",
      paxCount: 1,
      authedUserId: null,
    });

    const matchingUsers = await db.appUser.findMany({ where: { email: "returning@example.com" } });
    expect(matchingUsers).toHaveLength(1);

    const booking = await db.bookingRequest.findFirst({ where: { customerId: existing.id } });
    expect(booking).not.toBeNull();
  });
});
