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

const { getMyTrip } = await import("@/lib/actions/driver");

// Scenario 2: a driver cannot access another driver's assignment, even by
// editing the URL/id directly.
describe("getMyTrip (IDOR)", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("returns the trip for the assigned driver", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverA = await db.appUser.create({ data: { email: "a@example.com", name: "Driver A", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-3", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverA.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driverA.id as string, role: "DRIVER" });
    const result = await getMyTrip(booking.id as string);
    expect(result?.booking.id).toBe(booking.id);
  });

  it("returns null for a trip assigned to a different driver", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverA = await db.appUser.create({ data: { email: "a@example.com", name: "Driver A", passwordHash: "x", role: "DRIVER" } });
    const driverB = await db.appUser.create({ data: { email: "b@example.com", name: "Driver B", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-4", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverA.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driverB.id as string, role: "DRIVER" });
    const result = await getMyTrip(booking.id as string);
    expect(result).toBeNull();
  });
});
