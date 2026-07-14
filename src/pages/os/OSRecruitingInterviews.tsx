import { runPageStageMove } from "@/lib/recruiting/stageMapping";
import { useMemo, useState } from "react";
import {
  Search, X, CalendarClock, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, RefreshCw, Send, MessageSquare, Video, UserPlus, Download,
  ChevronRight, XCircle, ThumbsUp, CalendarPlus, Bell, MoreHorizontal,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  recruitingStates,
  recruitingRoles,
  recruitingRecruiters,
  recruitingSources,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { useRecruitingInterviews } from "@/hooks/useRecruitingCandidates";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";
import { useInterviewChecklist } from "@/hooks/useInterviewChecklist";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyApploiNotConnected } from "@/lib/recruiting/apploi";

// Recruiting → Candidates → Interviews
// Calm operational interview coordination center. Wired to recruitingDashboard.ts.
// Apploi-driven ingest is gated behind a real integration_connection — see
// notifyApploiNotConnected().

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "needsSchedule", label: "Needs Scheduling" },
  { key: "linkSent",      label: "Interview Link Sent" },
  { key: "scheduled",     label: "Scheduled" },
  { key: "confirmed",     label: "Confirmed" },
  { key: "completed",     label: "Completed" },
  { key: "needsDecision", label: "Needs Decision" },
  { key: "offerRec",      label: "Offer Recommended" },
  { key: "notMoving",     label: "Not Moving Forward" },
  { key: "noShow",        label: "No-Show" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Today's "today" anchor — interviews dataset uses 2026-04-27 as the
// operational "today" reference.
const TODAY_ISO = "2026-04-27";

function classify(c: RecruitingCandidate): StageKey {
  if (c.candidateStatus === "Not Qualified") return "notMoving";
  if (c.interviewStatus === "No-Show") return "noShow";
  if (c.candidateStatus === "Offer Sent" || c.candidateStatus === "Offer Accepted"
      || c.candidateStatus === "Onboarding Handoff" || c.candidateStatus === "Background Check"
      || c.candidateStatus === "Orientation" || c.candidateStatus === "Training"
      || c.candidateStatus === "Ready for Staffing") return "offerRec";
  if (c.interviewStatus === "Needs Outcome") return "needsDecision";
  if (c.interviewStatus === "Completed") return "completed";
  if (c.interviewStatus === "Today") return "confirmed";
  if (c.interviewStatus === "Scheduled") return "scheduled";
  if (c.candidateStatus === "Interview Scheduled") return "linkSent";
  if (c.screeningOutcome === "Pass" && c.interviewStatus === "Not Scheduled") return "needsSchedule";
  return "needsSchedule";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.interviewStatus === "No-Show") return "crit";
  if (c.interviewStatus === "Needs Outcome" && c.daysInStage >= 3) return "crit";
  if (c.daysInStage >= 7) return "crit";
  if (c.daysInStage >= 4 || c.blockers.length > 0) return "warn";
  if (c.interviewStatus === "Today") return "info";
  return "ok";
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

function formatInterviewTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function formatTimeOnly(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function isToday(iso?: string) {
  if (!iso) return false;
  return iso.startsWith(TODAY_ISO);
}

const CHIPS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Interviews" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
  { key: "needsSchedule", label: "Needs Scheduling" },
  { key: "scheduled", label: "Scheduled" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "noShow", label: "No-Show" },
  { key: "needsDecision", label: "Needs Decision" },
  { key: "offerRec", label: "Offer Recommended" },
  { key: "notMoving", label: "Not Moving Forward" },
];

const OUTCOME_STEPS = [
  "Candidate attended interview",
  "Role expectations reviewed",
  "Availability confirmed",
  "State / location fit confirmed",
  "RBT certification discussed",
  "Childcare / ABA experience discussed",
  "Pay expectations reviewed",
  "Candidate questions answered",
  "Recruiter outcome entered",
  "Next step selected",
];

export default function OSRecruitingInterviews() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  // Live interviews subscription is kept to trigger realtime refreshes of the
  // legacy mapper; the raw items aren't needed here.
  useRecruitingInterviews();
  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [recruiter, setRecruiter] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { getArray: getChecks } = useInterviewChecklist(OUTCOME_STEPS);

  // Operational Insights panel state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askBlossom(question: string) {
    if (!question.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer(null);
    // Send a compact, AI-friendly view of the *currently filtered* candidates.
    const payload = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      state: c.state,
      region: c.region,
      recruiter: c.recruiter,
      interviewer: c.interviewer,
      candidateStatus: c.candidateStatus,
      interviewStatus: c.interviewStatus,
      interviewAt: c.interviewAt ?? null,
      offerStatus: c.offerStatus,
      onboardingStatus: c.onboardingStatus,
      readinessStatus: c.readinessStatus,
      daysInStage: c.daysInStage,
      nextAction: c.nextAction,
      stage: stageOf(c),
      noShow: c.noShow,
      eligibility: c.eligibility,
      screeningOutcome: c.screeningOutcome,
      blockers: c.blockers,
    }));
    try {
      const { data, error } = await supabase.functions.invoke("ask-blossom-recruiting", {
        body: { question, candidates: payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAiAnswer((data as any)?.answer ?? "No response.");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to reach Operational Insights.";
      toast.error(msg);
      setAiAnswer(`**Error:** ${msg}`);
    } finally {
      setAiLoading(false);
    }
  }

  const stageOf = (c: RecruitingCandidate) => classify(c);

  const candidates = useMemo(() => {
    return recruitingCandidates.filter((c) => {
      if (state !== "all" && c.state !== state) return false;
      if (role !== "all" && c.role !== role) return false;
      if (recruiter !== "all" && c.recruiter !== recruiter) return false;
      if (source !== "all" && c.source !== source) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.name, c.recruiter, c.role, c.state, c.source, c.interviewStatus, c.candidateStatus, c.interviewAt ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all": return true;
        case "today": return isToday(c.interviewAt) || c.interviewStatus === "Today";
        case "tomorrow": return c.interviewAt?.startsWith("2026-04-28") ?? false;
        case "week": return !!c.interviewAt && c.interviewAt >= "2026-04-27" && c.interviewAt <= "2026-05-03";
        case "needsSchedule": return st === "needsSchedule";
        case "scheduled": return st === "scheduled" || st === "linkSent";
        case "confirmed": return st === "confirmed";
        case "completed": return st === "completed";
        case "noShow": return st === "noShow";
        case "needsDecision": return st === "needsDecision";
        case "offerRec": return st === "offerRec";
        case "notMoving": return st === "notMoving";
        default: return true;
      }
    });
  }, [activeChip, search, state, role, recruiter, source, recruitingCandidates]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => recruitingCandidates.filter(pred).length;
    return {
      today:        get((c) => isToday(c.interviewAt) || c.interviewStatus === "Today"),
      needsSchedule:get((c) => stageOf(c) === "needsSchedule"),
      awaitingConf: get((c) => stageOf(c) === "scheduled" || stageOf(c) === "linkSent"),
      completed:    get((c) => stageOf(c) === "completed"),
      noShows:      get((c) => stageOf(c) === "noShow"),
      needsDecision:get((c) => stageOf(c) === "needsDecision"),
      offerRec:     get((c) => stageOf(c) === "offerRec"),
      followUp:     get((c) => (c.blockers ?? []).length > 0 && c.daysInStage >= 3),
    };
  }, [recruitingCandidates]);

  const todays = useMemo(() => {
    return recruitingCandidates
      .filter((c) => isToday(c.interviewAt) || c.interviewStatus === "Today")
      .sort((a, b) => (a.interviewAt ?? "").localeCompare(b.interviewAt ?? ""));
  }, [recruitingCandidates]);

  const followUpQueue = useMemo(() => {
    return recruitingCandidates.filter((c) => {
      const s = stageOf(c);
      return s === "noShow" || s === "needsDecision" || (s === "offerRec" && c.offerStatus !== "Sent" && c.offerStatus !== "Accepted")
        || (s === "completed" && c.daysInStage >= 2);
    });
  }, [recruitingCandidates]);

  const selected = selectedId ? recruitingCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "interviews", id, to);
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

  const selectedChecks = selected ? getChecks(selected.id) : [];
  const completedSteps = selectedChecks.filter(Boolean).length;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Interviews</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Coordinate interviews, track outcomes, and move qualified candidates into hiring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={notifyApploiNotConnected} className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Import from Apploi
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4" /> Schedule Interview
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
              placeholder="Search candidate, recruiter, role, date…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={state} onChange={setState} label="All States" options={recruitingStates} />
          <Select value={role} onChange={setRole} label="All Roles" options={recruitingRoles} />
          <Select value={recruiter} onChange={setRecruiter} label="All Recruiters" options={recruitingRecruiters} />
          <Select value={source} onChange={setSource} label="All Sources" options={recruitingSources} />
          {(search || state !== "all" || role !== "all" || recruiter !== "all" || source !== "all") && (
            <button onClick={() => { setSearch(""); setState("all"); setRole("all"); setRecruiter("all"); setSource("all"); }} className="h-10 px-3 rounded-xl text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1 text-sm">
              <X className="size-4" /> Clear
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <SummaryCard label="Today" value={summary.today} icon={CalendarClock} tone="info" onClick={() => setActiveChip("today")} />
          <SummaryCard label="Needs Scheduling" value={summary.needsSchedule} icon={CalendarPlus} tone="warn" onClick={() => setActiveChip("needsSchedule")} />
          <SummaryCard label="Awaiting Confirm" value={summary.awaitingConf} icon={Clock} tone="ok" onClick={() => setActiveChip("scheduled")} />
          <SummaryCard label="Completed" value={summary.completed} icon={CheckCircle2} tone="ok" onClick={() => setActiveChip("completed")} />
          <SummaryCard label="No-Shows" value={summary.noShows} icon={XCircle} tone="crit" onClick={() => setActiveChip("noShow")} />
          <SummaryCard label="Needs Decision" value={summary.needsDecision} icon={AlertTriangle} tone="crit" onClick={() => setActiveChip("needsDecision")} />
          <SummaryCard label="Offer Recommended" value={summary.offerRec} icon={ThumbsUp} tone="info" onClick={() => setActiveChip("offerRec")} />
          <SummaryCard label="Follow-Up Overdue" value={summary.followUp} icon={Bell} tone="warn" onClick={() => setActiveChip("all")} />
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

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Today's Timeline */}
            <section>
              <SectionHeader title="Today's Interview Timeline" caption={`${todays.length} interview${todays.length === 1 ? "" : "s"} on deck`} />
              {todays.length === 0 ? (
                <EmptyCard icon={CalendarClock} title="No interviews scheduled for today." />
              ) : (
                <div className="space-y-2">
                  {todays.map((c) => (
                    <TimelineRow key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Board */}
            <section>
              <SectionHeader title="Interview Queue Board" caption="Drag to update workflow status" />
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

            {/* Follow-up queue */}
            <section>
              <SectionHeader title="No-Show & Follow-Up Queue" caption={`${followUpQueue.length} candidate${followUpQueue.length === 1 ? "" : "s"} need recruiter attention`} />
              {followUpQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No no-shows right now. Clean slate." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followUpQueue.map((c) => (
                    <FollowUpCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            {/* Quick actions */}
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-3">Quick Actions</div>
              <div className="space-y-1.5">
                {[
                  { icon: CalendarPlus, label: "Schedule Interview" },
                  { icon: RefreshCw, label: "Import from Apploi", onClick: notifyApploiNotConnected },
                  { icon: Bell, label: "Send Reminder" },
                  { icon: CalendarClock, label: "Reschedule Interview" },
                  { icon: XCircle, label: "Mark No-Show" },
                  { icon: ThumbsUp, label: "Recommend Offer" },
                  { icon: X, label: "Mark Not Moving Forward" },
                  { icon: Download, label: "Export Interview List" },
                ].map((a: { icon: any; label: string; onClick?: () => void }) => (
                  <button key={a.label} onClick={a.onClick} className="w-full h-9 px-3 rounded-xl text-left text-sm hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
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
                  <div className="text-[11px] text-muted-foreground">Interview-aware copilot</div>
                </div>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); askBlossom(aiQuestion); }}
                className="flex items-center gap-2 mb-3"
              >
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask about interviews, decisions, no-shows…"
                  className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {aiLoading ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  {aiLoading ? "Thinking" : "Ask"}
                </button>
              </form>
              <div className="space-y-1.5 mb-3">
                {[
                  "Who has interviews today?",
                  "Which interviews need decisions?",
                  "Who no-showed this week?",
                  "Which candidates should receive offers?",
                  "Show completed interviews missing outcomes.",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setAiQuestion(q); askBlossom(q); }}
                    disabled={aiLoading}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition inline-flex items-center gap-2 text-foreground disabled:opacity-50"
                  >
                    <Brain className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
              {(aiLoading || aiAnswer) && (
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 text-xs text-foreground max-h-96 overflow-y-auto">
                  {aiLoading && !aiAnswer ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="size-3.5 animate-spin" />
                      Analyzing {candidates.length} candidate{candidates.length === 1 ? "" : "s"}…
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs">
                      <ReactMarkdown>{aiAnswer ?? ""}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Slideout */}
      {selected && (
        <CandidateSlideout
          c={selected}
          stage={stageOf(selected)}
          checks={selectedChecks}
          completedSteps={completedSteps}
          onCheck={(i) => toggleStep(selected.id, i)}
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

function TimelineRow({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  return (
    <button onClick={onOpen} className="w-full text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
      <div className="w-20 shrink-0">
        <div className="text-sm font-semibold tracking-tight">{formatTimeOnly(c.interviewAt)}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</div>
      </div>
      <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">{initials(c.name)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-medium truncate">{c.name}</div>
          <span className="text-[11px] text-muted-foreground">· {c.role} · {c.state} · {c.city}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          Recruiter: {c.recruiter} · Interviewer: {c.interviewer} · Source: {c.source}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-1.5">
        <Pill tone={tone}>{c.interviewStatus}</Pill>
        {c.blockers.length > 0 && <Pill tone="warn">{c.blockers.length} blocker</Pill>}
      </div>
      <div className="hidden md:flex items-center gap-1">
        <IconBtn icon={Video} title="Join" />
        <IconBtn icon={Bell} title="Remind" />
        <IconBtn icon={CheckCircle2} title="Mark Complete" />
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
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
          <div className="text-[10px] text-muted-foreground">{c.role} · {c.state} · {c.city}</div>
        </div>
        <Pill tone={tone} className="shrink-0">{c.daysInStage}d</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">
        {c.interviewAt ? formatInterviewTime(c.interviewAt) : c.nextAction}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 truncate">Recruiter: {c.recruiter}</div>
    </div>
  );
}

function FollowUpCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  const reason = c.blockers[0] ?? c.nextAction;
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={tone}>{c.interviewStatus}</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d waiting</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={MessageSquare} title="Message" />
          <IconBtn icon={CalendarClock} title="Reschedule" />
          <IconBtn icon={ThumbsUp} title="Move to Offer" />
        </div>
      </div>
    </button>
  );
}

/* ---------- slideout ---------- */

function CandidateSlideout({
  c, stage, checks, completedSteps, onCheck, onMove, onClose,
}: {
  c: RecruitingCandidate;
  stage: StageKey;
  checks: boolean[];
  completedSteps: number;
  onCheck: (i: number) => void;
  onMove: (to: StageKey) => void;
  onClose: () => void;
}) {
  useSlideout(true, onClose);
  const tone = toneFor(c);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[520px] bg-card border-l border-border/70 shadow-[0_20px_60px_-30px_oklch(0.2_0.02_260/0.4)] overflow-y-auto">
        {/* header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-muted grid place-items-center text-sm font-semibold">{initials(c.name)}</div>
            <div>
              <div className="text-base font-semibold tracking-tight">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.role} · {c.state} · {c.city} · {c.source}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* status pills */}
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{c.interviewStatus}</Pill>
            <Pill tone="muted">{c.candidateStatus}</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {c.blockers.map((b) => <Pill key={b} tone="warn">{b}</Pill>)}
          </div>

          {/* Interview details */}
          <Block title="Interview Details">
            <Row k="When" v={formatInterviewTime(c.interviewAt)} />
            <Row k="Type" v={c.role === "BCBA" ? "Clinical Panel" : "Recruiter Screen"} />
            <Row k="Interviewer" v={c.interviewer} />
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Apploi Status" v={c.interviewStatus} />
            <Row k="Notes" v={c.interviewNotes || "—"} />
          </Block>

          {/* Qualification snapshot */}
          <Block title="Qualification Snapshot">
            <Row k="Resume" v={c.resume} />
            <Row k="Certification" v={c.certification} />
            <Row k="BACB Check" v={c.bacbCheck} />
            <Row k="Child Experience" v={c.kidsExperience} />
            <Row k="Availability" v={c.availability} />
            <Row k="Travel Radius" v={`${c.travelRadius} mi`} />
          </Block>

          {/* Workflow */}
          <Block title="Workflow Status">
            <Row k="Stage" v={STAGES.find((s) => s.key === stage)?.label ?? stage} />
            <Row k="Next Action" v={c.nextAction} />
            <Row k="Eligibility" v={c.eligibility} />
            <Row k="Screening Outcome" v={c.screeningOutcome} />
          </Block>

          {/* Outcome checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Interview Outcome Checklist</div>
              <div className="text-[11px] text-muted-foreground">{completedSteps} of {OUTCOME_STEPS.length} steps complete</div>
            </div>
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 space-y-1">
              {OUTCOME_STEPS.map((step, i) => (
                <label key={step} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-card cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={checks[i] ?? false}
                    onChange={() => onCheck(i)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  <span className={cn("text-sm", checks[i] && "line-through text-muted-foreground")}>{step}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                { label: "Recommend Offer", to: "offerRec" as StageKey, primary: true },
                { label: "Needs Leadership Review", to: "needsDecision" as StageKey },
                { label: "Hold", to: "completed" as StageKey },
                { label: "Not Moving Forward", to: "notMoving" as StageKey },
                { label: "No-Show", to: "noShow" as StageKey },
                { label: "Reschedule Needed", to: "scheduled" as StageKey },
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
                { icon: MessageSquare, label: "Message Candidate" },
                { icon: CalendarClock, label: "Reschedule" },
                { icon: CheckCircle2, label: "Mark Confirmed" },
                { icon: CheckCircle2, label: "Mark Completed" },
                { icon: Send, label: "Send Internal Note" },
                { icon: AlertTriangle, label: "Escalate to Lead" },
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
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">{k}</div>
      <div className="text-sm text-foreground text-right">{v}</div>
    </div>
  );
}