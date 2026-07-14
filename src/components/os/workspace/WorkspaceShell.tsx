import { type ReactNode, useMemo } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, ArrowUpRight, Bell, Bot, Clock, FileText,
  Sparkles, TrendingDown, TrendingUp, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Trend = "up" | "down" | "flat";
export type Urgency = "critical" | "high" | "medium" | "low" | "ok";

export interface WorkspaceKPI {
  label: string;
  value: string;
  delta?: string;
  trend?: Trend;
  hint?: string;
}

export interface QueueColumn {
  key: string;
  label: string;
  className?: string;
}

export interface QueueRow {
  id: string;
  urgency?: Urgency;
  cells: Record<string, ReactNode>;
  nextAction?: string;
}

export interface WorkspaceTab {
  id: string;
  label: string;
  queueTitle?: string;
  columns: QueueColumn[];
  rows: QueueRow[];
}

export interface AlertItem {
  id: string;
  title: string;
  meta?: string;
  urgency?: Urgency;
  icon?: LucideIcon;
}

export interface ActivityItem {
  id: string;
  who: string;
  what: string;
  when: string;
}

export interface AISuggestion {
  id: string;
  text: string;
}

export interface RelatedLink {
  label: string;
  path: string;
}

export interface QuickAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  to?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export interface FilterChip {
  label: string;
  value: string;
}

export interface WorkspaceConfig {
  id: string;
  title: string;
  subtitle?: string;
  quickActions?: QuickAction[];
  filters?: { label: string; chips: FilterChip[] }[];
  kpis: WorkspaceKPI[];
  tabs: WorkspaceTab[];
  alerts?: AlertItem[];
  escalations?: AlertItem[];
  activity?: ActivityItem[];
  ai?: AISuggestion[];
  reports?: RelatedLink[];
  resources?: RelatedLink[];
  related?: RelatedLink[];
}

const urgencyDot: Record<Urgency, string> = {
  critical: "bg-destructive",
  high: "bg-amber-500",
  medium: "bg-primary",
  low: "bg-muted-foreground/50",
  ok: "bg-emerald-500",
};

const urgencyBadge: Record<Urgency, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

function TrendIcon({ trend }: { trend?: Trend }) {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  return null;
}

export function WorkspaceShell({ config }: { config: WorkspaceConfig }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  const activeTabId = params.get("tab") ?? config.tabs[0]?.id;
  const activeTab = config.tabs.find((t) => t.id === activeTabId) ?? config.tabs[0];

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === config.tabs[0]?.id) next.delete("tab"); else next.set("tab", id);
    setParams(next, { replace: true });
  };

  // Persist non-tab params (filters etc.) — currently visual only.
  void location;

  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Header ---------- */}
      <header className="border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{config.title}</h1>
              {config.subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {config.quickActions?.map((a, i) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.variant === "primary" || (i === 0 && !a.variant) ? "default" : a.variant === "ghost" ? "ghost" : "outline"}
                  asChild={!!a.to}
                  onClick={a.onClick}
                  className="h-9 rounded-xl"
                >
                  {a.to ? <NavLink to={a.to}>{a.icon && <a.icon className="mr-1.5 h-4 w-4" />}{a.label}</NavLink>
                       : <span>{a.icon && <a.icon className="mr-1.5 h-4 w-4" />}{a.label}</span>}
                </Button>
              ))}
            </div>
          </div>

          {config.filters?.length ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {config.filters.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="font-medium uppercase tracking-wider text-muted-foreground/70">{f.label}</span>
                  <div className="flex flex-wrap gap-1">
                    {f.chips.map((c, idx) => (
                      <button
                        key={c.value}
                        type="button"
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] transition",
                          idx === 0
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-6 md:px-8">
        {/* ---------- KPI row ---------- */}
        <section
          aria-label="Key metrics"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
        >
          {config.kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-border/60 bg-card p-4 transition hover:border-border"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <TrendIcon trend={k.trend} />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{k.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {k.delta ?? k.hint ?? "\u00A0"}
              </p>
            </div>
          ))}
        </section>

        {/* ---------- Main + Right rail ---------- */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* MAIN */}
          <section className="min-w-0">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60">
              {config.tabs.map((t) => {
                const active = t.id === activeTab?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative -mb-px border-b-2 px-3 py-2 text-sm transition",
                      active
                        ? "border-primary font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                    <span className="ml-1.5 text-[11px] text-muted-foreground/70">{t.rows.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Queue */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                <h2 className="text-sm font-medium text-foreground">{activeTab?.queueTitle ?? activeTab?.label}</h2>
                <span className="text-[11px] text-muted-foreground">{activeTab?.rows.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Status</th>
                      {activeTab?.columns.map((c) => (
                        <th key={c.key} className={cn("px-3 py-2 font-medium", c.className)}>{c.label}</th>
                      ))}
                      <th className="px-3 py-2 font-medium">Next action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab?.rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 last:border-0 transition hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-block h-2 w-2 rounded-full", urgencyDot[row.urgency ?? "low"])} />
                        </td>
                        {activeTab.columns.map((c) => (
                          <td key={c.key} className={cn("px-3 py-2.5 text-foreground/90", c.className)}>{row.cells[c.key]}</td>
                        ))}
                        <td className="px-3 py-2.5">
                          {row.nextAction ? (
                            <button type="button" className="inline-flex items-center gap-1 rounded-md text-primary hover:underline">
                              {row.nextAction}<ArrowUpRight className="h-3 w-3" />
                            </button>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                    {!activeTab?.rows.length && (
                      <tr><td colSpan={(activeTab?.columns.length ?? 1) + 2} className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Secondary area — reports / resources / related */}
            {(config.reports?.length || config.resources?.length || config.related?.length) ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SecondaryCard title="Reports" icon={FileText} links={config.reports ?? []} empty="No reports configured." />
                <SecondaryCard title="Resources" icon={Sparkles} links={config.resources ?? []} empty="No resources yet." />
                <SecondaryCard title="Related workflows" icon={ArrowUpRight} links={config.related ?? []} empty="No linked workflows." />
              </div>
            ) : null}
          </section>

          {/* RIGHT RAIL */}
          <aside className="space-y-4">
            <RailCard title="Alerts" icon={Bell} items={config.alerts ?? []} emptyText="No active alerts." />
            <RailCard title="Escalations" icon={AlertTriangle} items={config.escalations ?? []} emptyText="No escalations." accentEmpty="ok" />
            <RailCard title="Recent activity" icon={Clock} activity={config.activity ?? []} emptyText="No recent activity." />
            <AIRail suggestions={config.ai ?? []} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function RailCard({
  title, icon: Icon, items, activity, emptyText, accentEmpty,
}: {
  title: string;
  icon: LucideIcon;
  items?: AlertItem[];
  activity?: ActivityItem[];
  emptyText: string;
  accentEmpty?: Urgency;
}) {
  const isEmpty = !(items?.length || activity?.length);
  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{items?.length ?? activity?.length ?? 0}</span>
      </div>
      <div className="divide-y divide-border/40">
        {items?.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3 text-[13px]">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", urgencyDot[a.urgency ?? "medium"])} />
            <div className="min-w-0 flex-1">
              <p className="text-foreground/95">{a.title}</p>
              {a.meta && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.meta}</p>}
            </div>
          </div>
        ))}
        {activity?.map((a) => (
          <div key={a.id} className="px-4 py-3 text-[13px]">
            <p className="text-foreground/95"><span className="font-medium">{a.who}</span> {a.what}</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{a.when}</p>
          </div>
        ))}
        {isEmpty && (
          <div className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
            {accentEmpty === "ok" && <Badge variant="outline" className="mb-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">All clear</Badge>}
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AIRail({ suggestions }: { suggestions: AISuggestion[] }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="flex items-center justify-between border-b border-primary/15 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[12.5px] font-medium uppercase tracking-wider text-primary">Suggestions</h3>
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        {suggestions.length ? suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            className="block w-full rounded-xl border border-border/50 bg-card px-3 py-2 text-left text-[12.5px] text-foreground/90 transition hover:border-primary/40 hover:bg-card"
          >
            {s.text}
          </button>
        )) : (
          <p className="px-2 py-3 text-center text-[12.5px] text-muted-foreground">No suggestions yet.</p>
        )}
      </div>
    </div>
  );
}

function SecondaryCard({
  title, icon: Icon, links, empty,
}: { title: string; icon: LucideIcon; links: RelatedLink[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {links.length ? (
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.path}>
              <NavLink to={l.path} className="group flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] text-foreground/90 transition hover:bg-muted/50">
                <span>{l.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" />
              </NavLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-[12.5px] text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}