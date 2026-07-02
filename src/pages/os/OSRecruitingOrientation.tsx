import { runPageStageMove } from "@/lib/recruiting/stageMapping";
import { useCallback, useMemo, useState } from "react";
import {
  Search, X, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, Send, MessageSquare, UserPlus, Download,
  CalendarPlus, Bell, GraduationCap, RefreshCw, FileText,
  CalendarCheck, CalendarX, ArrowRight, ShieldCheck,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  recruitingStates,
  recruitingRoles,
  recruitingRecruiters,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { useRecruitingOrientation, fullName, type RecruitingOrientationSlot } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Candidates → Orientation Queue
// Operational visibility layer over the Monday Orientation Board. Tracks
// candidates from background-check clearance → orientation scheduled →
// attended → staffing handoff.

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "waitingReadiness",  label: "Waiting on Readiness" },
  { key: "readyForOrientation", label: "Ready for Orientation" },
  { key: "linkSent",          label: "Orientation Link Sent" },
  { key: "scheduled",         label: "Orientation Scheduled" },
  { key: "today",             label: "Orientation Today" },
  { key: "attendancePending", label: "Attendance Pending" },
  { key: "complete",          label: "Orientation Complete" },
  { key: "staffingReady",     label: "Staffing Ready" },
  { key: "blocked",           label: "Blocked" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Round-trip mapping between recruiting_orientation_slots.status and the
// board's stage keys. Live rows always win over the synthetic classifier.
const ORIENT_STATUS_TO_STAGE: Record<string, StageKey> = {
  Pending: "readyForOrientation",
  Ready: "readyForOrientation",
  Sent: "linkSent",
  "Link Sent": "linkSent",
  Scheduled: "scheduled",
  Today: "today",
  "Attendance Pending": "attendancePending",
  Attended: "complete",
  Completed: "complete",
  Complete: "complete",
  Missed: "blocked",
  Blocked: "blocked",
  "Staffing Ready": "staffingReady",
};
const STAGE_TO_ORIENT_STATUS: Partial<Record<StageKey, string>> = {
  waitingReadiness: "Pending",
  readyForOrientation: "Pending",
  linkSent: "Sent",
  scheduled: "Scheduled",
  today: "Scheduled",
  attendancePending: "Attendance Pending",
  complete: "Completed",
  staffingReady: "Completed",
  blocked: "Missed",
};
function orientStatusToStage(status: string | null | undefined, fallback: StageKey): StageKey {
  if (!status) return fallback;
  return ORIENT_STATUS_TO_STAGE[status] ?? fallback;
}

function onboardingDone(c: RecruitingCandidate) {
  return c.onboardingStatus === "Complete" || c.viventium === "Complete";
}
function bgCleared(c: RecruitingCandidate) {
  return c.backgroundCheck === "Clear";
}
function isOrientationReady(c: RecruitingCandidate) {
  return onboardingDone(c) && bgCleared(c) && c.orientation === "Not Scheduled";
}
function isStaffingBlocked(c: RecruitingCandidate) {
  if (c.readinessStatus === "Ready for Staffing") return false;
  if (!onboardingDone(c)) return true;
  if (!bgCleared(c)) return true;
  if (c.orientation === "Not Scheduled") return true;
  return false;
}

function classify(c: RecruitingCandidate): StageKey {
  if (c.readinessStatus === "Ready for Staffing") return "staffingReady";
  if (c.orientation === "Complete") return "complete";
  if (c.readinessStatus === "Blocked") return "blocked";
  if (c.orientation === "Scheduled") {
    // mark "today" if interviewAt-style timestamp not available; treat aging>=2 in scheduled as attendance pending
    if (c.daysInStage >= 3) return "attendancePending";
    return "scheduled";
  }
  // Not Scheduled
  if (!onboardingDone(c) || !bgCleared(c)) return "waitingReadiness";
  if (c.blockers.some((b) => /orientation/i.test(b))) return "linkSent";
  return "readyForOrientation";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.readinessStatus === "Ready for Staffing") return "ok";
  if (c.orientation === "Complete") return "ok";
  if (c.readinessStatus === "Blocked") return "crit";
  if (c.daysInStage >= 5) return "crit";
  if (c.daysInStage >= 3 || c.blockers.length > 0) return "warn";
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

function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const CHIPS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Candidates" },
  { key: "ready", label: "Ready for Orientation" },
  { key: "needsScheduling", label: "Needs Scheduling" },
  { key: "scheduled", label: "Scheduled" },
  { key: "attendancePending", label: "Attendance Pending" },
  { key: "missed", label: "Missed" },
  { key: "completed", label: "Completed" },
  { key: "staffingReady", label: "Staffing Ready" },
  { key: "blocked", label: "Blocked" },
];

export default function OSRecruitingOrientation() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveOrientation, loading: liveOrientLoading } = useRecruitingOrientation();
  const { candidates: liveCandidates } = useRecruitingCandidateLookup();

  // Cross-reference live orientation slot rows with live candidate rows so
  // legacy in-page candidates can be matched to real DB rows by full name.
  const liveOrientByName = useMemo(() => {
    const candidateNameById = new Map<string, string>();
    for (const lc of liveCandidates) candidateNameById.set(lc.id, fullName(lc).toLowerCase());
    const m = new Map<string, RecruitingOrientationSlot>();
    for (const o of liveOrientation) {
      const name = candidateNameById.get(o.candidate_id);
      if (name && !m.has(name)) m.set(name, o);
    }
    return m;
  }, [liveOrientation, liveCandidates]);
  const liveCandidateIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const lc of liveCandidates) m.set(fullName(lc).toLowerCase(), lc.id);
    return m;
  }, [liveCandidates]);
  const findLiveOrientFor = useCallback(
    (c: RecruitingCandidate) => liveOrientByName.get(c.name.toLowerCase()) ?? null,
    [liveOrientByName],
  );
  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [recruiter, setRecruiter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stageOf = (c: RecruitingCandidate) => {
    const live = findLiveOrientFor(c);
    if (live) return orientStatusToStage(live.status, classify(c));
    return classify(c);
  };

  // Pool: anyone past offer acceptance — orientation lifecycle eligible.
  const pool = useMemo(
    () => recruitingCandidates.filter((c) =>
      ["Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"]
        .includes(c.candidateStatus) || c.orientation !== "Not Scheduled" || c.viventium === "Complete"
    ),
    []
  );

  const candidates = useMemo(() => {
    return pool.filter((c) => {
      if (state !== "all" && c.state !== state) return false;
      if (role !== "all" && c.role !== role) return false;
      if (recruiter !== "all" && c.recruiter !== recruiter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.name, c.recruiter, c.role, c.state, c.orientation, c.onboardingStatus, c.readinessStatus, c.backgroundCheck, ...c.blockers].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all": return true;
        case "ready": return st === "readyForOrientation" || st === "linkSent";
        case "needsScheduling": return st === "readyForOrientation" || st === "linkSent";
        case "scheduled": return st === "scheduled" || st === "today";
        case "attendancePending": return st === "attendancePending";
        case "missed": return c.blockers.some((b) => /miss|no.show/i.test(b));
        case "completed": return st === "complete" || st === "staffingReady";
        case "staffingReady": return st === "staffingReady";
        case "blocked": return st === "blocked" || isStaffingBlocked(c);
        default: return true;
      }
    });
  }, [pool, activeChip, search, state, role, recruiter]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => pool.filter(pred).length;
    return {
      ready:              get((c) => stageOf(c) === "readyForOrientation"),
      notScheduled:       get(isOrientationReady),
      scheduledWeek:      get((c) => c.orientation === "Scheduled"),
      missed:             get((c) => c.blockers.some((b) => /miss|no.show/i.test(b))),
      attendancePending:  get((c) => stageOf(c) === "attendancePending" || stageOf(c) === "today"),
      complete:           get((c) => c.orientation === "Complete"),
      staffingReady:      get((c) => c.readinessStatus === "Ready for Staffing"),
      blocked:            get(isStaffingBlocked),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const attendanceQueue = useMemo(
    () => pool.filter((c) => {
      const s = stageOf(c);
      return s === "today" || s === "attendancePending" || (c.orientation === "Complete" && c.readinessStatus !== "Ready for Staffing");
    }),
    [pool]
  );

  const blockersQueue = useMemo(() => pool.filter(isStaffingBlocked), [pool]);

  const handoffQueue = useMemo(
    () => pool.filter((c) => c.orientation === "Complete" || c.readinessStatus === "Ready for Staffing"),
    [pool]
  );

  const selected = selectedId ? recruitingCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "orientation", id, to);
    const candidate = recruitingCandidates.find((c) => c.id === id);
    if (!candidate) return;
    const live = findLiveOrientFor(candidate);
    const nextStatus = STAGE_TO_ORIENT_STATUS[to];
    if (live && nextStatus && live.status !== nextStatus) {
      if (to === "complete" || to === "staffingReady") void mutations.markOrientationCompleted(live.id);
      else if (to === "blocked") {
        const uuid = liveCandidateIdByName.get(candidate.name.toLowerCase());
        if (uuid) void mutations.markOrientationMissed(uuid, "Marked missed from board");
        else void mutations.updateOrientation(live.id, { status: "Missed" });
      }
      else void mutations.updateOrientation(live.id, { status: nextStatus });
    }
  }
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDrop(e: React.DragEvent, to: StageKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveStage(id, to);
  }

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Orientation Queue</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track orientation scheduling, attendance, readiness, and staffing handoff status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Orientation Board
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4" /> Schedule Orientation
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="rounded-2xl bg-card border border-border/70 p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, recruiter, orientation status…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={state} onChange={setState} label="All States" options={recruitingStates} />
          <Select value={role} onChange={setRole} label="All Roles" options={recruitingRoles} />
          <Select value={recruiter} onChange={setRecruiter} label="All Recruiters" options={recruitingRecruiters} />
          {(search || state !== "all" || role !== "all" || recruiter !== "all") && (
            <button onClick={() => { setSearch(""); setState("all"); setRole("all"); setRecruiter("all"); }} className="h-10 px-3 rounded-xl text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1 text-sm">
              <X className="size-4" /> Clear
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <SummaryCard label="Ready for Orientation"  value={summary.ready}             icon={GraduationCap} tone="info" onClick={() => setActiveChip("ready")} />
          <SummaryCard label="Not Scheduled"          value={summary.notScheduled}      icon={CalendarPlus}  tone="warn" onClick={() => setActiveChip("needsScheduling")} />
          <SummaryCard label="Scheduled"              value={summary.scheduledWeek}     icon={CalendarCheck} tone="info" onClick={() => setActiveChip("scheduled")} />
          <SummaryCard label="Missed"                 value={summary.missed}            icon={CalendarX}     tone="crit" onClick={() => setActiveChip("missed")} />
          <SummaryCard label="Attendance Pending"     value={summary.attendancePending} icon={Clock}         tone="warn" onClick={() => setActiveChip("attendancePending")} />
          <SummaryCard label="Complete"               value={summary.complete}          icon={CheckCircle2}  tone="ok"   onClick={() => setActiveChip("completed")} />
          <SummaryCard label="Staffing Ready"         value={summary.staffingReady}     icon={ArrowRight}    tone="ok"   onClick={() => setActiveChip("staffingReady")} />
          <SummaryCard label="Blocked from Staffing"  value={summary.blocked}           icon={AlertTriangle} tone="crit" onClick={() => setActiveChip("blocked")} />
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveChip(c.key)}
              className={cn(
                "px-3 h-8 rounded-full text-xs font-medium border transition",
                activeChip === c.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border/70 hover:bg-muted"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Live vs Suggested pill summary */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Pill tone="info">{liveOrientation.length} live</Pill>
          <Pill tone="muted">{Math.max(0, pool.length - liveOrientByName.size)} suggested</Pill>
          {liveOrientLoading && <span>Loading live orientation slots…</span>}
          <span className="text-muted-foreground/70">
            Live rows persist to <code className="text-foreground/80">recruiting_orientation_slots</code>; suggested rows are orientation-ready candidates without a scheduled slot yet.
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Board */}
            <section>
              <SectionHeader title="Orientation Workflow Board" caption="Drag candidates between orientation stages" />
              <div className="grid grid-flow-col auto-cols-[280px] gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {STAGES.map((stage) => {
                  const list = candidates.filter((c) => stageOf(c) === stage.key);
                  return (
                    <div
                      key={stage.key}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop(e, stage.key)}
                      className="rounded-2xl bg-muted/40 border border-border/60 p-3 flex flex-col min-h-[220px]"
                    >
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="text-xs font-semibold tracking-tight">{stage.label}</div>
                        <div className="text-[11px] text-muted-foreground">{list.length}</div>
                      </div>
                      <div className="space-y-2 flex-1">
                        {list.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground/70 italic px-2 py-3">Empty</div>
                        ) : list.map((c) => (
                          <BoardCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} onDragStart={(e) => onDragStart(e, c.id)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Attendance & Readiness Queue */}
            <section>
              <SectionHeader title="Attendance & Readiness Queue" caption={`${attendanceQueue.length} candidate${attendanceQueue.length === 1 ? "" : "s"} needing attendance confirmation`} />
              {attendanceQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No orientations to confirm right now." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attendanceQueue.map((c) => (
                    <AttendanceCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Blockers feed */}
            <section>
              <SectionHeader title="Orientation Blockers Feed" caption={`${blockersQueue.length} candidate${blockersQueue.length === 1 ? "" : "s"} blocked from staffing`} />
              {blockersQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No staffing blockers currently." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blockersQueue.map((c) => (
                    <BlockerCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Staffing Handoff Queue */}
            <section>
              <SectionHeader title="Staffing Handoff Queue" caption="Bridges Recruiting → Staffing Operations" />
              {handoffQueue.length === 0 ? (
                <EmptyCard icon={ArrowRight} title="No candidates waiting on staffing handoff." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {handoffQueue.map((c) => (
                    <HandoffCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Suggested orientations — orientation-ready candidates without a slot */}
            {(() => {
              const suggested = pool.filter(
                (c) => !findLiveOrientFor(c) && (stageOf(c) === "readyForOrientation" || stageOf(c) === "linkSent" || isOrientationReady(c)),
              );
              if (suggested.length === 0) return null;
              const today = new Date().toISOString().slice(0, 10);
              return (
                <section>
                  <SectionHeader
                    title="Suggested orientations"
                    caption={`${suggested.length} candidate${suggested.length === 1 ? "" : "s"} ready for a recruiting_orientation_slots record`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggested.slice(0, 8).map((c) => {
                      const uuid = liveCandidateIdByName.get(c.name.toLowerCase()) ?? null;
                      return (
                        <div key={`sug-orient-${c.id}`} className="rounded-2xl bg-card border border-border/70 p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{c.role} · {c.state} · {c.recruiter}</div>
                            </div>
                            <Pill tone="muted">Suggested</Pill>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{c.nextAction}</div>
                          <div className="flex justify-end mt-3">
                            <button
                              disabled={!uuid}
                              title={uuid ? "Create a pending orientation slot" : "No matching candidate record in recruiting_candidates"}
                              onClick={() => {
                                if (!uuid) return;
                                void mutations.upsertOrientationForCandidate(uuid, {
                                  scheduled_date: today,
                                  status: "Pending",
                                  format: "Virtual",
                                });
                              }}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 transition",
                                uuid
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-muted text-muted-foreground cursor-not-allowed",
                              )}
                            >
                              <CalendarPlus className="size-3.5" /> Schedule Orientation
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })()}
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-3">Quick Actions</div>
              <div className="space-y-1.5">
                {[
                  { icon: CalendarPlus, label: "Schedule Orientation" },
                  { icon: Send, label: "Resend Orientation Link" },
                  { icon: CalendarCheck, label: "Mark Attended" },
                  { icon: CalendarX, label: "Mark Missed" },
                  { icon: Bell, label: "Notify Staffing" },
                  { icon: AlertTriangle, label: "Escalate Orientation Delay" },
                  { icon: ArrowRight, label: "Move to Staffing Ready" },
                  { icon: Download, label: "Export Orientation Queue" },
                ].map((a) => (
                  <button key={a.label} className="w-full h-9 px-3 rounded-xl text-left text-sm hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
                    <a.icon className="size-4 text-muted-foreground" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">Operational Insights</div>
                  <div className="text-[11px] text-muted-foreground">Orientation copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Who is orientation-ready?",
                  "Which candidates missed orientation?",
                  "Who is blocked from staffing?",
                  "Show candidates waiting on scheduling.",
                  "Which candidates are staffing-ready?",
                  "What orientation delays exist?",
                ].map((q) => (
                  <button key={q} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
                    <Brain className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selected && (
        <CandidateSlideout
          c={selected}
          stage={stageOf(selected)}
          onMove={(to) => moveStage(selected.id, to)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 rounded-xl bg-muted/60 border border-border text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
    >
      <option value="all">{label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {caption && <p className="text-xs text-muted-foreground mt-0.5">{caption}</p>}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone, onClick }: { label: string; value: number; icon: any; tone: Tone; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className={cn("size-7 rounded-lg grid place-items-center border", toneClass(tone))}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </button>
  );
}

function EmptyCard({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border/60 p-10 text-center">
      <Icon className="size-6 text-muted-foreground mx-auto mb-2" />
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function IconBtn({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <span title={title} className="rounded-full size-8 grid place-items-center hover:bg-muted transition cursor-pointer">
      <Icon className="size-4 text-muted-foreground" />
    </span>
  );
}

function BoardCard({ c, onOpen, onDragStart }: { c: RecruitingCandidate; onOpen: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const tone = toneFor(c);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="rounded-xl bg-card border border-border/70 p-3 hover:border-border hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{c.name}</div>
          <div className="text-[10px] text-muted-foreground">{c.role} · {c.state}</div>
        </div>
        <Pill tone={tone} className="shrink-0">{c.daysInStage}d</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">{c.nextAction}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        <Pill tone={c.orientation === "Complete" ? "ok" : c.orientation === "Scheduled" ? "info" : "muted"}>
          {c.orientation}
        </Pill>
        <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>BG: {c.backgroundCheck}</Pill>
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-2">{c.recruiter}</div>
    </div>
  );
}

function AttendanceCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">{initials(c.name)}</div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{c.name}</div>
            <div className="text-[11px] text-muted-foreground">{c.role} · {c.state} · {c.recruiter}</div>
          </div>
        </div>
        <Pill tone={c.orientation === "Complete" ? "ok" : "info"}>{c.orientation}</Pill>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.nextAction}</div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-muted-foreground">{c.daysInStage}d in stage · {c.readinessStatus}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={CalendarCheck} title="Mark Attended" />
          <IconBtn icon={CalendarX} title="Mark Missed" />
          <IconBtn icon={Bell} title="Notify Staffing" />
        </div>
      </div>
    </button>
  );
}

function BlockerCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const reason = !onboardingDone(c)
    ? "Onboarding incomplete"
    : !bgCleared(c)
      ? `Background check ${c.backgroundCheck.toLowerCase()}`
      : c.orientation === "Not Scheduled"
        ? "Orientation not scheduled"
        : c.blockers[0] ?? "Staffing handoff incomplete";
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone="warn">Staffing Blocked</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Pill tone={c.onboardingStatus === "Complete" ? "ok" : "muted"}>Onboarding {c.onboardingStatus}</Pill>
        <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>BG: {c.backgroundCheck}</Pill>
        <Pill tone={c.orientation === "Complete" ? "ok" : c.orientation === "Scheduled" ? "info" : "muted"}>Orientation: {c.orientation}</Pill>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d blocked</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Send} title="Resend Link" />
          <IconBtn icon={Bell} title="Follow Up" />
          <IconBtn icon={AlertTriangle} title="Escalate" />
        </div>
      </div>
    </button>
  );
}

function HandoffCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const ready = c.readinessStatus === "Ready for Staffing";
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={ready ? "ok" : "info"}>{ready ? "Staffing Ready" : "Awaiting Handoff"}</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{c.role} · {c.state} · {c.region}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Pill tone="muted">{c.preferredHours}</Pill>
        <Pill tone="muted">Radius {c.travelRadius}mi</Pill>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d waiting</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Bell} title="Notify Staffing" />
          <IconBtn icon={UserPlus} title="Assign Coordinator" />
          <IconBtn icon={CheckCircle2} title="Mark Staffing Complete" />
        </div>
      </div>
    </button>
  );
}

/* ---------- slideout ---------- */

function CandidateSlideout({
  c, stage, onMove, onClose,
}: {
  c: RecruitingCandidate;
  stage: StageKey;
  onMove: (to: StageKey) => void;
  onClose: () => void;
}) {
  useSlideout(true, onClose);
  const tone = toneFor(c);
  const blocked = isStaffingBlocked(c);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[520px] bg-card border-l border-border/70 shadow-[0_20px_60px_-30px_oklch(0.2_0.02_260/0.4)] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-muted grid place-items-center text-sm font-semibold">{initials(c.name)}</div>
            <div>
              <div className="text-base font-semibold tracking-tight">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.role} · {c.state} · {c.city}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{STAGES.find((s) => s.key === stage)?.label ?? stage}</Pill>
            <Pill tone={c.orientation === "Complete" ? "ok" : c.orientation === "Scheduled" ? "info" : "muted"}>Orientation: {c.orientation}</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {blocked && <Pill tone="warn">Staffing Blocked</Pill>}
          </div>

          <Block title="Candidate Overview">
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Role" v={c.role} />
            <Row k="State" v={c.state} />
            <Row k="Onboarding" v={c.onboardingStatus} />
            <Row k="Background Check" v={c.backgroundCheck} />
          </Block>

          <Block title="Orientation Details">
            <Row k="Orientation Status" v={c.orientation} />
            <Row k="Readiness" v={c.readinessStatus} />
            <Row k="Days Waiting" v={`${c.daysInStage} days`} />
            <Row k="Next Action" v={c.nextAction} />
          </Block>

          <Block title="Readiness Checklist">
            <Row k="Onboarding Complete" v={onboardingDone(c) ? "Yes" : "No"} />
            <Row k="Background Check Clear" v={bgCleared(c) ? "Yes" : "No"} />
            <Row k="Orientation Scheduled" v={c.orientation === "Scheduled" || c.orientation === "Complete" ? "Yes" : "No"} />
            <Row k="Orientation Attended" v={c.orientation === "Complete" ? "Yes" : "No"} />
            <Row k="Staffing Ready" v={c.readinessStatus === "Ready for Staffing" ? "Yes" : "No"} />
          </Block>

          <Block title="Workflow Status">
            <Row k="Blocker" v={c.blockers.length ? c.blockers.join(", ") : "—"} />
            <Row k="Staffing Handoff" v={c.readinessStatus === "Ready for Staffing" ? "Ready" : blocked ? "Blocked" : "Pending"} />
          </Block>

          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Move Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Mark Link Sent", to: "linkSent" as StageKey },
                { label: "Mark Scheduled", to: "scheduled" as StageKey },
                { label: "Mark Attended", to: "complete" as StageKey, primary: true },
                { label: "Mark Missed", to: "blocked" as StageKey },
                { label: "Attendance Pending", to: "attendancePending" as StageKey },
                { label: "Move to Staffing Ready", to: "staffingReady" as StageKey },
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => onMove(o.to)}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-medium border transition",
                    o.primary
                      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                      : "bg-card text-foreground border-border/70 hover:bg-muted"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Send, label: "Resend Orientation Link" },
                { icon: CalendarPlus, label: "Reschedule Orientation" },
                { icon: CalendarCheck, label: "Mark Attended" },
                { icon: CalendarX, label: "Mark Missed" },
                { icon: AlertTriangle, label: "Escalate Blocker" },
                { icon: Bell, label: "Notify Staffing" },
                { icon: ArrowRight, label: "Move to Staffing Ready" },
                { icon: MessageSquare, label: "Message Candidate" },
                { icon: UserPlus, label: "Assign Recruiter" },
                { icon: FileText, label: "Add Internal Note" },
                { icon: ShieldCheck, label: "Verify Readiness" },
              ].map((a) => (
                <button key={a.label} className="h-9 px-3 rounded-xl bg-card border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-xs text-foreground">
                  <a.icon className="size-3.5 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">{title}</div>
      <div className="rounded-2xl bg-muted/40 border border-border/60 divide-y divide-border/60">
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide pt-0.5">{k}</div>
      <div className="text-sm text-foreground text-right break-words max-w-[60%]">{v}</div>
    </div>
  );
}
