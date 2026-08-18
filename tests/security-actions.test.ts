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
  SESSION_COOKIE: "sb_session",
}));

const { revokeSession, requestPasswordReset, resetPassword } = await import("@/lib/actions/security");
const { getTestSentEmails, resetTestEmails } = await import("@/lib/email/adapter");
const { expectRedirect } = await import("./helpers");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function extractToken(text: string): string {
  const match = text.match(/\/reset-password\/([^\s]+)/);
  if (!match) throw new Error("No reset link found in email");
  return match[1]!;
}

describe("revokeSession (IDOR)", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
  });

  it("refuses to revoke a session belonging to a different user", async () => {
    const db = fakeDb.current!;
    const victim = await db.appUser.create({ data: { email: "v@example.com", name: "Victim", passwordHash: "x", role: "CUSTOMER" } });
    const attacker = await db.appUser.create({ data: { email: "a@example.com", name: "Attacker", passwordHash: "x", role: "CUSTOMER" } });
    const victimSession = await db.session.create({
      data: { userId: victim.id, tokenHash: "hash1", expiresAt: new Date(Date.now() + 1000_000) },
    });

    session.current = makeUser({ id: attacker.id as string, role: "CUSTOMER" });
    const result = await revokeSession({ ok: true }, fd({ sessionId: victimSession.id as string }));
    expect(result.ok).toBe(false);

    const refreshed = await db.session.findUnique({ where: { id: victimSession.id } });
    expect(refreshed?.revokedAt).toBeFalsy();
  });

  it("lets a user revoke their own session", async () => {
    const db = fakeDb.current!;
    const user = await db.appUser.create({ data: { email: "u@example.com", name: "User", passwordHash: "x", role: "CUSTOMER" } });
    const ownSession = await db.session.create({
      data: { userId: user.id, tokenHash: "hash2", expiresAt: new Date(Date.now() + 1000_000) },
    });

    session.current = makeUser({ id: user.id as string, role: "CUSTOMER" });
    const result = await revokeSession({ ok: true }, fd({ sessionId: ownSession.id as string }));
    expect(result.ok).toBe(true);

    const refreshed = await db.session.findUnique({ where: { id: ownSession.id } });
    expect(refreshed?.revokedAt).not.toBeNull();
  });
});

describe("password reset flow", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
    resetTestEmails();
  });

  it("requests a reset, uses the token once, and revokes existing sessions", async () => {
    const db = fakeDb.current!;
    const user = await db.appUser.create({ data: { email: "reset@example.com", name: "Reset Me", passwordHash: "oldhash", role: "CUSTOMER" } });
    await db.session.create({ data: { userId: user.id, tokenHash: "livehash", expiresAt: new Date(Date.now() + 1000_000) } });

    const requestResult = await requestPasswordReset({ ok: true }, fd({ email: "reset@example.com" }));
    expect(requestResult.ok).toBe(true);

    const sent = getTestSentEmails();
    expect(sent).toHaveLength(1);
    const token = extractToken(sent[0]!.text);

    await expectRedirect(resetPassword({ ok: true }, fd({ token, password: "Br4nd-New-Passw0rd!" })), "/login");

    const updatedUser = await db.appUser.findUnique({ where: { email: "reset@example.com" } });
    expect(updatedUser?.passwordHash).not.toBe("oldhash");

    const sessions = await db.session.findMany({ where: { userId: user.id } });
    expect(sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  it("does not reveal whether an email exists", async () => {
    const result = await requestPasswordReset({ ok: true }, fd({ email: "nobody-at-all@example.com" }));
    expect(result.ok).toBe(true);
    expect(getTestSentEmails()).toHaveLength(0);
  });

  it("rejects reusing a consumed reset token", async () => {
    const db = fakeDb.current!;
    const user = await db.appUser.create({ data: { email: "reuse@example.com", name: "Reuse", passwordHash: "oldhash", role: "CUSTOMER" } });
    await requestPasswordReset({ ok: true }, fd({ email: "reuse@example.com" }));
    const token = extractToken(getTestSentEmails()[0]!.text);

    await resetPassword({ ok: true }, fd({ token, password: "First-New-Passw0rd!" })).catch(() => null);
    const secondAttempt = await resetPassword({ ok: true }, fd({ token, password: "Second-New-Passw0rd!" }));
    expect(secondAttempt.ok).toBe(false);
    void user;
  });
});
