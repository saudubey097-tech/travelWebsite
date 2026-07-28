import Link from "next/link";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/tours", label: "Day Tours" },
      { href: "/transfers", label: "Transfers" },
      { href: "/hourly", label: "Hourly Hire" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Partners",
    links: [{ href: "/drive-with-us", label: "Drive With Us" }],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-sand/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="font-display text-lg text-pine">Southbound</div>
          <p className="mt-2 max-w-xs font-body text-sm text-ink/70">
            Private drivers, day trips and transfers across New Zealand.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="font-body text-xs uppercase tracking-wide text-ink/50">{col.title}</div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-body text-sm text-ink/80 hover:text-pine">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line/70 px-4 py-4 text-center font-mono text-xs text-ink/50 sm:px-6">
        © {new Date().getFullYear()} Southbound — independently owned and operated in New Zealand.
      </div>
    </footer>
  );
}
