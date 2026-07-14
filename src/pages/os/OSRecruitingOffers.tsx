import { runPageStageMove } from "@/lib/recruiting/stageMapping";
import { useCallback, useMemo, useState } from "react";
import {
  Search, X, FileSignature, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, RefreshCw, Send, MessageSquare, UserPlus, Download,
  ChevronRight, CalendarPlus, Bell, ShieldCheck, GraduationCap, Users,
  FileText,
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
import { useRecruitingOffers, fullName, type RecruitingOffer } from "@/hooks/useRecruitingCandidates";
import { useRecruitingCandidateLookup } from "@/hooks/useRecruitingCandidateLookup";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Candidates → Offers & Hiring
// Calm operational hiring coordination center. Wired to recruitingDashboard.ts
// (operational scaffolding until Apploi / Viventium ingest lands).

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "offerReady",     label: "Offer Ready" },
  { key: "offerSent",      label: "Offer Sent" },
  { key: "awaitingSig",    label: "Awaiting Signature" },
  { key: "offerSigned",    label: "Offer Signed" },
  { key: "viventiumSetup", label: "Viventium Setup" },
  { key: "onboardingStarted",  label: "Onboarding Started" },
  { key: "onboardingComplete", label: "Onboarding Complete" },
  { key: "bgPending",      label: "Background Check Pending" },
  { key: "orientation",    label: "Orientation Scheduled" },
  { key: "staffingReady",  label: "Staffing Ready" },
] as const;
type StageKey = typeof STAGES[number]["key"];

// Round-trip mapping between recruiting_offers.status and the board's stage keys.
// Live rows always win over the synthetic classifier when present.
const OFFER_STATUS_TO_STAGE: Record<string, StageKey> = {
  Draft: "offerReady",
  Pending: "offerReady",
  Sent: "offerSent",
  Unsigned: "awaitingSig",
  Accepted: "offerSigned",
  Signed: "offerSigned",
  Declined: "offerReady",
  Withdrawn: "offerReady",
};
const STAGE_TO_OFFER_STATUS: Partial<Record<StageKey, string>> = {
  offerReady: "Draft",
  offerSent: "Sent",
  awaitingSig: "Unsigned",
  offerSigned: "Accepted",
  viventiumSetup: "Accepted",
  onboardingStarted: "Accepted",
  onboardingComplete: "Accepted",
  bgPending: "Accepted",
  orientation: "Accepted",
  staffingReady: "Accepted",
};
function offerStatusToStage(status: string | null | undefined, fallback: StageKey): StageKey {
  if (!status) return fallback;
  return OFFER_STATUS_TO_STAGE[status] ?? fallback;
}

function classify(c: RecruitingCandidate): StageKey {
  if (c.readinessStatus === "Ready for Staffing" || c.candidateStatus === "Ready for Staffing") return "staffingReady";
  if (c.orientation === "Scheduled" || c.candidateStatus === "Orientation") return "orientation";
  if (c.backgroundCheck === "Delayed" || c.backgroundCheck === "Pending" || c.backgroundCheck === "Sent") {
    if (c.onboardingStatus !== "Complete") return "bgPending";
  }
  if (c.onboardingStatus === "Complete") return "onboardingComplete";
  if (c.onboardingStatus === "Training Assigned" || c.onboardingStatus === "Orientation Scheduled"
    || c.viventium === "Complete") return "onboardingStarted";
  if (c.viventium === "Sent" || c.onboardingStatus === "Viventium Sent") return "viventiumSetup";
  if (c.offerStatus === "Accepted" || c.onboardingStatus === "Handoff Needed") return "offerSigned";
  if (c.offerStatus === "Unsigned") return "awaitingSig";
  if (c.offerStatus === "Sent") return "offerSent";
  if (c.candidateStatus === "Interview Completed" && c.eligibility === "Eligible") return "offerReady";
  return "offerReady";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.offerStatus === "Declined") return "crit";
  if (c.backgroundCheck === "Delayed") return "crit";
  if (c.offerStatus === "Unsigned" && c.daysInStage >= 2) return "crit";
  if (c.onboardingStatus !== "Complete" && c.daysInStage >= 7) return "crit";
  if (c.daysInStage >= 4 || c.blockers.length > 0) return "warn";
  if (c.readinessStatus === "Ready for Staffing") return "ok";
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

// Onboarding progress 0..1 derived from operational signals.
function onboardingPct(c: RecruitingCandidate): number {
  const checks = [
    c.viventium === "Complete" || c.viventium === "Sent",
    c.i9 === "Complete",
    c.everify === "Complete",
    c.backgroundCheck === "Clear" || c.backgroundCheck === "Pending" || c.backgroundCheck === "Sent",
    c.orientation === "Complete" || c.orientation === "Scheduled",
    c.training === "Complete" || c.training === "Assigned" || c.training === "Incomplete",
    c.centralReach === "Active" || c.centralReach === "Requested",
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

const CHIPS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All Candidates" },
  { key: "offerReady", label: "Offer Ready" },
  { key: "offerSent", label: "Offer Sent" },
  { key: "offerSigned", label: "Offer Signed" },
  { key: "onboardingStarted", label: "Onboarding Started" },
  { key: "onboardingIncomplete", label: "Onboarding Incomplete" },
  { key: "bgPending", label: "Background Check Pending" },
  { key: "orientation", label: "Orientation Scheduled" },
  { key: "staffingReady", label: "Staffing Ready" },
  { key: "stalled", label: "Stalled" },
];

const HIRING_STEPS = [
  "Offer letter sent",
  "Offer signed by candidate",
  "Viventium account created",
  "I-9 completed",
  "E-Verify completed",
  "Background check initiated",
  "Background check cleared",
  "Onboarding documents complete",
  "Orientation scheduled",
  "Orientation attended",
  "CentralReach account active",
  "Handed off to staffing",
];

export default function OSRecruitingOffers() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const { items: liveOffers, loading: liveOffersLoading } = useRecruitingOffers();
  const { candidates: liveCandidates } = useRecruitingCandidateLookup();

  // Cross-reference live offer rows with live candidate rows so we can match
  // them back to the synthetic recruiting candidates rendered in this page.
  const liveOfferByName = useMemo(() => {
    const candidateNameById = new Map<string, string>();
    for (const lc of liveCandidates) {
      candidateNameById.set(lc.id, fullName(lc).toLowerCase());
    }
    const m = new Map<string, RecruitingOffer>();
    for (const o of liveOffers) {
      const name = candidateNameById.get(o.candidate_id);
      if (name && !m.has(name)) m.set(name, o);
    }
    return m;
  }, [liveOffers, liveCandidates]);
  const liveCandidateIdByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const lc of liveCandidates) m.set(fullName(lc).toLowerCase(), lc.id);
    return m;
  }, [liveCandidates]);
  const findLiveOfferFor = useCallback(
    (c: RecruitingCandidate) => liveOfferByName.get(c.name.toLowerCase()) ?? null,
    [liveOfferByName],
  );
  const [activeChip, setActiveChip] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [recruiter, setRecruiter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});

  const stageOf = (c: RecruitingCandidate) => {
    const live = findLiveOfferFor(c);
    if (live) return offerStatusToStage(live.status, classify(c));
    return classify(c);
  };

  // Only candidates relevant to hiring (post-interview & forward).
  const hiringPool = useMemo(
    () => recruitingCandidates.filter((c) =>
      ["Interview Completed", "Offer Sent", "Offer Accepted", "Onboarding Handoff",
       "Background Check", "Orientation", "Training", "Ready for Staffing"]
        .includes(c.candidateStatus)
    ),
    []
  );

  const candidates = useMemo(() => {
    return hiringPool.filter((c) => {
      if (state !== "all" && c.state !== state) return false;
      if (role !== "all" && c.role !== role) return false;
      if (recruiter !== "all" && c.recruiter !== recruiter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.name, c.recruiter, c.role, c.state, c.offerStatus, c.onboardingStatus, c.orientation, c.readinessStatus].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all": return true;
        case "offerReady": return st === "offerReady";
        case "offerSent": return st === "offerSent" || st === "awaitingSig";
        case "offerSigned": return st === "offerSigned";
        case "onboardingStarted": return st === "onboardingStarted" || st === "viventiumSetup";
        case "onboardingIncomplete": return c.onboardingStatus !== "Complete" && (st === "onboardingStarted" || st === "viventiumSetup");
        case "bgPending": return st === "bgPending";
        case "orientation": return st === "orientation";
        case "staffingReady": return st === "staffingReady";
        case "stalled": return c.blockers.length > 0 || c.daysInStage >= 5;
        default: return true;
      }
    });
  }, [hiringPool, activeChip, search, state, role, recruiter]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => hiringPool.filter(pred).length;
    return {
      offerReady:    get((c) => stageOf(c) === "offerReady"),
      pendingSig:    get((c) => stageOf(c) === "awaitingSig" || c.offerStatus === "Unsigned"),
      signedToday:   get((c) => c.offerStatus === "Accepted" && c.daysInStage <= 1),
      onboardingInc: get((c) => c.onboardingStatus !== "Complete" && c.offerStatus === "Accepted"),
      bgPending:     get((c) => stageOf(c) === "bgPending"),
      orientationReady: get((c) => c.onboardingStatus === "Complete" && c.orientation !== "Complete"),
      staffingReady: get((c) => stageOf(c) === "staffingReady"),
      followUp:      get((c) => c.blockers.length > 0 && c.daysInStage >= 3),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiringPool]);

  const orientationQueue = useMemo(
    () => hiringPool.filter((c) => c.onboardingStatus === "Complete" || c.orientation === "Scheduled" || c.candidateStatus === "Orientation"),
    [hiringPool]
  );

  const followUpQueue = useMemo(() => {
    return hiringPool.filter((c) => {
      if (c.offerStatus === "Unsigned") return true;
      if (c.backgroundCheck === "Delayed") return true;
      if (c.onboardingStatus !== "Complete" && c.daysInStage >= 3) return true;
      if (c.onboardingStatus === "Complete" && c.orientation === "Not Scheduled") return true;
      if (c.readinessStatus === "Ready for Staffing" && c.daysInStage >= 1) return true;
      return false;
    });
  }, [hiringPool]);

  const selected = selectedId ? recruitingCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "offers", id, to);
    // Persist the offer status directly when the candidate has a live
    // recruiting_offers row. Stage moves that don't map to an offer status
    // (e.g. orientation, staffingReady) still fall back to runPageStageMove.
    const candidate = recruitingCandidates.find((c) => c.id === id);
    if (!candidate) return;
    const offer = findLiveOfferFor(candidate);
    const nextStatus = STAGE_TO_OFFER_STATUS[to];
    if (offer && nextStatus && offer.status !== nextStatus) {
      void mutations.updateOffer(offer.id, { status: nextStatus });
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

  const selectedChecks = selected ? (checks[selected.id] ?? new Array(HIRING_STEPS.length).fill(false)) : [];
  const completedSteps = selectedChecks.filter(Boolean).length;

  return (
    <OSShell>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Offers & Hiring</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track offers, onboarding progress, and hiring readiness.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <GraduationCap className="size-4" /> Start Onboarding
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Send className="size-4" /> Send Offer
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
              placeholder="Search candidate, recruiter, onboarding status…"
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
          <SummaryCard label="Offers Ready" value={summary.offerReady} icon={FileText} tone="info" onClick={() => setActiveChip("offerReady")} />
          <SummaryCard label="Pending Signatures" value={summary.pendingSig} icon={FileSignature} tone="warn" onClick={() => setActiveChip("offerSent")} />
          <SummaryCard label="Signed Today" value={summary.signedToday} icon={CheckCircle2} tone="ok" onClick={() => setActiveChip("offerSigned")} />
          <SummaryCard label="Onboarding Incomplete" value={summary.onboardingInc} icon={Clock} tone="warn" onClick={() => setActiveChip("onboardingIncomplete")} />
          <SummaryCard label="Background Pending" value={summary.bgPending} icon={ShieldCheck} tone="warn" onClick={() => setActiveChip("bgPending")} />
          <SummaryCard label="Orientation Ready" value={summary.orientationReady} icon={CalendarPlus} tone="info" onClick={() => setActiveChip("orientation")} />
          <SummaryCard label="Staffing Ready" value={summary.staffingReady} icon={Users} tone="ok" onClick={() => setActiveChip("staffingReady")} />
          <SummaryCard label="Follow-Ups Overdue" value={summary.followUp} icon={Bell} tone="crit" onClick={() => setActiveChip("stalled")} />
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
          <Pill tone="info">{liveOffers.length} live offers</Pill>
          <Pill tone="muted">{Math.max(0, hiringPool.length - liveOfferByName.size)} suggested</Pill>
          {liveOffersLoading && <span>Loading live offers…</span>}
          <span className="text-muted-foreground/70">
            Live rows persist to <code className="text-foreground/80">recruiting_offers</code>; suggested candidates are post-interview leads without an offer record yet.
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-8">
            {/* Board */}
            <section>
              <SectionHeader title="Offers Pipeline Board" caption="Drag candidates between hiring stages" />
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

            {/* Onboarding Progress Tracker */}
            <section>
              <SectionHeader title="Onboarding Progress Tracker" caption="Live Viventium + document completion" />
              {hiringPool.filter((c) => c.offerStatus === "Accepted" && c.onboardingStatus !== "Complete").length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="Everything is moving smoothly." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hiringPool
                    .filter((c) => c.offerStatus === "Accepted" && c.onboardingStatus !== "Complete")
                    .map((c) => (
                      <OnboardingRow key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                    ))}
                </div>
              )}
            </section>

            {/* Orientation Queue */}
            <section>
              <SectionHeader title="Orientation Readiness Queue" caption={`${orientationQueue.length} candidate${orientationQueue.length === 1 ? "" : "s"} approaching staffing`} />
              {orientationQueue.length === 0 ? (
                <EmptyCard icon={CalendarPlus} title="No orientation delays currently." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orientationQueue.map((c) => (
                    <OrientationCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Follow-up queue */}
            <section>
              <SectionHeader title="Hiring Follow-Up Feed" caption={`${followUpQueue.length} candidate${followUpQueue.length === 1 ? "" : "s"} need recruiter attention`} />
              {followUpQueue.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No offers waiting right now." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followUpQueue.map((c) => (
                    <FollowUpCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Suggested offers — post-interview candidates with no live offer record */}
            {(() => {
              const suggested = hiringPool.filter(
                (c) => !findLiveOfferFor(c) && (stageOf(c) === "offerReady" || stageOf(c) === "offerSent" || stageOf(c) === "awaitingSig"),
              );
              if (suggested.length === 0) return null;
              return (
                <section>
                  <SectionHeader
                    title="Suggested offers"
                    caption={`${suggested.length} candidate${suggested.length === 1 ? "" : "s"} ready for an offer record in recruiting_offers`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggested.slice(0, 8).map((c) => {
                      const uuid = liveCandidateIdByName.get(c.name.toLowerCase()) ?? null;
                      return (
                        <div key={`sug-offer-${c.id}`} className="rounded-2xl bg-card border border-border/70 p-4">
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
                              title={uuid ? "Create an offer record and mark as sent" : "No matching candidate record in recruiting_candidates"}
                              onClick={() => {
                                if (!uuid) return;
                                void mutations.sendOfferInternal(uuid, {
                                  status: "Sent",
                                  hourly_rate: c.payRate ?? null,
                                  sent_at: new Date().toISOString(),
                                  notes: c.interviewNotes || null,
                                });
                              }}
                              className={cn(
                                "h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 transition",
                                uuid
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-muted text-muted-foreground cursor-not-allowed",
                              )}
                            >
                              <Send className="size-3.5" /> Send Offer
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
                  { icon: Send, label: "Send Offer" },
                  { icon: RefreshCw, label: "Resend Offer" },
                  { icon: GraduationCap, label: "Start Onboarding" },
                  { icon: Bell, label: "Resend Onboarding" },
                  { icon: CalendarPlus, label: "Schedule Orientation" },
                  { icon: AlertTriangle, label: "Escalate Hiring Delay" },
                  { icon: UserPlus, label: "Move to Staffing" },
                  { icon: Download, label: "Export Hiring Queue" },
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
                  <div className="text-[11px] text-muted-foreground">Hiring-aware copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Which offers are unsigned?",
                  "Who is stuck in onboarding?",
                  "Which candidates are orientation-ready?",
                  "What hiring blockers exist?",
                  "Show candidates waiting on background checks.",
                  "Who is ready for staffing handoff?",
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
          onCheck={(i) => {
            setChecks((m) => {
              const arr = (m[selected.id] ?? new Array(HIRING_STEPS.length).fill(false)).slice();
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
      <div className="text-[11px] text-muted-foreground truncate">{c.nextAction}</div>
      <div className="mt-2">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/80" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-[10px] text-muted-foreground">Onboarding {pct}%</div>
          <div className="text-[10px] text-muted-foreground truncate">{c.recruiter}</div>
        </div>
      </div>
    </div>
  );
}

function OnboardingRow({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const pct = onboardingPct(c);
  const tone = toneFor(c);
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
        <Pill tone={tone}>{c.onboardingStatus}</Pill>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-muted-foreground">{pct}% complete · {c.daysInStage}d in stage</div>
        <div className="flex items-center gap-1.5">
          {c.viventium !== "Complete" && <Pill tone="muted">Viventium</Pill>}
          {c.i9 !== "Complete" && <Pill tone="warn">I-9</Pill>}
          {c.backgroundCheck === "Delayed" && <Pill tone="crit">BG Delayed</Pill>}
        </div>
      </div>
    </button>
  );
}

function OrientationCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={tone}>{c.orientation}</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{c.role} · {c.state} · {c.city}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">Recruiter: {c.recruiter}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={CalendarPlus} title="Schedule Orientation" />
          <IconBtn icon={Bell} title="Send Reminder" />
          <IconBtn icon={UserPlus} title="Move to Staffing" />
        </div>
      </div>
    </button>
  );
}

function FollowUpCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const tone = toneFor(c);
  const reason = c.blockers[0] ?? c.nextAction;
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name}</div>
        <Pill tone={tone}>{c.offerStatus}</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d waiting</div>
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
  const pct = onboardingPct(c);
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
            <Pill tone={tone}>{c.offerStatus}</Pill>
            <Pill tone="muted">{c.onboardingStatus}</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {c.blockers.map((b) => <Pill key={b} tone="warn">{b}</Pill>)}
          </div>

          {/* Offer details */}
          <Block title="Offer Details">
            <Row k="Offer Status" v={c.offerStatus} />
            <Row k="Sent" v={c.offerSentAt ?? "—"} />
            <Row k="Pay Rate" v={c.payRate ? `$${c.payRate}/hr` : "—"} />
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Notes" v={c.interviewNotes || "—"} />
          </Block>

          {/* Onboarding */}
          <Block title="Onboarding Status">
            <Row k="Viventium" v={c.viventium} />
            <Row k="I-9" v={c.i9} />
            <Row k="E-Verify" v={c.everify} />
            <Row k="CentralReach" v={c.centralReach} />
            <Row k="Progress" v={`${pct}%`} />
          </Block>

          {/* Background + Orientation */}
          <Block title="Background & Orientation">
            <Row k="Background Check" v={c.backgroundCheck} />
            <Row k="Orientation" v={c.orientation} />
            <Row k="Training" v={c.training} />
            <Row k="Readiness" v={c.readinessStatus} />
          </Block>

          {/* Workflow */}
          <Block title="Workflow Status">
            <Row k="Stage" v={STAGES.find((s) => s.key === stage)?.label ?? stage} />
            <Row k="Next Action" v={c.nextAction} />
            <Row k="Availability" v={c.availability} />
          </Block>

          {/* Hiring checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">Hiring Checklist</div>
              <div className="text-[11px] text-muted-foreground">{completedSteps} of {HIRING_STEPS.length} steps complete</div>
            </div>
            <div className="rounded-2xl bg-muted/40 border border-border/60 p-3 space-y-1">
              {HIRING_STEPS.map((step, i) => (
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
                { label: "Mark Offer Signed", to: "offerSigned" as StageKey, primary: true },
                { label: "Start Viventium", to: "viventiumSetup" as StageKey },
                { label: "Start Onboarding", to: "onboardingStarted" as StageKey },
                { label: "Schedule Orientation", to: "orientation" as StageKey },
                { label: "Move to Staffing", to: "staffingReady" as StageKey },
                { label: "Background Pending", to: "bgPending" as StageKey },
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
                { icon: Send, label: "Resend Offer" },
                { icon: RefreshCw, label: "Resend Onboarding" },
                { icon: FileText, label: "Request Missing Docs" },
                { icon: CalendarPlus, label: "Schedule Orientation" },
                { icon: AlertTriangle, label: "Escalate Blocker" },
                { icon: MessageSquare, label: "Message Candidate" },
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