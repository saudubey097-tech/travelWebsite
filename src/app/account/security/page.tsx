import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { listMySessions } from "@/lib/actions/security";
import { SessionsList } from "@/components/workflow/SessionsList";
import { ChangePasswordForm } from "@/components/workflow/ChangePasswordForm";
import { MfaSetupPanel } from "@/components/workflow/MfaSetupPanel";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Account & security", robots: { index: false } };

export default async function AccountSecurityPage() {
  const [user, sessions] = await Promise.all([requireUser(), listMySessions()]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Change password</span>
        <div className="mt-3">
          <ChangePasswordForm />
        </div>
      </Card>

      <SessionsList sessions={sessions} currentSessionId={user.sessionId} />

      {user.role === "ADMIN" && (
        <div className="lg:col-span-2">
          <MfaSetupPanel enabled={user.mfaEnabled} />
        </div>
      )}
    </div>
  );
}
