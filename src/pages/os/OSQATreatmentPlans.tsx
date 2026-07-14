import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, Inbox, ClipboardCheck, AlertTriangle, X, ChevronRight,
  Users, Activity, History, Calendar, FileSearch, ListChecks,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";

// Treatment Plan Reviews — operational QC layer for treatment plan workflows.
// Real data only via useLiveAuthorizations. TP review derives from
// treatmentPlanReceived, stage (In QA Review / Awaiting Submission / Denied),
// missingInfo + missingRequirements, expiration windows, and BCBA cycle time.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "review" | "missing" | "ready" | "expiring" | "escalation";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

// ---------- helpers ----------
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

// ---------- TP review derivation ----------
const SIG_KW = /sign|signature/i;
const PR_KW  = /progress report|\bpr\b/i;

function hasSignatureBlocker(a: Authorization): boolean {
  return a.missingRequirements.some(m => SIG_KW.test(m));
}
function hasPRBlocker(a: Authorization): boolean {
  return a.missingRequirements.some(m => PR_KW.test(m));
}

// TP review is relevant once treatment plan has been received, OR the auth
// is actively coordinating one (In QA Review / Awaiting Submission / Denied).
function isTPRelevant(a: Authorization): boolean {
  if (a.stage === "Flaked Client") return false;
  if (a.stage === "Approved") {
    const d = daysUntil(a.approvedDate);
    return d !== null && d >= -7 && d <= 0;
  }
  if (a.treatmentPlanReceived) return true;
  return a.stage === "In QA Review" || a.stage === "Awaiting Submission"
      || a.stage === "Submitted"    || a.stage === "Denied";
}

type TPStatus =
  | "In QA Review" | "Missing Information" | "Waiting on BCBA"
  | "Waiting on Signature" | "Ready for Submission" | "Expiring Soon"
  | "Escalated" | "Approved" | "Blocked";

function tpStatus(a: Authorization): TPStatus {
  if (a.stage === "Denied") return "Escalated";
  if (a.stage === "Approved") return "Approved";
  if (a.missingInfo && hasSignatureBlocker(a)) return "Waiting on Signature";
  if (a.missingInfo) return "Missing Information";
  if (a.stage === "In QA Review") {
    if (a.daysInStage > 7) return "Waiting on BCBA";
    return "In QA Review";
  }
  if (a.stage === "Awaiting Submission" || a.stage === "Submitted") {
    const d = daysUntil(a.expirationDate);
    if (d !== null && d <= 14 && d >= 0) return "Expiring Soon";
    return "Ready for Submission";
  }
  return "Blocked";
}

function tpUrgency(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  const d = daysUntil(a.expirationDate);
  if (d !== null && d >= 0 && d <= 7) return "crit";
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return "crit";
  if (a.missingInfo) return "warn";
  if (d !== null && d >= 0 && d <= 30) return "warn";
  if (a.daysInStage > 5) return "warn";
  return "ok";
}

function blockerOf(a: Authorization): string | null {
  if (a.stage === "Denied") return a.denialReason ? `Denial: ${a.denialReason}` : "Denial — escalated";
  if (a.missingInfo) return a.missingRequirements[0] ?? "Missing documentation";
  if (a.stage === "In QA Review" && a.daysInStage > 7) return "BCBA hasn't responded to QA feedback";
  if (a.stage === "Awaiting Submission" && a.daysInStage > 5) return "Awaiting submission action";
  return null;
}

function recommendedNext(req: string): string {
  if (SIG_KW.test(req)) return "Request signature";
  if (PR_KW.test(req))  return "Request progress report";
  if (/bcba|clinical/i.test(req)) return "Ping BCBA";
  return "Request from BCBA";
}

function isActive(a: Authorization): boolean {
  return a.stage !== "Approved" && a.stage !== "Flaked Client";
}
function isEscalated(a: Authorization): boolean {
  if (a.stage === "Denied") return true;
  const d = daysUntil(a.expirationDate);
  if (d !== null && d >= 0 && d <= 7) return true;
  if (a.daysInStage > 10 && (a.stage === "In QA Review" || a.stage === "Awaiting Submission")) return true;
  return false;
}
function isExpiringSoon(a: Authorization): boolean {
  const d = daysUntil(a.expirationDate);
  return d !== null && d >= 0 && d <= 90 && isActive(a);
}

// Readiness checklist for slideout.
function readinessChecklist(a: Authorization): { label: string; done: boolean }[] {
  return [
    { label: "Treatment plan received",   done: a.treatmentPlanReceived },
    { label: "QA review complete",        done: a.qaStatus === "Complete" || a.stage === "Awaiting Submission" || a.stage === "Submitted" || a.stage === "Approved" },
    { label: "Progress report on file",   done: !hasPRBlocker(a) },
    { label: "Required signatures",       done: !hasSignatureBlocker(a) },
    { label: "No missing documentation",  done: !a.missingInfo },
    { label: "Ready for submission",      done: a.stage === "Awaiting Submission" || a.stage === "Submitted" || a.stage === "Approved" },
  ];
}

// ---------- page ----------
export default function OSQATreatmentPlans() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();

  const tps = useMemo(() => items.filter(isTPRelevant), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  useQADeepLink({ items, loading, setOpenId, setQuery, setBcbaFilter });

  const states = useMemo(() => Array.from(new Set(tps.map(a => a.state).filter(Boolean))).sort(), [tps]);
  const bcbas  = useMemo(() => Array.from(new Set(tps.map(a => a.coordinator).filter(Boolean))).sort(), [tps]);
  const owners = useMemo(() => {
    const s = new Set<string>();
    tps.forEach(a => { if (a.qaOwner) s.add(a.qaOwner); });
    return Array.from(s).sort();
  }, [tps]);
  const statuses = useMemo(() => Array.from(new Set(tps.map(tpStatus))).sort(), [tps]);

  const tabbed = useMemo(() => ({
    all:        tps.filter(isActive),
    review:     tps.filter(a => a.stage === "In QA Review"),
    missing:    tps.filter(a => a.missingInfo),
    ready:      tps.filter(a => a.stage === "Awaiting Submission" || a.stage === "Submitted"),
    expiring:   tps.filter(isExpiringSoon),
    escalation: tps.filter(isEscalated),
  } as Record<TabKey, Authorization[]>), [tps]);

  const counts = useMemo(() => ({
    all: tabbed.all.length,
    review: tabbed.review.length,
    missing: tabbed.missing.length,
    ready: tabbed.ready.length,
    expiring: tabbed.expiring.length,
    escalation: tabbed.escalation.length,
  }), [tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(a => {
      if (stateFilter !== "all"  && a.state !== stateFilter) return false;
      if (bcbaFilter !== "all"   && a.coordinator !== bcbaFilter) return false;
      if (ownerFilter !== "all"  && a.qaOwner !== ownerFilter) return false;
      if (statusFilter !== "all" && tpStatus(a) !== statusFilter) return false;
      if (urgencyFilter !== "all" && tpUrgency(a) !== urgencyFilter) return false;
      if (escFilter === "escalated" && !isEscalated(a)) return false;
      if (escFilter === "normal" && isEscalated(a)) return false;
      if (q) {
        const hay = [a.clientName, a.coordinator, a.qaOwner ?? "", a.state, a.payor, tpStatus(a), a.authType]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => {
      const rank = (z: Authorization) => tpUrgency(z) === "crit" ? 3 : tpUrgency(z) === "warn" ? 2 : 1;
      const r = rank(y) - rank(x);
      if (r !== 0) return r;
      return (daysUntil(x.expirationDate) ?? 9999) - (daysUntil(y.expirationDate) ?? 9999);
    });
  }, [tabbed, tab, query, stateFilter, bcbaFilter, ownerFilter, statusFilter, urgencyFilter, escFilter]);

  const priorities = useMemo(() => {
    return [...tabbed.escalation, ...tabbed.missing, ...tabbed.expiring]
      .filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i)
      .sort((a, b) => (daysUntil(a.expirationDate) ?? 999) - (daysUntil(b.expirationDate) ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const bcbaFollowUps = useMemo(() => {
    return tps
      .filter(a => a.missingInfo || (a.stage === "In QA Review" && a.daysInStage > 5))
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 6);
  }, [tps]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = tps.filter(a => a.qaOwner === name);
      return {
        name,
        active:  owned.filter(isActive).length,
        blocked: owned.filter(a => a.missingInfo && isActive(a)).length,
        overdue: owned.filter(a => isActive(a) && a.daysInStage > 7).length,
      };
    });
  }, [tps]);

  // Expiration window groupings
  const expWindows = useMemo(() => ({
    w30: tabbed.expiring.filter(a => (daysUntil(a.expirationDate) ?? 999) <= 30),
    w60: tabbed.expiring.filter(a => { const d = daysUntil(a.expirationDate) ?? 999; return d > 30 && d <= 60; }),
    w90: tabbed.expiring.filter(a => { const d = daysUntil(a.expirationDate) ?? 999; return d > 60 && d <= 90; }),
  }), [tabbed]);

  const openItem = tps.find(a => a.id === openId) ?? null;
  const blockedCount = counts.missing;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",        label: "All Active",        count: counts.all },
    { key: "review",     label: "In QA Review",      count: counts.review },
    { key: "missing",    label: "Missing Info",      count: counts.missing,    tone: "warn" },
    { key: "ready",      label: "Ready",             count: counts.ready,      tone: "ok" },
    { key: "expiring",   label: "Expiring Soon",     count: counts.expiring,   tone: "warn" },
    { key: "escalation", label: "Escalations",       count: counts.escalation, tone: "crit" },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Treatment Plan Reviews</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Review treatment plans, identify blockers, and prepare workflows for authorization readiness.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.all} active
              </span>
              {blockedCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {blockedCount} blocked
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, BCBA, treatment plan, authorization, or workflow..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...owners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status"
              options={[{ value: "all", label: "All statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "Escalated" },
                { value: "normal", label: "Normal" },
              ]} />
            <FilterSelect value={urgencyFilter} onChange={setUrgencyFilter} label="Urgency"
              options={[
                { value: "all", label: "All urgency" },
                { value: "crit", label: "Critical" },
                { value: "warn", label: "High" },
                { value: "ok",   label: "Normal" },
              ]} />
          </div>
        </header>

        {/* AWARENESS CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwareCard icon={FileSearch}    label="In QA Review"        value={counts.review} />
          <AwareCard icon={AlertTriangle} label="Missing Information" value={counts.missing}    tone="warn" />
          <AwareCard icon={CheckCircle2}  label="Ready for Submission" value={counts.ready}     tone="ok" />
          <AwareCard icon={Calendar}      label="Expiring Soon"       value={counts.expiring}   tone="warn" />
          <AwareCard icon={Flame}         label="Escalated Reviews"   value={counts.escalation} tone="crit" />
        </section>

        {/* TABS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium transition whitespace-nowrap border",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border/70 hover:bg-muted",
                )}>
                {t.label}
                <span className={cn(
                  "tabular-nums text-[11px] px-1.5 py-0.5 rounded-full",
                  active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>{t.count}</span>
                {t.tone === "crit" && !active && t.count > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <main className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">
                {visible.length} {visible.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <Card key={i} className="p-5"><div className="h-20 rounded-lg bg-muted animate-pulse" /></Card>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <Card>
                <EmptyState
                  icon={CheckCircle2}
                  title={
                    tab === "missing"    ? "No blocked treatment plans right now." :
                    tab === "escalation" ? "No escalations requiring attention." :
                    tab === "expiring"   ? "No reviews expiring in this window." :
                    tab === "review"     ? "No treatment plans in QA review." :
                    tab === "ready"      ? "Nothing ready for submission yet." :
                                           "No overdue reviews today."
                  }
                />
              </Card>
            ) : (
              <ul className="space-y-3">
                {visible.map(a => (
                  <TPCard key={a.id} auth={a} onOpen={() => setOpenId(a.id)} />
                ))}
              </ul>
            )}

            {/* MISSING INFORMATION (inline, when on All) */}
            {tab === "all" && tabbed.missing.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Missing information</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.missing.slice(0, 6).map(a => {
                      const req = a.missingRequirements[0] ?? "Missing documentation";
                      const tone = tpUrgency(a);
                      return (
                        <li key={a.id} className="p-3.5 flex items-start gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 grid place-items-center shrink-0">
                            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => setOpenId(a.id)} className="text-left w-full">
                              <div className="text-sm font-medium text-foreground truncate">
                                {a.clientName} <span className="text-muted-foreground font-normal">— {req}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                Owner: {a.coordinator} · {a.daysInStage}d blocked · Next: {recommendedNext(req)}
                              </div>
                            </button>
                          </div>
                          <Pill tone={tone}>
                            {a.daysInStage}d
                          </Pill>
                          <div className="hidden md:flex items-center gap-1.5 shrink-0">
                            <IconBtn title="Send reminder" icon={Send} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Add note" icon={StickyNote} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Escalate" icon={Flame} tone="crit" onClick={() => setOpenId(a.id)} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}

            {/* EXPIRATION READINESS (inline, when on All or Expiring) */}
            {(tab === "all" || tab === "expiring") && (expWindows.w30.length + expWindows.w60.length + expWindows.w90.length) > 0 && (
              <section className="pt-4">
                <SectionLabel>Expiration & readiness</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <ExpGroup title="Next 30 days"    items={expWindows.w30} tone="crit" onOpen={setOpenId} />
                  <ExpGroup title="31 – 60 days"    items={expWindows.w60} tone="warn" onOpen={setOpenId} />
                  <ExpGroup title="61 – 90 days"    items={expWindows.w90} tone="ok"   onOpen={setOpenId} />
                </div>
              </section>
            )}

            {/* BCBA FOLLOW-UP TRACKER (inline, when on All) */}
            {tab === "all" && bcbaFollowUps.length > 0 && (
              <section className="pt-4">
                <SectionLabel>BCBA follow-up tracker</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {bcbaFollowUps.map(a => {
                      const tone = tpUrgency(a);
                      const req = a.missingRequirements[0] ?? "QA feedback pending";
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)}
                            className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                              <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">
                                {a.coordinator} <span className="text-muted-foreground font-normal">→ {a.clientName}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {a.daysInStage}d waiting · {req} · {a.state}
                              </div>
                            </div>
                            <Pill tone={tone}>{a.daysInStage}d</Pill>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="space-y-5">
            <section>
              <SectionLabel>Today's priorities</SectionLabel>
              <Card>
                {priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent priorities." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(a => {
                      const d = daysUntil(a.expirationDate);
                      const tone = tpUrgency(a);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {tpStatus(a)} · {a.state}
                                </div>
                              </div>
                              <Pill tone={tone}>
                                {a.stage === "Denied" ? "Denied" :
                                 d !== null && d <= 14 ? `${d}d exp` :
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
              <SectionLabel>QA workload snapshot</SectionLabel>
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
                  <div className="text-xs text-muted-foreground">Treatment plan copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which treatment plans are blocked?",
                    "What needs escalation?",
                    "Which auths are expiring soon?",
                    "Which BCBAs have not responded?",
                    "Show missing documentation items.",
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

      {openItem && <TPSlideout auth={openItem} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openItem.id)} />}
    </OSShell>
  );
}

// ---------- sub-components ----------
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
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">{children}</div>
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
      <select value={value} onChange={e => onChange(e.target.value)}
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

function AwareCard({
  icon: Icon, label, value, tone,
}: { icon: React.ElementType; label: string; value: number; tone?: Tone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <div className={cn("h-9 w-9 rounded-xl grid place-items-center border", toneClasses(tone ?? "ok"))}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function TPCard({ auth: a, onOpen }: { auth: Authorization; onOpen: () => void }) {
  const tone = tpUrgency(a);
  const status = tpStatus(a);
  const exp = daysUntil(a.expirationDate);
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
        <div className="flex items-start gap-3 p-5">
          <button onClick={onOpen} className="flex-1 text-left min-w-0">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl grid place-items-center border shrink-0",
                toneClasses(tone),
              )}>
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{a.authType} · {a.payor}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.state} · {status}
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Pill tone={tone}>{tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}</Pill>
                  {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
                  {hasSignatureBlocker(a) && <Pill tone="warn">Signature pending</Pill>}
                  {hasPRBlocker(a) && <Pill tone="warn">PR pending</Pill>}
                  {a.stage === "Denied" && <Pill tone="crit">Escalated</Pill>}
                  {exp !== null && exp >= 0 && exp <= 30 && (
                    <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>
                  )}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> BCBA: {a.coordinator}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> QA: {a.qaOwner ?? "Unassigned"}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.daysInStage}d in stage
                  </span>
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

          <div className="hidden md:flex flex-col gap-1.5 shrink-0">
            <IconBtn title="Open record" icon={ExternalLink} onClick={onOpen} />
            <IconBtn title="Mark reviewed" icon={CheckCircle2} onClick={onOpen} />
            <IconBtn title="Request missing info" icon={ListChecks} onClick={onOpen} />
            <IconBtn title="Escalate" icon={Flame} tone="crit" onClick={onOpen} />
          </div>
        </div>
      </Card>
    </li>
  );
}

function ExpGroup({
  title, items, tone, onOpen,
}: { title: string; items: Authorization[]; tone: Tone; onOpen: (id: string) => void }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-foreground">{title}</div>
        <Pill tone={tone}>{items.length}</Pill>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-muted-foreground py-2">No items in this window.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 5).map(a => {
            const d = daysUntil(a.expirationDate);
            return (
              <li key={a.id}>
                <button onClick={() => onOpen(a.id)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted/60 transition">
                  <div className="text-sm text-foreground truncate">{a.clientName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {a.coordinator} · TP: {a.treatmentPlanReceived ? "✓" : "—"} · PR: {hasPRBlocker(a) ? "—" : "✓"} · {d}d
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function IconBtn({
  icon: Icon, title, tone, to, onClick,
}: { icon: React.ElementType; title: string; tone?: Tone; to?: string; onClick?: () => void }) {
  const cls = cn(
    "h-8 w-8 rounded-lg grid place-items-center border transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
  );
  if (to) return <Link to={to} title={title} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>;
  return <button title={title} onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function TPSlideout({ auth: a, onClose, onChanged, sourceSystem }: { auth: Authorization; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const tone = tpUrgency(a);
  const status = tpStatus(a);
  const blocker = blockerOf(a);
  const exp = daysUntil(a.expirationDate);
  const checklist = readinessChecklist(a);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-card border-l border-border/70 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Treatment Plan Review</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground truncate">{a.clientName}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">{a.authType} · {a.payor} · {a.state}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={tone}>{tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}</Pill>
            <Pill tone={a.stage === "Denied" ? "crit" : a.stage === "Approved" ? "ok" : a.missingInfo ? "warn" : "ok"}>{status}</Pill>
            {exp !== null && exp >= 0 && exp <= 30 && <Pill tone={exp <= 7 ? "crit" : "warn"}>Exp in {exp}d</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="BCBA"           value={a.coordinator} />
            <Fact label="QA owner"       value={a.qaOwner ?? "Unassigned"} />
            <Fact label="Auth type"      value={a.authType} />
            <Fact label="Stage"          value={a.stage} />
            <Fact label="Days in stage"  value={`${a.daysInStage}d`} />
            <Fact label="QA status"      value={a.qaStatus} />
            <Fact label="Submitted"      value={a.submittedDate ?? "—"} />
            <Fact label="Expires"        value={a.expirationDate ?? "—"} />
          </div>

          <section>
            <SectionLabel>Readiness checklist</SectionLabel>
            <Card className="p-4">
              <ul className="space-y-2.5">
                {checklist.map(c => (
                  <li key={c.label} className="flex items-center gap-2.5 text-sm">
                    <span className={cn(
                      "h-5 w-5 rounded-full grid place-items-center shrink-0 border",
                      c.done
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted border-border/60 text-muted-foreground",
                    )}>
                      {c.done ? <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                    </span>
                    <span className={cn(c.done ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {a.missingRequirements.length > 0 && (
            <section>
              <SectionLabel>Missing information</SectionLabel>
              <Card className="p-4">
                <ul className="space-y-2">
                  {a.missingRequirements.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                      <div className="flex-1">
                        <div className="text-foreground">{m}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Next: {recommendedNext(m)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <section>
            <SectionLabel>Next required action</SectionLabel>
            <Card className="p-3.5 text-sm text-foreground">{a.nextAction}</Card>
          </section>

          {blocker && (
            <section>
              <SectionLabel>Blockers</SectionLabel>
              <Card className="p-3.5">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-foreground">{blocker}</span>
                </div>
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
            <SectionLabel>Workflow timeline</SectionLabel>
            <Card className="p-3">
              {a.timeline.length === 0 ? (
                <EmptyState icon={History} title="No activity yet." />
              ) : (
                <ol className="space-y-3">
                  {a.timeline.slice(0, 6).map(e => (
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
            <Link to="/qa-queue"
              className="h-9 px-3 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center justify-center gap-1.5 w-full">
              <ExternalLink className="h-3.5 w-3.5" /> Open review
            </Link>
            <QAActionsPanel auth={a} variant="treatment-plan" sourceSystem={sourceSystem} onChanged={onChanged} />
          </section>

          <ClinicalDirectorSection
            sourceType="authorization"
            sourceRecordId={a.id}
            clientId={a.clientId}
            clientName={a.clientName}
            bcbaName={a.coordinator}
            state={a.state}
            defaultTitle={`Treatment plan review: ${a.clientName}`}
            metadata={{
              stage: a.stage,
              treatmentPlanReceived: a.treatmentPlanReceived,
              missingRequirements: a.missingRequirements,
              expirationDate: a.expirationDate,
              centralReachClientId: a.clientId ?? null,
            }}
          />
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