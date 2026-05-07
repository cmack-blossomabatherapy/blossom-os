import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface GlassStatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const toneRing: Record<NonNullable<GlassStatProps["tone"]>, string> = {
  default: "bg-muted/60 text-muted-foreground",
  primary: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

const toneValue: Record<NonNullable<GlassStatProps["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function GlassStat({ label, value, hint, icon: Icon, tone = "default", className }: GlassStatProps) {
  return (
    <div className={cn("glass-stat group", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneRing[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight md:text-3xl", toneValue[tone])}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}