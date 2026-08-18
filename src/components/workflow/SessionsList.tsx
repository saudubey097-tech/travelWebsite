"use client";

import { useState, useTransition } from "react";
import { Laptop } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { revokeSession, revokeAllOtherSessions } from "@/lib/actions/security";
import { formatNZDateTime } from "@/lib/format";

export interface SessionItem {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastActiveAt: Date | string;
  createdAt: Date | string;
}

function describeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iphone|ipad/i.test(ua)) return "iOS device";
  if (/android/i.test(ua)) return "Android device";
  if (/macintosh/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows PC";
  return "Browser";
}

export function SessionsList({ sessions, currentSessionId }: { sessions: SessionItem[]; currentSessionId: string }) {
  const [pending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Signed-in devices</span>
        {sessions.length > 1 && (
          <ConfirmDialog
            triggerLabel="Log out all other devices"
            triggerClassName="font-body text-xs text-red-700 underline"
            title="Log out everywhere else?"
            description="This signs out every device except the one you're using right now."
            confirmLabel="Log out other devices"
            destructive
            pending={pending}
            onConfirm={() => startTransition(() => { revokeAllOtherSessions(); })}
          />
        )}
      </div>

      <ul className="mt-3 divide-y divide-line">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <Laptop className="h-4 w-4 text-gold" aria-hidden />
              <div>
                <p className="font-body text-sm text-ink">
                  {describeUserAgent(s.userAgent)}
                  {s.id === currentSessionId && <span className="ml-2 font-mono text-[10px] uppercase text-pine">This device</span>}
                </p>
                <p className="font-mono text-[10px] uppercase text-ink/40">
                  {s.ipAddress ?? "Unknown IP"} · Active {formatNZDateTime(s.lastActiveAt)}
                </p>
              </div>
            </div>
            {s.id !== currentSessionId && (
              <button
                type="button"
                disabled={pending && revokingId === s.id}
                onClick={() => {
                  setRevokingId(s.id);
                  const fd = new FormData();
                  fd.set("sessionId", s.id);
                  startTransition(() => {
                    revokeSession({ ok: true }, fd);
                  });
                }}
                className="font-body text-xs text-red-700 underline disabled:opacity-50"
              >
                Log out
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
