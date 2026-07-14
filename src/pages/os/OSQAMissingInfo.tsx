import { useMemo, useState, useEffect } from "react";
import { useSlideout } from "@/hooks/useSlideout";
import { Link } from "react-router-dom";
import {
  Search, Flame, Sparkles, CheckCircle2, Send, ExternalLink, StickyNote,
  UserCheck, Brain, Clock, Inbox, AlertTriangle, X, ChevronRight,
  Users, FileSignature, FileText, MessageCircle, Activity, History,
  ClipboardList, ShieldAlert,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useQADeepLink } from "@/hooks/useQADeepLink";
import { QAActionsPanel } from "@/components/qa/QAActionsPanel";
import type { Authorization } from "@/data/authorizations";
import { cn } from "@/lib/utils";

// Missing Information — operational blocker-resolution center.
// Real data only via useLiveAuthorizations. Each blocker row is derived
// from authorizations where missingInfo === true, with the requirement
// expanded one-per-row so each item has its own owner / urgency / next step.

type Tone = "ok" | "warn" | "crit";
type TabKey = "all" | "docs" | "signatures" | "bcba" | "escalated" | "overdue";

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

// ---------- blocker derivation ----------
type BlockerKind =
  | "Treatment Plan" | "Progress Report" | "Parent Signature" | "BCBA Signature"
  | "Provider Signature" | "Insurance Documentation" | "Authorization Information"
  | "PR Correction" | "Follow-Up Response" | "Supporting Documentation";

const SIG_PARENT   = /parent.*sign|guardian.*sign|caregiver.*sign/i;
const SIG_BCBA     = /bcba.*sign|clinical.*sign/i;
const SIG_PROVIDER = /provider.*sign|physician.*sign/i;
const SIG_ANY      = /sign|signature|consent/i;
const PR_KW        = /progress report|\bpr\b/i;
const TP_KW        = /treatment plan|\btp\b/i;
const INS_KW       = /insurance|payor|coverage|eligibility|vob/i;
const AUTH_KW      = /auth(orization)?|approval/i;
const CORR_KW      = /correction|revision|edit|amend/i;
const FU_KW        = /follow.?up|response|reply/i;

function kindFor(req: string): BlockerKind {
  if (SIG_PARENT.test(req))   return "Parent Signature";
  if (SIG_BCBA.test(req))     return "BCBA Signature";
  if (SIG_PROVIDER.test(req)) return "Provider Signature";
  if (SIG_ANY.test(req))      return "Parent Signature";
  if (PR_KW.test(req) && CORR_KW.test(req)) return "PR Correction";
  if (PR_KW.test(req))        return "Progress Report";
  if (TP_KW.test(req))        return "Treatment Plan";
  if (INS_KW.test(req))       return "Insurance Documentation";
  if (AUTH_KW.test(req))      return "Authorization Information";
  if (FU_KW.test(req))        return "Follow-Up Response";
  return "Supporting Documentation";
}

function iconFor(k: BlockerKind) {
  if (k === "Parent Signature" || k === "BCBA Signature" || k === "Provider Signature") return FileSignature;
  if (k === "Treatment Plan" || k === "Progress Report" || k === "PR Correction") return FileText;
  if (k === "Insurance Documentation" || k === "Authorization Information") return ShieldAlert;
  if (k === "Follow-Up Response") return MessageCircle;
  return ClipboardList;
}

function workflowFor(k: BlockerKind): string {
  if (k === "Treatment Plan" || k === "PR Correction") return "Treatment Plan Review";
  if (k === "Progress Report") return "Progress Report";
  if (k === "Authorization Information" || k === "Insurance Documentation") return "Authorization Review";
  return "QA Review";
}

function ownerOwes(k: BlockerKind): "BCBA" | "Parent" | "Provider" | "Insurance" {
  if (k === "Parent Signature") return "Parent";
  if (k === "Provider Signature") return "Provider";
  if (k === "Insurance Documentation") return "Insurance";
  return "BCBA";
}

function recommendedNext(k: BlockerKind): string {
  switch (k) {
    case "Parent Signature":   return "Send parent reminder";
    case "BCBA Signature":     return "Ping BCBA for signature";
    case "Provider Signature": return "Request provider signature";
    case "Treatment Plan":     return "Request treatment plan";
    case "Progress Report":    return "Request progress report";
    case "PR Correction":      return "Send correction notes";
    case "Insurance Documentation": return "Request insurance docs";
    case "Authorization Information": return "Pull from CentralReach";
    case "Follow-Up Response": return "Re-send follow-up";
    default:                   return "Request from BCBA";
  }
}

type BlockerRow = {
  id: string;            // unique per (auth, requirement)
  auth: Authorization;
  requirement: string;
  kind: BlockerKind;
  workflow: string;
  owes: "BCBA" | "Parent" | "Provider" | "Insurance";
  daysBlocked: number;
  urgency: Tone;
  escalated: boolean;
  expDays: number | null;
};

function urgencyFor(a: Authorization, daysBlocked: number): Tone {
  if (a.stage === "Denied") return "crit";
  const d = daysUntil(a.expirationDate);
  if (d !== null && d >= 0 && d <= 7) return "crit";
  if (daysBlocked > 10) return "crit";
  if (d !== null && d >= 0 && d <= 30) return "warn";
  if (daysBlocked > 5) return "warn";
  return "ok";
}

function isEscalated(a: Authorization, daysBlocked: number): boolean {
  if (a.stage === "Denied") return true;
  const d = daysUntil(a.expirationDate);
  if (d !== null && d >= 0 && d <= 7) return true;
  if (daysBlocked > 10) return true;
  return false;
}

function buildRows(items: Authorization[]): BlockerRow[] {
  const rows: BlockerRow[] = [];
  for (const a of items) {
    if (!a.missingInfo) continue;
    if (a.stage === "Approved" || a.stage === "Flaked Client") continue;
    const reqs = a.missingRequirements.length > 0 ? a.missingRequirements : ["Missing documentation"];
    reqs.forEach((req, i) => {
      const kind = kindFor(req);
      const daysBlocked = a.daysInStage;
      rows.push({
        id: `${a.id}::${i}`,
        auth: a,
        requirement: req,
        kind,
        workflow: workflowFor(kind),
        owes: ownerOwes(kind),
        daysBlocked,
        urgency: urgencyFor(a, daysBlocked),
        escalated: isEscalated(a, daysBlocked),
        expDays: daysUntil(a.expirationDate),
      });
    });
  }
  return rows;
}

// ---------- page ----------
export default function OSQAMissingInfo() {
  const { qaItems: items, loading, refresh, sourceById } = useLiveAuthorizations();
  const allRows = useMemo(() => buildRows(items), [items]);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [bcbaFilter, setBcbaFilter] = useState("all");
  const [escFilter, setEscFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  useQADeepLink({ items, loading, setOpenId, setQuery, setBcbaFilter });

  const states    = useMemo(() => Array.from(new Set(allRows.map(r => r.auth.state).filter(Boolean))).sort(), [allRows]);
  const bcbas     = useMemo(() => Array.from(new Set(allRows.map(r => r.auth.coordinator).filter(Boolean))).sort(), [allRows]);
  const owners    = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach(r => { if (r.auth.qaOwner) s.add(r.auth.qaOwner); });
    return Array.from(s).sort();
  }, [allRows]);
  const kinds     = useMemo(() => Array.from(new Set(allRows.map(r => r.kind))).sort(), [allRows]);
  const workflows = useMemo(() => Array.from(new Set(allRows.map(r => r.workflow))).sort(), [allRows]);

  const tabbed = useMemo(() => ({
    all:         allRows,
    docs:        allRows.filter(r => r.kind === "Treatment Plan" || r.kind === "Progress Report" || r.kind === "PR Correction" || r.kind === "Insurance Documentation" || r.kind === "Authorization Information" || r.kind === "Supporting Documentation"),
    signatures:  allRows.filter(r => r.kind === "Parent Signature" || r.kind === "BCBA Signature" || r.kind === "Provider Signature"),
    bcba:        allRows.filter(r => r.owes === "BCBA"),
    escalated:   allRows.filter(r => r.escalated),
    overdue:     allRows.filter(r => r.daysBlocked > 7 || (r.expDays !== null && r.expDays <= 7 && r.expDays >= 0)),
  } as Record<TabKey, BlockerRow[]>), [allRows]);

  const counts = {
    all: tabbed.all.length,
    docs: tabbed.docs.length,
    signatures: tabbed.signatures.length,
    bcba: tabbed.bcba.length,
    escalated: tabbed.escalated.length,
    overdue: tabbed.overdue.length,
  };

  const awareCounts = useMemo(() => {
    const missingDocs = allRows.filter(r => r.kind !== "Parent Signature" && r.kind !== "BCBA Signature" && r.kind !== "Provider Signature").length;
    const sigs = tabbed.signatures.length;
    const bcbaWaits = allRows.filter(r => r.owes === "BCBA").length;
    const esc = tabbed.escalated.length;
    const crit = allRows.filter(r => r.urgency === "crit").length;
    return { missingDocs, sigs, bcbaWaits, esc, crit };
  }, [allRows, tabbed]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabbed[tab].filter(r => {
      const a = r.auth;
      if (stateFilter !== "all"    && a.state !== stateFilter) return false;
      if (bcbaFilter !== "all"     && a.coordinator !== bcbaFilter) return false;
      if (ownerFilter !== "all"    && a.qaOwner !== ownerFilter) return false;
      if (kindFilter !== "all"     && r.kind !== kindFilter) return false;
      if (workflowFilter !== "all" && r.workflow !== workflowFilter) return false;
      if (urgencyFilter !== "all"  && r.urgency !== urgencyFilter) return false;
      if (escFilter === "escalated" && !r.escalated) return false;
      if (escFilter === "normal"    && r.escalated) return false;
      if (daysFilter === "0_3"   && !(r.daysBlocked <= 3)) return false;
      if (daysFilter === "4_7"   && !(r.daysBlocked > 3 && r.daysBlocked <= 7)) return false;
      if (daysFilter === "8_14"  && !(r.daysBlocked > 7 && r.daysBlocked <= 14)) return false;
      if (daysFilter === "15p"   && !(r.daysBlocked > 14)) return false;
      if (q) {
        const hay = [a.clientName, a.coordinator, a.qaOwner ?? "", a.state, a.payor, r.kind, r.requirement, r.workflow].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((x, y) => {
      const rank = (z: BlockerRow) => z.urgency === "crit" ? 3 : z.urgency === "warn" ? 2 : 1;
      const r = rank(y) - rank(x);
      if (r !== 0) return r;
      return y.daysBlocked - x.daysBlocked;
    });
  }, [tabbed, tab, query, stateFilter, bcbaFilter, ownerFilter, kindFilter, workflowFilter, urgencyFilter, escFilter, daysFilter]);

  // grouped by Workflow → kind for visual hierarchy on "All"
  const grouped = useMemo(() => {
    if (tab !== "all") return null;
    const map = new Map<string, BlockerRow[]>();
    visible.forEach(r => {
      const key = `${r.urgency === "crit" ? "Critical" : r.urgency === "warn" ? "High priority" : "Normal"} · ${r.workflow}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [tab, visible]);

  const priorities = useMemo(() => {
    return [...tabbed.escalated, ...tabbed.overdue]
      .filter((r, i, arr) => arr.findIndex(b => b.id === r.id) === i)
      .sort((a, b) => (a.expDays ?? 999) - (b.expDays ?? 999))
      .slice(0, 6);
  }, [tabbed]);

  const bcbaFollow = useMemo(() => {
    const byBcba = new Map<string, { bcba: string; rows: BlockerRow[] }>();
    allRows.filter(r => r.owes === "BCBA").forEach(r => {
      const k = r.auth.coordinator || "Unassigned";
      const v = byBcba.get(k) ?? { bcba: k, rows: [] };
      v.rows.push(r);
      byBcba.set(k, v);
    });
    return Array.from(byBcba.values())
      .sort((a, b) => b.rows.length - a.rows.length)
      .slice(0, 6);
  }, [allRows]);

  const workload = useMemo(() => {
    return QA_TEAM.map(name => {
      const owned = allRows.filter(r => r.auth.qaOwner === name);
      return {
        name,
        active:    owned.length,
        overdue:   owned.filter(r => r.daysBlocked > 7).length,
        escalated: owned.filter(r => r.escalated).length,
      };
    });
  }, [allRows]);

  const openRow = visible.find(r => r.id === openId) ?? allRows.find(r => r.id === openId) ?? null;

  const TABS: { key: TabKey; label: string; count: number; tone?: Tone }[] = [
    { key: "all",        label: "All Blockers",     count: counts.all },
    { key: "docs",       label: "Documentation",    count: counts.docs,       tone: "warn" },
    { key: "signatures", label: "Signatures",       count: counts.signatures, tone: "warn" },
    { key: "bcba",       label: "Waiting on BCBA",  count: counts.bcba },
    { key: "overdue",    label: "Overdue",          count: counts.overdue,    tone: "warn" },
    { key: "escalated",  label: "Escalated",        count: counts.escalated,  tone: "crit" },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 pb-24 pt-6 md:pt-10 space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{todayLabel()}</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Missing Information</h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Track operational blockers, missing documentation, signatures, and unresolved workflow requirements.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-border/70 bg-card text-xs font-medium text-foreground">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                {counts.all} active
              </span>
              {awareCounts.crit > 0 && (
                <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {awareCounts.crit} critical
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search client, BCBA, workflow, blocker, signature, or authorization..."
              className="w-full h-11 rounded-xl bg-muted/60 border border-border pl-11 pr-4 text-[15px] placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <FilterSelect value={stateFilter} onChange={setStateFilter} label="State"
              options={[{ value: "all", label: "All states" }, ...states.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={kindFilter} onChange={setKindFilter} label="Blocker"
              options={[{ value: "all", label: "All blocker types" }, ...kinds.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={workflowFilter} onChange={setWorkflowFilter} label="Workflow"
              options={[{ value: "all", label: "All workflows" }, ...workflows.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="QA Owner"
              options={[{ value: "all", label: "All QA owners" }, ...owners.map(s => ({ value: s, label: s }))]} />
            <FilterSelect value={bcbaFilter} onChange={setBcbaFilter} label="BCBA"
              options={[{ value: "all", label: "All BCBAs" }, ...bcbas.map(s => ({ value: s, label: s }))]} />
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
            <FilterSelect value={daysFilter} onChange={setDaysFilter} label="Days Blocked"
              options={[
                { value: "all",   label: "Any duration" },
                { value: "0_3",   label: "0–3 days" },
                { value: "4_7",   label: "4–7 days" },
                { value: "8_14",  label: "8–14 days" },
                { value: "15p",   label: "15+ days" },
              ]} />
          </div>
        </header>

        {/* AWARENESS CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AwareCard icon={FileText}        label="Missing Documentation" value={awareCounts.missingDocs} tone="warn" />
          <AwareCard icon={FileSignature}   label="Missing Signatures"    value={awareCounts.sigs}        tone="warn" />
          <AwareCard icon={Users}           label="Waiting on BCBA"       value={awareCounts.bcbaWaits} />
          <AwareCard icon={Flame}           label="Escalated Blockers"    value={awareCounts.esc}         tone="crit" />
          <AwareCard icon={AlertTriangle}   label="Critical Delays"       value={awareCounts.crit}        tone="crit" />
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
                {visible.length} {visible.length === 1 ? "blocker" : "blockers"}
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
                    tab === "signatures" ? "No overdue signatures right now." :
                    tab === "escalated"  ? "No escalations requiring attention." :
                    tab === "overdue"    ? "Nothing is overdue today." :
                    tab === "docs"       ? "No missing documentation." :
                    tab === "bcba"       ? "No BCBA follow-ups pending." :
                                           "No unresolved blockers right now."
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
                      {rows.map(r => (
                        <BlockerCard key={r.id} row={r} onOpen={() => setOpenId(r.id)} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map(r => (
                  <BlockerCard key={r.id} row={r} onOpen={() => setOpenId(r.id)} />
                ))}
              </ul>
            )}

            {/* SIGNATURE TRACKING (inline on All) */}
            {tab === "all" && tabbed.signatures.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Signature tracking</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.signatures.slice(0, 6).map(r => (
                      <li key={r.id} className="p-3.5 flex items-start gap-3">
                        <div className={cn("h-9 w-9 rounded-xl grid place-items-center shrink-0 border", toneClasses(r.urgency))}>
                          <FileSignature className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button onClick={() => setOpenId(r.id)} className="text-left w-full">
                            <div className="text-sm font-medium text-foreground truncate">
                              {r.auth.clientName} <span className="text-muted-foreground font-normal">— {r.kind}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {r.daysBlocked}d waiting · Owner: {r.auth.qaOwner ?? "Unassigned"} · Latest: {relTime(r.auth.lastActivity)}
                            </div>
                          </button>
                        </div>
                        <Pill tone={r.urgency}>{r.daysBlocked}d</Pill>
                        <div className="hidden md:flex items-center gap-1.5 shrink-0">
                          <IconBtn title="Send reminder" icon={Send} onClick={() => setOpenId(r.id)} />
                          <IconBtn title="Add note"      icon={StickyNote} onClick={() => setOpenId(r.id)} />
                          <IconBtn title="Escalate"     icon={Flame} tone="crit" onClick={() => setOpenId(r.id)} />
                        </div>
                      </li>
                    ))}
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
                    {bcbaFollow.map(g => {
                      const worst = g.rows.sort((a, b) => b.daysBlocked - a.daysBlocked)[0];
                      return (
                        <li key={g.bcba} className="p-3.5 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-muted grid place-items-center shrink-0">
                            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">{g.bcba}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {g.rows.length} open · Oldest: {worst.daysBlocked}d · Next: {recommendedNext(worst.kind)}
                            </div>
                          </div>
                          <Pill tone={worst.urgency}>{worst.daysBlocked}d</Pill>
                          <div className="hidden md:flex items-center gap-1.5 shrink-0">
                            <IconBtn title="Send follow-up" icon={Send} onClick={() => setOpenId(worst.id)} />
                            <IconBtn title="Escalate"      icon={Flame} tone="crit" onClick={() => setOpenId(worst.id)} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            )}

            {/* ESCALATED BLOCKERS */}
            {tab === "all" && tabbed.escalated.length > 0 && (
              <section className="pt-4">
                <SectionLabel>Escalated blockers</SectionLabel>
                <Card>
                  <ul className="divide-y divide-border/60">
                    {tabbed.escalated.slice(0, 6).map(r => (
                      <li key={r.id}>
                        <button onClick={() => setOpenId(r.id)}
                          className="w-full text-left p-3.5 hover:bg-muted/40 transition flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 grid place-items-center shrink-0">
                            <Flame className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">
                              {r.auth.clientName} <span className="text-muted-foreground font-normal">— {r.kind}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {r.daysBlocked}d escalated · {r.auth.state} · Next: {recommendedNext(r.kind)}
                            </div>
                          </div>
                          <Pill tone="crit">
                            {r.expDays !== null && r.expDays >= 0 && r.expDays <= 7 ? `Exp ${r.expDays}d` : "Escalated"}
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
              <SectionLabel>Today's critical blockers</SectionLabel>
              <Card>
                {priorities.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent blockers." />
                ) : (
                  <ul className="divide-y divide-border/60">
                    {priorities.map(r => (
                      <li key={r.id}>
                        <button onClick={() => setOpenId(r.id)} className="w-full text-left p-3 hover:bg-muted/40 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{r.auth.clientName}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {r.kind} · {r.auth.state}
                              </div>
                            </div>
                            <Pill tone={r.urgency}>
                              {r.expDays !== null && r.expDays <= 7 && r.expDays >= 0 ? `${r.expDays}d exp` : `${r.daysBlocked}d`}
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
                  <div className="text-xs text-muted-foreground">Blocker copilot</div>
                </div>
                <div className="space-y-1">
                  {[
                    "Which blockers are highest priority?",
                    "Which workflows are overdue?",
                    "Which BCBAs have unresolved items?",
                    "What is blocking submissions?",
                    "Show unresolved signatures.",
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

      {openRow && <BlockerSlideout row={openRow} onClose={() => setOpenId(null)} onChanged={refresh} sourceSystem={sourceById.get(openRow.auth.id)} />}
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
  return <button title={title} onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" strokeWidth={1.75} /></button>;
}

function BlockerCard({ row: r, onOpen }: { row: BlockerRow; onOpen: () => void }) {
  const Icon = iconFor(r.kind);
  const accent =
    r.urgency === "crit" ? "before:bg-destructive/70" :
    r.urgency === "warn" ? "before:bg-amber-500/70" :
                            "before:bg-emerald-500/50";
  const a = r.auth;

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
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-foreground truncate">{a.clientName}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{r.workflow}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {a.state} · {a.authType} · {a.payor}
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Pill tone={r.urgency}>{r.urgency === "crit" ? "Critical" : r.urgency === "warn" ? "High" : "Normal"}</Pill>
                  <Pill tone="warn">{r.kind}</Pill>
                  {r.escalated && <Pill tone="crit">Escalated</Pill>}
                  {r.expDays !== null && r.expDays >= 0 && r.expDays <= 30 && (
                    <Pill tone={r.expDays <= 7 ? "crit" : "warn"}>Exp in {r.expDays}d</Pill>
                  )}
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> BCBA: {a.coordinator}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <UserCheck className="h-3 w-3" /> QA: {a.qaOwner ?? "Unassigned"}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.daysBlocked}d blocked
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 border border-border/60 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                  <div className="text-[12px] text-foreground">
                    <span className="text-muted-foreground">Missing:</span> {r.requirement}
                    <span className="text-muted-foreground"> · Owes:</span> {r.owes}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Next: {recommendedNext(r.kind)} · Updated {relTime(a.lastActivity)}
                </div>
              </div>
            </div>
          </button>

          <div className="hidden md:flex flex-col gap-1.5 shrink-0">
            <IconBtn title="Open workflow"  icon={ExternalLink} onClick={onOpen} />
            <IconBtn title="Send follow-up" icon={Send} onClick={onOpen} />
            <IconBtn title="Add QA note"    icon={StickyNote} onClick={onOpen} />
            <IconBtn title="Mark resolved"  icon={CheckCircle2} onClick={onOpen} />
            <IconBtn title="Escalate"       icon={Flame} tone="crit" onClick={onOpen} />
          </div>
        </div>
      </Card>
    </li>
  );
}

function BlockerSlideout({ row: r, onClose, onChanged, sourceSystem }: { row: BlockerRow; onClose: () => void; onChanged?: () => void | Promise<void>; sourceSystem?: "monday" | "manual" | "centralreach" }) {
  useSlideout(true, onClose);
  const a = r.auth;

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
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Blocker · {r.workflow}</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground truncate">{a.clientName}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">{a.authType} · {a.payor} · {a.state}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center shrink-0">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={r.urgency}>{r.urgency === "crit" ? "Critical" : r.urgency === "warn" ? "High" : "Normal"}</Pill>
            <Pill tone="warn">{r.kind}</Pill>
            {r.escalated && <Pill tone="crit">Escalated</Pill>}
            {r.expDays !== null && r.expDays >= 0 && r.expDays <= 30 && (
              <Pill tone={r.expDays <= 7 ? "crit" : "warn"}>Exp in {r.expDays}d</Pill>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Fact label="Workflow"        value={r.workflow} />
            <Fact label="Blocker"         value={r.kind} />
            <Fact label="Owes"            value={r.owes} />
            <Fact label="Days blocked"    value={`${r.daysBlocked}d`} />
            <Fact label="BCBA"            value={a.coordinator} />
            <Fact label="QA owner"        value={a.qaOwner ?? "Unassigned"} />
            <Fact label="Stage"           value={a.stage} />
            <Fact label="Expires"         value={a.expirationDate ?? "—"} />
          </div>

          <section>
            <SectionLabel>Missing item</SectionLabel>
            <Card className="p-3.5">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
                <div>
                  <div className="text-foreground">{r.requirement}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Next: {recommendedNext(r.kind)}</div>
                </div>
              </div>
            </Card>
          </section>

          {a.missingRequirements.length > 1 && (
            <section>
              <SectionLabel>Other open items on this authorization</SectionLabel>
              <Card className="p-4">
                <ul className="space-y-2">
                  {a.missingRequirements.filter(m => m !== r.requirement).map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-2 shrink-0" />
                      <span className="text-foreground">{m}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <section>
            <SectionLabel>Related workflow visibility</SectionLabel>
            <Card className="p-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Treatment plan received</span>
                  <span className={cn("text-xs font-medium", a.treatmentPlanReceived ? "text-emerald-600" : "text-amber-600")}>
                    {a.treatmentPlanReceived ? "On file" : "Pending"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">QA status</span>
                  <span className="text-xs font-medium text-foreground">{a.qaStatus}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submission</span>
                  <span className="text-xs font-medium text-foreground">{a.submittedDate ?? "—"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Days in stage</span>
                  <span className="text-xs font-medium text-foreground">{a.daysInStage}d</span>
                </li>
              </ul>
            </Card>
          </section>

          {a.denialReason && (
            <section>
              <SectionLabel>Denial reason</SectionLabel>
              <Card className="p-3.5 text-sm text-destructive">{a.denialReason}</Card>
            </section>
          )}

          <section>
            <SectionLabel>Outreach & QA notes</SectionLabel>
            <Card className="p-3.5">
              <div className="flex items-start gap-2 text-sm">
                <History className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <div className="text-foreground">
                  Latest activity: <span className="text-muted-foreground">{relTime(a.lastActivity)}</span>
                  <div className="text-[11px] text-muted-foreground mt-1">{a.nextAction}</div>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionLabel>Quick actions</SectionLabel>
            <QAActionsPanel auth={r.auth} variant="missing-info" sourceSystem={sourceSystem} onChanged={onChanged} />
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
                <TLItem icon={Activity}  label={`Currently in: ${a.stage}`}      meta={`${a.daysInStage}d in stage`} />
                <TLItem icon={History}   label="Last activity"                    meta={relTime(a.lastActivity)} />
                {a.submittedDate && <TLItem icon={History} label="Submitted" meta={a.submittedDate} />}
                {a.approvedDate  && <TLItem icon={History} label="Approved"  meta={a.approvedDate} />}
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