import { useMemo, useState } from "react";
import {
  Search, Sparkles, Brain, Send, Download, Bell, Plus, RefreshCw,
  Flame, Clock, CheckCircle2, MessageSquare, UserPlus, ArrowRight,
  AlertTriangle, X, Calendar, ClipboardList, MapPin,
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
import {
  useRecruitingFollowups,
  type RecruitingFollowup,
  type RecruitingCandidate as DbRecruitingCandidate,
} from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { cn } from "@/lib/utils";

// Recruiting → Staffing & Operations → Hiring Follow-Ups

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "new",          label: "New Follow-Up" },
  { key: "waiting",      label: "Candidate Waiting" },
  { key: "action",       label: "Recruiter Action" },
  { key: "onboarding",   label: "Onboarding" },
  { key: "orientation",  label: "Orientation" },
  { key: "staffing",     label: "Staffing Coord." },
  { key: "escalated",    label: "Escalated" },
  { key: "completed",    label: "Completed" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Status values written into recruiting_followups.status for each board stage.
const STAGE_TO_STATUS: Record<StageKey, string> = {
  new: "Open",
  waiting: "Waiting",
  action: "Action",
  onboarding: "Onboarding",
  orientation: "Orientation",
  staffing: "Staffing",
  escalated: "Escalated",
  completed: "Done",
};

function stageFromStatus(status: string | null | undefined): StageKey {
  switch ((status ?? "").toLowerCase()) {
    case "done":
    case "completed":
    case "resolved":
      return "completed";
    case "waiting":
      return "waiting";
    case "action":
      return "action";
    case "onboarding":
      return "onboarding";
    case "orientation":
      return "orientation";
    case "staffing":
      return "staffing";
    case "escalated":
      return "escalated";
    default:
      return "new";
  }
}

type FollowUpType =
  | "Interview no-show"
  | "Unsigned offer"
  | "Interview outcome missing"
  | "Onboarding handoff stalled"
  | "Background check delayed"
  | "Orientation not scheduled"
  | "Orientation missed"
  | "Staffing handoff delayed"
  | "New applicant unreviewed"
  | "Candidate no response"
  | "Stalled in stage";

type FollowUp = {
  id: string;
  candidateId: string;
  candidate: RecruitingCandidate;
  type: FollowUpType;
  reason: string;
  recruiter: string;
  state: string;
  daysOverdue: number;
  lastContact: string;
  urgency: "High" | "Medium" | "Low";
  stage: StageKey;
  nextAction: string;
  staffingImpact: boolean;
  isLive?: boolean;
};

function urgencyFor(c: RecruitingCandidate): "High" | "Medium" | "Low" {
  const key = `${c.state}-${c.region}`;
  const demand = staffingDemandByRegion[key]?.demand ?? 0;
  if (c.readinessStatus === "Blocked" || demand >= 4) return "High";
  if (c.daysInStage >= 5 || demand >= 3) return "Medium";
  return "Low";
}
function lastContactFor(c: RecruitingCandidate): string {
  const d = Math.max(1, c.daysInStage);
  if (d <= 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

// Map a live recruiting_followups row into the visual FollowUp view-model.
function mapLiveFollowupToViewModel(
  row: RecruitingFollowup,
  findCandidate: (id: string | null | undefined) => DbRecruitingCandidate | null,
  legacyCandidates: RecruitingCandidate[],
): FollowUp {
  const liveCand = row.candidate_id ? findCandidate(row.candidate_id) : null;
  // Fall back to a legacy candidate shell so the UI keeps rendering name/state/region.
  const fallback: RecruitingCandidate =
    legacyCandidates.find((c) => c.id === row.candidate_id) ??
    ({
      id: row.candidate_id ?? row.id,
      name: liveCand ? `${liveCand.first_name} ${liveCand.last_name}`.trim() : (row.title || "Unknown candidate"),
      role: (liveCand?.role ?? "RBT") as any,
      state: (liveCand?.state ?? "GA") as any,
      region: liveCand?.city ?? "—",
      recruiter: row.owner ?? liveCand?.recruiter ?? "Unassigned",
      candidateStatus: "New Applicant",
      readinessStatus: "Active",
      daysInStage: 0,
      nextAction: row.title,
      interviewStatus: "Not Scheduled",
      offerStatus: "None",
      backgroundCheck: "Not Started",
      orientation: "Not Scheduled",
      onboardingStatus: "Pending",
      followUps: row.notes ? [row.notes] : [],
    } as unknown as RecruitingCandidate);

  const stage = stageFromStatus(row.status);
  const dueMs = row.due_date ? new Date(row.due_date).getTime() : NaN;
  const daysOverdue = Number.isFinite(dueMs)
    ? Math.max(0, Math.floor((Date.now() - dueMs) / (1000 * 60 * 60 * 24)))
    : 0;
  const urgency: FollowUp["urgency"] = daysOverdue >= 5 ? "High" : daysOverdue >= 2 ? "Medium" : "Low";
  const type = ((row.category as FollowUpType) || "Candidate no response") as FollowUpType;
  const staffingImpact = /staff/i.test(row.category ?? row.title);

  return {
    id: row.id,
    candidateId: row.candidate_id ?? row.id,
    candidate: fallback,
    type,
    reason: row.notes ?? row.title,
    recruiter: row.owner ?? fallback.recruiter ?? "Unassigned",
    state: fallback.state,
    daysOverdue,
    lastContact: row.completed_at
      ? new Date(row.completed_at).toLocaleDateString()
      : row.due_date ?? "—",
    urgency,
    stage,
    nextAction: row.title,
    staffingImpact,
    isLive: true,
  };
}

function buildSuggestedFollowUps(candidates: RecruitingCandidate[]): FollowUp[] {
  const items: FollowUp[] = [];
  const push = (
    c: RecruitingCandidate, type: FollowUpType, reason: string,
    stage: StageKey, daysOverdue: number, nextAction: string, staffingImpact = false
  ) => {
    items.push({
      id: `${c.id}-${type}`,
      candidateId: c.id,
      candidate: c,
      type,
      reason,
      recruiter: c.recruiter,
      state: c.state,
      daysOverdue,
      lastContact: lastContactFor(c),
      urgency: urgencyFor(c),
      stage,
      nextAction,
      staffingImpact,
    });
  };
  candidates.forEach((c) => {
    if (c.candidateStatus === "New Applicant" && c.daysInStage >= 1) {
      push(c, "New applicant unreviewed", "Applicant not screened within 24h", c.daysInStage >= 2 ? "action" : "new", Math.max(0, c.daysInStage - 1), "Screen candidate");
    }
    if (c.interviewStatus === "No-Show") {
      push(c, "Interview no-show", "Candidate missed scheduled interview", "action", c.daysInStage, "Reschedule interview");
    }
    if (c.interviewStatus === "Needs Outcome") {
      push(c, "Interview outcome missing", "Outcome not entered after interview", "action", c.daysInStage, "Enter interview outcome");
    }
    if (c.offerStatus === "Unsigned") {
      push(c, "Unsigned offer", "Offer outstanding without signature", c.daysInStage >= 4 ? "escalated" : "waiting", c.daysInStage, "Follow up on offer", true);
    }
    if (c.candidateStatus === "Onboarding Handoff" && c.onboardingStatus !== "Complete" && c.daysInStage >= 3) {
      push(c, "Onboarding handoff stalled", "Handoff to Viventium not initiated", "onboarding", c.daysInStage - 2, "Transition to Viventium", true);
    }
    if (c.backgroundCheck === "Delayed" || (c.backgroundCheck === "Pending" && c.daysInStage >= 5)) {
      push(c, "Background check delayed", "Background check awaiting clearance", "onboarding", c.daysInStage, "Escalate background check", true);
    }
    if (c.backgroundCheck === "Clear" && c.orientation === "Not Scheduled") {
      push(c, "Orientation not scheduled", "Cleared candidate has no orientation date", "orientation", Math.max(1, c.daysInStage - 1), "Schedule orientation", true);
    }
    if (c.candidateStatus === "Orientation" && c.orientation !== "Complete" && c.daysInStage >= 3) {
      push(c, "Orientation missed", "Scheduled orientation not completed", "orientation", c.daysInStage - 2, "Confirm orientation");
    }
    if (c.readinessStatus === "Ready for Staffing" && c.candidateStatus !== "Ready for Staffing") {
      push(c, "Staffing handoff delayed", "Ready candidate not handed to staffing", "staffing", c.daysInStage, "Notify staffing team", true);
    }
    if (c.daysInStage >= 7 && c.readinessStatus !== "Ready for Staffing") {
      push(c, "Stalled in stage", `7+ days in ${c.candidateStatus}`, "escalated", c.daysInStage - 6, c.nextAction || "Review candidate", true);
    }
    if (c.followUps && c.followUps.length > 0 && c.daysInStage >= 3) {
      push(c, "Candidate no response", c.followUps[0] || "Awaiting candidate reply", "waiting", c.daysInStage - 2, "Re-message candidate");
    }
  });
  return items;
}

function toneFor(f: FollowUp): Tone {
  if (f.urgency === "High" || f.daysOverdue >= 5 || f.stage === "escalated") return "crit";
  if (f.urgency === "Medium" || f.daysOverdue >= 2) return "warn";
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
  { key: "all",          label: "All Follow-Ups" },
  { key: "overdue",      label: "Overdue" },
  { key: "high",         label: "High Priority" },
  { key: "waiting",      label: "Candidate Waiting" },
  { key: "interview",    label: "Interview" },
  { key: "offer",        label: "Offer" },
  { key: "onboarding",   label: "Onboarding" },
  { key: "orientation",  label: "Orientation" },
  { key: "staffing",     label: "Staffing Delay" },
  { key: "escalated",    label: "Escalated" },
];

export default function OSRecruitingFollowUps() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveFollowups, loading: liveFollowupsLoading } = useRecruitingFollowups();
  const { find: findCandidate } = useRecruitingCandidateLookup();

  // Active board = mapped rows from recruiting_followups. Source of truth.
  const baseFollowUps = useMemo<FollowUp[]>(
    () => liveFollowups.map((row) => mapLiveFollowupToViewModel(row, findCandidate, recruitingCandidates)),
    [liveFollowups, findCandidate, recruitingCandidates],
  );

  // Suggested = candidate-derived items NOT yet represented by a live row for that candidate.
  const suggestedFollowUps = useMemo<FollowUp[]>(() => {
    const liveCandidateIds = new Set(
      liveFollowups.map((r) => r.candidate_id).filter((x): x is string => Boolean(x)),
    );
    return buildSuggestedFollowUps(recruitingCandidates).filter(
      (s) => !liveCandidateIds.has(s.candidateId),
    );
  }, [liveFollowups, recruitingCandidates]);

  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [urgencyF, setUrgencyF] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");

  const stageOf = (f: FollowUp): StageKey => f.stage;

  const filtered = useMemo(() => {
    return baseFollowUps.filter((f) => {
      if (stateF !== "all" && f.state !== stateF) return false;
      if (recruiterF !== "all" && f.recruiter !== recruiterF) return false;
      if (urgencyF !== "all" && f.urgency !== urgencyF) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [f.candidate.name, f.recruiter, f.type, f.reason, f.state, f.candidate.region, f.candidate.candidateStatus].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(f);
      switch (activeChip) {
        case "all":         return true;
        case "overdue":     return f.daysOverdue >= 2;
        case "high":        return f.urgency === "High";
        case "waiting":     return st === "waiting";
        case "interview":   return f.type.startsWith("Interview");
        case "offer":       return f.type === "Unsigned offer";
        case "onboarding":  return st === "onboarding";
        case "orientation": return st === "orientation";
        case "staffing":    return st === "staffing" || f.staffingImpact;
        case "escalated":   return st === "escalated";
        default:            return true;
      }
    });
  }, [baseFollowUps, activeChip, search, stateF, recruiterF, urgencyF]);

  const summary = useMemo(() => {
    const has = (pred: (f: FollowUp) => boolean) => baseFollowUps.filter(pred).length;
    return {
      overdue:         has((f) => f.daysOverdue >= 2),
      stalled:         has((f) => f.candidate.daysInStage >= 5),
      noShows:         has((f) => f.type === "Interview no-show"),
      unsignedOffers:  has((f) => f.type === "Unsigned offer"),
      onboarding:      has((f) => stageOf(f) === "onboarding"),
      orientation:     has((f) => stageOf(f) === "orientation"),
      staffing:        has((f) => stageOf(f) === "staffing" || f.staffingImpact),
      escalated:       has((f) => stageOf(f) === "escalated"),
    };
  }, [baseFollowUps]);

  const grouped = useMemo(() => {
    const g: Record<StageKey, FollowUp[]> = {
      new: [], waiting: [], action: [], onboarding: [], orientation: [], staffing: [], escalated: [], completed: [],
    };
    filtered.forEach((f) => { g[stageOf(f)].push(f); });
    Object.values(g).forEach((arr) => arr.sort((a, b) => b.daysOverdue - a.daysOverdue));
    return g;
  }, [filtered]);

  const overdueQueue = useMemo(
    () => filtered.filter((f) => f.daysOverdue >= 3 || f.urgency === "High").sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 10),
    [filtered]
  );

  const staffingDelays = useMemo(
    () => filtered.filter((f) => f.staffingImpact || stageOf(f) === "staffing").sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 8),
    [filtered]
  );

  const recruiterRows = useMemo(() => {
    return recruitingRecruiters.map((name) => {
      const owned = baseFollowUps.filter((f) => f.recruiter === name);
      return {
        name,
        active:    owned.filter((f) => stageOf(f) !== "completed").length,
        overdue:   owned.filter((f) => f.daysOverdue >= 2).length,
        stalled:   owned.filter((f) => f.candidate.daysInStage >= 5).length,
        staffing:  owned.filter((f) => f.staffingImpact).length,
        completed: owned.filter((f) => stageOf(f) === "completed").length,
      };
    }).filter((r) => r.active + r.completed > 0);
  }, [baseFollowUps]);

  const activityFeed = useMemo(() => {
    return filtered.slice(0, 12).map((f) => ({
      id: f.id,
      who: f.recruiter,
      candidate: f.candidate.name,
      action: f.type,
      when: f.lastContact,
      tone: toneFor(f),
    }));
  }, [filtered]);

  const selected = selectedId ? baseFollowUps.find((f) => f.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    // id is the live recruiting_followups.id since baseFollowUps now maps live rows.
    if (to === "completed") {
      void mutations.resolveFollowup(id);
      return;
    }
    void mutations.updateFollowup(id, { status: STAGE_TO_STATUS[to] });
  }

  async function createFromSuggestion(s: FollowUp) {
    const cid = s.candidate.id;
    if (!/^[0-9a-f-]{36}$/i.test(cid)) {
      return;
    }
    setCreatingId(s.id);
    try {
      await mutations.createFollowup(cid, {
        title: s.type,
        category: s.type,
        owner: s.recruiter,
        status: STAGE_TO_STATUS[s.stage] ?? "Open",
        notes: s.reason,
      });
    } finally {
      setCreatingId(null);
    }
  }

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move";
  }
  function onDrop(e: React.DragEvent, to: StageKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveStage(id, to);
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Hiring Follow-Ups</h1>
            <p className="text-muted-foreground mt-1 text-[15px] max-w-2xl">
              Track overdue actions, stalled candidates, onboarding delays, and staffing follow-through.
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
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Tasks
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4" /> Add Follow-Up
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="rounded-2xl bg-card border border-border/70 p-3 flex items-center gap-3">
          <Search className="size-4 text-muted-foreground ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates, recruiters, follow-up reasons…"
            className="flex-1 bg-transparent outline-none text-sm h-9 placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SumCard label="Overdue follow-ups" value={summary.overdue} icon={Clock} tone={summary.overdue > 4 ? "crit" : "warn"} onClick={() => setActiveChip("overdue")} hint="2+ days overdue" />
          <SumCard label="Stalled 5+ days" value={summary.stalled} icon={AlertTriangle} tone={summary.stalled > 3 ? "crit" : "warn"} onClick={() => setActiveChip("overdue")} hint="No movement in stage" />
          <SumCard label="Interview no-shows" value={summary.noShows} icon={Calendar} tone="warn" onClick={() => setActiveChip("interview")} hint="Need reschedule" />
          <SumCard label="Unsigned offers" value={summary.unsignedOffers} icon={ClipboardList} tone={summary.unsignedOffers > 0 ? "crit" : "ok"} onClick={() => setActiveChip("offer")} hint="Outstanding offers" />
          <SumCard label="Onboarding delays" value={summary.onboarding} icon={RefreshCw} tone="warn" onClick={() => setActiveChip("onboarding")} hint="Handoff or background" />
          <SumCard label="Orientation delays" value={summary.orientation} icon={CheckCircle2} tone="warn" onClick={() => setActiveChip("orientation")} hint="Not scheduled / missed" />
          <SumCard label="Staffing handoff delays" value={summary.staffing} icon={UserPlus} tone={summary.staffing > 2 ? "crit" : "warn"} onClick={() => setActiveChip("staffing")} hint="Affecting client coverage" />
          <SumCard label="Escalated" value={summary.escalated} icon={Flame} tone={summary.escalated > 0 ? "crit" : "muted"} onClick={() => setActiveChip("escalated")} hint="Requires leadership" />
        </section>

        {/* Filter chips */}
        {liveFollowupsLoading && (
          <div className="text-xs text-muted-foreground">Loading live follow-ups…</div>
        )}
        {!liveFollowupsLoading && baseFollowUps.length === 0 && suggestedFollowUps.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">
            No live follow-ups yet. Use the <span className="font-medium text-foreground">Suggested Follow-Ups</span> section below to create one from a candidate signal.
          </div>
        )}

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

        {/* Workflow board */}
        <section className="rounded-2xl bg-card border border-border/70 p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Follow-up workflow</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drag cards across stages to update status.</p>
            </div>
            <Pill tone="info">{filtered.length} active</Pill>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {STAGES.map((s) => {
              const items = grouped[s.key];
              return (
                <div
                  key={s.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, s.key)}
                  className="rounded-xl bg-muted/40 border border-border/60 p-2 min-h-[180px]"
                >
                  <div className="flex items-center justify-between px-1.5 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map((f) => (
                      <button
                        key={f.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, f.id)}
                        onClick={() => setSelectedId(f.id)}
                        className="w-full text-left rounded-lg bg-card border border-border/60 p-2.5 hover:border-border transition hover:-translate-y-0.5"
                      >
                        <div className="text-[12px] font-medium leading-tight truncate">{f.candidate.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{f.type}</div>
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <Pill tone={toneFor(f)}>{f.daysOverdue}d overdue</Pill>
                          {f.staffingImpact && <Pill tone="warn">Staffing</Pill>}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 truncate">{f.state} · {f.recruiter}</div>
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

        {/* Overdue queue + Staffing delays */}
        <section className="grid lg:grid-cols-2 gap-4">
          <QueueCard
            title="Overdue follow-ups"
            subtitle="3+ days overdue or high urgency"
            items={overdueQueue}
            onOpen={setSelectedId}
            emptyText="No overdue hiring follow-ups right now."
          />
          <QueueCard
            title="Staffing delay follow-ups"
            subtitle="Recruiting ↔ Staffing operational gaps"
            items={staffingDelays}
            onOpen={setSelectedId}
            emptyText="No staffing coordination delays currently."
            staffingMode
          />
        </section>

        {/* Communication feed + Recruiter accountability */}
        <section className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border/70 p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold tracking-tight mb-1">Communication feed</h2>
            <p className="text-xs text-muted-foreground mb-4">Recent recruiter actions and reminders.</p>
            <div className="space-y-2.5">
              {activityFeed.length === 0 && <EmptyState text="No recent communication." />}
              {activityFeed.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className={cn("size-7 rounded-full grid place-items-center shrink-0 mt-0.5", toneClass(a.tone))}>
                    <MessageSquare className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs leading-snug">
                      <span className="font-medium">{a.who}</span>
                      <span className="text-muted-foreground"> · {a.action.toLowerCase()} · </span>
                      <span>{a.candidate}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/70 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Recruiter accountability</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Operational visibility — supportive, not punitive.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {recruiterRows.map((r) => (
                <div key={r.name} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                        {r.name.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-tight">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">{r.active} active · {r.completed} completed</div>
                      </div>
                    </div>
                    <Pill tone={r.overdue > 3 ? "crit" : r.overdue > 0 ? "warn" : "ok"}>
                      {r.overdue} overdue
                    </Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <MiniStat label="Stalled" value={r.stalled} tone={r.stalled > 0 ? "warn" : "muted"} />
                    <MiniStat label="Staffing" value={r.staffing} tone={r.staffing > 0 ? "warn" : "muted"} />
                    <MiniStat label="Done" value={r.completed} tone="ok" />
                  </div>
                </div>
              ))}
              {recruiterRows.length === 0 && <EmptyState text="No recruiters match current filters." />}
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl bg-card border border-border/70 p-4 flex flex-wrap gap-2">
          <QA icon={Plus} label="Add follow-up" />
          <QA icon={MessageSquare} label="Message candidate" />
          <QA icon={Flame} label="Escalate delay" />
          <QA icon={Bell} label="Notify staffing team" />
          <QA icon={RefreshCw} label="Resend onboarding" />
          <QA icon={Calendar} label="Resend orientation link" />
          <QA icon={UserPlus} label="Assign recruiter" />
          <QA icon={Download} label="Export queue" />
        </section>

        {/* Suggested Follow-Ups (candidate-derived, not yet in recruiting_followups) */}
        <section className="rounded-2xl bg-card border border-border/70 p-4 space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Suggested Follow-Ups</h2>
              <p className="text-xs text-muted-foreground">
                Candidate-derived signals. Click <span className="font-medium text-foreground">Create</span> to add to recruiting_followups.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{suggestedFollowUps.length} suggested</span>
          </header>
          {suggestedFollowUps.length === 0 ? (
            <div className="text-xs text-muted-foreground">No suggestions right now.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {suggestedFollowUps.slice(0, 12).map((s) => {
                const canCreate = /^[0-9a-f-]{36}$/i.test(s.candidate.id);
                const isCreating = creatingId === s.id;
                return (
                  <li key={s.id} className="flex items-center justify-between py-2 gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.candidate.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.type} · {s.recruiter} · {s.state} · {s.reason}
                      </div>
                    </div>
                    <button
                      disabled={!canCreate || isCreating}
                      onClick={() => void createFromSuggestion(s)}
                      className="h-8 px-3 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                      title={canCreate ? "Create follow-up" : "Candidate not in live table yet"}
                    >
                      <Plus className="size-3" /> {isCreating ? "Creating…" : "Create"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* AI floating */}
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
                <div className="text-[11px] text-muted-foreground">Scoped to hiring follow-ups</div>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                "Which candidates are stalled?",
                "Show overdue onboarding follow-ups.",
                "Which staffing handoffs are delayed?",
                "Who missed orientation?",
                "What follow-ups are highest priority?",
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
                placeholder="Ask about hiring follow-ups…"
                className="flex-1 h-9 rounded-lg bg-muted/60 border border-border px-3 text-xs outline-none"
              />
              <button className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:opacity-90">
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Drawer */}
        {selected && (
          <FollowUpDrawer
            f={selected}
            stage={stageOf(selected)}
            onClose={() => setSelectedId(null)}
            onMove={(to) => moveStage(selected.id, to)}
          />
        )}
      </div>
    </OSShell>
  );
}

function QueueCard({
  title, subtitle, items, onOpen, emptyText, staffingMode,
}: {
  title: string; subtitle: string; items: FollowUp[]; onOpen: (id: string) => void;
  emptyText: string; staffingMode?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <Pill tone={items.length === 0 ? "ok" : items.some((i) => toneFor(i) === "crit") ? "crit" : "warn"}>{items.length}</Pill>
      </div>
      {items.length === 0 ? (
        <EmptyState text={emptyText} positive />
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <button
              key={f.id}
              onClick={() => onOpen(f.id)}
              className="w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition p-3 flex items-center gap-3"
            >
              <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", toneClass(toneFor(f)))}>
                {staffingMode ? <UserPlus className="size-4" /> : <Clock className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{f.candidate.name}</span>
                  <span className="text-muted-foreground font-normal text-xs truncate">· {f.type}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin className="size-3" /> {f.state} · {f.recruiter} · last contact {f.lastContact}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Pill tone={toneFor(f)}>{f.daysOverdue}d</Pill>
                {f.staffingImpact && <Pill tone="warn">Staffing</Pill>}
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowUpDrawer({
  f, stage, onClose, onMove,
}: {
  f: FollowUp; stage: StageKey; onClose: () => void; onMove: (to: StageKey) => void;
}) {
  const c = f.candidate;
  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-card border-l border-border/70 z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{f.type}</div>
              <h3 className="text-xl font-semibold tracking-tight mt-0.5">{c.name}</h3>
              <div className="text-xs text-muted-foreground mt-1">{c.role} · {c.state} · {c.region}</div>
            </div>
            <button onClick={onClose} className="size-8 rounded-full hover:bg-muted grid place-items-center">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Pill tone={toneFor(f)}>{f.urgency} urgency</Pill>
            <Pill tone="warn">{f.daysOverdue}d overdue</Pill>
            {f.staffingImpact && <Pill tone="crit">Staffing impact</Pill>}
            <Pill tone="muted">Stage: {STAGES.find((s) => s.key === stage)?.label}</Pill>
          </div>

          <Section title="Follow-up details">
            <Row label="Reason" value={f.reason} />
            <Row label="Next action" value={f.nextAction} />
            <Row label="Last contact" value={f.lastContact} />
            <Row label="Recruiter" value={f.recruiter} />
          </Section>

          <Section title="Candidate workflow">
            <Row label="Hiring stage" value={c.candidateStatus} />
            <Row label="Onboarding" value={c.onboardingStatus} />
            <Row label="Background" value={c.backgroundCheck} />
            <Row label="Orientation" value={c.orientation} />
            <Row label="Readiness" value={c.readinessStatus} />
            {c.blockers.length > 0 && (
              <div className="text-[11px] text-muted-foreground pt-1">
                Blockers: <span className="text-foreground">{c.blockers.join(" · ")}</span>
              </div>
            )}
          </Section>

          <Section title="Move to stage">
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onMove(s.key)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs border transition",
                    stage === s.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/60 border-border hover:bg-muted"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Recruiter actions">
            <div className="grid grid-cols-2 gap-2">
              <DrawerAction icon={MessageSquare} label="Message candidate" />
              <DrawerAction icon={RefreshCw} label="Resend onboarding" />
              <DrawerAction icon={Calendar} label="Resend orientation" />
              <DrawerAction icon={Calendar} label="Reschedule interview" />
              <DrawerAction icon={Flame} label="Escalate staffing" />
              <DrawerAction icon={Bell} label="Notify staffing" />
              <DrawerAction icon={CheckCircle2} label="Complete follow-up" />
              <DrawerAction icon={Clock} label="Snooze 24h" />
            </div>
          </Section>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
function DrawerAction({ icon: Icon, label }: { icon: typeof MessageSquare; label: string }) {
  return (
    <button className="h-9 rounded-lg bg-muted/60 hover:bg-muted border border-border/60 text-xs inline-flex items-center gap-1.5 px-3 transition">
      <Icon className="size-3.5" /> {label}
    </button>
  );
}
function SumCard({
  label, value, hint, icon: Icon, tone, onClick,
}: {
  label: string; value: number; hint: string; icon: typeof Clock; tone: Tone; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-card border border-border/70 p-4 transition hover:border-border hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className={cn("size-7 rounded-lg grid place-items-center", toneClass(tone))}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-1.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </button>
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
function QA({ icon: Icon, label }: { icon: typeof Plus; label: string }) {
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
        {positive ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
      </div>
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>
  );
}