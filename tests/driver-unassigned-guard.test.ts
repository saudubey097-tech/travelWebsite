import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeDb } from "./fakeDb";
import { makeUser } from "./testUser";

const fakeDb = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakeDb> | null }));
const session = vi.hoisted(() => ({ current: null as ReturnType<typeof makeUser> | null }));

vi.mock("@/lib/db", () => ({ get db() { return fakeDb.current; } }));
vi.mock("@/lib/auth/session", () => ({
  requireUser: async () => {
    if (!session.current) throw new Error("UNAUTHENTICATED");
    return session.current;
  },
  requireRole: async (...roles: string[]) => {
    if (!session.current) throw new Error("UNAUTHENTICATED");
    if (!roles.includes(session.current.role)) throw new Error("FORBIDDEN");
    return session.current;
  },
  getCurrentUser: async () => session.current,
}));

const { updateTripStatus, sendDriverMessage } = await import("@/lib/actions/driver");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// Scenario: a driver cannot update the status of, or message on, a booking
// they aren't the accepted driver for — whether it was never offered to
// them, or was offered but not yet (or no longer) accepted.
describe("driver actions guard against unassigned bookings", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("refuses updateTripStatus for a booking the driver has no assignment on at all", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const driver = await db.appUser.create({ data: { email: "d@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-50", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: driver.id as string, role: "DRIVER" });
    const result = await updateTripStatus({ ok: true }, fd({ bookingId: booking.id as string, status: "IN_PROGRESS" }));
    expect(result.ok).toBe(false);

    const refreshed = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(refreshed?.status).toBe("PENDING_ASSIGNMENT");
  });

  it("refuses updateTripStatus while the driver's offer is still only OFFERED, not ACCEPTED", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driver = await db.appUser.create({ data: { email: "d2@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-51", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driver.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driver.id as string, role: "DRIVER" });
    const result = await updateTripStatus({ ok: true }, fd({ bookingId: booking.id as string, status: "IN_PROGRESS" }));
    expect(result.ok).toBe(false);
  });

  it("refuses updateTripStatus for a driver whose offer belongs to a different booking", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c3@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co3@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driver = await db.appUser.create({ data: { email: "d3@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const myBooking = await db.bookingRequest.create({
      data: { reference: "SB-52", customerId: customer.id, serviceType: "TRANSFER", status: "ACCEPTED", travelDate: new Date(), paxCount: 2 },
    });
    const otherBooking = await db.bookingRequest.create({
      data: { reference: "SB-53", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    await db.bookingAssignment.create({
      data: { bookingRequestId: myBooking.id, driverId: driver.id, offeredById: coordinator.id, status: "ACCEPTED" },
    });

    session.current = makeUser({ id: driver.id as string, role: "DRIVER" });
    // Try to move the OTHER booking (not theirs) into IN_PROGRESS.
    const result = await updateTripStatus({ ok: true }, fd({ bookingId: otherBooking.id as string, status: "IN_PROGRESS" }));
    expect(result.ok).toBe(false);

    const refreshed = await db.bookingRequest.findUnique({ where: { id: otherBooking.id } });
    expect(refreshed?.status).toBe("PENDING_ASSIGNMENT");
  });

  it("refuses sendDriverMessage for a booking the driver has no accepted assignment on", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c4@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const driver = await db.appUser.create({ data: { email: "d4@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-54", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: driver.id as string, role: "DRIVER" });
    const result = await sendDriverMessage({ ok: true }, fd({ bookingId: booking.id as string, body: "Hello?" }));
    expect(result.ok).toBe(false);

    const messages = await db.bookingMessage.findMany({ where: { bookingRequestId: booking.id } });
    expect(messages).toHaveLength(0);
  });
});
