import { runPageStageMove } from "@/lib/recruiting/stageMapping";
import { useCallback, useMemo, useState } from "react";
import {
  Search, X, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, Send, MessageSquare, UserPlus, Download,
  CalendarPlus, Bell, ShieldCheck, ShieldAlert, GraduationCap,
  RefreshCw, FileText, Flag,
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
import { useRecruitingBackgroundChecks, fullName, type RecruitingBackgroundCheck } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Candidates → Background Checks
// Operational visibility layer above Stellar Check. Tracks candidates from
// onboarding complete → background check submission → cleared → orientation ready.

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "needsSubmission", label: "Needs Submission" },
  { key: "linkSent",        label: "Stellar Check Link Sent" },
  { key: "notStarted",      label: "Candidate Not Started" },
  { key: "initiated",       label: "Background Check Initiated" },
  { key: "pending",         label: "Pending Review" },
  { key: "flagged",         label: "Flagged" },
  { key: "cleared",         label: "Cleared" },
  { key: "orientationReady",label: "Orientation Ready" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Round-trip mapping between recruiting_background_checks.status and the
// board's stage keys. Live rows always win over the synthetic classifier.
const BG_STATUS_TO_STAGE: Record<string, StageKey> = {
  Pending: "pending",
  "In Review": "pending",
  Initiated: "initiated",
  Submitted: "initiated",
  Sent: "linkSent",
  "Link Sent": "linkSent",
  "Not Started": "notStarted",
  Blocked: "flagged",
  Flagged: "flagged",
  Delayed: "flagged",
  Cleared: "cleared",
  Clear: "cleared",
  Complete: "cleared",
};
const STAGE_TO_BG_STATUS: Partial<Record<StageKey, string>> = {
  needsSubmission: "Pending",
  linkSent: "Sent",
  notStarted: "Not Started",
  initiated: "Submitted",
  pending: "Pending",
  flagged: "Blocked",
  cleared: "Cleared",
  orientationReady: "Cleared",
};
function bgStatusToStage(status: string | null | undefined, fallback: StageKey): StageKey {
  if (!status) return fallback;
  return BG_STATUS_TO_STAGE[status] ?? fallback;
}

function classify(c: RecruitingCandidate): StageKey {
  if (c.backgroundCheck === "Delayed") return "flagged";
  if (c.backgroundCheck === "Clear") {
    if (c.orientation === "Complete" || c.readinessStatus === "Ready for Staffing") return "orientationReady";
    return "cleared";
  }
  if (c.backgroundCheck === "Pending") return "pending";
  if (c.backgroundCheck === "Sent") return "initiated";
  // Not Sent — split between needs submission vs link sent vs candidate not started
  if (c.blockers.some((b) => /stellar|background|not started/i.test(b))) return "notStarted";
  if (c.onboardingStatus === "Complete") return "needsSubmission";
  return "linkSent";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.backgroundCheck === "Delayed") return "crit";
  if (c.backgroundCheck === "Clear") return "ok";
  if (c.backgroundCheck === "Pending" && c.daysInStage >= 5) return "crit";
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

function blocksOrientation(c: RecruitingCandidate): boolean {
  if (c.onboardingStatus !== "Complete") return false;
  return c.backgroundCheck !== "Clear";
}

const CHIPS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Candidates" },
  { key: "needsSubmission", label: "Needs Submission" },
  { key: "linkSent", label: "Link Sent" },
  { key: "notStarted", label: "Not Started" },
  { key: "pending", label: "Pending" },
  { key: "flagged", label: "Flagged" },
  { key: "cleared", label: "Cleared" },
  { key: "orientationBlocked", label: "Orientation Blocked" },
  { key: "stalled", label: "Stalled" },
];

export default function OSRecruitingBackgroundChecks() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveBackground, loading: liveBackgroundLoading } = useRecruitingBackgroundChecks();
  const { candidates: liveCandidates } = useRecruitingCandidateLookup();

  // Cross-reference live background-check rows with live candidate rows so
  // legacy in-page candidates can be matched to real DB rows by full name.
  const liveBgByName = useMemo(() => {
    const candidateNameById = new Map<string, string>();
    for (const lc of liveCandidates) candidateNameById.set(lc.id, fullName(lc).toLowerCase());
    const m = new Map<string, RecruitingBackgroundCheck>();
    for (const b of liveBackground) {
      const name = candidateNameById.get(b.candidate_id);
      if (name && !m.has(name)) m.set(name, b);
    }
    return m;
  }, [liveBackground, liveCandidates]);
  const liveCandidateIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const lc of liveCandidates) m.set(fullName(lc).toLowerCase(), lc.id);
    return m;
  }, [liveCandidates]);
  const findLiveBgFor = useCallback(
    (c: RecruitingCandidate) => liveBgByName.get(c.name.toLowerCase()) ?? null,
    [liveBgByName],
  );
  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [recruiter, setRecruiter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stageOf = (c: RecruitingCandidate) => {
    const live = findLiveBgFor(c);
    if (live) return bgStatusToStage(live.status, classify(c));
    return classify(c);
  };

  // Pool: candidates eligible for background check (post-onboarding-handoff).
  const pool = useMemo(
    () => recruitingCandidates.filter((c) =>
      ["Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"]
        .includes(c.candidateStatus) || c.backgroundCheck !== "Not Sent"
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
        const hay = [c.name, c.recruiter, c.role, c.state, c.backgroundCheck, c.onboardingStatus, c.orientation, c.readinessStatus, ...c.blockers].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all": return true;
        case "needsSubmission": return st === "needsSubmission";
        case "linkSent": return st === "linkSent";
        case "notStarted": return st === "notStarted";
        case "pending": return st === "pending" || st === "initiated";
        case "flagged": return st === "flagged";
        case "cleared": return st === "cleared" || st === "orientationReady";
        case "orientationBlocked": return blocksOrientation(c);
        case "stalled": return c.daysInStage >= 5 && c.backgroundCheck !== "Clear";
        default: return true;
      }
    });
  }, [pool, activeChip, search, state, role, recruiter]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => pool.filter(pred).length;
    return {
      needsSubmission: get((c) => stageOf(c) === "needsSubmission"),
      linkSent:        get((c) => stageOf(c) === "linkSent"),
      notStarted:      get((c) => stageOf(c) === "notStarted"),
      pending:         get((c) => c.backgroundCheck === "Pending" || c.backgroundCheck === "Sent"),
      flagged:         get((c) => c.backgroundCheck === "Delayed"),
      cleared:         get((c) => c.backgroundCheck === "Clear"),
      orientationBlocked: get(blocksOrientation),
      stalled:         get((c) => c.daysInStage >= 5 && c.backgroundCheck !== "Clear"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const flaggedQueue = useMemo(
    () => pool.filter((c) => c.backgroundCheck === "Delayed"),
    [pool]
  );

  const orientationBlockers = useMemo(
    () => pool.filter(blocksOrientation),
    [pool]
  );

  const followUpQueue = useMemo(() => {
    return pool.filter((c) => {
      if (c.backgroundCheck === "Delayed") return true;
      if (c.backgroundCheck === "Pending" && c.daysInStage >= 5) return true;
      if (stageOf(c) === "notStarted" && c.daysInStage >= 2) return true;
      if (stageOf(c) === "needsSubmission" && c.daysInStage >= 2) return true;
      if (c.backgroundCheck === "Clear" && c.orientation === "Not Scheduled") return true;
      return false;
    });
  }, [pool]);

  const selected = selectedId ? recruitingCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "background", id, to);
    const candidate = recruitingCandidates.find((c) => c.id === id);
    if (!candidate) return;
    const live = findLiveBgFor(candidate);
    const nextStatus = STAGE_TO_BG_STATUS[to];
    if (live && nextStatus && live.status !== nextStatus) {
      if (to === "cleared" || to === "orientationReady") void mutations.markBackgroundCleared(live.id);
      else if (to === "flagged") void mutations.flagBackgroundBlocker(live.id, "Flagged from board");
      else void mutations.updateBackground(live.id, { status: nextStatus });
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
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Background Checks</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track Stellar Check progress, identify blockers, and support orientation readiness.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Stellar Check
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4" /> Submit Background Check
            </button>
          </div>
        </header>

        {/* Filters bar */}
        <div className="rounded-2xl bg-card border border-border/70 p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, recruiter, background status…"
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <SummaryCard label="Needs Submission"    value={summary.needsSubmission}    icon={FileText}     tone="warn" onClick={() => setActiveChip("needsSubmission")} />
          <SummaryCard label="Link Sent"           value={summary.linkSent}           icon={Send}         tone="info" onClick={() => setActiveChip("linkSent")} />
          <SummaryCard label="Not Initiated"       value={summary.notStarted}         icon={Clock}        tone="warn" onClick={() => setActiveChip("notStarted")} />
          <SummaryCard label="Pending Review"      value={summary.pending}            icon={ShieldCheck}  tone="info" onClick={() => setActiveChip("pending")} />
          <SummaryCard label="Flagged"             value={summary.flagged}            icon={Flag}         tone="crit" onClick={() => setActiveChip("flagged")} />
          <SummaryCard label="Cleared"             value={summary.cleared}            icon={CheckCircle2} tone="ok"   onClick={() => setActiveChip("cleared")} />
          <SummaryCard label="Orientation Blocked" value={summary.orientationBlocked} icon={ShieldAlert}  tone="warn" onClick={() => setActiveChip("orientationBlocked")} />
          <SummaryCard label="Stalled 5+ Days"     value={summary.stalled}            icon={AlertTriangle} tone="crit" onClick={() => setActiveChip("stalled")} />
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
          <Pill tone="info">{liveBackground.length} live</Pill>
          <Pill tone="muted">{Math.max(0, pool.length - liveBgByName.size)} suggested</Pill>
          {liveBackgroundLoading && <span>Loading live background checks…</span>}
          <span className="text-muted-foreground/70">
            Live rows persist to <code className="text-foreground/80">recruiting_background_checks</code>; suggested rows are post-onboarding candidates without a Stellar Check record yet.
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Board */}
            <section>
              <SectionHeader title="Background Check Workflow Board" caption="Drag candidates between Stellar Check stages" />
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

            {/* Flagged Review Queue */}
            <section>
              <SectionHeader title="Flagged Review Queue" caption={`${flaggedQueue.length} candidate${flaggedQueue.length === 1 ? "" : "s"} flagged for recruiter review`} />
              {flaggedQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No flagged reviews currently." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {flaggedQueue.map((c) => (
                    <FlaggedCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Orientation blockers */}
            <section>
              <SectionHeader title="Orientation Blockers Queue" caption={`${orientationBlockers.length} candidate${orientationBlockers.length === 1 ? "" : "s"} blocked from orientation`} />
              {orientationBlockers.length === 0 ? (
                <EmptyCard icon={GraduationCap} title="No orientation blockers detected." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orientationBlockers.map((c) => (
                    <BlockerCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Follow-up */}
            <section>
              <SectionHeader title="Recruiter Follow-Up Feed" caption={`${followUpQueue.length} candidate${followUpQueue.length === 1 ? "" : "s"} need recruiter attention`} />
              {followUpQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No pending background checks right now." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followUpQueue.map((c) => (
                    <FollowUpCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Suggested background checks — candidates needing a Stellar Check row */}
            {(() => {
              const suggested = pool.filter(
                (c) => !findLiveBgFor(c) && (stageOf(c) === "needsSubmission" || stageOf(c) === "linkSent" || stageOf(c) === "notStarted"),
              );
              if (suggested.length === 0) return null;
              return (
                <section>
                  <SectionHeader
                    title="Suggested background checks"
                    caption={`${suggested.length} candidate${suggested.length === 1 ? "" : "s"} ready for a recruiting_background_checks record`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggested.slice(0, 8).map((c) => {
                      const uuid = liveCandidateIdByName.get(c.name.toLowerCase()) ?? null;
                      return (
                        <div key={`sug-bg-${c.id}`} className="rounded-2xl bg-card border border-border/70 p-4">
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
                              title={uuid ? "Initiate a Stellar Check record" : "No matching candidate record in recruiting_candidates"}
                              onClick={() => {
                                if (!uuid) return;
                                void mutations.startBackgroundCheck(uuid, "Stellar Check", c.blockers[0] ?? undefined);
                              }}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 transition",
                                uuid
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-muted text-muted-foreground cursor-not-allowed",
                              )}
                            >
                              <ShieldCheck className="size-3.5" /> Submit Background Check
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
            {/* Quick actions */}
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-3">Quick Actions</div>
              <div className="space-y-1.5">
                {[
                  { icon: ShieldCheck, label: "Submit Background Check" },
                  { icon: Send, label: "Resend Stellar Check Link" },
                  { icon: CheckCircle2, label: "Mark Cleared" },
                  { icon: Flag, label: "Escalate Flagged Review" },
                  { icon: CalendarPlus, label: "Move to Orientation Ready" },
                  { icon: UserPlus, label: "Assign Recruiter" },
                  { icon: Bell, label: "Send Candidate Reminder" },
                  { icon: Download, label: "Export Background Check Queue" },
                ].map((a) => (
                  <button key={a.label} className="w-full h-9 px-3 rounded-xl text-left text-sm hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
                    <a.icon className="size-4 text-muted-foreground" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI panel */}
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">Operational Insights</div>
                  <div className="text-[11px] text-muted-foreground">Background-check copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Which candidates are stuck in pending?",
                  "Who is blocking orientation?",
                  "Which candidates have flagged checks?",
                  "Who has not started their background check?",
                  "Show candidates ready for orientation.",
                  "Which checks are stalled 5+ days?",
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

      {/* Slideout */}
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
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200"
    >
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
        <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>
          {c.backgroundCheck}
        </Pill>
        {blocksOrientation(c) && <Pill tone="warn">Orientation Blocked</Pill>}
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-2">{c.recruiter}</div>
    </div>
  );
}

function FlaggedCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
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
        <Pill tone="crit"><Flag className="size-3" /> Flagged</Pill>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.blockers[0] ?? "Awaiting recruiter review"}</div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-muted-foreground">{c.daysInStage}d in review · Staffing blocked</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={ShieldAlert} title="Escalate to Leadership" />
          <IconBtn icon={MessageSquare} title="Add Review Note" />
          <IconBtn icon={CheckCircle2} title="Mark Approved" />
        </div>
      </div>
    </button>
  );
}

function BlockerCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const reason = c.backgroundCheck === "Delayed"
    ? "Background check flagged"
    : c.backgroundCheck === "Pending" || c.backgroundCheck === "Sent"
      ? "Awaiting background check result"
      : c.backgroundCheck === "Not Sent"
        ? "Background check not submitted"
        : "Pending recruiter action";
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone="warn">Orientation Blocked</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Pill tone={c.onboardingStatus === "Complete" ? "ok" : "muted"}>Onboarding {c.onboardingStatus}</Pill>
        <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>BG: {c.backgroundCheck}</Pill>
        <Pill tone="muted">Orientation: {c.orientation}</Pill>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d blocked</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Send} title="Resend Link" />
          <IconBtn icon={Bell} title="Follow Up" />
          <IconBtn icon={CheckCircle2} title="Mark Cleared" />
        </div>
      </div>
    </button>
  );
}

function FollowUpCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  let reason: string;
  if (c.backgroundCheck === "Delayed") reason = "Flagged review delayed";
  else if (c.backgroundCheck === "Pending" && c.daysInStage >= 5) reason = "Pending 5+ days at Stellar Check";
  else if (c.backgroundCheck === "Not Sent" && c.onboardingStatus === "Complete") reason = "Background check not yet submitted";
  else if (c.backgroundCheck === "Clear" && c.orientation === "Not Scheduled") reason = "Cleared — orientation not scheduled";
  else reason = c.nextAction;
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={tone}>{c.daysInStage}d waiting</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.role}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Bell} title="Send Reminder" />
          <IconBtn icon={Send} title="Resend Link" />
          <IconBtn icon={AlertTriangle} title="Escalate" />
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
  const blocked = blocksOrientation(c);
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
            <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>BG: {c.backgroundCheck}</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {blocked && <Pill tone="warn">Orientation Blocked</Pill>}
          </div>

          <Block title="Candidate Overview">
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Role" v={c.role} />
            <Row k="State" v={c.state} />
            <Row k="Onboarding" v={c.onboardingStatus} />
            <Row k="Orientation" v={c.orientation} />
            <Row k="Readiness" v={c.readinessStatus} />
          </Block>

          <Block title="Background Check Status">
            <Row k="Stellar Check" v={c.backgroundCheck} />
            <Row k="Link Sent" v={c.backgroundCheck === "Not Sent" ? "Not yet" : "Sent"} />
            <Row k="Initiated" v={c.backgroundCheck === "Sent" || c.backgroundCheck === "Pending" || c.backgroundCheck === "Clear" || c.backgroundCheck === "Delayed" ? "Yes" : "—"} />
            <Row k="Aging" v={`${c.daysInStage} days in stage`} />
          </Block>

          <Block title="Operational Workflow">
            <Row k="Onboarding Complete" v={c.onboardingStatus === "Complete" ? "Yes" : "No"} />
            <Row k="Orientation Scheduled" v={c.orientation === "Scheduled" || c.orientation === "Complete" ? "Yes" : "No"} />
            <Row k="Staffing Blocked" v={blocked ? "Yes" : "No"} />
            <Row k="Blocker" v={c.blockers.length ? c.blockers.join(", ") : "—"} />
            <Row k="Next Action" v={c.nextAction} />
          </Block>

          {/* Stage transitions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Move Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Mark Link Sent", to: "linkSent" as StageKey },
                { label: "Mark Initiated", to: "initiated" as StageKey },
                { label: "Mark Pending", to: "pending" as StageKey },
                { label: "Flag for Review", to: "flagged" as StageKey },
                { label: "Mark Cleared", to: "cleared" as StageKey, primary: true },
                { label: "Move to Orientation Ready", to: "orientationReady" as StageKey },
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

          {/* Actions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Send, label: "Resend Stellar Check Link" },
                { icon: Bell, label: "Request Follow-Up" },
                { icon: ShieldAlert, label: "Escalate Flagged Result" },
                { icon: CheckCircle2, label: "Mark Reviewed" },
                { icon: CalendarPlus, label: "Move to Orientation Ready" },
                { icon: MessageSquare, label: "Message Candidate" },
                { icon: UserPlus, label: "Assign Recruiter" },
                { icon: FileText, label: "Add Internal Note" },
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