"use client";

import { useTransition } from "react";
import { revokeInvitation } from "@/lib/actions/invitations";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNZDate } from "@/lib/format";

export interface PendingInvitation {
  id: string;
  name: string;
  email: string;
  role: string;
  expiresAt: Date | string;
  invitedBy: { name: string };
}

export function PendingInvitationsList({ invitations }: { invitations: PendingInvitation[] }) {
  const [pending, startTransition] = useTransition();

  if (invitations.length === 0) return null;

  return (
    <Card className="p-5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Pending invitations</span>
      <ul className="mt-3 space-y-2.5">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-sm text-ink">
                {inv.name} <span className="text-ink/45">— {inv.email}</span>
              </p>
              <p className="font-mono text-[10px] uppercase text-ink/35">
                Invited by {inv.invitedBy.name} · Expires {formatNZDate(inv.expiresAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="gold">{inv.role}</Badge>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("invitationId", inv.id);
                  startTransition(() => {
                    revokeInvitation({ ok: true }, fd);
                  });
                }}
                className="font-body text-xs text-red-700 underline disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
