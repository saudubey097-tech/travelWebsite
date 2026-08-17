import type { Metadata } from "next";
import { listUsers } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { CreateStaffUserForm } from "@/components/workflow/CreateStaffUserForm";
import { UserRow } from "@/components/workflow/UserRow";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

export default async function AdminUsersPage() {
  const [me, users] = await Promise.all([requireRole("ADMIN"), listUsers()]);

  return (
    <div className="space-y-8">
      <CreateStaffUserForm />

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
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === me.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
