"use client";

import { useTransition } from "react";
import Link from "next/link";
import { setUserActive, changeUserRole } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/Badge";
import type { Role } from "@prisma/client";

export interface StaffUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export function UserRow({ user, isSelf }: { user: StaffUserRow; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-line/70">
      <td className="py-3 pr-4 font-body text-sm text-ink">
        <Link href={`/admin/users/${user.id}`} className="hover:text-pine hover:underline">
          {user.name}
        </Link>
      </td>
      <td className="py-3 pr-4 font-body text-sm text-ink/65">{user.email}</td>
      <td className="py-3 pr-4">
        {isSelf ? (
          <Badge tone="pine">{user.role}</Badge>
        ) : (
          <form
            action={(fd) => {
              startTransition(() => {
                changeUserRole({ ok: true }, fd);
              });
            }}
            className="inline"
          >
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              disabled={pending}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-sm border border-line bg-paper px-2 py-1 font-mono text-xs uppercase"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="DRIVER">Driver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </form>
        )}
      </td>
      <td className="py-3 pr-4">
        <Badge tone={user.active ? "pine" : "paper"}>{user.active ? "Active" : "Deactivated"}</Badge>
      </td>
      <td className="py-3 text-right">
        {!isSelf && (
          <form
            action={(fd) => {
              startTransition(() => {
                setUserActive({ ok: true }, fd);
              });
            }}
          >
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="active" value={(!user.active).toString()} />
            <button type="submit" disabled={pending} className="font-body text-xs text-pine underline">
              {user.active ? "Deactivate" : "Reactivate"}
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}
