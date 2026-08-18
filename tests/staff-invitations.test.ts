import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeDb } from "./fakeDb";
import { makeUser } from "./testUser";
import { expectRedirect } from "./helpers";

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
  createSession: async () => {},
}));

const { inviteStaff, acceptInvitation, getInvitationPreview, revokeInvitation } = await import("@/lib/actions/invitations");
const { getTestSentEmails, resetTestEmails } = await import("@/lib/email/adapter");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

function extractToken(text: string): string {
  const match = text.match(/\/invite\/([^\s]+)/);
  if (!match) throw new Error("No invite link found in email");
  return match[1]!;
}

describe("staff invitation flow", () => {
  beforeEach(() => {
    fakeDb.current = createFakeDb();
    session.current = null;
    resetTestEmails();
  });

  it("an admin invites a driver, and accepting creates the account with the right role and profile — no admin-chosen password involved", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });

    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });
    const inviteResult = await inviteStaff(
      { ok: true },
      fd({ name: "New Driver", email: "driver@example.com", role: "DRIVER", vehicleClass: "VAN", vehicleCapacity: "8" })
    );
    expect(inviteResult.ok).toBe(true);

    const sent = getTestSentEmails();
    expect(sent).toHaveLength(1);
    const token = extractToken(sent[0]!.text);

    const preview = await getInvitationPreview(token);
    expect(preview).toEqual({ email: "driver@example.com", name: "New Driver", role: "DRIVER" });

    session.current = null; // acceptInvitation is public, unauthenticated
    await expectRedirect(
      acceptInvitation({ ok: true }, fd({ token, password: "Str0ng-Passw0rd-Here!" })),
      "/driver"
    );

    const created = await db.appUser.findUnique({ where: { email: "driver@example.com" } });
    expect(created?.role).toBe("DRIVER");
    expect(created?.vehicleClass).toBe("VAN");
    expect(created?.vehicleCapacity).toBe(8);
    expect(created?.emailVerifiedAt).not.toBeNull();

    // The token is single-use.
    const secondAttempt = await acceptInvitation({ ok: true }, fd({ token, password: "Another-Str0ng-Pass!" }));
    expect(secondAttempt.ok).toBe(false);
  });

  it("rejects accepting with an unknown token", async () => {
    session.current = null;
    const result = await acceptInvitation({ ok: true }, fd({ token: "not-a-real-token", password: "Some-Strong-Passw0rd!" }));
    expect(result.ok).toBe(false);
  });

  it("an admin can revoke a pending invitation", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin2@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });
    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });

    await inviteStaff({ ok: true }, fd({ name: "Some Coordinator", email: "coord@example.com", role: "COORDINATOR" }));
    const invitations = await db.staffInvitationToken.findMany({ where: { email: "coord@example.com" } });
    const invitationId = invitations[0]!.id as string;

    const revokeResult = await revokeInvitation({ ok: true }, fd({ invitationId }));
    expect(revokeResult.ok).toBe(true);

    const preview = await getInvitationPreview("irrelevant-since-revoked");
    expect(preview).toBeNull();

    const refreshed = await db.staffInvitationToken.findUnique({ where: { id: invitationId } });
    expect(refreshed?.revokedAt).not.toBeNull();
  });

  it("refuses a second invitation while one is already pending for the same email", async () => {
    const db = fakeDb.current!;
    const admin = await db.appUser.create({ data: { email: "admin3@example.com", name: "Admin", passwordHash: "x", role: "ADMIN" } });
    session.current = makeUser({ id: admin.id as string, role: "ADMIN" });

    const first = await inviteStaff({ ok: true }, fd({ name: "Dup Coordinator", email: "dup@example.com", role: "COORDINATOR" }));
    expect(first.ok).toBe(true);
    const second = await inviteStaff({ ok: true }, fd({ name: "Dup Coordinator", email: "dup@example.com", role: "COORDINATOR" }));
    expect(second.ok).toBe(false);
  });
});
