import { cn } from "@/lib/utils";

export function ScoreRing({ value, label, size = 120, className }: {
  value: number; label?: string; size?: number; className?: string;
}) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  const tone = value >= 85 ? "stroke-success" : value >= 65 ? "stroke-primary" : value >= 45 ? "stroke-warning" : "stroke-destructive";
  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={8} fill="none" className="stroke-muted" />
          <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={8} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className={cn("transition-all duration-700", tone)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/100</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
