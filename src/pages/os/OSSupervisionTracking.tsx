import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Download, BookmarkPlus, ShieldAlert, FileText, UserCheck,
  FileSignature, ClipboardCheck, ChevronRight, X, AlertTriangle,
  CalendarClock, MapPin, Users, MessageSquare, Brain, ArrowUpRight,
  CheckCircle2, Stamp, Activity, ListFilter,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { daysUntil, type Authorization } from "@/data/authorizations";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { cn } from "@/lib/utils";

/* ───── tone palette (matches Auth Workspace) ───── */
type Tone = "ok" | "info" | "warn" | "crit" | "neutral";
const toneChip: Record<Tone, string> = {
  ok:      "bg-[hsl(150_60%_94%)] text-[hsl(155_50%_32%)]",
  info:    "bg-[hsl(220_80%_96%)] text-[hsl(220_60%_42%)]",
  warn:    "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_40%)]",
  crit:    "bg-[hsl(355_90%_96%)] text-[hsl(355_65%_48%)]",
  neutral: "bg-foreground/[0.05] text-foreground/65",
};
const toneDot: Record<Tone, string> = {
  ok:      "bg-[hsl(155_55%_48%)]",
  info:    "bg-[hsl(220_70%_55%)]",
  warn:    "bg-[hsl(35_85%_52%)]",
  crit:    "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/30",
};
const toneBar: Record<Tone, string> = {
  ok:      "bg-[hsl(155_55%_48%)]",
  info:    "bg-[hsl(220_70%_55%)]",
  warn:    "bg-[hsl(35_85%_52%)]",
  crit:    "bg-[hsl(355_70%_55%)]",
  neutral: "bg-foreground/15",
};

/* ───── derived supervision/PR model from existing auth data ───── */

type PRStatus =
  | "PR Needed" | "Requested from BCBA" | "BCBA Follow-Up Needed"
  | "PR Received" | "Parent Signature Needed" | "Sent to QA"
  | "QA Reviewing" | "Ready for Auth Submission" | "Completed";

type EscStage =
  | "Not Yet Due" | "9-Week Outreach" | "Weekly Follow-Up"
  | "6-Week Escalation" | "State Director Involved"
  | "Parent Signature Support" | "QA Review" | "Ready for Submission" | "Completed";

type Bucket = "past" | "0-2" | "3-6" | "6-9" | "9+";

interface SupItem {
  auth: Authorization;
  days: number;
  bucket: Bucket;
  bcba: string;
  prStatus: PRStatus;
  prTone: Tone;
  escStage: EscStage;
  escTone: Tone;
  parentSig: boolean;        // true = signature blocking
  qaState: "Not Started" | "In Review" | "Complete";
  riskTone: Tone;
  ownerLabel: string;        // outreach owner
  escalationLabel: string;   // who is involved at 6-week
  nextAction: string;
  lastContact: string;
  smartFlags: { label: string; tone: Tone }[];
}

function bucketOf(days: number): Bucket {
  if (days < 0) return "past";
  if (days <= 14) return "0-2";
  if (days <= 42) return "3-6";
  if (days <= 63) return "6-9";
  return "9+";
}

/** Derive a supervision tracking item from one Authorization. */
function deriveItem(a: Authorization): SupItem | null {
  // Supervision tracking is only meaningful for cycles with an expiration / approved auths.
  const d = daysUntil(a.expirationDate);
  if (d === null) return null;

  const bucket = bucketOf(d);
  const bcba = a.qaOwner ?? "Unassigned BCBA";
  const parentSigDoc = a.documents.find((x) =>
    /signature|consent/i.test(x.name),
  );
  const parentSigMissing = parentSigDoc ? !parentSigDoc.received : false;

  // Derive PR status from existing fields.
  let prStatus: PRStatus;
  let prTone: Tone = "warn";
  if (a.stage === "Approved" && d > 63) {
    prStatus = "PR Needed";
    prTone = "neutral";
  } else if (a.stage === "Approved" && d > 42) {
    prStatus = "Requested from BCBA";
    prTone = "info";
  } else if (a.stage === "Approved" && d > 0 && !a.treatmentPlanReceived) {
    prStatus = "BCBA Follow-Up Needed";
    prTone = "crit";
  } else if (parentSigMissing) {
    prStatus = "Parent Signature Needed";
    prTone = "warn";
  } else if (a.qaStatus === "In Review") {
    prStatus = "QA Reviewing";
    prTone = "info";
  } else if (a.qaStatus === "Complete" && a.stage !== "Approved") {
    prStatus = "Ready for Auth Submission";
    prTone = "ok";
  } else if (a.treatmentPlanReceived && a.qaStatus === "Not Started") {
    prStatus = "Sent to QA";
    prTone = "info";
  } else if (d < 0) {
    prStatus = "BCBA Follow-Up Needed";
    prTone = "crit";
  } else {
    prStatus = "PR Received";
    prTone = "ok";
  }

  // Escalation stage tracks the 9-week / 6-week operational windows.
  let escStage: EscStage = "Not Yet Due";
  let escTone: Tone = "neutral";
  if (prStatus === "Ready for Auth Submission") {
    escStage = "Ready for Submission"; escTone = "ok";
  } else if (prStatus === "QA Reviewing" || prStatus === "Sent to QA") {
    escStage = "QA Review"; escTone = "info";
  } else if (parentSigMissing) {
    escStage = "Parent Signature Support"; escTone = "warn";
  } else if (d < 0) {
    escStage = "State Director Involved"; escTone = "crit";
  } else if (d <= 42) {
    escStage = "6-Week Escalation"; escTone = "crit";
  } else if (d <= 63) {
    escStage = "9-Week Outreach"; escTone = "warn";
  } else if (d <= 90) {
    escStage = "Weekly Follow-Up"; escTone = "info";
  }

  // State-specific owner mapping.
  const isGA = a.state === "GA";
  const ownerLabel = isGA ? "Rivky Weissman" : "Rikki Wallach";
  const escalationLabel = isGA
    ? "Shira & Rachel (6-week)"
    : "State Director (6-week)";

  // Risk tone.
  const riskTone: Tone =
    d < 0 || d <= 14 ? "crit" :
    d <= 42 ? "warn" :
    d <= 63 ? "info" : "ok";

  // Smart flags.
  const smartFlags: { label: string; tone: Tone }[] = [];
  if (prStatus === "PR Needed") smartFlags.push({ label: "PR not requested yet", tone: "warn" });
  if (prStatus === "BCBA Follow-Up Needed") smartFlags.push({ label: "BCBA follow-up overdue", tone: "crit" });
  if (d <= 42 && d > 0 && prStatus !== "Ready for Auth Submission") smartFlags.push({ label: "Escalation window reached", tone: "crit" });
  if (parentSigMissing) smartFlags.push({ label: "Parent signature blocking submission", tone: "warn" });
  if (a.qaStatus === "In Review") smartFlags.push({ label: "QA review pending", tone: "info" });
  if (d <= 14) smartFlags.push({ label: "Auth expiration risk increasing", tone: "crit" });

  const nextAction =
    prStatus === "PR Needed" ? `Request PR from ${bcba}` :
    prStatus === "Requested from BCBA" ? `Confirm receipt with ${bcba}` :
    prStatus === "BCBA Follow-Up Needed" ? `Escalate to ${escalationLabel}` :
    prStatus === "Parent Signature Needed" ? "Coordinate parent signature with BCBA" :
    prStatus === "Sent to QA" ? "Awaiting Julianne / QA pickup" :
    prStatus === "QA Reviewing" ? "Awaiting QA sign-off" :
    prStatus === "Ready for Auth Submission" ? "Submit reauthorization" :
    "Monitor";

  // Last contact: use lastActivity as a proxy.
  const lastContact = a.lastActivity;

  return {
    auth: a, days: d, bucket, bcba,
    prStatus, prTone, escStage, escTone,
    parentSig: parentSigMissing,
    qaState: a.qaStatus, riskTone,
    ownerLabel, escalationLabel,
    nextAction, lastContact, smartFlags,
  };
}

/* ───── saved views ───── */
type ViewKey =
  | "all" | "follow_up" | "9week" | "6week" | "parent_sig"
  | "qa_ready" | "past_due" | "ga" | "mid_atl" | "md" | "mine";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "all",        label: "All Supervision Tracking" },
  { key: "follow_up",  label: "Needs BCBA Follow-Up" },
  { key: "9week",      label: "9-Week Outreach" },
  { key: "6week",      label: "6-Week Escalation" },
  { key: "parent_sig", label: "Parent Signature Needed" },
  { key: "qa_ready",   label: "QA Ready" },
  { key: "past_due",   label: "Past Due" },
  { key: "ga",         label: "Georgia" },
  { key: "mid_atl",    label: "NC / TN / VA" },
  { key: "md",         label: "Maryland" },
  { key: "mine",       label: "Assigned to Me" },
];

/* ───── page ───── */

export default function OSSupervisionTracking() {
  const live = useLiveAuthorizations();
  const items = useMemo<SupItem[]>(
    () => live.items.map(deriveItem).filter((x): x is SupItem => x !== null),
    [live.items],
  );

  const [view, setView] = useState<ViewKey>("all");
  const [bucket, setBucket] = useState<Bucket | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selected, setSelected] = useState<SupItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (stateFilter !== "all" && it.auth.state !== stateFilter) return false;
      if (bucket !== "all" && it.bucket !== bucket) return false;
      switch (view) {
        case "follow_up":  return it.prStatus === "BCBA Follow-Up Needed";
        case "9week":      return it.escStage === "9-Week Outreach";
        case "6week":      return it.escStage === "6-Week Escalation";
        case "parent_sig": return it.parentSig;
        case "qa_ready":   return it.prStatus === "Ready for Auth Submission" || it.qaState === "Complete";
        case "past_due":   return it.days < 0;
        case "ga":         return it.auth.state === "GA";
        case "mid_atl":    return ["NC", "TN", "VA"].includes(it.auth.state);
        case "md":         return it.auth.state === "MD";
        case "mine":       return it.auth.coordinator === "Priya K.";
        default:           return true;
      }
    }).sort((a, b) => a.days - b.days);
  }, [items, view, bucket, stateFilter]);

  // Summary counts.
  const counts = useMemo(() => ({
    pr:      items.filter((i) => i.prStatus === "PR Needed").length,
    follow:  items.filter((i) => i.prStatus === "BCBA Follow-Up Needed").length,
    esc:     items.filter((i) => i.escStage === "6-Week Escalation" || i.escStage === "State Director Involved").length,
    parent:  items.filter((i) => i.parentSig).length,
    qa:      items.filter((i) => i.prStatus === "Ready for Auth Submission" || i.qaState === "Complete").length,
  }), [items]);

  const buckets: { key: Bucket; label: string; sub: string; tone: Tone }[] = [
    { key: "past", label: "Past Due",    sub: "Critical",        tone: "crit" },
    { key: "0-2",  label: "0 – 2 Weeks", sub: "Critical",        tone: "crit" },
    { key: "3-6",  label: "3 – 6 Weeks", sub: "Escalate",        tone: "warn" },
    { key: "6-9",  label: "6 – 9 Weeks", sub: "Start Outreach",  tone: "info" },
    { key: "9+",   label: "9+ Weeks",    sub: "Monitor Weekly",  tone: "neutral" },
  ];

  const bucketCount = (b: Bucket) => items.filter((i) => i.bucket === b).length;

  const states = Array.from(new Set(items.map((i) => i.auth.state))).sort();

  return (
    <OSShell rightRail={<SupervisionRail items={items} />}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/55">
              Authorization Coordinator · Operations
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Supervision Tracking
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-foreground/65">
              Track progress reports, BCBA follow-up, parent signatures, and escalation
              readiness before authorizations are delayed.
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
              <ShieldAlert className="h-3.5 w-3.5" /> Open Auth Risk Center
            </Link>
          </div>
        </header>

        {/* Section 1 — Summary */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryCard icon={FileText}        label="PRs Needed"             count={counts.pr}     tone="warn"
            active={view === "all" && counts.pr > 0 && false} onClick={() => setView("all")} />
          <SummaryCard icon={UserCheck}       label="BCBA Follow-Up Needed"  count={counts.follow} tone="crit"
            active={view === "follow_up"}  onClick={() => setView(view === "follow_up"  ? "all" : "follow_up")} />
          <SummaryCard icon={AlertTriangle}   label="Escalation Needed"      count={counts.esc}    tone="crit"
            active={view === "6week"}      onClick={() => setView(view === "6week"      ? "all" : "6week")} />
          <SummaryCard icon={FileSignature}   label="Parent Signature Needed" count={counts.parent} tone="warn"
            active={view === "parent_sig"} onClick={() => setView(view === "parent_sig" ? "all" : "parent_sig")} />
          <SummaryCard icon={ClipboardCheck}  label="QA Ready"               count={counts.qa}     tone="ok"
            active={view === "qa_ready"}   onClick={() => setView(view === "qa_ready"   ? "all" : "qa_ready")} />
        </section>

        {/* Section 2 — Escalation timeline */}
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">Escalation Timeline</h2>
              <span className="text-xs text-foreground/55">9-week outreach · 6-week escalation</span>
            </div>
            {bucket !== "all" && (
              <button onClick={() => setBucket("all")} className="text-xs text-foreground/60 hover:text-foreground">
                Clear window
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
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

        {/* Section 3 — Queue */}
        <section className="space-y-3">
          {/* Filter bar */}
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

          {/* Tracking cards */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-10 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-foreground/40" />
              <p className="mt-2 text-sm font-medium text-foreground">No supervision items in this view.</p>
              <p className="mt-0.5 text-xs text-foreground/55">
                You're caught up — try a different saved view or window.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((it) => (
                <TrackingCard key={it.auth.id} item={it} onOpen={() => setSelected(it)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
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

function TrackingCard({ item, onOpen }: { item: SupItem; onOpen: () => void }) {
  const { auth, days, bcba, prStatus, prTone, escStage, escTone, riskTone, ownerLabel, nextAction, lastContact, parentSig, qaState } = item;
  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-foreground/20 hover:shadow-sm"
    >
      <span className={cn("absolute inset-y-0 left-0 w-0.5", toneBar[riskTone])} />
      <div className="grid gap-3 md:grid-cols-[1.1fr_1.4fr_1fr] md:items-center">
        {/* LEFT — client/auth */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{auth.clientName}</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-foreground/60">
              <MapPin className="h-2.5 w-2.5" /> {auth.state}
            </span>
          </div>
          <div className="mt-1 truncate text-[11.5px] text-foreground/60">
            {auth.payor} · {auth.authType} · {auth.id}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11.5px]">
            <span className="text-foreground/55">Expires</span>
            <span className="font-medium text-foreground/85">{auth.expirationDate}</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", toneChip[riskTone])}>
              {days < 0 ? `${Math.abs(days)}d past` : `${days}d left`}
            </span>
          </div>
        </div>

        {/* CENTER — supervision status */}
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={prTone}>{prStatus}</Pill>
            <Pill tone={escTone}>{escStage}</Pill>
            {parentSig && <Pill tone="warn">Parent signature</Pill>}
            {qaState !== "Not Started" && <Pill tone={qaState === "Complete" ? "ok" : "info"}>QA · {qaState}</Pill>}
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-foreground/65">
            <Users className="h-3 w-3 text-foreground/40" />
            <span className="truncate">BCBA <span className="text-foreground/85">{bcba}</span></span>
            <span className="text-foreground/30">·</span>
            <span className="truncate">Outreach <span className="text-foreground/85">{ownerLabel}</span></span>
          </div>
        </div>

        {/* RIGHT — next action */}
        <div className="flex flex-col items-start gap-1 md:items-end">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", toneChip[riskTone])}>
            <span className={cn("h-1 w-1 rounded-full", toneDot[riskTone])} />
            {riskTone === "crit" ? "High risk" : riskTone === "warn" ? "Medium" : riskTone === "info" ? "Watch" : "On track"}
          </span>
          <div className="text-[11.5px] text-foreground/65">Last contact · <span className="text-foreground/85">{lastContact}</span></div>
          <div className="flex items-center gap-1 text-[11.5px] font-medium text-foreground">
            {nextAction}
            <ArrowUpRight className="h-3 w-3 text-foreground/50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", toneChip[tone])}>
      <span className={cn("h-1 w-1 rounded-full", toneDot[tone])} />
      {children}
    </span>
  );
}

/* ───── drawer ───── */

function DetailDrawer({ item, onClose }: { item: SupItem; onClose: () => void }) {
  const { auth, days, bcba, prStatus, prTone, escStage, escTone, parentSig, qaState, ownerLabel, escalationLabel, smartFlags, nextAction } = item;
  const isGA = auth.state === "GA";
  const path = isGA
    ? ["Rivky (9-week outreach)", "Shira & Rachel (6-week)"]
    : ["Rikki (9-week outreach + cc Julianne)", "BCBA follow-up", "State Director (6-week)", "QA / Julianne (PR received)"];

  // Actions visible per current PR status.
  const actions = pickActions(prStatus);

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{auth.clientName}</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-foreground/65">
              <MapPin className="h-2.5 w-2.5" /> {auth.state}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-foreground/60">{auth.payor} · {auth.authType} · {auth.id}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone={prTone}>{prStatus}</Pill>
            <Pill tone={escTone}>{escStage}</Pill>
            {parentSig && <Pill tone="warn">Parent signature</Pill>}
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-foreground/60 hover:bg-muted/40 hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* body */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Smart flags */}
        {smartFlags.length > 0 && (
          <DrawerSection icon={AlertTriangle} title="Operational signals">
            <div className="flex flex-wrap gap-1.5">
              {smartFlags.map((f, i) => <Pill key={i} tone={f.tone}>{f.label}</Pill>)}
            </div>
          </DrawerSection>
        )}

        {/* 1 — Client / Auth */}
        <DrawerSection icon={FileText} title="Client & Authorization">
          <KV label="Auth type"           value={auth.authType} />
          <KV label="Expiration"          value={auth.expirationDate ?? "—"} />
          <KV label="Days remaining"      value={days < 0 ? `${Math.abs(days)}d past due` : `${days} days`} />
          <KV label="Coordinator"         value={auth.coordinator} />
          <KV label="BCBA"                value={bcba} />
          <KV label="Outreach owner"      value={ownerLabel} />
          <KV label="Escalation owner"    value={escalationLabel} />
        </DrawerSection>

        {/* 2 — Supervision / PR */}
        <DrawerSection icon={ClipboardCheck} title="Supervision / PR status">
          <KV label="PR status"           value={prStatus} />
          <KV label="Parent signature"    value={parentSig ? "Needed" : "Received"} />
          <KV label="QA status"           value={qaState} />
          <KV label="Next required action" value={nextAction} />
        </DrawerSection>

        {/* 3 — Contact log (timeline as proxy) */}
        <DrawerSection icon={MessageSquare} title="Contact & follow-up log">
          <ul className="space-y-2">
            {auth.timeline.slice(0, 5).map((e) => (
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
        </DrawerSection>

        {/* 4 — Escalation path */}
        <DrawerSection icon={Stamp} title="Escalation path">
          <div className="space-y-1.5 text-[12px]">
            {path.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground/[0.06] text-[10px] font-medium text-foreground/70">{i + 1}</span>
                <span className="text-foreground/80">{p}</span>
              </div>
            ))}
          </div>
        </DrawerSection>

        {/* 5 — Documentation */}
        <DrawerSection icon={FileSignature} title="Documentation">
          <ul className="space-y-1.5">
            {auth.documents.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-[12px]">
                <span className="text-foreground/80">{d.name}</span>
                <Pill tone={d.received ? "ok" : "warn"}>{d.received ? "Received" : "Missing"}</Pill>
              </li>
            ))}
          </ul>
        </DrawerSection>

        {/* 6 — Notes / activity */}
        <DrawerSection icon={Activity} title="Notes & activity">
          <ul className="space-y-1 text-[12px] text-foreground/75">
            {auth.automationLog.map((l, i) => <li key={i}>• {l}</li>)}
          </ul>
        </DrawerSection>

        {/* 7 — Ask Blossom AI */}
        <DrawerSection icon={Brain} title="Ask Blossom AI">
          <div className="flex flex-wrap gap-1.5">
            {[
              "What is blocking this PR?",
              "Who needs to be followed up with?",
              "Is this ready for QA?",
              "What is the next escalation step?",
              "Summarize this tracking item.",
            ].map((q) => (
              <button key={q} className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground/75 hover:bg-muted/40">
                {q}
              </button>
            ))}
          </div>
        </DrawerSection>
      </div>

      {/* footer actions */}
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

function pickActions(s: PRStatus): string[] {
  const base = ["Add Note", "Open Authorization"];
  switch (s) {
    case "PR Needed":              return ["Mark PR Requested", "Log BCBA Follow-Up", ...base];
    case "Requested from BCBA":    return ["Log BCBA Follow-Up", "Mark PR Received", "Escalate to State Director", ...base];
    case "BCBA Follow-Up Needed":  return ["Escalate to State Director", "Log BCBA Follow-Up", ...base];
    case "PR Received":            return ["Mark Parent Signature Needed", "Mark Sent to QA", ...base];
    case "Parent Signature Needed":return ["Log BCBA Follow-Up", "Mark Sent to QA", ...base];
    case "Sent to QA":             return ["Mark QA Ready", ...base];
    case "QA Reviewing":           return ["Mark QA Ready", ...base];
    case "Ready for Auth Submission":
    case "Completed":              return base;
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

function SupervisionRail({ items }: { items: SupItem[] }) {
  const past = items.filter((i) => i.days < 0).length;
  const sixWeek = items.filter((i) => i.escStage === "6-Week Escalation").length;
  const parent = items.filter((i) => i.parentSig).length;
  const qa = items.filter((i) => i.prStatus === "Ready for Auth Submission").length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-foreground/55" />
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Ask Blossom AI</h3>
        </div>
        <p className="text-[12px] text-foreground/65">Permission-aware insights across your supervision queue.</p>
        <div className="mt-3 space-y-1.5">
          {[
            "Summarize my supervision risks today",
            "Which PRs need BCBA follow-up?",
            "Which cases need a State Director?",
            "Which auths are parent-signature blocked?",
          ].map((q) => (
            <button key={q} className="w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-left text-[11.5px] text-foreground/75 hover:bg-muted/40">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Supervision pulse</h3>
        <ul className="space-y-2 text-[12px]">
          <RailRow label="Past due" value={past} tone="crit" />
          <RailRow label="6-week escalation" value={sixWeek} tone="crit" />
          <RailRow label="Parent signature blockers" value={parent} tone="warn" />
          <RailRow label="Ready for submission" value={qa} tone="ok" />
        </ul>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-foreground/65">Related</h3>
        <div className="space-y-1">
          {[
            { to: "/authorizations", label: "Authorizations" },
            { to: "/auth-workspace", label: "Authorization Workspace" },
            { to: "/auth-coordinator", label: "Coordinator Dashboard" },
            { to: "/resources", label: "Resource Library" },
            { to: "/training", label: "Training Academy" },
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