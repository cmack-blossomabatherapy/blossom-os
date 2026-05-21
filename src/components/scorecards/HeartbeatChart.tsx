import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend } from "recharts";
import type { WeeklyScorecard } from "@/lib/scorecards/mockScorecards";

/** The "heartbeat" — Active Clients vs 53 Hours, the State Director's primary signal. */
export function HeartbeatChart({ scorecards }: { scorecards: WeeklyScorecard[] }) {
  const data = scorecards.map(s => ({
    week: s.weekLabel,
    clients: s.values.active_clients,
    hours53: s.values.hours_53,
  }));
  return (
    <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">Operational heartbeat</p>
          <h3 className="mt-0.5 text-[16px] font-semibold tracking-tight">Active Clients vs 53 Hours</h3>
          <p className="text-[11.5px] text-muted-foreground">The two numbers every weekly review starts with.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(265_70%_55%)]" />Active Clients</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[hsl(173_58%_45%)]" />53 Hours</span>
        </div>
      </div>
      <div className="mt-3 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="hsl(220 14% 92%)" strokeDasharray="3 6" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="L" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} tickLine={false} axisLine={false} width={32} />
            <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 14% 90%)", fontSize: 12 }} />
            <Line yAxisId="L" type="monotone" dataKey="clients" name="Active Clients" stroke="hsl(265 70% 55%)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
            <Line yAxisId="R" type="monotone" dataKey="hours53" name="53 Hours" stroke="hsl(173 58% 45%)" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}