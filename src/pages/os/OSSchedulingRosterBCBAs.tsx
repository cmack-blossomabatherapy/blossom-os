import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, AlertTriangle, Phone } from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { useCentralReachOps, type ProviderRosterEntry } from "@/hooks/useCentralReachOps";
import { ContactAttemptDialog, ProviderRiskDialog } from "@/components/scheduling/SchedulingDialogs";
import { SchedulingOverlayWarning } from "@/components/scheduling/SchedulingOverlayWarning";

const CASELOAD_CAP = 12;

export default function OSSchedulingRosterBCBAs() {
  const cr = useCentralReachOps();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const states = useMemo(
    () => Array.from(new Set(cr.bcbaRoster.map((r) => r.state).filter(Boolean) as string[])).sort(),
    [cr.bcbaRoster],
  );

  const filtered = useMemo(() => {
    return cr.bcbaRoster.filter((r) => {
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [cr.bcbaRoster, stateFilter, query]);

  const overCap = cr.bcbaRoster.filter((r) => r.distinctClients > CASELOAD_CAP).length;
  const inactiveBcbas = cr.bcbaRoster.filter((r) => r.sessionsLast7d === 0).length;
  const [contactFor, setContactFor] = useState<ProviderRosterEntry | null>(null);
  const [riskFor, setRiskFor] = useState<ProviderRosterEntry | null>(null);

  return (
    <OSShell>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-8 space-y-6">
        <SchedulingOverlayWarning />
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">BCBA Roster</h1>
              <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
                Live roster derived from CentralReach 97155 / 97151 / 97156 sessions over the last {cr.lookbackDays} days.
                Caseload soft cap is {CASELOAD_CAP} distinct clients per BCBA.
              </p>
            </div>
            <Link to="/scheduling-workspace" className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition text-sm font-medium inline-flex items-center gap-2">
              Back to Workspace
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip label="BCBAs" value={cr.counts.bcbaCount} tone="primary" loading={cr.loading} icon={Users} />
            <Chip label="Over caseload (>12)" value={overCap} tone="destructive" loading={cr.loading} icon={AlertTriangle} />
            <Chip label="No sessions last 7d" value={inactiveBcbas} tone="warning" loading={cr.loading} />
          </div>
        </header>

        <div className="rounded-2xl bg-card border border-border/70 overflow-hidden shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <div className="p-4 border-b border-border/60 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search BCBA name"
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
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} shown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">BCBA</th>
                  <th className="text-left font-medium px-4 py-2.5">State</th>
                  <th className="text-right font-medium px-4 py-2.5">Clients (30d)</th>
                  <th className="text-right font-medium px-4 py-2.5">Hrs / 7d</th>
                  <th className="text-right font-medium px-4 py-2.5">Hrs / 30d</th>
                  <th className="text-right font-medium px-4 py-2.5">Sessions / 30d</th>
                  <th className="text-left font-medium px-4 py-2.5">Last session</th>
                  <th className="text-left font-medium px-4 py-2.5">Caseload</th>
                  <th className="text-right font-medium px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {cr.loading && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">Loading CentralReach roster…</td></tr>
                )}
                {!cr.loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">No BCBAs match your filters.</td></tr>
                )}
                {filtered.map((r) => {
                  const pct = Math.round((r.distinctClients / CASELOAD_CAP) * 100);
                  const over = r.distinctClients > CASELOAD_CAP;
                  return (
                    <tr key={r.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.state ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.distinctClients}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.hoursLast7d.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.hoursLast30d.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.sessionsLast30d}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.lastSessionDate ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full", over ? "bg-destructive" : pct > 75 ? "bg-warning" : "bg-success")}
                                 style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                            over ? "bg-destructive/10 text-destructive" :
                            pct > 75 ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
                          )}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => setContactFor(r)} className="h-7 px-2 rounded-md text-[11px] border border-border/70 hover:bg-muted inline-flex items-center gap-1"><Phone className="size-3" /> Notify</button>
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
          Source: <code>bcba_billable_sessions</code> · codes 97155 / 97151 / 97156 · window {cr.windowStart} → today.
        </p>
      </div>
      <ContactAttemptDialog
        open={!!contactFor}
        onOpenChange={(o) => !o && setContactFor(null)}
        provider={contactFor ? { name: contactFor.name, role: "bcba", state: contactFor.state ?? null } : null}
        defaultContactType="bcba"
      />
      <ProviderRiskDialog open={!!riskFor} onOpenChange={(o) => !o && setRiskFor(null)} providerName={riskFor?.name ?? ""} providerRole="bcba" state={riskFor?.state ?? null} />
    </OSShell>
  );
}

function Chip({ label, value, tone, loading, icon: Icon }: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "destructive";
  loading?: boolean;
  icon?: typeof Users;
}) {
  const toneClass = { primary: "text-primary", warning: "text-warning", destructive: "text-destructive" }[tone];
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-card border border-border/70 text-sm">
      {Icon && <Icon className={cn("size-3.5", toneClass)} />}
      <span className={cn("font-semibold tabular-nums", toneClass)}>{loading ? "…" : value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}