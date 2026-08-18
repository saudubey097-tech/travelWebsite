import type { Metadata } from "next";
import Link from "next/link";
import { listUsers } from "@/lib/actions/admin";
import { listPendingInvitations } from "@/lib/actions/invitations";
import { requireRole } from "@/lib/auth/session";
import { InviteStaffForm } from "@/components/workflow/InviteStaffForm";
import { PendingInvitationsList } from "@/components/workflow/PendingInvitationsList";
import { UserRow } from "@/components/workflow/UserRow";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

const TABS: { key: Role; label: string }[] = [
  { key: "CUSTOMER", label: "Customers" },
  { key: "COORDINATOR", label: "Coordinators" },
  { key: "DRIVER", label: "Drivers" },
  { key: "ADMIN", label: "Admins" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const activeTab = (TABS.find((t) => t.key === sp.role)?.key ?? "CUSTOMER") as Role;

  const [me, users, pendingInvitations] = await Promise.all([
    requireRole("ADMIN"),
    listUsers(),
    listPendingInvitations(),
  ]);

  const term = (sp.q ?? "").trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      u.role === activeTab &&
      (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
  );

  return (
    <div className="space-y-8">
      <InviteStaffForm />
      <PendingInvitationsList
        invitations={pendingInvitations.map((inv) => ({
          id: inv.id,
          name: inv.name,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
          invitedBy: inv.invitedBy,
        }))}
      />

      <div>
        <nav className="mb-4 flex flex-wrap gap-1 border-b border-line pb-3">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/users?role=${t.key}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}
              className={`rounded-sm px-3 py-1.5 font-body text-sm transition-colors ${
                activeTab === t.key ? "bg-sand text-ink" : "text-ink/60 hover:bg-sand/60"
              }`}
            >
              {t.label} ({users.filter((u) => u.role === t.key).length})
            </Link>
          ))}
        </nav>

        <form method="get" className="mb-4 flex gap-2">
          <input type="hidden" name="role" value={activeTab} />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search by name or email…"
            className="input max-w-sm"
          />
          <button type="submit" className="rounded-sm bg-pine px-4 py-2.5 font-body text-sm text-paper">
            Search
          </button>
        </form>

        {filtered.length === 0 ? (
          <EmptyState title="No users in this tab yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wide text-ink/45">
                  <th className="pb-2 pr-4 font-normal">Name</th>
                  <th className="pb-2 pr-4 font-normal">Email</th>
                  <th className="pb-2 pr-4 font-normal">Role</th>
                  <th className="pb-2 pr-4 font-normal">Status</th>
                  <th className="pb-2 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} isSelf={u.id === me.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
