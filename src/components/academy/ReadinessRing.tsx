import { cn } from "@/lib/utils";

export function ReadinessRing({ value, size = 96, label = "Readiness" }: { value: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const tone = value >= 80 ? "text-emerald-500" : value >= 60 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className={cn("transition-all duration-700", tone)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}<span className="text-sm text-muted-foreground">%</span></span>
        </div>
      </div>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}