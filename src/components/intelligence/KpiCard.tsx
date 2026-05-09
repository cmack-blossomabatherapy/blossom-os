import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  trend?: number[];
  hint?: string;
  onClick?: () => void;
  className?: string;
}

export function KpiCard({ label, value, delta, trend, hint, onClick, className }: KpiCardProps) {
  const positive = (delta ?? 0) > 0;
  const negative = (delta ?? 0) < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  const deltaTone = positive ? "text-success" : negative ? "text-destructive" : "text-muted-foreground";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {typeof delta === "number" && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", deltaTone)}>
            <Icon className="h-3 w-3" />
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {trend && <Sparkline values={trend} height={32} className="mt-2" tone={positive ? "success" : negative ? "destructive" : "primary"} />}
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </button>
  );
}
