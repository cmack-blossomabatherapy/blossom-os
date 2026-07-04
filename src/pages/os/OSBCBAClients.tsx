import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Loader2, ShieldCheck, AlertTriangle, CalendarClock,
  Eye, HeartHandshake, MessageSquare, X, ChevronRight,
  Users, FileSignature, Activity,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysSince, daysUntil, type Severity } from "@/hooks/useBcbaCaseload";
import type { ClientPairing } from "@/hooks/useCentralReachOps";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBcbaActionDialogs, BcbaQuickActionBar, BcbaTaskList } from "@/components/bcba/BcbaActionDialogs";

type Health = "stable" | "watch" | "attention";

const healthMeta: Record<Health, { label: string; dot: string; ring: string; text: string }> = {
  stable:    { label: "Stable",          dot: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300" },
  watch:     { label: "Watch",           dot: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-500/30",     text: "text-amber-700 dark:text-amber-300" },
  attention: { label: "Needs attention", dot: "bg-rose-500",    ring: "ring-rose-200 dark:ring-rose-500/30",       text: "text-rose-700 dark:text-rose-300" },
};

const sevChip: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};

type FilterKey =
  | "all" | "attention" | "stable" | "supervision" | "pr_soon"
  | "parent_training" | "scheduling" | "cancellations" | "auth_expiring";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",             label: "All" },
  { key: "attention",       label: "Needs attention" },
  { key: "stable",          label: "Stable" },
  { key: "supervision",     label: "Supervision due" },
  { key: "pr_soon",         label: "PR due soon" },
  { key: "parent_training", label: "Parent training due" },
  { key: "scheduling",      label: "Scheduling risk" },
  { key: "cancellations",   label: "High cancellation" },
  { key: "auth_expiring",   label: "Auth expiring" },
];

type SortKey = "urgent" | "alpha" | "pr_due" | "sup_risk" | "recent";

interface Row {
  client: ClientPairing;
  health: Health;
  badges: { label: string; tone: Severity }[];
  authDue: number | null;
  supDays: number | null;
  urgency: number; // higher = more urgent
  signals: Set<FilterKey>;
}

function Card({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-card text-card-foreground border border-border/70 p-5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
        onClick && "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: Health }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-4">
      <div className="flex items-center gap-2">
        {tone && <span className={cn("size-1.5 rounded-full", healthMeta[tone].dot)} />}
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function firstName(n: string | null | undefined) {
  if (!n) return "there";
  return n.trim().split(/\s+/)[0];
}

function relative(iso: string | null): string {
  if (!iso) return "—";
  const d = daysSince(iso);
  if (d === null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function OSBCBAClients() {
  const c = useBcbaCaseload();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("urgent");
  const [activeClient, setActiveClient] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    return c.caseload.map((client) => {
      const auth = c.authByClient.get(client.clientName.toLowerCase()) ?? null;
      const cov = c.coverageAlerts.find((x) => x.clientName === client.clientName) ?? null;
      const supDays = daysSince(client.lastBcbaSessionDate);
      const authDue = daysUntil(auth?.nextTaskDue ?? null);
      const signals = new Set<FilterKey>();
      const badges: { label: string; tone: Severity }[] = [];
      let urgency = 0;

      // Auth / PR
      if (auth) {
        if (auth.stage === "Denied") { badges.push({ label: "Denied", tone: "crit" }); urgency += 100; signals.add("pr_soon"); }
        else if (auth.stage === "Expiring Soon") { badges.push({ label: "Auth expiring", tone: "crit" }); urgency += 90; signals.add("auth_expiring"); }
        else if (authDue !== null && authDue <= 7) { badges.push({ label: `PR ${authDue}d`, tone: "crit" }); urgency += 80; signals.add("pr_soon"); }
        else if (authDue !== null && authDue <= 21) { badges.push({ label: `PR ${authDue}d`, tone: "warn" }); urgency += 40; signals.add("pr_soon"); }
      }
      // Supervision
      if (supDays === null) { badges.push({ label: "No supervision", tone: "crit" }); urgency += 70; signals.add("supervision"); }
      else if (supDays >= 21) { badges.push({ label: `Sup ${supDays}d`, tone: "crit" }); urgency += 65; signals.add("supervision"); }
      else if (supDays >= 14) { badges.push({ label: `Sup ${supDays}d`, tone: "warn" }); urgency += 30; signals.add("supervision"); }
      // Parent training
      if (supDays !== null && supDays >= 30) { badges.push({ label: "PT overdue", tone: "warn" }); urgency += 25; signals.add("parent_training"); }
      // Coverage / scheduling
      if (cov?.level === "uncovered") { badges.push({ label: "Uncovered", tone: "crit" }); urgency += 75; signals.add("scheduling"); }
      else if (cov?.level === "at_risk") { badges.push({ label: "Coverage gap", tone: "warn" }); urgency += 35; signals.add("scheduling"); }
      // Cancellations
      if (client.cancellationsLast30d >= 3) { badges.push({ label: `${client.cancellationsLast30d} cxl`, tone: "warn" }); urgency += 30; signals.add("cancellations"); }
      else if (client.cancellationsLast30d >= 2) { badges.push({ label: `${client.cancellationsLast30d} cxl`, tone: "info" }); urgency += 10; signals.add("cancellations"); }

      const health: Health = urgency >= 60 ? "attention" : urgency >= 20 ? "watch" : "stable";
      if (health === "stable") signals.add("stable");
      else signals.add("attention");

      return { client, health, badges, authDue, supDays, urgency, signals };
    });
  }, [c.caseload, c.authByClient, c.coverageAlerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows;
    if (q) r = r.filter((x) => x.client.clientName.toLowerCase().includes(q) || (x.client.rbtName ?? "").toLowerCase().includes(q));
    if (filter !== "all") {
      r = r.filter((x) => x.signals.has(filter));
    }
    const sorted = [...r];
    switch (sort) {
      case "alpha":    sorted.sort((a, b) => a.client.clientName.localeCompare(b.client.clientName)); break;
      case "pr_due":   sorted.sort((a, b) => (a.authDue ?? 9999) - (b.authDue ?? 9999)); break;
      case "sup_risk": sorted.sort((a, b) => (b.supDays ?? -1) - (a.supDays ?? -1)); break;
      case "recent":   sorted.sort((a, b) => (b.client.lastBcbaSessionDate ?? "").localeCompare(a.client.lastBcbaSessionDate ?? "")); break;
      default:         sorted.sort((a, b) => b.urgency - a.urgency);
    }
    return sorted;
  }, [rows, query, filter, sort]);

  const counts = useMemo(() => {
    const attention = rows.filter((r) => r.health === "attention").length;
    const watch = rows.filter((r) => r.health === "watch").length;
    const stable = rows.filter((r) => r.health === "stable").length;
    const activeRbts = new Set(c.caseload.map((p) => p.rbtName).filter(Boolean)).size;
    const prSoon = rows.filter((r) => r.signals.has("pr_soon")).length;
    const supDue = rows.filter((r) => r.signals.has("supervision")).length;
    const ptDue = rows.filter((r) => r.signals.has("parent_training")).length;
    const schedRisk = rows.filter((r) => r.signals.has("scheduling")).length;
    return { attention, watch, stable, activeRbts, prSoon, supDue, ptDue, schedRisk };
  }, [rows, c.caseload]);

  const activeRow = useMemo(
    () => (activeClient ? rows.find((r) => r.client.clientName === activeClient) ?? null : null),
    [activeClient, rows],
  );
  const activeAuth = useMemo(
    () => (activeClient ? c.authByClient.get(activeClient.toLowerCase()) ?? null : null),
    [activeClient, c.authByClient],
  );
  const clientOptions = useMemo(() => c.caseload.map((p) => p.clientName), [c.caseload]);
  const bcba = useBcbaActionDialogs({
    scope: { clientName: activeClient ?? undefined, bcbaName: c.resolvedBcba },
    clientOptions,
    defaultSourceArea: "caseload",
  });
  const activeClientTasks = useMemo(
    () => (activeClient ? bcba.workflow.tasks.filter((t) => t.client_name === activeClient && t.status !== "completed") : []),
    [activeClient, bcba.workflow.tasks],
  );
  const activeClientNotes = useMemo(
    () => (activeClient ? bcba.workflow.notes.filter((n) => n.client_name === activeClient) : []),
    [activeClient, bcba.workflow.notes],
  );

  return (
    <OSShell>
      <div className="space-y-8 px-4 pb-16 pt-6 md:px-8">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">My Caseload</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}'s clients
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading your caseload…</span>
                ) : c.caseload.length === 0 ? (
                  "No caseload activity in the last 60 days."
                ) : (
                  <>
                    You manage <b className="text-foreground">{c.caseload.length}</b> active clients ·{" "}
                    <b className="text-foreground">{counts.supDue}</b> need supervision ·{" "}
                    <b className="text-foreground">{counts.prSoon}</b> PRs due soon ·{" "}
                    <b className="text-foreground">{counts.schedRisk}</b> scheduling concerns
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 md:items-end">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {c.profileMatched ? "Caseload" : "Viewing as"}
              </label>
              <select
                className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm font-medium text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                value={c.resolvedBcba ?? ""}
                onChange={(e) => c.setSelectedBcba(e.target.value || null)}
                disabled={c.bcbaOptions.length === 0}
              >
                {c.bcbaOptions.length === 0 ? (
                  <option value="">No BCBAs found</option>
                ) : (
                  c.bcbaOptions.map((b) => (
                    <option key={b.name} value={b.name}>{b.name} · {b.distinctClients} clients</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </header>

        {/* Caseload summary */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatTile label="Active clients" value={c.caseload.length} />
          <StatTile label="Active RBTs"    value={counts.activeRbts} />
          <StatTile label="Attention"      value={counts.attention} tone="attention" />
          <StatTile label="Watch"          value={counts.watch}     tone="watch" />
          <StatTile label="Supervision"    value={counts.supDue}    hint="≥ 14 days" />
          <StatTile label="PR due soon"    value={counts.prSoon}    hint="within 21 days" />
          <StatTile label="Scheduling"     value={counts.schedRisk} hint="coverage gaps" />
        </section>

        {/* Filters & Search */}
        <section className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients or RBTs…"
                className="h-10 w-full rounded-xl bg-muted/60 border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Sort</label>
              <select
                className="h-10 rounded-xl border border-border bg-muted/60 px-3 text-sm font-medium text-foreground focus:border-transparent focus:ring-2 focus:ring-ring"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="urgent">Most urgent</option>
                <option value="alpha">Alphabetical</option>
                <option value="pr_due">PR due date</option>
                <option value="sup_risk">Supervision risk</option>
                <option value="recent">Recent activity</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-medium transition whitespace-nowrap",
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Client grid */}
        <section>
          {c.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center">
              <ShieldCheck className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">
                {rows.length === 0 ? "No clients on your caseload." : "No clients match these filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <Card key={r.client.clientName} onClick={() => setActiveClient(r.client.clientName)}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials(r.client.clientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{r.client.clientName}</p>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", healthMeta[r.health].text, healthMeta[r.health].ring)}>
                          <span className={cn("size-1.5 rounded-full", healthMeta[r.health].dot)} />
                          {healthMeta[r.health].label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        RBT: {r.client.rbtName ?? "Unassigned"} {r.client.state ? `· ${r.client.state}` : ""}
                      </p>
                    </div>
                  </div>

                  {r.badges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.badges.slice(0, 4).map((b, i) => (
                        <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Last sup.</p>
                      <p className="mt-0.5 font-medium text-foreground">{relative(r.client.lastBcbaSessionDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">PR due</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.authDue !== null ? `${r.authDue}d` : "—"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Cxl 30d</p>
                      <p className="mt-0.5 font-medium text-foreground">{r.client.cancellationsLast30d}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.client.rbtHoursLast7d.toFixed(1)}h / wk</span>
                    <span className="inline-flex items-center gap-1 text-foreground/70">Open <ChevronRight className="size-3.5" /></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick workflow actions */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/bcba/supervision" icon={Eye}             label="Supervision" />
            <QuickAction to="/bcba/authorizations" icon={FileSignature} label="PRs & Auths" />
            <QuickAction to="/bcba/parent-training" icon={HeartHandshake} label="Parent training" />
            <QuickAction to="/bcba/scheduling" icon={CalendarClock}   label="Scheduling" />
            <QuickAction to="/bcba/workspace" icon={Activity}         label="Workspace" />
          </div>
        </section>
      </div>

      {/* Side panel */}
      <Sheet open={!!activeClient} onOpenChange={(o) => !o && setActiveClient(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {activeRow && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">{activeRow.client.clientName}</SheetTitle>
                  <button onClick={() => setActiveClient(null)} className="rounded-full p-1 hover:bg-muted"><X className="size-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground">
                  RBT: {activeRow.client.rbtName ?? "Unassigned"}{activeRow.client.state ? ` · ${activeRow.client.state}` : ""}
                </p>
              </SheetHeader>

              <div className="mt-4 flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", healthMeta[activeRow.health].text, healthMeta[activeRow.health].ring)}>
                  <span className={cn("size-1.5 rounded-full", healthMeta[activeRow.health].dot)} />
                  {healthMeta[activeRow.health].label}
                </span>
                {activeRow.badges.slice(0, 3).map((b, i) => (
                  <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <Section title="Operational status">
                  <KV k="Last BCBA session"  v={relative(activeRow.client.lastBcbaSessionDate)} />
                  <KV k="Last RBT session"   v={relative(activeRow.client.lastRbtSessionDate)} />
                  <KV k="RBT hours / 7d"     v={`${activeRow.client.rbtHoursLast7d.toFixed(1)}h`} />
                  <KV k="RBT hours / 30d"    v={`${activeRow.client.rbtHoursLast30d.toFixed(1)}h`} />
                  <KV k="Cancellations 30d"  v={String(activeRow.client.cancellationsLast30d)} />
                  <KV k="PR / Auth"          v={activeAuth ? `${activeAuth.stage}${activeRow.authDue !== null ? ` · due ${activeRow.authDue}d` : ""}` : "—"} />
                </Section>

                {activeRow.client.weeklyPattern.length > 0 && (
                  <Section title="Weekly pattern">
                    <div className="grid grid-cols-7 gap-1.5">
                      {activeRow.client.weeklyPattern.map((d) => {
                        const intensity = Math.min(1, d.hours / 6);
                        return (
                          <div key={d.day} className="text-center">
                            <div className="h-10 rounded-md bg-primary/10" style={{ opacity: 0.25 + intensity * 0.75 }} />
                            <p className="mt-1 text-[10px] text-muted-foreground">{d.day}</p>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {activeRow.badges.length > 0 && (
                  <Section title="Operational alerts">
                    <div className="space-y-1.5">
                      {activeRow.badges.map((b, i) => (
                        <div key={i} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs", sevChip[b.tone])}>
                          <AlertTriangle className="size-3.5" />
                          {b.label}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                <Section title="Quick actions">
                  <div className="grid grid-cols-2 gap-2">
                    <PanelLink to="/bcba/scheduling" icon={CalendarClock}>View schedule</PanelLink>
                    <PanelLink to="/bcba/supervision" icon={Eye}>Open supervision</PanelLink>
                    <PanelLink to="/bcba/authorizations" icon={FileSignature}>Open PR</PanelLink>
                    <PanelLink to="/bcba/parent-training" icon={HeartHandshake}>Parent training</PanelLink>
                  </div>
                  <div className="mt-3">
                    <BcbaQuickActionBar
                      onNote={() => bcba.openNote(activeRow.client.clientName)}
                      onTask={() => bcba.openTask(activeRow.client.clientName)}
                      onSupervision={() => bcba.openSupervision(activeRow.client.clientName)}
                      onParentTraining={() => bcba.openParentTraining(activeRow.client.clientName)}
                      onPlanItem={() => bcba.openPlanItem(activeRow.client.clientName)}
                    />
                  </div>
                </Section>

                <Section title="Open tasks">
                  <BcbaTaskList
                    tasks={activeClientTasks}
                    onComplete={(id) => bcba.workflow.completeTask(id)}
                    empty="No open tasks for this client."
                  />
                </Section>

                <Section title="Recent notes">
                  {activeClientNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No notes yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activeClientNotes.slice(0, 5).map((n) => (
                        <li key={n.id} className="rounded-lg border border-border/60 bg-card p-2 text-xs">
                          <div className="font-medium text-foreground">{n.note_type} · {new Date(n.created_at).toLocaleDateString()}</div>
                          <div className="mt-1 text-muted-foreground">{n.body}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {bcba.dialogs}
    </OSShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 space-y-1">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:-translate-y-0.5 hover:border-border"
    >
      <Icon className="size-4 text-muted-foreground group-hover:text-primary" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function PanelLink({ to, icon: Icon, children }: { to: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted">
      <Icon className="size-3.5 text-muted-foreground" />
      {children}
    </Link>
  );
}