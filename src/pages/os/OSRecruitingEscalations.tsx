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
import { useRecruitingEscalations } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { LiveRecruitingSection, LiveRowCard } from "@/components/recruiting/LiveRecruitingSection";
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

export default function OSRecruitingEscalations() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveEscalations, loading: liveEscalationsLoading } = useRecruitingEscalations();
  const { find: findCandidate } = useRecruitingCandidateLookup();
  const base = useMemo(() => buildEscalations(recruitingCandidates), [recruitingCandidates]);

  const defaults = useMemo(() => {
    const m: Record<string, StageKey> = {};
    base.forEach((e) => { m[e.id] = e.stage; });
    return m;
  }, [base]);
  // Optimistic UI map; real status persists to recruiting_escalations.status
  // via mutations.resolveEscalation / mutations.updateMessage-style helpers.
  const [stageMap, setStageMap] = useState<Record<string, StageKey>>(defaults);
  useEffect(() => { setStageMap(defaults); }, [defaults]);
  const persistStage = (id: string, to: StageKey, _candidateId?: string) => {
    setStageMap((m) => ({ ...m, [id]: to }));
  };
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [urgencyF, setUrgencyF] = useState("all");
  const [daysF, setDaysF] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState("");

  const stageOf = (e: Esc): StageKey => stageMap[e.id] ?? e.stage;

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
  }, [base, stageMap, activeChip, search, stateF, recruiterF, urgencyF, daysF]);

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
  }, [base, stageMap]);

  const grouped = useMemo(() => {
    const g: Record<StageKey, Esc[]> = {
      new: [], recruiter: [], candidate: [], staffing: [], leadership: [], highrisk: [], resolved: [],
    };
    filtered.forEach((e) => { g[stageOf(e)].push(e); });
    Object.values(g).forEach((arr) => arr.sort((a, b) => b.daysDelayed - a.daysDelayed));
    return g;
  }, [filtered, stageMap]);

  const staffingDelays = useMemo(
    () => filtered.filter((e) => e.staffingImpact || stageOf(e) === "staffing" || e.type === "Unstaffed urgent client")
      .sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 8),
    [filtered, stageMap]
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
    [filtered, stageMap]
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
  }, [base, stageMap]);

  const selected = selectedId ? base.find((e) => e.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    const item = base.find((e) => e.id === id);
    persistStage(id, to, item?.candidate.id);
    if (item && to === 'resolved' && /^[0-9a-f-]{36}$/i.test(item.candidate.id)) void mutations.resolveEscalation(id);
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
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
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

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Live records section is intentionally above the chips so the
              primary rendered data source is the database row, not the
              candidate-derived synthetic suggestions below. */}
        </div>

        <LiveRecruitingSection
          title="Live escalations"
          subtitle="Primary source — rows from recruiting_escalations"
          tableName="recruiting_escalations"
          items={liveEscalations}
          loading={liveEscalationsLoading}
          emptyTitle="No live escalations on file"
          emptyBody="When a recruiter or the system writes to recruiting_escalations, the row will render here. The board below shows candidate-derived suggestions."
          renderRow={(row: any) => {
            const cand = row.candidate_id ? findCandidate(row.candidate_id) : null;
            const candName = cand ? `${cand.first_name} ${cand.last_name}`.trim() : (row.title ?? "Escalation");
            const tone = row.severity === "High" ? "crit" : row.severity === "Medium" ? "warn" : "info";
            const isResolved = row.status === "Resolved";
            return (
              <LiveRowCard
                title={candName}
                meta={[row.reason ?? row.title, row.owner ?? "Unassigned", `Status: ${row.status}`].filter(Boolean).join(" · ")}
                tone={isResolved ? "ok" : tone}
                badges={
                  <>
                    <Pill tone={isResolved ? "ok" : tone}>{row.severity ?? "Medium"}</Pill>
                    {isResolved && <Pill tone="ok">Resolved</Pill>}
                  </>
                }
                actions={
                  !isResolved && (
                    <button
                      onClick={() => void mutations.resolveEscalation(row.id)}
                      className="h-8 px-3 rounded-lg text-xs bg-secondary border border-border/60 hover:bg-muted transition inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="size-3" /> Resolve
                    </button>
                  )
                }
              />
            );
          }}
        />

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

        {/* Escalation board */}
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