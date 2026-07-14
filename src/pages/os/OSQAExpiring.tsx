import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, Inbox, AlertTriangle, X, ChevronRight,
  Users, Activity, History, Calendar, ClipboardCheck, FileText, Hourglass,
  TrendingUp, Send as SendIcon,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";

// Expiring Items — operational expiration prevention center for QA.
// Real data only via useLiveAuthorizations. Each card is derived from
// expirationDate windows, PR/TP readiness, QA status, and stage age.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "w30" | "w60" | "w90" | "highrisk" | "ready";

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

// ---------- expiration derivation ----------
const SIG_KW = /sign|signature/i;
const PR_KW  = /progress report|\bpr\b/i;
const TP_KW  = /treatment plan|\btp\b/i;

function hasSignatureBlocker(a: Authorization): boolean {
  return a.missingRequirements.some(m => SIG_KW.test(m));
}
function hasPRBlocker(a: Authorization): boolean {
  return a.missingRequirements.some(m => PR_KW.test(m)) || (!a.treatmentPlanReceived && a.missingRequirements.some(m => PR_KW.test(m)));
}
function hasTPBlocker(a: Authorization): boolean {
  return !a.treatmentPlanReceived || a.missingRequirements.some(m => TP_KW.test(m));
}

function isExpirationRelevant(a: Authorization): boolean {
  if (a.stage === "Flaked Client") return false;
  if (a.stage === "Approved") return false;
  const d = daysUntil(a.expirationDate);
  return d !== null && d <= 120; // within 4 months, including overdue
}

type WfStatus =
  | "Awaiting PR" | "Awaiting Treatment Plan" | "Waiting on BCBA" | "In QA Review"
  | "Missing Information" | "Ready for Submission" | "Submitted" | "Escalated" | "High Risk";

function wfStatus(a: Authorization): WfStatus {
  if (a.stage === "Denied") return "Escalated";
  if (a.stage === "Submitted") return "Submitted";
  if (a.stage === "Awaiting Submission") {
    const d = daysUntil(a.expirationDate);
    if (d !== null && d <= 14) return "High Risk";
    return "Ready for Submission";
  }
  if (hasPRBlocker(a)) return "Awaiting PR";
  if (hasTPBlocker(a)) return "Awaiting Treatment Plan";
  if (a.missingInfo) return "Missing Information";
  if (a.stage === "In QA Review") {
    if (a.daysInStage > 7) return "Waiting on BCBA";
    return "In QA Review";
  }
  return "In QA Review";
}

function urgencyOf(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  const d = daysUntil(a.expirationDate);
  if (d === null) return "ok";
  if (d < 0) return "crit";
  if (d <= 14) return "crit";
  if (d <= 30) return "warn";
  if (a.daysInStage > 10) return "warn";
  if (a.missingInfo && d <= 60) return "warn";
  return "ok";
}

function isHighRisk(a: Authorization): boolean {
  const d = daysUntil(a.expirationDate);
  if (d !== null && d < 0) return true;
  if (d !== null && d <= 14) return true;
  if (a.stage === "Denied") return true;
  if (hasPRBlocker(a) && d !== null && d <= 45) return true;
  if (hasTPBlocker(a) && d !== null && d <= 45) return true;
  if (a.daysInStage > 14 && d !== null && d <= 60) return true;
  return false;
}

function blockerOf(a: Authorization): string | null {
  if (a.stage === "Denied") return a.denialReason ? `Denial: ${a.denialReason}` : "Denial — escalated";
  if (hasPRBlocker(a)) return "Missing progress report";
  if (hasTPBlocker(a)) return "Treatment plan not received";
  if (a.missingInfo) return a.missingRequirements[0] ?? "Missing documentation";
  if (a.stage === "In QA Review" && a.daysInStage > 7) return "BCBA hasn't responded to QA feedback";
  return null;
}

// Blossom outreach rules per state — GA vs other states.
function outreachOwner(a: Authorization, weeksOut: number): string {
  const ga = a.state === "GA" || /georgia/i.test(a.state);
  if (ga) {
    if (weeksOut >= 9) return "Rivky Weissman";
    if (weeksOut >= 6) return "Shira + Rachel";
    return "QA / SD";
  }
  if (weeksOut >= 9) return "Rikki Wallach";
  if (weeksOut >= 6) return "Julianne + SD";
  return "QA / SD";
}

function readinessChecklist(a: Authorization): { label: string; done: boolean }[] {
  return [
    { label: "Treatment plan received",   done: a.treatmentPlanReceived },
    { label: "Progress report on file",   done: !hasPRBlocker(a) },
    { label: "Required signatures",       done: !hasSignatureBlocker(a) },
    { label: "QA review complete",        done: a.qaStatus === "Complete" || a.stage === "Awaiting Submission" || a.stage === "Submitted" },
    { label: "No missing documentation",  done: !a.missingInfo },
    { label: "Ready for submission",      done: a.stage === "Awaiting Submission" || a.stage === "Submitted" },
  ];
}

// ---------- page ----------
export default function OSQAExpiring() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const expiring = useMemo(() => items.filter(isExpirationRelevant), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [payorFilter, setPayorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  useQADeepLink({ items, loading, setOpenId, setQuery, setBcbaFilter });

  const states  = useMemo(() => Array.from(new Set(expiring.map(a => a.state).filter(Boolean))).sort(), [expiring]);
  const payors  = useMemo(() => Array.from(new Set(expiring.map(a => a.payor).filter(Boolean))).sort(), [expiring]);
  const bcbas   = useMemo(() => Array.from(new Set(expiring.map(a => a.coordinator).filter(Boolean))).sort(), [expiring]);
  const owners  = useMemo(() => {
    const s = new Set<string>();
    expiring.forEach(a => { if (a.qaOwner) s.add(a.qaOwner); });
    return Array.from(s).sort();
  }, [expiring]);
  const statuses = useMemo(() => Array.from(new Set(expiring.map(wfStatus))).sort(), [expiring]);

  const buckets = useMemo(() => {
    const w30: Authorization[] = [], w60: Authorization[] = [], w90: Authorization[] = [], over: Authorization[] = [];
    expiring.forEach(a => {
      const d = daysUntil(a.expirationDate);
      if (d === null) return;
      if (d < 0) over.push(a);
      else if (d <= 30) w30.push(a);
      else if (d <= 60) w60.push(a);
      else if (d <= 90) w90.push(a);
    });
    return { w30, w60, w90, over };
  }, [expiring]);

  const tabbed = useMemo(() => ({
    all:       expiring,
    w30:       [...buckets.over, ...buckets.w30],
    w60:       buckets.w60,
    w90:       buckets.w90,
    highrisk:  expiring.filter(isHighRisk),
    ready:     expiring.filter(a => a.stage === "Awaiting Submission" || a.stage === "Submitted"),
  } as Record<TabKey, Authorization[]>), [expiring, buckets]);

  const counts = {
    all:      tabbed.all.length,
    w30:      tabbed.w30.length,
    w60:      tabbed.w60.length,
    w90:      tabbed.w90.length,
    highrisk: tabbed.highrisk.length,
    ready:    tabbed.ready.length,
  };

  const awareCounts = useMemo(() => ({
    w30:     tabbed.w30.length,
    pr:      expiring.filter(a => hasPRBlocker(a)).length,
    tp:      expiring.filter(a => hasTPBlocker(a) && !hasPRBlocker(a)).length,
    esc:     expiring.filter(a => a.stage === "Denied" || (daysUntil(a.expirationDate) ?? 999) < 0).length,
    ready:   tabbed.ready.length,
  }), [expiring, tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(a => {
      if (stateFilter !== "all"   && a.state !== stateFilter) return false;
      if (payorFilter !== "all"   && a.payor !== payorFilter) return false;
      if (statusFilter !== "all"  && wfStatus(a) !== statusFilter) return false;
      if (bcbaFilter !== "all"    && a.coordinator !== bcbaFilter) return false;
      if (ownerFilter !== "all"   && a.qaOwner !== ownerFilter) return false;
      if (urgencyFilter !== "all" && urgencyOf(a) !== urgencyFilter) return false;
      if (escFilter === "escalated" && !isHighRisk(a)) return false;
      if (escFilter === "normal"    && isHighRisk(a)) return false;
      if (windowFilter !== "all") {
        const d = daysUntil(a.expirationDate);
        if (d === null) return false;
        if (windowFilter === "over"  && !(d < 0)) return false;
        if (windowFilter === "w30"   && !(d >= 0 && d <= 30)) return false;
        if (windowFilter === "w60"   && !(d > 30 && d <= 60)) return false;
        if (windowFilter === "w90"   && !(d > 60 && d <= 90)) return false;
        if (windowFilter === "w120"  && !(d > 90 && d <= 120)) return false;
      }
      if (q) {
        const hay = [a.clientName, a.coordinator, a.qaOwner ?? "", a.state, a.payor, wfStatus(a), a.authType].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => (daysUntil(x.expirationDate) ?? 9999) - (daysUntil(y.expirationDate) ?? 9999));
  }, [tabbed, tab, query, stateFilter, payorFilter, statusFilter, bcbaFilter, ownerFilter, urgencyFilter, escFilter, windowFilter]);

  const todayRisks = useMemo(() => {
    return expiring
      .filter(a => isHighRisk(a))
      .sort((a, b) => (daysUntil(a.expirationDate) ?? 9999) - (daysUntil(b.expirationDate) ?? 9999))
      .slice(0, 6);
  }, [expiring]);

  const prTracker = useMemo(() => {
    return expiring
      .filter(a => hasPRBlocker(a) || hasTPBlocker(a))
      .sort((a, b) => (daysUntil(a.expirationDate) ?? 9999) - (daysUntil(b.expirationDate) ?? 9999))
      .slice(0, 6);
  }, [expiring]);

  const bcbaFollow = useMemo(() => {
    return expiring
      .filter(a => (a.stage === "In QA Review" && a.daysInStage > 5) || hasPRBlocker(a) || hasTPBlocker(a))
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 6);
  }, [expiring]);

  const workload = useMemo(() => QA_TEAM.map(name => {
    const owned = expiring.filter(a => a.qaOwner === name);
    return {
      name,
      active:    owned.length,
      overdue:   owned.filter(a => (daysUntil(a.expirationDate) ?? 999) < 0).length,
      escalated: owned.filter(isHighRisk).length,
    };
  }), [expiring]);

  const openItem = expiring.find(a => a.id === openId) ?? null;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",      label: "All Expiring",        count: counts.all },
    { key: "w30",      label: "Next 30 Days",        count: counts.w30,      tone: "crit" },
    { key: "w60",      label: "31 – 60 Days",        count: counts.w60,      tone: "warn" },
    { key: "w90",      label: "61 – 90 Days",        count: counts.w90 },
    { key: "highrisk", label: "High Risk",           count: counts.highrisk, tone: "crit" },
    { key: "ready",    label: "Ready for Submission", count: counts.ready,   tone: "ok" },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Expiring Items</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Track upcoming expirations, reassessments, PR deadlines, and renewal readiness.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Hourglass className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {awareCounts.w30} in 30d
              </span>
              {counts.highrisk > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {counts.highrisk} high risk
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, BCBA, authorization, expiration, PR, or reassessment..."
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
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...owners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={windowFilter} onChange={setWindowFilter} label="Window"
              options={[
                { value: "all",  label: "Any window" },
                { value: "over", label: "Overdue" },
                { value: "w30",  label: "0 – 30 days" },
                { value: "w60",  label: "31 – 60 days" },
                { value: "w90",  label: "61 – 90 days" },
                { value: "w120", label: "91 – 120 days" },
              ]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "High risk" },
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
          <AwareCard icon={Calendar}       label="Expiring Within 30 Days" value={awareCounts.w30}   tone="crit" />
          <AwareCard icon={FileText}       label="Awaiting PR"             value={awareCounts.pr}    tone="warn" />
          <AwareCard icon={ClipboardCheck} label="Awaiting Treatment Plan" value={awareCounts.tp}    tone="warn" />
          <AwareCard icon={Flame}          label="Escalations Active"      value={awareCounts.esc}   tone="crit" />
          <AwareCard icon={CheckCircle2}   label="Ready for Submission"    value={awareCounts.ready} tone="ok" />
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
                {visible.length} {visible.length === 1 ? "expiring item" : "expiring items"}
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
                    tab === "w30"      ? "No urgent expirations right now." :
                    tab === "w60"      ? "Nothing expiring in this window." :
                    tab === "w90"      ? "Nothing expiring in this window." :
                    tab === "highrisk" ? "No high-risk expirations today." :
                    tab === "ready"    ? "Nothing ready for submission yet." :
                                         "No expirations in scope."
                  }
                />
              </Card>
            ) : tab === "all" ? (
              <div className="space-y-6">
                <ExpGroup title="High risk / Overdue" tone="crit" items={[...buckets.over, ...buckets.w30.filter(a => isHighRisk(a))]} onOpen={setOpenId} />
                <ExpGroup title="Next 30 days" tone="crit" items={buckets.w30.filter(a => !isHighRisk(a))} onOpen={setOpenId} />
                <ExpGroup title="31 – 60 days" tone="warn" items={buckets.w60} onOpen={setOpenId} />
                <ExpGroup title="61 – 90 days" tone="ok"   items={buckets.w90} onOpen={setOpenId} />
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map(a => (
                  <ExpCard key={a.id} auth={a} onOpen={() => setOpenId(a.id)} />
                ))}
              </ul>
            )}

            {/* HIGH-RISK SECTION (inline on All) */}
            {tab === "all" && tabbed.highrisk.length > 0 && (
              <section className="pt-4">
                <SectionLabel>High-risk expirations</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.highrisk.slice(0, 6).map(a => {
                      const d = daysUntil(a.expirationDate);
                      const blocker = blockerOf(a);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 grid place-items-center shrink-0">
                              <Flame className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">
                                {a.clientName} <span className="text-muted-foreground font-normal">— {blocker ?? wfStatus(a)}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {a.state} · BCBA: {a.coordinator} · Next: {a.nextAction}
                              </div>
                            </div>
                            <Pill tone="crit">{d !== null && d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}</Pill>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}

            {/* PR & REASSESSMENT TRACKER */}
            {tab === "all" && prTracker.length > 0 && (
              <section className="pt-4">
                <SectionLabel>PR & reassessment tracker</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {prTracker.map(a => {
                      const d = daysUntil(a.expirationDate);
                      const weeks = d !== null ? Math.max(0, Math.floor(d / 7)) : 0;
                      const stage = hasTPBlocker(a) ? "Awaiting treatment plan" : "Awaiting progress report";
                      const owner = outreachOwner(a, weeks);
                      const tone = urgencyOf(a);
                      return (
                        <li key={a.id} className="p-3.5 flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 border", toneClasses(tone))}>
                            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => setOpenId(a.id)} className="text-left w-full">
                              <div className="text-sm font-medium text-foreground truncate">
                                {a.clientName} <span className="text-muted-foreground font-normal">· {stage}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {weeks}w to exp · {a.state} · Owner: {owner} · BCBA: {a.coordinator}
                              </div>
                            </button>
                          </div>
                          <Pill tone={tone}>{weeks}w</Pill>
                          <div className="hidden md:flex items-center gap-1.5 shrink-0">
                            <IconBtn title="Send follow-up" icon={SendIcon} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Mark received"  icon={CheckCircle2} onClick={() => setOpenId(a.id)} />
                            <IconBtn title="Escalate"       icon={Flame} tone="crit" onClick={() => setOpenId(a.id)} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}

            {/* BCBA FOLLOW-UP TRACKER */}
            {tab === "all" && bcbaFollow.length > 0 && (
              <section className="pt-4">
                <SectionLabel>BCBA follow-up tracker</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {bcbaFollow.map(a => {
                      const d = daysUntil(a.expirationDate);
                      const tone = urgencyOf(a);
                      const blocker = blockerOf(a) ?? "QA feedback pending";
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
                                {a.daysInStage}d waiting · {blocker} · Exp {d !== null ? (d < 0 ? `${Math.abs(d)}d overdue` : `${d}d`) : "—"}
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
              <SectionLabel>Today's risks</SectionLabel>
              <Card>
                {todayRisks.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent expirations." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {todayRisks.map(a => {
                      const d = daysUntil(a.expirationDate);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {wfStatus(a)} · {a.state}
                                </div>
                              </div>
                              <Pill tone="crit">
                                {d !== null && d < 0 ? `${Math.abs(d)}d od` : d !== null ? `${d}d` : "—"}
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
                      {(w.overdue > 0 || w.escalated > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.overdue > 0 && <Pill tone="crit">{w.overdue} overdue</Pill>}
                          {w.escalated > 0 && <Pill tone="warn">{w.escalated} high risk</Pill>}
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
                  <div className="text-xs text-muted-foreground">Expiration copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "What expires within 30 days?",
                    "Which workflows are high risk?",
                    "Which BCBAs have not responded?",
                    "What is blocking submissions?",
                    "Which PRs are overdue?",
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

      {openItem && <ExpSlideout auth={openItem} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openItem.id)} />}
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
  return <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">{children}</div>;
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
        aria-label={label}>
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
  return <button type="button" title={title} onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function ExpGroup({
  title, items, tone, onOpen,
}: { title: string; items: Authorization[]; tone: Tone; onOpen: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
        <Pill tone={tone}>{items.length}</Pill>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 8).map(a => (
          <ExpCard key={a.id} auth={a} onOpen={() => onOpen(a.id)} />
        ))}
      </ul>
    </section>
  );
}

function ExpCard({ auth: a, onOpen }: { auth: Authorization; onOpen: () => void }) {
  const tone = urgencyOf(a);
  const status = wfStatus(a);
  const d = daysUntil(a.expirationDate);
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
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center border shrink-0", toneClasses(tone))}>
                <Hourglass className="h-4 w-4" strokeWidth={1.75} />
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
                  {d !== null && (
                    <Pill tone={tone}>
                      {d < 0 ? `${Math.abs(d)}d overdue` : `Exp in ${d}d`}
                    </Pill>
                  )}
                  {a.expirationDate && (
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {a.expirationDate}
                    </span>
                  )}
                  {hasPRBlocker(a) && <Pill tone="warn">PR pending</Pill>}
                  {hasTPBlocker(a) && <Pill tone="warn">TP pending</Pill>}
                  {a.missingInfo && <Pill tone="warn">Missing info</Pill>}
                  {isHighRisk(a) && <Pill tone="crit">High risk</Pill>}
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
            <IconBtn title="Open record"               to="/qa-queue" icon={ExternalLink} />
            <IconBtn title="Send follow-up"            icon={Send}         onClick={onOpen} />
            <IconBtn title="Add QA note"               icon={StickyNote}   onClick={onOpen} />
            <IconBtn title="Mark PR received"          icon={CheckCircle2} onClick={onOpen} />
            <IconBtn title="Escalate"                  icon={Flame} tone="crit" onClick={onOpen} />
          </div>
        </div>
      </Card>
    </li>
  );
}

function ExpSlideout({ auth: a, onClose, onChanged, sourceSystem }: { auth: Authorization; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const tone = urgencyOf(a);
  const status = wfStatus(a);
  const d = daysUntil(a.expirationDate);
  const weeks = d !== null ? Math.max(0, Math.floor(d / 7)) : 0;
  const blocker = blockerOf(a);
  const checklist = readinessChecklist(a);
  const owner = outreachOwner(a, weeks);

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
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Expiring Authorization</div>
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
            <Pill tone={a.stage === "Denied" ? "crit" : a.missingInfo ? "warn" : "ok"}>{status}</Pill>
            {d !== null && (
              <Pill tone={tone}>{d < 0 ? `${Math.abs(d)}d overdue` : `Exp in ${d}d`}</Pill>
            )}
            {isHighRisk(a) && <Pill tone="crit">High risk</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="Expires"        value={a.expirationDate ?? "—"} />
            <Fact label="Days remaining" value={d !== null ? (d < 0 ? `${Math.abs(d)}d overdue` : `${d}d`) : "—"} />
            <Fact label="Stage"          value={a.stage} />
            <Fact label="QA status"      value={a.qaStatus} />
            <Fact label="BCBA"           value={a.coordinator} />
            <Fact label="QA owner"       value={a.qaOwner ?? "Unassigned"} />
            <Fact label="Auth type"      value={a.authType} />
            <Fact label="Days in stage"  value={`${a.daysInStage}d`} />
          </div>

          <section>
            <SectionLabel>Outreach owner ({weeks}w out)</SectionLabel>
            <Card className="p-3.5 text-sm text-foreground flex items-center gap-2">
              <SendIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
              {owner}
            </Card>
          </section>

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
              <SectionLabel>Missing requirements</SectionLabel>
              <Card className="p-4">
                <ul className="space-y-2">
                  {a.missingRequirements.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                      <span className="text-foreground">{m}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {blocker && (
            <section>
              <SectionLabel>Blocker</SectionLabel>
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
            <SectionLabel>Next required action</SectionLabel>
            <Card className="p-3.5 text-sm text-foreground">{a.nextAction}</Card>
          </section>

          <section>
            <SectionLabel>Quick actions</SectionLabel>
            <QAActionsPanel auth={a} variant="expiring" sourceSystem={sourceSystem} onChanged={onChanged} />
            <div className="flex flex-wrap gap-2 mt-2">
              <Link to="/qa-queue" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium border border-border/70 bg-card hover:bg-muted transition">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} /> Open record
              </Link>
            </div>
          </section>

          <section>
            <SectionLabel>Workflow timeline</SectionLabel>
            <Card className="p-3">
              <ul className="space-y-2.5">
                <TLItem icon={Activity}  label={`Currently in: ${a.stage}`} meta={`${a.daysInStage}d in stage`} />
                <TLItem icon={History}   label="Last activity"               meta={relTime(a.lastActivity)} />
                {a.submittedDate && <TLItem icon={History} label="Submitted" meta={a.submittedDate} />}
                {a.approvedDate  && <TLItem icon={History} label="Approved"  meta={a.approvedDate} />}
                {a.expirationDate && <TLItem icon={Calendar} label="Expires" meta={a.expirationDate} />}
              </ul>
            </Card>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/50 border border-border/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, tone }: { icon: React.ElementType; label: string; tone?: Tone }) {
  return (
    <button className={cn(
      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium border transition",
      tone === "crit"
        ? "bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10"
        : "bg-card border-border/70 text-foreground hover:bg-muted",
    )}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}
function TLItem({ icon: Icon, label, meta }: { icon: React.ElementType; label: string; meta: string }) {
  return (
    <li className="flex items-start gap-2.5 px-2 py-1.5">
      <div className="h-6 w-6 rounded-full bg-muted grid place-items-center shrink-0">
        <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-foreground truncate">{label}</div>
        <div className="text-[10px] text-muted-foreground">{meta}</div>
      </div>
    </li>
  );
}