import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeDb } from "./fakeDb";

const fakeDb = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakeDb> | null }));
vi.mock("@/lib/db", () => ({ get db() { return fakeDb.current; } }));

const { checkLoginLockout } = await import("@/lib/auth/rate-limit");

describe("checkLoginLockout", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
  });

  it("does not lock out an email with no failures", async () => {
    const result = await checkLoginLockout("nobody@example.com");
    expect(result.locked).toBe(false);
    expect(result.attempts).toBe(0);
  });

  it("locks out after 5 recent failed attempts for the same email", async () => {
    const db = fakeDb.current!;
    for (let i = 0; i < 5; i++) {
      await db.securityEvent.create({ data: { email: "victim@example.com", type: "SIGN_IN_FAILED" } });
    }
    const result = await checkLoginLockout("victim@example.com");
    expect(result.locked).toBe(true);
    expect(result.attempts).toBe(5);
  });

  it("does not lock out a different email", async () => {
    const db = fakeDb.current!;
    for (let i = 0; i < 5; i++) {
      await db.securityEvent.create({ data: { email: "victim@example.com", type: "SIGN_IN_FAILED" } });
    }
    const result = await checkLoginLockout("someone-else@example.com");
    expect(result.locked).toBe(false);
  });

  it("does not count failures outside the lockout window", async () => {
    const db = fakeDb.current!;
    const old = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago, window is 15
    for (let i = 0; i < 5; i++) {
      const row = await db.securityEvent.create({ data: { email: "stale@example.com", type: "SIGN_IN_FAILED" } });
      await db.securityEvent.update({ where: { id: row.id }, data: { createdAt: old } });
    }
    const result = await checkLoginLockout("stale@example.com");
    expect(result.locked).toBe(false);
  });
});
