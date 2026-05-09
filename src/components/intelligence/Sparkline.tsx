import { cn } from "@/lib/utils";

export function Sparkline({ values, height = 28, className, tone = "primary" }: {
  values: number[]; height?: number; className?: string; tone?: "primary" | "success" | "destructive" | "warning";
}) {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const colorClass =
    tone === "success" ? "stroke-success" :
    tone === "destructive" ? "stroke-destructive" :
    tone === "warning" ? "stroke-warning" : "stroke-primary";
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }}>
      <polyline fill="none" strokeWidth={1.5} className={colorClass} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
