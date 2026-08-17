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

const { assignDriver } = await import("@/lib/actions/coordinator");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// Scenario 5: a coordinator can assign a driver, and the audit timeline
// (booking_events) is written for the change.
describe("assignDriver", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("creates an OFFERED assignment and notifies the driver", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driver = await db.appUser.create({ data: { email: "d@example.com", name: "Driver", passwordHash: "x", role: "DRIVER", active: true } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-9", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: coordinator.id as string, role: "COORDINATOR" });
    const result = await assignDriver({ ok: true }, fd({ bookingId: booking.id as string, driverId: driver.id as string }));
    expect(result.ok).toBe(true);

    const assignments = await db.bookingAssignment.findMany({ where: { bookingRequestId: booking.id } });
    expect(assignments).toHaveLength(1);
    expect(assignments[0]!.status).toBe("OFFERED");
    expect(assignments[0]!.driverId).toBe(driver.id);

    const notifications = await db.notification.findMany({ where: { userId: driver.id } });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]!.type).toBe("TRIP_OFFERED");

    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: booking.id } });
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]!.actorId).toBe(coordinator.id);
  });

  it("refuses to assign an inactive driver", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co2@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driver = await db.appUser.create({ data: { email: "d2@example.com", name: "Driver", passwordHash: "x", role: "DRIVER", active: false } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-10", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: coordinator.id as string, role: "COORDINATOR" });
    const result = await assignDriver({ ok: true }, fd({ bookingId: booking.id as string, driverId: driver.id as string }));
    expect(result.ok).toBe(false);
  });
});
