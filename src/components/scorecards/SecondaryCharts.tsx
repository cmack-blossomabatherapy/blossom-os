import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { WeeklyScorecard } from "@/lib/scorecards/mockScorecards";

function MiniCard({ title, subtitle, color, data, dataKey, unit }: {
  title: string; subtitle: string; color: string; data: any[]; dataKey: string; unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3.5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[12.5px] font-semibold tracking-tight">{title}</h4>
        <span className="text-[10.5px] text-muted-foreground">{subtitle}</span>
      </div>
      <div className="mt-2 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(220 14% 94%)" strokeDasharray="2 6" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(220 14% 90%)", fontSize: 11 }} formatter={(v: number) => [`${v}${unit ?? ""}`, title]} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SecondaryCharts({ scorecards }: { scorecards: WeeklyScorecard[] }) {
  const data = scorecards.map(s => ({
    week: s.weekLabel,
    total: s.values.total_hours,
    restaffing: s.values.restaffing_needed,
    bcbaPct: Math.round(s.values.pct_bcba_hours * 100),
  }));
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MiniCard title="Total Hours" subtitle="Last 12 weeks" color="hsl(265 70% 55%)" data={data} dataKey="total" />
      <MiniCard title="Restaffing Needed" subtitle="Lower is better" color="hsl(0 78% 56%)" data={data} dataKey="restaffing" />
      <MiniCard title="BCBA Hours %" subtitle="Of total service" color="hsl(173 58% 45%)" data={data} dataKey="bcbaPct" unit="%" />
    </div>
  );
}