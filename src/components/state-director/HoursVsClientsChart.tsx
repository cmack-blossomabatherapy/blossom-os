import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { WeekPoint } from "@/lib/analytics/stateOps";

interface Props {
  data: WeekPoint[];
}

/**
 * The hero chart: weekly service hours vs active distinct clients, with a
 * 3-week moving average overlay. This is the single visual the State
 * Director uses to judge staffing efficiency.
 */
export function HoursVsClientsChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="grid h-[320px] place-items-center text-[12px] text-muted-foreground">
        No session data yet for this window.
      </div>
    );
  }
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(265 80% 62%)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="hsl(265 80% 62%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clientsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(180 65% 45%)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(180 65% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(240 10% 92%)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 50%)" }} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 50%)" }} width={44} />
          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(240 5% 50%)" }} width={36} />
          <Tooltip
            contentStyle={{
              borderRadius: 12, border: "1px solid hsl(240 10% 90%)",
              boxShadow: "0 12px 32px -16px hsl(220 40% 30% / 0.25)", fontSize: 12,
            }}
            formatter={(value: any, name: any) => {
              if (name === "Hours") return [`${Number(value).toFixed(1)} hrs`, name];
              if (name === "Hours · 3wk avg") return [`${Number(value).toFixed(1)} hrs`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area yAxisId="left" type="monotone" dataKey="hours" name="Hours" stroke="hsl(265 80% 62%)" strokeWidth={2.25} fill="url(#hoursFill)" />
          <Area yAxisId="right" type="monotone" dataKey="clients" name="Active clients" stroke="hsl(180 65% 45%)" strokeWidth={2.25} fill="url(#clientsFill)" />
          <Line yAxisId="left" type="monotone" dataKey="hoursMA" name="Hours · 3wk avg" stroke="hsl(265 70% 45%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="clientsMA" name="Clients · 3wk avg" stroke="hsl(180 60% 32%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}