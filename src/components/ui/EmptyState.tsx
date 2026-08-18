import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-line p-10 text-center">
      {Icon && <Icon className="mx-auto h-6 w-6 text-ink/30" aria-hidden />}
      <p className="mt-3 font-body text-sm font-medium text-ink/70">{title}</p>
      {description && <p className="mt-1 font-body text-sm text-ink/45">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
