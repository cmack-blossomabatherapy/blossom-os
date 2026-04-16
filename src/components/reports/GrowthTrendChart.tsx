import { cn } from "@/lib/utils";
import { monthlyTrend } from "@/data/reports";

export function GrowthTrendChart() {
  const maxLeads = Math.max(...monthlyTrend.map((m) => m.leads));
  const maxClients = Math.max(...monthlyTrend.map((m) => m.clients));
  const maxActive = Math.max(...monthlyTrend.map((m) => m.active));

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Growth Trends</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend color="bg-info" label="Leads" />
          <Legend color="bg-warning" label="New Clients" />
          <Legend color="bg-success" label="Active" />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-3 h-40">
        {monthlyTrend.map((m) => (
          <div key={m.month} className="flex flex-col items-center gap-1.5">
            <div className="flex-1 w-full flex items-end gap-1">
              <Bar value={m.leads} max={maxLeads} tone="bg-info" label={String(m.leads)} />
              <Bar value={m.clients} max={maxClients} tone="bg-warning" label={String(m.clients)} />
              <Bar value={m.active} max={maxActive} tone="bg-success" label={String(m.active)} />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">{m.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-sm", color)} />
      {label}
    </span>
  );
}

function Bar({ value, max, tone, label }: { value: number; max: number; tone: string; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center justify-end h-full group relative">
      <span className="text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 absolute -top-3.5 tabular-nums">
        {label}
      </span>
      <div className={cn("w-full rounded-t-sm transition-all", tone)} style={{ height: `${Math.max(pct, 4)}%` }} />
    </div>
  );
}
