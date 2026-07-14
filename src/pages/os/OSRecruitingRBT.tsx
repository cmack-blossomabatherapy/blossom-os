import { runPageStageMove, mapRbtStageToCanonical } from "@/lib/recruiting/stageMapping";
import { useMemo, useState } from "react";
import {
  Search, X, AlertTriangle, CheckCircle2, Clock, Sparkles, Brain, Send,
  MessageSquare, UserPlus, Download, Bell, Building2, Flame, Plus, RefreshCw,
  ArrowRight, MapPin, Users, GraduationCap, BadgeCheck, ShieldCheck, Link2,
  CalendarClock,
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
import { getClientStaffingNeeds, type StaffingClientNeed } from "@/data/staffing";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";
import { notifyApploiNotConnected } from "@/lib/recruiting/apploi";

// Recruiting → Staffing & Operations → RBT Recruiting
// Operational command center for RBT pipeline health, staffing demand,
// onboarding/orientation readiness, and escalations.

type Tone = "ok" | "warn" | "crit" | "muted" | "info";

const STAGES = [
  { key: "newApplicant",     label: "New Applicant" },
  { key: "needsReview",      label: "Needs Review" },
  { key: "bacbVerification", label: "BACB Verification" },
  { key: "interviewReady",   label: "Interview Ready" },
  { key: "interviewed",      label: "Interviewed" },
  { key: "offerSent",        label: "Offer Sent" },
  { key: "onboarding",       label: "Onboarding" },
  { key: "backgroundCheck",  label: "Background Check" },
  { key: "orientationReady", label: "Orientation Ready" },
  { key: "staffingReady",    label: "Staffing Ready" },
] as const;
type StageKey = typeof STAGES[number]["key"];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function needs40Hour(c: RecruitingCandidate) {
  return c.certification === "Missing" || c.certification === "Pending";
}
function needsBACB(c: RecruitingCandidate) {
  return c.bacbCheck === "Pending" || c.bacbCheck === "Not Started";
}
function isRBTCertified(c: RecruitingCandidate) {
  return c.certification === "Verified" && c.bacbCheck === "Clear";
}
function isStalled(c: RecruitingCandidate) {
  return c.daysInStage >= 6 || c.blockers.length >= 2 || c.interviewStatus === "No-Show";
}
function isOrientationReady(c: RecruitingCandidate) {
  return c.orientation === "Complete" && c.backgroundCheck === "Clear" && c.readinessStatus !== "Ready for Staffing";
}
function isStaffingReady(c: RecruitingCandidate) {
  return c.readinessStatus === "Ready for Staffing";
}

function classify(c: RecruitingCandidate): StageKey {
  if (isStaffingReady(c)) return "staffingReady";
  if (isOrientationReady(c)) return "orientationReady";
  if (c.candidateStatus === "Background Check" || c.backgroundCheck === "Sent" || c.backgroundCheck === "Pending" || c.backgroundCheck === "Delayed") return "backgroundCheck";
  if (["Onboarding Handoff", "Offer Accepted", "Training", "Orientation"].includes(c.candidateStatus)) return "onboarding";
  if (c.candidateStatus === "Offer Sent" || c.offerStatus === "Sent" || c.offerStatus === "Unsigned") return "offerSent";
  if (c.candidateStatus === "Interview Completed" || c.interviewStatus === "Needs Outcome" || c.interviewStatus === "Completed") return "interviewed";
  if (c.candidateStatus === "Interview Scheduled" || c.interviewStatus === "Scheduled" || c.interviewStatus === "Today") return "interviewReady";
  if (needsBACB(c) && c.screeningOutcome === "Pass") return "bacbVerification";
  if (c.candidateStatus === "Screening" || c.screeningOutcome === "Pending") return "needsReview";
  return "newApplicant";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (isStalled(c) || c.readinessStatus === "Blocked") return "crit";
  if (c.daysInStage >= 4 || c.blockers.length > 0) return "warn";
  if (isStaffingReady(c) || isOrientationReady(c)) return "ok";
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
  { key: "all",         label: "All RBT Candidates" },
  { key: "new",         label: "New Applicants" },
  { key: "certified",   label: "RBT Certified" },
  { key: "needsBacb",   label: "Needs BACB Verification" },
  { key: "needs40",     label: "Needs 40-Hour Course" },
  { key: "interview",   label: "Interview Ready" },
  { key: "onboarding",  label: "Onboarding" },
  { key: "orientation", label: "Orientation Ready" },
  { key: "staffing",    label: "Staffing Ready" },
  { key: "stalled",     label: "Stalled" },
];

const URGENCY_OPTS = ["High", "Medium", "Low"] as const;
const SOURCE_OPTS = ["Apploi", "Indeed", "Website", "Email", "Phone", "Referral"];

function urgencyForCandidate(c: RecruitingCandidate): typeof URGENCY_OPTS[number] {
  const key = `${c.state}-${c.region}`;
  const demand = staffingDemandByRegion[key]?.demand ?? 0;
  if (demand >= 4 || c.state === "GA") return "High";
  if (demand >= 3) return "Medium";
  return "Low";
}

export default function OSRecruitingRBT() {
  const recruitingCandidates = useLegacyRecruitingCandidates();
  const mutations = useRecruitingMutations();
  const baseCandidates = useMemo(
    () => recruitingCandidates.filter((c) => c.role === "RBT"),
    []
  );
  const [activeChip, setActiveChip] = useState("all");
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [urgencyF, setUrgencyF] = useState("all");
  const [sourceF, setSourceF] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stageOf = (c: RecruitingCandidate) => classify(c);

  const staffingNeeds = useMemo(() => getClientStaffingNeeds().filter((n) => n.client.bcba), []);

  const filtered = useMemo(() => {
    return baseCandidates.filter((c) => {
      if (stateF !== "all" && c.state !== stateF) return false;
      if (recruiterF !== "all" && c.recruiter !== recruiterF) return false;
      if (urgencyF !== "all" && urgencyForCandidate(c) !== urgencyF) return false;
      if (sourceF !== "all" && c.source !== sourceF) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.name, c.state, c.region, c.city, c.recruiter, c.candidateStatus, c.onboardingStatus, c.readinessStatus, c.certification, c.source].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const st = stageOf(c);
      switch (activeChip) {
        case "all":         return true;
        case "new":         return st === "newApplicant";
        case "certified":   return isRBTCertified(c);
        case "needsBacb":   return needsBACB(c);
        case "needs40":     return needs40Hour(c);
        case "interview":   return st === "interviewReady" || st === "interviewed";
        case "onboarding":  return st === "onboarding" || st === "backgroundCheck";
        case "orientation": return st === "orientationReady";
        case "staffing":    return st === "staffingReady";
        case "stalled":     return isStalled(c);
        default:            return true;
      }
    });
  }, [baseCandidates, activeChip, search, stateF, recruiterF, urgencyF, sourceF]);

  const summary = useMemo(() => {
    const get = (pred: (c: RecruitingCandidate) => boolean) => baseCandidates.filter(pred).length;
    return {
      newApplicants:    get((c) => stageOf(c) === "newApplicant"),
      certified:        get(isRBTCertified),
      needsBacb:        get(needsBACB),
      needs40:          get(needs40Hour),
      orientationReady: get((c) => isOrientationReady(c) || isStaffingReady(c)),
      gaGaps:           Object.entries(staffingDemandByRegion).filter(([k]) => k.startsWith("GA-")).reduce((a, [, v]) => a + v.demand, 0),
      urgentStaffing:   staffingNeeds.filter((n) => n.priority === "High").length,
      stalled:          get(isStalled),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCandidates, staffingNeeds]);

  const orientationReadyList = useMemo(
    () => baseCandidates.filter((c) => isOrientationReady(c) || isStaffingReady(c)),
    [baseCandidates]
  );

  const escalations = useMemo(
    () => baseCandidates.filter((c) => isStalled(c) || c.readinessStatus === "Blocked"),
    [baseCandidates]
  );

  const pressureFeed = useMemo(() => {
    return Object.entries(staffingDemandByRegion)
      .map(([key, v]) => {
        const [state, ...rest] = key.split("-");
        const region = rest.join("-");
        const ready = baseCandidates.filter((c) => c.state === state && c.region === region && (isOrientationReady(c) || isStaffingReady(c))).length;
        const active = baseCandidates.filter((c) => c.state === state && c.region === region).length;
        return { key, state, region, demand: v.demand, priorityRole: v.priorityRole, ready, active };
      })
      .filter((r) => r.priorityRole === "RBT")
      .sort((a, b) => (b.demand - b.ready) - (a.demand - a.ready));
  }, [baseCandidates]);

  const selected = selectedId ? baseCandidates.find((c) => c.id === selectedId) ?? null : null;

  function moveStage(id: string, to: StageKey) {
    void runPageStageMove(mutations, "rbt", id, to); }
  // expose canonical mapping for downstream UI badges
  const canonicalFor = (k: StageKey) => mapRbtStageToCanonical(k);
  void canonicalFor;
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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">RBT Recruiting</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              Track RBT recruiting pipelines, staffing demand, onboarding readiness, and operational staffing pressure.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={notifyApploiNotConnected} className="h-10 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 hover:bg-muted transition inline-flex items-center gap-2 text-sm">
              <RefreshCw className="size-4" /> Import from Apploi
            </button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition inline-flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4" /> Add RBT Candidate
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div className="rounded-2xl bg-card border border-border/70 p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, state, recruiter, status, certification…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border focus:ring-2 focus:ring-ring focus:border-transparent text-sm placeholder:text-muted-foreground/70"
            />
          </div>
          <Select value={stateF}     onChange={setStateF}     label="All States"     options={recruitingStates as unknown as string[]} />
          <Select value={recruiterF} onChange={setRecruiterF} label="All Recruiters" options={recruitingRecruiters} />
          <Select value={urgencyF}   onChange={setUrgencyF}   label="All Urgency"    options={URGENCY_OPTS as unknown as string[]} />
          <Select value={sourceF}    onChange={setSourceF}    label="All Sources"    options={SOURCE_OPTS} />
          {(search || stateF !== "all" || recruiterF !== "all" || urgencyF !== "all" || sourceF !== "all") && (
            <button onClick={() => { setSearch(""); setStateF("all"); setRecruiterF("all"); setUrgencyF("all"); setSourceF("all"); }} className="h-10 px-3 rounded-xl text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1 text-sm">
              <X className="size-4" /> Clear
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <SummaryCard label="New Applicants"        value={summary.newApplicants}    icon={UserPlus}     tone="info" onClick={() => setActiveChip("new")} />
          <SummaryCard label="RBT Certified"         value={summary.certified}        icon={BadgeCheck}   tone="ok"   onClick={() => setActiveChip("certified")} />
          <SummaryCard label="Needs BACB Verify"     value={summary.needsBacb}        icon={ShieldCheck}  tone="warn" onClick={() => setActiveChip("needsBacb")} />
          <SummaryCard label="Needs 40-Hour Course"  value={summary.needs40}          icon={GraduationCap} tone="warn" onClick={() => setActiveChip("needs40")} />
          <SummaryCard label="Orientation-Ready"     value={summary.orientationReady} icon={CheckCircle2} tone="ok"   onClick={() => setActiveChip("orientation")} />
          <SummaryCard label="GA Staffing Gaps"      value={summary.gaGaps}           icon={Building2}    tone="warn" onClick={() => setStateF("GA")} />
          <SummaryCard label="Urgent Staffing Needs" value={summary.urgentStaffing}   icon={AlertTriangle} tone="crit" onClick={() => setUrgencyF("High")} />
          <SummaryCard label="Stalled Candidates"    value={summary.stalled}          icon={Flame}        tone="crit" onClick={() => setActiveChip("stalled")} />
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
            {/* Pipeline */}
            <section>
              <SectionHeader title="RBT Recruiting Pipeline" caption="Drag candidates between recruiting stages" />
              <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {STAGES.map((stage) => {
                  const list = filtered.filter((c) => stageOf(c) === stage.key);
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
                          <BoardCard
                            key={c.id}
                            c={c}
                            onOpen={() => setSelectedId(c.id)}
                            onDragStart={(e) => onDragStart(e, c.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Orientation-Ready Queue */}
            <section>
              <SectionHeader title="Orientation-Ready RBT Queue" caption={`${orientationReadyList.length} candidate${orientationReadyList.length === 1 ? "" : "s"} cleared for staffing handoff`} />
              {orientationReadyList.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No staffing-ready RBTs available yet." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orientationReadyList.map((c) => (
                    <OrientationCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>

            {/* Staffing Demand Visibility */}
            <section>
              <SectionHeader title="Staffing Demand Visibility" caption="Where RBT shortages and recruiting pressure are highest" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {pressureFeed.map((r) => (
                  <RegionPressureCard key={r.key} {...r} />
                ))}
              </div>
            </section>

            {/* Escalations */}
            <section>
              <SectionHeader title="Recruiting Escalations Queue" caption={`${escalations.length} candidate${escalations.length === 1 ? "" : "s"} requiring attention`} />
              {escalations.length === 0 ? (
                <EmptyCard icon={CheckCircle2} title="No stalled RBT candidates currently." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {escalations.map((c) => (
                    <EscalationCard key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/70 p-5">
              <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-3">Quick Actions</div>
              <div className="space-y-1.5">
                {[
                  { icon: Plus, label: "Add RBT Candidate" },
                  { icon: RefreshCw, label: "Import from Apploi", onClick: notifyApploiNotConnected },
                  { icon: ShieldCheck, label: "Verify BACB" },
                  { icon: GraduationCap, label: "Send 40-Hour Course Link" },
                  { icon: CalendarClock, label: "Schedule Interview" },
                  { icon: Bell, label: "Notify Staffing" },
                  { icon: AlertTriangle, label: "Escalate Staffing Delay" },
                  { icon: Download, label: "Export RBT Pipeline" },
                ].map((a: { icon: any; label: string; onClick?: () => void }) => (
                  <button key={a.label} onClick={a.onClick} className="w-full h-9 px-3 rounded-xl text-left text-sm hover:bg-muted transition inline-flex items-center gap-2 text-foreground">
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
                  <div className="text-[11px] text-muted-foreground">RBT recruiting copilot</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  "Which states need RBTs most?",
                  "Show orientation-ready RBTs.",
                  "Which staffing requests are high risk?",
                  "Who still needs BACB verification?",
                  "Which candidates are stalled?",
                  "Show urgent Georgia staffing gaps.",
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
          urgency={urgencyForCandidate(selected)}
          staffingMatches={staffingNeeds.filter((n) => n.client.state === selected.state)}
          onMove={(to) => moveStage(selected.id, to)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </OSShell>
  );
}

/* ---------- subcomponents ---------- */

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
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
          <div className="text-[10px] text-muted-foreground">{c.state} · {c.region}</div>
        </div>
        <Pill tone={tone} className="shrink-0">{c.daysInStage}d</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground truncate">{c.nextAction}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        {isRBTCertified(c) && <Pill tone="ok">RBT Certified</Pill>}
        {needsBACB(c) && <Pill tone="warn">Needs BACB</Pill>}
        {needs40Hour(c) && <Pill tone="warn">40-Hour</Pill>}
        {isOrientationReady(c) && <Pill tone="ok">Orientation Ready</Pill>}
        {isStaffingReady(c) && <Pill tone="ok">Staffing Ready</Pill>}
        {isStalled(c) && <Pill tone="crit">Stalled</Pill>}
        {c.state === "GA" && <Pill tone="info">GA</Pill>}
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-2">{c.recruiter}</div>
    </div>
  );
}

function OrientationCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const urg = urgencyForCandidate(c);
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">{initials(c.name)}</div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{c.name}</div>
            <div className="text-[11px] text-muted-foreground">{c.state} · {c.region} · {c.recruiter}</div>
          </div>
        </div>
        <Pill tone={isStaffingReady(c) ? "ok" : "info"}>{isStaffingReady(c) ? "Staffing Ready" : "Orientation Ready"}</Pill>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{c.availability} · Radius {c.travelRadius}mi · {c.preferredHours}</div>
      <div className="flex items-center justify-between mt-1">
        <Pill tone={urg === "High" ? "crit" : urg === "Medium" ? "warn" : "muted"}>{urg} Urgency</Pill>
        <div className="flex items-center gap-1">
          <IconBtn icon={Bell} title="Notify staffing coordinator" />
          <IconBtn icon={Link2} title="Assign placement" />
          <IconBtn icon={ArrowRight} title="Mark staffing confirmed" />
        </div>
      </div>
    </button>
  );
}

function RegionPressureCard({ state, region, demand, ready, active }: { state: string; region: string; demand: number; priorityRole: string; ready: number; active: number }) {
  const gap = demand - ready;
  const pressure: Tone = gap >= 3 ? "crit" : gap >= 1 ? "warn" : "ok";
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <div className="text-sm font-semibold tracking-tight">{state} · {region}</div>
        </div>
        <Pill tone={pressure}>{pressure === "crit" ? "High Pressure" : pressure === "warn" ? "Watch" : "Stable"}</Pill>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Stat label="Demand"  value={demand} />
        <Stat label="Ready"   value={ready}  tone={ready > 0 ? "ok" : "muted"} />
        <Stat label="Active"  value={active} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "muted" }: { label: string; value: number; tone?: Tone }) {
  const color = tone === "crit" ? "text-destructive" : tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground";
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2">
      <div className={cn("text-base font-semibold tracking-tight", color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EscalationCard({ c, onOpen }: { c: RecruitingCandidate; onOpen: () => void }) {
  const reason = c.blockers[0] ?? (c.daysInStage >= 6 ? `Stalled ${c.daysInStage} days in stage` : `Readiness blocked`);
  return (
    <button onClick={onOpen} className="text-left rounded-2xl bg-card border border-border/70 p-4 hover:border-border hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-sm font-medium">{c.name} · {c.state}</div>
        <Pill tone="crit"><Flame className="size-3" /> Escalation</Pill>
      </div>
      <div className="text-xs text-muted-foreground">{reason}</div>
      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-muted-foreground">{c.recruiter} · {c.daysInStage}d in {c.candidateStatus}</div>
        <div className="flex items-center gap-1">
          <IconBtn icon={AlertTriangle} title="Escalate to leadership" />
          <IconBtn icon={UserPlus} title="Assign recruiter" />
          <IconBtn icon={Bell} title="Notify staffing" />
          <IconBtn icon={MessageSquare} title="Add operational note" />
        </div>
      </div>
    </button>
  );
}

/* ---------- slideout ---------- */

function CandidateSlideout({
  c, stage, urgency, staffingMatches, onMove, onClose,
}: {
  c: RecruitingCandidate;
  stage: StageKey;
  urgency: string;
  staffingMatches: StaffingClientNeed[];
  onMove: (to: StageKey) => void;
  onClose: () => void;
}) {
  useSlideout(true, onClose);
  const tone = toneFor(c);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[540px] bg-card border-l border-border/70 shadow-[0_20px_60px_-30px_oklch(0.2_0.02_260/0.4)] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/70 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-muted grid place-items-center text-sm font-semibold">{initials(c.name)}</div>
            <div>
              <div className="text-base font-semibold tracking-tight">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.state} · {c.region} · {c.city}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full size-9 grid place-items-center hover:bg-muted transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={tone}>{STAGES.find((s) => s.key === stage)?.label ?? stage}</Pill>
            <Pill tone="info">RBT</Pill>
            <Pill tone="muted">{c.daysInStage}d in stage</Pill>
            {isRBTCertified(c) && <Pill tone="ok">RBT Certified</Pill>}
            {needsBACB(c) && <Pill tone="warn">Needs BACB</Pill>}
            {needs40Hour(c) && <Pill tone="warn">40-Hour Course</Pill>}
            {isStaffingReady(c) && <Pill tone="ok">Staffing Ready</Pill>}
          </div>

          <Block title="Candidate Overview">
            <Row k="Recruiter" v={c.recruiter} />
            <Row k="Source" v={c.source} />
            <Row k="State" v={`${c.state} · ${c.region}`} />
            <Row k="City" v={c.city} />
            <Row k="Applied" v={c.appliedDate} />
            <Row k="Staffing Urgency" v={urgency} />
          </Block>

          <Block title="Certification Status">
            <Row k="RBT Certification" v={c.certification} />
            <Row k="BACB Verification" v={c.bacbCheck} />
            <Row k="40-Hour Course" v={needs40Hour(c) ? "Needed" : "Complete / Not Required"} />
            <Row k="Screening" v={c.screeningOutcome} />
            <Row k="Eligibility" v={c.eligibility} />
          </Block>

          <Block title="Operational Workflow">
            <Row k="Recruiting Stage" v={c.candidateStatus} />
            <Row k="Onboarding" v={c.onboardingStatus} />
            <Row k="Background Check" v={c.backgroundCheck} />
            <Row k="Orientation" v={c.orientation} />
            <Row k="Training" v={c.training} />
            <Row k="Readiness" v={c.readinessStatus} />
            <Row k="Blockers" v={c.blockers.length === 0 ? "None" : c.blockers.join("; ")} />
          </Block>

          <Block title="Staffing Match Visibility">
            <Row k="Availability" v={c.availability} />
            <Row k="Travel Radius" v={`${c.travelRadius} mi`} />
            <Row k="Preferred Hours" v={c.preferredHours} />
            <Row k="Matching Client Needs" v={`${staffingMatches.length} open need${staffingMatches.length === 1 ? "" : "s"} in ${c.state}`} />
            {staffingMatches.slice(0, 3).map((n) => (
              <div key={n.client.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm truncate">Client {initials(n.client.childName)}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{n.client.clinic} · {n.daysWaiting}d waiting</div>
                </div>
                <Pill tone={n.priority === "High" ? "crit" : n.priority === "Medium" ? "warn" : "muted"}>{n.priority}</Pill>
              </div>
            ))}
          </Block>

          {/* Stage transitions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Move Stage</div>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onMove(s.key)}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-medium border transition",
                    s.key === "staffingReady"
                      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                      : "bg-card text-foreground border-border/70 hover:bg-muted"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="text-xs font-semibold tracking-tight text-muted-foreground uppercase mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: CalendarClock, label: "Send Interview Link" },
                { icon: ShieldCheck, label: "Verify BACB" },
                { icon: GraduationCap, label: "Send 40-Hour Course" },
                { icon: RefreshCw, label: "Resend Onboarding" },
                { icon: Users, label: "Schedule Orientation" },
                { icon: Bell, label: "Notify Staffing" },
                { icon: ArrowRight, label: "Move to Staffing Ready" },
                { icon: AlertTriangle, label: "Escalate Blocker" },
                { icon: MessageSquare, label: "Add Recruiter Note" },
                { icon: Send, label: "Send Staffing Update" },
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