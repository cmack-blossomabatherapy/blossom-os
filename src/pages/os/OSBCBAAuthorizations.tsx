import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Loader2, ShieldCheck, AlertTriangle, FileSignature,
  Upload, MessageSquare, Sparkles, X, ChevronRight, CalendarClock,
  ClipboardCheck, PenLine, Users, Activity, ShieldAlert,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useBcbaCaseload, daysUntil, type Severity } from "@/hooks/useBcbaCaseload";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const sevChip: Record<Severity, string> = {
  crit: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
};
const sevDot: Record<Severity, string> = {
  crit: "bg-rose-500", warn: "bg-amber-500", info: "bg-sky-500",
};

type FilterKey = "all" | "urgent" | "pr_soon" | "expiring" | "awaiting_qa" | "awaiting_sig" | "missing_docs" | "reassess";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",           label: "All" },
  { key: "urgent",        label: "Urgent" },
  { key: "pr_soon",       label: "PR due ≤ 21d" },
  { key: "expiring",      label: "Auth expiring" },
  { key: "awaiting_qa",   label: "Awaiting QA" },
  { key: "awaiting_sig",  label: "Awaiting signature" },
  { key: "missing_docs",  label: "Missing docs" },
  { key: "reassess",      label: "Reassessment" },
];

interface Row {
  a: Authorization;
  prDue: number | null;
  expDue: number | null;
  urgency: number;
  sev: Severity;
  workflow: string;
  badges: { label: string; tone: Severity }[];
  signals: Set<FilterKey>;
  needsSig: boolean;
  missingDocs: string[];
}

function workflowLabel(a: Authorization, prDue: number | null): string {
  if (a.stage === "Denied") return "At Risk";
  if (a.stage === "Expiring Soon") return "Expiring";
  if (a.stage === "Submitted") return "Submitted";
  if (a.stage === "In QA Review") return "Awaiting QA";
  if (a.stage === "Awaiting Submission") {
    if (a.missingInfo) return "Missing Info";
    if (prDue !== null && prDue <= 7) return "Urgent";
    return "In Progress";
  }
  if (a.stage === "Approved") return "Approved";
  return a.stage;
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

function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/60 p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function firstName(n: string | null | undefined) {
  if (!n) return "there";
  return n.trim().split(/\s+/)[0];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dueLabel(days: number | null, prefix = ""): string {
  if (days === null) return "—";
  if (days < 0) return `${prefix}${Math.abs(days)}d overdue`;
  if (days === 0) return `${prefix}due today`;
  return `${prefix}in ${days}d`;
}

export default function OSBCBAAuthorizations() {
  const c = useBcbaCaseload();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    return c.myAuths.map((a) => {
      const prDue = daysUntil(a.nextTaskDue);
      const expDue = daysUntil(a.expirationDate);
      const signals = new Set<FilterKey>();
      const badges: { label: string; tone: Severity }[] = [];
      let urgency = 0;
      let sev: Severity = "info";

      if (a.stage === "Denied") { urgency += 100; sev = "crit"; badges.push({ label: "Denied", tone: "crit" }); signals.add("urgent"); }
      if (a.stage === "Expiring Soon" || (expDue !== null && expDue <= 30 && expDue >= 0)) {
        signals.add("expiring");
        if (expDue !== null && expDue <= 7) { urgency += 90; sev = "crit"; badges.push({ label: `Exp ${expDue}d`, tone: "crit" }); }
        else if (expDue !== null && expDue <= 30) { urgency += 50; sev = sev === "crit" ? sev : "warn"; badges.push({ label: `Exp ${expDue}d`, tone: "warn" }); }
      }
      if (prDue !== null) {
        signals.add("pr_soon");
        if (prDue <= 0) { urgency += 80; sev = "crit"; badges.push({ label: dueLabel(prDue, "PR "), tone: "crit" }); }
        else if (prDue <= 7) { urgency += 70; sev = "crit"; badges.push({ label: `PR ${prDue}d`, tone: "crit" }); }
        else if (prDue <= 21) { urgency += 40; sev = sev === "crit" ? sev : "warn"; badges.push({ label: `PR ${prDue}d`, tone: "warn" }); }
      }
      if (a.stage === "In QA Review" || a.stage === "Submitted") {
        signals.add("awaiting_qa");
        badges.push({ label: a.stage === "Submitted" ? "Submitted" : "QA review", tone: "info" });
      }
      if (a.missingInfo) {
        signals.add("missing_docs");
        urgency += 30;
        badges.push({ label: "Missing info", tone: "warn" });
      }
      const missingDocs = a.documents.filter((d) => d.required && !d.received).map((d) => d.name);
      if (missingDocs.length > 0) signals.add("missing_docs");
      const needsSig = missingDocs.some((d) => /signature|consent/i.test(d)) ||
        a.missingRequirements.some((r) => /signature|consent/i.test(r));
      if (needsSig) { signals.add("awaiting_sig"); badges.push({ label: "Signature", tone: "warn" }); }
      if (a.authType === "Reauth" || (a.authType === "Treatment" && a.stage === "Expiring Soon")) signals.add("reassess");
      if (urgency >= 70) signals.add("urgent");

      const workflow = workflowLabel(a, prDue);
      return { a, prDue, expDue, urgency, sev, workflow, badges, signals, needsSig, missingDocs };
    }).sort((a, b) => b.urgency - a.urgency);
  }, [c.myAuths]);

  const counts = useMemo(() => ({
    active: rows.filter((r) => r.a.stage !== "Denied" && r.a.stage !== "Flaked Client").length,
    prSoon: rows.filter((r) => r.prDue !== null && r.prDue <= 30).length,
    expiring: rows.filter((r) => r.signals.has("expiring")).length,
    submitted: rows.filter((r) => r.a.stage === "Submitted" || r.a.stage === "In QA Review").length,
    missingDocs: rows.filter((r) => r.signals.has("missing_docs")).length,
    signatures: rows.filter((r) => r.needsSig).length,
    reassess: rows.filter((r) => r.signals.has("reassess")).length,
    risks: rows.filter((r) => r.sev === "crit").length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows;
    if (q) r = r.filter((x) => x.a.clientName.toLowerCase().includes(q) || x.a.payor.toLowerCase().includes(q));
    if (filter !== "all") r = r.filter((x) => x.signals.has(filter));
    return r;
  }, [rows, query, filter]);

  // Timeline groups: this week / 30d / 60d / 90d / later
  const timeline = useMemo(() => {
    const buckets: { label: string; max: number; items: Row[] }[] = [
      { label: "This week",   max: 7,    items: [] },
      { label: "Next 30 days", max: 30,  items: [] },
      { label: "31–60 days",   max: 60,  items: [] },
      { label: "61–90 days",   max: 90,  items: [] },
      { label: "Later",        max: 9999,items: [] },
    ];
    for (const r of rows) {
      const d = r.prDue !== null ? r.prDue : r.expDue;
      if (d === null) continue;
      const eff = Math.max(d, 0);
      const b = buckets.find((x) => eff <= x.max)!;
      b.items.push(r);
    }
    return buckets;
  }, [rows]);

  const activeRow = useMemo(() => rows.find((r) => r.a.id === activeId) ?? null, [rows, activeId]);

  return (
    <OSShell>
      <div className="space-y-8 px-4 pb-16 pt-6 md:px-8">

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">My Authorizations</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {firstName(c.profileMatched ? c.profileName : c.resolvedBcba)}'s PR queue
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {c.loading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading your authorizations…</span>
                ) : rows.length === 0 ? (
                  "No authorizations linked to your caseload."
                ) : (
                  <>
                    <b className="text-foreground">{counts.active}</b> active ·{" "}
                    <b className="text-foreground">{counts.prSoon}</b> PRs due ≤30d ·{" "}
                    <b className="text-foreground">{counts.expiring}</b> expiring ·{" "}
                    <b className="text-foreground">{counts.missingDocs}</b> awaiting docs
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
                ) : c.bcbaOptions.map((b) => (
                  <option key={b.name} value={b.name}>{b.name} · {b.distinctClients} clients</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatTile label="Active auths"    value={counts.active} />
          <StatTile label="PRs due"         value={counts.prSoon}   hint="≤ 30 days" />
          <StatTile label="Expiring"        value={counts.expiring} hint="auth window" />
          <StatTile label="Signatures"      value={counts.signatures} />
          <StatTile label="Missing docs"    value={counts.missingDocs} />
          <StatTile label="Submitted"       value={counts.submitted} hint="awaiting QA" />
          <StatTile label="At risk"         value={counts.risks} />
        </section>

        {/* Filters & Search */}
        <section className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by client or payor…"
                className="h-10 w-full rounded-xl bg-muted/60 border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
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

        {/* PR Priority Queue */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">PR priority queue</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Sorted by urgency — work top-down.</p>
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} items</span>
          </div>
          {c.loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center">
              <ShieldCheck className="mx-auto size-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-sm text-muted-foreground">
                {rows.length === 0 ? "No authorizations on your caseload." : "Nothing matches these filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <Card key={r.a.id} onClick={() => setActiveId(r.a.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight">{r.a.clientName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.a.payor} · {r.a.authType}{r.a.state ? ` · ${r.a.state}` : ""}
                      </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[r.sev])}>
                      <span className={cn("size-1.5 rounded-full", sevDot[r.sev])} />
                      {r.workflow}
                    </span>
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
                      <p className="uppercase tracking-widest text-muted-foreground">PR due</p>
                      <p className="mt-0.5 font-medium">{dueLabel(r.prDue)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Auth exp.</p>
                      <p className="mt-0.5 font-medium">{fmtDate(r.a.expirationDate)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="uppercase tracking-widest text-muted-foreground">Missing</p>
                      <p className="mt-0.5 font-medium">{r.missingDocs.length}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{r.a.nextAction ?? "Review"}</span>
                    <span className="inline-flex items-center gap-1 text-foreground/70">Open <ChevronRight className="size-3.5" /></span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Timeline */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Authorization timeline</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Upcoming PR deadlines and auth expirations.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {timeline.map((b) => (
              <div key={b.label} className="rounded-2xl bg-muted/40 border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{b.label}</p>
                  <span className="text-xs font-medium text-foreground">{b.items.length}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {b.items.slice(0, 5).map((r) => (
                    <li key={r.a.id}>
                      <button
                        onClick={() => setActiveId(r.a.id)}
                        className="w-full rounded-lg bg-card border border-border/60 px-3 py-2 text-left text-xs transition hover:border-border"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{r.a.clientName}</span>
                          <span className={cn("size-1.5 shrink-0 rounded-full", sevDot[r.sev])} />
                        </div>
                        <p className="mt-0.5 truncate text-muted-foreground">
                          {r.prDue !== null ? `PR ${dueLabel(r.prDue)}` : `Exp ${fmtDate(r.a.expirationDate)}`}
                        </p>
                      </button>
                    </li>
                  ))}
                  {b.items.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Two-up: Reassessments + Missing docs */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight">Reassessments approaching</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Reauth windows on your caseload.</p>
            </div>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {rows.filter((r) => r.signals.has("reassess")).slice(0, 6).map((r) => (
                  <li key={r.a.id}>
                    <button onClick={() => setActiveId(r.a.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.a.clientName}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.a.authType} · expires {fmtDate(r.a.expirationDate)}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[r.sev])}>{dueLabel(r.expDue)}</span>
                    </button>
                  </li>
                ))}
                {rows.filter((r) => r.signals.has("reassess")).length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">No reassessments scheduled in window.</li>
                )}
              </ul>
            </Card>
          </div>

          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight">Missing documentation</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Items blocking PR or auth completion.</p>
            </div>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {rows.filter((r) => r.missingDocs.length > 0 || r.a.missingInfo).slice(0, 8).map((r) => (
                  <li key={r.a.id}>
                    <button onClick={() => setActiveId(r.a.id)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.a.clientName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.missingDocs.slice(0, 2).join(" · ") || r.a.missingRequirements.slice(0, 2).join(" · ") || "Info incomplete"}
                        </p>
                      </div>
                      <Upload className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
                {rows.filter((r) => r.missingDocs.length > 0 || r.a.missingInfo).length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">All documentation complete.</li>
                )}
              </ul>
            </Card>
          </div>
        </section>

        {/* Two-up: Signatures + QA Coordination */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight">Parent signatures</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Pending consents and signatures.</p>
            </div>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {rows.filter((r) => r.needsSig).slice(0, 6).map((r) => (
                  <li key={r.a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.a.clientName}</p>
                      <p className="truncate text-xs text-muted-foreground">Awaiting signature</p>
                    </div>
                    <button onClick={() => setActiveId(r.a.id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-3 text-xs font-medium hover:bg-muted">
                      <PenLine className="size-3.5" /> Remind
                    </button>
                  </li>
                ))}
                {rows.filter((r) => r.needsSig).length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">No signatures outstanding.</li>
                )}
              </ul>
            </Card>
          </div>

          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight">QA & auth coordination</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Updates from QA and the auth team.</p>
            </div>
            <Card className="p-0">
              <ul className="divide-y divide-border/60">
                {rows.filter((r) => r.signals.has("awaiting_qa") || r.a.qaNotes).slice(0, 6).map((r) => (
                  <li key={r.a.id}>
                    <button onClick={() => setActiveId(r.a.id)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.a.clientName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.a.qaNotes ?? `${r.a.stage} · ${r.a.coordinator}`}
                        </p>
                      </div>
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
                {rows.filter((r) => r.signals.has("awaiting_qa") || r.a.qaNotes).length === 0 && (
                  <li className="px-4 py-6 text-sm text-muted-foreground">No QA activity right now.</li>
                )}
              </ul>
            </Card>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <QuickAction to="/bcba/clients"        icon={Users}          label="My clients" />
            <QuickAction to="/bcba/supervision"    icon={ClipboardCheck} label="Supervision" />
            <QuickAction to="/bcba/parent-training" icon={FileSignature} label="Parent training" />
            <QuickAction to="/bcba/scheduling"     icon={CalendarClock}  label="Scheduling" />
            <QuickAction to="/bcba/workspace"      icon={Activity}       label="Workspace" />
            <QuickAction to="/ai"                  icon={Sparkles}       label="Ask Blossom AI" />
          </div>
        </section>
      </div>

      {/* Side panel */}
      <Sheet open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {activeRow && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl">{activeRow.a.clientName}</SheetTitle>
                  <button onClick={() => setActiveId(null)} className="rounded-full p-1 hover:bg-muted"><X className="size-4" /></button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeRow.a.payor} · {activeRow.a.authType}{activeRow.a.state ? ` · ${activeRow.a.state}` : ""}
                </p>
              </SheetHeader>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", sevChip[activeRow.sev])}>
                  <span className={cn("size-1.5 rounded-full", sevDot[activeRow.sev])} />
                  {activeRow.workflow}
                </span>
                {activeRow.badges.slice(0, 3).map((b, i) => (
                  <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", sevChip[b.tone])}>{b.label}</span>
                ))}
              </div>

              <div className="mt-6 space-y-5">
                <PanelSection title="Authorization">
                  <KV k="Stage"          v={activeRow.a.stage} />
                  <KV k="Hours"          v={activeRow.a.hours ?? "—"} />
                  <KV k="Submitted"      v={fmtDate(activeRow.a.submittedDate)} />
                  <KV k="Approved"       v={fmtDate(activeRow.a.approvedDate)} />
                  <KV k="Expiration"     v={fmtDate(activeRow.a.expirationDate)} />
                  <KV k="PR due"         v={dueLabel(activeRow.prDue)} />
                  <KV k="Coordinator"    v={activeRow.a.coordinator} />
                  <KV k="QA"             v={`${activeRow.a.qaStatus}${activeRow.a.qaOwner ? ` · ${activeRow.a.qaOwner}` : ""}`} />
                </PanelSection>

                <PanelSection title="Next action">
                  <p className="text-sm">{activeRow.a.nextAction ?? "Review"}</p>
                </PanelSection>

                {activeRow.a.documents.length > 0 && (
                  <PanelSection title="Documents">
                    <ul className="space-y-1.5">
                      {activeRow.a.documents.map((d) => (
                        <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate">{d.name}{d.required ? " *" : ""}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            d.received
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                          )}>
                            {d.received ? "Received" : "Missing"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </PanelSection>
                )}

                {activeRow.a.qaNotes && (
                  <PanelSection title="QA feedback">
                    <p className="text-sm text-muted-foreground">{activeRow.a.qaNotes}</p>
                  </PanelSection>
                )}

                {activeRow.a.timeline.length > 0 && (
                  <PanelSection title="Recent activity">
                    <ul className="space-y-2">
                      {activeRow.a.timeline.slice(0, 5).map((e) => (
                        <li key={e.id} className="flex items-start gap-2 text-xs">
                          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-foreground">{e.description}</p>
                            <p className="text-muted-foreground">{fmtDate(e.timestamp)}{e.user ? ` · ${e.user}` : ""}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PanelSection>
                )}

                <PanelSection title="Quick actions">
                  <div className="grid grid-cols-2 gap-2">
                    <PanelLink to="/authorizations" icon={FileSignature}>Open PR</PanelLink>
                    <PanelLink to="/bcba/clients"   icon={Users}>View client</PanelLink>
                    <PanelLink to="/authorizations" icon={Upload}>Upload docs</PanelLink>
                    <PanelLink to="/qa-team"        icon={MessageSquare}>Message QA</PanelLink>
                    <PanelLink to="/bcba/scheduling" icon={CalendarClock}>Scheduling</PanelLink>
                    <PanelLink to="/ai"             icon={Sparkles}>Ask Blossom AI</PanelLink>
                  </div>
                </PanelSection>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
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
      <span className="font-medium text-foreground text-right">{v}</span>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:-translate-y-0.5 hover:border-border">
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