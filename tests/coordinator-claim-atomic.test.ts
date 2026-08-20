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

const { claimBooking } = await import("@/lib/actions/coordinator");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

// Scenario: claiming is atomic — two coordinators racing to claim the same
// unclaimed booking can't both succeed.
describe("claimBooking — atomic, prevents double-claiming", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("lets the first coordinator claim, and rejects a second coordinator's claim", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordA = await db.appUser.create({ data: { email: "a@example.com", name: "Coordinator A", passwordHash: "x", role: "COORDINATOR" } });
    const coordB = await db.appUser.create({ data: { email: "b@example.com", name: "Coordinator B", passwordHash: "x", role: "COORDINATOR" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-40", customerId: customer.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: coordA.id as string, role: "COORDINATOR" });
    const first = await claimBooking({ ok: true }, fd({ bookingId: booking.id as string }));
    expect(first.ok).toBe(true);

    session.current = makeUser({ id: coordB.id as string, role: "COORDINATOR" });
    const second = await claimBooking({ ok: true }, fd({ bookingId: booking.id as string }));
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already claimed/i);

    const refreshed = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(refreshed?.coordinatorId).toBe(coordA.id);

    // The claim was recorded as an audit event with a descriptive eventType.
    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: booking.id } });
    const claimEvent = events.find((e) => e.eventType === "BOOKING_CLAIMED");
    expect(claimEvent).toBeDefined();
    expect(claimEvent?.actorId).toBe(coordA.id);
  });

  it("is idempotent for the coordinator who already holds the claim", async () => {
    const db = fakeDb.current!;
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const coordA = await db.appUser.create({ data: { email: "a2@example.com", name: "Coordinator A", passwordHash: "x", role: "COORDINATOR" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-41", customerId: customer.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: coordA.id as string, role: "COORDINATOR" });
    const first = await claimBooking({ ok: true }, fd({ bookingId: booking.id as string }));
    expect(first.ok).toBe(true);
    const again = await claimBooking({ ok: true }, fd({ bookingId: booking.id as string }));
    expect(again.ok).toBe(true);
  });
});
