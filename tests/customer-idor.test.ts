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

const { getMyBooking } = await import("@/lib/actions/customer");

// Scenario 1: a customer cannot access another customer's booking, even by
// editing the URL/id directly.
describe("getMyBooking (IDOR)", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("returns the booking for its own customer", async () => {
    const db = fakeDb.current!;
    const owner = await db.appUser.create({ data: { email: "owner@example.com", name: "Owner", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-1", customerId: owner.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: owner.id as string, role: "CUSTOMER" });
    const result = await getMyBooking(booking.id as string);
    expect(result?.id).toBe(booking.id);
  });

  it("returns null for a booking belonging to a different customer", async () => {
    const db = fakeDb.current!;
    const owner = await db.appUser.create({ data: { email: "owner@example.com", name: "Owner", passwordHash: "x", role: "CUSTOMER" } });
    const attacker = await db.appUser.create({ data: { email: "attacker@example.com", name: "Attacker", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-2", customerId: owner.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 2 },
    });

    session.current = makeUser({ id: attacker.id as string, role: "CUSTOMER" });
    const result = await getMyBooking(booking.id as string);
    expect(result).toBeNull();
  });
});
