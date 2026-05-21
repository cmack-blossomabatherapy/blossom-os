import { cn } from "@/lib/utils";

export function Sparkline({ values, tone = "primary", className }: {
  values: number[]; tone?: "primary" | "success" | "warn" | "danger"; className?: string;
}) {
  if (!values.length) return null;
  const w = 96, h = 28, pad = 2;
  const max = Math.max(...values), min = Math.min(...values);
  const range = Math.max(0.0001, max - min);
  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = {
    primary: "hsl(265 70% 55%)",
    success: "hsl(152 64% 42%)",
    warn:    "hsl(38 92% 50%)",
    danger:  "hsl(0 78% 56%)",
  }[tone];
  const last = points[points.length - 1].split(",");
  return (
    <svg className={cn("block", className)} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={stroke} />
    </svg>
  );
}