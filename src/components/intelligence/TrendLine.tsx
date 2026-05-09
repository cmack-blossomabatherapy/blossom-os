import { cn } from "@/lib/utils";

export function TrendLine({ values, labels, height = 180, className }: {
  values: number[]; labels?: string[]; height?: number; className?: string;
}) {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 600;
  const padX = 30, padY = 20;
  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (w - padX * 2);
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return { x, y, v };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${points[points.length - 1].x},${height - padY} L${points[0].x},${height - padY} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={cn("w-full", className)} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={padX} x2={w - padX} y1={height - padY - f * (height - padY * 2)} y2={height - padY - f * (height - padY * 2)} className="stroke-border" strokeDasharray="2 4" />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} className="fill-primary" />
      ))}
      {labels && labels.map((l, i) => (
        <text key={i} x={padX + (i / (labels.length - 1)) * (w - padX * 2)} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{l}</text>
      ))}
    </svg>
  );
}
