import { notFound } from "next/navigation";
import { Mail, Phone, Calendar } from "lucide-react";
import { getUserProfile, listUserAuditHistory } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DriverProfileForm } from "@/components/workflow/DriverProfileForm";
import { UserRow } from "@/components/workflow/UserRow";
import { formatNZDate, formatNZDateTime } from "@/lib/format";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireRole("ADMIN");
  const [profile, auditHistory] = await Promise.all([getUserProfile(id), listUserAuditHistory(id)]);
  if (!profile) notFound();
  const { user, bookingCount, assignmentCount } = profile;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{user.name}</h2>
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40">{user.role}</p>
          </div>
          <Badge tone={user.active ? "pine" : "paper"}>{user.active ? "Active" : "Deactivated"}</Badge>
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-ink/75">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gold" aria-hidden />
              {user.email}
            </span>
            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden />
              Joined {formatNZDate(user.createdAt)}
            </span>
          </div>
          <div className="mt-3 flex gap-6 border-t border-line pt-3 font-body text-sm">
            {user.role === "CUSTOMER" && (
              <span>
                <span className="block font-mono text-[11px] uppercase text-ink/40">Bookings</span>
                {bookingCount}
              </span>
            )}
            {user.role === "DRIVER" && (
              <span>
                <span className="block font-mono text-[11px] uppercase text-ink/40">Assignments</span>
                {assignmentCount}
              </span>
            )}
          </div>
        </Card>

        {user.role === "DRIVER" && (
          <Card className="p-5">
            <span className="mb-3 block font-mono text-[11px] uppercase tracking-wide text-ink/45">
              Driver profile
            </span>
            <DriverProfileForm
              userId={user.id}
              driverLicenseNo={user.driverLicenseNo}
              vehicleClass={user.vehicleClass}
              vehicleCapacity={user.vehicleCapacity}
              vehicleDescription={user.vehicleDescription}
              driverAvailable={user.driverAvailable}
            />
          </Card>
        )}

        <Card className="p-5">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-wide text-ink/45">
            Role & status
          </span>
          <table className="w-full text-left">
            <tbody>
              <UserRow user={user} isSelf={user.id === admin.id} />
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <Card className="p-5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">Account audit history</span>
          {auditHistory.length === 0 ? (
            <p className="mt-2 font-body text-sm text-ink/45">No account changes recorded.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {auditHistory.map((entry) => (
                <li key={entry.id} className="border-b border-line/70 pb-2 last:border-0">
                  <p className="font-body text-sm text-ink/80">
                    {entry.action.replace(/_/g, " ")}
                    {entry.previousValue && entry.newValue ? ` — ${entry.previousValue} → ${entry.newValue}` : ""}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-ink/35">
                    {formatNZDateTime(entry.createdAt)} · {entry.actor.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
