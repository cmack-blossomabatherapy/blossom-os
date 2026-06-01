import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import { cn } from "@/lib/utils";
import type { ChartSpec } from "@/lib/os/dashboardEngine/types";

const COLORS = [
  "hsl(265 70% 55%)", "hsl(195 80% 50%)", "hsl(150 65% 45%)",
  "hsl(30 90% 55%)", "hsl(340 75% 55%)", "hsl(220 70% 55%)",
];

export function ChartCard({ chart }: { chart: ChartSpec }) {
  const data = chart.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    chart.series.forEach(s => { row[s.name] = s.data[i] ?? 0; });
    return row;
  });

  return (
    <article className={cn(
      "rounded-2xl border border-border/60 bg-card p-5",
      chart.span === 2 && "lg:col-span-2",
    )}>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[13.5px] font-semibold tracking-tight">{chart.title}</h3>
          {chart.subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{chart.subtitle}</p>}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground capitalize">{chart.type.replace("-", " ")}</span>
      </div>
      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "pie" ? (
            <PieChart>
              <Pie
                data={chart.labels.map((label, i) => ({ name: label, value: chart.series[0]?.data[i] ?? 0 }))}
                dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}
                paddingAngle={2}
              >
                {chart.labels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip wrapperStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} unit={chart.unit} width={40} />
              <Tooltip wrapperStyle={{ fontSize: 12 }} />
              {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {chart.series.map((s, i) => (
                <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color ?? COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit={chart.unit} width={40} />
              <Tooltip wrapperStyle={{ fontSize: 12 }} />
              {chart.series.map((s, i) => (
                <Area key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 56 : 24} />
              <YAxis tick={{ fontSize: 10 }} unit={chart.unit} width={40} />
              <Tooltip wrapperStyle={{ fontSize: 12 }} />
              {chart.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {chart.series.map((s, i) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={s.color ?? COLORS[i % COLORS.length]}
                  stackId={chart.type === "stacked-bar" ? "a" : undefined}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </article>
  );
}