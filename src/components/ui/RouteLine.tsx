interface RouteLineProps {
  from: string;
  to: string;
  className?: string;
  /** "light" for use on paper/sand backgrounds (default), "dark" for use on the pine hero/footer. */
  tone?: "light" | "dark";
  size?: "sm" | "lg";
}

/**
 * Two labelled points joined by a dashed route and a small gold waypoint dot.
 * This is the recurring signature element of the brand: every product
 * (tours, transfers, hourly hire) is fundamentally "point A to point B",
 * so the UI keeps surfacing that literally instead of decorating around it.
 */
export function RouteLine({ from, to, className, tone = "light", size = "sm" }: RouteLineProps) {
  const textTone = tone === "dark" ? "text-paper/70" : "text-ink/50";
  const textSize = size === "lg" ? "text-sm sm:text-base" : "text-xs";
  return (
    <div
      className={`flex items-center gap-3 font-mono uppercase tracking-wide ${textTone} ${textSize} ${className ?? ""}`}
    >
      <span className="whitespace-nowrap">{from}</span>
      <span className="relative h-px flex-1 bg-route-dash text-gold" aria-hidden>
        <span className="waypoint-dot absolute -top-[3px] right-0 h-[7px] w-[7px] rounded-full bg-gold" />
      </span>
      <span className="whitespace-nowrap">{to}</span>
    </div>
  );
}

interface RouteWaypointsProps {
  steps: { label: string; state: "done" | "active" | "upcoming" }[];
  className?: string;
}

/**
 * The route-line motif re-purposed as a progress rail: each step in a flow
 * (e.g. booking request → confirmation) is a waypoint along the dashed line,
 * rather than a generic numbered stepper.
 */
export function RouteWaypoints({ steps, className }: RouteWaypointsProps) {
  return (
    <div className={`flex items-center ${className ?? ""}`} role="list" aria-label="Progress">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2" role="listitem">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                step.state === "upcoming" ? "bg-line" : "bg-gold"
              } ${step.state === "active" ? "waypoint-dot" : ""}`}
              aria-hidden
            />
            <span
              className={`whitespace-nowrap font-mono text-[10px] uppercase tracking-wide sm:text-[11px] ${
                step.state === "upcoming" ? "text-ink/35" : "text-ink/70"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              className={`mx-2 h-px flex-1 ${
                step.state === "done" ? "bg-gold" : "bg-route-dash text-line"
              }`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
