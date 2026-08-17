import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";

export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink/45">{label}</span>
        <Icon className="h-4 w-4 text-gold" aria-hidden />
      </div>
      <div className="mt-2 font-display text-3xl text-ink">{value}</div>
    </Card>
  );
}
