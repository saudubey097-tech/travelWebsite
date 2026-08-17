import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { listMyNotifications } from "@/lib/actions/notifications";
import { NotificationBell } from "@/components/workflow/NotificationBell";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("DRIVER", "ADMIN").catch(() => null);
  if (!user) redirect("/login?next=/driver");
  const notifications = await listMyNotifications();

  return (
    <div className="container-edit py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-gold">Driver</span>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Your trips</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initial={notifications} />
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
