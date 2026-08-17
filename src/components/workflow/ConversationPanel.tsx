"use client";

import { useActionState, useRef, useEffect } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ActionResult } from "@/lib/actions/auth";

export interface ConversationMessage {
  id: string;
  body: string;
  createdAt: Date | string;
  visibility: "CUSTOMER_VISIBLE" | "INTERNAL";
  sender: { id: string; name: string; role: string };
}

const initialState: ActionResult = { ok: true };

/**
 * Shared message thread + composer. `canSend={false}` still shows history
 * but disables the composer with an explanatory note — used for customer
 * and driver views before an assignment is accepted. Coordinators/admins
 * get an extra visibility toggle for internal-only notes.
 */
export function ConversationPanel({
  bookingId,
  messages,
  canSend,
  disabledReason,
  action,
  allowInternal = false,
  currentUserId,
}: {
  bookingId: string;
  messages: ConversationMessage[];
  canSend: boolean;
  disabledReason?: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  allowInternal?: boolean;
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <Card className="flex flex-col p-5">
      <h3 className="font-display text-lg text-ink">Messages</h3>

      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 && <p className="font-body text-sm text-ink/45">No messages yet.</p>}
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-md px-3.5 py-2.5 ${
                  m.visibility === "INTERNAL"
                    ? "border border-gold/30 bg-gold/10"
                    : mine
                      ? "bg-pine text-paper"
                      : "bg-sand/60"
                }`}
              >
                {m.visibility === "INTERNAL" && (
                  <span className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-goldDeep">
                    <Lock className="h-3 w-3" aria-hidden /> Internal note
                  </span>
                )}
                <p className={`font-body text-sm ${mine && m.visibility === "CUSTOMER_VISIBLE" ? "text-paper" : "text-ink/85"}`}>
                  {m.body}
                </p>
                <p
                  className={`mt-1 font-mono text-[10px] uppercase tracking-wide ${
                    mine && m.visibility === "CUSTOMER_VISIBLE" ? "text-paper/60" : "text-ink/40"
                  }`}
                >
                  {m.sender.name} ·{" "}
                  {new Date(m.createdAt).toLocaleString("en-NZ", { dateStyle: "short", timeStyle: "short", timeZone: "Pacific/Auckland" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {canSend ? (
        <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <input type="hidden" name="bookingId" value={bookingId} />
          <textarea
            name="body"
            rows={2}
            required
            maxLength={4000}
            placeholder="Write a message…"
            className="input resize-y"
          />
          <div className="flex items-center justify-between gap-3">
            {allowInternal ? (
              <label className="flex items-center gap-2 font-body text-xs text-ink/60">
                <input type="checkbox" name="internalOnly" value="1" className="h-3.5 w-3.5" />
                Internal note (not visible to customer)
              </label>
            ) : (
              <span className="flex items-center gap-1.5 font-body text-xs text-ink/40">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
                Visible to the customer
              </span>
            )}
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
          {state.error && <p className="font-body text-xs text-red-700">{state.error}</p>}
        </form>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 font-body text-xs text-ink/45">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {disabledReason ?? "Messaging isn't open yet."}
        </p>
      )}
    </Card>
  );
}
