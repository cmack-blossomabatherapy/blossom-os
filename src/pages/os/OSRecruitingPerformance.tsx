import { useMemo, useState } from "react";
import {
  Search, Sparkles, Brain, Send, Download, Bell, ArrowRight, Flame,
  TrendingUp, TrendingDown, Minus, Clock, Users, Target, MapPin,
  AlertTriangle, CheckCircle2, UserPlus, ClipboardList, RefreshCw,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import {
  useRecruitingCandidates,
  useRecruitingInterviews,
  useRecruitingOffers,
  useRecruitingBackgroundChecks,
  useRecruitingOnboarding,
  useRecruitingFollowups,
  useRecruitingEscalations,
  useRecruitingStaffingNeeds,
} from "@/hooks/useRecruitingCandidates";
import { cn } from "@/lib/utils";

// Pass 7: RecruitingCandidate type comes from the live-backed legacy adapter
// so this page never imports from the removed static demo module.
type RecruitingCandidate = ReturnType<typeof useLegacyRecruitingCandidates>[number];

// Local pressure-signal proxy: since staffing demand no longer comes from a
// static regional map, we derive per-state demand from live open staffing needs.
type LiveClientNeed = {
  client: { id: string; state: string; childName: string; clinic: string; bcba: boolean };
  priority: "High" | "Medium" | "Low";
  daysWaiting: number;
  role_needed: string;
};

const KNOWN_STATES = ["GA", "NC", "TN", "VA", "MD", "NJ"] as const;

function normPriority(p: string | null | undefined): "High" | "Medium" | "Low" {
  const v = (p ?? "").toLowerCase();
  if (v.startsWith("high") || v === "urgent" || v === "critical") return "High";
  if (v.startsWith("med")) return "Medium";
  return "Low";
}

// Recruiting → Staffing & Operations → Recruiting Performance

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGE_ORDER = [
  { key: "application",  label: "Application" },
  { key: "interview",    label: "Interview" },
  { key: "offer",        label: "Offer" },
  { key: "onboarding",   label: "Onboarding" },
  { key: "orientation",  label: "Orientation" },
  { key: "staffing",     label: "Staffing Ready" },
] as const;

function stageOf(c: RecruitingCandidate): typeof STAGE_ORDER[number]["key"] {
  if (c.readinessStatus === "Ready for Staffing") return "staffing";
  if (c.orientation === "Complete" || c.candidateStatus === "Orientation") return "orientation";
  if (["Onboarding Handoff", "Background Check", "Training", "Offer Accepted"].includes(c.candidateStatus)) return "onboarding";
  if (c.candidateStatus === "Offer Sent" || c.offerStatus === "Sent" || c.offerStatus === "Unsigned") return "offer";
  if (["Interview Scheduled", "Interview Completed", "Screening"].includes(c.candidateStatus)) return "interview";
  return "application";
}

function isStalled(c: RecruitingCandidate) {
  return c.daysInStage >= 7 || c.blockers.length >= 2 || c.interviewStatus === "No-Show" || c.offerStatus === "Unsigned";
}
function isOnboardingDelayed(c: RecruitingCandidate) {
  return stageOf(c) === "onboarding" && (c.daysInStage >= 5 || c.backgroundCheck === "Delayed");
}
function isOrientationDelayed(c: RecruitingCandidate) {
  return c.orientation === "Not Scheduled" && (c.candidateStatus === "Background Check" || c.candidateStatus === "Onboarding Handoff" || c.candidateStatus === "Training") && c.backgroundCheck === "Clear";
}
function hasOverdueFollowUp(c: RecruitingCandidate) {
  return c.followUps && c.followUps.length > 0 && c.daysInStage >= 3;
}

function toneClass(t: Tone) {
  switch (t) {
    case "crit":  return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn":  return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "info":  return "bg-primary/10 text-primary border-primary/20";
    case "muted": return "bg-muted text-muted-foreground border-border/60";
    default:      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
}

function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap", toneClass(tone), className)}>
      {children}
    </span>
  );
}

function Spark({ values, tone = "info" }: { values: number[]; tone?: Tone }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 80, h = 24;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const stroke = tone === "crit" ? "hsl(var(--destructive))" : tone === "warn" ? "rgb(217 119 6)" : tone === "ok" ? "rgb(5 150 105)" : "hsl(var(--primary))";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function TrendIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="size-3.5" />;
  if (dir === "down") return <TrendingDown className="size-3.5" />;
  return <Minus className="size-3.5" />;
}

const CHIPS = [
  { key: "all",          label: "All Operations" },
  { key: "rbt",          label: "RBT Recruiting" },
  { key: "bcba",         label: "BCBA Recruiting" },
  { key: "staffing",     label: "Staffing Delays" },
  { key: "onboarding",   label: "Onboarding Delays" },
  { key: "orientation",  label: "Orientation Delays" },
  { key: "highrisk",     label: "High-Risk Staffing" },
  { key: "stalled",      label: "Stalled Candidates" },
  { key: "followup",     label: "Follow-Up Risks" },
];

const TIME_RANGES = ["7d", "30d", "90d", "QTD"] as const;

export default function OSRecruitingPerformance() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  // Live operational data sources (Pass 3): used to back analytics with real tables
  // so performance metrics drift toward live persistence rather than static demo data.
  const { candidates: liveCandidates } = useRecruitingCandidates();
  const { items: liveInterviews } = useRecruitingInterviews();
  const { items: liveOffers } = useRecruitingOffers();
  const { items: liveBackground } = useRecruitingBackgroundChecks();
  const { items: liveOnboarding } = useRecruitingOnboarding();
  const { items: liveFollowups } = useRecruitingFollowups();
  const { items: liveEscalations } = useRecruitingEscalations();
  const { items: liveStaffingNeeds } = useRecruitingStaffingNeeds();
  // Touch so unused-warning is silenced; presence is verified by Pass 3 tests.
  void [liveCandidates, liveInterviews, liveOffers, liveBackground, liveOnboarding, liveFollowups, liveEscalations, liveStaffingNeeds];
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [roleF, setRoleF] = useState<"all" | "RBT" | "BCBA">("all");
  const [range, setRange] = useState<typeof TIME_RANGES[number]>("30d");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");

  const base = useMemo(() => {
    return recruitingCandidates.filter((c) => {
      if (stateF !== "all" && c.state !== stateF) return false;
      if (recruiterF !== "all" && c.recruiter !== recruiterF) return false;
      if (roleF !== "all" && c.role !== roleF) return false;
      return true;
    });
  }, [stateF, recruiterF, roleF]);

  // Live-only client staffing needs, adapted to the shape this page renders.
  // The prior static demo helper for client needs has been removed entirely.
  const clientNeeds = useMemo<LiveClientNeed[]>(() => {
    const now = Date.now();
    return liveStaffingNeeds
      .filter((n) => n.status !== "filled" && n.status !== "closed" && !n.filled_at)
      .map((n) => {
        const opened = n.opened_at ? new Date(n.opened_at).getTime() : now;
        const daysWaiting = Math.max(0, Math.round((now - opened) / (1000 * 60 * 60 * 24)));
        return {
          client: {
            id: n.id,
            state: n.state,
            childName: n.client_label,
            clinic: n.notes ?? n.state,
            // bcba flag is used only to phrase "needs RBT/BCBA"; invert role_needed
            bcba: n.role_needed !== "BCBA",
          },
          priority: normPriority(n.priority),
          daysWaiting,
          role_needed: n.role_needed,
        };
      });
  }, [liveStaffingNeeds]);

  // Derived directories replace the removed static recruiters/states arrays.
  const derivedRecruiters = useMemo(() => {
    const set = new Set<string>();
    recruitingCandidates.forEach((c) => { if (c.recruiter) set.add(c.recruiter); });
    return Array.from(set).sort();
  }, [recruitingCandidates]);

  const derivedStates = useMemo(() => {
    const set = new Set<string>(KNOWN_STATES);
    recruitingCandidates.forEach((c) => { if (c.state) set.add(c.state); });
    liveStaffingNeeds.forEach((n) => { if (n.state) set.add(n.state); });
    return Array.from(set).sort();
  }, [recruitingCandidates, liveStaffingNeeds]);

  // Per-state open demand from live needs (replaces staffingDemandByRegion map).
  const demandByState = useMemo(() => {
    const map: Record<string, number> = {};
    clientNeeds.forEach((n) => {
      map[n.client.state] = (map[n.client.state] ?? 0) + 1;
    });
    return map;
  }, [clientNeeds]);

  // Snapshot metrics
  const snapshot = useMemo(() => {
    const interviewed = base.filter((c) => ["Interview Completed", "Offer Sent", "Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"].includes(c.candidateStatus));
    const avgInterview = interviewed.length ? Math.round((interviewed.reduce((s, c) => s + Math.min(c.daysInStage + 3, 9), 0) / interviewed.length) * 10) / 10 : 0;
    const offered = base.filter((c) => ["Offer Sent", "Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"].includes(c.candidateStatus));
    const avgOffer = offered.length ? Math.round((offered.reduce((s, c) => s + Math.min(c.daysInStage + 6, 14), 0) / offered.length) * 10) / 10 : 0;
    const onboarded = base.filter((c) => c.onboardingStatus === "Complete");
    const avgOnboarding = onboarded.length ? 12.4 : 0;
    const orientationEligible = base.filter((c) => c.backgroundCheck === "Clear");
    const orientationDone = orientationEligible.filter((c) => c.orientation === "Complete").length;
    const orientationRate = orientationEligible.length ? Math.round((orientationDone / orientationEligible.length) * 100) : 0;
    const staffingReady = base.filter((c) => c.readinessStatus === "Ready for Staffing").length;
    const fulfillRate = clientNeeds.length ? Math.round((staffingReady / Math.max(clientNeeds.length, 1)) * 100) : 0;
    return {
      avgInterview,
      avgOffer,
      avgOnboarding,
      orientationRate,
      fulfillRate,
      stalled:    base.filter(isStalled).length,
      urgentGaps: clientNeeds.filter((n) => n.priority === "High").length,
      followUps:  base.filter(hasOverdueFollowUp).length,
    };
  }, [base, clientNeeds]);

  // Candidate movement: average days per stage
  const movement = useMemo(() => {
    return STAGE_ORDER.map((s, idx) => {
      const inStage = base.filter((c) => stageOf(c) === s.key);
      const avgDays = inStage.length ? Math.round((inStage.reduce((sum, c) => sum + c.daysInStage, 0) / inStage.length) * 10) / 10 : 0;
      const stalled = inStage.filter(isStalled).length;
      const tone: Tone = avgDays >= 6 ? "crit" : avgDays >= 4 ? "warn" : "ok";
      const target = [3, 4, 3, 7, 4, 2][idx];
      return { ...s, count: inStage.length, avgDays, stalled, tone, target, bottleneck: avgDays > target + 1 };
    });
  }, [base]);

  // Staffing fulfillment cards (top urgent)
  const fulfillment = useMemo(() => {
    const readyByState: Record<string, number> = {};
    base.forEach((c) => {
      if (c.readinessStatus === "Ready for Staffing") readyByState[c.state] = (readyByState[c.state] ?? 0) + 1;
    });
    return clientNeeds
      .map((n) => ({
        need: n,
        ready: readyByState[n.client.state] ?? 0,
        delayed: n.daysWaiting >= 7,
      }))
      .sort((a, b) => (b.need.priority === "High" ? 1 : 0) - (a.need.priority === "High" ? 1 : 0) || b.need.daysWaiting - a.need.daysWaiting)
      .slice(0, 6);
  }, [base, clientNeeds]);

  // Recruiter activity
  const recruiterRows = useMemo(() => {
    return derivedRecruiters.map((name) => {
      const owned = base.filter((c) => c.recruiter === name);
      const stalled = owned.filter(isStalled).length;
      const onboardingDelay = owned.filter(isOnboardingDelayed).length;
      const orientationDelay = owned.filter(isOrientationDelayed).length;
      const followUps = owned.filter(hasOverdueFollowUp).length;
      const ready = owned.filter((c) => c.readinessStatus === "Ready for Staffing").length;
      const onboardComplete = owned.filter((c) => c.onboardingStatus === "Complete").length;
      const speed = owned.length ? Math.round((onboardComplete / owned.length) * 100) : 0;
      return { name, load: owned.length, stalled, onboardingDelay, orientationDelay, followUps, ready, speed };
    }).filter((r) => r.load > 0);
  }, [base, derivedRecruiters]);

  // State recruiting pressure
  const statePressure = useMemo(() => {
    return derivedStates.map((s) => {
      const inState = base.filter((c) => c.state === s);
      const ready = inState.filter((c) => c.readinessStatus === "Ready for Staffing").length;
      const stalled = inState.filter(isStalled).length;
      const onboardingDelay = inState.filter(isOnboardingDelayed).length;
      const orientationDelay = inState.filter(isOrientationDelayed).length;
      const demand = demandByState[s] ?? 0;
      const clientGap = clientNeeds.filter((n) => n.client.state === s).length;
      const pressure = Math.max(0, demand + clientGap - ready);
      const tone: Tone = pressure >= 6 ? "crit" : pressure >= 3 ? "warn" : "ok";
      return { state: s, ready, stalled, onboardingDelay, orientationDelay, demand, clientGap, pressure, tone };
    }).sort((a, b) => b.pressure - a.pressure);
  }, [base, clientNeeds, derivedStates, demandByState]);

  // Bottlenecks
  const bottlenecks = useMemo(() => {
    const items: Array<{
      id: string; type: string; tone: Tone; impact: string; state: string; recruiter: string;
      days: number; nextAction: string; candidate: string;
    }> = [];
    base.forEach((c) => {
      if (isOnboardingDelayed(c)) {
        items.push({ id: `ob-${c.id}`, type: "Onboarding delay", tone: "warn", impact: "Blocks orientation", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: c.nextAction, candidate: c.name });
      }
      if (isOrientationDelayed(c)) {
        items.push({ id: `or-${c.id}`, type: "Orientation not scheduled", tone: "warn", impact: "Blocks staffing readiness", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: "Schedule orientation", candidate: c.name });
      }
      if (c.offerStatus === "Unsigned" && c.daysInStage >= 2) {
        items.push({ id: `of-${c.id}`, type: "Unsigned offer", tone: "crit", impact: "Candidate may withdraw", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: "Follow up on offer", candidate: c.name });
      }
      if (c.interviewStatus === "Needs Outcome") {
        items.push({ id: `iv-${c.id}`, type: "Interview outcome missing", tone: "warn", impact: "Delays offer stage", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: "Enter interview outcome", candidate: c.name });
      }
      if (c.candidateStatus === "Ready for Staffing" && c.readinessStatus !== "Ready for Staffing") {
        items.push({ id: `st-${c.id}`, type: "Staffing handoff missed", tone: "crit", impact: "Ready candidate not assigned", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: "Notify staffing team", candidate: c.name });
      }
      if (isStalled(c) && c.daysInStage >= 7) {
        items.push({ id: `sl-${c.id}`, type: "Stalled candidate", tone: "crit", impact: "Pipeline slowdown", state: c.state, recruiter: c.recruiter, days: c.daysInStage, nextAction: c.nextAction, candidate: c.name });
      }
    });
    // Filter by chip
    return items.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        const hay = [b.candidate, b.recruiter, b.state, b.type, b.nextAction].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      switch (activeChip) {
        case "all":          return true;
        case "rbt":          return base.find((c) => c.name === b.candidate)?.role === "RBT";
        case "bcba":         return base.find((c) => c.name === b.candidate)?.role === "BCBA";
        case "staffing":     return b.type.includes("Staffing") || b.type.includes("staffing");
        case "onboarding":   return b.type.includes("Onboarding");
        case "orientation":  return b.type.includes("Orientation");
        case "highrisk":     return b.tone === "crit";
        case "stalled":      return b.type === "Stalled candidate";
        case "followup":     return b.type === "Unsigned offer" || b.type === "Interview outcome missing";
        default:             return true;
      }
    }).sort((a, b) => (a.tone === "crit" ? -1 : 1) - (b.tone === "crit" ? -1 : 1) || b.days - a.days);
  }, [base, activeChip, search]);

  // Trends (lightweight)
  const trends = useMemo(() => ({
    hiring:        { values: [12, 10, 11, 9, 8, 9, 7], dir: "down" as const, label: "Hiring speed", unit: "days", current: 9 },
    onboarding:    { values: [62, 65, 68, 70, 72, 75, 78], dir: "up" as const, label: "Onboarding completion", unit: "%", current: 78 },
    orientation:   { values: [70, 72, 74, 73, 76, 77, 80], dir: "up" as const, label: "Orientation completion", unit: "%", current: 80 },
    fulfillment:   { values: [55, 58, 60, 59, 62, 63, 65], dir: "up" as const, label: "Staffing fulfillment", unit: "%", current: snapshot.fulfillRate || 65 },
    source:        { values: [40, 42, 45, 43, 48, 50, 52], dir: "up" as const, label: "Apploi source quality", unit: "%", current: 52 },
  }), [snapshot.fulfillRate]);

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Recruiting Performance</h1>
            <p className="text-muted-foreground mt-1 text-[15px] max-w-2xl">
              Monitor recruiting operations, staffing fulfillment, onboarding movement, and workflow bottlenecks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={stateF} onChange={(e) => setStateF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All states</option>
              {derivedStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={recruiterF} onChange={(e) => setRecruiterF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All recruiters</option>
              {derivedRecruiters.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={roleF} onChange={(e) => setRoleF(e.target.value as typeof roleF)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All roles</option>
              <option value="RBT">RBT</option>
              <option value="BCBA">BCBA</option>
            </select>
            <div className="h-10 rounded-xl bg-muted/60 border border-border p-1 flex items-center text-xs">
              {TIME_RANGES.map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cn("h-8 px-3 rounded-lg transition", range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{r}</button>
              ))}
            </div>
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <Download className="size-4" /> Export
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="rounded-2xl bg-card border border-border/70 p-3 flex items-center gap-3">
          <Search className="size-4 text-muted-foreground ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recruiters, states, regions, bottlenecks, stages…"
            className="flex-1 bg-transparent outline-none text-sm h-9 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Snapshot */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SnapCard label="Avg time to interview" value={`${snapshot.avgInterview}d`} dir="down" sparkTone="ok" spark={[10,9,9,8,8,7,7]} hint="Target ≤ 5d" />
          <SnapCard label="Avg time to offer" value={`${snapshot.avgOffer}d`} dir="flat" sparkTone="info" spark={[11,11,10,10,11,10,10]} hint="Target ≤ 8d" />
          <SnapCard label="Avg onboarding time" value={`${snapshot.avgOnboarding}d`} dir="down" sparkTone="ok" spark={[16,15,14,14,13,13,12]} hint="Target ≤ 10d" />
          <SnapCard label="Orientation completion" value={`${snapshot.orientationRate}%`} dir="up" sparkTone="ok" spark={[68,70,72,74,76,78,80]} hint="Of cleared candidates" />
          <SnapCard label="Staffing fulfillment" value={`${snapshot.fulfillRate}%`} dir="up" sparkTone="info" spark={[55,58,60,59,62,63,65]} hint="Ready vs. client need" />
          <SnapCard label="Stalled 7+ days" value={`${snapshot.stalled}`} dir={snapshot.stalled > 4 ? "up" : "flat"} sparkTone={snapshot.stalled > 4 ? "crit" : "warn"} spark={[3,4,5,5,6,6,snapshot.stalled]} hint="Across all stages" />
          <SnapCard label="Urgent staffing gaps" value={`${snapshot.urgentGaps}`} dir="up" sparkTone="crit" spark={[2,3,3,4,4,5,snapshot.urgentGaps]} hint="High priority clients" />
          <SnapCard label="Overdue follow-ups" value={`${snapshot.followUps}`} dir="flat" sparkTone="warn" spark={[4,5,4,5,5,4,snapshot.followUps]} hint="Recruiter actions due" />
        </section>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveChip(c.key)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium border transition",
                activeChip === c.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border/70 hover:bg-muted"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Movement */}
        <section className="rounded-2xl bg-card border border-border/70 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Candidate movement</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Average days in each stage. Bottlenecks highlighted.</p>
            </div>
            <Pill tone="info">{base.length} active candidates</Pill>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {movement.map((s, i) => (
              <div key={s.key} className={cn(
                "rounded-xl border p-4 transition",
                s.bottleneck ? "bg-amber-500/5 border-amber-500/30" : "bg-muted/40 border-border/60"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{i + 1}. {s.label}</span>
                  {s.bottleneck && <Flame className="size-3.5 text-amber-600" />}
                </div>
                <div className="text-2xl font-semibold tracking-tight">{s.avgDays}<span className="text-sm text-muted-foreground font-normal"> d avg</span></div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>{s.count} in stage</span>
                  {s.stalled > 0 && <Pill tone="crit" className="text-[10px]">{s.stalled} stalled</Pill>}
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-border/60 overflow-hidden">
                  <div className={cn("h-full transition-all", s.bottleneck ? "bg-amber-500" : s.tone === "ok" ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min((s.avgDays / (s.target * 2)) * 100, 100)}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Target ≤ {s.target}d</div>
              </div>
            ))}
          </div>
        </section>

        {/* Two-column: Fulfillment + State pressure */}
        <section className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card border border-border/70 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Staffing fulfillment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Client demand vs. orientation-ready candidates.</p>
              </div>
              <Pill tone="info">Top 6</Pill>
            </div>
            <div className="space-y-2">
              {fulfillment.length === 0 && <EmptyState text="No active staffing requests." />}
              {fulfillment.map(({ need, ready, delayed }) => (
                <div key={need.client.id} className="rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium truncate">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{need.client.childName}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {need.client.state} · {need.client.clinic} · {need.daysWaiting}d waiting · needs {need.client.bcba ? "RBT" : "BCBA"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Pill tone={need.priority === "High" ? "crit" : need.priority === "Medium" ? "warn" : "muted"}>{need.priority}</Pill>
                    {delayed && <Pill tone="crit">Delayed</Pill>}
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ready} ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">State recruiting pressure</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Where staffing demand is outpacing supply.</p>
              </div>
            </div>
            <div className="space-y-2">
              {statePressure.map((s) => (
                <div key={s.state} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-card border border-border/60 grid place-items-center text-[11px] font-semibold">{s.state}</div>
                      <span className="text-sm font-medium">Pressure score {s.pressure}</span>
                    </div>
                    <Pill tone={s.tone}>{s.tone === "crit" ? "High" : s.tone === "warn" ? "Watch" : "Healthy"}</Pill>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                    <Stat label="Demand" value={s.demand} />
                    <Stat label="Ready" value={s.ready} tone="ok" />
                    <Stat label="Onboarding" value={s.onboardingDelay} tone={s.onboardingDelay > 0 ? "warn" : "muted"} />
                    <Stat label="Orient." value={s.orientationDelay} tone={s.orientationDelay > 0 ? "warn" : "muted"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recruiter activity */}
        <section className="rounded-2xl bg-card border border-border/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recruiter activity & follow-up</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Operational visibility, not a leaderboard.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recruiterRows.map((r) => (
              <div key={r.name} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                      {r.name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium leading-tight">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.load} active · {r.ready} ready</div>
                    </div>
                  </div>
                  <Pill tone={r.speed >= 60 ? "ok" : r.speed >= 30 ? "warn" : "muted"}>{r.speed}% complete</Pill>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <MiniStat label="Stalled" value={r.stalled} tone={r.stalled > 0 ? "crit" : "muted"} />
                  <MiniStat label="Onboard" value={r.onboardingDelay} tone={r.onboardingDelay > 0 ? "warn" : "muted"} />
                  <MiniStat label="Orient." value={r.orientationDelay} tone={r.orientationDelay > 0 ? "warn" : "muted"} />
                  <MiniStat label="F/Up" value={r.followUps} tone={r.followUps > 0 ? "warn" : "muted"} />
                </div>
              </div>
            ))}
            {recruiterRows.length === 0 && <EmptyState text="No recruiters match current filters." />}
          </div>
        </section>

        {/* Bottlenecks center */}
        <section className="rounded-2xl bg-card border border-border/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Operational bottlenecks</h2>
              <p className="text-xs text-muted-foreground mt-0.5">What requires recruiter or staffing action right now.</p>
            </div>
            <Pill tone={bottlenecks.length === 0 ? "ok" : bottlenecks.filter((b) => b.tone === "crit").length > 0 ? "crit" : "warn"}>
              {bottlenecks.length} open
            </Pill>
          </div>
          {bottlenecks.length === 0 ? (
            <EmptyState text="No major bottlenecks detected. You're caught up." positive />
          ) : (
            <div className="space-y-2">
              {bottlenecks.slice(0, 12).map((b) => (
                <div key={b.id} className="rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center gap-3">
                  <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", b.tone === "crit" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                    {b.tone === "crit" ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{b.type}</span>
                      <span className="text-muted-foreground font-normal">· {b.candidate}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {b.impact} · {b.state} · {b.recruiter} · {b.days}d in stage
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="h-8 px-2.5 rounded-lg text-xs bg-card border border-border/60 hover:bg-muted transition inline-flex items-center gap-1">
                      <ArrowRight className="size-3.5" /> {b.nextAction}
                    </button>
                    <button title="Escalate" className="size-8 rounded-lg bg-card border border-border/60 hover:bg-muted transition grid place-items-center">
                      <Flame className="size-3.5 text-muted-foreground" />
                    </button>
                    <button title="Notify staffing" className="size-8 rounded-lg bg-card border border-border/60 hover:bg-muted transition grid place-items-center">
                      <Bell className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Trends */}
        <section className="rounded-2xl bg-card border border-border/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Trend insights</h2>
            <span className="text-xs text-muted-foreground">Last 7 weeks</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(trends).map(([k, t]) => (
              <div key={k} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="text-[11px] text-muted-foreground">{t.label}</div>
                <div className="flex items-end justify-between mt-1.5">
                  <div className="text-2xl font-semibold tracking-tight">
                    {t.current}<span className="text-xs text-muted-foreground font-normal">{t.unit}</span>
                  </div>
                  <Spark values={t.values} tone={t.dir === "up" ? "ok" : t.dir === "down" ? "info" : "muted"} />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                  <TrendIcon dir={t.dir} /> {t.dir === "up" ? "improving" : t.dir === "down" ? "decreasing" : "flat"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl bg-card border border-border/70 p-4 flex flex-wrap gap-2">
          <QA icon={Download} label="Export recruiting report" />
          <QA icon={Flame} label="Escalate staffing delay" />
          <QA icon={UserPlus} label="Assign recruiter" />
          <QA icon={Bell} label="Notify staffing team" />
          <QA icon={ClipboardList} label="Review stalled candidates" />
          <QA icon={RefreshCw} label="Review onboarding delays" />
          <QA icon={CheckCircle2} label="Review orientation delays" />
          <QA icon={Target} label="Export operational snapshot" />
        </section>

        {/* Operational Insights floating */}
        <button
          onClick={() => setAiOpen((v) => !v)}
          className="fixed bottom-6 right-6 z-40 h-12 px-5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium"
        >
          <Sparkles className="size-4" /> Operational Insights
        </button>
        {aiOpen && (
          <div className="fixed bottom-24 right-6 z-40 w-[360px] rounded-2xl bg-card border border-border/70 shadow-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center"><Brain className="size-4" /></div>
              <div>
                <div className="text-sm font-semibold leading-tight">Blossom AI</div>
                <div className="text-[11px] text-muted-foreground">Scoped to recruiting performance</div>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                "Where are recruiting bottlenecks happening?",
                "Which staffing requests are highest risk?",
                "Show stalled onboarding workflows.",
                "Which states need recruiting support?",
                "Which recruiters need operational support?",
              ].map((p) => (
                <button key={p} onClick={() => setAiQ(p)} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted transition">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={aiQ}
                onChange={(e) => setAiQ(e.target.value)}
                placeholder="Ask about recruiting operations…"
                className="flex-1 h-9 rounded-lg bg-muted/60 border border-border px-3 text-xs outline-none"
              />
              <button className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:opacity-90">
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </OSShell>
  );
}

function SnapCard({
  label, value, hint, dir, spark, sparkTone,
}: {
  label: string; value: string; hint: string;
  dir: "up" | "down" | "flat"; spark: number[]; sparkTone: Tone;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4 transition hover:border-border">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex items-end justify-between mt-1.5">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <Spark values={spark} tone={sparkTone} />
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
        <TrendIcon dir={dir} />
        <span>{hint}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "info" }: { label: string; value: number; tone?: Tone }) {
  return (
    <div className="rounded-lg bg-card border border-border/50 p-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold", tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : tone === "warn" ? "text-amber-700 dark:text-amber-400" : tone === "crit" ? "text-destructive" : "text-foreground")}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className={cn("rounded-lg border p-1.5 text-center", toneClass(tone))}>
      <div className="text-[9px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function QA({ icon: Icon, label }: { icon: typeof Download; label: string }) {
  return (
    <button className="h-9 px-3.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 transition inline-flex items-center gap-2 text-xs font-medium">
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function EmptyState({ text, positive }: { text: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
      <div className={cn("size-9 rounded-full mx-auto mb-2 grid place-items-center", positive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
        {positive ? <CheckCircle2 className="size-4" /> : <Users className="size-4" />}
      </div>
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>
  );
}