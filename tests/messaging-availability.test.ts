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

const { sendCustomerMessage } = await import("@/lib/actions/customer");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// Scenario 4: customer messaging becomes available only after a driver has
// accepted the assignment (and the trip is in a messageable status).
describe("sendCustomerMessage — gated on driver acceptance", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("blocks messaging before a driver has accepted", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-7", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: customer.id as string, role: "CUSTOMER" });
    const result = await sendCustomerMessage({ ok: true }, fd({ bookingId: booking.id as string, body: "Hello?" }));
    expect(result.ok).toBe(false);

    const messages = await db.bookingMessage.findMany({ where: { bookingRequestId: booking.id } });
    expect(messages).toHaveLength(0);
  });

  it("allows messaging once a driver has accepted and the trip is in communication", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordinator = await db.appUser.create({ data: { email: "co@example.com", name: "Coordinator", passwordHash: "x", role: "COORDINATOR" } });
    const driver = await db.appUser.create({ data: { email: "d@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-8", customerId: customer.id, serviceType: "TRANSFER", status: "IN_COMMUNICATION", travelDate: new Date(), paxCount: 2 },
    });
    await db.bookingAssignment.create({
      data: { bookingRequestId: booking.id, driverId: driver.id, offeredById: coordinator.id, status: "ACCEPTED" },
    });

    session.current = makeUser({ id: customer.id as string, role: "CUSTOMER" });
    const result = await sendCustomerMessage({ ok: true }, fd({ bookingId: booking.id as string, body: "Hello!" }));
    expect(result.ok).toBe(true);

    const messages = await db.bookingMessage.findMany({ where: { bookingRequestId: booking.id } });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.visibility).toBe("CUSTOMER_VISIBLE");
  });
});
