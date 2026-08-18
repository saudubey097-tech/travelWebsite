import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNZDateTime } from "@/lib/format";

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date | string;
}

export function NotificationHistoryPanel({ notifications }: { notifications: NotificationHistoryItem[] }) {
  return (
    <Card className="p-5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Notification history</span>
      {notifications.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No notifications yet." />
        </div>
      ) : (
        <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id} className={n.read ? "" : "font-medium"}>
              <p className="font-body text-sm text-ink">{n.title}</p>
              <p className="font-body text-xs text-ink/55">{n.body}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/35">
                {formatNZDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
