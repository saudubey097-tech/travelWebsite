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

const { listAllBookings, getAdminSummary } = await import("@/lib/actions/admin");

// Scenario 6: Admin can view all bookings; Customer/Driver cannot reach
// admin-only server actions at all (every admin action starts with
// requireRole("ADMIN"), so this is the same guard every /admin page and
// action goes through).
describe("admin-only actions", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("lets an admin list all bookings across every customer", async () => {
    const db = fakeDb.current!;
    const customerA = await db.appUser.create({ data: { email: "a@example.com", name: "A", passwordHash: "x", role: "CUSTOMER" } });
    const customerB = await db.appUser.create({ data: { email: "b@example.com", name: "B", passwordHash: "x", role: "CUSTOMER" } });
    await db.bookingRequest.create({
      data: { reference: "SB-11", customerId: customerA.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 1 },
    });
    await db.bookingRequest.create({
      data: { reference: "SB-12", customerId: customerB.id, serviceType: "HOURLY", status: "SUBMITTED", travelDate: new Date(), paxCount: 1 },
    });

    session.current = makeUser({ id: "admin1", role: "ADMIN" });
    const all = await listAllBookings({});
    expect(all.bookings).toHaveLength(2);
    expect(all.total).toBe(2);
  });

  it("blocks a customer from admin actions", async () => {
    session.current = makeUser({ id: "cust1", role: "CUSTOMER" });
    await expect(listAllBookings({})).rejects.toThrow(/FORBIDDEN/);
    await expect(getAdminSummary()).rejects.toThrow(/FORBIDDEN/);
  });

  it("blocks a driver from admin actions", async () => {
    session.current = makeUser({ id: "drv1", role: "DRIVER" });
    await expect(listAllBookings({})).rejects.toThrow(/FORBIDDEN/);
  });

  it("blocks an unauthenticated visitor entirely", async () => {
    session.current = null;
    await expect(listAllBookings({})).rejects.toThrow(/UNAUTHENTICATED/);
  });
});
