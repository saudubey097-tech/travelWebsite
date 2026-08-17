import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyNotifications } from "@/lib/actions/notifications";
import { NotificationBell } from "@/components/workflow/NotificationBell";
import { SignOutButton } from "@/components/auth/SignOutButton";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "All bookings" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) redirect("/login?next=/admin");
  const notifications = await listMyNotifications();

  return (
    <div className="container-edit py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-gold">Admin</span>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Control centre</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initial={notifications} />
          <SignOutButton />
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-1 border-b border-line pb-3">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-sm px-3 py-1.5 font-body text-sm text-ink/65 transition-colors hover:bg-sand hover:text-ink">
            {l.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
