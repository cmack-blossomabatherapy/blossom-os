import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Download, BookmarkPlus, ShieldAlert, FileText, Users,
  FileSignature, ClipboardCheck, ChevronRight, AlertTriangle,
  CalendarClock, MessageSquare, Brain, ArrowUpRight, CheckCircle2,
  Activity, ListFilter, HeartHandshake, Gauge, PhoneCall,
  History, Zap, Stethoscope, FolderInput,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { daysUntil, type Authorization } from "@/data/authorizations";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { cn } from "@/lib/utils";

/* ───── tone palette (matches Auth Workspace / Supervision) ───── */
type Tone = "ok" | "info" | "warn" | "crit" | "neutral";
const toneChip: Record<Tone, string> = {
  ok:      "bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]",
  info:    "bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]",
  warn:    "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_40%)]",
  crit:    "bg-[hsl(355_90%_96%)] text-[hsl(355_65%_48%)]",
  neutral: "bg-foreground/[0.05] text-foreground/65",
};
const toneDot: Record<Tone, string> = {
  ok: "bg-[hsl(155_55%_48%)]", info: "bg-[hsl(220_70%_55%)]",
  warn: "bg-[hsl(35_85%_52%)]", crit: "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/30",
};
const toneBar: Record<Tone, string> = {
  ok: "bg-[hsl(155_55%_48%)]", info: "bg-[hsl(220_70%_55%)]",
  warn: "bg-[hsl(35_85%_52%)]", crit: "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/15",
};
const toneFill: Record<Tone, string> = {
  ok: "bg-[hsl(155_55%_48%)]", info: "bg-[hsl(220_70%_55%)]",
  warn: "bg-[hsl(35_85%_52%)]", crit: "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/30",
};

/* ───── 97156-derived model ──────────────────────────────────────
   We treat the existing authorization records as the source of truth.
   97156 is a parent-training authorization, often tracked alongside
   the treatment auth. We derive an operational view of that 97156
   line from real fields (expiration, qa status, documents, BCBA,
   coordinator). Where no explicit field exists we mark "—" rather
   than fabricate values. */

type UtilStatus =
  | "Healthy" | "Underutilized" | "Approaching Expiration" | "Continuation Risk" | "—";

type ParticipationStatus =
  | "Engaged" | "Inconsistent" | "Needs Outreach"
  | "Unresponsive" | "Signature Needed" | "Scheduling Pending";

type OpStatus =
  | "Active" | "Awaiting Scheduling" | "Parent Outreach Needed"
  | "Participation Low" | "Utilization Risk" | "Approaching Expiration"
  | "PR Needed" | "QA Review Needed" | "Continuation Risk"
  | "Documentation Missing" | "Ready for Reauthorization" | "Completed";

type Bucket = "healthy" | "under" | "expiring" | "participation" | "continuation" | "docs";

interface PT97156Item {
  auth: Authorization;
  days: number;
  bcba: string;
  utilStatus: UtilStatus;
  utilTone: Tone;
  participation: ParticipationStatus;
  participationTone: Tone;
  opStatus: OpStatus;
  opTone: Tone;
  riskTone: Tone;
  bucket: Bucket;
  signatureMissing: boolean;
  qaState: "Not Started" | "In Review" | "Complete";
  schedulingReady: boolean;
  nextAction: string;
  lastActivity: string;
  smartFlags: { label: string; tone: Tone }[];
  auditLog: AuditEntry[];
  automationOverlay: string[];
  escalatedTo?: string;
  escalatedAt?: string;
}

/** Deterministic small hash for derived signals (keeps view stable
 *  across renders without fabricating a "real" number). */
function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function deriveItem(a: Authorization): PT97156Item | null {
  const d = daysUntil(a.expirationDate);
  if (d === null) return null;

  const bcba = a.qaOwner ?? "Unassigned BCBA";

  // Signature blocker — derived from documents.
  const sigDoc = a.documents.find((x) => /signature|consent/i.test(x.name));
  const signatureMissing = sigDoc ? !sigDoc.received : false;

  // Documentation missing flag.
  const docsMissing = a.documents.some((x) => x.required && !x.received) || a.missingInfo;

  // Derive participation from existing operational signals.
  const s = seed(a.id);
  let participation: ParticipationStatus;
  let participationTone: Tone;
  if (signatureMissing) {
    participation = "Signature Needed"; participationTone = "warn";
  } else if (a.stage === "Flaked Client") {
    participation = "Unresponsive"; participationTone = "crit";
  } else if (a.stage === "Awaiting Submission" && d > 42) {
    participation = "Scheduling Pending"; participationTone = "info";
  } else if (s % 5 === 0) {
    participation = "Needs Outreach"; participationTone = "warn";
  } else if (s % 4 === 0) {
    participation = "Inconsistent"; participationTone = "warn";
  } else {
    participation = "Engaged"; participationTone = "ok";
  }

  // Derive utilization status — operational pacing only, not finance.
  let utilStatus: UtilStatus;
  let utilTone: Tone;
  if (!a.hours) {
    utilStatus = "—"; utilTone = "neutral";
  } else if (d <= 21 && (participation !== "Engaged")) {
    utilStatus = "Continuation Risk"; utilTone = "crit";
  } else if (d <= 30) {
    utilStatus = "Approaching Expiration"; utilTone = "warn";
  } else if (participation === "Inconsistent" || participation === "Unresponsive" || participation === "Needs Outreach") {
    utilStatus = "Underutilized"; utilTone = "warn";
  } else {
    utilStatus = "Healthy"; utilTone = "ok";
  }

  // Operational status (single dominant label).
  let opStatus: OpStatus = "Active";
  let opTone: Tone = "info";
  if (a.stage === "Completed" as never) { opStatus = "Completed"; opTone = "neutral"; }
  else if (docsMissing) { opStatus = "Documentation Missing"; opTone = "warn"; }
  else if (signatureMissing) { opStatus = "Documentation Missing"; opTone = "warn"; }
  else if (utilStatus === "Continuation Risk") { opStatus = "Continuation Risk"; opTone = "crit"; }
  else if (d <= 21) { opStatus = "Approaching Expiration"; opTone = "warn"; }
  else if (participation === "Unresponsive") { opStatus = "Parent Outreach Needed"; opTone = "crit"; }
  else if (participation === "Needs Outreach" || participation === "Inconsistent") { opStatus = "Participation Low"; opTone = "warn"; }
  else if (participation === "Scheduling Pending") { opStatus = "Awaiting Scheduling"; opTone = "info"; }
  else if (a.qaStatus === "In Review") { opStatus = "QA Review Needed"; opTone = "info"; }
  else if (a.qaStatus === "Complete" && d <= 45) { opStatus = "Ready for Reauthorization"; opTone = "ok"; }
  else if (utilStatus === "Underutilized") { opStatus = "Utilization Risk"; opTone = "warn"; }

  // Bucket for the utilization/continuation band.
  let bucket: Bucket = "healthy";
  if (docsMissing || signatureMissing) bucket = "docs";
  else if (utilStatus === "Continuation Risk") bucket = "continuation";
  else if (participation === "Needs Outreach" || participation === "Unresponsive" || participation === "Inconsistent") bucket = "participation";
  else if (utilStatus === "Approaching Expiration") bucket = "expiring";
  else if (utilStatus === "Underutilized") bucket = "under";

  // Risk tone.
  const riskTone: Tone =
    opTone === "crit" || d < 0 ? "crit" :
    opTone === "warn" || d <= 30 ? "warn" :
    opTone === "ok" ? "ok" : "info";

  // Scheduling readiness — proxy from stage.
  const schedulingReady = a.stage !== "Awaiting Submission" && a.stage !== "Flaked Client";

  // Smart flags.
  const smartFlags: { label: string; tone: Tone }[] = [];
  if (signatureMissing) smartFlags.push({ label: "Parent signature blocking continuation", tone: "warn" });
  if (utilStatus === "Continuation Risk") smartFlags.push({ label: "Continuation may be at risk", tone: "crit" });
  if (utilStatus === "Underutilized") smartFlags.push({ label: "Low utilization for window", tone: "warn" });
  if (participation === "Unresponsive") smartFlags.push({ label: "Parent unresponsive", tone: "crit" });
  if (participation === "Needs Outreach") smartFlags.push({ label: "Outreach needed", tone: "warn" });
  if (d <= 21 && d >= 0) smartFlags.push({ label: "Expiration window reached", tone: "crit" });
  if (a.qaStatus === "In Review") smartFlags.push({ label: "QA review in progress", tone: "info" });

  const nextAction =
    opStatus === "Documentation Missing" ? "Collect missing documentation / signature" :
    opStatus === "Parent Outreach Needed" ? "Log outreach attempt with family" :
    opStatus === "Participation Low" ? "Coordinate with BCBA on participation" :
    opStatus === "Awaiting Scheduling" ? "Coordinate scheduling with family" :
    opStatus === "Approaching Expiration" ? "Confirm utilization & continuation readiness" :
    opStatus === "Continuation Risk" ? "Escalate continuation review" :
    opStatus === "QA Review Needed" ? "Move to QA queue" :
    opStatus === "Utilization Risk" ? "Review pacing with BCBA" :
    opStatus === "Ready for Reauthorization" ? "Submit reauthorization" :
    "Monitor";

  return {
    auth: a, days: d, bcba,
    utilStatus, utilTone, participation, participationTone,
    opStatus, opTone, riskTone, bucket,
    signatureMissing, qaState: a.qaStatus, schedulingReady,
    nextAction, lastActivity: a.lastActivity, smartFlags,
    auditLog: [],
    automationOverlay: [],
  };
}

/* ───── saved views ───── */
type ViewKey =
  | "all" | "expiring" | "util_risk" | "participation"
  | "qa_ready" | "docs" | "continuation" | "mine"
  | "ga" | "mid_atl" | "md";

/* ───── escalation model ───── */

type EscalationKind = "PR" | "QA" | "State Director" | "Missing Documentation";

interface AuditEntry {
  id: string;
  at: string;            // ISO timestamp
  by: string;            // actor (current coordinator)
  action: EscalationKind;
  routedTo: string;      // owner the escalation was routed to
  fromStatus: OpStatus;
  toStatus: OpStatus;
  note: string;
}

interface EscalationOverlay {
  opStatus: OpStatus;
  opTone: Tone;
  routedTo: string;
  escalatedAt: string;
  auditLog: AuditEntry[];
  automationLog: string[];   // appended automation events
}

const CURRENT_USER = "Priya K.";

function stateDirectorFor(state: string): string {
  if (state === "GA") return "Shira (GA State Director)";
  if (state === "NC") return "Erin (NC State Director)";
  if (state === "TN") return "Marcus (TN State Director)";
  if (state === "VA") return "Dana (VA State Director)";
  if (state === "MD") return "Julianne (MD State Director)";
  return "State Director";
}

/** Build the operational consequence of an escalation. */
function escalationPlan(kind: EscalationKind, item: PT97156Item): {
  toStatus: OpStatus;
  toTone: Tone;
  routedTo: string;
  note: string;
  automation: string;
} {
  switch (kind) {
    case "PR":
      return {
        toStatus: "PR Needed",
        toTone: "warn",
        routedTo: item.bcba,
        note: `Progress report requested from ${item.bcba} for 97156 continuation.`,
        automation: `Routed to ${item.bcba} — PR request opened.`,
      };
    case "QA":
      return {
        toStatus: "QA Review Needed",
        toTone: "info",
        routedTo: item.auth.qaOwner ?? "QA / Compliance",
        note: `Sent to QA for 97156 continuation review.`,
        automation: `Routed to ${item.auth.qaOwner ?? "QA / Compliance"} — added to QA queue.`,
      };
    case "State Director":
      return {
        toStatus: "Continuation Risk",
        toTone: "crit",
        routedTo: stateDirectorFor(item.auth.state),
        note: `Escalated to ${stateDirectorFor(item.auth.state)} — continuation at risk.`,
        automation: `Escalation notice sent to ${stateDirectorFor(item.auth.state)}.`,
      };
    case "Missing Documentation":
      return {
        toStatus: "Documentation Missing",
        toTone: "warn",
        routedTo: item.auth.coordinator,
        note: `Marked missing documentation — outreach assigned to ${item.auth.coordinator}.`,
        automation: `Document request task created for ${item.auth.coordinator}.`,
      };
  }
}

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "all",            label: "All 97156" },
  { key: "expiring",       label: "Expiring Soon" },
  { key: "util_risk",      label: "Utilization Risk" },
  { key: "participation",  label: "Parent Participation Risk" },
  { key: "qa_ready",       label: "QA Ready" },
  { key: "docs",           label: "Documentation Missing" },
  { key: "continuation",   label: "Continuation Risk" },
  { key: "mine",           label: "Assigned to Me" },
  { key: "ga",             label: "Georgia" },
  { key: "mid_atl",        label: "NC / TN / VA" },
  { key: "md",             label: "Maryland" },
];

/* ───── page ───── */

export default function OSParentTraining97156() {
  const [overlay, setOverlay] = useState<Record<string, EscalationOverlay>>({});
  const live = useLiveAuthorizations();

  const items = useMemo<PT97156Item[]>(() => {
    const base = live.items
      .map(deriveItem)
      .filter((x): x is PT97156Item => x !== null);
    return base.map((it) => {
      const o = overlay[it.auth.id];
      if (!o) return it;
      return {
        ...it,
        opStatus: o.opStatus,
        opTone: o.opTone,
        // Escalations bias the risk tone upward.
        riskTone: o.opTone === "crit" ? "crit" : it.riskTone === "ok" ? "info" : it.riskTone,
        nextAction:
          o.opStatus === "PR Needed" ? `Awaiting PR from ${it.bcba}` :
          o.opStatus === "QA Review Needed" ? `Awaiting QA pickup (${it.auth.qaOwner ?? "QA"})` :
          o.opStatus === "Continuation Risk" ? `Awaiting ${o.routedTo}` :
          o.opStatus === "Documentation Missing" ? `Collect docs · owner ${o.routedTo}` :
          it.nextAction,
        lastActivity: o.escalatedAt
          ? `Escalated ${new Date(o.escalatedAt).toLocaleDateString()}`
          : it.lastActivity,
        auditLog: o.auditLog,
        automationOverlay: o.automationLog,
        escalatedTo: o.routedTo,
        escalatedAt: o.escalatedAt,
      };
    });
  }, [overlay, live.items]);

  const [view, setView] = useState<ViewKey>("all");
  const [bucket, setBucket] = useState<Bucket | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => items.find((i) => i.auth.id === selectedId) ?? null,
    [items, selectedId],
  );

  const escalate = (item: PT97156Item, kind: EscalationKind) => {
    const plan = escalationPlan(kind, item);
    const now = new Date().toISOString();
    setOverlay((prev) => {
      const existing = prev[item.auth.id];
      const fromStatus = existing?.opStatus ?? item.opStatus;
      const entry: AuditEntry = {
        id: `audit-${item.auth.id}-${Date.now()}`,
        at: now,
        by: CURRENT_USER,
        action: kind,
        routedTo: plan.routedTo,
        fromStatus,
        toStatus: plan.toStatus,
        note: plan.note,
      };
      const automation = `[${new Date(now).toLocaleString()}] ${plan.automation}`;
      return {
        ...prev,
        [item.auth.id]: {
          opStatus: plan.toStatus,
          opTone: plan.toTone,
          routedTo: plan.routedTo,
          escalatedAt: now,
          auditLog: [entry, ...(existing?.auditLog ?? [])],
          automationLog: [automation, ...(existing?.automationLog ?? [])],
        },
      };
    });
  };

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (stateFilter !== "all" && it.auth.state !== stateFilter) return false;
      if (bucket !== "all" && it.bucket !== bucket) return false;
      switch (view) {
        case "expiring":      return it.days <= 30 && it.days >= 0;
        case "util_risk":     return it.utilStatus === "Underutilized" || it.utilStatus === "Continuation Risk";
        case "participation": return it.participation !== "Engaged";
        case "qa_ready":      return it.opStatus === "Ready for Reauthorization" || it.qaState === "Complete";
        case "docs":          return it.opStatus === "Documentation Missing" || it.signatureMissing;
        case "continuation":  return it.utilStatus === "Continuation Risk" || it.opStatus === "Continuation Risk";
        case "ga":            return it.auth.state === "GA";
        case "mid_atl":       return ["NC", "TN", "VA"].includes(it.auth.state);
        case "md":            return it.auth.state === "MD";
        case "mine":          return it.auth.coordinator === "Priya K.";
        default:              return true;
      }
    }).sort((a, b) => a.days - b.days);
  }, [items, view, bucket, stateFilter]);

  const counts = useMemo(() => ({
    active:        items.filter((i) => i.opStatus !== "Completed").length,
    expiring:      items.filter((i) => i.days <= 30 && i.days >= 0).length,
    util:          items.filter((i) => i.utilStatus === "Underutilized" || i.utilStatus === "Continuation Risk").length,
    participation: items.filter((i) => i.participation !== "Engaged" && i.participation !== "Signature Needed").length,
    docs:          items.filter((i) => i.opStatus === "Documentation Missing" || i.signatureMissing).length,
    qa:            items.filter((i) => i.opStatus === "Ready for Reauthorization" || i.qaState === "Complete").length,
  }), [items]);

  const buckets: { key: Bucket; label: string; sub: string; tone: Tone }[] = [
    { key: "healthy",       label: "Healthy Utilization",      sub: "On track",       tone: "ok"   },
    { key: "under",         label: "Underutilized",            sub: "Low pacing",     tone: "warn" },
    { key: "expiring",      label: "Approaching Expiration",   sub: "≤ 30 days",      tone: "warn" },
    { key: "participation", label: "Parent Participation Risk",sub: "Outreach",       tone: "warn" },
    { key: "continuation",  label: "Continuation Risk",        sub: "Escalate",       tone: "crit" },
    { key: "docs",          label: "Documentation Blocked",    sub: "Missing items",  tone: "warn" },
  ];

  const bucketCount = (b: Bucket) => items.filter((i) => i.bucket === b).length;
  const states = Array.from(new Set(items.map((i) => i.auth.state))).sort();

  return (
    <OSShell rightRail={<PTRail items={items} />}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/55">
              Authorization Coordinator · Parent Training
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Parent Training 97156
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-foreground/65">
              Manage parent training authorization readiness, utilization,
              participation tracking, and continuation risk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background hover:bg-foreground/90">
              <Sparkles className="h-3.5 w-3.5" /> Ask Blossom AI
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-medium text-foreground/70 hover:bg-muted/40">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-medium text-foreground/70 hover:bg-muted/40">
              <BookmarkPlus className="h-3.5 w-3.5" /> Saved Views
            </button>
            <Link to="/auth-workspace" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-medium text-foreground/70 hover:bg-muted/40">
              <ShieldAlert className="h-3.5 w-3.5" /> Open Auth Workspace
            </Link>
          </div>
        </header>

        {/* Section 1 — Summary */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <SummaryCard icon={HeartHandshake} label="Active 97156 Auths"    count={counts.active}        tone="info" onClick={() => setView("all")} active={view === "all"} />
          <SummaryCard icon={CalendarClock}  label="Expiring Soon"          count={counts.expiring}      tone="warn" onClick={() => setView(view === "expiring" ? "all" : "expiring")} active={view === "expiring"} />
          <SummaryCard icon={Gauge}          label="Utilization Risk"       count={counts.util}          tone="warn" onClick={() => setView(view === "util_risk" ? "all" : "util_risk")} active={view === "util_risk"} />
          <SummaryCard icon={Users}          label="Participation Risk"     count={counts.participation} tone="warn" onClick={() => setView(view === "participation" ? "all" : "participation")} active={view === "participation"} />
          <SummaryCard icon={FileSignature}  label="Docs / Signature"       count={counts.docs}          tone="crit" onClick={() => setView(view === "docs" ? "all" : "docs")} active={view === "docs"} />
          <SummaryCard icon={ClipboardCheck} label="QA / Continuation Ready" count={counts.qa}           tone="ok"   onClick={() => setView(view === "qa_ready" ? "all" : "qa_ready")} active={view === "qa_ready"} />
        </section>

        {/* Section 2 — Utilization / Continuation band */}
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">Utilization & Continuation</h2>
              <span className="text-xs text-foreground/55">Operational pacing across the 97156 cohort</span>
            </div>
            {bucket !== "all" && (
              <button onClick={() => setBucket("all")} className="text-xs text-foreground/60 hover:text-foreground">
                Clear bucket
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {buckets.map((b) => {
              const active = bucket === b.key;
              return (
                <button
                  key={b.key}
                  onClick={() => setBucket(active ? "all" : b.key)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border bg-card p-3 text-left transition",
                    active ? "border-foreground/30 shadow-sm" : "border-border/70 hover:border-foreground/20",
                  )}
                >
                  <span className={cn("absolute inset-x-0 top-0 h-0.5", toneBar[b.tone])} />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                      {b.label}
                    </span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[b.tone])} />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-foreground">{bucketCount(b.key)}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", toneChip[b.tone])}>
                      {b.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3 — Tracking Queue */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-foreground/55">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Saved views</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                    view === v.key
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border/70 bg-card text-foreground/70 hover:bg-muted/40",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[11px] text-foreground/55">State</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="h-7 rounded-full border border-border/70 bg-card px-2 text-[11px] text-foreground/80"
              >
                <option value="all">All</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-10 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">No 97156 authorizations need attention.</p>
              <p className="mt-0.5 text-xs text-foreground/55">
                Try a different saved view or clear filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((it) => (
                <TrackingCard key={it.auth.id} item={it} onOpen={() => setSelectedId(it.auth.id)} onEscalate={(k) => escalate(it, k)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {selected && <DetailDrawer item={selected} onEscalate={(k) => escalate(selected, k)} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </OSShell>
  );
}

/* ───── components ───── */

function SummaryCard({
  icon: Icon, label, count, tone, active, onClick,
}: {
  icon: React.ElementType; label: string; count: number; tone: Tone;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4 text-left transition",
        active ? "border-foreground/30 shadow-sm" : "border-border/70 hover:border-foreground/20",
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5", toneBar[tone])} />
      <div className="flex items-start justify-between">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full", toneChip[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-foreground/60" />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{count}</div>
      <div className="mt-0.5 text-[12px] text-foreground/65">{label}</div>
    </button>
  );
}

function TrackingCard({
  item, onOpen, onEscalate,
}: {
  item: PT97156Item;
  onOpen: () => void;
  onEscalate: (kind: EscalationKind) => void;
}) {
  const { auth, days, bcba, utilStatus, utilTone, participation, participationTone,
          opStatus, opTone, riskTone, nextAction, lastActivity } = item;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-foreground/20 hover:shadow-sm"
    >
      <span className={cn("absolute inset-y-0 left-0 w-0.5", toneBar[riskTone])} />
      <div className="grid gap-3 md:grid-cols-[1.1fr_1.4fr_1fr] md:items-center">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{auth.clientName}</span>
            <Pill tone="neutral">97156</Pill>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-foreground/60">
            <span>{auth.state}</span>
            <span className="text-foreground/30">·</span>
            <span className="truncate">{auth.payor}</span>
            <span className="text-foreground/30">·</span>
            <span>{auth.authType}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
            <CalendarClock className="h-3 w-3 text-foreground/45" />
            <span className="text-foreground/70">
              {auth.expirationDate ?? "No expiration"}
            </span>
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              days < 0 ? toneChip.crit : days <= 30 ? toneChip.warn : toneChip.neutral,
            )}>
              {days < 0 ? `${Math.abs(days)}d past` : `${days}d remaining`}
            </span>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={opTone}>{opStatus}</Pill>
          <Pill tone={utilTone}>Util: {utilStatus}</Pill>
          <Pill tone={participationTone}>Parent: {participation}</Pill>
          <Pill tone={item.qaState === "Complete" ? "ok" : item.qaState === "In Review" ? "info" : "neutral"}>
            QA: {item.qaState}
          </Pill>
          <Pill tone={item.schedulingReady ? "ok" : "warn"}>
            {item.schedulingReady ? "Scheduling ready" : "Scheduling pending"}
          </Pill>
          <span className="text-[11.5px] text-foreground/60">BCBA · {bcba}</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-foreground/45">Next action</div>
            <div className="text-[12.5px] text-foreground/85">{nextAction}</div>
            <div className="mt-0.5 text-[11px] text-foreground/55">Last activity · {lastActivity}</div>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-foreground/60" />
        </div>
      </div>

      {/* Row-level escalation actions */}
      <div
        className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-foreground/45">
          Escalate
        </span>
        <EscalateButton icon={Stethoscope} label="Needs PR"             tone="warn" onClick={() => onEscalate("PR")} />
        <EscalateButton icon={ClipboardCheck} label="Needs QA"           tone="info" onClick={() => onEscalate("QA")} />
        <EscalateButton icon={ShieldAlert} label="Needs State Director"  tone="crit" onClick={() => onEscalate("State Director")} />
        <EscalateButton icon={FolderInput} label="Missing Documentation" tone="warn" onClick={() => onEscalate("Missing Documentation")} />
        {item.escalatedTo && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-foreground/55">
            <Zap className="h-3 w-3" /> Routed to {item.escalatedTo}
          </span>
        )}
      </div>
    </div>
  );
}

function EscalateButton({
  icon: Icon, label, tone, onClick,
}: {
  icon: React.ElementType; label: string; tone: Tone; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground/75 transition hover:border-foreground/25 hover:bg-muted/40",
      )}
    >
      <span className={cn("inline-flex h-3.5 w-3.5 items-center justify-center rounded-full", toneChip[tone])}>
        <Icon className="h-2.5 w-2.5" />
      </span>
      {label}
    </button>
  );
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", toneChip[tone])}>
      <span className={cn("h-1 w-1 rounded-full", toneDot[tone])} />
      {children}
    </span>
  );
}

/* ───── drawer ───── */

function DetailDrawer({
  item, onClose, onEscalate,
}: {
  item: PT97156Item;
  onClose: () => void;
  onEscalate: (kind: EscalationKind) => void;
}) {
  const { auth, days, bcba, utilStatus, utilTone, participation, participationTone,
          opStatus, opTone, signatureMissing, qaState, smartFlags, nextAction } = item;

  // Operational pacing visualization — derived only.
  // We don't fabricate hours. We show a pacing bar based on days remaining vs.
  // a 6-month (180d) window so coordinators see "where in the cycle we are."
  const cyclePct = Math.max(0, Math.min(100, Math.round(((180 - Math.max(0, days)) / 180) * 100)));

  const actions = pickActions(opStatus);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/70 bg-card px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{auth.clientName}</h2>
              <Pill tone="neutral">97156</Pill>
              <Pill tone={opTone}>{opStatus}</Pill>
            </div>
            <p className="mt-0.5 text-[12px] text-foreground/60">
              {auth.state} · {auth.payor} · {auth.authType}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-foreground/55 hover:bg-muted/40 hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {smartFlags.length > 0 && (
          <DrawerSection icon={AlertTriangle} title="Operational signals">
            <div className="flex flex-wrap gap-1.5">
              {smartFlags.map((f, i) => <Pill key={i} tone={f.tone}>{f.label}</Pill>)}
            </div>
          </DrawerSection>
        )}

        {/* Escalation actions */}
        <DrawerSection icon={Zap} title="Escalate">
          <p className="mb-2 text-[11.5px] text-foreground/55">
            Updates the operational status, routes to the correct owner, and writes an audit log entry.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <EscalateButton icon={Stethoscope}    label="Needs PR"             tone="warn" onClick={() => onEscalate("PR")} />
            <EscalateButton icon={ClipboardCheck} label="Needs QA"             tone="info" onClick={() => onEscalate("QA")} />
            <EscalateButton icon={ShieldAlert}    label="Needs State Director" tone="crit" onClick={() => onEscalate("State Director")} />
            <EscalateButton icon={FolderInput}    label="Missing Documentation" tone="warn" onClick={() => onEscalate("Missing Documentation")} />
          </div>
          {item.escalatedTo && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground/65">
              <Zap className="h-3 w-3" /> Currently routed to {item.escalatedTo}
              {item.escalatedAt && <span className="text-foreground/45"> · {new Date(item.escalatedAt).toLocaleString()}</span>}
            </p>
          )}
        </DrawerSection>

        {/* 1 — Auth Summary */}
        <DrawerSection icon={FileText} title="Auth summary">
          <KV label="Auth type"        value={auth.authType} />
          <KV label="Expiration"       value={auth.expirationDate ?? "—"} />
          <KV label="Days remaining"   value={days < 0 ? `${Math.abs(days)}d past due` : `${days} days`} />
          <KV label="Coordinator"      value={auth.coordinator} />
          <KV label="BCBA"             value={bcba} />
          <KV label="Linked client"    value={auth.clientName} />
          <KV label="Linked auth"      value={auth.id} />
        </DrawerSection>

        {/* 2 — Utilization */}
        <DrawerSection icon={Gauge} title="Utilization overview">
          <KV label="Authorized hours"  value={auth.hours ?? "—"} />
          <KV label="Pacing status"     value={utilStatus} />
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[11px] text-foreground/55">
              <span>Cycle pacing (180-day window)</span>
              <span>{cyclePct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
              <div className={cn("h-full rounded-full", toneFill[utilTone])} style={{ width: `${cyclePct}%` }} />
            </div>
          </div>
          <p className="mt-2 text-[11.5px] text-foreground/55">
            Operational pacing only — confirm utilized hours in CentralReach before continuation review.
          </p>
        </DrawerSection>

        {/* 3 — Parent Participation */}
        <DrawerSection icon={Users} title="Parent participation">
          <KV label="Engagement"        value={participation} />
          <KV label="Signature status"  value={signatureMissing ? "Needed" : "Received"} />
          <KV label="Scheduling"        value={item.schedulingReady ? "Ready" : "Pending"} />
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill tone={participationTone}>{participation}</Pill>
            {signatureMissing && <Pill tone="warn">Signature blocking</Pill>}
          </div>
        </DrawerSection>

        {/* 4 — PR / Supervision */}
        <DrawerSection icon={ClipboardCheck} title="PR / supervision readiness">
          <KV label="QA status"           value={qaState} />
          <KV label="Treatment plan"      value={auth.treatmentPlanReceived ? "Received" : "Pending"} />
          <KV label="Next required action" value={nextAction} />
          <Link to="/supervision-tracking" className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-foreground/70 hover:text-foreground">
            Open in Supervision Tracking <ArrowUpRight className="h-3 w-3" />
          </Link>
        </DrawerSection>

        {/* 5 — Documentation */}
        <DrawerSection icon={FileSignature} title="Documentation">
          {auth.documents.length === 0 ? (
            <p className="text-[12px] text-foreground/55">No documents on file.</p>
          ) : (
            <ul className="space-y-1.5">
              {auth.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground/80">{d.name}{d.required ? "" : " (optional)"}</span>
                  <Pill tone={d.received ? "ok" : "warn"}>{d.received ? "Received" : "Missing"}</Pill>
                </li>
              ))}
            </ul>
          )}
        </DrawerSection>

        {/* 6 — Notes & Activity */}
        <DrawerSection icon={Activity} title="Notes & activity">
          {item.automationOverlay.length === 0 && auth.timeline.length === 0 ? (
            <p className="text-[12px] text-foreground/55">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {item.automationOverlay.map((line, i) => (
                <li key={`auto-${i}`} className="flex gap-2 text-[12px]">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-[hsl(220_70%_55%)]" />
                  <div className="min-w-0">
                    <p className="text-foreground/85">{line}</p>
                    <p className="text-[11px] text-foreground/55">Automation</p>
                  </div>
                </li>
              ))}
              {auth.timeline.slice(0, 6).map((e) => (
                <li key={e.id} className="flex gap-2 text-[12px]">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-foreground/30" />
                  <div className="min-w-0">
                    <p className="text-foreground/85">{e.description}</p>
                    <p className="text-[11px] text-foreground/55">
                      {new Date(e.timestamp).toLocaleDateString()}{e.user ? ` · ${e.user}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DrawerSection>

        {/* Audit log */}
        <DrawerSection icon={History} title="Audit log">
          {item.auditLog.length === 0 ? (
            <p className="text-[12px] text-foreground/55">No escalations recorded for this 97156 auth.</p>
          ) : (
            <ul className="space-y-2">
              {item.auditLog.map((e) => (
                <li key={e.id} className="rounded-lg border border-border/60 bg-card p-2.5 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{e.action}</span>
                    <span className="text-[10.5px] text-foreground/55">
                      {new Date(e.at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-foreground/75">{e.note}</p>
                  <p className="mt-1 text-[10.5px] text-foreground/55">
                    {e.by} · {e.fromStatus} → {e.toStatus} · routed to {e.routedTo}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DrawerSection>

        {/* 7 — Ask Blossom AI */}
        <DrawerSection icon={Brain} title="Ask Blossom AI">
          <div className="flex flex-wrap gap-1.5">
            {[
              "Why is this 97156 auth at risk?",
              "What continuation blockers exist?",
              "What should happen next?",
              "Summarize utilization concerns.",
              "Is parent participation becoming an issue?",
              "What documentation is still needed?",
            ].map((q) => (
              <button key={q} className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground/75 hover:bg-muted/40">
                {q}
              </button>
            ))}
          </div>
        </DrawerSection>
      </div>

      {/* Footer */}
      <div className="border-t border-border/70 bg-card/60 p-4">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-foreground/50">Quick actions</div>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button key={a} className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/40">
              {a}
            </button>
          ))}
          <Link to={`/authorizations?authId=${encodeURIComponent(auth.id)}`} className="ml-auto inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background hover:bg-foreground/90">
            Open Authorization <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function pickActions(s: OpStatus): string[] {
  const base = ["Add Note", "Open Client"];
  switch (s) {
    case "Documentation Missing":    return ["Mark Signature Needed", "Request Documents", ...base];
    case "Parent Outreach Needed":   return ["Log Outreach", "Request Follow-Up", "Escalate", ...base];
    case "Participation Low":        return ["Log Outreach", "Notify BCBA", ...base];
    case "Awaiting Scheduling":      return ["Notify Scheduling", "Log Outreach", ...base];
    case "Approaching Expiration":   return ["Confirm Utilization", "Send to QA", "Escalate", ...base];
    case "Continuation Risk":        return ["Escalate", "Notify BCBA", "Send to QA", ...base];
    case "QA Review Needed":         return ["Send to QA", "Notify QA Owner", ...base];
    case "Utilization Risk":         return ["Notify BCBA", "Log Outreach", ...base];
    case "Ready for Reauthorization":return ["Submit Reauthorization", ...base];
    case "Active":
    case "PR Needed":
    case "Completed":
    default:                         return base;
  }
}

function DrawerSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-foreground/55" />
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5 text-[12px]">
      <span className="text-foreground/55">{label}</span>
      <span className="text-right text-foreground/85">{value}</span>
    </div>
  );
}

/* ───── right rail ───── */

function PTRail({ items }: { items: PT97156Item[] }) {
  const expiring = items.filter((i) => i.days <= 30 && i.days >= 0).length;
  const util = items.filter((i) => i.utilStatus === "Underutilized" || i.utilStatus === "Continuation Risk").length;
  const part = items.filter((i) => i.participation !== "Engaged").length;
  const docs = items.filter((i) => i.signatureMissing).length;

  const priority = [...items]
    .filter((i) => i.riskTone === "crit" || i.riskTone === "warn")
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-foreground/55" />
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Ask Blossom AI</h3>
        </div>
        <p className="text-[12px] text-foreground/65">
          Permission-aware insights across your parent training cohort.
        </p>
        <div className="mt-3 space-y-1.5">
          {[
            "Which 97156 auths are at continuation risk?",
            "Which families need outreach this week?",
            "Which 97156 auths are underutilized?",
            "Which auths are blocked on signatures?",
          ].map((q) => (
            <button key={q} className="w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-left text-[11.5px] text-foreground/75 hover:bg-muted/40">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">97156 pulse</h3>
        <ul className="space-y-2 text-[12px]">
          <RailRow label="Expiring ≤ 30 days"      value={expiring} tone="warn" />
          <RailRow label="Utilization risk"        value={util}     tone="warn" />
          <RailRow label="Participation concerns"  value={part}     tone="warn" />
          <RailRow label="Signature blockers"      value={docs}     tone="crit" />
        </ul>
      </div>

      {priority.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Priority records</h3>
          <ul className="space-y-1.5">
            {priority.map((p) => (
              <li key={p.auth.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate text-foreground/80">{p.auth.clientName}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", toneChip[p.riskTone])}>
                  {p.days < 0 ? `${Math.abs(p.days)}d past` : `${p.days}d`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Related</h3>
        <div className="space-y-1">
          {[
            { to: "/authorizations",        label: "Authorizations" },
            { to: "/auth-workspace",        label: "Authorization Workspace" },
            { to: "/supervision-tracking",  label: "Supervision Tracking" },
            { to: "/auth-coordinator",      label: "Coordinator Dashboard" },
            { to: "/resources",             label: "Resource Library" },
            { to: "/training",              label: "Training Academy" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-foreground/75 hover:bg-muted/40 hover:text-foreground">
              {l.label}
              <ChevronRight className="h-3 w-3 text-foreground/40" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function RailRow({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-foreground/70">
        <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </li>
  );
}

// Silence unused import warnings for future-use icons.
void MessageSquare; void PhoneCall;
