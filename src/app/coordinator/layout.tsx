import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listMyNotifications } from "@/lib/actions/notifications";
import { NotificationBell } from "@/components/workflow/NotificationBell";
import { SignOutButton } from "@/components/auth/SignOutButton";

const QUEUES = [
  { key: "NEW", label: "New" },
  { key: "PENDING_ASSIGNMENT", label: "Pending assignment" },
  { key: "DRIVER_DECLINED", label: "Driver declined" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("COORDINATOR", "ADMIN").catch(() => null);
  if (!user) redirect("/login?next=/coordinator");
  const notifications = await listMyNotifications();

  return (
    <div className="container-edit py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wide text-gold">Coordinator</span>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Booking queue</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initial={notifications} />
          <SignOutButton />
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-1 border-b border-line pb-3">
        {QUEUES.map((q) => (
          <Link
            key={q.key}
            href={`/coordinator?queue=${q.key}`}
            className="rounded-sm px-3 py-1.5 font-body text-sm text-ink/65 transition-colors hover:bg-sand hover:text-ink"
          >
            {q.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
