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

const { setUserActive, correctBookingStatus, overrideAssignment } = await import("@/lib/actions/admin");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("last active admin protection", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("refuses to deactivate the only active admin", async () => {
    const db = fakeDb.current!;
    const admin1 = await db.appUser.create({ data: { email: "a1@example.com", name: "Admin 1", passwordHash: "x", role: "ADMIN", active: true } });
    const admin2 = await db.appUser.create({ data: { email: "a2@example.com", name: "Admin 2", passwordHash: "x", role: "ADMIN", active: true } });

    session.current = makeUser({ id: admin1.id as string, role: "ADMIN" });
    // Deactivate admin2 first — should succeed, one admin remains.
    const first = await setUserActive({ ok: true }, fd({ userId: admin2.id as string, active: "false" }));
    expect(first.ok).toBe(true);

    // Now try to deactivate admin2 again (no-op) then simulate trying to
    // remove the last one via a second admin account.
    session.current = makeUser({ id: admin2.id as string, role: "ADMIN" });
    const last = await setUserActive({ ok: true }, fd({ userId: admin1.id as string, active: "false" }));
    expect(last.ok).toBe(false);
    expect(last.error).toMatch(/last active admin/i);
  });
});

describe("admin status correction is a bypass, always audited", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("force-moves a booking status and records an override event with the reason", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });
    const customer = await db.appUser.create({ data: { email: "c@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-30", customerId: customer.id, serviceType: "TRANSFER", status: "SUBMITTED", travelDate: new Date(), paxCount: 1 },
    });

    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });
    // Force straight to SCHEDULED, which is not a normally-allowed transition from SUBMITTED.
    const result = await correctBookingStatus(
      { ok: true },
      fd({ bookingId: booking.id as string, newStatus: "SCHEDULED", reason: "Manual correction after phone call" })
    );
    expect(result.ok).toBe(true);

    const updated = await db.bookingRequest.findUnique({ where: { id: booking.id } });
    expect(updated?.status).toBe("SCHEDULED");

    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: booking.id } });
    const overrideEvent = events.find((e) => (e.context as Record<string, unknown>)?.override === true);
    expect(overrideEvent).toBeDefined();
    expect((overrideEvent?.context as Record<string, unknown>)?.reason).toBe("Manual correction after phone call");
  });

  it("rejects a customer attempting the same action", async () => {
    session.current = makeUser({ id: "cust1", role: "CUSTOMER" });
    await expect(
      correctBookingStatus({ ok: true }, fd({ bookingId: "any", newStatus: "COMPLETED", reason: "nope" }))
    ).rejects.toThrow(/FORBIDDEN/);
  });
});

describe("overrideAssignment requires a mandatory reason", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("rejects an override submitted without a reason", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin2@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });
    const customer = await db.appUser.create({ data: { email: "c2@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const driver = await db.appUser.create({ data: { email: "d2@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-31", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 1 },
    });

    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });
    const result = await overrideAssignment({ ok: true }, fd({ bookingId: booking.id as string, driverId: driver.id as string, reason: "" }));
    expect(result.ok).toBe(false);

    const assignments = await db.bookingAssignment.findMany({ where: { bookingRequestId: booking.id } });
    expect(assignments).toHaveLength(0);
  });

  it("accepts an override with a reason and records it as an audited event", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin3@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });
    const customer = await db.appUser.create({ data: { email: "c3@example.com", name: "Customer", passwordHash: "x", role: "CUSTOMER" } });
    const driver = await db.appUser.create({ data: { email: "d3@example.com", name: "Driver", passwordHash: "x", role: "DRIVER" } });
    const booking = await db.bookingRequest.create({
      data: { reference: "SB-32", customerId: customer.id, serviceType: "TRANSFER", status: "PENDING_ASSIGNMENT", travelDate: new Date(), paxCount: 1 },
    });

    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });
    const result = await overrideAssignment(
      { ok: true },
      fd({ bookingId: booking.id as string, driverId: driver.id as string, reason: "Coordinator unavailable, driver confirmed by phone" })
    );
    expect(result.ok).toBe(true);

    const events = await db.bookingEvent.findMany({ where: { bookingRequestId: booking.id } });
    const overrideEvent = events.find((e) => (e.context as Record<string, unknown>)?.override === true);
    expect(overrideEvent).toBeDefined();
    expect((overrideEvent?.context as Record<string, unknown>)?.reason).toBe("Coordinator unavailable, driver confirmed by phone");
  });
});
