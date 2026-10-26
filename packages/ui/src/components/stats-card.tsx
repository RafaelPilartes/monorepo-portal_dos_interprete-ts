import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/** A figure with its label: the number leads; the icon only names the kind, beside the label. */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card px-5 py-4", className)}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
          {trend.isPositive ? "+" : "-"}
          {Math.abs(trend.value)}% vs mês anterior
        </p>
      )}
    </div>
  );
}
