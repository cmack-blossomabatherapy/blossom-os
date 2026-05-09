import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import type { TrendDir, Severity } from "@/data/blossomEnterprise";

export function ReadinessGauge({ value, label }: { value: number; label?: string }) {
  const r = 60, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const tone = value >= 85 ? "text-success" : value >= 70 ? "text-primary" : "text-warning";
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} stroke="hsl(var(--muted))" strokeWidth="12" fill="none" opacity="0.3" />
        <circle cx="80" cy="80" r={r} stroke="currentColor" strokeWidth="12" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className={cn("transition-all duration-700", tone)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("text-4xl font-bold tabular-nums", tone)}>{value}</div>
        {label && <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>}
      </div>
    </div>
  );
}

export function TrendChip({ trend, delta }: { trend: TrendDir; delta: number }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const tone = trend === "up" ? "text-success bg-success/10" : trend === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted/40";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", tone)}>
      <Icon className="h-3 w-3" />{delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

export function StatChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function SeverityDot({ s }: { s: Severity }) {
  const tone = s === "critical" ? "bg-destructive" : s === "high" ? "bg-warning" : s === "medium" ? "bg-primary" : "bg-muted-foreground";
  return <span className={cn("inline-block h-2 w-2 rounded-full", tone)} />;
}

export function Sparkline({ data, height = 32 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={w} height={height} className="text-primary">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
