import { Badge } from "@/components/ui/Badge";
import type { AssignmentStatus } from "@prisma/client";

export interface AssignmentHistoryItem {
  id: string;
  status: AssignmentStatus;
  driver: { name: string };
  offeredBy?: { name: string } | null;
  declineReason?: string | null;
  offeredAt: Date | string;
}

const TONE: Record<AssignmentStatus, "paper" | "pine" | "gold" | "ink"> = {
  OFFERED: "gold",
  ACCEPTED: "pine",
  DECLINED: "paper",
  REVOKED: "paper",
};

export function AssignmentHistory({ assignments }: { assignments: AssignmentHistoryItem[] }) {
  if (assignments.length === 0) {
    return <p className="font-body text-sm text-ink/45">No driver has been offered this trip yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {assignments.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-3 font-body text-sm">
          <div>
            <span className="text-ink/80">{a.driver.name}</span>
            {a.offeredBy && <span className="text-ink/40"> — offered by {a.offeredBy.name}</span>}
            {a.declineReason && <p className="mt-0.5 text-xs text-ink/50">Declined: {a.declineReason}</p>}
          </div>
          <Badge tone={TONE[a.status]}>{a.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
