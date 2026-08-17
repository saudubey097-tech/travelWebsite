import { CheckCircle2 } from "lucide-react";
import { statusLabel } from "@/components/workflow/StatusBadge";
import type { BookingStatus } from "@prisma/client";

export interface TimelineEvent {
  id: string;
  newStatus: BookingStatus;
  createdAt: Date | string;
  actor?: { name: string; role: string } | null;
}

/** Understandable, plain-language trip timeline — used on customer, coordinator, and admin views. */
export function Timeline({ events, dense = false }: { events: TimelineEvent[]; dense?: boolean }) {
  if (events.length === 0) {
    return <p className="font-body text-sm text-ink/50">No activity yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px bg-line" aria-hidden />
          )}
          <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold" aria-hidden />
          <div>
            <p className="font-body text-sm font-medium text-ink">{statusLabel(event.newStatus)}</p>
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
              {new Date(event.createdAt).toLocaleString("en-NZ", {
                dateStyle: "medium",
                timeStyle: dense ? undefined : "short",
                timeZone: "Pacific/Auckland",
              })}
              {event.actor ? ` · ${event.actor.name}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
