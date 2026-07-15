import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DepartmentDashboardDef, DeptKpi, DeptStatusRow, DeptTrendRow, DeptWorkQueueRow, DeptRiskRow, Tone,
} from "@/data/departmentDashboards";

const toneClasses: Record<Tone, string> = {
  healthy: "text-success bg-success/10 border-success/20",
  attention: "text-warning bg-warning/10 border-warning/25",
  critical: "text-destructive bg-destructive/10 border-destructive/25",
  neutral: "text-muted-foreground bg-muted/40 border-border/60",
};

export function DepartmentDashboardView({ dashboard }: { dashboard: DepartmentDashboardDef }) {
  return (
    <div className="space-y-6">
      <KpiGrid kpis={dashboard.kpis} />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <WorkQueueCard title={dashboard.workQueueTitle} rows={dashboard.workQueue} />
        <StatusCard title={dashboard.statusTitle} rows={dashboard.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <TrendCard title={dashboard.trendTitle} rows={dashboard.trend} />
        <RiskCard rows={dashboard.risks} />
      </div>

      {dashboard.dataNote && (
        <p className="px-1 text-[11px] italic text-muted-foreground">{dashboard.dataNote}</p>
      )}
    </div>
  );
}

function KpiGrid({ kpis }: { kpis: DeptKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-xl border border-border/60 bg-card p-3.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{k.value}</p>
          {k.delta && (
            <p className={cn(
              "mt-0.5 text-[11px] font-medium",
              k.trend === "up" && "text-success",
              k.trend === "down" && "text-destructive",
              (!k.trend || k.trend === "neutral") && "text-muted-foreground",
            )}>{k.delta}</p>
          )}
          {k.hint && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{k.hint}</p>}
        </div>
      ))}
    </div>
  );
}

function WorkQueueCard({ title, rows }: { title: string; rows: DeptWorkQueueRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Items that need action first.</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs italic text-muted-foreground">Nothing waiting — you're all caught up.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                toneClasses[r.tone ?? "neutral"])}>
                {r.status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-foreground">{r.name}</p>
                {r.detail && <p className="truncate text-[11px] text-muted-foreground">{r.detail}</p>}
              </div>
              {r.owner && <span className="hidden shrink-0 text-[11px] text-muted-foreground md:inline">{r.owner}</span>}
              {r.age && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{r.age}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusCard({ title, rows }: { title: string; rows: DeptStatusRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => {
          const pct = (r.count / max) * 100;
          const tone = r.tone ?? "neutral";
          const bar =
            tone === "critical" ? "bg-destructive/70"
            : tone === "attention" ? "bg-warning/70"
            : tone === "healthy" ? "bg-success/70"
            : "bg-primary/60";
          return (
            <li key={r.label}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-foreground">{r.label}</span>
                <span className="font-medium tabular-nums text-foreground">{r.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted/40">
                <div className={cn("h-full rounded", bar)} style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TrendCard({ title, rows }: { title: string; rows: DeptTrendRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 flex items-end gap-3 h-32">
        {rows.map((r) => {
          const h = (r.value / max) * 100;
          return (
            <div key={r.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[hsl(265_70%_55%/0.85)] to-[hsl(285_70%_65%/0.85)]"
                  style={{ height: `${Math.max(h, 6)}%` }}
                  aria-label={`${r.label} ${r.value}`}
                />
              </div>
              <div className="text-center">
                <p className="text-[10.5px] text-muted-foreground">{r.label}</p>
                <p className="text-[11px] font-medium tabular-nums text-foreground">{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskCard({ rows }: { rows: DeptRiskRow[] }) {
  const map = {
    high: { Icon: AlertOctagon, classes: "border-destructive/30 bg-destructive/10 text-destructive" },
    medium: { Icon: AlertTriangle, classes: "border-warning/30 bg-warning/10 text-warning" },
    low: { Icon: Info, classes: "border-info/30 bg-info/10 text-info" },
  } as const;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Alerts &amp; risk</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Auto-surfaced from department state.</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-center text-xs italic text-muted-foreground">No risks flagged.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r, i) => {
            const { Icon, classes } = map[r.severity];
            return (
              <li key={i} className="flex items-start gap-2.5 rounded-lg border border-border/40 p-2.5">
                <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", classes)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-foreground">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">{r.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}