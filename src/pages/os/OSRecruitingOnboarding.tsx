import { runPageStageMove } from "@/lib/recruiting/stageMapping";
import { useCallback, useMemo, useState } from "react";
import {
  Search, X, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, RefreshCw, Send, MessageSquare, UserPlus, Download,
  CalendarPlus, Bell, ShieldCheck, GraduationCap, Users,
  FileText, FileSignature, ClipboardList,
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
import { useRecruitingOnboarding, fullName, type RecruitingOnboardingTask } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Candidates → Onboarding Status
// Operational visibility layer above Viventium. Tracks candidates from
// offer signed → onboarding → background check → orientation ready.

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "offerSigned",         label: "Offer Signed" },
  { key: "viventiumSetup",      label: "Needs Viventium Setup" },
  { key: "onboardingSent",      label: "Onboarding Sent" },
  { key: "onboardingProgress",  label: "Onboarding In Progress" },
  { key: "missingDocs",         label: "Missing Documents" },
  { key: "onboardingComplete",  label: "Onboarding Complete" },
  { key: "addOrientationBoard", label: "Add to Orientation Board" },
  { key: "bgNeeded",            label: "Background Check Needed" },
  { key: "bgPending",           label: "Background Check Pending" },
  { key: "orientationReady",    label: "Orientation Ready" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Per-candidate live onboarding task summary aggregated from
// recruiting_onboarding_tasks. The presence of any live task means we
// prefer the live aggregate over the synthetic classifier.
type LiveOnboardingSummary = {
  total: number;
  completed: number;
  open: number;
};
function aggregateOnboarding(tasks: RecruitingOnboardingTask[]): LiveOnboardingSummary {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return { total, completed, open: total - completed };
}
function onboardingSummaryToStage(s: LiveOnboardingSummary, fallback: StageKey): StageKey {
  if (s.total === 0) return fallback;
  if (s.completed === 0) return "onboardingSent";
  if (s.completed >= s.total) return "onboardingComplete";
  return "onboardingProgress";
}

// Operational mapping of real data → onboarding stage.
function classify(c: RecruitingCandidate): StageKey {
  if (c.readinessStatus === "Ready for Staffing") return "orientationReady";
  if (c.onboardingStatus === "Complete" && c.backgroundCheck === "Clear" && c.orientation !== "Complete") return "orientationReady";
  if (c.backgroundCheck === "Pending" || c.backgroundCheck === "Sent" || c.backgroundCheck === "Delayed") return "bgPending";
  if (c.onboardingStatus === "Complete" && c.backgroundCheck === "Not Sent") return "bgNeeded";
  if (c.onboardingStatus === "Complete" && c.orientation === "Not Scheduled") return "addOrientationBoard";
  if (c.onboardingStatus === "Complete") return "onboardingComplete";
  if (c.blockers.some((b) => /missing|doc|i-?9|tax|direct deposit|cert/i.test(b))) return "missingDocs";
  if (c.viventium === "Sent" || c.onboardingStatus === "Viventium Sent" || c.onboardingStatus === "Training Assigned") return "onboardingProgress";
  if (c.viventium === "Complete") return "onboardingSent";
  if (c.offerStatus === "Accepted" && c.viventium === "Not Started") return "viventiumSetup";
  return "offerSigned";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.backgroundCheck === "Delayed") return "crit";
  if (c.onboardingStatus !== "Complete" && c.daysInStage >= 5) return "crit";
  if (c.blockers.length > 0) return "warn";
  if (c.daysInStage >= 3) return "warn";
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

// Onboarding completion % based on Viventium + document + BG signals.
function onboardingPct(c: RecruitingCandidate): number {
  const checks = [
    c.viventium === "Sent" || c.viventium === "Complete",
    c.viventium === "Complete",
    c.i9 === "Complete",
    c.everify === "Complete",
    c.onboardingStatus === "Complete" || c.onboardingStatus === "Training Assigned",
    c.backgroundCheck === "Sent" || c.backgroundCheck === "Pending" || c.backgroundCheck === "Clear",
    c.backgroundCheck === "Clear",
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// Derive missing onboarding items from real candidate state.
function missingItems(c: RecruitingCandidate): string[] {
  const items: string[] = [];
  if (c.viventium === "Not Started") items.push("Viventium setup");
  if (c.i9 !== "Complete") items.push("I-9");
  if (c.everify !== "Complete") items.push("E-Verify");
  if (c.backgroundCheck === "Not Sent") items.push("Background check consent");
  c.blockers.forEach((b) => { if (/missing|doc|tax|deposit|cert|id/i.test(b)) items.push(b); });
  return items;
}

const CHIPS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Candidates" },
  { key: "notSent", label: "Not Sent" },
  { key: "sent", label: "Sent" },
  { key: "inProgress", label: "In Progress" },
  { key: "missingDocs", label: "Missing Docs" },
  { key: "complete", label: "Complete" },
  { key: "bgNeeded", label: "BG Needed" },
  { key: "bgPending", label: "BG Pending" },
  { key: "bgClear", label: "BG Clear" },
  { key: "orientationReady", label: "Orientation Ready" },
  { key: "stalled", label: "Stalled" },
];

const ONBOARDING_STEPS = [
  "Offer signed by candidate",
  "Transitioned from Apploi to Viventium",
  "Viventium onboarding sent",
  "Tax forms completed",
  "Direct deposit submitted",
  "Identification uploaded",
  "I-9 completed",
  "E-Verify completed",
  "RBT documentation uploaded",
  "Onboarding marked complete in Viventium",
  "Added to Monday Orientation Board",
  "Background check consent signed",
  "Stellar Check link sent",
  "Background check cleared",
  "Orientation link sent",
  "Orientation scheduled",
  "Orientation attended",
  "Handed off to staffing",
];

export default function OSRecruitingOnboarding() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveOnboarding, loading: liveOnboardingLoading } = useRecruitingOnboarding();
  const { candidates: liveCandidates } = useRecruitingCandidateLookup();

  // Cross-reference live onboarding tasks with live candidate rows so legacy
  // in-page candidates can be matched to real DB rows by full name.
  const liveTasksByCandidateId = useMemo(() => {
    const m = new Map<string, RecruitingOnboardingTask[]>();
    for (const t of liveOnboarding) {
      const arr = m.get(t.candidate_id) ?? [];
      arr.push(t);
      m.set(t.candidate_id, arr);
    }
    return m;
  }, [liveOnboarding]);
  const liveOnboardingByName = useMemo(() => {
    const m = new Map<string, LiveOnboardingSummary>();
    for (const lc of liveCandidates) {
      const tasks = liveTasksByCandidateId.get(lc.id);
      if (tasks && tasks.length > 0) {
        m.set(fullName(lc).toLowerCase(), aggregateOnboarding(tasks));
      }
    }
    return m;
  }, [liveCandidates, liveTasksByCandidateId]);
  const liveCandidateIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const lc of liveCandidates) m.set(fullName(lc).toLowerCase(), lc.id);
    return m;
  }, [liveCandidates]);
  const findLiveOnboardingFor = useCallback(
    (c: RecruitingCandidate) => liveOnboardingByName.get(c.name.toLowerCase()) ?? null,
    [liveOnboardingByName],
  );
  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [recruiter, setRecruiter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});

  const stageOf = (c: RecruitingCandidate) => {
    const live = findLiveOnboardingFor(c);
    if (live) return onboardingSummaryToStage(live, classify(c));
    return classify(c);
  };

  // Pool: candidates that have signed (or are at) onboarding stages.
  const pool = useMemo(
    () => recruitingCandidates.filter((c) =>
      ["Offer Accepted", "Onboarding Handoff", "Background Check", "Orientation", "Training", "Ready for Staffing"]
        .includes(c.candidateStatus)
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
        const hay = [c.name, c.recruiter, c.role, c.state, c.onboardingStatus, c.backgroundCheck, c.orientation, ...c.blockers].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all": return true;
        case "notSent": return st === "offerSigned" || st === "viventiumSetup";
        case "sent": return st === "onboardingSent";
        case "inProgress": return st === "onboardingProgress";
        case "missingDocs": return st === "missingDocs" || missingItems(c).length > 0;
        case "complete": return c.onboardingStatus === "Complete";
        case "bgNeeded": return st === "bgNeeded";
        case "bgPending": return st === "bgPending";
        case "bgClear": return c.backgroundCheck === "Clear";
        case "orientationReady": return st === "orientationReady";
        case "stalled": return c.daysInStage >= 5 || c.blockers.length > 0;
        default: return true;
      }
    });
  }, [pool, activeChip, search, state, role, recruiter]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => pool.filter(pred).length;
    return {
      notSent:        get((c) => c.viventium === "Not Started" && c.offerStatus === "Accepted"),
      inProgress:     get((c) => stageOf(c) === "onboardingProgress" || stageOf(c) === "onboardingSent"),
      missingDocs:    get((c) => missingItems(c).length > 0 && c.onboardingStatus !== "Complete"),
      complete:       get((c) => c.onboardingStatus === "Complete"),
      bgNeeded:       get((c) => stageOf(c) === "bgNeeded"),
      bgPending:      get((c) => stageOf(c) === "bgPending"),
      orientationReady: get((c) => stageOf(c) === "orientationReady"),
      stalled:        get((c) => c.daysInStage >= 5 && c.onboardingStatus !== "Complete"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const missingFeed = useMemo(
    () => pool
      .map((c) => ({ c, items: missingItems(c) }))
      .filter((x) => x.items.length > 0 && x.c.onboardingStatus !== "Complete"),
    [pool]
  );

  const orientationQueue = useMemo(
    () => pool.filter((c) =>
      c.onboardingStatus === "Complete" || c.backgroundCheck === "Clear" || c.orientation !== "Not Scheduled"
    ),
    [pool]
  );

  const followUpQueue = useMemo(() => {
    return pool.filter((c) => {
      if (c.backgroundCheck === "Delayed") return true;
      if (c.viventium === "Sent" && c.onboardingStatus !== "Complete" && c.daysInStage >= 3) return true;
      if (c.onboardingStatus !== "Complete" && missingItems(c).length > 0 && c.daysInStage >= 2) return true;
      if (c.onboardingStatus === "Complete" && c.backgroundCheck === "Not Sent") return true;
      if (c.onboardingStatus === "Complete" && c.orientation === "Not Scheduled") return true;
      if (c.daysInStage >= 5 && c.onboardingStatus !== "Complete") return true;
      return false;
    });
  }, [pool]);

  const selected = selectedId ? recruitingCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "onboarding", id, to);
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

  const selectedChecks = selected ? (checks[selected.id] ?? new Array(ONBOARDING_STEPS.length).fill(false)) : [];
  const completedSteps = selectedChecks.filter(Boolean).length;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Onboarding Status</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track onboarding progress, missing items, background checks, and orientation readiness.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Sync Viventium
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4" /> Add to Orientation Board
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
              placeholder="Search candidate, missing item, status…"
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
          <SummaryCard label="Not Sent"            value={summary.notSent}        icon={FileSignature} tone="warn" onClick={() => setActiveChip("notSent")} />
          <SummaryCard label="In Progress"         value={summary.inProgress}     icon={Clock}         tone="info" onClick={() => setActiveChip("inProgress")} />
          <SummaryCard label="Missing Documents"   value={summary.missingDocs}    icon={FileText}      tone="warn" onClick={() => setActiveChip("missingDocs")} />
          <SummaryCard label="Onboarding Complete" value={summary.complete}       icon={CheckCircle2}  tone="ok"   onClick={() => setActiveChip("complete")} />
          <SummaryCard label="BG Check Needed"     value={summary.bgNeeded}       icon={ShieldCheck}   tone="warn" onClick={() => setActiveChip("bgNeeded")} />
          <SummaryCard label="BG Check Pending"    value={summary.bgPending}      icon={ShieldCheck}   tone="info" onClick={() => setActiveChip("bgPending")} />
          <SummaryCard label="Orientation Ready"   value={summary.orientationReady} icon={GraduationCap} tone="ok" onClick={() => setActiveChip("orientationReady")} />
          <SummaryCard label="Stalled 5+ Days"     value={summary.stalled}        icon={AlertTriangle} tone="crit" onClick={() => setActiveChip("stalled")} />
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
          <Pill tone="info">{liveOnboardingByName.size} live</Pill>
          <Pill tone="muted">{Math.max(0, pool.length - liveOnboardingByName.size)} suggested</Pill>
          {liveOnboardingLoading && <span>Loading live onboarding tasks…</span>}
          <span className="text-muted-foreground/70">
            Live rows persist to <code className="text-foreground/80">recruiting_onboarding_tasks</code>; suggested rows are accepted-offer candidates without a task list yet.
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Board */}
            <section>
              <SectionHeader title="Onboarding Status Board" caption="Drag candidates between onboarding stages" />
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

            {/* Missing Items Tracker */}
            <section>
              <SectionHeader title="Missing Items Tracker" caption={`${missingFeed.length} candidate${missingFeed.length === 1 ? "" : "s"} with outstanding documents`} />
              {missingFeed.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="All onboarding documents are complete." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missingFeed.map(({ c, items }) => (
                    <MissingItemCard key={c.id} c={c} items={items} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Orientation readiness queue */}
            <section>
              <SectionHeader title="Orientation Readiness Queue" caption={`${orientationQueue.length} candidate${orientationQueue.length === 1 ? "" : "s"} approaching orientation`} />
              {orientationQueue.length === 0 ? (
                <EmptyCard icon={GraduationCap} title="No candidates are orientation-ready yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orientationQueue.map((c) => (
                    <OrientationCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Follow-up feed */}
            <section>
              <SectionHeader title="Onboarding Follow-Up Feed" caption={`${followUpQueue.length} candidate${followUpQueue.length === 1 ? "" : "s"} need recruiter attention`} />
              {followUpQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No onboarding blockers right now." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followUpQueue.map((c) => (
                    <FollowUpCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Suggested onboarding — accepted candidates without a task list */}
            {(() => {
              const suggested = pool.filter(
                (c) => !findLiveOnboardingFor(c) && c.onboardingStatus !== "Complete",
              );
              if (suggested.length === 0) return null;
              return (
                <section>
                  <SectionHeader
                    title="Suggested onboarding"
                    caption={`${suggested.length} candidate${suggested.length === 1 ? "" : "s"} ready for a recruiting_onboarding_tasks task list`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggested.slice(0, 8).map((c) => {
                      const uuid = liveCandidateIdByName.get(c.name.toLowerCase()) ?? null;
                      return (
                        <div key={`sug-onb-${c.id}`} className="rounded-2xl bg-card border border-border/70 p-4">
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
                              title={uuid ? "Seed default onboarding tasks" : "No matching candidate record in recruiting_candidates"}
                              onClick={() => {
                                if (!uuid) return;
                                void mutations.ensureDefaultOnboardingTasks(uuid);
                              }}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 transition",
                                uuid
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-muted text-muted-foreground cursor-not-allowed",
                              )}
                            >
                              <ClipboardList className="size-3.5" /> Seed Onboarding Tasks
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
                  { icon: RefreshCw, label: "Sync Viventium" },
                  { icon: Send, label: "Resend Onboarding" },
                  { icon: FileText, label: "Request Missing Docs" },
                  { icon: ShieldCheck, label: "Submit Background Check" },
                  { icon: CalendarPlus, label: "Add to Orientation Board" },
                  { icon: GraduationCap, label: "Schedule Orientation" },
                  { icon: AlertTriangle, label: "Escalate Onboarding Delay" },
                  { icon: Download, label: "Export Onboarding Queue" },
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
                  <div className="text-[11px] text-muted-foreground">Onboarding-aware copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Who is stuck in onboarding?",
                  "Which candidates are missing documents?",
                  "Who needs a background check submitted?",
                  "Who is orientation ready?",
                  "Which candidates have been inactive 5+ days?",
                  "Who can move to staffing next?",
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
          checks={selectedChecks}
          completedSteps={completedSteps}
          missing={missingItems(selected)}
          onCheck={(i) => {
            setChecks((m) => {
              const arr = (m[selected.id] ?? new Array(ONBOARDING_STEPS.length).fill(false)).slice();
              arr[i] = !arr[i];
              return { ...m, [selected.id]: arr };
            });
          }}
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
  const pct = onboardingPct(c);
  const missing = missingItems(c).length;
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
      <div className="mt-2">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-[10px] text-muted-foreground">Onboarding {pct}%</div>
          <div className="text-[10px] text-muted-foreground truncate">{c.recruiter}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {missing > 0 && <Pill tone="warn">{missing} missing</Pill>}
        {c.backgroundCheck === "Delayed" && <Pill tone="crit">BG Delayed</Pill>}
        {c.backgroundCheck === "Clear" && <Pill tone="ok">BG Clear</Pill>}
        {c.orientation === "Scheduled" && <Pill tone="info">Orientation</Pill>}
      </div>
    </div>
  );
}

function MissingItemCard({ c, items, onOpen }: { c: RecruitingCandidate; items: string[]; onOpen: () => void }) {
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
        <Pill tone="warn">{items.length} missing</Pill>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.slice(0, 4).map((it) => <Pill key={it} tone="muted">{it}</Pill>)}
        {items.length > 4 && <Pill tone="muted">+{items.length - 4}</Pill>}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-muted-foreground">{c.daysInStage}d in stage</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={Bell} title="Send Reminder" />
          <IconBtn icon={MessageSquare} title="Message Candidate" />
          <IconBtn icon={AlertTriangle} title="Escalate" />
        </div>
      </div>
    </button>
  );
}

function OrientationCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  const ready = c.onboardingStatus === "Complete" && c.backgroundCheck === "Clear" && c.orientation === "Complete";
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={ready ? "ok" : tone}>{ready ? "Staffing Ready" : c.orientation}</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{c.role} · {c.state}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Pill tone={c.onboardingStatus === "Complete" ? "ok" : "muted"}>Onboarding</Pill>
        <Pill tone={c.backgroundCheck === "Clear" ? "ok" : c.backgroundCheck === "Delayed" ? "crit" : "muted"}>BG: {c.backgroundCheck}</Pill>
        <Pill tone={c.orientation === "Complete" ? "ok" : "muted"}>Orientation: {c.orientation}</Pill>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">Recruiter: {c.recruiter}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={CalendarPlus} title="Schedule Orientation" />
          <IconBtn icon={Send} title="Resend Orientation Link" />
          <IconBtn icon={UserPlus} title="Move to Staffing" />
        </div>
      </div>
    </button>
  );
}

function FollowUpCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  let reason = c.blockers[0];
  if (!reason) {
    if (c.backgroundCheck === "Delayed") reason = "Background check delayed";
    else if (c.onboardingStatus !== "Complete" && c.viventium === "Sent") reason = "Onboarding incomplete in Viventium";
    else if (c.onboardingStatus === "Complete" && c.backgroundCheck === "Not Sent") reason = "Background check not initiated";
    else if (c.onboardingStatus === "Complete" && c.orientation === "Not Scheduled") reason = "Orientation not scheduled";
    else reason = c.nextAction;
  }
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
          <IconBtn icon={MessageSquare} title="Message" />
          <IconBtn icon={AlertTriangle} title="Escalate" />
        </div>
      </div>
    </button>
  );
}

/* ---------- slideout ---------- */

function CandidateSlideout({
  c, stage, checks, completedSteps, missing, onCheck, onMove, onClose,
}: {
  c: RecruitingCandidate;
  stage: StageKey;
  checks: boolean[];
  completedSteps: number;
  missing: string[];
  onCheck: (i: number) => void;
  onMove: (to: StageKey) => void;
  onClose: () => void;
}) {
  useSlideout(true, onClose);
  const tone = toneFor(c);
  const pct = onboardingPct(c);
  const ready = c.onboardingStatus === "Complete" && c.backgroundCheck === "Clear" && c.orientation === "Complete";
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
              <div className="text-xs text-muted-foreground">{c.role} · {c.state} · {c.city}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* status pills */}
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{STAGES.find((s) => s.key === stage)?.label ?? stage}</Pill>
            <Pill tone="muted">{c.onboardingStatus}</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {missing.length > 0 && <Pill tone="warn">{missing.length} missing</Pill>}
            {ready && <Pill tone="ok">Staffing Ready</Pill>}
          </div>

          {/* Candidate overview */}
          <Block title="Candidate Overview">
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Role" v={c.role} />
            <Row k="State" v={c.state} />
            <Row k="Offer Signed" v={c.offerSentAt ?? "—"} />
          </Block>

          {/* Viventium */}
          <Block title="Viventium Status">
            <Row k="Viventium" v={c.viventium} />
            <Row k="I-9" v={c.i9} />
            <Row k="E-Verify" v={c.everify} />
            <Row k="Progress" v={`${pct}%`} />
            <Row k="Missing Items" v={missing.length ? missing.join(", ") : "None"} />
          </Block>

          {/* Background check */}
          <Block title="Background Check">
            <Row k="Status" v={c.backgroundCheck} />
            <Row k="Stellar Check" v={c.backgroundCheck === "Not Sent" ? "Not sent" : "Sent"} />
          </Block>

          {/* Orientation */}
          <Block title="Orientation">
            <Row k="Status" v={c.orientation} />
            <Row k="Training" v={c.training} />
            <Row k="Readiness" v={c.readinessStatus} />
          </Block>

          {/* Workflow */}
          <Block title="Workflow Status">
            <Row k="Next Action" v={c.nextAction} />
            <Row k="Blockers" v={c.blockers.length ? c.blockers.join(", ") : "—"} />
            <Row k="Staffing Handoff" v={ready ? "Ready" : "Pending requirements"} />
          </Block>

          {/* Onboarding checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Onboarding Checklist</div>
              <div className="text-[11px] text-muted-foreground">{completedSteps} of {ONBOARDING_STEPS.length} steps complete</div>
            </div>
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 space-y-1">
              {ONBOARDING_STEPS.map((step, i) => (
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
                { label: "Mark Onboarding Sent", to: "onboardingSent" as StageKey },
                { label: "Mark In Progress", to: "onboardingProgress" as StageKey },
                { label: "Flag Missing Docs", to: "missingDocs" as StageKey },
                { label: "Mark Complete", to: "onboardingComplete" as StageKey, primary: true },
                { label: "Submit Background Check", to: "bgPending" as StageKey },
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
                { icon: RefreshCw, label: "Resend Onboarding" },
                { icon: FileText, label: "Request Missing Docs" },
                { icon: ShieldCheck, label: "Submit Background Check" },
                { icon: Send, label: "Resend Stellar Check" },
                { icon: ClipboardList, label: "Add to Orientation Board" },
                { icon: CalendarPlus, label: "Schedule Orientation" },
                { icon: MessageSquare, label: "Message Candidate" },
                { icon: AlertTriangle, label: "Escalate Blocker" },
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