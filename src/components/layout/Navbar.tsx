import Link from "next/link";
import { Compass } from "lucide-react";

const NAV_LINKS = [
  { href: "/tours", label: "Day Tours" },
  { href: "/transfers", label: "Transfers" },
  { href: "/hourly", label: "Hourly Hire" },
  { href: "/drive-with-us", label: "Drive With Us" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-pine">
          <Compass className="h-5 w-5 text-gold" strokeWidth={1.75} />
          Southbound
        </Link>

        <nav className="hidden items-center gap-7 font-body text-sm text-ink/80 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-pine">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-xs text-ink/60 sm:inline">NZD</span>
          <Link
            href="/auth"
            className="rounded-sm border border-pine px-4 py-1.5 text-sm text-pine transition-colors hover:bg-pine hover:text-paper"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
