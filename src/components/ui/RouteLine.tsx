interface RouteLineProps {
  from: string;
  to: string;
  className?: string;
}

/**
 * Two labelled points joined by a dashed route and a small gold waypoint dot.
 * This is the recurring signature element of the brand: every product
 * (tours, transfers, hourly hire) is fundamentally "point A to point B",
 * so the UI keeps surfacing that literally instead of decorating around it.
 */
export function RouteLine({ from, to, className }: RouteLineProps) {
  return (
    <div className={`flex items-center gap-3 font-mono text-xs uppercase tracking-wide ${className ?? ""}`}>
      <span className="whitespace-nowrap">{from}</span>
      <span className="relative h-px flex-1 bg-route-dash text-gold" aria-hidden>
        <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rounded-full bg-gold" />
      </span>
      <span className="whitespace-nowrap">{to}</span>
    </div>
  );
}
