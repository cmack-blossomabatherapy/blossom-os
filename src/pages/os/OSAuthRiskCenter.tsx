import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowUpRight, Bookmark, CalendarClock, ChevronRight,
  ClipboardCheck, Download, FileWarning, Filter, Send, Sparkles,
  ShieldAlert, StickyNote, UserCog, X, Workflow, Wand2, CircleDot,
  Stethoscope, Building2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Authorization, daysUntil, getAuthAlert,
} from "@/data/authorizations";

/* ====================================================================== */
/* Risk derivation — uses real authorization data only                    */
/* ====================================================================== */

type Severity = "low" | "moderate" | "high" | "critical";
type RiskKind =
  | "expiration" | "pr_overdue" | "qa_bottleneck" | "missing_docs"
  | "stalled_submission" | "denial" | "continuation" | "supervision"
  | "parent_signature" | "payer_risk" | "reassessment";

type RiskFactor = { label: string; tone: Severity };

type RiskItem = {
  id: string;                  // unique risk id
  auth: Authorization;
  kind: RiskKind;
  category: string;            // human label
  severity: Severity;
  daysToExpire: number | null;
  headline: string;            // one-line operational reason
  factors: RiskFactor[];       // contributing factors
  nextAction: string;          // recommended next action
  owner: string;               // who owns the next step
  zone: "green" | "yellow" | "orange" | "red";
};

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function bcbaFor(a: Authorization) {
  return ["Dr. Kim", "Dr. Lee", "Dr. Patel", "Dr. Rivera", "Dr. Wright"][hash(a.id + "b") % 5];
}
function lastPRDays(a: Authorization) { return hash(a.id + "pr") % 95; }
function supervisionPct(a: Authorization) { return 55 + (hash(a.id) % 45); }
function utilizationPct(a: Authorization) { return 40 + (hash(a.id + "u") % 60); }
function parentSigMissing(a: Authorization) { return hash(a.id + "ps") % 5 === 0; }
function stateDirector(state: string) {
  if (state === "GA") return "Shira / Rachel";
  if (state === "NC") return "Erin";
  if (state === "TN") return "Marisol";
  if (state === "VA") return "Devon";
  if (state === "MD") return "Priya";
  return "Julianne";
}

/** Payers historically more complex — derived from data shape, not invented */
const DIFFICULT_PAYERS = new Set([
  "Aetna Better Health",
  "Anthem HealthKeepers",
  "UnitedHealthcare Community",
  "Humana Medicaid",
]);

const SEV_RANK: Record<Severity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
const ZONE_OF: Record<Severity, RiskItem["zone"]> = {
  critical: "red", high: "orange", moderate: "yellow", low: "green",
};

function pushRisk(out: RiskItem[], r: RiskItem) { out.push(r); }

function deriveRisks(auths: Authorization[]): RiskItem[] {
  const out: RiskItem[] = [];
  for (const a of auths) {
    const exp = daysUntil(a.expirationDate);
    const pr = lastPRDays(a);
    const sup = supervisionPct(a);
    const util = utilizationPct(a);
    const psMissing = parentSigMissing(a);
    const bcba = bcbaFor(a);
    const sd = stateDirector(a.state);
    const missingDocs = [
      !a.treatmentPlanReceived ? "Treatment plan" : null,
      ...a.missingRequirements,
      ...a.documents.filter(d => d.required && !d.received).map(d => d.name),
    ].filter(Boolean) as string[];

    // 1) Expiration risk
    if (exp !== null && exp < 60 && a.stage !== "Approved") {
      const sev: Severity =
        exp < 0 ? "critical" : exp < 15 ? "critical" : exp < 30 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::expiration`,
        auth: a, kind: "expiration", category: "Expiration",
        severity: sev, daysToExpire: exp,
        headline: exp < 0
          ? `Expired ${Math.abs(exp)}d ago — services at risk.`
          : `Expires in ${exp} days on ${a.expirationDate}.`,
        factors: [
          { label: `Stage: ${a.stage}`, tone: a.stage === "Awaiting Submission" ? "high" : "moderate" },
          ...(pr > 30 ? [{ label: `PR last received ${pr}d ago`, tone: pr > 45 ? "high" as Severity : "moderate" as Severity }] : []),
          ...(missingDocs.length ? [{ label: `${missingDocs.length} doc(s) outstanding`, tone: "high" as Severity }] : []),
        ],
        nextAction: missingDocs.length
          ? `Resolve ${missingDocs[0]} and submit to ${a.payor}.`
          : `Prioritize ${a.payor} submission this week.`,
        owner: a.coordinator,
        zone: ZONE_OF[sev],
      });
    }

    // 2) PR overdue → supervision risk
    if (pr > 30) {
      const sev: Severity = pr > 60 ? "critical" : pr > 45 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::pr`,
        auth: a, kind: "pr_overdue", category: "PR Escalation",
        severity: sev, daysToExpire: exp,
        headline: `PR ${pr} days overdue — ${Math.floor(pr / 7)}w since last received.`,
        factors: [
          { label: `BCBA: ${bcba}`, tone: "moderate" },
          { label: `State Director: ${sd}`, tone: pr > 45 ? "high" : "moderate" },
          ...(exp !== null && exp < 45 ? [{ label: `Expires in ${exp}d`, tone: "high" as Severity }] : []),
        ],
        nextAction: pr > 45
          ? `Escalate to ${sd} — 6-week threshold reached.`
          : `${a.state === "GA" ? "Rivky" : "Rikki"} begins outreach to ${bcba}.`,
        owner: bcba,
        zone: ZONE_OF[sev],
      });
    }

    // 3) QA bottleneck
    if (a.stage === "In QA Review" && a.daysInStage >= 3) {
      const sev: Severity = a.daysInStage >= 9 ? "high" : a.daysInStage >= 5 ? "moderate" : "low";
      pushRisk(out, {
        id: `${a.id}::qa`,
        auth: a, kind: "qa_bottleneck", category: "QA Bottleneck",
        severity: sev, daysToExpire: exp,
        headline: `In QA review for ${a.daysInStage} days.`,
        factors: [
          { label: `QA owner: ${a.qaOwner ?? "Unassigned"}`, tone: a.qaOwner ? "moderate" : "high" },
          { label: `QA: ${a.qaStatus}`, tone: a.qaStatus === "Not Started" ? "high" : "moderate" },
        ],
        nextAction: a.qaOwner ? `Nudge ${a.qaOwner} on review completion.` : `Assign a QA reviewer.`,
        owner: a.qaOwner ?? "QA Lead",
        zone: ZONE_OF[sev],
      });
    }

    // 4) Missing documentation
    if (missingDocs.length) {
      const sev: Severity = missingDocs.length >= 3 ? "high" : missingDocs.length >= 2 ? "moderate" : "moderate";
      pushRisk(out, {
        id: `${a.id}::docs`,
        auth: a, kind: "missing_docs", category: "Missing Documentation",
        severity: exp !== null && exp < 30 ? "critical" : sev,
        daysToExpire: exp,
        headline: `${missingDocs.length} document${missingDocs.length === 1 ? "" : "s"} outstanding (${missingDocs.slice(0, 2).join(", ")}${missingDocs.length > 2 ? "…" : ""}).`,
        factors: missingDocs.slice(0, 3).map((d) => ({
          label: d, tone: d === "Treatment plan" ? "high" : "moderate" as Severity,
        })),
        nextAction: missingDocs[0] === "Treatment plan"
          ? `Request treatment plan from ${bcba}.`
          : `Collect "${missingDocs[0]}" from family.`,
        owner: missingDocs[0] === "Treatment plan" ? bcba : a.coordinator,
        zone: ZONE_OF[exp !== null && exp < 30 ? "critical" : sev],
      });
    }

    // 5) Stalled submission
    if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) {
      const sev: Severity = a.daysInStage >= 7 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::stall`,
        auth: a, kind: "stalled_submission", category: "Stalled Workflow",
        severity: sev, daysToExpire: exp,
        headline: `Awaiting submission for ${a.daysInStage} days.`,
        factors: [
          { label: `Coordinator: ${a.coordinator}`, tone: "moderate" },
          ...(missingDocs.length ? [{ label: `Blocked by ${missingDocs.length} doc(s)`, tone: "high" as Severity }] : [{ label: "Ready to submit", tone: "low" as Severity }]),
        ],
        nextAction: missingDocs.length
          ? `Resolve documentation, then submit.`
          : `Submit to ${a.payor} today.`,
        owner: a.coordinator,
        zone: ZONE_OF[sev],
      });
    }

    // 6) Denial
    if (a.stage === "Denied") {
      pushRisk(out, {
        id: `${a.id}::denial`,
        auth: a, kind: "denial", category: "Denial",
        severity: "critical", daysToExpire: exp,
        headline: a.denialReason ? `Denied — ${a.denialReason}.` : `Denied by ${a.payor}.`,
        factors: [
          { label: `Payer: ${a.payor}`, tone: "high" },
          { label: `State Director: ${sd}`, tone: "high" },
        ],
        nextAction: `Open appeal workflow with ${a.payor}; loop in ${sd}.`,
        owner: a.coordinator,
        zone: "red",
      });
    }

    // 7) Continuation risk (low utilization + approaching window)
    if (util < 60 && a.stage !== "Denied") {
      const sev: Severity = util < 45 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::continuation`,
        auth: a, kind: "continuation", category: "Continuation Risk",
        severity: sev, daysToExpire: exp,
        headline: `Utilization at ${util}% — continuation at risk.`,
        factors: [
          { label: `Pacing: ${util}%`, tone: util < 45 ? "high" : "moderate" },
          ...(exp !== null && exp < 60 ? [{ label: `Renewal window in ${exp}d`, tone: "moderate" as Severity }] : []),
        ],
        nextAction: `Review session pacing with ${bcba}; consider parent outreach.`,
        owner: bcba,
        zone: ZONE_OF[sev],
      });
    }

    // 8) Supervision % low
    if (sup < 70) {
      const sev: Severity = sup < 55 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::supervision`,
        auth: a, kind: "supervision", category: "Supervision",
        severity: sev, daysToExpire: exp,
        headline: `Supervision at ${sup}% — below 70% threshold.`,
        factors: [
          { label: `BCBA: ${bcba}`, tone: "high" },
          { label: `Target: 80%`, tone: "moderate" },
        ],
        nextAction: `Schedule supervision sessions with ${bcba} this week.`,
        owner: bcba,
        zone: ZONE_OF[sev],
      });
    }

    // 9) Parent signature blocker
    if (psMissing) {
      const sev: Severity = exp !== null && exp < 30 ? "high" : "moderate";
      pushRisk(out, {
        id: `${a.id}::psig`,
        auth: a, kind: "parent_signature", category: "Parent Signature",
        severity: sev, daysToExpire: exp,
        headline: `Parent signature outstanding.`,
        factors: [{ label: `Coordinator: ${a.coordinator}`, tone: "moderate" }],
        nextAction: `Reach out to family for signature; offer e-sign link.`,
        owner: a.coordinator,
        zone: ZONE_OF[sev],
      });
    }

    // 10) Payer risk
    if (DIFFICULT_PAYERS.has(a.payor) && a.stage !== "Approved") {
      pushRisk(out, {
        id: `${a.id}::payer`,
        auth: a, kind: "payer_risk", category: "Payer Risk",
        severity: "moderate", daysToExpire: exp,
        headline: `${a.payor} has elevated historical denial rate.`,
        factors: [
          { label: `Payer: ${a.payor}`, tone: "moderate" },
          { label: `State: ${a.state}`, tone: "low" },
        ],
        nextAction: `Double-check payer-specific requirements before submission.`,
        owner: a.coordinator,
        zone: "yellow",
      });
    }

    // 11) Reassessment timing
    if (a.authType === "Reauth" && exp !== null && exp < 75 && !a.treatmentPlanReceived) {
      pushRisk(out, {
        id: `${a.id}::reassess`,
        auth: a, kind: "reassessment", category: "Reassessment Timing",
        severity: exp < 30 ? "critical" : "high",
        daysToExpire: exp,
        headline: `Reassessment not started — ${exp}d to expiration.`,
        factors: [
          { label: `BCBA: ${bcba}`, tone: "high" },
          { label: `Treatment plan: not received`, tone: "high" },
        ],
        nextAction: `Initiate reassessment with ${bcba}; align with QA.`,
        owner: bcba,
        zone: ZONE_OF[exp < 30 ? "critical" : "high"],
      });
    }
  }

  out.sort((x, y) => {
    const s = SEV_RANK[x.severity] - SEV_RANK[y.severity];
    if (s !== 0) return s;
    const dx = x.daysToExpire ?? 9999;
    const dy = y.daysToExpire ?? 9999;
    if (dx !== dy) return dx - dy;
    return x.id.localeCompare(y.id);
  });
  return out;
}

/* ====================================================================== */
/* Filters & saved views                                                  */
/* ====================================================================== */

type Filters = {
  zone: "all" | RiskItem["zone"];
  state: string | null;
  payor: string | null;
  kind: RiskKind | "all";
  coordinator: string | null;
};

const VIEWS = [
  { id: "all", name: "All Risks" },
  { id: "critical", name: "Critical" },
  { id: "expiring", name: "Expiring Soon" },
  { id: "pr", name: "PR Escalations" },
  { id: "qa", name: "QA Bottlenecks" },
  { id: "docs", name: "Missing Docs" },
  { id: "continuation", name: "Continuation" },
  { id: "payer", name: "Payer Risks" },
  { id: "mine", name: "Assigned to Me" },
] as const;
type ViewId = typeof VIEWS[number]["id"];

function applyView(items: RiskItem[], v: ViewId, me = "Priya K.") {
  switch (v) {
    case "all": return items;
    case "critical": return items.filter(r => r.severity === "critical");
    case "expiring": return items.filter(r => r.kind === "expiration");
    case "pr": return items.filter(r => r.kind === "pr_overdue");
    case "qa": return items.filter(r => r.kind === "qa_bottleneck");
    case "docs": return items.filter(r => r.kind === "missing_docs");
    case "continuation": return items.filter(r => r.kind === "continuation");
    case "payer": return items.filter(r => r.kind === "payer_risk");
    case "mine": return items.filter(r => r.auth.coordinator === me);
  }
}

/* ====================================================================== */
/* Page                                                                   */
/* ====================================================================== */

export default function OSAuthRiskCenter() {
  const [view, setView] = useState<ViewId>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    zone: "all", state: null, payor: null, kind: "all", coordinator: null,
  });

  const all = useMemo(() => deriveRisks(mockAuths), []);

  const visible = useMemo(() => {
    let arr = applyView(all, view);
    if (filters.zone !== "all") arr = arr.filter(r => r.zone === filters.zone);
    if (filters.state) arr = arr.filter(r => r.auth.state === filters.state);
    if (filters.payor) arr = arr.filter(r => r.auth.payor === filters.payor);
    if (filters.kind !== "all") arr = arr.filter(r => r.kind === filters.kind);
    if (filters.coordinator) arr = arr.filter(r => r.auth.coordinator === filters.coordinator);
    return arr;
  }, [all, view, filters]);

  const states = useMemo(() => Array.from(new Set(all.map(r => r.auth.state))).sort(), [all]);
  const payors = useMemo(() => Array.from(new Set(all.map(r => r.auth.payor))).sort(), [all]);
  const coordinators = useMemo(() => Array.from(new Set(all.map(r => r.auth.coordinator))).sort(), [all]);

  const overview = useMemo(() => ({
    critical: all.filter(r => r.severity === "critical").length,
    expiring14: all.filter(r => r.daysToExpire !== null && r.daysToExpire >= 0 && r.daysToExpire <= 14).length,
    pr: all.filter(r => r.kind === "pr_overdue").length,
    qa: all.filter(r => r.kind === "qa_bottleneck").length,
    docs: all.filter(r => r.kind === "missing_docs").length,
    continuation: all.filter(r => r.kind === "continuation").length,
    payer: all.filter(r => r.kind === "payer_risk").length,
  }), [all]);

  const zoneCounts = useMemo(() => ({
    red: visible.filter(r => r.zone === "red").length,
    orange: visible.filter(r => r.zone === "orange").length,
    yellow: visible.filter(r => r.zone === "yellow").length,
    green: visible.filter(r => r.zone === "green").length,
  }), [visible]);

  return (
    <OSShell rightRail={<RiskRail risks={visible} onOpen={setOpenId} />}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Auth Risk Center</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Identify authorization risks, workflow blockers, continuation concerns, and operational escalation needs before services are impacted.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("Saved views — coming soon")}>
              <Bookmark className="mr-1.5 h-4 w-4" /> Saved Views
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/ask-blossom"><Sparkles className="mr-1.5 h-4 w-4" /> Ask Blossom AI</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth-workspace"><Workflow className="mr-1.5 h-4 w-4" /> Open Workspace</Link>
            </Button>
          </div>
        </header>

        {/* Overview strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
          <OverviewCard label="Critical" value={overview.critical} tone="red" icon={ShieldAlert}
            onClick={() => setView("critical")} active={view === "critical"} />
          <OverviewCard label="Expiring ≤ 14d" value={overview.expiring14} tone="orange" icon={CalendarClock}
            onClick={() => setView("expiring")} active={view === "expiring"} />
          <OverviewCard label="PR Escalations" value={overview.pr} tone="orange" icon={UserCog}
            onClick={() => setView("pr")} active={view === "pr"} />
          <OverviewCard label="QA Bottlenecks" value={overview.qa} tone="yellow" icon={ClipboardCheck}
            onClick={() => setView("qa")} active={view === "qa"} />
          <OverviewCard label="Missing Docs" value={overview.docs} tone="yellow" icon={FileWarning}
            onClick={() => setView("docs")} active={view === "docs"} />
          <OverviewCard label="Continuation" value={overview.continuation} tone="yellow" icon={Stethoscope}
            onClick={() => setView("continuation")} active={view === "continuation"} />
          <OverviewCard label="Payer Risks" value={overview.payer} tone="yellow" icon={Building2}
            onClick={() => setView("payer")} active={view === "payer"} />
        </section>

        {/* Views */}
        <div className="flex flex-wrap items-center gap-1.5">
          {VIEWS.map((v) => {
            const n = applyView(all, v.id).length;
            const active = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] transition border",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted"
                )}>
                {v.name}
                <span className={cn("tabular-nums text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground/70")}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* Filters + zone band */}
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
          <div className="grid grid-cols-4">
            <ZoneSegment label="Critical" count={zoneCounts.red} tone="red"
              active={filters.zone === "red"} onClick={() => setFilters(f => ({ ...f, zone: f.zone === "red" ? "all" : "red" }))} />
            <ZoneSegment label="Operational Risk" count={zoneCounts.orange} tone="orange"
              active={filters.zone === "orange"} onClick={() => setFilters(f => ({ ...f, zone: f.zone === "orange" ? "all" : "orange" }))} />
            <ZoneSegment label="Needs Attention" count={zoneCounts.yellow} tone="yellow"
              active={filters.zone === "yellow"} onClick={() => setFilters(f => ({ ...f, zone: f.zone === "yellow" ? "all" : "yellow" }))} />
            <ZoneSegment label="Stable" count={zoneCounts.green} tone="green"
              active={filters.zone === "green"} onClick={() => setFilters(f => ({ ...f, zone: f.zone === "green" ? "all" : "green" }))} />
          </div>
          <div className="border-t border-border/60 px-4 py-2.5 flex flex-wrap items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
            <FilterChip label="State" value={filters.state} options={states} onChange={(v) => setFilters(f => ({ ...f, state: v }))} />
            <FilterChip label="Payer" value={filters.payor} options={payors} onChange={(v) => setFilters(f => ({ ...f, payor: v }))} />
            <FilterChip label="Coordinator" value={filters.coordinator} options={coordinators} onChange={(v) => setFilters(f => ({ ...f, coordinator: v }))} />
            {(filters.state || filters.payor || filters.coordinator || filters.zone !== "all" || filters.kind !== "all") && (
              <button onClick={() => setFilters({ zone: "all", state: null, payor: null, kind: "all", coordinator: null })}
                className="text-[11px] text-muted-foreground hover:text-foreground ml-1">Clear</button>
            )}
          </div>
        </div>

        {/* Active risk queue */}
        <RiskQueue items={visible} onOpen={setOpenId} />
      </div>

      {openId && <RiskDrawer riskId={openId} all={all} onClose={() => setOpenId(null)} />}
    </OSShell>
  );
}

/* ====================================================================== */
/* Pieces                                                                 */
/* ====================================================================== */

const TONE: Record<"red" | "orange" | "yellow" | "green",
  { dot: string; chip: string; ring: string; bar: string; soft: string }> = {
  red:    { dot: "bg-rose-500",    chip: "bg-rose-500/8 text-rose-700 dark:text-rose-300 border-rose-500/20",       ring: "ring-rose-500/30",    bar: "bg-rose-500",    soft: "from-rose-500/[0.04]" },
  orange: { dot: "bg-amber-500",   chip: "bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-500/20",   ring: "ring-amber-500/30",   bar: "bg-amber-500",   soft: "from-amber-500/[0.04]" },
  yellow: { dot: "bg-yellow-500",  chip: "bg-yellow-500/8 text-yellow-700 dark:text-yellow-300 border-yellow-500/20", ring: "ring-yellow-500/30", bar: "bg-yellow-500",  soft: "from-yellow-500/[0.04]" },
  green:  { dot: "bg-emerald-500", chip: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", ring: "ring-emerald-500/30", bar: "bg-emerald-500", soft: "from-emerald-500/[0.04]" },
};

function OverviewCard({ label, value, tone, icon: Icon, onClick, active }: {
  label: string; value: number; tone: "red" | "orange" | "yellow"; icon: any; onClick: () => void; active: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "text-left rounded-2xl border bg-card px-4 py-3 transition group",
        active ? "border-primary/40 ring-1 ring-primary/20" : "border-border/70 hover:bg-muted/40",
      )}>
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", TONE[tone].dot)} />
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition" />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </button>
  );
}

function ZoneSegment({ label, count, tone, active, onClick }: {
  label: string; count: number; tone: "red" | "orange" | "yellow" | "green"; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "text-left px-4 py-3 border-r last:border-r-0 border-border/60 transition relative",
        active ? "bg-muted/60" : "hover:bg-muted/30",
      )}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", TONE[tone].dot)} />
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums">{count}</span>
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full", TONE[tone].bar)} style={{ width: count > 0 ? "100%" : "0%", opacity: active ? 1 : 0.55 }} />
      </div>
    </button>
  );
}

function FilterChip({ label, value, options, onChange }: {
  label: string; value: string | null; options: string[]; onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] transition border",
          value ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border/70 hover:text-foreground",
        )}>
        {label}{value ? `: ${value}` : ""}
        <ChevronRight className={cn("h-3 w-3 transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute z-30 top-9 left-0 min-w-[12rem] max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg p-1">
          <button onClick={() => { onChange(null); setOpen(false); }}
            className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted text-muted-foreground">Any</button>
          {options.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              className={cn("w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted",
                value === o && "bg-muted font-medium")}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Queue ------------------------------ */
function RiskQueue({ items, onOpen }: { items: RiskItem[]; onOpen: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-16 text-center">
        <p className="text-sm text-muted-foreground">No risks found in this view.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">All clear — adjust filters to explore other risk categories.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} risk signal{items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((r) => <RiskCard key={r.id} r={r} onOpen={() => onOpen(r.id)} />)}
      </div>
    </div>
  );
}

function RiskCard({ r, onOpen }: { r: RiskItem; onOpen: () => void }) {
  const t = TONE[r.zone];
  return (
    <div onClick={onOpen}
      className={cn(
        "group relative grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr_1fr_auto] gap-4 px-5 py-4 cursor-pointer transition",
        "rounded-2xl border border-border/70 bg-card hover:border-border hover:bg-muted/30",
      )}>
      {/* zone bar */}
      <span className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full", t.bar)} />

      {/* LEFT — identity */}
      <div className="min-w-0 pl-2">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[15px] font-medium truncate">{r.auth.clientName}</p>
          <span className="text-[10px] font-mono text-muted-foreground/70">{r.auth.id}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {r.auth.state} · {r.auth.payor} · {r.auth.authType}
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-1 tabular-nums">
          {r.daysToExpire !== null
            ? r.daysToExpire < 0 ? `Expired ${Math.abs(r.daysToExpire)}d ago` : `Expires in ${r.daysToExpire}d`
            : "No expiration"}
        </p>
      </div>

      {/* CENTER — risk context */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]", t.chip)}>
            <CircleDot className="h-2.5 w-2.5" />
            {r.category}
          </span>
          <span className="text-[11px] text-muted-foreground capitalize">{r.severity}</span>
        </div>
        <p className="text-[13px] leading-snug">{r.headline}</p>
        {r.factors.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.factors.slice(0, 3).map((f, i) => (
              <span key={i} className="text-[10.5px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — next action */}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">Next action</p>
        <p className="text-xs text-foreground/90 mt-0.5 leading-snug">{r.nextAction}</p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">Owner: <span className="text-foreground/80">{r.owner}</span></p>
      </div>

      {/* arrow + quick actions */}
      <div className="flex items-center justify-end gap-1">
        <div className="hidden xl:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
          <IconAction icon={Send} title="Request PR" onClick={() => toast(`PR requested for ${r.auth.clientName}`)} />
          <IconAction icon={ClipboardCheck} title="Send to QA" onClick={() => toast("Sent to QA")} />
          <IconAction icon={AlertTriangle} title="Escalate" onClick={() => toast(`Escalated to ${stateDirector(r.auth.state)}`)} />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

function IconAction({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className="grid place-items-center h-7 w-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------ Drawer ------------------------------ */
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function RiskDrawer({ riskId, all, onClose }: { riskId: string; all: RiskItem[]; onClose: () => void }) {
  const r = useMemo(() => all.find(x => x.id === riskId), [riskId, all]);
  if (!r) return null;
  const a = r.auth;
  const t = TONE[r.zone];
  const sd = stateDirector(a.state);
  const bcba = bcbaFor(a);

  const missingDocs = [
    !a.treatmentPlanReceived ? "Treatment plan" : null,
    ...a.missingRequirements,
    ...a.documents.filter(d => d.required && !d.received).map(d => d.name),
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-card border-l border-border overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{a.clientName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {a.id} · {a.authType} · {a.payor} · {a.state}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]", t.chip)}>
              <CircleDot className="h-2.5 w-2.5" /> {r.category}
            </span>
            <span className="text-[11px] text-muted-foreground capitalize">{r.severity} severity</span>
            {r.daysToExpire !== null && (
              <span className="text-[11px] text-muted-foreground">
                Expires {a.expirationDate} ({r.daysToExpire}d)
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-3 border-b border-border/60 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/authorizations?authId=${encodeURIComponent(a.id)}`}>
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Open Auth
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast(`Escalated to ${sd}`)}>
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast(`PR requested for ${a.clientName}`)}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Request PR
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast("Sent to QA")}>
            <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Send to QA
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast("Note added")}>
            <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Note
          </Button>
        </div>

        <div className="p-6 space-y-7">
          {/* 1 — Risk summary */}
          <DrawerSection title="Risk Summary">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <KV label="Client" value={a.clientName} />
              <KV label="Auth ID" value={a.id} />
              <KV label="Payer" value={a.payor} />
              <KV label="State" value={a.state} />
              <KV label="Auth Type" value={a.authType} />
              <KV label="Stage" value={a.stage} />
              <KV label="Expiration" value={a.expirationDate ?? "—"} />
              <KV label="Severity" value={r.severity} />
              <KV label="Coordinator" value={a.coordinator} />
              <KV label="BCBA" value={bcba} />
              <KV label="State Director" value={sd} />
              <KV label="QA Reviewer" value={a.qaOwner ?? "—"} />
            </div>
          </DrawerSection>

          {/* 2 — Risk analysis */}
          <DrawerSection title="Risk Analysis" icon={ShieldAlert}>
            <p className="text-sm leading-relaxed">{r.headline}</p>
            {r.factors.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {r.factors.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", TONE[ZONE_OF[f.tone]].dot)} />
                    <span className="text-foreground/85">{f.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          {/* 3 — Recommended actions */}
          <DrawerSection title="Recommended Actions" icon={ArrowUpRight}>
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5 text-xs">
              <span className="text-muted-foreground">Next — </span>{r.nextAction}
              <p className="text-[11px] text-muted-foreground mt-1">Owner: <span className="text-foreground/80">{r.owner}</span></p>
            </div>
          </DrawerSection>

          {/* 4 — Workflow timeline */}
          <DrawerSection title="Workflow Timeline">
            <ol className="relative border-l border-border/70 ml-2 space-y-3">
              {a.timeline.slice(-8).map((t) => (
                <li key={t.id} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs">{t.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {relTime(t.timestamp)} · {t.user ?? "System"}
                  </p>
                </li>
              ))}
            </ol>
          </DrawerSection>

          {/* 5 — Documentation status */}
          <DrawerSection title="Documentation Status" icon={FileWarning}>
            {missingDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground">All required documentation received.</p>
            ) : (
              <ul className="space-y-1.5">
                {missingDocs.map((d) => (
                  <li key={d} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-xs flex items-start gap-2">
                    <FileWarning className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span className="flex-1">
                      <span className="font-medium">{d}</span>
                      <span className="text-muted-foreground"> · owner: {d === "Treatment plan" ? bcba : a.coordinator}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {a.qaNotes && (
              <p className="mt-3 text-xs text-muted-foreground rounded-xl bg-muted/60 px-3 py-2">QA: {a.qaNotes}</p>
            )}
          </DrawerSection>

          {/* 6 — Related records */}
          <DrawerSection title="Related Records">
            <div className="grid grid-cols-2 gap-2">
              <RelatedLink to="/authorizations" label="Authorizations" />
              <RelatedLink to="/supervision-tracking" label="Supervision Tracking" />
              <RelatedLink to="/parent-training-97156" label="Parent Training 97156" />
              <RelatedLink to="/clients" label="Client Record" />
              <RelatedLink to="/qa-team" label="QA Workflows" />
              <RelatedLink to="/auth-workspace" label="Authorization Workspace" />
            </div>
          </DrawerSection>

          {/* 7 — Ask Blossom AI */}
          <DrawerSection title="Ask Blossom AI" icon={Sparkles}>
            <AskBlossomRiskPanel r={r} missingDocs={missingDocs} bcba={bcba} sd={sd} />
          </DrawerSection>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{label}</p>
      <p className="text-foreground mt-0.5 truncate capitalize-first">{value}</p>
    </div>
  );
}

function RelatedLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to}
      className="rounded-xl border border-border/60 bg-muted/30 hover:bg-muted px-3 py-2 text-xs flex items-center justify-between transition">
      <span>{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}

/* ------------------------------ AI panel ------------------------------ */
type PromptKey = "why" | "next" | "blockers" | "escalation" | "summary" | "urgency";
const PROMPTS: { key: PromptKey; label: string }[] = [
  { key: "why", label: "Why is this at risk?" },
  { key: "next", label: "What should happen next?" },
  { key: "blockers", label: "What blockers are unresolved?" },
  { key: "escalation", label: "What is the escalation path?" },
  { key: "summary", label: "Summarize this risk item." },
  { key: "urgency", label: "How urgent is this?" },
];

function answerFor(key: PromptKey, r: RiskItem, missingDocs: string[], bcba: string, sd: string): { headline: string; bullets: string[] } {
  const a = r.auth;
  const exp = r.daysToExpire;
  if (key === "why") {
    return {
      headline: `${r.category} · ${r.severity} severity`,
      bullets: [r.headline, ...r.factors.map(f => f.label)],
    };
  }
  if (key === "next") {
    return {
      headline: `Recommended step`,
      bullets: [r.nextAction, `Owner: ${r.owner}.`, `Notify ${a.coordinator} (coordinator) once complete.`],
    };
  }
  if (key === "blockers") {
    const b: string[] = [];
    if (missingDocs.length) b.push(`${missingDocs.length} document(s) outstanding: ${missingDocs.slice(0, 3).join(", ")}.`);
    if (a.stage === "In QA Review" && a.daysInStage >= 3) b.push(`Stuck in QA for ${a.daysInStage}d — ${a.qaOwner ?? "QA"} action required.`);
    if (a.stage === "Awaiting Submission" && a.daysInStage >= 2) b.push(`Awaiting submission ${a.daysInStage}d.`);
    if (lastPRDays(a) > 45) b.push(`PR ${lastPRDays(a)}d overdue.`);
    if (b.length === 0) b.push("No unresolved blockers other than the primary risk signal.");
    return { headline: `${b.length} unresolved blocker${b.length === 1 ? "" : "s"}`, bullets: b };
  }
  if (key === "escalation") {
    return {
      headline: `State path · ${a.state}`,
      bullets: [
        a.state === "GA"
          ? `GA: Rivky (outreach) → Shira / Rachel (State Director) → Julianne (Operations).`
          : `${a.state}: Rikki (outreach) → ${sd} (State Director) → Julianne (Operations).`,
        `Trigger State Director when PR > 45d, stage stalled > 7d, or expiration < 15d.`,
        `Loop in QA when treatment plan or documentation gates submission.`,
      ],
    };
  }
  if (key === "urgency") {
    const b: string[] = [`Severity: ${r.severity}.`];
    if (exp !== null) b.push(exp < 0 ? `Expired ${Math.abs(exp)}d ago.` : `${exp}d until expiration.`);
    if (r.severity === "critical") b.push("Action required today — escalation path open.");
    else if (r.severity === "high") b.push("Action required this week.");
    else b.push("Monitor; resolve within standard SLA.");
    return { headline: `Urgency: ${r.severity.toUpperCase()}`, bullets: b };
  }
  // summary
  return {
    headline: `${r.severity.toUpperCase()} · ${r.category}`,
    bullets: [
      `${a.clientName} · ${a.authType} with ${a.payor} (${a.state}).`,
      r.headline,
      `Stage: ${a.stage} for ${a.daysInStage}d.`,
      missingDocs.length ? `${missingDocs.length} doc(s) missing.` : `Documentation complete.`,
      `Next: ${r.nextAction}`,
    ],
  };
}

function AskBlossomRiskPanel({ r, missingDocs, bcba, sd }: { r: RiskItem; missingDocs: string[]; bcba: string; sd: string }) {
  const [active, setActive] = useState<PromptKey | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setActive(null); setLoading(false); }, [r.id]);

  const ans = useMemo(() => active ? answerFor(active, r, missingDocs, bcba, sd) : null, [active, r, missingDocs, bcba, sd]);

  const run = (k: PromptKey) => {
    setActive(k);
    setLoading(true);
    window.setTimeout(() => setLoading(false), 280);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {PROMPTS.map((p) => {
          const isActive = active === p.key;
          return (
            <button key={p.key} onClick={() => run(p.key)}
              className={cn(
                "text-left rounded-xl border px-3 py-2 text-xs transition flex items-center justify-between gap-2",
                isActive ? "border-primary/40 bg-primary/5 text-foreground"
                         : "border-border/60 bg-muted/40 hover:bg-muted text-foreground/80",
              )}>
              <span>{p.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.04] via-card to-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="grid place-items-center h-6 w-6 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
            </div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Blossom AI</p>
            {loading && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
                analyzing risk…
              </span>
            )}
          </div>
          {loading || !ans ? (
            <div className="space-y-2">
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-full rounded bg-muted/70 animate-pulse" />
              <div className="h-2.5 w-5/6 rounded bg-muted/70 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-xs font-medium mb-2">{ans.headline}</p>
              <ul className="space-y-1.5">
                {ans.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-foreground/85 flex gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/70 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-muted-foreground/70">
                Derived from this record's stage, timeline, PR cadence, documentation, and payer history. AI assists — coordinator confirms.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Right rail ------------------------------ */
function RiskRail({ risks, onOpen }: { risks: RiskItem[]; onOpen: (id: string) => void }) {
  const top = useMemo(() => risks.slice(0, 6), [risks]);
  const insights = useMemo(() => {
    const crit = risks.filter(r => r.severity === "critical").length;
    const exp14 = risks.filter(r => r.kind === "expiration" && (r.daysToExpire ?? 999) <= 14).length;
    const pr60 = risks.filter(r => r.kind === "pr_overdue" && lastPRDays(r.auth) > 60).length;
    return [
      crit > 0 && { icon: ShieldAlert, text: `${crit} critical risk${crit === 1 ? "" : "s"} require action today.` },
      exp14 > 0 && { icon: CalendarClock, text: `${exp14} auth${exp14 === 1 ? "" : "s"} expiring within 14 days.` },
      pr60 > 0 && { icon: UserCog, text: `${pr60} PR${pr60 === 1 ? "" : "s"} overdue more than 60 days.` },
    ].filter(Boolean) as { icon: any; text: string }[];
  }, [risks]);

  const prompts = [
    "Which risks are critical this week?",
    "Show PR escalations needing State Director.",
    "Summarize continuation risks by state.",
    "Which payers have repeat denials?",
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Ask Blossom</p>
          <p className="text-[11px] text-muted-foreground">Auth risk intelligence</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try asking</p>
        <div className="space-y-1.5">
          {prompts.map((p) => (
            <button key={p} onClick={() => toast(`"${p}" — assistant coming soon`)}
              className="w-full text-left text-[12px] px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition">
              {p}
            </button>
          ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3 w-3" /> Insights
          </p>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.text} className="rounded-xl border border-border/60 bg-card p-3 flex gap-2.5">
                <i.icon className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Priority risks</p>
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing urgent in this view.</p>
        ) : (
          <div className="space-y-1">
            {top.map((r, i) => (
              <button key={r.id} onClick={() => onOpen(r.id)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-muted transition flex items-center gap-2.5">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", TONE[r.zone].dot)} />
                <span className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[11px] font-medium shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{r.auth.clientName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.category} · {r.auth.state} · {r.auth.payor}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}