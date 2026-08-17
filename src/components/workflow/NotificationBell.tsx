"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: Date | string;
}

export function NotificationBell({ initial }: { initial: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-sm text-ink/70 transition-colors hover:bg-sand"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-mono text-[9px] text-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-md border border-line bg-paper shadow-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-sm text-ink">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                    startTransition(() => {
                      markAllNotificationsRead();
                    });
                  }}
                  className="font-body text-xs text-pine hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-6 text-center font-body text-sm text-ink/45">Nothing yet.</p>
              )}
              {items.map((n) => (
                <a
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    if (!n.read) {
                      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                      startTransition(() => {
                        markNotificationRead(n.id);
                      });
                    }
                  }}
                  className={`block border-b border-line/70 px-4 py-3 last:border-0 hover:bg-sand/40 ${
                    n.read ? "" : "bg-gold/5"
                  }`}
                >
                  <p className="font-body text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 font-body text-xs text-ink/60">{n.body}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink/35">
                    {new Date(n.createdAt).toLocaleString("en-NZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Pacific/Auckland" })}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
