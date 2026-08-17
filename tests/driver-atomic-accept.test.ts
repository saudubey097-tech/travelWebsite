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

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// Scenario 3: driver acceptance is atomic — once accepted, no other driver
// can claim the same trip.
describe("respondToAssignment — atomic acceptance", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("lets the first driver accept, and rejects a second driver's acceptance for the same booking", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverA = await db.appUser.create({ data: { email: "a@example.com", name: "Driver A", passwordHash: "x", role: "DRIVER" } });
    const driverB = await db.appUser.create({ data: { email: "b@example.com", name: "Driver B", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-5", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    const offerA = await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverA.id, offeredById: coordinator.id, status: "OFFERED" },
    });
    const offerB = await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverB.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driverA.id as string, role: "DRIVER" });
    const resultA = await respondToAssignment({ ok: true }, fd({ assignmentId: offerA.id as string, decision: "ACCEPT" }));
    expect(resultA.ok).toBe(true);

    // By now driver B's own OFFERED assignment has already been withdrawn
    // as a side effect of driver A's acceptance, so this sequential retry
    // is caught by the early "already responded to" guard rather than the
    // deep transactional one below — both are correct, layered defenses.
    session.current = makeUser({ id: driverB.id as string, role: "DRIVER" });
    const resultB = await respondToAssignment({ ok: true }, fd({ assignmentId: offerB.id as string, decision: "ACCEPT" }));
    expect(resultB.ok).toBe(false);

    // Exactly one ACCEPTED assignment exists for this booking.
    const assignments = await db.bookingAssignment.findMany({ where: { bookingRequestId: booking.id } });
    const accepted = assignments.filter((a) => a.status === "ACCEPTED");
    expect(accepted).toHaveLength(1);
    expect(accepted[0]!.driverId).toBe(driverA.id);

    const refreshedBooking = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(refreshedBooking?.status).toBe("ACCEPTED");
  });

  it("rejects a driver accepting the same offer twice", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co2@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverA = await db.appUser.create({ data: { email: "a2@example.com", name: "Driver A", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-6", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    const offer = await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverA.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    session.current = makeUser({ id: driverA.id as string, role: "DRIVER" });
    const first = await respondToAssignment({ ok: true }, fd({ assignmentId: offer.id as string, decision: "ACCEPT" }));
    expect(first.ok).toBe(true);

    const second = await respondToAssignment({ ok: true }, fd({ assignmentId: offer.id as string, decision: "ACCEPT" }));
    expect(second.ok).toBe(false);
  });

  it("rejects at the deep transactional guard when the booking was claimed concurrently", async () => {
    // Simulates a genuine race: two OFFERED assignments exist, and — before
    // this driver's accept transaction runs — some other transaction has
    // already flipped the booking's status away from PENDING_ASSIGNMENT
    // (as driver A's real acceptance would, mid-flight). Driver B's own
    // assignment row is still OFFERED, so this exercises the conditional
    // updateMany guard on bookingRequest.status directly, not the cheaper
    // "already responded to" early-exit.
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c3@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co3@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driverB = await db.appUser.create({ data: { email: "b3@example.com", name: "Driver B", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-7A", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });
    const offerB = await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driverB.id, offeredById: coordinator.id, status: "OFFERED" },
    });

    // Simulate the concurrent commit landing first.
    await db.bookingRequest.update({ where: { id: booking.id }, data: { status: "ACCEPTED" } });

    session.current = makeUser({ id: driverB.id as string, role: "DRIVER" });
    const result = await respondToAssignment({ ok: true }, fd({ assignmentId: offerB.id as string, decision: "ACCEPT" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/already claimed/i);

    // Driver B's assignment must not have been silently accepted.
    const refreshed = await db.bookingAssignment.findFirst({ where: { id: offerB.id } });
    expect(refreshed?.status).toBe("OFFERED");
  });
});
