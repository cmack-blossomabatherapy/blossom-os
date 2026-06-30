import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, AlertTriangle, TrendingDown, TrendingUp, Phone } from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { useCentralReachOps, type ProviderRosterEntry } from "@/hooks/useCentralReachOps";
import { ContactAttemptDialog, ProviderRiskDialog } from "@/components/scheduling/SchedulingDialogs";

const TARGET = 32;

type LoadBand = "all" | "under" | "balanced" | "over";

function bandOf(r: ProviderRosterEntry): Exclude<LoadBand, "all"> {
  if (r.hoursLast7d > 35) return "over";
  if (r.hoursLast7d < TARGET - 4) return "under";
  return "balanced";
}

export default function OSSchedulingRosterRBTs() {
  const cr = useCentralReachOps();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [band, setBand] = useState<LoadBand>("all");

  const states = useMemo(
    () => Array.from(new Set(cr.rbtRoster.map((r) => r.state).filter(Boolean) as string[])).sort(),
    [cr.rbtRoster],
  );

  const filtered = useMemo(() => {
    return cr.rbtRoster.filter((r) => {
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (band !== "all" && bandOf(r) !== band) return false;
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [cr.rbtRoster, stateFilter, band, query]);

  const overloaded = cr.rbtRoster.filter((r) => r.hoursLast7d > 35).length;
  const underUtilized = cr.rbtRoster.filter((r) => r.hoursLast7d < TARGET - 4).length;
  const totalHours7d = cr.rbtRoster.reduce((s, r) => s + r.hoursLast7d, 0);
  const [contactFor, setContactFor] = useState<ProviderRosterEntry | null>(null);
  const [riskFor, setRiskFor] = useState<ProviderRosterEntry | null>(null);

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">RBT Roster</h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                Live roster derived from CentralReach 97153 (RBT direct) sessions over the last {cr.lookbackDays} days.
                Capacity uses a {TARGET}h/week soft target.
              </p>
            </div>
            <Link to="/scheduling-workspace" className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
              Back to Workspace
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip label="RBTs" value={cr.counts.rbtCount} tone="primary" loading={cr.loading} />
            <Chip label="Overloaded (>35h)" value={overloaded} tone="destructive" loading={cr.loading} icon={TrendingUp} />
            <Chip label="Under-utilized (<28h)" value={underUtilized} tone="warning" loading={cr.loading} icon={TrendingDown} />
            <Chip label="Total hrs / 7d" value={Math.round(totalHours7d)} tone="muted" loading={cr.loading} />
          </div>
        </header>

        <div className="rounded-2xl bg-card border border-border/70 overflow-hidden shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <div className="p-4 border-b border-border/60 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search RBT name"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-9 rounded-lg bg-muted/60 border border-border px-2 text-xs text-foreground"
            >
              <option value="all">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as LoadBand)}
              className="h-9 rounded-lg bg-muted/60 border border-border px-2 text-xs text-foreground"
            >
              <option value="all">All load bands</option>
              <option value="over">Overloaded</option>
              <option value="balanced">Balanced</option>
              <option value="under">Under-utilized</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">RBT</th>
                  <th className="text-left font-medium px-4 py-2.5">State</th>
                  <th className="text-right font-medium px-4 py-2.5">Hrs / 7d</th>
                  <th className="text-right font-medium px-4 py-2.5">Hrs / 30d</th>
                  <th className="text-right font-medium px-4 py-2.5">Clients (30d)</th>
                  <th className="text-left font-medium px-4 py-2.5">Last session</th>
                  <th className="text-left font-medium px-4 py-2.5">Load</th>
                  <th className="text-right font-medium px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {cr.loading && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">Loading CentralReach roster…</td></tr>
                )}
                {!cr.loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No RBTs match your filters.</td></tr>
                )}
                {filtered.map((r) => {
                  const b = bandOf(r);
                  const util = Math.round((r.hoursLast7d / TARGET) * 100);
                  return (
                    <tr key={r.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.state ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.hoursLast7d.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.hoursLast30d.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.distinctClients}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.lastSessionDate ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn(
                              "h-full",
                              b === "over" ? "bg-destructive" : b === "balanced" ? "bg-success" : "bg-warning",
                            )} style={{ width: `${Math.min(100, util)}%` }} />
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                            b === "over" ? "bg-destructive/10 text-destructive" :
                            b === "balanced" ? "bg-success/10 text-success" :
                            "bg-warning/10 text-warning",
                          )}>{util}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setContactFor(r)} className="h-7 px-2 rounded-md text-[11px] border border-border/70 hover:bg-muted inline-flex items-center gap-1"><Phone className="size-3" /> Contact</button>
                          <button onClick={() => setRiskFor(r)} className="h-7 px-2 rounded-md text-[11px] border border-border/70 hover:bg-muted">Flag risk</button>
                          <Link to={`/scheduling?q=${encodeURIComponent(r.name)}`} className="h-7 px-2 rounded-md text-[11px] border border-border/70 hover:bg-muted">Clients</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Source: <code>bcba_billable_sessions</code> · procedure code 97153 · window {cr.windowStart} → today.
        </p>
      </div>
      <ContactAttemptDialog open={!!contactFor} onOpenChange={(o) => !o && setContactFor(null)} client={contactFor ? { id: "", childName: contactFor.name, state: contactFor.state ?? undefined } : null} defaultContactType="rbt" />
      <ProviderRiskDialog open={!!riskFor} onOpenChange={(o) => !o && setRiskFor(null)} providerName={riskFor?.name ?? ""} providerRole="rbt" state={riskFor?.state ?? null} />
    </OSShell>
  );
}

function Chip({ label, value, tone, loading, icon: Icon }: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "destructive" | "muted";
  loading?: boolean;
  icon?: typeof TrendingUp;
}) {
  const toneClass = {
    primary: "text-primary",
    warning: "text-warning",
    destructive: "text-destructive",
    muted: "text-foreground",
  }[tone];
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
      {Icon && <Icon className={cn("size-3.5", toneClass)} />}
      <span className={cn("font-semibold tabular-nums", toneClass)}>{loading ? "…" : value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}