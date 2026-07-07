import { useMemo, useState } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  Brain, AlertTriangle, ChevronRight, Users, FileText, ShieldAlert,
  X, Clock, Activity, History, MapPin, UserCheck, ClipboardList,
  Calendar, MessageCircle, Eye, ClipboardCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import { useCentralReachOps, type ClientPairing } from "@/hooks/useCentralReachOps";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";
import { ClinicalDirectorSection } from "@/components/clinical/ClinicalDirectorSection";

// QA → Supervision Visibility.
// Real data only — pairs CentralReach client/BCBA/RBT pairings (incl. last BCBA
// supervision session date) with live authorizations for PR / TP / expiration
// readiness. No fake supervision rows.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "missing_doc" | "followup" | "expiring" | "escalated" | "ready";

const QA_TEAM = [
  "Rochel Walzman", "Amanda Avalos", "Julianne Rodriguez", "Anje Grobler", "Raizy Folger",
];

const PR_KW = /progress report|\bpr\b/i;
const TP_KW = /treatment plan|\btp\b/i;
const SUP_KW = /supervis|observation/i;

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
function toneClasses(t: Tone) {
  switch (t) {
    case "crit": return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

// ---------- Supervision workflow rows ----------

type SupRow = {
  id: string;
  clientName: string;
  state: string;
  bcba: string | null;
  rbts: string[];
  qaOwner: string | null;
  auth: Authorization | null;
  lastBcbaSession: string | null;     // ISO
  daysSinceSup: number | null;        // null => never recorded
  expirationDays: number | null;
  prMissing: boolean;
  tpMissing: boolean;
  supDocMissing: boolean;             // explicit supervision item flagged on auth
  missingAny: boolean;
  blockerSummary: string;
  escalated: boolean;
  urgency: Tone;
  status:
    | "Supervision Current"
    | "Missing Documentation"
    | "Awaiting BCBA Follow-Up"
    | "Expiring Soon"
    | "PR Risk"
    | "Escalated"
    | "Overdue"
    | "Ready for Submission"
    | "Blocked";
  latestNote: string;
};

function buildSupRows(
  pairings: ClientPairing[],
  auths: Authorization[],
  bcbaById: Map<string, string>,
): SupRow[] {
  // index auths by client lowercase, pick most operationally-relevant
  const authByClient = new Map<string, Authorization>();
  const score = (a: Authorization) => {
    const d = daysUntil(a.expirationDate);
    return (a.missingInfo ? 6 : 0)
      + (a.stage === "Denied" ? 20 : 0)
      + (a.stage === "In QA Review" ? 4 : 0)
      + (a.stage === "Expiring Soon" ? 10 : 0)
      + (d !== null && d >= 0 && d <= 30 ? 12 : 0)
      + (a.daysInStage > 14 ? 3 : 0);
  };
  for (const a of auths) {
    if (a.stage === "Flaked Client") continue;
    const k = a.clientName.toLowerCase();
    const prev = authByClient.get(k);
    if (!prev || score(a) > score(prev)) authByClient.set(k, a);
  }

  // also include auths whose client isn't yet a pairing (still operationally
  // relevant for supervision/QA readiness). We dedupe by clientName lower.
  const rows: SupRow[] = [];
  const seen = new Set<string>();

  const buildFor = (clientName: string, state: string | null, bcba: string | null, rbts: string[], lastSup: string | null) => {
    const k = clientName.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    const a = authByClient.get(k) ?? null;
    const authBcba = a ? (bcbaById.get(a.id) ?? null) : null;
    const expirationDays = a ? daysUntil(a.expirationDate) : null;
    const prMissing = !!a && a.missingRequirements.some(r => PR_KW.test(r));
    const tpMissing = !!a && (a.missingRequirements.some(r => TP_KW.test(r)) || a.treatmentPlanReceived === false);
    const supDocMissing = !!a && a.missingRequirements.some(r => SUP_KW.test(r));
    const missingAny = !!a && a.missingInfo;
    const daysSinceSup = daysSince(lastSup);
    const noRecordedSup = lastSup === null;

    // urgency
    let urgency: Tone = "ok";
    if (
      (a && a.stage === "Denied") ||
      (expirationDays !== null && expirationDays >= 0 && expirationDays <= 7) ||
      (daysSinceSup !== null && daysSinceSup >= 21) ||
      noRecordedSup
    ) urgency = "crit";
    else if (
      prMissing || tpMissing || supDocMissing || missingAny ||
      (expirationDays !== null && expirationDays >= 0 && expirationDays <= 30) ||
      (daysSinceSup !== null && daysSinceSup >= 14)
    ) urgency = "warn";

    const escalated =
      (a?.stage === "Denied") ||
      (expirationDays !== null && expirationDays >= 0 && expirationDays <= 7 && (prMissing || tpMissing || supDocMissing || noRecordedSup)) ||
      (daysSinceSup !== null && daysSinceSup >= 28) ||
      (supDocMissing && expirationDays !== null && expirationDays >= 0 && expirationDays <= 21);

    let status: SupRow["status"] = "Supervision Current";
    if (escalated) status = "Escalated";
    else if (a?.stage === "Denied") status = "Blocked";
    else if (noRecordedSup || supDocMissing) status = "Missing Documentation";
    else if (daysSinceSup !== null && daysSinceSup >= 21) status = "Overdue";
    else if (daysSinceSup !== null && daysSinceSup >= 14) status = "Awaiting BCBA Follow-Up";
    else if (prMissing) status = "PR Risk";
    else if (expirationDays !== null && expirationDays >= 0 && expirationDays <= 30) status = "Expiring Soon";
    else if (a && !a.missingInfo && a.stage === "Awaiting Submission" && a.treatmentPlanReceived !== false) status = "Ready for Submission";
    else if (tpMissing || missingAny) status = "Missing Documentation";

    const blockerBits: string[] = [];
    if (noRecordedSup) blockerBits.push("No BCBA supervision session on file");
    else if (daysSinceSup !== null && daysSinceSup >= 14) blockerBits.push(`Last supervision ${daysSinceSup}d ago`);
    if (supDocMissing) blockerBits.push("Supervision documentation missing");
    if (prMissing) blockerBits.push("Progress report outstanding");
    if (tpMissing) blockerBits.push("Treatment plan outstanding");
    if (a?.stage === "Denied") blockerBits.push(a.denialReason ? `Denied · ${a.denialReason}` : "Authorization denied");
    if (expirationDays !== null && expirationDays >= 0 && expirationDays <= 14) blockerBits.push(`Auth expires in ${expirationDays}d`);
    const blockerSummary = blockerBits.join(" · ") || "No active supervision blockers";

    rows.push({
      id: k,
      clientName,
      state: state ?? a?.state ?? "—",
      bcba: bcba ?? authBcba ?? a?.coordinator ?? null,
      rbts,
      qaOwner: a?.qaOwner ?? null,
      auth: a,
      lastBcbaSession: lastSup,
      daysSinceSup,
      expirationDays,
      prMissing, tpMissing, supDocMissing, missingAny,
      blockerSummary,
      escalated,
      urgency,
      status,
      latestNote: a?.lastActivity ?? (lastSup ? `Last BCBA session ${daysSinceSup}d ago` : "No supervision session on file"),
    });
  };

  // pairings first (richest supervision context)
  for (const p of pairings) {
    const rbts = p.rbtName ? [p.rbtName] : [];
    buildFor(p.clientName, p.state, p.bcbaName, rbts, p.lastBcbaSessionDate);
  }
  // auths-only fallbacks
  for (const a of auths) {
    if (a.stage === "Flaked Client") continue;
    buildFor(a.clientName, a.state, bcbaById.get(a.id) ?? a.coordinator, [], null);
  }

  return rows;
}

// ---------- page ----------

export default function OSQASupervision() {
  const { items, loading: aLoading, bcbaById, refresh, sourceById } = useLiveAuthorizations();
  const cr = useCentralReachOps();
  const loading = aLoading || cr.loading;

  const pairings = useMemo(() => Array.from(cr.pairingsByClient.values()), [cr.pairingsByClient]);
  const rows = useMemo(() => buildSupRows(pairings, items, bcbaById), [pairings, items, bcbaById]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [rbtFilter, setRbtFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supFilter, setSupFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgFilter, setUrgFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  // QA Pass 6 — supervision row ids are per-client keys, not auth ids.
  useQADeepLink({
    items,
    loading: aLoading,
    setOpenId,
    setQuery,
    setBcbaFilter,
    resolveOpenIdForAuth: (authId) => {
      const row = rows.find((r) => r.auth?.id === authId);
      return row ? row.id : null;
    },
  });

  const states = useMemo(() => Array.from(new Set(rows.map(r => r.state).filter(s => s && s !== "—"))).sort(), [rows]);
  const bcbas  = useMemo(() => Array.from(new Set(rows.map(r => r.bcba).filter((v): v is string => !!v))).sort(), [rows]);
  const rbts   = useMemo(() => Array.from(new Set(rows.flatMap(r => r.rbts))).sort(), [rows]);
  const statuses = useMemo(() => Array.from(new Set(rows.map(r => r.status))).sort(), [rows]);

  const tabbed = useMemo(() => ({
    all:         rows,
    missing_doc: rows.filter(r => r.supDocMissing || r.lastBcbaSession === null),
    followup:    rows.filter(r => (r.daysSinceSup !== null && r.daysSinceSup >= 14) || r.status === "Awaiting BCBA Follow-Up" || r.status === "Overdue"),
    expiring:    rows.filter(r => r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 60),
    escalated:   rows.filter(r => r.escalated),
    ready:       rows.filter(r => r.status === "Ready for Submission"),
  } as Record<TabKey, SupRow[]>), [rows]);

  const counts = {
    all: tabbed.all.length,
    missing_doc: tabbed.missing_doc.length,
    followup: tabbed.followup.length,
    expiring: tabbed.expiring.length,
    escalated: tabbed.escalated.length,
    ready: tabbed.ready.length,
  };

  const aware = useMemo(() => ({
    active: rows.length,
    missingDoc: tabbed.missing_doc.length,
    expiring: rows.filter(r => r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 30 && (r.supDocMissing || r.prMissing || (r.daysSinceSup ?? 0) >= 14 || r.lastBcbaSession === null)).length,
    escalated: tabbed.escalated.length,
    followup: tabbed.followup.length,
  }), [rows, tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(r => {
      if (stateFilter !== "all" && r.state !== stateFilter) return false;
      if (bcbaFilter !== "all" && r.bcba !== bcbaFilter) return false;
      if (rbtFilter !== "all" && !r.rbts.includes(rbtFilter)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (supFilter === "missing" && !(r.supDocMissing || r.lastBcbaSession === null)) return false;
      if (supFilter === "overdue" && !(r.daysSinceSup !== null && r.daysSinceSup >= 21)) return false;
      if (supFilter === "current" && !(r.daysSinceSup !== null && r.daysSinceSup < 14)) return false;
      if (expFilter === "30" && !(r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 30)) return false;
      if (expFilter === "60" && !(r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 60)) return false;
      if (escFilter === "escalated" && !r.escalated) return false;
      if (escFilter === "normal" && r.escalated) return false;
      if (urgFilter !== "all" && r.urgency !== urgFilter) return false;
      if (q) {
        const hay = [r.clientName, r.state, r.bcba ?? "", ...(r.rbts), r.status, r.auth?.id ?? "", r.blockerSummary].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const rank = (z: SupRow) => z.urgency === "crit" ? 3 : z.urgency === "warn" ? 2 : 1;
      const r = rank(b) - rank(a);
      if (r !== 0) return r;
      const ea = a.expirationDays ?? 9999;
      const eb = b.expirationDays ?? 9999;
      if (ea !== eb) return ea - eb;
      return (b.daysSinceSup ?? 0) - (a.daysSinceSup ?? 0);
    });
  }, [tabbed, tab, query, stateFilter, bcbaFilter, rbtFilter, statusFilter, supFilter, expFilter, escFilter, urgFilter]);

  const grouped = useMemo(() => {
    if (tab !== "all") return null;
    const map = new Map<string, SupRow[]>();
    visible.forEach(r => {
      const key = r.urgency === "crit" ? "Critical" : r.urgency === "warn" ? "High priority" : "Stable";
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const order = { "Critical": 0, "High priority": 1, "Stable": 2 } as Record<string, number>;
      return (order[a] ?? 9) - (order[b] ?? 9);
    });
  }, [tab, visible]);

  // Supervision risk feed (cross-cutting)
  const riskFeed = useMemo(() => {
    return rows
      .filter(r => r.urgency !== "ok")
      .sort((a, b) => {
        const rank = (z: SupRow) => (z.escalated ? 3 : 0) + (z.urgency === "crit" ? 2 : z.urgency === "warn" ? 1 : 0);
        return rank(b) - rank(a);
      })
      .slice(0, 8);
  }, [rows]);

  // BCBA / RBT relationship visibility (lightweight)
  const bcbaRel = useMemo(() => {
    const m = new Map<string, { bcba: string; rbts: Set<string>; clients: SupRow[] }>();
    rows.forEach(r => {
      if (!r.bcba) return;
      const e = m.get(r.bcba) ?? { bcba: r.bcba, rbts: new Set<string>(), clients: [] };
      r.rbts.forEach(x => e.rbts.add(x));
      e.clients.push(r);
      m.set(r.bcba, e);
    });
    return Array.from(m.values())
      .map(e => {
        const blockers = e.clients.filter(c => c.urgency !== "ok").length;
        const prRisk = e.clients.filter(c => c.prMissing).length;
        const expRisk = e.clients.filter(c => c.expirationDays !== null && c.expirationDays >= 0 && c.expirationDays <= 30).length;
        const supOverdue = e.clients.filter(c => (c.daysSinceSup ?? 0) >= 14 || c.lastBcbaSession === null).length;
        return { bcba: e.bcba, rbts: Array.from(e.rbts).sort(), clientCount: e.clients.length, blockers, prRisk, expRisk, supOverdue };
      })
      .filter(x => x.blockers > 0 || x.supOverdue > 0)
      .sort((a, b) => (b.blockers + b.supOverdue) - (a.blockers + a.supOverdue))
      .slice(0, 6);
  }, [rows]);

  // Expiring impact buckets
  const expBuckets = useMemo(() => {
    const next30: SupRow[] = [], next60: SupRow[] = [], next90: SupRow[] = [], highRisk: SupRow[] = [];
    rows.forEach(r => {
      const d = r.expirationDays;
      if (d === null || d < 0) return;
      if (d <= 30) next30.push(r);
      else if (d <= 60) next60.push(r);
      else if (d <= 90) next90.push(r);
      if (d <= 30 && r.urgency === "crit") highRisk.push(r);
    });
    return { next30, next60, next90, highRisk };
  }, [rows]);

  const todayRisks = useMemo(() => {
    return rows
      .filter(r => r.escalated || (r.daysSinceSup ?? 0) >= 21 || (r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 7) || r.lastBcbaSession === null)
      .sort((a, b) => (a.expirationDays ?? 999) - (b.expirationDays ?? 999))
      .slice(0, 6);
  }, [rows]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = rows.filter(r => r.qaOwner === name);
      return {
        name,
        active:    owned.length,
        overdue:   owned.filter(r => (r.daysSinceSup ?? 0) >= 21 || (r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 14)).length,
        escalated: owned.filter(r => r.escalated).length,
      };
    });
  }, [rows]);

  const openRow = visible.find(r => r.id === openId) ?? rows.find(r => r.id === openId) ?? null;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",         label: "All workflows",      count: counts.all },
    { key: "missing_doc", label: "Missing Docs",       count: counts.missing_doc, tone: "warn" },
    { key: "followup",    label: "Awaiting Follow-Up", count: counts.followup,    tone: "warn" },
    { key: "expiring",    label: "Expiring",           count: counts.expiring,    tone: "warn" },
    { key: "escalated",   label: "Escalated",          count: counts.escalated,   tone: "crit" },
    { key: "ready",       label: "Ready",              count: counts.ready },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Supervision Visibility</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Monitor supervision-related workflows, documentation visibility, and operational risks tied to QA readiness.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {aware.active} active
              </span>
              {aware.followup > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {aware.followup} need follow-up
                </span>
              )}
              {aware.escalated > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {aware.escalated} escalated
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search BCBA, RBT, client, supervision workflow, or authorization..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={rbtFilter} onChange={setRbtFilter} label="RBT"
              options={[{ value: "all", label: "All RBTs" }, ...rbts.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Workflow"
              options={[{ value: "all", label: "All workflow statuses" }, ...statuses.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={supFilter} onChange={setSupFilter} label="Supervision"
              options={[
                { value: "all", label: "Any supervision status" },
                { value: "missing", label: "Missing / none on file" },
                { value: "overdue", label: "Overdue (≥21d)" },
                { value: "current", label: "Current (<14d)" },
              ]} />
            <FilterSelect value={expFilter} onChange={setExpFilter} label="Expiring"
              options={[
                { value: "all", label: "Any expiration" },
                { value: "30", label: "≤ 30 days" },
                { value: "60", label: "≤ 60 days" },
              ]} />
            <FilterSelect value={escFilter} onChange={setEscFilter} label="Escalation"
              options={[
                { value: "all", label: "All escalation" },
                { value: "escalated", label: "Escalated" },
                { value: "normal", label: "Normal" },
              ]} />
            <FilterSelect value={urgFilter} onChange={setUrgFilter} label="Urgency"
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
          <AwareCard icon={Activity}      label="Active Workflows"       value={aware.active} />
          <AwareCard icon={ShieldAlert}   label="Missing Documentation"  value={aware.missingDoc}  tone="warn" />
          <AwareCard icon={Calendar}      label="Expiring + Sup Risk"    value={aware.expiring}    tone="warn" />
          <AwareCard icon={Flame}         label="Escalated"              value={aware.escalated}   tone="crit" />
          <AwareCard icon={MessageCircle} label="Overdue Follow-Ups"     value={aware.followup}    tone="warn" />
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
                    tab === "escalated"   ? "No escalations requiring attention." :
                    tab === "missing_doc" ? "No supervision documentation gaps right now." :
                    tab === "followup"    ? "No overdue supervision follow-ups today." :
                    tab === "expiring"    ? "No expiring authorizations with supervision risk." :
                    tab === "ready"       ? "No workflows ready for submission." :
                                            "No supervision workflows match these filters."
                  }
                />
              </Card>
            ) : tab === "all" && grouped ? (
              <div className="space-y-6">
                {grouped.map(([group, list]) => (
                  <section key={group}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group}</div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{list.length}</span>
                    </div>
                    <ul className="space-y-3">
                      {list.map(r => <SupCard key={r.id} r={r} onOpen={() => setOpenId(r.id)} />)}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map(r => <SupCard key={r.id} r={r} onOpen={() => setOpenId(r.id)} />)}
              </ul>
            )}

            {/* SUPERVISION RISK FEED */}
            {tab === "all" && riskFeed.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Supervision risks</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {riskFeed.map(r => (
                      <li key={r.id}>
                        <button onClick={() => setOpenId(r.id)} className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-start gap-3">
                          <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 border", toneClasses(r.urgency))}>
                            <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {r.clientName} <span className="text-muted-foreground font-normal">— {r.bcba ?? "Unassigned BCBA"}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.blockerSummary}</div>
                          </div>
                          <Pill tone={r.urgency}>
                            {r.lastBcbaSession === null ? "No sup" :
                              r.daysSinceSup !== null && r.daysSinceSup >= 14 ? `${r.daysSinceSup}d` :
                              r.expirationDays !== null && r.expirationDays >= 0 ? `Exp ${r.expirationDays}d` :
                              r.status}
                          </Pill>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {/* BCBA / RBT RELATIONSHIPS */}
            {tab === "all" && bcbaRel.length > 0 && (
              <section className="pt-4">
                <SectionLabel>BCBA &amp; RBT relationships</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {bcbaRel.map(b => (
                      <li key={b.bcba} className="p-3.5 flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 grid place-items-center shrink-0">
                          <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{b.bcba}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {b.clientCount} clients · {b.rbts.length} RBTs{b.rbts.length > 0 ? ` · ${b.rbts.slice(0,2).join(", ")}${b.rbts.length > 2 ? ` +${b.rbts.length - 2}` : ""}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {b.supOverdue > 0 && <Pill tone="warn">{b.supOverdue} sup overdue</Pill>}
                          {b.prRisk > 0 && <Pill tone="warn">{b.prRisk} PR</Pill>}
                          {b.expRisk > 0 && <Pill tone="crit">{b.expRisk} expiring</Pill>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            )}

            {/* EXPIRING AUTH IMPACT */}
            {tab === "all" && (expBuckets.next30.length + expBuckets.next60.length + expBuckets.next90.length + expBuckets.highRisk.length) > 0 && (
              <section className="pt-4">
                <SectionLabel>Expiring authorization impact</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <BucketCard title="Next 30 days"  rows={expBuckets.next30}   tone="crit" onOpen={setOpenId} />
                  <BucketCard title="31–60 days"    rows={expBuckets.next60}   tone="warn" onOpen={setOpenId} />
                  <BucketCard title="61–90 days"    rows={expBuckets.next90}   tone="ok"   onOpen={setOpenId} />
                  <BucketCard title="High risk"     rows={expBuckets.highRisk} tone="crit" onOpen={setOpenId} />
                </div>
              </section>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="space-y-5">
            <section>
              <SectionLabel>Today's risks</SectionLabel>
              <Card>
                {todayRisks.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent supervision risks." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {todayRisks.map(r => (
                      <li key={r.id}>
                        <button onClick={() => setOpenId(r.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{r.clientName}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.status} · {r.state}</div>
                            </div>
                            <Pill tone={r.urgency}>
                              {r.lastBcbaSession === null ? "No sup" :
                                r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 14 ? `${r.expirationDays}d exp` :
                                r.daysSinceSup !== null && r.daysSinceSup >= 14 ? `${r.daysSinceSup}d` : "Risk"}
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
              <SectionLabel>High-risk supervision workflows</SectionLabel>
              <Card>
                {riskFeed.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No high-risk workflows." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {riskFeed.slice(0, 6).map(r => (
                      <li key={r.id} className="p-3">
                        <button onClick={() => setOpenId(r.id)} className="w-full text-left">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{r.clientName}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {r.bcba ?? "Unassigned"} · {r.status}
                              </div>
                            </div>
                            <Pill tone={r.urgency}>{r.urgency === "crit" ? "High" : "Watch"}</Pill>
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
                  <div className="text-xs text-muted-foreground">Supervision copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which supervision workflows are high risk?",
                    "Which authorizations are impacted?",
                    "Which BCBAs require follow-up?",
                    "Which PRs are blocked?",
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

      {openRow && <SupSlideout r={openRow} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={openRow.auth ? sourceById.get(openRow.auth.id) : undefined} />}
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
function IconBtn({ icon: Icon, title, tone, onClick }:
  { icon: React.ElementType; title: string; tone?: Tone; onClick?: () => void }) {
  const cls = cn(
    "h-8 w-8 rounded-lg grid place-items-center border transition",
    tone === "crit"
      ? "border-destructive/20 text-destructive hover:bg-destructive/5"
      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
  );
  return <button title={title} className={cls} onClick={onClick}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function SupCard({ r, onOpen }: { r: SupRow; onOpen: () => void }) {
  const accent =
    r.urgency === "crit" ? "before:bg-destructive/70" :
    r.urgency === "warn" ? "before:bg-amber-500/70" :
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
              <div className={cn("h-10 w-10 rounded-xl grid place-items-center border shrink-0", toneClasses(r.urgency))}>
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{r.clientName}</span>
                  <Pill tone={r.urgency}>{r.status}</Pill>
                  {r.escalated && <Pill tone="crit">Escalated</Pill>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} />{r.state}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3" strokeWidth={1.75} />{r.bcba ?? "Unassigned BCBA"}</span>
                  {r.rbts.length > 0 && <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{r.rbts.slice(0,2).join(", ")}{r.rbts.length > 2 ? ` +${r.rbts.length - 2}` : ""}</span>
                  </>}
                  <span>·</span>
                  <span>QA {r.qaOwner ?? "Unassigned"}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Pill tone={r.lastBcbaSession === null ? "crit" : (r.daysSinceSup ?? 0) >= 21 ? "crit" : (r.daysSinceSup ?? 0) >= 14 ? "warn" : "ok"}>
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    {r.lastBcbaSession === null ? "No supervision on file" : `Last sup ${r.daysSinceSup}d ago`}
                  </Pill>
                  {r.supDocMissing && <Pill tone="warn"><ShieldAlert className="h-3 w-3" strokeWidth={1.75} /> Sup docs missing</Pill>}
                  <Pill tone={r.prMissing ? "warn" : "ok"}><FileText className="h-3 w-3" strokeWidth={1.75} /> PR {r.prMissing ? "open" : "clear"}</Pill>
                  <Pill tone={r.tpMissing ? "warn" : "ok"}><ClipboardList className="h-3 w-3" strokeWidth={1.75} /> TP {r.tpMissing ? "pending" : "ready"}</Pill>
                  {r.expirationDays !== null && r.expirationDays >= 0 && (
                    <Pill tone={r.expirationDays <= 14 ? "crit" : r.expirationDays <= 30 ? "warn" : "ok"}>
                      <Calendar className="h-3 w-3" strokeWidth={1.75} /> Exp {r.expirationDays}d
                    </Pill>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">
                  {r.blockerSummary}
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
              Open workflow <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function BucketCard({ title, rows, tone, onOpen }: { title: string; rows: SupRow[]; tone: Tone; onOpen: (id: string) => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
        <Pill tone={tone}>{rows.length}</Pill>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items.</p>
      ) : (
        <ul className="divide-y divide-border/60 -mx-1">
          {rows.slice(0, 5).map(r => (
            <li key={r.id}>
              <button onClick={() => onOpen(r.id)} className="w-full text-left px-1 py-2 hover:bg-muted/40 rounded transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{r.clientName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.bcba ?? "Unassigned"} · {r.state}</div>
                  </div>
                  <Pill tone={r.urgency}>{r.expirationDays !== null ? `${r.expirationDays}d` : r.status}</Pill>
                </div>
              </button>
            </li>
          ))}
          {rows.length > 5 && <li className="px-1 pt-2 text-[11px] text-muted-foreground">+{rows.length - 5} more</li>}
        </ul>
      )}
    </Card>
  );
}

function SupSlideout({ r, onClose, onChanged, sourceSystem }: { r: SupRow; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const checklist = [
    { ok: r.lastBcbaSession !== null && (r.daysSinceSup ?? 0) < 14, label: "BCBA supervision session within 14 days" },
    { ok: !r.supDocMissing, label: "Supervision documentation on file" },
    { ok: !r.prMissing, label: "Progress report on file" },
    { ok: !r.tpMissing, label: "Treatment plan received" },
    { ok: !r.missingAny, label: "No missing authorization items" },
    { ok: !r.escalated, label: "No active escalation" },
    { ok: !(r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 14), label: "No imminent authorization expiration" },
    { ok: !!r.qaOwner, label: "QA owner assigned" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-card border-l border-border/70 z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/70 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">{r.clientName}</h2>
              <Pill tone={r.urgency}>{r.status}</Pill>
              {r.escalated && <Pill tone="crit">Escalated</Pill>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {r.state} · {r.bcba ?? "Unassigned BCBA"} · QA {r.qaOwner ?? "Unassigned"}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <SectionLabel>Supervision snapshot</SectionLabel>
            <Card className="p-4 grid grid-cols-2 gap-3">
              <Stat label="Last sup (days)" value={r.daysSinceSup ?? 0} tone={r.lastBcbaSession === null || (r.daysSinceSup ?? 0) >= 21 ? "crit" : (r.daysSinceSup ?? 0) >= 14 ? "warn" : "ok"} />
              <Stat label="Exp (days)" value={r.expirationDays ?? 0} tone={(r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 14) ? "crit" : (r.expirationDays !== null && r.expirationDays >= 0 && r.expirationDays <= 30) ? "warn" : "ok"} />
              <Stat label="PR open" value={r.prMissing ? 1 : 0} tone={r.prMissing ? "warn" : "ok"} />
              <Stat label="TP pending" value={r.tpMissing ? 1 : 0} tone={r.tpMissing ? "warn" : "ok"} />
              <Stat label="Sup docs missing" value={r.supDocMissing ? 1 : 0} tone={r.supDocMissing ? "warn" : "ok"} />
              <Stat label="Escalations" value={r.escalated ? 1 : 0} tone={r.escalated ? "crit" : "ok"} />
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

          <section className="space-y-2">
            <SectionLabel>Quick actions</SectionLabel>
            {r.auth && <QAActionsPanel auth={r.auth} sourceSystem={sourceSystem} onChanged={onChanged} />}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ActionBtn icon={ExternalLink}  label="Open client"          to={`/qa-clients?client=${encodeURIComponent(r.clientName)}`} />
              <ActionBtn icon={FileText}      label="View PR workflow"     to="/reports" />
              <ActionBtn icon={ClipboardList} label="View authorization"   to={r.auth ? `/authorization-reviews?id=${encodeURIComponent(r.auth.id)}` : "/authorization-reviews"} />
            </div>
          </section>

          <section>
            <SectionLabel>Supervision relationships</SectionLabel>
            <Card className="p-4 space-y-2">
              <Row icon={UserCheck} label="Assigned BCBA" value={r.bcba ?? "Unassigned"} />
              <Row icon={Users} label="Assigned RBT(s)" value={r.rbts.length ? r.rbts.join(", ") : "None on file"} />
              <Row icon={Clock}  label="Last BCBA session" value={r.lastBcbaSession ? `${r.daysSinceSup}d ago` : "No session on file"} />
              <Row icon={Calendar} label="Auth expiration" value={r.expirationDays !== null ? `In ${r.expirationDays} days` : (r.auth?.expirationDate ?? "—")} />
              <Row icon={ShieldAlert} label="Active blockers" value={r.blockerSummary} />
              <Row icon={History} label="Latest activity" value={r.latestNote} />
            </Card>
          </section>

          {r.auth && r.auth.timeline.length > 0 && (
            <section>
              <SectionLabel>Workflow timeline</SectionLabel>
              <Card>
                <ul className="divide-y divide-border/60">
                  {r.auth.timeline.slice(0, 6).map(t => (
                    <li key={t.id} className="p-3 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-muted grid place-items-center shrink-0">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{t.description}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.timestamp}{t.user ? ` · ${t.user}` : ""}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <ClinicalDirectorSection
            sourceType="supervision"
            sourceRecordId={r.auth?.id ?? r.id}
            clientId={r.auth?.clientId ?? null}
            clientName={r.clientName}
            bcbaName={r.bcba}
            state={r.state}
            defaultTitle={`Supervision follow-up: ${r.clientName}`}
            metadata={{
              lastBcbaSession: r.lastBcbaSession,
              daysSinceSupervision: r.daysSinceSup,
              blockers: r.blockerSummary,
              rbts: r.rbts,
              missingDocumentation: r.supDocMissing,
              expirationDays: r.expirationDays,
              centralReachClientId: r.auth?.clientId ?? null,
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