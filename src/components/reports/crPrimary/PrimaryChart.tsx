import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ChartDatum } from "@/lib/os/reports/crPrimary/types";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(195 80% 45%)",
  "hsl(150 60% 42%)",
  "hsl(35 90% 55%)",
  "hsl(340 70% 55%)",
  "hsl(265 65% 58%)",
  "hsl(215 60% 50%)",
];

export interface PrimaryChartProps {
  title: string;
  subtitle?: string;
  type: "bar" | "line" | "pie";
  data: ChartDatum[];
  valueLabel: string;
  secondaryLabel?: string;
  /** Optional third count series. Only ever used with same-unit counts. */
  tertiaryLabel?: string;
  /** Clicking a bar/point/slice opens the matching drilldown. */
  onSelect?: (label: string) => void;
  height?: number;
  className?: string;
}

/** Interactive chart card — every segment is a drilldown entry point. */
export function PrimaryChart({
  title,
  subtitle,
  type,
  data,
  valueLabel,
  secondaryLabel,
  tertiaryLabel,
  onSelect,
  height = 260,
  className,
}: PrimaryChartProps) {
  const handle = (payload: { label?: string; name?: string } | undefined) => {
    const label = payload?.label ?? payload?.name;
    if (label && onSelect) onSelect(String(label));
  };

  return (
    <article
      data-testid="report-chart"
      className={`rounded-2xl border border-border/60 bg-card p-4 ${className ?? ""}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {valueLabel}
        </span>
      </div>
      <div className="mt-3 w-full" style={{ height }}>
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No rows match the current filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={92}
                  paddingAngle={2}
                  onClick={(d) => handle(d as { name?: string })}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : type === "line" ? (
              <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={valueLabel}
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5, onClick: (_: unknown, d: unknown) => handle((d as { payload?: ChartDatum })?.payload) }}
                />
                {secondaryLabel && (
                  <Line
                    type="monotone"
                    dataKey="secondary"
                    name={secondaryLabel}
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={data.length > 6 ? -25 : 0}
                  textAnchor={data.length > 6 ? "end" : "middle"}
                  height={data.length > 6 ? 60 : 26}
                />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip wrapperStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="value"
                  name={valueLabel}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  fill={COLORS[0]}
                  onClick={(d) => handle(d as { label?: string })}
                >
                  {/* Categorical colours only make sense for a single series.
                      With 2+ same-unit series, each series keeps ONE colour so
                      the legend matches the bars. */}
                  {!secondaryLabel &&
                    !tertiaryLabel &&
                    data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>

                {secondaryLabel && (
                  <Bar dataKey="secondary" name={secondaryLabel} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                )}
                {tertiaryLabel && (
                  <Bar dataKey="tertiary" name={tertiaryLabel} fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}