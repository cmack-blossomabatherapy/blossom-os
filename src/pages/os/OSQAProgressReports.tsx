import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, Inbox, FileText, AlertTriangle, X, ChevronRight,
  Users, Activity, History, PenLine, Calendar, MailCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";

// Progress Reports — operational coordination hub for PR workflows.
// Real data only via useLiveAuthorizations. PR workflow logic is derived from
// authorization expiration dates, treatmentPlanReceived, missingRequirements,
// and Blossom's documented PR outreach rules.

type Tone = "ok" | "warn" | "crit";
type TabKey = "active" | "awaiting" | "overdue" | "escalation" | "signatures" | "ready";

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
function weeksUntil(iso: string | null): number | null {
  const d = daysUntil(iso);
  return d === null ? null : Math.ceil(d / 7);
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

// ---------- PR derivation ----------
const SIG_KEYWORDS = /sign|signature/i;
const PR_KEYWORDS  = /progress report|treatment plan|reauth|pr\b/i;

function hasSignatureBlocker(a: Authorization): boolean {
  return a.missingRequirements.some(m => SIG_KEYWORDS.test(m));
}
function prReceived(a: Authorization): boolean {
  if (a.treatmentPlanReceived) return true;
  // received-once stages: in qa review / awaiting submission / submitted / approved
  return a.stage === "In QA Review" || a.stage === "Awaiting Submission" ||
         a.stage === "Submitted"     || a.stage === "Approved";
}
function isPRRelevant(a: Authorization): boolean {
  // Surface authorizations whose PR coordination is still relevant.
  if (a.stage === "Approved" || a.stage === "Flaked Client") return false;
  return true;
}

type PRStatus =
  | "Awaiting PR" | "PR Requested" | "Waiting on BCBA"
  | "Waiting on Signature" | "PR Received" | "Under QA Review"
  | "Escalated" | "Overdue" | "Ready for Submission";

function prStatus(a: Authorization): PRStatus {
  if (a.stage === "Denied") return "Escalated";
  if (a.stage === "Submitted" || a.stage === "Awaiting Submission") return "Ready for Submission";
  if (a.stage === "In QA Review") return "Under QA Review";
  if (prReceived(a) && hasSignatureBlocker(a)) return "Waiting on Signature";
  if (prReceived(a)) return "PR Received";
  const w = weeksUntil(a.expirationDate);
  if (w === null) return "Awaiting PR";
  if (w < 0) return "Overdue";
  if (w <= 6) return "Escalated";
  if (w <= 9) return a.daysInStage > 7 ? "Waiting on BCBA" : "PR Requested";
  return "Awaiting PR";
}

function prUrgency(a: Authorization): Tone {
  if (a.stage === "Denied") return "crit";
  const w = weeksUntil(a.expirationDate);
  if (w !== null) {
    if (w < 0) return "crit";
    if (w <= 6 && !prReceived(a)) return "crit";
    if (w <= 9 && !prReceived(a)) return "warn";
  }
  if (hasSignatureBlocker(a) && (w ?? 99) <= 9) return "warn";
  if (a.daysInStage > 10 && !prReceived(a)) return "warn";
  return "ok";
}

// Outreach owners per Blossom rules (GA vs other states).
function outreachOwner(a: Authorization): string {
  if (a.state === "GA" || /georgia/i.test(a.state)) return "Rivky Weissman";
  return "Rikki Wallach";
}
function escalationOwners(a: Authorization): string[] {
  if (a.state === "GA" || /georgia/i.test(a.state)) return ["Shira", "Rachel"];
  return ["State Director", "Julianne Rodriguez"];
}

function blockerOf(a: Authorization): string | null {
  if (a.stage === "Denied") return a.denialReason ? `Denial: ${a.denialReason}` : "Denial — escalated";
  if (hasSignatureBlocker(a)) return a.missingRequirements.find(m => SIG_KEYWORDS.test(m)) ?? "Awaiting signature";
  if (!prReceived(a)) {
    const w = weeksUntil(a.expirationDate);
    if (w !== null && w < 0) return `Auth expired ${Math.abs(w)}w ago — PR still missing`;
    if (w !== null && w <= 6) return `${w}w to expiration — SD escalation active`;
    if (a.daysInStage > 7) return "BCBA not responding to outreach";
  }
  if (a.missingInfo) {
    const m = a.missingRequirements.find(x => PR_KEYWORDS.test(x));
    if (m) return m;
  }
  return null;
}

// PR timeline milestones derived from rules + auth state.
type Milestone = {
  key: string; label: string;
  state: "done" | "active" | "upcoming";
  detail?: string;
};
function prMilestones(a: Authorization): Milestone[] {
  const w = weeksUntil(a.expirationDate);
  const received = prReceived(a);
  const sig = hasSignatureBlocker(a);
  const escalated = a.stage === "Denied" || (w !== null && w <= 6 && !received);
  const ga = a.state === "GA" || /georgia/i.test(a.state);

  const at = (cond: boolean, active: boolean): Milestone["state"] =>
    cond ? "done" : active ? "active" : "upcoming";

  return [
    { key: "9w",     label: "9-week outreach",
      detail: ga ? "Rivky begins outreach" : "Rikki begins weekly notifications",
      state: at(received || (w !== null && w <= 9), w !== null && w > 9 && w <= 10) },
    { key: "bcba",   label: "BCBA follow-up",
      detail: ga ? "Rivky → BCBA" : "Rikki → BCBA, CC Julianne",
      state: at(received, w !== null && w <= 9 && w > 6 && !received) },
    { key: "julianne", label: ga ? "Shira / Rachel looped in" : "Julianne included",
      state: at(received, w !== null && w <= 8 && !received) },
    { key: "6w",     label: "6-week escalation",
      detail: ga ? "Shira + Rachel involved" : "State Director involved",
      state: at(received, w !== null && w <= 6 && !received) },
    { key: "sd",     label: "State Director involved",
      state: escalated && !received ? "active" : received ? "done" : "upcoming" },
    { key: "rec",    label: "PR received",
      state: received ? "done" : "upcoming" },
    { key: "sig",    label: "Signature requested",
      state: received && sig ? "active" : received && !sig ? "done" : "upcoming" },
    { key: "ready",  label: "Ready for submission",
      state: a.stage === "Submitted" || a.stage === "Awaiting Submission" ? "done"
           : received && !sig ? "active" : "upcoming" },
  ];
}

// ---------- page ----------
export default function OSQAProgressReports() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();

  const prs = useMemo(() => items.filter(isPRRelevant), [items]);

  const [tab, setTab] = useState<TabKey>("active");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  useQADeepLink({ items, loading, setOpenId, setQuery, setBcbaFilter });

  const states = useMemo(
    () => Array.from(new Set(prs.map(a => a.state).filter(Boolean))).sort(),
    [prs],
  );
  const bcbas = useMemo(
    () => Array.from(new Set(prs.map(a => a.coordinator).filter(Boolean))).sort(),
    [prs],
  );
  const owners = useMemo(() => {
    const s = new Set<string>();
    prs.forEach(a => { if (a.qaOwner) s.add(a.qaOwner); });
    return Array.from(s).sort();
  }, [prs]);
  const statuses = useMemo(
    () => Array.from(new Set(prs.map(prStatus))).sort(),
    [prs],
  );

  const tabbed = useMemo(() => ({
    active:     prs,
    awaiting:   prs.filter(a => !prReceived(a) && a.stage !== "Denied"),
    overdue:    prs.filter(a => {
      const w = weeksUntil(a.expirationDate);
      return !prReceived(a) && w !== null && w < 0;
    }),
    escalation: prs.filter(a => {
      if (a.stage === "Denied") return true;
      const w = weeksUntil(a.expirationDate);
      return !prReceived(a) && w !== null && w <= 6;
    }),
    signatures: prs.filter(hasSignatureBlocker),
    ready:      prs.filter(a => a.stage === "Awaiting Submission" || a.stage === "Submitted"),
  } as Record<TabKey, Authorization[]>), [prs]);

  const counts = useMemo(() => ({
    active: tabbed.active.length,
    awaiting: tabbed.awaiting.length,
    overdue: tabbed.overdue.length,
    escalation: tabbed.escalation.length,
    signatures: tabbed.signatures.length,
    ready: tabbed.ready.length,
  }), [tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(a => {
      if (stateFilter !== "all" && a.state !== stateFilter) return false;
      if (bcbaFilter !== "all" && a.coordinator !== bcbaFilter) return false;
      if (ownerFilter !== "all" && a.qaOwner !== ownerFilter) return false;
      if (statusFilter !== "all" && prStatus(a) !== statusFilter) return false;
      if (urgencyFilter !== "all" && prUrgency(a) !== urgencyFilter) return false;
      if (escFilter !== "all") {
        const w = weeksUntil(a.expirationDate);
        const isEsc = a.stage === "Denied" || (!prReceived(a) && w !== null && w <= 6);
        if (escFilter === "escalated" && !isEsc) return false;
        if (escFilter === "normal" && isEsc) return false;
      }
      if (q) {
        const hay = [a.clientName, a.coordinator, a.qaOwner ?? "", a.state, a.payor, prStatus(a)]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => {
      const rank = (z: Authorization) => prUrgency(z) === "crit" ? 3 : prUrgency(z) === "warn" ? 2 : 1;
      const r = rank(y) - rank(x);
      if (r !== 0) return r;
      return (daysUntil(x.expirationDate) ?? 9999) - (daysUntil(y.expirationDate) ?? 9999);
    });
  }, [tabbed, tab, query, stateFilter, bcbaFilter, ownerFilter, statusFilter, urgencyFilter, escFilter]);

  const priorities = useMemo(() => {
    return [...tabbed.escalation, ...tabbed.overdue, ...tabbed.awaiting]
      .filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i)
      .sort((a, b) => (daysUntil(a.expirationDate) ?? 999) - (daysUntil(b.expirationDate) ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const bcbaFollowUps = useMemo(() => {
    return prs
      .filter(a => !prReceived(a) && a.daysInStage >= 3)
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 6);
  }, [prs]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = prs.filter(a => a.qaOwner === name);
      return {
        name,
        open: owned.length,
        overdue: owned.filter(a => {
          const w = weeksUntil(a.expirationDate);
          return !prReceived(a) && w !== null && w < 0;
        }).length,
        escalated: owned.filter(a => a.stage === "Denied" || (!prReceived(a) && (weeksUntil(a.expirationDate) ?? 99) <= 6)).length,
      };
    });
  }, [prs]);

  const openItem = prs.find(a => a.id === openId) ?? null;
  const urgentCount = counts.overdue + counts.escalation;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "active",     label: "All Active",     count: counts.active },
    { key: "awaiting",   label: "Awaiting PR",    count: counts.awaiting,   tone: "warn" },
    { key: "overdue",    label: "Overdue",        count: counts.overdue,    tone: "crit" },
    { key: "escalation", label: "Escalations",    count: counts.escalation, tone: "crit" },
    { key: "signatures", label: "Signatures",     count: counts.signatures, tone: "warn" },
    { key: "ready",      label: "Ready",          count: counts.ready,      tone: "ok" },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Progress Reports</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Track PR workflows, BCBA follow-ups, expirations, and escalation timelines.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.active} active
              </span>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {urgentCount} need attention
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, BCBA, PR status, authorization, or escalation..."
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
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="PR Status"
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
          <AwareCard icon={Inbox}        label="Awaiting PRs"           value={counts.awaiting} />
          <AwareCard icon={Clock}        label="Overdue PRs"            value={counts.overdue}    tone="crit" />
          <AwareCard icon={Flame}        label="Active Escalations"     value={counts.escalation} tone="crit" />
          <AwareCard icon={Calendar}     label="Expiring Auths ≤30d"
            value={prs.filter(a => { const d = daysUntil(a.expirationDate); return d !== null && d >= 0 && d <= 30 && !prReceived(a); }).length}
            tone="warn" />
          <AwareCard icon={PenLine}      label="Signature Follow-Ups"   value={counts.signatures} tone="warn" />
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
                {visible.length} {visible.length === 1 ? "workflow" : "workflows"}
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
                    tab === "overdue"    ? "No overdue PRs right now." :
                    tab === "escalation" ? "No escalations requiring attention." :
                    tab === "signatures" ? "No pending signatures today." :
                    tab === "awaiting"   ? "All PRs accounted for." :
                    tab === "ready"      ? "Nothing ready for submission yet." :
                                           "You're caught up on PR coordination."
                  }
                />
              </Card>
            ) : (
              <ul className="space-y-3">
                {visible.map(a => (
                  <PRCard key={a.id} auth={a} onOpen={() => setOpenId(a.id)} />
                ))}
              </ul>
            )}

            {/* BCBA FOLLOW-UP TRACKER (inline) */}
            {tab === "active" && bcbaFollowUps.length > 0 && (
              <section className="pt-4">
                <SectionLabel>BCBA follow-up tracker</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {bcbaFollowUps.map(a => {
                      const w = weeksUntil(a.expirationDate);
                      const tone = prUrgency(a);
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
                                {a.daysInStage}d waiting · outreach: {outreachOwner(a)} · {a.state}
                              </div>
                            </div>
                            <Pill tone={tone}>
                              {w !== null && w < 0 ? `${Math.abs(w)}w overdue` :
                               w !== null ? `${w}w left` : `${a.daysInStage}d`}
                            </Pill>
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
                      const w = weeksUntil(a.expirationDate);
                      const tone = prUrgency(a);
                      return (
                        <li key={a.id}>
                          <button onClick={() => setOpenId(a.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{a.clientName}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                  {prStatus(a)} · {a.state}
                                </div>
                              </div>
                              <Pill tone={tone}>
                                {w !== null && w < 0 ? `${Math.abs(w)}w over` :
                                 w !== null ? `${w}w` : `${a.daysInStage}d`}
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
              <SectionLabel>QA team snapshot</SectionLabel>
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
                        <span className="text-[11px] text-muted-foreground tabular-nums">{w.open}</span>
                      </div>
                      {(w.overdue > 0 || w.escalated > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.overdue > 0 && <Pill tone="crit">{w.overdue} overdue</Pill>}
                          {w.escalated > 0 && <Pill tone="warn">{w.escalated} escalated</Pill>}
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
                  <div className="text-xs text-muted-foreground">QA PR copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which PRs are overdue?",
                    "Which workflows need escalation?",
                    "Which BCBAs have not responded?",
                    "What expires within 30 days?",
                    "Show blocked PRs.",
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

      {openItem && <PRSlideout auth={openItem} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openItem.id)} />}
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

function PRCard({ auth: a, onOpen }: { auth: Authorization; onOpen: () => void }) {
  const tone = prUrgency(a);
  const status = prStatus(a);
  const w = weeksUntil(a.expirationDate);
  const exp = daysUntil(a.expirationDate);
  const blocker = blockerOf(a);
  const accent =
    tone === "crit" ? "before:bg-destructive/70" :
    tone === "warn" ? "before:bg-amber-500/70" :
                      "before:bg-emerald-500/50";
  const owner = outreachOwner(a);

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
                <FileText className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">PR · {a.payor}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.state} · {status}
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Pill tone={tone}>
                    {tone === "crit" ? "Critical" : tone === "warn" ? "High" : "Normal"}
                  </Pill>
                  {w !== null && (
                    <Pill tone={w < 0 ? "crit" : w <= 6 ? "crit" : w <= 9 ? "warn" : "ok"}>
                      {w < 0 ? `${Math.abs(w)}w overdue` : `${w}w to expiration`}
                    </Pill>
                  )}
                  {hasSignatureBlocker(a) && <Pill tone="warn">Signature pending</Pill>}
                  {a.stage === "Denied" && <Pill tone="crit">Escalated</Pill>}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> BCBA: {a.coordinator}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> QA: {a.qaOwner ?? "Unassigned"}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <MailCheck className="h-3 w-3" /> Outreach: {owner}
                  </span>
                  {exp !== null && (
                    <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {exp < 0 ? `Expired ${Math.abs(exp)}d` : `Exp in ${exp}d`}
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

          <div className="hidden md:flex flex-col gap-1.5 shrink-0">
            <IconBtn title="Open authorization" icon={ExternalLink} onClick={onOpen} />
            <IconBtn title="Send follow-up" icon={Send} onClick={onOpen} />
            <IconBtn title="Mark PR received" icon={CheckCircle2} onClick={onOpen} />
            <IconBtn title="Escalate" icon={Flame} tone="crit" onClick={onOpen} />
          </div>
        </div>
      </Card>
    </li>
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

function PRSlideout({ auth: a, onClose, onChanged, sourceSystem }: { auth: Authorization; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const tone = prUrgency(a);
  const status = prStatus(a);
  const blocker = blockerOf(a);
  const w = weeksUntil(a.expirationDate);
  const exp = daysUntil(a.expirationDate);
  const milestones = prMilestones(a);
  const escOwners = escalationOwners(a);

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
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Progress Report</div>
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
            <Pill tone={a.stage === "Denied" ? "crit" : prReceived(a) ? "ok" : "warn"}>{status}</Pill>
            {w !== null && (
              <Pill tone={w < 0 ? "crit" : w <= 6 ? "crit" : w <= 9 ? "warn" : "ok"}>
                {w < 0 ? `${Math.abs(w)}w overdue` : `${w}w to expiration`}
              </Pill>
            )}
            {hasSignatureBlocker(a) && <Pill tone="warn">Signature pending</Pill>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="BCBA"           value={a.coordinator} />
            <Fact label="QA owner"       value={a.qaOwner ?? "Unassigned"} />
            <Fact label="Outreach owner" value={outreachOwner(a)} />
            <Fact label="Escalation"     value={escOwners.join(", ")} />
            <Fact label="Auth type"      value={a.authType} />
            <Fact label="Days in stage"  value={`${a.daysInStage}d`} />
            <Fact label="Expires"        value={a.expirationDate ?? "—"} />
            <Fact label="Next due"       value={a.nextTaskDue ?? "—"} />
          </div>

          <section>
            <SectionLabel>PR workflow timeline</SectionLabel>
            <Card className="p-4">
              <ol className="space-y-3">
                {milestones.map(m => {
                  const dot =
                    m.state === "done"   ? "bg-emerald-500" :
                    m.state === "active" ? "bg-primary ring-4 ring-primary/15" :
                                           "bg-muted-foreground/30";
                  return (
                    <li key={m.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
                      </div>
                      <div className="min-w-0 flex-1 -mt-0.5">
                        <div className={cn(
                          "text-sm",
                          m.state === "upcoming" ? "text-muted-foreground" : "text-foreground font-medium",
                        )}>{m.label}</div>
                        {m.detail && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{m.detail}</div>
                        )}
                      </div>
                      {m.state === "active" && <Pill tone="warn">Active</Pill>}
                      {m.state === "done"   && <Pill tone="ok">Done</Pill>}
                    </li>
                  );
                })}
              </ol>
            </Card>
          </section>

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
            <SectionLabel>Outreach & escalation history</SectionLabel>
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

          {exp !== null && (
            <section>
              <SectionLabel>Related authorization</SectionLabel>
              <Card className="p-3.5">
                <div className="text-sm text-foreground">{a.authType} · {a.stage}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {exp < 0 ? `Expired ${Math.abs(exp)} days ago` : `Expires in ${exp} days`} · QA notes: {a.qaNotes ?? "—"}
                </div>
              </Card>
            </section>
          )}

          <section className="space-y-2 pt-1">
            <SectionLabel>Actions</SectionLabel>
            <Link to="/qa-queue"
              className="h-9 px-3 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center justify-center gap-1.5 w-full">
              <ExternalLink className="h-3.5 w-3.5" /> Open workflow
            </Link>
            <QAActionsPanel auth={a} variant="progress" sourceSystem={sourceSystem} onChanged={onChanged} />
          </section>

          <ClinicalDirectorSection
            sourceType="authorization"
            sourceRecordId={a.id}
            clientId={a.clientId}
            clientName={a.clientName}
            bcbaName={a.coordinator}
            state={a.state}
            defaultTitle={`Progress report follow-up: ${a.clientName}`}
            metadata={{
              stage: a.stage,
              expirationDate: a.expirationDate,
              missingRequirements: a.missingRequirements,
              progressReportStatus: prStatus(a),
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