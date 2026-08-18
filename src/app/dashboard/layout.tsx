import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyNotifications } from "@/lib/actions/notifications";
import { NotificationBell } from "@/components/workflow/NotificationBell";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationGate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CUSTOMER").catch(() => null);
  if (!user) redirect("/login?next=/dashboard");
  if (user.mustChangePassword) redirect("/account/change-password");
  const notifications = await listMyNotifications();

  return (
    <div className="container-edit py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-gold">My account</span>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initial={notifications} />
          <Link href="/account/security" className="font-body text-sm text-ink/60 hover:text-ink">
            Security
          </Link>
          <SignOutButton />
        </div>
      </div>
      {!user.emailVerifiedAt && <EmailVerificationBanner />}
      {children}
    </div>
  );
}
