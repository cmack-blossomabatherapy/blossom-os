import { useMemo, useState, useEffect } from "react";
import {
  Search, Sparkles, Brain, Send, Download, Bell, Plus, RefreshCw,
  Flame, Clock, CheckCircle2, MessageSquare, UserPlus, ArrowRight,
  AlertTriangle, X, Calendar, ClipboardList, MapPin, ShieldAlert,
  TrendingUp, Users,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  recruitingRecruiters,
  recruitingStates,
  staffingDemandByRegion,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { useRecruitingEscalations, type RecruitingEscalation } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { cn } from "@/lib/utils";
// Escalations workflow status lives on `recruiting_escalations.status`.
// We keep an optimistic UI-only map and persist the real status via mutations.

// Recruiting → Communication → Escalations & Follow-Ups

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "new",         label: "New Escalation" },
  { key: "recruiter",   label: "Recruiter Follow-Up" },
  { key: "candidate",   label: "Candidate Waiting" },
  { key: "staffing",    label: "Staffing Delay" },
  { key: "leadership",  label: "Leadership Review" },
  { key: "highrisk",    label: "High-Risk Delay" },
  { key: "resolved",    label: "Resolved" },
] as const;
type StageKey = typeof STAGES[number]["key"];

const STAGE_TO_STATUS: Record<StageKey, string> = {
  new: "Open",
  recruiter: "In Progress",
  candidate: "Waiting on Candidate",
  staffing: "Staffing Delay",
  leadership: "Leadership Review",
  highrisk: "High Risk",
  resolved: "Resolved",
};
const STATUS_TO_STAGE: Record<string, StageKey> = {
  "Open": "new",
  "New": "new",
  "In Progress": "recruiter",
  "Waiting on Candidate": "candidate",
  "Staffing Delay": "staffing",
  "Leadership Review": "leadership",
  "High Risk": "highrisk",
  "Resolved": "resolved",
};

type EscType =
  | "Candidate stalled"
  | "Interview no-show"
  | "Unsigned offer"
  | "Onboarding delay"
  | "Background check delay"
  | "Orientation missed"
  | "Orientation not scheduled"
  | "Staffing handoff delayed"
  | "Communication breakdown"
  | "Unstaffed urgent client";

type Esc = {
  id: string;
  candidateId: string;
  candidate: RecruitingCandidate;
  type: EscType;
  reason: string;
  recruiter: string;
  staffingCoord: string;
  state: string;
  daysDelayed: number;
  lastUpdate: string;
  urgency: "High" | "Medium" | "Low";
  stage: StageKey;
  operationalImpact: string;
  staffingImpact: boolean;
  leadership: boolean;
};

const COORDS = ["Alex Reyes", "Jamie Park", "Riley Brooks", "Morgan Diaz", "Sky Tran"];
function coordFor(state: string) {
  let h = 0;
  for (const ch of state) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COORDS[h % COORDS.length];
}

function urgencyFor(c: RecruitingCandidate, daysDelayed: number): "High" | "Medium" | "Low" {
  const key = `${c.state}-${c.region}`;
  const demand = staffingDemandByRegion[key]?.demand ?? 0;
  if (c.readinessStatus === "Blocked" || demand >= 4 || daysDelayed >= 7) return "High";
  if (daysDelayed >= 4 || demand >= 3) return "Medium";
  return "Low";
}
function lastUpdateFor(c: RecruitingCandidate) {
  const d = Math.max(1, c.daysInStage);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function buildEscalations(candidates: RecruitingCandidate[]): Esc[] {
  const out: Esc[] = [];
  const push = (
    c: RecruitingCandidate, type: EscType, reason: string, stage: StageKey,
    daysDelayed: number, operationalImpact: string,
    opts: { staffingImpact?: boolean; leadership?: boolean } = {}
  ) => {
    out.push({
      id: `${c.id}-${type}`,
      candidateId: c.id,
      candidate: c,
      type,
      reason,
      recruiter: c.recruiter,
      staffingCoord: coordFor(c.state),
      state: c.state,
      daysDelayed,
      lastUpdate: lastUpdateFor(c),
      urgency: urgencyFor(c, daysDelayed),
      stage,
      operationalImpact,
      staffingImpact: !!opts.staffingImpact,
      leadership: !!opts.leadership || daysDelayed >= 7,
    });
  };

  candidates.forEach((c) => {
    const d = c.daysInStage;

    if (c.interviewStatus === "No-Show") {
      push(c, "Interview no-show", "Candidate missed interview", "recruiter", d, "Slows pipeline movement");
    }
    if (c.offerStatus === "Unsigned" && d >= 2) {
      push(c, "Unsigned offer", "Offer outstanding without signature",
        d >= 5 ? "leadership" : "candidate", d, "Blocks onboarding handoff", { staffingImpact: true });
    }
    if (c.candidateStatus === "Onboarding Handoff" && c.onboardingStatus !== "Complete" && d >= 3) {
      push(c, "Onboarding delay", "Handoff to Viventium not initiated",
        d >= 6 ? "highrisk" : "staffing", d - 2, "Delays staffing readiness", { staffingImpact: true });
    }
    if (c.backgroundCheck === "Delayed" || (c.backgroundCheck === "Pending" && d >= 5)) {
      push(c, "Background check delay", "Awaiting clearance from vendor", "highrisk", d, "Blocks orientation and staffing", { staffingImpact: true, leadership: d >= 7 });
    }
    if (c.backgroundCheck === "Clear" && c.orientation === "Not Scheduled" && d >= 1) {
      push(c, "Orientation not scheduled", "Cleared candidate has no orientation", "staffing", Math.max(1, d - 1), "Delays staffing-ready pool", { staffingImpact: true });
    }
    if (c.candidateStatus === "Orientation" && c.orientation !== "Complete" && d >= 3) {
      push(c, "Orientation missed", "Scheduled orientation not completed", "highrisk", d - 2, "Pushes back staffing date", { staffingImpact: true, leadership: true });
    }
    if (c.readinessStatus === "Ready for Staffing" && c.candidateStatus !== "Ready for Staffing") {
      push(c, "Staffing handoff delayed", "Ready candidate not handed to staffing",
        d >= 3 ? "leadership" : "staffing", d, "Direct staffing impact", { staffingImpact: true, leadership: d >= 3 });
    }
    if (d >= 7 && c.readinessStatus !== "Ready for Staffing") {
      push(c, "Candidate stalled", `Stalled ${d}d in ${c.candidateStatus}`,
        "leadership", d - 6, "Pipeline blockage", { staffingImpact: true, leadership: true });
    }
    if (c.followUps && c.followUps.length > 0 && d >= 4) {
      push(c, "Communication breakdown", c.followUps[0] || "Candidate not responding",
        d >= 6 ? "highrisk" : "candidate", d - 3, "Risk of candidate dropoff");
    }
    if (c.readinessStatus === "Blocked") {
      push(c, "Unstaffed urgent client", `Blocked in ${c.region}`, "highrisk", Math.max(1, d), "Client coverage at risk", { staffingImpact: true, leadership: true });
    }
  });

  return out;
}

function toneFor(e: Esc): Tone {
  if (e.urgency === "High" || e.daysDelayed >= 6 || e.stage === "highrisk") return "crit";
  if (e.urgency === "Medium" || e.daysDelayed >= 3) return "warn";
  if (e.stage === "resolved") return "ok";
  return "info";
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

const CHIPS = [
  { key: "all",         label: "All Escalations" },
  { key: "high",        label: "High Priority" },
  { key: "stalled",     label: "Candidate Stalled" },
  { key: "interview",   label: "Interview Delay" },
  { key: "offer",       label: "Offer Delay" },
  { key: "onboarding",  label: "Onboarding Delay" },
  { key: "orientation", label: "Orientation Delay" },
  { key: "staffing",    label: "Staffing Delay" },
  { key: "leadership",  label: "Leadership Attention" },
  { key: "resolved",    label: "Resolved" },
];

const QUICK_ACTIONS = [
  { label: "Create Escalation",         icon: Plus },
  { label: "Assign Recruiter",          icon: UserPlus },
  { label: "Notify Staffing Leadership",icon: Bell },
  { label: "Escalate Operational Delay",icon: Flame },
  { label: "Resolve Escalation",        icon: CheckCircle2 },
  { label: "Export Escalation Queue",   icon: Download },
  { label: "Send Operational Update",   icon: Send },
  { label: "Review High-Risk Delays",   icon: ShieldAlert },
];

/**
 * Map a live `recruiting_escalations` row to the rich Esc view-model used by
 * the rest of this page. When the row references a known candidate we
 * preferentially borrow the legacy candidate record (it carries `region`,
 * `candidateStatus`, etc. needed by the drawer); otherwise we fall back to
 * lookup via `findCandidate` (DB shape) or a minimal stub.
 */
function mapLiveEscalationToViewModel(
  row: RecruitingEscalation,
  findCandidate: (id: string | null | undefined) => any,
  legacyCandidates: RecruitingCandidate[],
): Esc {
  const lookupCand = row.candidate_id ? findCandidate(row.candidate_id) : null;
  const lookupName = lookupCand ? `${lookupCand.first_name} ${lookupCand.last_name}`.trim() : (row.title ?? "Escalation");
  const legacyMatch = legacyCandidates.find(
    (c) => c.id === row.candidate_id || c.name.toLowerCase() === lookupName.toLowerCase(),
  );
  const candidate: RecruitingCandidate = legacyMatch ?? ({
    id: row.candidate_id ?? row.id,
    name: lookupName,
    role: (lookupCand?.role as any) ?? "RBT",
    state: (lookupCand?.state as any) ?? "GA",
    region: lookupCand?.city ?? "—",
    city: lookupCand?.city ?? "—",
    source: "Apploi",
    recruiter: row.owner ?? lookupCand?.recruiter ?? "Unassigned",
    interviewer: "—",
    candidateStatus: "New Applicant",
    interviewStatus: "Not Scheduled",
    offerStatus: "Not Sent",
    onboardingStatus: "Not Started",
    readinessStatus: "Not Ready",
    appliedDate: row.opened_at,
    daysInStage: 0,
    nextAction: row.notes ?? "—",
    resume: "Received",
    certification: "Not Required",
    bacbCheck: "N/A",
    kidsExperience: "Moderate",
    screeningOutcome: "Pending",
    eligibility: "Review",
    noShow: false,
    viventium: "Not Started",
    backgroundCheck: "Not Sent",
    orientation: "Not Scheduled",
    training: "Not Assigned",
    i9: "Not Started",
    everify: "Not Started",
    centralReach: "Needed",
    availability: "—",
    travelRadius: 0,
    preferredHours: "—",
    blockers: [],
    interviewNotes: "",
    followUps: [],
    tasks: [],
    timeline: [],
  } as unknown as RecruitingCandidate);

  const days = row.opened_at
    ? Math.max(0, Math.floor((Date.now() - new Date(row.opened_at).getTime()) / 86400000))
    : 0;
  const stage: StageKey =
    row.status === "Resolved" ? "resolved"
    : (STATUS_TO_STAGE[row.status] ?? "new");
  const urgency: Esc["urgency"] =
    row.severity === "High" ? "High"
    : row.severity === "Low" ? "Low"
    : "Medium";

  return {
    id: row.id,
    candidateId: candidate.id,
    candidate,
    type: ((row.title as EscType) ?? "Candidate stalled") as EscType,
    reason: row.reason ?? row.title ?? "—",
    recruiter: row.owner ?? candidate.recruiter ?? "Unassigned",
    staffingCoord: coordFor(candidate.state ?? ""),
    state: candidate.state ?? "—",
    daysDelayed: days,
    lastUpdate: days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`,
    urgency,
    stage,
    operationalImpact: row.notes ?? "—",
    staffingImpact: stage === "staffing" || urgency === "High",
    leadership: urgency === "High" || days >= 7 || stage === "leadership" || stage === "highrisk",
  };
}

export default function OSRecruitingEscalations() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveEscalations, loading: liveEscalationsLoading } = useRecruitingEscalations();
  const { find: findCandidate } = useRecruitingCandidateLookup();
  const synthetic = useMemo(() => buildEscalations(recruitingCandidates), [recruitingCandidates]);

  // Map each live row → Esc view-model. This is the primary data source for
  // the board, summary, queues, and drawer — synthetic items are demoted to
  // the "Suggested escalations" section below.
  const liveBase = useMemo<Esc[]>(() => {
    return liveEscalations.map((row) => mapLiveEscalationToViewModel(row, findCandidate, recruitingCandidates));
  }, [liveEscalations, findCandidate, recruitingCandidates]);

  // Candidate-derived items that are NOT yet represented in the live table.
  // Match by candidate_id (uuid) when present, otherwise by candidate name.
  const suggested = useMemo<Esc[]>(() => {
    const liveCandIds = new Set<string>();
    const liveCandNames = new Set<string>();
    for (const row of liveEscalations) {
      if (row.candidate_id) liveCandIds.add(row.candidate_id);
      const cand = row.candidate_id ? findCandidate(row.candidate_id) : null;
      if (cand) liveCandNames.add(`${cand.first_name} ${cand.last_name}`.trim().toLowerCase());
    }
    return synthetic.filter((e) => {
      if (liveCandIds.has(e.candidate.id)) return false;
      if (liveCandNames.has(e.candidate.name.toLowerCase())) return false;
      return true;
    });
  }, [synthetic, liveEscalations, findCandidate]);

  // Primary "base" the rest of the page reads from is the live persisted set
  // only. Candidate-derived items live in `suggested` and render in their
  // own clearly labeled section below — they never populate the live board.
  const base = useMemo<Esc[]>(() => liveBase, [liveBase]);

  const defaults = useMemo(() => {
    const m: Record<string, StageKey> = {};
    base.forEach((e) => { m[e.id] = e.stage; });
    return m;
  }, [base]);
  // Optimistic UI map; real status persists via mutations.resolveEscalation /
  // mutations.updateEscalation for rows that originated in the live table.
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [urgencyF, setUrgencyF] = useState("all");
  const [daysF, setDaysF] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");

  const stageOf = (e: Esc): StageKey => e.stage;

  const filtered = useMemo(() => {
    return base.filter((e) => {
      if (stateF !== "all" && e.state !== stateF) return false;
      if (recruiterF !== "all" && e.recruiter !== recruiterF) return false;
      if (urgencyF !== "all" && e.urgency !== urgencyF) return false;
      if (daysF !== "all") {
        const n = parseInt(daysF, 10);
        if (e.daysDelayed < n) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [e.candidate.name, e.recruiter, e.staffingCoord, e.type, e.reason, e.state, e.candidate.region, e.candidate.candidateStatus].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(e);
      switch (activeChip) {
        case "all":         return true;
        case "high":        return e.urgency === "High";
        case "stalled":     return e.type === "Candidate stalled";
        case "interview":   return e.type.startsWith("Interview");
        case "offer":       return e.type === "Unsigned offer";
        case "onboarding":  return e.type === "Onboarding delay" || e.type === "Background check delay";
        case "orientation": return e.type.startsWith("Orientation");
        case "staffing":    return st === "staffing" || e.type === "Staffing handoff delayed" || e.type === "Unstaffed urgent client";
        case "leadership":  return st === "leadership" || e.leadership;
        case "resolved":    return st === "resolved";
        default:            return true;
      }
    });
  }, [base, activeChip, search, stateF, recruiterF, urgencyF, daysF]);

  const summary = useMemo(() => {
    const has = (pred: (e: Esc) => boolean) => base.filter(pred).length;
    return {
      high:          has((e) => e.urgency === "High"),
      stalled7:      has((e) => e.candidate.daysInStage >= 7),
      onboarding:    has((e) => e.type === "Onboarding delay" || e.type === "Background check delay"),
      orientation:   has((e) => e.type.startsWith("Orientation")),
      staffing:      has((e) => stageOf(e) === "staffing" || e.staffingImpact),
      overdueFU:     has((e) => e.daysDelayed >= 3),
      leadership:    has((e) => e.leadership),
      urgentNeeds:   has((e) => e.type === "Unstaffed urgent client"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const grouped = useMemo(() => {
    const g: Record<StageKey, Esc[]> = {
      new: [], recruiter: [], candidate: [], staffing: [], leadership: [], highrisk: [], resolved: [],
    };
    filtered.forEach((e) => { g[stageOf(e)].push(e); });
    Object.values(g).forEach((arr) => arr.sort((a, b) => b.daysDelayed - a.daysDelayed));
    return g;
  }, [filtered]);

  const staffingDelays = useMemo(
    () => filtered.filter((e) => e.staffingImpact || stageOf(e) === "staffing" || e.type === "Unstaffed urgent client")
      .sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 8),
    [filtered]
  );

  const stallRisk = useMemo(
    () => filtered.filter((e) =>
      e.type === "Candidate stalled" || e.type === "Communication breakdown" ||
      e.type === "Onboarding delay" || e.type === "Orientation missed" ||
      e.type === "Unsigned offer" || e.type === "Background check delay"
    ).sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 10),
    [filtered]
  );

  const leadershipQueue = useMemo(
    () => filtered.filter((e) => e.leadership || stageOf(e) === "leadership" || stageOf(e) === "highrisk")
      .sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 8),
    [filtered]
  );

  const recruiterRows = useMemo(() => {
    return recruitingRecruiters.map((name) => {
      const owned = base.filter((e) => e.recruiter === name);
      return {
        name,
        active:     owned.filter((e) => stageOf(e) !== "resolved").length,
        overdue:    owned.filter((e) => e.daysDelayed >= 3).length,
        staffing:   owned.filter((e) => e.staffingImpact).length,
        leadership: owned.filter((e) => e.leadership).length,
        resolved:   owned.filter((e) => stageOf(e) === "resolved").length,
      };
    }).filter((r) => r.active + r.resolved > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  const selected = selectedId ? base.find((e) => e.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    const item = base.find((e) => e.id === id);
    // Persist for rows that originated from the live table (uuid ids).
    if (item && /^[0-9a-f-]{36}$/i.test(id)) {
      if (to === "resolved") void mutations.resolveEscalation(id);
      else void mutations.updateEscalation(id, { status: STAGE_TO_STATUS[to] });
    }
  }
  function onDragStart(ev: React.DragEvent, id: string) {
    ev.dataTransfer.setData("text/plain", id); ev.dataTransfer.effectAllowed = "move";
  }
  function onDrop(ev: React.DragEvent, to: StageKey) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    if (id) moveStage(id, to);
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Escalations &amp; Follow-Ups</h1>
            <p className="text-muted-foreground mt-1 text-[15px] max-w-2xl">
              Track stalled workflows, staffing delays, onboarding risks, and operational recruiting escalations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={stateF} onChange={(e) => setStateF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All states</option>
              {recruitingStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={recruiterF} onChange={(e) => setRecruiterF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All recruiters</option>
              {recruitingRecruiters.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={urgencyF} onChange={(e) => setUrgencyF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">All urgency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={daysF} onChange={(e) => setDaysF(e.target.value)} className="h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm">
              <option value="all">Any delay</option>
              <option value="3">3+ days</option>
              <option value="5">5+ days</option>
              <option value="7">7+ days</option>
            </select>
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Workflows
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4" /> Create Escalation
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="rounded-2xl bg-card border border-border/70 p-3 flex items-center gap-3">
          <Search className="size-4 text-muted-foreground ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates, recruiters, staffing coordinators, escalation reasons…"
            className="flex-1 bg-transparent outline-none text-sm h-9 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SumCard label="High priority" value={summary.high} icon={Flame} tone={summary.high > 0 ? "crit" : "muted"} onClick={() => setActiveChip("high")} hint="Immediate attention" />
          <SumCard label="Stalled 7+ days" value={summary.stalled7} icon={AlertTriangle} tone={summary.stalled7 > 0 ? "crit" : "muted"} onClick={() => setActiveChip("stalled")} hint="No movement in stage" />
          <SumCard label="Onboarding delays" value={summary.onboarding} icon={RefreshCw} tone={summary.onboarding > 2 ? "warn" : "info"} onClick={() => setActiveChip("onboarding")} hint="Handoff or background" />
          <SumCard label="Orientation delays" value={summary.orientation} icon={Calendar} tone={summary.orientation > 0 ? "warn" : "muted"} onClick={() => setActiveChip("orientation")} hint="Not scheduled / missed" />
          <SumCard label="Staffing handoff delays" value={summary.staffing} icon={UserPlus} tone={summary.staffing > 2 ? "crit" : "warn"} onClick={() => setActiveChip("staffing")} hint="Affecting client coverage" />
          <SumCard label="Overdue follow-ups" value={summary.overdueFU} icon={Clock} tone={summary.overdueFU > 4 ? "crit" : "warn"} onClick={() => { setDaysF("3"); }} hint="3+ days unresolved" />
          <SumCard label="Leadership escalations" value={summary.leadership} icon={ShieldAlert} tone={summary.leadership > 0 ? "crit" : "muted"} onClick={() => setActiveChip("leadership")} hint="Needs intervention" />
          <SumCard label="High-risk staffing needs" value={summary.urgentNeeds} icon={TrendingUp} tone={summary.urgentNeeds > 0 ? "crit" : "muted"} onClick={() => setActiveChip("staffing")} hint="Client coverage at risk" />
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={liveBase.length > 0 ? "ok" : "muted"}>
            {liveEscalationsLoading
              ? "Loading live escalations…"
              : `${liveBase.length} live · ${suggested.length} suggested`}
          </Pill>
        </div>

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

        {/* Suggested escalations — candidate signals not yet logged */}
        {suggested.length > 0 && (
          <section className="rounded-2xl bg-gradient-to-br from-amber-500/5 to-card border border-amber-500/20 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Suggested escalations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidate signals not yet logged in <code className="text-[10px]">recruiting_escalations</code>. Create one to track it on the board.
                </p>
              </div>
              <Pill tone="warn">{suggested.length}</Pill>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggested.slice(0, 12).map((e) => (
                <div key={e.id} className="rounded-xl bg-card border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{e.candidate.name}</span>
                    <Pill tone={toneFor(e)}>{e.urgency}</Pill>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{e.type} · {e.daysDelayed}d</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{e.reason}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{e.state} · {e.recruiter}</span>
                    <button
                      onClick={() => {
                        const uuidLike = /^[0-9a-f-]{36}$/i.test(e.candidate.id) ? e.candidate.id : null;
                        void mutations.createEscalation(uuidLike as any, {
                          title: e.type,
                          reason: e.reason,
                          severity: e.urgency === "High" ? "High" : e.urgency === "Low" ? "Low" : "Medium",
                          owner: e.recruiter,
                          notes: e.operationalImpact,
                        });
                      }}
                      className="h-7 px-2 rounded-lg text-[11px] bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Create
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state when no live escalations exist */}
        {!liveEscalationsLoading && liveBase.length === 0 && (
          <section className="rounded-2xl bg-card border border-border/70 p-8 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">No active recruiting escalations</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Escalations appear here once a candidate, staffing need, onboarding issue, background check, or orientation issue is escalated.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    void mutations.createEscalation(null as any, {
                      title: "Candidate stalled",
                      reason: "Manually created escalation",
                      severity: "Medium",
                      owner: "Unassigned",
                    });
                  }}
                  className="h-8 px-3 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-1"
                >
                  <Plus className="size-3" /> Create Escalation
                </button>
                {suggested.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    or review {suggested.length} suggested below
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Escalation board */}
        {liveBase.length > 0 && (
        <section className="rounded-2xl bg-card border border-border/70 p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Operational escalation board</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drag cards across stages to update escalation status.</p>
            </div>
            <Pill tone="info">{filtered.length} active</Pill>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {STAGES.map((s) => {
              const items = grouped[s.key];
              return (
                <div
                  key={s.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, s.key)}
                  className="rounded-xl bg-muted/40 border border-border/60 p-2 min-h-[200px]"
                >
                  <div className="flex items-center justify-between px-1.5 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map((e) => (
                      <button
                        key={e.id}
                        draggable
                        onDragStart={(ev) => onDragStart(ev, e.id)}
                        onClick={() => setSelectedId(e.id)}
                        className="w-full text-left rounded-lg bg-card border border-border/60 p-2.5 hover:border-border transition hover:-translate-y-0.5"
                      >
                        <div className="text-[12px] font-medium leading-tight truncate">{e.candidate.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{e.type}</div>
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <Pill tone={toneFor(e)}>{e.daysDelayed}d</Pill>
                          {e.staffingImpact && <Pill tone="warn">Staffing</Pill>}
                          {e.leadership && <Pill tone="crit">Lead</Pill>}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 truncate">{e.state} · {e.recruiter}</div>
                      </button>
                    ))}
                    {items.length > 5 && (
                      <div className="text-[10px] text-muted-foreground text-center pt-1">+{items.length - 5} more</div>
                    )}
                    {items.length === 0 && (
                      <div className="text-[10px] text-muted-foreground text-center py-6">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Staffing delays + Stall risk */}
        <section className="grid lg:grid-cols-2 gap-4">
          <QueueCard
            title="High-risk staffing delays"
            subtitle="Recruiting ↔ Staffing operational gaps"
            items={staffingDelays}
            onOpen={setSelectedId}
            emptyText="No staffing coordination delays detected."
            showCoord
          />
          <QueueCard
            title="Candidate stall risk"
            subtitle="Workflows where candidates are falling off"
            items={stallRisk}
            onOpen={setSelectedId}
            emptyText="No stalled recruiting workflows right now."
          />
        </section>

        {/* Leadership + Recruiter accountability */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Leadership attention queue</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Unresolved high-risk operational escalations.</p>
              </div>
              <ShieldAlert className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {leadershipQueue.length === 0 && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
                  <p className="text-xs text-muted-foreground">No operational recruiting escalations currently.</p>
                </div>
              )}
              {leadershipQueue.map((e) => (
                <div key={e.id} className="rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-card border border-border/60 grid place-items-center text-[10px] font-semibold">
                    {e.candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{e.candidate.name}</span>
                      <Pill tone={toneFor(e)}>{e.type}</Pill>
                      <Pill tone="crit">{e.daysDelayed}d</Pill>
                      {e.staffingImpact && <Pill tone="warn">Staffing</Pill>}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{e.operationalImpact}</p>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {e.recruiter} · {e.state} · last update {e.lastUpdate}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedId(e.id)} className="h-8 px-3 rounded-lg text-xs bg-secondary border border-border/60 hover:bg-muted transition inline-flex items-center gap-1">
                      <ArrowRight className="size-3" /> Open
                    </button>
                    <button onClick={() => moveStage(e.id, "resolved")} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition" title="Resolve">
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Recruiter accountability</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Supportive operational visibility.</p>
              </div>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {recruiterRows.length === 0 && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
                  <p className="text-xs text-muted-foreground">All recruiters are clear right now.</p>
                </div>
              )}
              {recruiterRows.map((r) => (
                <div key={r.name} className="rounded-xl bg-muted/40 border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground">{r.active} active</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2 text-center">
                    <Mini label="Overdue" value={r.overdue} tone={r.overdue > 2 ? "crit" : r.overdue > 0 ? "warn" : "muted"} />
                    <Mini label="Staffing" value={r.staffing} tone={r.staffing > 0 ? "warn" : "muted"} />
                    <Mini label="Lead" value={r.leadership} tone={r.leadership > 0 ? "crit" : "muted"} />
                    <Mini label="Resolved" value={r.resolved} tone="ok" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick actions + AI */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base font-semibold tracking-tight">Quick actions</h2>
              <span className="text-xs text-muted-foreground">Operational shortcuts</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {QUICK_ACTIONS.map((q) => (
                <button key={q.label} className="h-12 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted transition flex items-center gap-2 px-3 text-left">
                  <q.icon className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-card border border-border/70 p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight">Operational Insights</h2>
              </div>
              <Sparkles className="size-4 text-primary/70" />
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                "Which candidates are highest risk?",
                "Show unresolved staffing delays.",
                "Which onboarding workflows are stalled?",
                "What escalations need leadership attention?",
                "Show high-priority operational bottlenecks.",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => { setAiQ(p); setAiOpen(true); }}
                  className="w-full text-left text-xs rounded-lg bg-card border border-border/60 px-3 py-2 hover:bg-muted transition"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={aiQ}
                onChange={(e) => setAiQ(e.target.value)}
                placeholder="Ask about operational escalations…"
                className="flex-1 h-9 rounded-lg bg-card border border-border px-3 text-xs outline-none"
              />
              <button onClick={() => setAiOpen(true)} className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                <ArrowRight className="size-4" />
              </button>
            </div>
            {aiOpen && (
              <div className="mt-3 rounded-lg bg-card border border-border/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Blossom AI</p>
                <p>Reviewing {base.length} active escalations… I'll prioritize leadership-attention items, staffing-impact delays, and stalled candidates in this view.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <aside className="w-full max-w-md bg-card border-l border-border/70 overflow-y-auto">
            <header className="p-5 border-b border-border/70 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{selected.candidate.name}</h3>
                  <Pill tone={toneFor(selected)}>{selected.urgency}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.candidate.role} · {selected.state} · {selected.candidate.region}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recruiter: {selected.recruiter} · Staffing: {selected.staffingCoord}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} className="size-8 rounded-lg grid place-items-center hover:bg-muted transition">
                <X className="size-4" />
              </button>
            </header>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Escalation details</p>
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{selected.type}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Reason</span><span className="font-medium text-right">{selected.reason}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Days delayed</span><Pill tone={toneFor(selected)}>{selected.daysDelayed}d</Pill></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Stage</span><span className="font-medium">{STAGES.find((s) => s.key === stageOf(selected))?.label}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Impact</span><span className="font-medium text-right">{selected.operationalImpact}</span></div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Workflow visibility</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Hiring stage" value={selected.candidate.candidateStatus} />
                  <Stat label="Onboarding" value={selected.candidate.onboardingStatus} />
                  <Stat label="Orientation" value={selected.candidate.orientation} />
                  <Stat label="Readiness" value={selected.candidate.readinessStatus} />
                  <Stat label="Background" value={selected.candidate.backgroundCheck} />
                  <Stat label="Offer" value={selected.candidate.offerStatus} />
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Move stage</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => moveStage(selected.id, s.key)}
                      className={cn(
                        "h-9 rounded-lg text-xs border transition",
                        stageOf(selected) === s.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border/60 hover:bg-muted"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Blockers</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {(selected.candidate.blockers || []).length === 0 && <li>· No blockers logged</li>}
                  {(selected.candidate.blockers || []).map((b, i) => <li key={i}>· {b}</li>)}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DAction icon={Flame} label="Escalate to leadership" primary />
                <DAction icon={UserPlus} label="Assign recruiter" />
                <DAction icon={Bell} label="Notify staffing" />
                <DAction icon={Send} label="Resend onboarding" />
                <DAction icon={Calendar} label="Resend orientation" />
                <DAction icon={CheckCircle2} label="Resolve escalation" />
                <DAction icon={Clock} label="Snooze" />
                <DAction icon={Plus} label="Add note" />
              </div>
            </div>
          </aside>
        </div>
      )}
    </OSShell>
  );
}

function SumCard({
  label, value, icon: Icon, tone, hint, onClick,
}: { label: string; value: number; icon: any; tone: Tone; hint?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("size-7 rounded-lg grid place-items-center border", toneClass(tone))}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </button>
  );
}

function QueueCard({
  title, subtitle, items, onOpen, emptyText, showCoord,
}: { title: string; subtitle: string; items: Esc[]; onOpen: (id: string) => void; emptyText: string; showCoord?: boolean }) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ClipboardList className="size-4 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-xl bg-muted/40 border border-border/60 p-6 text-center">
            <p className="text-xs text-muted-foreground">{emptyText}</p>
          </div>
        )}
        {items.map((e) => (
          <button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="w-full text-left rounded-xl bg-muted/40 border border-border/60 p-3 hover:bg-muted transition"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium truncate">{e.candidate.name}</span>
              <Pill tone={toneFor(e)}>{e.type}</Pill>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{e.operationalImpact}</p>
            <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
              <MapPin className="size-3" /> {e.state} · {e.recruiter}
              {showCoord && <span>· Coord: {e.staffingCoord}</span>}
              <Pill tone={toneFor(e)} className="ml-auto">{e.daysDelayed}d delayed</Pill>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div className={cn("rounded-md border px-1.5 py-1", toneClass(tone))}>
      <div className="text-[14px] font-semibold leading-none">{value}</div>
      <div className="text-[9px] opacity-80 mt-0.5">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xs font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}

function DAction({ icon: Icon, label, primary }: { icon: any; label: string; primary?: boolean }) {
  return (
    <button className={cn(
      "h-10 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-2 transition",
      primary ? "bg-primary text-primary-foreground border-primary hover:opacity-90" : "bg-muted/40 border-border/60 hover:bg-muted"
    )}>
      <Icon className="size-3.5" /> {label}
    </button>
  );
}