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

const { respondToAssignment } = await import("@/lib/actions/driver");
const { assignDriver } = await import("@/lib/actions/coordinator");
const { cancelBooking } = await import("@/lib/actions/customer");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("driver decline moves a booking to REASSIGNMENT_REQUIRED, and a coordinator can reassign", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("declines, reassigns to a second driver, and that driver can accept", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverA = await db.appUser.create({ data: { email: "a@example.com", name: "Driver A", passwordHash: "x", role: "DRIVER", active: true } });
    const driverB = await db.appUser.create({ data: { email: "b@example.com", name: "Driver B", passwordHash: "x", role: "DRIVER", active: true } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-20", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    const offerA = await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverA.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driverA.id as string, role: "DRIVER" });
    const decline = await respondToAssignment(
      { ok: true },
      fd({ assignmentId: offerA.id as string, decision: "DECLINE", declineReason: "Fully booked" })
    );
    expect(decline.ok).toBe(true);

    const afterDecline = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(afterDecline?.status).toBe("REASSIGNMENT_REQUIRED");

    session.current = makeUser({ id: coordinator.id as string, role: "COORDINATOR" });
    const reassign = await assignDriver({ ok: true }, fd({ bookingId: booking.id as string, driverId: driverB.id as string }));
    expect(reassign.ok).toBe(true);

    const assignments = await db.bookingAssignment.findMany({ where: { bookingRequestId: booking.id } });
    const offerB = assignments.find((a) => a.driverId === driverB.id);
    expect(offerB?.status).toBe("OFFERED");

    session.current = makeUser({ id: driverB.id as string, role: "DRIVER" });
    const accept = await respondToAssignment({ ok: true }, fd({ assignmentId: offerB!.id as string, decision: "ACCEPT" }));
    expect(accept.ok).toBe(true);

    const finalBooking = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(finalBooking?.status).toBe("ACCEPTED");
  });
});

describe("cancelBooking with an optional reason", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("cancels a submitted booking and records the reason in the audit event", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-21", customerId: customer.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: customer.id as string, role: "CUSTOMER" });
    const result = await cancelBooking({ ok: true }, fd({ bookingId: booking.id as string, reason: "Plans changed" }));
    expect(result.ok).toBe(true);

    const updated = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe("CANCELLED");

    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: booking.id } });
    const cancelEvent = events.find((e) => e.newStatus === "CANCELLED");
    expect((cancelEvent?.context as Record<string, unknown>)?.reason).toBe("Plans changed");
  });

  it("refuses to cancel a trip already in progress", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c3@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-22", customerId: customer.id, serviceType: "TRANSFER", status: "IN_PROGRESS", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: customer.id as string, role: "CUSTOMER" });
    const result = await cancelBooking({ ok: true }, fd({ bookingId: booking.id as string }));
    expect(result.ok).toBe(false);
  });
});
