import Link from "next/link";
import { Compass, Mail, ShieldCheck } from "lucide-react";
import { RouteLine } from "@/components/ui/RouteLine";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Trips",
    links: [
      { href: "/tours", label: "Day Tours" },
      { href: "/transfers", label: "Transfers" },
      { href: "/hourly", label: "Hourly Hire" },
    ],
  },
  {
    title: "Booking",
    links: [
      { href: "/book", label: "Request a booking" },
      { href: "/tours", label: "How day tours work" },
      { href: "/transfers", label: "Get a transfer quote" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-lineDark bg-pineDark text-paper">
      <div className="container-edit py-16">
        <RouteLine from="Cape Reinga" to="Bluff" tone="dark" className="mb-12 text-paper/40" />

        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-lg text-paper">
              <Compass className="h-5 w-5 text-gold" strokeWidth={1.75} aria-hidden />
              Southbound
            </div>
            <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-paper/60">
              Private drivers, day trips and transfers the length of New Zealand — one
              vehicle, one local driver, one fixed price.
            </p>
            <div className="mt-5 flex items-center gap-2 font-body text-xs text-paper/50">
              <ShieldCheck className="h-4 w-4 text-gold" aria-hidden />
              Every booking is a request until confirmed by the operator.
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-wide text-paper/40">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="font-body text-sm text-paper/75 transition-colors hover:text-gold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-paper/40">Get in touch</div>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/book"
                  className="flex items-center gap-2 font-body text-sm text-paper/75 transition-colors hover:text-gold"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  Send a booking request
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-lineDark px-4 py-5 text-center font-mono text-[11px] text-paper/40 sm:px-6">
        © {new Date().getFullYear()} Southbound — independently owned and operated in New Zealand.
      </div>
    </footer>
  );
}
