import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, FileSignature, AlertTriangle, X, ChevronRight,
  Users, Activity, History, ClipboardCheck, FileWarning, CalendarClock,
  ShieldCheck, ArrowRightCircle,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";

// QA Authorization Reviews — operational quality-control layer for auth workflows.
// Real data only via useLiveAuthorizations.

type Tone = "ok" | "warn" | "crit";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}
function relTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/70 bg-card",
      "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      className,
    )}>{children}</div>
  );
}
function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
      toneClasses(tone),
    )}>{children}</span>
  );
}
function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 mb-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{children}</div>
      {right}
    </div>
  );
}

// ---------- Classification ----------
function workflowStatus(a: Authorization): string {
  if (a.stage === "Denied") return "Escalated";
  if (a.missingInfo) return "Missing Information";
  if (a.stage === "Expiring Soon") return "Expiring Soon";
  if (a.stage === "In QA Review") return "In QA Review";
  if (a.stage === "Awaiting Submission") return a.daysInStage > 5 ? "Waiting on BCBA" : "Awaiting Submission";
  if (a.stage === "Approved") return "Approved";
  if (a.stage === "Submitted") return "Submitted";
  if (a.stage === "Flaked Client") return "Flaked Client";
  return a.stage;
}
function urgencyOf(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  const exp = daysUntil(a.expirationDate);
  if (exp !== null && exp >= 0 && exp <= 7) return "crit";
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return "crit";
  if (a.missingInfo) return "warn";
  if (exp !== null && exp >= 0 && exp <= 30) return "warn";
  if (a.daysInStage > 5) return "warn";
  return "ok";
}
function blockerOf(a: Authorization): string | null {
  if (a.stage === "Denied") return a.denialReason ? `Denial: ${a.denialReason}` : "Awaiting denial response";
  if (a.missingInfo) return a.missingRequirements[0] ?? "Missing documentation";
  if (a.stage === "Awaiting Submission" && a.daysInStage > 5) return "Waiting on BCBA response";
  return null;
}
function isEscalation(a: Authorization): boolean {
  if (a.stage === "Denied") return true;
  const exp = daysUntil(a.expirationDate);
  if (exp !== null && exp >= 0 && exp <= 7) return true;
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return true;
  return false;
}
function isActive(a: Authorization): boolean {
  return a.stage !== "Approved" && a.stage !== "Flaked Client";
}

// ---------- Page ----------
export default function OSQAAuthReviews() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();

  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [payorFilter, setPayorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qaFilter, setQaFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all"); // all, 30, 60, 90
  const [openId, setOpenId] = useState<string | null>(null);
  useQADeepLink({ items, loading, setOpenId, setQuery, setBcbaFilter });

  // Sources
  const states = useMemo(() => Array.from(new Set(items.map(a => a.state).filter(Boolean))).sort(), [items]);
  const payors = useMemo(() => Array.from(new Set(items.map(a => a.payor).filter(Boolean))).sort(), [items]);
  const statuses = useMemo(() => Array.from(new Set(items.map(workflowStatus))).sort(), [items]);
  const qaOwners = useMemo(() => Array.from(new Set(items.map(a => a.qaOwner).filter(Boolean) as string[])).sort(), [items]);
  const bcbas = useMemo(() => Array.from(new Set(items.map(a => a.coordinator).filter(Boolean))).sort(), [items]);

  // Awareness counts (always full dataset, not filtered)
  const counts = useMemo(() => {
    const inReview = items.filter(a => a.stage === "In QA Review").length;
    const awaiting = items.filter(a => a.stage === "Awaiting Submission").length;
    const missing  = items.filter(a => a.missingInfo).length;
    const exp30 = items.filter(a => {
      const d = daysUntil(a.expirationDate);
      return d !== null && d >= 0 && d <= 30 && a.stage !== "Approved";
    }).length;
    const escal = items.filter(isEscalation).length;
    return { inReview, awaiting, missing, exp30, escal };
  }, [items]);

  // Main filtered queue
  const queue = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(a => {
      if (!isActive(a) && expFilter === "all" && statusFilter === "all") return false;
      if (stateFilter !== "all" && a.state !== stateFilter) return false;
      if (payorFilter !== "all" && a.payor !== payorFilter) return false;
      if (statusFilter !== "all" && workflowStatus(a) !== statusFilter) return false;
      if (qaFilter !== "all" && a.qaOwner !== qaFilter) return false;
      if (bcbaFilter !== "all" && a.coordinator !== bcbaFilter) return false;
      if (urgencyFilter !== "all" && urgencyOf(a) !== urgencyFilter) return false;
      if (expFilter !== "all") {
        const max = parseInt(expFilter, 10);
        const d = daysUntil(a.expirationDate);
        if (d === null || d < 0 || d > max) return false;
      }
      if (q) {
        const hay = [a.clientName, a.payor, a.state, a.coordinator, a.qaOwner ?? "", a.stage, a.authType]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => {
      const rank = (z: Authorization) => urgencyOf(z) === "crit" ? 3 : urgencyOf(z) === "warn" ? 2 : 1;
      return rank(y) - rank(x) || y.daysInStage - x.daysInStage;
    });
  }, [items, query, stateFilter, payorFilter, statusFilter, qaFilter, bcbaFilter, urgencyFilter, expFilter]);

  // Expiring groups (full dataset, ignore filters except state/payor/qa for relevance)
  const expiringGroups = useMemo(() => {
    const matches = items.filter(a => {
      if (a.stage === "Approved") return false;
      if (stateFilter !== "all" && a.state !== stateFilter) return false;
      if (payorFilter !== "all" && a.payor !== payorFilter) return false;
      const d = daysUntil(a.expirationDate);
      return d !== null && d >= 0 && d <= 90;
    });
    const bucket = (lo: number, hi: number) =>
      matches.filter(a => {
        const d = daysUntil(a.expirationDate)!;
        return d >= lo && d <= hi;
      }).sort((a, b) => (daysUntil(a.expirationDate)! - daysUntil(b.expirationDate)!));
    return {
      "0-30": bucket(0, 30),
      "31-60": bucket(31, 60),
      "61-90": bucket(61, 90),
    };
  }, [items, stateFilter, payorFilter]);

  // Missing info list
  const missingInfo = useMemo(() => {
    return items.filter(a => a.missingInfo && isActive(a))
      .sort((a, b) => b.daysInStage - a.daysInStage);
  }, [items]);

  // Priorities + workload
  const priorities = useMemo(() => {
    return [...items.filter(isEscalation), ...items.filter(a => {
      const d = daysUntil(a.expirationDate);
      return d !== null && d >= 0 && d <= 14;
    })]
      .filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
      .slice(0, 6);
  }, [items]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = items.filter(a => a.qaOwner === name || a.coordinator === name);
      const active = owned.filter(isActive).length;
      const overdue = owned.filter(a => a.daysInStage > 7 && isActive(a)).length;
      const blocked = owned.filter(a => a.missingInfo && isActive(a)).length;
      return { name, active, overdue, blocked };
    });
  }, [items]);

  const openItem = items.find(a => a.id === openId) ?? null;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Authorization Reviews
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Manage QA authorization reviews, treatment auth workflows, and expiring authorizations.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.inReview} in review
              </span>
              {counts.exp30 > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {counts.exp30} expiring ≤30d
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, authorization, BCBA, payor, workflow, or status..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={payorFilter} onChange={setPayorFilter} label="Payor"
              options={[{ value: "all", label: "All payors" }, ...payors.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status"
              options={[{ value: "all", label: "All statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={qaFilter} onChange={setQaFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...qaOwners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency"
              options={[
                { value: "all", label: "All urgency" },
                { value: "crit", label: "Critical" },
                { value: "warn", label: "High" },
                { value: "ok", label: "Normal" },
              ]} />
            <FilterSelect value={expFilter} onChange={setExpFilter} label="Expiring"
              options={[
                { value: "all", label: "Any expiration" },
                { value: "30", label: "Expiring ≤30d" },
                { value: "60", label: "Expiring ≤60d" },
                { value: "90", label: "Expiring ≤90d" },
              ]} />
          </div>
        </header>

        {/* AWARENESS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwarenessCard icon={ClipboardCheck} label="In QA Review"        value={counts.inReview} tone="warn" />
          <AwarenessCard icon={ArrowRightCircle} label="Awaiting Submission" value={counts.awaiting} tone="ok" />
          <AwarenessCard icon={FileWarning} label="Missing Information"   value={counts.missing}  tone="warn" />
          <AwarenessCard icon={CalendarClock} label="Expiring ≤30d"        value={counts.exp30}    tone={counts.exp30 > 0 ? "warn" : "ok"} />
          <AwarenessCard icon={Flame} label="Escalated Reviews"            value={counts.escal}    tone={counts.escal > 0 ? "crit" : "ok"} />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8 min-w-0">
            {/* MAIN REVIEW QUEUE */}
            <section>
              <SectionLabel right={<span className="text-[11px] text-muted-foreground">{queue.length} {queue.length === 1 ? "review" : "reviews"}</span>}>
                Authorization review queue
              </SectionLabel>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <Card key={i} className="p-5"><div className="h-16 rounded-lg bg-muted animate-pulse" /></Card>
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <Card>
                  <EmptyState icon={CheckCircle2} title="No authorization reviews match your filters." />
                </Card>
              ) : (
                <ul className="space-y-3">
                  {queue.slice(0, 25).map(a => (
                    <ReviewCard key={a.id} auth={a} onOpen={() => setOpenId(a.id)} />
                  ))}
                </ul>
              )}
            </section>

            {/* EXPIRING AUTHORIZATIONS */}
            <section>
              <SectionLabel>Expiring authorizations</SectionLabel>
              <Card className="p-4 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ExpiringGroup
                    label="Next 30 days" items={expiringGroups["0-30"]} tone="crit"
                    onOpen={(id) => setOpenId(id)}
                  />
                  <ExpiringGroup
                    label="31–60 days" items={expiringGroups["31-60"]} tone="warn"
                    onOpen={(id) => setOpenId(id)}
                  />
                  <ExpiringGroup
                    label="61–90 days" items={expiringGroups["61-90"]} tone="ok"
                    onOpen={(id) => setOpenId(id)}
                  />
                </div>
              </Card>
            </section>

            {/* MISSING INFORMATION */}
            <section>
              <SectionLabel right={<span className="text-[11px] text-muted-foreground">{missingInfo.length} blocked</span>}>
                Missing information
              </SectionLabel>
              {missingInfo.length === 0 ? (
                <Card><EmptyState icon={CheckCircle2} title="No blocked authorization reviews right now." /></Card>
              ) : (
                <Card>
                  <ul className="divide-y divide-border/60">
                    {missingInfo.slice(0, 8).map(a => {
                      const tone = urgencyOf(a);
                      return (
                        <li key={a.id} className="p-4 flex items-start gap-3">
                          <div className={cn("h-9 w-9 rounded-xl grid place-items-center border shrink-0", toneClasses("warn"))}>
                            <FileWarning className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">{a.clientName}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{a.payor} · {a.state}</span>
                            </div>
                            <div className="text-[12px] text-foreground mt-1">
                              <span className="text-muted-foreground">Missing:</span> {a.missingRequirements[0] ?? "Documentation needed"}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Pill tone={tone}>{a.daysInStage}d blocked</Pill>
                              <span className="text-[11px] text-muted-foreground">Owner: {a.coordinator}</span>
                              <span className="text-[11px] text-muted-foreground">QA: {a.qaOwner ?? "Unassigned"}</span>
                            </div>
                          </div>
                          <div className="hidden md:flex flex-col gap-1.5 shrink-0">
                            <IconBtn title="Send reminder" icon={Send} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Add note" icon={StickyNote} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Open record" icon={ExternalLink} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Escalate" icon={Flame} tone="crit" onClick={() => setOpenId(a.id)} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5">
            <section>
              <SectionLabel>Today's priorities</SectionLabel>
              <Card>
                {priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent priorities." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(a => {
                      const exp = daysUntil(a.expirationDate);
                      const tone = urgencyOf(a);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {a.payor} · {a.state}
                                </div>
                              </div>
                              <Pill tone={tone}>
                                {a.stage === "Denied" ? "Denied" :
                                 exp !== null && exp <= 14 ? `${exp}d exp` :
                                 `${a.daysInStage}d`}
                              </Pill>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </section>

            <section>
              <SectionLabel>QA workload</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {workload.map(w => (
                    <li key={w.name} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[10px] font-semibold shrink-0">
                            {w.name.split(" ").map(s => s[0]).join("").slice(0,2)}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{w.name}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{w.active}</span>
                      </div>
                      {(w.overdue > 0 || w.blocked > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.overdue > 0 && <Pill tone="crit">{w.overdue} overdue</Pill>}
                          {w.blocked > 0 && <Pill tone="warn">{w.blocked} blocked</Pill>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section>
              <SectionLabel>Operational Insights</SectionLabel>
              <Card className="p-4 bg-gradient-to-br from-primary/5 via-card to-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Brain className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="text-xs text-muted-foreground">QA review copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which auths need attention first?",
                    "What is expiring soon?",
                    "Which reviews are blocked?",
                    "Which BCBAs have not responded?",
                    "Show missing treatment plans.",
                  ].map(p => (
                    <Link key={p} to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block text-[12px] px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted transition text-foreground">
                      <Sparkles className="h-3 w-3 inline mr-1.5 text-primary" strokeWidth={2} />
                      {p}
                    </Link>
                  ))}
                </div>
              </Card>
            </section>
          </aside>
        </div>
      </div>

      {openItem && <DetailSlideout auth={openItem} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openItem.id)} />}
    </OSShell>
  );
}

// ---------- Sub-components ----------

function AwarenessCard({
  icon: Icon, label, value, tone,
}: { icon: React.ElementType; label: string; value: number; tone: Tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-xl grid place-items-center border shrink-0", toneClasses(tone))}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function FilterSelect({
  value, onChange, label, options,
}: {
  value: string; onChange: (v: string) => void; label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-full pl-3 pr-8 text-xs border transition appearance-none cursor-pointer",
          value === "all"
            ? "bg-card border-border/70 text-foreground hover:bg-muted"
            : "bg-primary/10 border-primary/30 text-primary",
        )}
        aria-label={label}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
    </div>
  );
}

function IconBtn({
  icon: Icon, title, tone, onClick,
}: { icon: React.ElementType; title: string; tone?: Tone; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={title} className={cn(
      "h-8 w-8 rounded-lg grid place-items-center border transition",
      tone === "crit"
        ? "border-destructive/20 text-destructive hover:bg-destructive/5"
        : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
    )}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
  );
}

function ReviewCard({ auth: a, onOpen }: { auth: Authorization; onOpen: () => void }) {
  const tone = urgencyOf(a);
  const status = workflowStatus(a);
  const exp = daysUntil(a.expirationDate);
  const due = daysUntil(a.nextTaskDue);
  const blocker = blockerOf(a);
  const accent =
    tone === "crit" ? "before:bg-destructive/70" :
    tone === "warn" ? "before:bg-amber-500/70" :
                      "before:bg-emerald-500/50";

  return (
    <li>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full",
        accent,
      )}>
        <button onClick={onOpen} className="w-full text-left p-5">
          <div className="flex items-start gap-3">
            <div className={cn("h-10 w-10 rounded-xl grid place-items-center border shrink-0", toneClasses(tone))}>
              <FileSignature className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{a.authType}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {a.payor} · {a.state} · {status}
              </div>

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Pill tone={tone}>{tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}</Pill>
                {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
                {a.stage === "Denied" && <Pill tone="crit">Escalated</Pill>}
                {exp !== null && exp <= 30 && exp >= 0 && (
                  <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>
                )}
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> QA: {a.qaOwner ?? "Unassigned"}
                </span>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> BCBA: {a.coordinator}
                </span>
                {due !== null && (
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `Due in ${due}d`}
                  </span>
                )}
              </div>

              {blocker && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 border border-border/60 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                  <div className="text-[12px] text-foreground">
                    <span className="text-muted-foreground">Blocker:</span> {blocker}
                  </div>
                </div>
              )}
              <div className="mt-2 text-[11px] text-muted-foreground">
                Next: {a.nextAction} · Updated {relTime(a.lastActivity)}
              </div>
            </div>
          </div>
        </button>
      </Card>
    </li>
  );
}

function ExpiringGroup({
  label, items, tone, onOpen,
}: { label: string; items: Authorization[]; tone: Tone; onOpen: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full",
            tone === "crit" ? "bg-destructive" : tone === "warn" ? "bg-amber-500" : "bg-emerald-500")} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center">
          <p className="text-[12px] text-muted-foreground">Nothing expiring.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map(a => {
            const d = daysUntil(a.expirationDate)!;
            return (
              <li key={a.id}>
                <button onClick={() => onOpen(a.id)}
                  className="w-full text-left rounded-xl border border-border/60 bg-card px-3 py-2.5 hover:bg-muted/40 hover:border-border transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{a.clientName}</span>
                    <Pill tone={tone}>{d}d</Pill>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {a.payor} · {a.state} · BCBA: {a.coordinator}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DetailSlideout({ auth: a, onClose, onChanged, sourceSystem }: { auth: Authorization; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const tone = urgencyOf(a);
  const status = workflowStatus(a);
  const blocker = blockerOf(a);
  const exp = daysUntil(a.expirationDate);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card border-l border-border/70 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{a.authType} · Authorization Review</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground truncate">{a.clientName}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">{a.payor} · {a.state}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={tone}>{tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}</Pill>
            <Pill tone={a.stage === "Denied" ? "crit" : a.stage === "Approved" ? "ok" : "warn"}>{status}</Pill>
            {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
            {exp !== null && exp >= 0 && exp <= 30 && <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="QA owner"      value={a.qaOwner ?? "Unassigned"} />
            <Fact label="BCBA"          value={a.coordinator} />
            <Fact label="Auth type"     value={a.authType} />
            <Fact label="Stage"         value={a.stage} />
            <Fact label="Days in stage" value={`${a.daysInStage}d`} />
            <Fact label="Hours"         value={String(a.hours ?? "—")} />
            <Fact label="Submitted"     value={a.submittedDate ?? "—"} />
            <Fact label="Approved"     value={a.approvedDate ?? "—"} />
            <Fact label="Expires"       value={a.expirationDate ?? "—"} />
            <Fact label="Next due"      value={a.nextTaskDue ?? "—"} />
          </div>

          <section>
            <SectionLabel>Next required action</SectionLabel>
            <Card className="p-3.5 text-sm text-foreground">{a.nextAction}</Card>
          </section>

          <section>
            <SectionLabel>Treatment plan & PR status</SectionLabel>
            <Card className="p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Treatment plan received</span>
                <Pill tone={a.treatmentPlanReceived ? "ok" : "warn"}>
                  {a.treatmentPlanReceived ? "Received" : "Pending"}
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Progress report</span>
                <Pill tone={a.missingInfo ? "warn" : "ok"}>
                  {a.missingInfo ? "Outstanding" : "On track"}
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QA status</span>
                <Pill tone={a.qaStatus === "Complete" ? "ok" : a.qaStatus === "In Review" ? "warn" : "ok"}>{a.qaStatus}</Pill>
              </div>
            </Card>
          </section>

          {blocker && (
            <section>
              <SectionLabel>Blockers</SectionLabel>
              <Card className="p-3.5">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-foreground">{blocker}</span>
                </div>
                {a.missingRequirements.length > 1 && (
                  <ul className="mt-2 ml-6 list-disc text-xs text-muted-foreground space-y-0.5">
                    {a.missingRequirements.slice(1).map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </Card>
            </section>
          )}

          {a.denialReason && (
            <section>
              <SectionLabel>Denial reason</SectionLabel>
              <Card className="p-3.5 text-sm text-destructive">{a.denialReason}</Card>
            </section>
          )}

          <section>
            <SectionLabel>Authorization timeline</SectionLabel>
            <Card className="p-3">
              {a.timeline.length === 0 ? (
                <EmptyState icon={History} title="No activity yet." />
              ) : (
                <ol className="space-y-3">
                  {a.timeline.slice(0, 8).map(e => (
                    <li key={e.id} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted grid place-items-center shrink-0">
                        <Activity className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-foreground">{e.description}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{relTime(e.timestamp)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </section>

          <section className="space-y-2 pt-1">
            <SectionLabel>Actions</SectionLabel>
<QAActionsPanel auth={a} variant="auth-review" sourceSystem={sourceSystem} onChanged={onChanged} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone?: Tone }) {
  return (
    <button className={cn(
      "h-9 px-3 rounded-xl text-xs font-medium border transition inline-flex items-center justify-center gap-1.5",
      tone === "crit"
        ? "border-destructive/20 text-destructive hover:bg-destructive/5"
        : "border-border/70 text-foreground bg-card hover:bg-muted",
    )}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

// Silence unused-import warning when ShieldCheck is referenced via icon prop only later.
void ShieldCheck;
