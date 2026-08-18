import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-6 flex items-center justify-between border-t border-line pt-4" aria-label="Pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`flex items-center gap-1 font-body text-sm ${page <= 1 ? "pointer-events-none text-ink/30" : "text-pine hover:underline"}`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Previous
      </Link>
      <span className="font-mono text-xs uppercase tracking-wide text-ink/45">
        Page {page} of {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`flex items-center gap-1 font-body text-sm ${page >= totalPages ? "pointer-events-none text-ink/30" : "text-pine hover:underline"}`}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </nav>
  );
}
