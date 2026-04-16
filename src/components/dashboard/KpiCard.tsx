import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
}

export function KpiCard({ label, value, change, trend, icon }: KpiCardProps) {
  return (
    <div className="kpi-card flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold text-foreground tracking-tight">{value}</span>
      {change && (
        <span className={cn(
          "text-xs font-medium",
          trend === "up" && "text-success",
          trend === "down" && "text-destructive",
          trend === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </span>
      )}
    </div>
  );
}
