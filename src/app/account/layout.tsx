import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { homeRouteForRole } from "@/lib/auth/routing";
import Link from "next/link";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login?next=/account/security");

  return (
    <div className="container-edit py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href={homeRouteForRole(user.role)} className="font-mono text-[11px] uppercase tracking-wide text-gold hover:underline">
            ← Back
          </Link>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Account &amp; security</h1>
        </div>
        <SignOutButton />
      </div>
      {children}
    </div>
  );
}
