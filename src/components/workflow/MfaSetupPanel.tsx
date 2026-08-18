"use client";

import { useState, useTransition, useEffect } from "react";
import { useActionState } from "react";
import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { startMfaEnrollment, confirmMfaEnrollment, disableMfa, regenerateRecoveryCodes } from "@/lib/actions/mfa";
import type { ActionResult } from "@/lib/actions/auth";

const initialConfirmState: ActionResult & { recoveryCodes?: string[] } = { ok: true };

export function MfaSetupPanel({ enabled }: { enabled: boolean }) {
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | undefined>();
  const [startPending, startTransitionFn] = useTransition();
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMfaEnrollment, initialConfirmState);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePending, startDisableTransition] = useTransition();
  const [regenPending, startRegenTransition] = useTransition();
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (confirmState.recoveryCodes) setRecoveryCodes(confirmState.recoveryCodes);
  }, [confirmState.recoveryCodes]);

  if (enabled && !recoveryCodes) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-pine">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Two-factor authentication is on
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={regenPending}
            onClick={() =>
              startRegenTransition(async () => {
                const result = await regenerateRecoveryCodes();
                if (result.ok && result.recoveryCodes) setRegenCodes(result.recoveryCodes);
              })
            }
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            {regenPending ? "Generating…" : "Regenerate recovery codes"}
          </Button>
          <ConfirmDialog
            triggerLabel="Turn off two-factor authentication"
            triggerClassName="rounded-sm border border-red-300 px-3.5 py-1.5 font-body text-xs text-red-700 hover:bg-red-50"
            title="Turn off two-factor authentication?"
            description="Your account will only require a password to sign in."
            confirmLabel="Turn off"
            destructive
            pending={disablePending}
            onConfirm={() => startDisableTransition(() => { disableMfa(); })}
          />
        </div>
        {regenCodes && <RecoveryCodesBlock codes={regenCodes} />}
      </Card>
    );
  }

  if (recoveryCodes) {
    return (
      <Card className="p-5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-pine">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Two-factor authentication is now on
        </span>
        <RecoveryCodesBlock codes={recoveryCodes} />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink/45">
        <ShieldOff className="h-4 w-4" aria-hidden />
        Two-factor authentication is off
      </span>
      <p className="mt-2 font-body text-sm text-ink/65">
        Admin accounts can require a code from an authenticator app in addition to your password.
      </p>

      {!otpauthUrl ? (
        <>
          <Button
            type="button"
            size="sm"
            disabled={startPending}
            className="mt-3"
            onClick={() =>
              startTransitionFn(async () => {
                setStartError(undefined);
                const result = await startMfaEnrollment();
                if ("otpauthUrl" in result) setOtpauthUrl(result.otpauthUrl);
                else setStartError(result.error);
              })
            }
          >
            {startPending ? "Starting…" : "Set up two-factor authentication"}
          </Button>
          {startError && <p className="mt-2 font-body text-sm text-red-700">{startError}</p>}
        </>
      ) : (
        <form action={confirmAction} className="mt-4 grid gap-3">
          <p className="font-body text-sm text-ink/70">
            Scan this into your authenticator app (Google Authenticator, 1Password, Authy, etc.), or enter the setup key manually:
          </p>
          <div className="rounded-sm border border-line bg-sand/50 p-3 font-mono text-xs text-ink break-all">{otpauthUrl}</div>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase text-ink/50">6-digit code</span>
            <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required className="input max-w-[10rem]" />
          </label>
          {confirmState.error && <p className="font-body text-sm text-red-700">{confirmState.error}</p>}
          <Button type="submit" size="sm" disabled={confirmPending} className="w-fit">
            {confirmPending ? "Verifying…" : "Confirm and enable"}
          </Button>
        </form>
      )}
    </Card>
  );
}

function RecoveryCodesBlock({ codes }: { codes: string[] }) {
  return (
    <div className="mt-4 rounded-sm border border-gold/30 bg-gold/10 p-4">
      <p className="font-body text-sm font-medium text-ink">Save these recovery codes now</p>
      <p className="mt-1 font-body text-xs text-ink/60">
        Each one can be used once if you lose access to your authenticator app. They won&apos;t be shown again.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-ink">
        {codes.map((code) => (
          <span key={code} className="rounded-sm bg-paper px-2 py-1">
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}
