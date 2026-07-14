import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  Brain, AlertTriangle, ChevronRight, Users, FileText, ShieldAlert,
  X, Clock, Activity, History, MapPin, UserCheck, ClipboardList,
  Calendar, MessageCircle, TrendingUp,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";

// QA → Assigned BCBAs. Operational coordination layer between QA and BCBAs.
// Real data only — derived from useLiveAuthorizations, grouped per BCBA.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "followup" | "overdue_pr" | "expiring" | "escalated" | "ready";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

const PR_KW = /progress report|\bpr\b/i;
const TP_KW = /treatment plan|\btp\b/i;
const SIG_KW = /sign|signature|consent/i;

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

// Real Blossom PR outreach owner logic
function outreachOwner(state: string, weeksOut: number): string {
  const ga = state === "GA";
  if (weeksOut <= 6) return ga ? "Shira + Rachel (SD)" : "SD escalation";
  if (weeksOut <= 9) return ga ? "Rivky Weissman" : "Rikki Wallach";
  return ga ? "Rivky Weissman" : "Rikki Wallach";
}

// ---------- BCBA aggregation ----------
type BCBARow = {
  id: string;
  name: string;
  state: string; // dominant state
  states: string[];
  qaOwner: string | null; // most-common
  auths: Authorization[];
  clientIds: string[];
  clientNames: string[];
  activeClients: number;
  prOpen: number;
  prOverdue: number;
  tpAwaiting: number;
  missingAny: number;
  expiring30: number;
  expiring60: number;
  nearestExpDays: number | null;
  inQA: number;
  ready: number;
  escalations: number;
  lastActivity: string;
  lastActivityIso: string | null;
  daysSinceActivity: number | null;
  urgency: Tone;
  escalated: boolean;
  status: "Awaiting PR" | "Waiting on Treatment Plan" | "Missing Documentation"
        | "Escalated" | "Overdue" | "Ready for Submission" | "Active Review" | "High Risk";
};

function mostCommon<T>(arr: (T | null | undefined)[]): T | null {
  const counts = new Map<T, number>();
  arr.forEach(v => { if (v != null) counts.set(v as T, (counts.get(v as T) ?? 0) + 1); });
  let best: T | null = null; let n = -1;
  counts.forEach((c, k) => { if (c > n) { n = c; best = k; } });
  return best;
}

function buildBCBAs(items: Authorization[]): BCBARow[] {
  return buildBCBAsWithMap(items, new Map());
}

function buildBCBAsWithMap(items: Authorization[], bcbaById: Map<string, string>): BCBARow[] {
  const groups = new Map<string, Authorization[]>();
  for (const a of items) {
    if (a.stage === "Flaked Client") continue;
    const bcba = bcbaById.get(a.id) ?? a.coordinator;
    if (!bcba) continue;
    const arr = groups.get(bcba) ?? [];
    arr.push(a);
    groups.set(bcba, arr);
  }

  const rows: BCBARow[] = [];
  groups.forEach((auths, name) => {
    const clientIds = Array.from(new Set(auths.map(a => a.clientId || a.clientName)));
    const clientNames = Array.from(new Set(auths.map(a => a.clientName))).sort();
    const state = mostCommon(auths.map(a => a.state)) ?? "—";
    const states = Array.from(new Set(auths.map(a => a.state))).sort();
    const qaOwner = mostCommon(auths.map(a => a.qaOwner));

    const expDaysList = auths.map(a => daysUntil(a.expirationDate)).filter((d): d is number => d !== null);
    const nearestExpDays = expDaysList.length ? Math.min(...expDaysList) : null;

    let prOpen = 0, prOverdue = 0, tpAwaiting = 0, missingAny = 0;
    let expiring30 = 0, expiring60 = 0, inQA = 0, ready = 0, escalations = 0;
    auths.forEach(a => {
      const hasPR = a.missingRequirements.some(r => PR_KW.test(r));
      const hasTP = a.missingRequirements.some(r => TP_KW.test(r));
      if (hasPR) { prOpen++; if (a.daysInStage > 7) prOverdue++; }
      if (hasTP) tpAwaiting++;
      if (a.missingInfo) missingAny++;
      const d = daysUntil(a.expirationDate);
      if (d !== null && d >= 0) {
        if (d <= 30) expiring30++;
        if (d <= 60) expiring60++;
      }
      if (a.stage === "In QA Review") inQA++;
      if (!a.missingInfo && a.stage === "Awaiting Submission" && a.treatmentPlanReceived !== false) ready++;
      if (a.stage === "Denied" || (d !== null && d >= 0 && d <= 7) || (a.missingInfo && a.daysInStage > 10)) escalations++;
    });

    // pick the most recent activity timestamp (string-based; fall back to first auth)
    const primaryActivity = auths.reduce((acc, a) => acc.daysInStage < a.daysInStage ? acc : a, auths[0]);
    const lastActivity = primaryActivity.lastActivity;

    // urgency + status
    let urgency: Tone = "ok";
    let escalated = escalations > 0;
    if (escalations > 0 || prOverdue > 0 || (nearestExpDays !== null && nearestExpDays <= 7)) urgency = "crit";
    else if (missingAny > 0 || expiring30 > 0 || prOpen > 0) urgency = "warn";

    let status: BCBARow["status"] = "Active Review";
    if (escalated) status = "Escalated";
    else if (prOverdue > 0) status = "Overdue";
    else if (prOpen > 0) status = "Awaiting PR";
    else if (tpAwaiting > 0) status = "Waiting on Treatment Plan";
    else if (missingAny > 0) status = "Missing Documentation";
    else if (nearestExpDays !== null && nearestExpDays <= 14) status = "High Risk";
    else if (ready > 0 && inQA === 0) status = "Ready for Submission";
    else if (inQA > 0) status = "Active Review";

    rows.push({
      id: name,
      name,
      state,
      states,
      qaOwner,
      auths,
      clientIds,
      clientNames,
      activeClients: clientIds.length,
      prOpen, prOverdue, tpAwaiting, missingAny,
      expiring30, expiring60, nearestExpDays,
      inQA, ready, escalations,
      lastActivity,
      lastActivityIso: null,
      daysSinceActivity: null,
      urgency,
      escalated,
      status,
    });
  });

  return rows;
}

// ---------- page ----------
export default function OSQABCBAs() {
  const { items, loading, bcbaById, refresh, sourceById } = useLiveAuthorizations();
  const allBcbas = useMemo(() => buildBCBAsWithMap(items, bcbaById), [items, bcbaById]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [prFilter, setPrFilter] = useState("all");
  const [qaFilter, setQaFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  // QA Pass 6 — the drawer id here is the BCBA name/group id, not an auth id.
  // Resolvers translate ?id=/?focus=<authId> and ?bcba=<name> into the group id.
  useQADeepLink({
    items,
    loading,
    setOpenId,
    setQuery,
    setBcbaFilter,
    resolveOpenIdForAuth: (authId) => {
      const group = allBcbas.find((b) => b.auths.some((a) => a.id === authId));
      return group ? group.id : null;
    },
    resolveOpenIdForBcba: (name) => {
      const p = name.toLowerCase();
      const match = allBcbas.find((b) => b.name.toLowerCase() === p);
      return match ? match.id : null;
    },
  });

  const states  = useMemo(() => Array.from(new Set(allBcbas.flatMap(b => b.states))).sort(), [allBcbas]);
  const names   = useMemo(() => allBcbas.map(b => b.name).sort(), [allBcbas]);
  const qaList  = useMemo(() => Array.from(new Set(allBcbas.map(b => b.qaOwner).filter((v): v is string => !!v))).sort(), [allBcbas]);
  const statuses = useMemo(() => Array.from(new Set(allBcbas.map(b => b.status))).sort(), [allBcbas]);

  const tabbed = useMemo(() => ({
    all:        allBcbas,
    followup:   allBcbas.filter(b => b.prOpen > 0 || b.missingAny > 0 || b.tpAwaiting > 0),
    overdue_pr: allBcbas.filter(b => b.prOverdue > 0),
    expiring:   allBcbas.filter(b => b.expiring60 > 0),
    escalated:  allBcbas.filter(b => b.escalated),
    ready:      allBcbas.filter(b => b.ready > 0 && b.missingAny === 0),
  } as Record<TabKey, BCBARow[]>), [allBcbas]);

  const counts = {
    all: tabbed.all.length,
    followup: tabbed.followup.length,
    overdue_pr: tabbed.overdue_pr.length,
    expiring: tabbed.expiring.length,
    escalated: tabbed.escalated.length,
    ready: tabbed.ready.length,
  };

  const awareCounts = useMemo(() => ({
    followup: tabbed.followup.length,
    overduePR: allBcbas.reduce((n, b) => n + b.prOverdue, 0),
    expiring: allBcbas.reduce((n, b) => n + b.expiring30, 0),
    escalated: tabbed.escalated.length,
    ready: allBcbas.reduce((n, b) => n + b.ready, 0),
  }), [allBcbas, tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(b => {
      if (stateFilter !== "all" && !b.states.includes(stateFilter)) return false;
      if (bcbaFilter !== "all" && b.name !== bcbaFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (qaFilter !== "all" && b.qaOwner !== qaFilter) return false;
      if (escFilter === "escalated" && !b.escalated) return false;
      if (escFilter === "normal" && b.escalated) return false;
      if (expFilter === "soon" && !(b.nearestExpDays !== null && b.nearestExpDays >= 0 && b.nearestExpDays <= 30)) return false;
      if (expFilter === "60"   && !(b.nearestExpDays !== null && b.nearestExpDays >= 0 && b.nearestExpDays <= 60)) return false;
      if (prFilter === "overdue"   && !(b.prOverdue > 0)) return false;
      if (prFilter === "requested" && !(b.prOpen > 0 && b.prOverdue === 0)) return false;
      if (prFilter === "none"      && !(b.prOpen === 0)) return false;
      if (urgencyFilter !== "all" && b.urgency !== urgencyFilter) return false;
      if (q) {
        const hay = [b.name, b.state, b.qaOwner ?? "", b.status, ...b.clientNames, ...b.states].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const rank = (z: BCBARow) => z.urgency === "crit" ? 3 : z.urgency === "warn" ? 2 : 1;
      const r = rank(b) - rank(a);
      if (r !== 0) return r;
      const ea = a.nearestExpDays ?? 9999;
      const eb = b.nearestExpDays ?? 9999;
      if (ea !== eb) return ea - eb;
      return b.prOverdue - a.prOverdue;
    });
  }, [tabbed, tab, query, stateFilter, bcbaFilter, statusFilter, qaFilter, escFilter, expFilter, prFilter, urgencyFilter]);

  const grouped = useMemo(() => {
    if (tab !== "all") return null;
    const map = new Map<string, BCBARow[]>();
    visible.forEach(b => {
      const key = b.urgency === "crit" ? "Critical" : b.urgency === "warn" ? "High priority" : "Stable";
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const order = { "Critical": 0, "High priority": 1, "Stable": 2 } as Record<string, number>;
      return (order[a] ?? 9) - (order[b] ?? 9);
    });
  }, [tab, visible]);

  // PR follow-up tracker (auth rows where PR is missing)
  const prRows = useMemo(() => {
    const out: { id: string; bcba: string; client: string; state: string; weeks: number | null; days: number; escalated: boolean; auth: Authorization }[] = [];
    items.forEach(a => {
      if (!a.missingInfo) return;
      if (!a.missingRequirements.some(r => PR_KW.test(r))) return;
      const d = daysUntil(a.expirationDate);
      const weeks = d !== null ? Math.max(0, Math.round(d / 7)) : null;
      const escalated = (weeks !== null && weeks <= 6) || a.daysInStage > 10;
      out.push({ id: a.id, bcba: a.coordinator, client: a.clientName, state: a.state, weeks, days: a.daysInStage, escalated, auth: a });
    });
    return out.sort((x, y) => {
      const wx = x.weeks ?? 999, wy = y.weeks ?? 999;
      if (wx !== wy) return wx - wy;
      return y.days - x.days;
    });
  }, [items]);

  const priorities = useMemo(() => {
    return [...tabbed.escalated, ...tabbed.overdue_pr]
      .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
      .sort((a, b) => (a.nearestExpDays ?? 999) - (b.nearestExpDays ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const highRisk = useMemo(() => {
    return allBcbas
      .filter(b => b.urgency !== "ok")
      .sort((a, b) => (b.escalations + b.prOverdue) - (a.escalations + a.prOverdue))
      .slice(0, 6);
  }, [allBcbas]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = allBcbas.filter(b => b.qaOwner === name);
      return {
        name,
        active:    owned.length,
        overdue:   owned.filter(b => b.prOverdue > 0 || (b.nearestExpDays !== null && b.nearestExpDays <= 14 && b.nearestExpDays >= 0)).length,
        escalated: owned.filter(b => b.escalated).length,
      };
    });
  }, [allBcbas]);

  const openRow = visible.find(b => b.id === openId) ?? allBcbas.find(b => b.id === openId) ?? null;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",        label: "All BCBAs",          count: counts.all },
    { key: "followup",   label: "Awaiting Follow-Up", count: counts.followup,   tone: "warn" },
    { key: "overdue_pr", label: "Overdue PRs",        count: counts.overdue_pr, tone: "warn" },
    { key: "expiring",   label: "Expiring",           count: counts.expiring,   tone: "warn" },
    { key: "escalated",  label: "Escalated",          count: counts.escalated,  tone: "crit" },
    { key: "ready",      label: "Ready",              count: counts.ready },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Assigned BCBAs</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Monitor BCBA-related workflows, PR follow-ups, treatment plan readiness, and operational escalations.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.all} active
              </span>
              {awareCounts.followup > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {awareCounts.followup} need follow-up
                </span>
              )}
              {awareCounts.escalated > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {awareCounts.escalated} escalated
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search BCBA, client, PR status, authorization, or escalation..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...names.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Workflow"
              options={[{ value: "all", label: "All workflow statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "Escalated" },
                { value: "normal", label: "Normal" },
              ]} />
            <FilterSelect value={expFilter} onChange={setExpFilter} label="Expiring"
              options={[
                { value: "all", label: "Any expiration" },
                { value: "soon", label: "≤ 30 days" },
                { value: "60",   label: "≤ 60 days" },
              ]} />
            <FilterSelect value={prFilter} onChange={setPrFilter} label="PR Status"
              options={[
                { value: "all", label: "All PR status" },
                { value: "overdue", label: "PR overdue" },
                { value: "requested", label: "PR requested" },
                { value: "none", label: "No open PR" },
              ]} />
            <FilterSelect value={qaFilter} onChange={setQaFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...qaList.map(s => ({ value: s, label: s }))]} />
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
          <AwareCard icon={MessageCircle}  label="Awaiting Follow-Up"     value={awareCounts.followup}  tone="warn" />
          <AwareCard icon={FileText}       label="Overdue PR Workflows"   value={awareCounts.overduePR} tone="crit" />
          <AwareCard icon={Calendar}       label="Expiring (≤30d)"        value={awareCounts.expiring}  tone="warn" />
          <AwareCard icon={Flame}          label="Escalated BCBAs"        value={awareCounts.escalated} tone="crit" />
          <AwareCard icon={CheckCircle2}   label="Ready for Submission"   value={awareCounts.ready} />
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
                {visible.length} {visible.length === 1 ? "BCBA" : "BCBAs"}
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
                    tab === "escalated"  ? "No escalations requiring attention." :
                    tab === "overdue_pr" ? "No urgent PR follow-ups today." :
                    tab === "expiring"   ? "No BCBAs with near-term expirations." :
                    tab === "ready"      ? "No BCBAs are ready to submit." :
                    tab === "followup"   ? "No overdue BCBA workflows right now." :
                                           "No BCBAs match these filters."
                  }
                />
              </Card>
            ) : tab === "all" && grouped ? (
              <div className="space-y-6">
                {grouped.map(([group, rows]) => (
                  <section key={group}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group}</div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{rows.length}</span>
                    </div>
                    <ul className="space-y-3">
                      {rows.map(b => <BCBACard key={b.id} b={b} onOpen={() => setOpenId(b.id)} />)}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map(b => <BCBACard key={b.id} b={b} onOpen={() => setOpenId(b.id)} />)}
              </ul>
            )}

            {/* PR FOLLOW-UP TRACKER */}
            {tab === "all" && prRows.length > 0 && (
              <section className="pt-4">
                <SectionLabel>PR follow-up tracker</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {prRows.slice(0, 8).map(r => {
                      const tone: Tone = r.escalated ? "crit" : (r.weeks !== null && r.weeks <= 9) ? "warn" : "ok";
                      const owner = r.weeks !== null ? outreachOwner(r.state, r.weeks) : "—";
                      return (
                        <li key={r.id} className="p-3.5 flex items-start gap-3">
                          <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 border", toneClasses(tone))}>
                            <FileText className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {r.bcba} <span className="text-muted-foreground font-normal">— {r.client}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {r.state} · {r.weeks !== null ? `${r.weeks}w to expiration` : "no expiration"} · Owner: {owner}
                            </div>
                          </div>
                          <Pill tone={tone}>{r.weeks !== null ? `${r.weeks}w` : `${r.days}d`}</Pill>
                          <div className="hidden md:flex items-center gap-1.5 shrink-0">
                            <IconBtn title="Open in QA queue" icon={Send}
                              to={`/qa-queue?focus=${encodeURIComponent(r.id)}`} />
                            <IconBtn title="Open escalations" icon={Flame} tone="crit"
                              to={`/escalations-followups?focus=${encodeURIComponent(r.id)}`} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}

            {/* OVERDUE & ESCALATIONS */}
            {tab === "all" && tabbed.escalated.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Overdue &amp; escalations</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.escalated.slice(0, 6).map(b => (
                      <li key={b.id}>
                        <button onClick={() => setOpenId(b.id)}
                          className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 grid place-items-center shrink-0">
                            <Flame className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {b.name} <span className="text-muted-foreground font-normal">— {b.status}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {b.state} · {b.activeClients} clients · {b.escalations} escalations · {b.prOverdue} overdue PR
                            </div>
                          </div>
                          <Pill tone="crit">
                            {b.nearestExpDays !== null && b.nearestExpDays >= 0 && b.nearestExpDays <= 14
                              ? `Exp ${b.nearestExpDays}d` : "Escalated"}
                          </Pill>
                        </button>
                      </li>
                    ))}
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
                  <EmptyState icon={CheckCircle2} title="No urgent BCBA workflows." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(b => (
                      <li key={b.id}>
                        <button onClick={() => setOpenId(b.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{b.name}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {b.status} · {b.state}
                              </div>
                            </div>
                            <Pill tone={b.urgency}>
                              {b.nearestExpDays !== null && b.nearestExpDays <= 14 && b.nearestExpDays >= 0
                                ? `${b.nearestExpDays}d exp` : `${b.prOverdue || b.missingAny}`}
                            </Pill>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section>
              <SectionLabel>High-risk BCBAs</SectionLabel>
              <Card>
                {highRisk.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No high-risk BCBAs." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {highRisk.map(b => (
                      <li key={b.id} className="p-3">
                        <button onClick={() => setOpenId(b.id)} className="w-full text-left">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{b.name}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {b.escalations} esc · {b.prOverdue} overdue PR · {b.missingAny} missing
                              </div>
                            </div>
                            <Pill tone={b.urgency}>{b.activeClients}</Pill>
                          </div>
                        </button>
                      </li>
                    ))}
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
                        <span className="text-[11px] text-muted-foreground tabular-nums">{w.active}</span>
                      </div>
                      {(w.overdue > 0 || w.escalated > 0) && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-9 flex-wrap">
                          {w.escalated > 0 && <Pill tone="crit">{w.escalated} escalated</Pill>}
                          {w.overdue > 0 && <Pill tone="warn">{w.overdue} overdue</Pill>}
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
                  <div className="text-xs text-muted-foreground">BCBA copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which BCBAs need follow-up?",
                    "Which PRs are overdue?",
                    "What expires within 30 days?",
                    "Which workflows are blocked?",
                    "Which BCBAs have escalations?",
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

      {openRow && (
        <BCBASlideout
          b={openRow}
          onClose={() => setOpenId(null)}
          onChanged={refresh}
          sourceById={sourceById}
        />
      )}
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
}: { value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[] }) {
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
function AwareCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone?: Tone }) {
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
function IconBtn({ icon: Icon, title, tone, to, onClick }:
  { icon: React.ElementType; title: string; tone?: Tone; to?: string; onClick?: () => void }) {
  const cls = cn(
    "h-8 w-8 rounded-lg grid place-items-center border transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
  );
  if (to) return <Link to={to} title={title} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>;
  return <button title={title} className={cls} onClick={onClick}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function BCBACard({ b, onOpen }: { b: BCBARow; onOpen: () => void }) {
  const accent =
    b.urgency === "crit" ? "before:bg-destructive/70" :
    b.urgency === "warn" ? "before:bg-amber-500/70" :
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
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center border shrink-0", toneClasses(b.urgency))}>
                <UserCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{b.name}</span>
                  <Pill tone={b.urgency}>{b.status}</Pill>
                  {b.escalated && <Pill tone="crit">Escalated</Pill>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} />
                    {b.states.length > 1 ? `${b.state} +${b.states.length - 1}` : b.state}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{b.activeClients} clients</span>
                  <span>·</span>
                  <span>QA {b.qaOwner ?? "Unassigned"}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone={b.prOverdue > 0 ? "crit" : b.prOpen > 0 ? "warn" : "ok"}>
                    <FileText className="h-3 w-3" strokeWidth={1.75} /> PR {b.prOverdue > 0 ? `${b.prOverdue} overdue` : b.prOpen > 0 ? `${b.prOpen} open` : "clear"}
                  </Pill>
                  <Pill tone={b.tpAwaiting > 0 ? "warn" : "ok"}>
                    <ClipboardList className="h-3 w-3" strokeWidth={1.75} /> TP {b.tpAwaiting > 0 ? `${b.tpAwaiting} pending` : "ready"}
                  </Pill>
                  {b.nearestExpDays !== null && b.nearestExpDays >= 0 && (
                    <Pill tone={b.nearestExpDays <= 14 ? "crit" : b.nearestExpDays <= 30 ? "warn" : "ok"}>
                      <Calendar className="h-3 w-3" strokeWidth={1.75} /> Next exp {b.nearestExpDays}d
                    </Pill>
                  )}
                  {b.missingAny > 0 && (
                    <Pill tone="warn">
                      <ShieldAlert className="h-3 w-3" strokeWidth={1.75} /> {b.missingAny} missing
                    </Pill>
                  )}
                  {b.inQA > 0 && (
                    <Pill tone="ok">
                      <Activity className="h-3 w-3" strokeWidth={1.75} /> {b.inQA} in QA
                    </Pill>
                  )}
                  {b.ready > 0 && (
                    <Pill tone="ok">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} /> {b.ready} ready
                    </Pill>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">
                  Latest: {b.lastActivity}
                </div>
              </div>
            </div>
          </button>
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <IconBtn title="Add QA note"    icon={StickyNote} onClick={onOpen} />
              <IconBtn title="Send follow-up" icon={Send}       onClick={onOpen} />
              <IconBtn title="Escalate"       icon={Flame} tone="crit" onClick={onOpen} />
            </div>
            <button onClick={onOpen}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition">
              Open BCBA <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function BCBASlideout({
  b, onClose, onChanged, sourceById,
}: {
  b: BCBARow;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
  sourceById: Map<string, "monday" | "manual" | "centralreach">;
}) {
  useSlideout(true, onClose);
  const checklist = [
    { ok: b.prOverdue === 0, label: "No overdue progress reports" },
    { ok: b.tpAwaiting === 0, label: "Treatment plans on file" },
    { ok: b.missingAny === 0, label: "No missing documentation" },
    { ok: !b.escalated, label: "No active escalations" },
    { ok: !(b.nearestExpDays !== null && b.nearestExpDays <= 14 && b.nearestExpDays >= 0), label: "No imminent expirations" },
    { ok: !!b.qaOwner, label: "QA owner assigned" },
  ];

  const clientRows = useMemo(() => {
    // dedupe per client and pick its primary auth
    const by = new Map<string, Authorization>();
    b.auths.forEach(a => {
      const k = a.clientId || a.clientName;
      const prev = by.get(k);
      if (!prev) { by.set(k, a); return; }
      // prefer the one with more urgency
      const score = (x: Authorization) => (x.missingInfo ? 10 : 0) + (x.stage === "Denied" ? 20 : 0)
        + (x.stage === "In QA Review" ? 8 : 0)
        + ((daysUntil(x.expirationDate) ?? 999) <= 30 ? 15 : 0);
      if (score(a) > score(prev)) by.set(k, a);
    });
    return Array.from(by.values());
  }, [b]);

  // Pick a primary authorization for BCBA-level workflow actions:
  // escalated > nearest expiration > most recent active.
  const primaryAuth = useMemo<Authorization | null>(() => {
    const auths = b.auths ?? [];
    if (auths.length === 0) return null;
    const score = (a: Authorization) => {
      const d = daysUntil(a.expirationDate);
      const expScore = d !== null && d >= 0 ? Math.max(0, 365 - d) : 0;
      const lastTs = new Date(a.lastActivity ?? 0).getTime() || 0;
      return (a.stage === "Denied" ? 100000 : 0)
        + (a.missingInfo ? 5000 : 0)
        + expScore * 10
        + (lastTs / 1e10);
    };
    return [...auths].sort((x, y) => score(y) - score(x))[0];
  }, [b]);
  const [selectedAuthId, setSelectedAuthId] = useState<string | null>(primaryAuth?.id ?? null);
  useEffect(() => { setSelectedAuthId(primaryAuth?.id ?? null); }, [primaryAuth?.id]);
  const activeAuth = b.auths.find(a => a.id === selectedAuthId) ?? primaryAuth ?? null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-card border-l border-border/70 z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/70 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{b.name}</h2>
              <Pill tone={b.urgency}>{b.status}</Pill>
              {b.escalated && <Pill tone="crit">Escalated</Pill>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {b.states.join(", ")} · {b.activeClients} clients · QA {b.qaOwner ?? "Unassigned"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <SectionLabel>Operational snapshot</SectionLabel>
            <Card className="p-4 grid grid-cols-2 gap-3">
              <Stat label="Active clients" value={b.activeClients} />
              <Stat label="Open PR" value={b.prOpen} tone={b.prOverdue > 0 ? "crit" : b.prOpen > 0 ? "warn" : "ok"} />
              <Stat label="Overdue PR" value={b.prOverdue} tone={b.prOverdue > 0 ? "crit" : "ok"} />
              <Stat label="Missing docs" value={b.missingAny} tone={b.missingAny > 0 ? "warn" : "ok"} />
              <Stat label="Expiring ≤30d" value={b.expiring30} tone={b.expiring30 > 0 ? "warn" : "ok"} />
              <Stat label="Escalations" value={b.escalations} tone={b.escalations > 0 ? "crit" : "ok"} />
              <Stat label="In QA" value={b.inQA} />
              <Stat label="Ready" value={b.ready} tone="ok" />
            </Card>
          </section>

          <section>
            <SectionLabel>Readiness checklist</SectionLabel>
            <Card className="p-4">
              <ul className="space-y-2">
                {checklist.map((it, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn("h-4 w-4 shrink-0", it.ok ? "text-emerald-600" : "text-muted-foreground/40")} strokeWidth={1.75} />
                    <span className={cn(it.ok ? "text-foreground" : "text-muted-foreground")}>{it.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <ActionBtn icon={FileText}      label="View PR workflows"   to="/reports" />
            <ActionBtn icon={ClipboardList} label="Open QA queue"       to={`/qa-queue?bcba=${encodeURIComponent(b.name)}`} />
            <ActionBtn icon={ClipboardList} label="Open escalations"    to={`/escalations-followups?bcba=${encodeURIComponent(b.name)}`} />
            <ActionBtn icon={ExternalLink}  label="QA clients"          to={`/qa-clients?bcba=${encodeURIComponent(b.name)}`} />
          </section>

          {activeAuth && (
            <section>
              <SectionLabel>QA actions (BCBA-level context)</SectionLabel>
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">Acting on</label>
                  <select
                    value={activeAuth.id}
                    onChange={(e) => setSelectedAuthId(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-border/60 bg-card px-2 text-xs"
                  >
                    {b.auths.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.clientName} · {a.stage}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Notes, follow-ups, and escalations are persisted against the selected client authorization with BCBA-level context.
                </p>
                <QAActionsPanel
                  auth={activeAuth}
                  sourceSystem={sourceById.get(activeAuth.id)}
                  onChanged={onChanged}
                />
              </Card>
            </section>
          )}

          <section>
            <SectionLabel>Assigned clients ({clientRows.length})</SectionLabel>
            <Card>
              <ul className="divide-y divide-border/60">
                {clientRows.slice(0, 8).map(a => {
                  const d = daysUntil(a.expirationDate);
                  const hasPR = a.missingRequirements.some(r => PR_KW.test(r));
                  const hasTP = a.missingRequirements.some(r => TP_KW.test(r));
                  const tone: Tone = a.stage === "Denied" || (d !== null && d <= 7 && d >= 0) ? "crit"
                    : a.missingInfo || (d !== null && d <= 30 && d >= 0) ? "warn" : "ok";
                  return (
                    <li key={a.id} className="p-3 flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0 border", toneClasses(tone))}>
                        <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{a.clientName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {a.stage} · {a.state} · {a.payor}{d !== null ? ` · Exp ${d}d` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasPR && <Pill tone="warn">PR</Pill>}
                        {hasTP && <Pill tone="warn">TP</Pill>}
                        {a.missingInfo && !hasPR && !hasTP && <Pill tone="warn">Missing</Pill>}
                        <Link
                          to={`/qa-queue?focus=${encodeURIComponent(a.id)}`}
                          className="ml-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                          title="Open in QA queue"
                        >
                          Open <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </li>
                  );
                })}
                {clientRows.length > 8 && (
                  <li className="p-3 text-[11px] text-muted-foreground">+{clientRows.length - 8} more clients</li>
                )}
              </ul>
            </Card>
          </section>

          <section>
            <SectionLabel>Supervision visibility</SectionLabel>
            <Card className="p-4 space-y-2">
              <Row icon={UserCheck} label="Assigned BCBA" value={b.name} />
              <Row icon={Users} label="Active clients" value={`${b.activeClients}`} />
              <Row icon={ShieldAlert} label="Open blockers" value={`${b.missingAny}`} />
              <Row icon={TrendingUp} label="Responsiveness" value={b.prOverdue > 0 ? "Delayed" : b.prOpen > 0 ? "Engaged" : "On track"} />
              <Row icon={History} label="Latest activity" value={b.lastActivity} />
            </Card>
          </section>

          <ClinicalDirectorSection
            sourceType="bcba"
            sourceRecordId={b.id}
            bcbaName={b.name}
            state={b.state}
            defaultTitle={`BCBA oversight: ${b.name}`}
            metadata={{
              activeClients: b.activeClients,
              overdueProgressReports: b.prOverdue,
              treatmentPlansAwaiting: b.tpAwaiting,
              escalations: b.escalations,
              states: b.states,
              centralReachClientId: null,
            }}
          />
        </div>
      </aside>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-0.5 text-lg font-semibold tabular-nums",
        tone === "crit" ? "text-destructive" :
        tone === "warn" ? "text-amber-700 dark:text-amber-400" :
        "text-foreground",
      )}>{value}</div>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, tone, to }: { icon: React.ElementType; label: string; tone?: Tone; to?: string }) {
  const cls = cn(
    "h-10 rounded-xl border px-3 text-sm font-medium inline-flex items-center justify-center gap-2 transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/70 text-foreground hover:bg-muted",
  );
  const content = <><Icon className="h-4 w-4" strokeWidth={1.75} />{label}</>;
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  return <button className={cls}>{content}</button>;
}
function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}