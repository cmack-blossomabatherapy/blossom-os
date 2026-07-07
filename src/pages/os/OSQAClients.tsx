import { useMemo, useState } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  Brain, Inbox, AlertTriangle, ChevronRight, Users, FileText, FileSignature,
  ShieldAlert, X, Clock, Activity, History, MapPin, UserCheck, ClipboardList,
  Calendar, Workflow, MessageCircle,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";

// QA → Clients. Operational client oversight for QA.
// Real data only via useLiveAuthorizations, aggregated per client.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "attention" | "expiring" | "missing" | "escalated" | "ready";

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

// ---------- client aggregation ----------
type ClientWorkflowStatus =
  | "In QA"
  | "Pending Treatment Auth"
  | "Awaiting PR"
  | "Missing Information"
  | "Expiring Soon"
  | "Staffing Needed"
  | "Waiting on BCBA"
  | "Ready for Submission"
  | "Escalated"
  | "Active";

type ClientRow = {
  id: string;
  name: string;
  state: string;
  payor: string;
  bcba: string;
  qaOwner: string | null;
  status: ClientWorkflowStatus;
  urgency: Tone;
  escalated: boolean;
  auths: Authorization[];
  primary: Authorization;
  expDays: number | null;
  daysInStage: number;
  missingItems: string[];
  prStatus: "Received" | "Requested" | "Overdue" | "Not Required";
  tpStatus: "Received" | "In QA" | "Awaiting" | "Approved";
  lastActivity: string;
  lastActivityIso: string | null;
  needsAttention: boolean;
  readyForSubmission: boolean;
  pendingTreatmentAuth: boolean;
};

const PR_KW = /progress report|\bpr\b/i;
const TP_KW = /treatment plan|\btp\b/i;
const SIG_KW = /sign|signature|consent/i;

function deriveStatus(a: Authorization, daysBlocked: number, expDays: number | null): { status: ClientWorkflowStatus; urgency: Tone; escalated: boolean } {
  if (a.stage === "Denied") return { status: "Escalated", urgency: "crit", escalated: true };
  if (expDays !== null && expDays >= 0 && expDays <= 7) return { status: "Expiring Soon", urgency: "crit", escalated: true };
  if (a.missingInfo && daysBlocked > 10) return { status: "Missing Information", urgency: "crit", escalated: true };
  if (a.missingInfo) {
    const hasPR = a.missingRequirements.some(r => PR_KW.test(r));
    if (hasPR) return { status: "Awaiting PR", urgency: "warn", escalated: false };
    return { status: "Missing Information", urgency: "warn", escalated: false };
  }
  if (expDays !== null && expDays >= 0 && expDays <= 30) return { status: "Expiring Soon", urgency: "warn", escalated: false };
  if (a.stage === "Expiring Soon") return { status: "Expiring Soon", urgency: "warn", escalated: false };
  if (a.stage === "In QA Review") return { status: "In QA", urgency: daysBlocked > 5 ? "warn" : "ok", escalated: false };
  if (a.stage === "Awaiting Submission") {
    if (a.treatmentPlanReceived === false) return { status: "Pending Treatment Auth", urgency: "warn", escalated: false };
    return { status: "Ready for Submission", urgency: "ok", escalated: false };
  }
  if (a.stage === "Submitted") return { status: "Active", urgency: "ok", escalated: false };
  if (a.stage === "Approved") return { status: "Active", urgency: "ok", escalated: false };
  return { status: "Active", urgency: "ok", escalated: false };
}

function buildClients(items: Authorization[]): ClientRow[] {
  // Group authorizations by client identity.
  const byClient = new Map<string, Authorization[]>();
  for (const a of items) {
    const key = a.clientId || a.clientName;
    if (!key) continue;
    if (a.stage === "Flaked Client") continue; // not operational QA work
    const arr = byClient.get(key) ?? [];
    arr.push(a);
    byClient.set(key, arr);
  }

  const rows: ClientRow[] = [];
  byClient.forEach((auths, key) => {
    // Choose the operationally most relevant authorization as primary.
    const sorted = [...auths].sort((a, b) => {
      const score = (x: Authorization) => {
        let s = 0;
        if (x.missingInfo) s += 40;
        if (x.stage === "In QA Review") s += 20;
        if (x.stage === "Awaiting Submission") s += 15;
        if (x.stage === "Expiring Soon") s += 30;
        if (x.stage === "Denied") s += 50;
        const d = daysUntil(x.expirationDate);
        if (d !== null && d >= 0 && d <= 30) s += 25;
        s += Math.min(x.daysInStage, 30);
        return s;
      };
      return score(b) - score(a);
    });
    const primary = sorted[0];
    const expDays = daysUntil(primary.expirationDate);
    const { status, urgency, escalated } = deriveStatus(primary, primary.daysInStage, expDays);

    const missingItems = Array.from(new Set(auths.flatMap(a => a.missingRequirements)));
    const hasPRMissing = missingItems.some(r => PR_KW.test(r));
    const hasTPMissing = missingItems.some(r => TP_KW.test(r));
    const prStatus: ClientRow["prStatus"] =
      hasPRMissing && primary.daysInStage > 7 ? "Overdue" :
      hasPRMissing ? "Requested" :
      auths.some(a => a.stage === "Approved" || a.stage === "Submitted") ? "Received" : "Not Required";
    const tpStatus: ClientRow["tpStatus"] =
      auths.some(a => a.stage === "Approved") ? "Approved" :
      hasTPMissing ? "Awaiting" :
      primary.stage === "In QA Review" ? "In QA" : "Received";

    rows.push({
      id: key,
      name: primary.clientName,
      state: primary.state,
      payor: primary.payor,
      bcba: primary.coordinator,
      qaOwner: primary.qaOwner,
      status,
      urgency,
      escalated,
      auths: sorted,
      primary,
      expDays,
      daysInStage: primary.daysInStage,
      missingItems,
      prStatus,
      tpStatus,
      lastActivity: primary.lastActivity,
      lastActivityIso: (primary as unknown as { updatedAt?: string }).updatedAt ?? null,
      needsAttention: primary.missingInfo || primary.stage === "In QA Review" || (expDays !== null && expDays <= 30 && expDays >= 0) || primary.stage === "Denied",
      readyForSubmission: !primary.missingInfo && primary.stage === "Awaiting Submission" && primary.treatmentPlanReceived !== false,
      pendingTreatmentAuth: primary.stage === "Awaiting Submission" || (primary.stage === "In QA Review" && primary.authType === "Treatment"),
    });
  });

  return rows;
}

// ---------- page ----------
export default function OSQAClients() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const allClients = useMemo(() => buildClients(items), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [qaFilter, setQaFilter] = useState("all");
  const [prFilter, setPrFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  // QA Pass 6 deep links — grouped page: translate auth id / client param
  // into the client-group's drawer id (`ClientRow.id`).
  useQADeepLink({
    items,
    loading,
    setOpenId,
    setQuery,
    setBcbaFilter,
    resolveOpenIdForAuth: (authId) => {
      const group = allClients.find((c) => c.auths.some((a) => a.id === authId));
      return group ? group.id : null;
    },
    resolveOpenIdForClient: (param) => {
      const p = param.toLowerCase();
      const match = allClients.find(
        (c) => c.id === param || c.name.toLowerCase() === p,
      );
      return match ? match.id : null;
    },
  });

  const states  = useMemo(() => Array.from(new Set(allClients.map(c => c.state).filter(Boolean))).sort(), [allClients]);
  const bcbas   = useMemo(() => Array.from(new Set(allClients.map(c => c.bcba).filter(Boolean))).sort(), [allClients]);
  const qaList  = useMemo(() => {
    const s = new Set<string>();
    allClients.forEach(c => { if (c.qaOwner) s.add(c.qaOwner); });
    return Array.from(s).sort();
  }, [allClients]);
  const statuses = useMemo(() => Array.from(new Set(allClients.map(c => c.status))).sort(), [allClients]);

  const tabbed = useMemo(() => ({
    all:        allClients,
    attention:  allClients.filter(c => c.needsAttention),
    expiring:   allClients.filter(c => c.expDays !== null && c.expDays >= 0 && c.expDays <= 60),
    missing:    allClients.filter(c => c.primary.missingInfo),
    escalated:  allClients.filter(c => c.escalated),
    ready:      allClients.filter(c => c.readyForSubmission),
  } as Record<TabKey, ClientRow[]>), [allClients]);

  const counts = {
    all: tabbed.all.length,
    attention: tabbed.attention.length,
    expiring: tabbed.expiring.length,
    missing: tabbed.missing.length,
    escalated: tabbed.escalated.length,
    ready: tabbed.ready.length,
  };

  const awareCounts = useMemo(() => ({
    attention: tabbed.attention.length,
    pendingAuth: allClients.filter(c => c.pendingTreatmentAuth).length,
    expiring: tabbed.expiring.length,
    missing: tabbed.missing.length,
    escalated: tabbed.escalated.length,
  }), [allClients, tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(c => {
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (bcbaFilter !== "all" && c.bcba !== bcbaFilter) return false;
      if (qaFilter !== "all" && c.qaOwner !== qaFilter) return false;
      if (prFilter !== "all" && c.prStatus !== prFilter) return false;
      if (expFilter === "soon" && !(c.expDays !== null && c.expDays >= 0 && c.expDays <= 30)) return false;
      if (expFilter === "60"   && !(c.expDays !== null && c.expDays >= 0 && c.expDays <= 60)) return false;
      if (expFilter === "90"   && !(c.expDays !== null && c.expDays >= 0 && c.expDays <= 90)) return false;
      if (escFilter === "escalated" && !c.escalated) return false;
      if (escFilter === "normal"    && c.escalated) return false;
      if (q) {
        const hay = [c.name, c.bcba, c.qaOwner ?? "", c.state, c.payor, c.status, ...c.missingItems].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const rank = (z: ClientRow) => z.urgency === "crit" ? 3 : z.urgency === "warn" ? 2 : 1;
      const r = rank(b) - rank(a);
      if (r !== 0) return r;
      const ea = a.expDays ?? 9999;
      const eb = b.expDays ?? 9999;
      if (ea !== eb) return ea - eb;
      return b.daysInStage - a.daysInStage;
    });
  }, [tabbed, tab, query, stateFilter, statusFilter, bcbaFilter, qaFilter, prFilter, expFilter, escFilter]);

  const grouped = useMemo(() => {
    if (tab !== "all") return null;
    const map = new Map<string, ClientRow[]>();
    visible.forEach(c => {
      const key = c.urgency === "crit" ? "Critical" : c.urgency === "warn" ? "High priority" : "Stable";
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const order = { "Critical": 0, "High priority": 1, "Stable": 2 } as Record<string, number>;
      return (order[a] ?? 9) - (order[b] ?? 9);
    });
  }, [tab, visible]);

  // Expiring windows (dedicated section)
  const expBuckets = useMemo(() => {
    const within = (min: number, max: number) =>
      allClients.filter(c => c.expDays !== null && c.expDays >= min && c.expDays <= max);
    return {
      d30:  within(0, 30),
      d60:  within(31, 60),
      d90:  within(61, 90),
      risk: allClients.filter(c => c.expDays !== null && c.expDays >= 0 && c.expDays <= 14 && (c.primary.missingInfo || c.prStatus === "Overdue" || c.tpStatus === "Awaiting")),
    };
  }, [allClients]);

  // Sidebar
  const priorities = useMemo(() => {
    return [...tabbed.escalated, ...tabbed.attention]
      .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
      .sort((a, b) => (a.expDays ?? 999) - (b.expDays ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const bcbaFollow = useMemo(() => {
    const byBcba = new Map<string, { bcba: string; rows: ClientRow[] }>();
    allClients.filter(c => c.primary.missingInfo).forEach(c => {
      const k = c.bcba || "Unassigned";
      const v = byBcba.get(k) ?? { bcba: k, rows: [] };
      v.rows.push(c);
      byBcba.set(k, v);
    });
    return Array.from(byBcba.values())
      .sort((a, b) => b.rows.length - a.rows.length)
      .slice(0, 6);
  }, [allClients]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = allClients.filter(c => c.qaOwner === name);
      return {
        name,
        active:    owned.length,
        overdue:   owned.filter(c => c.daysInStage > 7 || (c.expDays !== null && c.expDays <= 14 && c.expDays >= 0)).length,
        escalated: owned.filter(c => c.escalated).length,
      };
    });
  }, [allClients]);

  const openClient = visible.find(c => c.id === openId) ?? allClients.find(c => c.id === openId) ?? null;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",        label: "All Clients",       count: counts.all },
    { key: "attention",  label: "Needs Attention",   count: counts.attention, tone: "warn" },
    { key: "expiring",   label: "Expiring",          count: counts.expiring,  tone: "warn" },
    { key: "missing",    label: "Missing Info",      count: counts.missing,   tone: "warn" },
    { key: "escalated",  label: "Escalated",         count: counts.escalated, tone: "crit" },
    { key: "ready",      label: "Ready",             count: counts.ready },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Clients</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Monitor client QA workflows, authorization readiness, PR status, and operational blockers.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.all} active
              </span>
              {awareCounts.attention > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {awareCounts.attention} need attention
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
              placeholder="Search client, BCBA, authorization, PR status, or workflow..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Workflow"
              options={[{ value: "all", label: "All workflow statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={qaFilter} onChange={setQaFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...qaList.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={prFilter} onChange={setPrFilter} label="PR Status"
              options={[
                { value: "all", label: "All PR status" },
                { value: "Received", label: "PR received" },
                { value: "Requested", label: "PR requested" },
                { value: "Overdue", label: "PR overdue" },
                { value: "Not Required", label: "Not required" },
              ]} />
            <FilterSelect value={expFilter} onChange={setExpFilter} label="Expiring"
              options={[
                { value: "all", label: "Any expiration" },
                { value: "soon", label: "≤ 30 days" },
                { value: "60",   label: "≤ 60 days" },
                { value: "90",   label: "≤ 90 days" },
              ]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "Escalated" },
                { value: "normal", label: "Normal" },
              ]} />
          </div>
        </header>

        {/* AWARENESS CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwareCard icon={AlertTriangle}   label="Requires QA Attention"  value={awareCounts.attention} tone="warn" />
          <AwareCard icon={ClipboardList}   label="Pending Treatment Auth" value={awareCounts.pendingAuth} />
          <AwareCard icon={Calendar}        label="Expiring (≤60d)"        value={awareCounts.expiring} tone="warn" />
          <AwareCard icon={FileText}        label="Missing Information"    value={awareCounts.missing}  tone="warn" />
          <AwareCard icon={Flame}           label="Escalated Workflows"    value={awareCounts.escalated} tone="crit" />
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
                {visible.length} {visible.length === 1 ? "client" : "clients"}
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
                    tab === "escalated" ? "No urgent escalations today." :
                    tab === "expiring"  ? "No clients expiring in this window." :
                    tab === "missing"   ? "No clients missing information." :
                    tab === "ready"     ? "No clients are ready for submission." :
                    tab === "attention" ? "No clients need QA attention right now." :
                                          "No clients match these filters."
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
                      {rows.map(c => (
                        <ClientCard key={c.id} c={c} onOpen={() => setOpenId(c.id)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map(c => (
                  <ClientCard key={c.id} c={c} onOpen={() => setOpenId(c.id)} />
                ))}
              </ul>
            )}

            {/* EXPIRING WORKFLOWS */}
            {tab === "all" && (expBuckets.d30.length + expBuckets.d60.length + expBuckets.d90.length) > 0 && (
              <section className="pt-4">
                <SectionLabel>Expiring client workflows</SectionLabel>
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <ExpBucket label="Next 30 days"  tone="crit" rows={expBuckets.d30}  onOpen={setOpenId} />
                    <ExpBucket label="31–60 days"    tone="warn" rows={expBuckets.d60}  onOpen={setOpenId} />
                    <ExpBucket label="61–90 days"    tone="ok"   rows={expBuckets.d90}  onOpen={setOpenId} />
                    <ExpBucket label="High risk"     tone="crit" rows={expBuckets.risk} onOpen={setOpenId} />
                  </div>
                </Card>
              </section>
            )}

            {/* PR & TP VISIBILITY */}
            {tab === "all" && (
              <section className="pt-4">
                <SectionLabel>PR &amp; treatment plan visibility</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MiniGroup title="Progress reports">
                    <MiniRow label="Received"  value={allClients.filter(c => c.prStatus === "Received").length}  tone="ok" />
                    <MiniRow label="Requested" value={allClients.filter(c => c.prStatus === "Requested").length} tone="warn" />
                    <MiniRow label="Overdue"   value={allClients.filter(c => c.prStatus === "Overdue").length}   tone="crit" />
                  </MiniGroup>
                  <MiniGroup title="Treatment plans">
                    <MiniRow label="Received"  value={allClients.filter(c => c.tpStatus === "Received").length} tone="ok" />
                    <MiniRow label="In QA"     value={allClients.filter(c => c.tpStatus === "In QA").length}    tone="warn" />
                    <MiniRow label="Awaiting"  value={allClients.filter(c => c.tpStatus === "Awaiting").length} tone="crit" />
                    <MiniRow label="Approved"  value={allClients.filter(c => c.tpStatus === "Approved").length} tone="ok" />
                  </MiniGroup>
                </div>
              </section>
            )}

            {/* ESCALATIONS & BLOCKERS */}
            {tab === "all" && tabbed.escalated.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Escalations &amp; blockers</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.escalated.slice(0, 6).map(c => (
                      <li key={c.id}>
                        <button onClick={() => setOpenId(c.id)}
                          className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 grid place-items-center shrink-0">
                            <Flame className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {c.name} <span className="text-muted-foreground font-normal">— {c.status}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {c.state} · BCBA {c.bcba} · {c.daysInStage}d in stage
                              {c.missingItems[0] ? ` · ${c.missingItems[0]}` : ""}
                            </div>
                          </div>
                          <Pill tone="crit">
                            {c.expDays !== null && c.expDays >= 0 && c.expDays <= 14 ? `Exp ${c.expDays}d` : "Escalated"}
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
                  <EmptyState icon={CheckCircle2} title="You're all caught up." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(c => (
                      <li key={c.id}>
                        <button onClick={() => setOpenId(c.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {c.status} · {c.state}
                              </div>
                            </div>
                            <Pill tone={c.urgency}>
                              {c.expDays !== null && c.expDays <= 14 && c.expDays >= 0 ? `${c.expDays}d exp` : `${c.daysInStage}d`}
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
              <SectionLabel>BCBA follow-up tracker</SectionLabel>
              <Card>
                {bcbaFollow.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No BCBA follow-ups pending." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {bcbaFollow.map(g => {
                      const worst = [...g.rows].sort((a, b) => b.daysInStage - a.daysInStage)[0];
                      return (
                        <li key={g.bcba} className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{g.bcba}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {g.rows.length} open · Oldest: {worst.daysInStage}d
                              </div>
                            </div>
                            <Pill tone={worst.urgency}>{worst.daysInStage}d</Pill>
                          </div>
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
                  <div className="text-xs text-muted-foreground">Client copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which clients need attention first?",
                    "Which clients are high risk?",
                    "Which PRs are overdue?",
                    "Which workflows are blocked?",
                    "What expires within 30 days?",
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

      {openClient && <ClientSlideout c={openClient} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openClient.primary.id)} />}
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
}: { icon: React.ElementType; title: string; tone?: Tone; to?: string; onClick?: (e: React.MouseEvent) => void }) {
  const cls = cn(
    "h-8 w-8 rounded-lg grid place-items-center border transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
  );
  if (to) return <Link to={to} title={title} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>;
  return <button title={title} className={cls} onClick={onClick}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function MiniGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <ul className="space-y-1.5">{children}</ul>
    </Card>
  );
}
function MiniRow({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Pill tone={tone}>{value}</Pill>
    </li>
  );
}

function ExpBucket({ label, tone, rows, onOpen }: { label: string; tone: Tone; rows: ClientRow[]; onOpen: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <Pill tone={tone}>{rows.length}</Pill>
      </div>
      {rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="space-y-1">
          {rows.slice(0, 4).map(c => (
            <li key={c.id}>
              <button onClick={() => onOpen(c.id)}
                className="w-full text-left text-[12px] px-2 py-1.5 rounded-lg hover:bg-muted transition truncate flex items-center justify-between gap-2">
                <span className="truncate text-foreground">{c.name}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">{c.expDays ?? "—"}d</span>
              </button>
            </li>
          ))}
          {rows.length > 4 && (
            <li className="text-[11px] text-muted-foreground px-2 pt-1">+{rows.length - 4} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

function ClientCard({ c, onOpen }: { c: ClientRow; onOpen: () => void }) {
  const accent =
    c.urgency === "crit" ? "before:bg-destructive/70" :
    c.urgency === "warn" ? "before:bg-amber-500/70" :
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
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center border shrink-0", toneClasses(c.urgency))}>
                <Users className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{c.name}</span>
                  <Pill tone={c.urgency}>{c.status}</Pill>
                  {c.escalated && <Pill tone="crit">Escalated</Pill>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} />{c.state}</span>
                  <span>·</span>
                  <span>{c.payor}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3" strokeWidth={1.75} />BCBA {c.bcba}</span>
                  <span>·</span>
                  <span>QA {c.qaOwner ?? "Unassigned"}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone={c.prStatus === "Overdue" ? "crit" : c.prStatus === "Requested" ? "warn" : "ok"}>
                    <FileText className="h-3 w-3" strokeWidth={1.75} /> PR {c.prStatus}
                  </Pill>
                  <Pill tone={c.tpStatus === "Awaiting" ? "crit" : c.tpStatus === "In QA" ? "warn" : "ok"}>
                    <ClipboardList className="h-3 w-3" strokeWidth={1.75} /> TP {c.tpStatus}
                  </Pill>
                  {c.expDays !== null && c.expDays >= 0 && c.expDays <= 90 && (
                    <Pill tone={c.expDays <= 14 ? "crit" : c.expDays <= 30 ? "warn" : "ok"}>
                      <Calendar className="h-3 w-3" strokeWidth={1.75} /> Exp {c.expDays}d
                    </Pill>
                  )}
                  <Pill tone={c.daysInStage > 10 ? "crit" : c.daysInStage > 5 ? "warn" : "ok"}>
                    <Clock className="h-3 w-3" strokeWidth={1.75} /> {c.daysInStage}d in stage
                  </Pill>
                </div>
                {c.missingItems.length > 0 && (
                  <div className="mt-2 text-[12px] text-muted-foreground truncate">
                    <span className="font-medium text-foreground">Blockers: </span>
                    {c.missingItems.slice(0, 3).join(" · ")}
                    {c.missingItems.length > 3 && ` · +${c.missingItems.length - 3} more`}
                  </div>
                )}
                <div className="mt-1.5 text-[11px] text-muted-foreground truncate">
                  Latest: {c.lastActivity} · {relTime(c.lastActivityIso)}
                </div>
              </div>
            </div>
          </button>
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <IconBtn title="Add QA note"    icon={StickyNote} onClick={onOpen} />
              <IconBtn title="Send follow-up" icon={Send} onClick={onOpen} />
              <IconBtn title="Escalate"       icon={Flame} tone="crit" onClick={onOpen} />
            </div>
            <button onClick={onOpen}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition">
              Open client <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function ClientSlideout({ c, onClose, onChanged, sourceSystem }: { c: ClientRow; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const checklist = [
    { ok: !c.primary.missingInfo, label: "All required information received" },
    { ok: c.tpStatus === "Received" || c.tpStatus === "Approved", label: "Treatment plan on file" },
    { ok: c.prStatus === "Received" || c.prStatus === "Not Required", label: "Progress report on file" },
    { ok: c.primary.stage !== "In QA Review", label: "QA review complete" },
    { ok: !!c.qaOwner, label: "QA owner assigned" },
    { ok: !c.escalated, label: "No active escalations" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-card border-l border-border/70 z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/70 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{c.name}</h2>
              <Pill tone={c.urgency}>{c.status}</Pill>
              {c.escalated && <Pill tone="crit">Escalated</Pill>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {c.state} · {c.payor} · BCBA {c.bcba} · QA {c.qaOwner ?? "Unassigned"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Readiness */}
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

          {/* Quick actions */}
          <section className="space-y-2">
            <SectionLabel>Quick actions</SectionLabel>
            <QAActionsPanel auth={c.primary} sourceSystem={sourceSystem} onChanged={onChanged} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ActionBtn icon={ExternalLink} label="Open client" to={`/qa-clients?client=${encodeURIComponent(c.primary.clientName ?? c.primary.clientId)}`} />
              <ActionBtn icon={ClipboardList} label="View authorization" to="/authorization-reviews" />
              <ActionBtn icon={FileText}     label="View PR workflow" to="/reports" />
            </div>
          </section>

          {/* Workflow timeline */}
          <section>
            <SectionLabel>Workflow timeline</SectionLabel>
            <Card className="p-4 space-y-3">
              <Row icon={Activity} label="Current stage"      value={c.primary.stage} />
              <Row icon={Clock}    label="Days in stage"      value={`${c.daysInStage}d`} />
              <Row icon={Calendar} label="Authorization expires" value={c.primary.expirationDate ?? "—"} sub={c.expDays !== null ? `${c.expDays}d` : null} />
              <Row icon={Workflow} label="Next task due"      value={c.primary.nextTaskDue ?? "—"} />
              <Row icon={History}  label="Last activity"      value={c.lastActivity} sub={relTime(c.lastActivityIso)} />
            </Card>
          </section>

          {/* Authorizations */}
          <section>
            <SectionLabel>Authorizations ({c.auths.length})</SectionLabel>
            <Card>
              <ul className="divide-y divide-border/60">
                {c.auths.slice(0, 5).map(a => (
                  <li key={a.id} className="p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">{a.authType} · {a.stage}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {a.payor} · Exp {a.expirationDate ?? "—"}{a.hours ? ` · ${a.hours}` : ""}
                      </div>
                    </div>
                    {a.missingInfo && <Pill tone="warn">Missing</Pill>}
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* QA notes */}
          {c.primary.qaNotes && (
            <section>
              <SectionLabel>QA notes</SectionLabel>
              <Card className="p-4 text-sm text-foreground">
                {c.primary.qaNotes}
              </Card>
            </section>
          )}

          {/* Blockers */}
          {c.missingItems.length > 0 && (
            <section>
              <SectionLabel>Open blockers</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {c.missingItems.map((m, i) => {
                    const isSig = SIG_KW.test(m);
                    return (
                      <li key={i} className="p-3 flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0 border", toneClasses("warn"))}>
                          {isSig
                            ? <FileSignature className="h-3.5 w-3.5" strokeWidth={1.75} />
                            : <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />}
                        </div>
                        <div className="text-sm text-foreground flex-1 truncate">{m}</div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          )}

          {/* Supervision visibility (lightweight) */}
          <section>
            <SectionLabel>Supervision visibility</SectionLabel>
            <Card className="p-4 space-y-2">
              <Row icon={UserCheck} label="Assigned BCBA"   value={c.bcba} />
              <Row icon={MessageCircle} label="Last contact" value={relTime(c.lastActivityIso)} />
              <Row icon={ShieldAlert} label="Open blockers"  value={`${c.missingItems.length}`} />
            </Card>
          </section>
        </div>
      </aside>
    </>
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

function Row({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground truncate">{value}{sub ? <span className="text-muted-foreground"> · {sub}</span> : null}</div>
      </div>
    </div>
  );
}