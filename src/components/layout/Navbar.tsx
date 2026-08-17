import Link from "next/link";
import { Compass, LayoutDashboard } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrentUser } from "@/lib/auth/session";
import { homeRouteForRole } from "@/lib/auth/routing";

const NAV_LINKS = [
  { href: "/tours", label: "Day Tours" },
  { href: "/transfers", label: "Transfers" },
  { href: "/hourly", label: "Hourly Hire" },
];

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-edit flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-pine">
          <Compass className="h-5 w-5 text-gold" strokeWidth={1.75} aria-hidden />
          Southbound
        </Link>

        <nav className="hidden items-center gap-8 font-body text-sm text-ink/80 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-pine">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-ink/50 sm:inline">NZD</span>

          {user ? (
            <Link
              href={homeRouteForRole(user.role)}
              className="hidden items-center gap-1.5 rounded-sm border border-pine px-4 py-1.5 font-body text-sm text-pine transition-colors duration-200 hover:bg-pine hover:text-paper md:inline-flex"
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              {user.role === "CUSTOMER" ? "My trips" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden font-body text-sm text-ink/70 transition-colors hover:text-pine md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/book"
                className="hidden rounded-sm border border-pine px-4 py-1.5 font-body text-sm text-pine transition-colors duration-200 hover:bg-pine hover:text-paper md:inline-flex"
              >
                Request a booking
              </Link>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
