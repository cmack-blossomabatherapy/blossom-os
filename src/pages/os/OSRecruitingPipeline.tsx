import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Filter, X, ChevronDown, UserPlus, Download, Send, Phone,
  Eye, CalendarClock, AlertTriangle, CheckCircle2, Clock, Sparkles,
  Brain, Inbox, FileText, ShieldCheck, GraduationCap, XCircle, Users,
  ArrowRight, MessageSquare, MoreHorizontal,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  recruitingCandidates,
  recruitingStates,
  recruitingRoles,
  recruitingRecruiters,
  recruitingSources,
  type RecruitingCandidate,
} from "@/data/recruitingDashboard";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";

// Recruiting → Candidates → Applicant Pipeline
// Calm, workflow-first applicant board. Wired to recruitingDashboard.ts
// (operational scaffolding until Apploi ingest lands).

type Tone = "ok" | "warn" | "crit" | "muted";

const STAGES = [
  { key: "new",        label: "New Applicant" },
  { key: "review",     label: "Needs Review" },
  { key: "cert",       label: "RBT Cert Check" },
  { key: "resume",     label: "Resume Review" },
  { key: "ready",      label: "Interview Ready" },
  { key: "linkSent",   label: "Interview Link Sent" },
  { key: "waiting",    label: "Waiting on Candidate" },
  { key: "moved",      label: "Moved to Interview" },
  { key: "notq",       label: "Not Qualified" },
] as const;
type StageKey = typeof STAGES[number]["key"];

function classify(c: RecruitingCandidate): StageKey {
  if (c.candidateStatus === "Not Qualified" || c.eligibility === "Not Eligible") return "notq";
  if (["Interview Completed","Offer Sent","Offer Accepted","Onboarding Handoff","Background Check","Orientation","Training","Ready for Staffing"].includes(c.candidateStatus)) return "moved";
  if (c.interviewStatus === "No-Show") return "waiting";
  if (c.interviewStatus === "Scheduled" || c.interviewStatus === "Today") return "linkSent";
  if (c.resume === "Missing") return "resume";
  if (c.role === "RBT" && (c.certification === "Pending" || c.certification === "Missing")) return "cert";
  if (c.screeningOutcome === "Pass" && c.interviewStatus === "Not Scheduled") return "ready";
  if (c.candidateStatus === "New Applicant" && c.daysInStage <= 1) return "new";
  return "review";
}

function toneFor(c: RecruitingCandidate): Tone {
  if (c.candidateStatus === "Not Qualified") return "muted";
  if (c.daysInStage >= 7) return "crit";
  if (c.daysInStage >= 4 || c.blockers.length > 0) return "warn";
  return "ok";
}

function toneClass(t: Tone) {
  switch (t) {
    case "crit":  return "bg-destructive/10 text-destructive border-destructive/20";
    case "warn":  return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
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

export default function OSRecruitingPipeline() {
  // Stage overrides (local optimistic updates from drag/drop & quick actions)
  const [overrides, setOverrides] = useState<Record<string, StageKey>>({});
  const [selected, setSelected] = useState<RecruitingCandidate | null>(null);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [roleF, setRoleF] = useState("all");
  const [sourceF, setSourceF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [chip, setChip] = useState<"all" | StageKey | "stalled">("all");

  const stageOf = (c: RecruitingCandidate): StageKey => overrides[c.id] ?? classify(c);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recruitingCandidates.filter((c) => {
      if (stateF !== "all" && c.state !== stateF) return false;
      if (roleF !== "all" && c.role !== roleF) return false;
      if (sourceF !== "all" && c.source !== sourceF) return false;
      if (recruiterF !== "all" && c.recruiter !== recruiterF) return false;
      if (chip === "stalled" && c.daysInStage < 7) return false;
      if (chip !== "all" && chip !== "stalled" && stageOf(c) !== chip) return false;
      if (!q) return true;
      return [c.name, c.role, c.state, c.region, c.city, c.source, c.recruiter, c.id]
        .some((v) => String(v).toLowerCase().includes(q));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stateF, roleF, sourceF, recruiterF, chip, overrides]);

  const stageBuckets = useMemo(() => {
    const map: Record<StageKey, RecruitingCandidate[]> = Object.fromEntries(STAGES.map(s => [s.key, []])) as any;
    filtered.forEach((c) => map[stageOf(c)].push(c));
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, overrides]);

  // Summary metrics (on full candidate set, not filtered)
  const summary = useMemo(() => {
    const all = recruitingCandidates;
    const s = (k: StageKey) => all.filter((c) => stageOf(c) === k).length;
    return [
      { key: "new",      label: "New Applicants",       value: s("new"),    hint: "Just landed", tone: "ok" as Tone },
      { key: "review",   label: "Needs Review",         value: s("review"), hint: "Awaiting first screen", tone: "warn" as Tone },
      { key: "cert",     label: "RBT Cert Check",       value: s("cert"),   hint: "Verify certification", tone: "warn" as Tone },
      { key: "bacb",     label: "Needs BACB Check",     value: all.filter(c => c.bacbCheck === "Pending" || c.bacbCheck === "Not Started").filter(c => c.role === "BCBA").length, hint: "BCBA verification", tone: "warn" as Tone },
      { key: "ready",    label: "Interview Link Needed",value: s("ready"),  hint: "Ready to schedule", tone: "ok" as Tone },
      { key: "waiting",  label: "Waiting on Candidate", value: s("waiting"),hint: "No response / no-show", tone: "warn" as Tone },
      { key: "stalled",  label: "Stalled 7+ Days",      value: all.filter(c => c.daysInStage >= 7).length, hint: "Needs intervention", tone: "crit" as Tone },
      { key: "notq",     label: "Not Qualified",        value: s("notq"),   hint: "Disqualified this week", tone: "muted" as Tone },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides]);

  // Follow-up queue
  const followUps = useMemo(() => {
    return recruitingCandidates
      .filter((c) => {
        const st = stageOf(c);
        return st === "review" || st === "ready" || st === "waiting" || c.daysInStage >= 7;
      })
      .sort((a, b) => b.daysInStage - a.daysInStage)
      .slice(0, 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides]);

  // Sources
  const bySource = useMemo(() => {
    return recruitingSources.map((src) => {
      const list = recruitingCandidates.filter((c) => c.source === src);
      return {
        source: src,
        total: list.length,
        qualified: list.filter((c) => c.screeningOutcome === "Pass").length,
        ready: list.filter((c) => stageOf(c) === "ready" || stageOf(c) === "linkSent").length,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrides]);

  const updateStage = (id: string, stage: StageKey) =>
    setOverrides((o) => ({ ...o, [id]: stage }));

  return (
    <OSShell>
      <div className="min-h-screen bg-background">
        {/* HEADER */}
        <header className="border-b border-border/70 bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="max-w-[1500px] mx-auto px-6 py-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Link to="/recruiting-team" className="hover:text-foreground transition">Recruiting</Link>
              <span>/</span>
              <span>Candidates</span>
              <span>/</span>
              <span className="text-foreground">Applicant Pipeline</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Applicant Pipeline</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Review applicants, verify qualifications, and move candidates into the hiring workflow.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border/70 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition">
                  <Download className="h-3.5 w-3.5" /> Import Apploi
                </button>
                <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
                  <UserPlus className="h-3.5 w-3.5" /> Add candidate
                </button>
              </div>
            </div>

            {/* Search + filter row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, role, state, source…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border/70 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Select icon={Filter} value={stateF}     onChange={setStateF}     options={[{v:"all",l:"All states"}, ...recruitingStates.map((s)=>({v:s,l:s}))]} />
              <Select icon={Filter} value={roleF}      onChange={setRoleF}      options={[{v:"all",l:"All roles"},  ...recruitingRoles.map((r)=>({v:r,l:r}))]} />
              <Select icon={Filter} value={sourceF}    onChange={setSourceF}    options={[{v:"all",l:"All sources"},...recruitingSources.map((s)=>({v:s,l:s}))]} />
              <Select icon={Filter} value={recruiterF} onChange={setRecruiterF} options={[{v:"all",l:"All recruiters"},...recruitingRecruiters.map((r)=>({v:r,l:r}))]} />
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-6">
          {/* SUMMARY CARDS */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              {summary.map((s) => {
                const active = chip === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setChip(active ? "all" : (s.key as any))}
                    className={cn(
                      "rounded-2xl border bg-card text-left p-3.5 transition hover:-translate-y-0.5",
                      active ? "border-primary/40 ring-2 ring-primary/20" : "border-border/70",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("inline-flex h-7 w-7 rounded-lg items-center justify-center border", toneClass(s.tone))}>
                        <Inbox className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.hint}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SMART FILTER CHIPS */}
          <section className="flex flex-wrap items-center gap-1.5">
            <Chip active={chip==="all"}      onClick={() => setChip("all")}      >All</Chip>
            {STAGES.map((s) => (
              <Chip key={s.key} active={chip===s.key} onClick={() => setChip(s.key)}>{s.label}</Chip>
            ))}
            <Chip active={chip==="stalled"} onClick={() => setChip("stalled")} tone="crit">Stalled</Chip>
          </section>

          {/* PIPELINE BOARD */}
          <section>
            <div className="overflow-x-auto -mx-2 px-2 pb-3">
              <div className="flex gap-3 min-w-max">
                {STAGES.map((s) => {
                  const list = stageBuckets[s.key];
                  const stalled = list.filter((c) => c.daysInStage >= 7).length;
                  const avg = list.length
                    ? Math.round(list.reduce((a, c) => a + c.daysInStage, 0) / list.length)
                    : 0;
                  return (
                    <div
                      key={s.key}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData("text/candidate-id");
                        if (id) updateStage(id, s.key);
                      }}
                      className="w-[280px] shrink-0 rounded-2xl bg-muted/30 border border-border/60 p-3"
                    >
                      <header className="flex items-start justify-between mb-2.5 px-1">
                        <div>
                          <h3 className="text-xs font-semibold text-foreground">{s.label}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {list.length} · avg {avg}d
                            {stalled > 0 && <span className="text-destructive ml-1">· {stalled} stalled</span>}
                          </p>
                        </div>
                        <span className="text-[10px] tabular-nums text-muted-foreground bg-card border border-border/70 rounded-md px-1.5 py-0.5">{list.length}</span>
                      </header>
                      <div className="space-y-2 min-h-[120px]">
                        {list.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
                            Nothing here.
                          </div>
                        ) : (
                          list.map((c) => (
                            <ApplicantCard
                              key={c.id}
                              candidate={c}
                              onOpen={() => setSelected(c)}
                              onDragStart={(e) => e.dataTransfer.setData("text/candidate-id", c.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* BOTTOM: FOLLOW-UPS + SOURCES + AI */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Follow-up queue */}
            <div className="lg:col-span-2 rounded-2xl border border-border/70 bg-card p-4">
              <header className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Follow-up queue</h3>
                </div>
                <span className="text-xs text-muted-foreground">{followUps.length} applicants need recruiter action</span>
              </header>
              {followUps.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No stalled applicants right now. Nice and clean." />
              ) : (
                <ul className="space-y-2">
                  {followUps.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:bg-muted/30 transition">
                      <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.role} · {c.state} · {c.recruiter} · {c.nextAction}
                        </p>
                      </div>
                      <Pill tone={toneFor(c)}>{c.daysInStage}d</Pill>
                      <button
                        onClick={() => setSelected(c)}
                        className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border/70 text-xs hover:bg-muted/40 transition"
                      >
                        Open <ArrowRight className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sources + AI */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> Sources this period
                </h3>
                <ul className="space-y-2">
                  {bySource.map((s) => (
                    <li key={s.source} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{s.source}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {s.total} · {s.qualified} qual · {s.ready} ready
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-primary" /> Ask Blossom AI
                </h3>
                <div className="space-y-1.5">
                  {[
                    "Show applicants waiting on review.",
                    "Which candidates need BACB verification?",
                    "Who should get the interview link today?",
                    "Which applicants are stalled?",
                    "Show RBT certified applicants in Georgia.",
                  ].map((p) => (
                    <Link
                      key={p}
                      to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                      className="block px-3 py-2 rounded-lg text-xs text-foreground bg-muted/40 hover:bg-muted/60 transition"
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <CandidateSlideout
          candidate={selected}
          onClose={() => setSelected(null)}
          onStageChange={(stage) => selected && updateStage(selected.id, stage)}
        />
      </div>
    </OSShell>
  );
}

/* ---------- ApplicantCard ---------- */
function ApplicantCard({
  candidate: c, onOpen, onDragStart,
}: {
  candidate: RecruitingCandidate;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const tone = toneFor(c);
  const badges: { tone: Tone; label: string }[] = [];
  if (c.role === "RBT" && c.certification === "Verified") badges.push({ tone: "ok", label: "RBT Certified" });
  if (c.role === "BCBA" && (c.bacbCheck === "Pending" || c.bacbCheck === "Not Started")) badges.push({ tone: "warn", label: "Needs BACB" });
  if (c.role === "RBT" && c.certification === "Missing") badges.push({ tone: "warn", label: "Needs 40-Hour" });
  if (c.screeningOutcome === "Pass" && c.interviewStatus === "Not Scheduled") badges.push({ tone: "ok", label: "Interview Ready" });
  if (c.daysInStage >= 7) badges.push({ tone: "crit", label: "Stalled" });
  if (c.candidateStatus === "Not Qualified") badges.push({ tone: "muted", label: "Not Qualified" });

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="cursor-grab active:cursor-grabbing rounded-xl bg-card border border-border/70 p-3 hover:border-primary/30 hover:shadow-sm transition"
    >
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground shrink-0">
          {initials(c.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {c.role} · {c.state} · {c.source}
          </p>
        </div>
        <Pill tone={tone}>{c.daysInStage}d</Pill>
      </div>
      {badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.slice(0, 3).map((b, i) => (
            <Pill key={i} tone={b.tone}>{b.label}</Pill>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{c.recruiter}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {c.nextAction.length > 24 ? c.nextAction.slice(0, 24) + "…" : c.nextAction}
        </span>
      </div>
    </article>
  );
}

/* ---------- Chip ---------- */
function Chip({
  active, onClick, children, tone,
}: { active?: boolean; onClick: () => void; children: React.ReactNode; tone?: Tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-xs font-medium border transition",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : tone === "crit"
            ? "bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10"
            : "bg-card text-foreground border-border/70 hover:bg-muted/40",
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Select ---------- */
function Select({
  icon: Icon, value, onChange, options,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-10 pl-9 pr-8 rounded-xl bg-card border border-border/70 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

/* ---------- EmptyState ---------- */
function EmptyState({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="h-10 w-10 rounded-full bg-muted grid place-items-center mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

/* ---------- Slideout ---------- */
const REVIEW_STEPS: { key: string; label: string; check: (c: RecruitingCandidate) => boolean }[] = [
  { key: "opened",   label: "Application opened",                    check: (c) => c.resume === "Received" },
  { key: "resume",   label: "Resume reviewed",                       check: (c) => c.resume === "Received" && c.screeningOutcome !== "Pending" },
  { key: "cert",     label: "RBT certification checked",             check: (c) => c.certification !== "Pending" },
  { key: "bacb",     label: "BACB verified (if BCBA)",               check: (c) => c.role !== "BCBA" || c.bacbCheck === "Clear" },
  { key: "exp",      label: "Experience with children reviewed",     check: (c) => c.kidsExperience !== "Entry" },
  { key: "state",    label: "State / location confirmed",            check: (c) => !!c.state && !!c.city },
  { key: "avail",    label: "Availability reviewed",                 check: (c) => !!c.availability },
  { key: "decision", label: "Candidate qualified decision made",     check: (c) => c.eligibility !== "Review" },
  { key: "next",     label: "Next step sent",                        check: (c) => c.interviewStatus !== "Not Scheduled" || c.candidateStatus === "Not Qualified" },
];

function CandidateSlideout({
  candidate, onClose, onStageChange,
}: {
  candidate: RecruitingCandidate | null;
  onClose: () => void;
  onStageChange: (stage: StageKey) => void;
}) {
  useSlideout(!!candidate, onClose);
  if (!candidate) return null;
  const c = candidate;
  const done = REVIEW_STEPS.filter((s) => s.check(c)).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground truncate">{c.name}</h2>
              <Pill tone="ok">{c.role}</Pill>
              <Pill tone={toneFor(c)}>{c.candidateStatus}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.state} · {c.region} · {c.city}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Next action</h3>
            <p className="text-sm text-foreground">{c.nextAction}</p>
          </section>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={Send} label="Send interview link" />
            <QuickAction icon={GraduationCap} label="Send 40-hour link" />
            <QuickAction icon={ShieldCheck} label="Verify BACB" />
            <QuickAction icon={MessageSquare} label="Message" />
            <QuickAction icon={Phone} label="Call" />
            <QuickAction icon={Eye} label="Open profile" />
          </div>

          {/* Qualification checklist */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Qualification review</h3>
              <span className="text-[11px] text-muted-foreground">{done} of {REVIEW_STEPS.length} complete</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done/REVIEW_STEPS.length)*100}%` }} />
            </div>
            <ul className="space-y-1.5">
              {REVIEW_STEPS.map((s) => {
                const ok = s.check(c);
                return (
                  <li key={s.key} className="flex items-center gap-2 text-sm">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      : <span className="h-4 w-4 rounded-full border border-border/70 shrink-0" />}
                    <span className={cn("text-foreground", ok && "text-muted-foreground line-through")}>{s.label}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Pipeline / app details */}
          <section className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline status</h3>
            <Row label="Interview"     value={c.interviewStatus}   />
            <Row label="Certification" value={c.certification}     />
            <Row label="BACB"          value={c.bacbCheck}         />
            <Row label="Resume"        value={c.resume}            />
            <Row label="Eligibility"   value={c.eligibility}       />
          </section>

          {/* Move to stage */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Move to stage</h3>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onStageChange(s.key)}
                  className="h-7 px-2.5 rounded-full border border-border/70 text-[11px] text-foreground hover:bg-muted/40 transition"
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => onStageChange("notq")}
                className="h-7 px-2.5 rounded-full border border-destructive/30 text-[11px] text-destructive hover:bg-destructive/5 transition inline-flex items-center gap-1"
              >
                <XCircle className="h-3 w-3" /> Mark not qualified
              </button>
            </div>
          </section>

          {/* Blockers */}
          {c.blockers.length > 0 && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-destructive" /> Blockers
              </h3>
              <ul className="space-y-1.5">
                {c.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-foreground bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{b}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Meta */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <Meta label="Recruiter"     value={c.recruiter} />
            <Meta label="Source"        value={c.source} />
            <Meta label="Applied"       value={c.appliedDate} />
            <Meta label="Days in stage" value={`${c.daysInStage}d`} />
            <Meta label="Availability"  value={c.availability} />
            <Meta label="Travel"        value={`${c.travelRadius} mi`} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-foreground mt-0.5">{value}</p>
    </div>
  );
}
function QuickAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted/40 transition">
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}