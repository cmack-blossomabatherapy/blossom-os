import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Filter, X, ChevronDown, UserPlus, CheckCircle2, Clock,
  Brain, Inbox, XCircle, Users, ArrowRight, MessageSquare, AlertTriangle,
  Send, Phone, Eye, GraduationCap, ShieldCheck, Loader2,
} from "lucide-react";
import { OSShell } from "./OSShell";
import {
  useRecruitingCandidates,
  fullName,
  daysInStage,
  type RecruitingCandidate,
  type PipelineStage,
} from "@/hooks/useRecruitingCandidates";
import { useSlideout } from "@/hooks/useSlideout";
import { cn } from "@/lib/utils";
import { notifyApploiNotConnected } from "@/lib/recruiting/apploi";
import { useRecruitingMutations } from "@/hooks/useRecruitingMutations";
import { toast } from "sonner";
import {
  useApploiIntegrationStatus,
  importApploiNormalizedRecords,
} from "@/hooks/useApploiIntegration";
import {
  isRbtLikeRole,
  type RbtCertificationStatus,
} from "@/lib/recruiting/rbtPathwayClassifier";

// Recruiting → Candidates → Applicant Pipeline
// Real backend (recruiting_candidates). DnD persists pipeline_stage.

type Tone = "ok" | "warn" | "crit" | "muted";

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "New Applicant",         label: "New Applicant" },
  { key: "Phone Screen",          label: "Phone Screen" },
  { key: "Interview Scheduled",   label: "Interview Scheduled" },
  { key: "Interview Complete",    label: "Interview Complete" },
  { key: "Offer Sent",            label: "Offer Sent" },
  { key: "Offer Accepted",        label: "Offer Accepted" },
  { key: "Background Check",      label: "Background Check" },
  { key: "Orientation Scheduled", label: "Orientation" },
  { key: "Onboarding",            label: "Onboarding" },
  { key: "Ready to Staff",        label: "Ready to Staff" },
  { key: "On Hold",               label: "On Hold" },
  { key: "Withdrawn",             label: "Withdrawn" },
  { key: "Rejected",              label: "Rejected" },
];

const ROLES = ["RBT", "BCBA", "BT", "Other"] as const;
const STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

function toneFor(c: RecruitingCandidate): Tone {
  if (c.pipeline_stage === "Withdrawn" || c.pipeline_stage === "Rejected") return "muted";
  const d = daysInStage(c);
  if (d >= 7) return "crit";
  if (d >= 4) return "warn";
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
  const { candidates, loading, updateStage, updateCandidate } = useRecruitingCandidates();
  const { status: apploiStatus } = useApploiIntegrationStatus();
  const handleApploiImport = async () => {
    if (apploiStatus !== "connected") { notifyApploiNotConnected(); return; }
    await importApploiNormalizedRecords();
  };
  const [selected, setSelected] = useState<RecruitingCandidate | null>(null);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [roleF, setRoleF] = useState("all");
  const [sourceF, setSourceF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [chip, setChip] = useState<"all" | PipelineStage | "stalled">("all");

  const allSources = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.source).filter(Boolean))) as string[],
    [candidates],
  );
  const allRecruiters = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.recruiter).filter(Boolean))) as string[],
    [candidates],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (stateF !== "all" && c.state !== stateF) return false;
      if (roleF !== "all" && c.role !== roleF) return false;
      if (sourceF !== "all" && c.source !== sourceF) return false;
      if (recruiterF !== "all" && c.recruiter !== recruiterF) return false;
      if (chip === "stalled" && daysInStage(c) < 7) return false;
      if (chip !== "all" && chip !== "stalled" && c.pipeline_stage !== chip) return false;
      if (!q) return true;
      return [fullName(c), c.role, c.state, c.city, c.source, c.recruiter, c.email]
        .some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [candidates, search, stateF, roleF, sourceF, recruiterF, chip]);

  const stageBuckets = useMemo(() => {
    const map = new Map<PipelineStage, RecruitingCandidate[]>();
    STAGES.forEach((s) => map.set(s.key, []));
    filtered.forEach((c) => map.get(c.pipeline_stage)?.push(c));
    return map;
  }, [filtered]);

  const summary = useMemo(() => {
    const total = candidates.length;
    const stalled = candidates.filter((c) => daysInStage(c) >= 7).length;
    const active = candidates.filter((c) => !["Withdrawn", "Rejected", "On Hold"].includes(c.pipeline_stage)).length;
    const inInterview = candidates.filter((c) => ["Interview Scheduled", "Interview Complete"].includes(c.pipeline_stage)).length;
    const offer = candidates.filter((c) => ["Offer Sent", "Offer Accepted"].includes(c.pipeline_stage)).length;
    const onboarding = candidates.filter((c) => ["Background Check", "Orientation Scheduled", "Onboarding"].includes(c.pipeline_stage)).length;
    const ready = candidates.filter((c) => c.pipeline_stage === "Ready to Staff").length;
    const fresh = candidates.filter((c) => c.pipeline_stage === "New Applicant").length;
    return [
      { key: "total",       label: "Total Active",     value: active,      hint: `${total} all-time`,        tone: "ok" as Tone },
      { key: "fresh",       label: "New Applicants",   value: fresh,       hint: "Just landed",              tone: "ok" as Tone },
      { key: "interview",   label: "In Interview",     value: inInterview, hint: "Scheduled + complete",     tone: "warn" as Tone },
      { key: "offer",       label: "Offer Stage",      value: offer,       hint: "Sent or accepted",         tone: "warn" as Tone },
      { key: "onboarding",  label: "Onboarding",       value: onboarding,  hint: "BG / orient / paperwork",  tone: "warn" as Tone },
      { key: "ready",       label: "Ready to Staff",   value: ready,       hint: "Ready for client match",   tone: "ok" as Tone },
      { key: "stalled",     label: "Stalled 7+ Days",  value: stalled,     hint: "Needs intervention",       tone: "crit" as Tone },
    ];
  }, [candidates]);

  const followUps = useMemo(() => {
    return candidates
      .filter((c) => !["Withdrawn", "Rejected"].includes(c.pipeline_stage))
      .sort((a, b) => daysInStage(b) - daysInStage(a))
      .slice(0, 8);
  }, [candidates]);

  const bySource = useMemo(() => {
    return allSources.map((src) => {
      const list = candidates.filter((c) => c.source === src);
      return {
        source: src,
        total: list.length,
        active: list.filter((c) => !["Withdrawn", "Rejected", "On Hold"].includes(c.pipeline_stage)).length,
        ready: list.filter((c) => c.pipeline_stage === "Ready to Staff").length,
      };
    });
  }, [candidates, allSources]);

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
                <button
                  onClick={handleApploiImport}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border/70 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Import from Apploi
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
              <Select icon={Filter} value={stateF}     onChange={setStateF}     options={[{v:"all",l:"All states"}, ...STATES.map((s)=>({v:s,l:s}))]} />
              <Select icon={Filter} value={roleF}      onChange={setRoleF}      options={[{v:"all",l:"All roles"},  ...ROLES.map((r)=>({v:r,l:r}))]} />
              <Select icon={Filter} value={sourceF}    onChange={setSourceF}    options={[{v:"all",l:"All sources"},...allSources.map((s)=>({v:s,l:s}))]} />
              <Select icon={Filter} value={recruiterF} onChange={setRecruiterF} options={[{v:"all",l:"All recruiters"},...allRecruiters.map((r)=>({v:r,l:r}))]} />
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading candidates…
            </div>
          )}
          {/* SUMMARY CARDS */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {summary.map((s) => {
                const active = (s.key === "stalled" && chip === "stalled");
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      if (s.key === "stalled") setChip(chip === "stalled" ? "all" : "stalled");
                    }}
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
                  const list = stageBuckets.get(s.key) ?? [];
                  const stalled = list.filter((c) => daysInStage(c) >= 7).length;
                  const avg = list.length
                    ? Math.round(list.reduce((a, c) => a + daysInStage(c), 0) / list.length)
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
                        {initials(fullName(c))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{fullName(c)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.role} · {c.state} · {c.recruiter ?? "Unassigned"} · {c.next_action ?? c.pipeline_stage}
                        </p>
                      </div>
                      <Pill tone={toneFor(c)}>{daysInStage(c)}d</Pill>
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
                        {s.total} · {s.active} active · {s.ready} ready
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-primary" /> Operational Insights
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
          onStageChange={(stage) => {
            if (selected) {
              updateStage(selected.id, stage);
              setSelected({ ...selected, pipeline_stage: stage });
            }
          }}
          onClassificationChange={async (patch) => {
            if (!selected) return;
            const ok = await updateCandidate(selected.id, patch);
            if (ok) setSelected({ ...selected, ...patch });
          }}
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
  const d = daysInStage(c);
  const badges: { tone: Tone; label: string }[] = [];
  if (c.tags?.includes("hot")) badges.push({ tone: "ok", label: "Hot" });
  if (c.tags?.includes("bcba")) badges.push({ tone: "ok", label: "BCBA" });
  if (c.tags?.includes("bg-flag")) badges.push({ tone: "warn", label: "BG Flag" });
  if (c.tags?.includes("stalled") || d >= 7) badges.push({ tone: "crit", label: "Stalled" });
  if (c.pipeline_stage === "Withdrawn") badges.push({ tone: "muted", label: "Withdrawn" });

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="cursor-grab active:cursor-grabbing rounded-xl bg-card border border-border/70 p-3 hover:border-primary/30 hover:shadow-sm transition"
    >
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground shrink-0">
          {initials(fullName(c))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{fullName(c)}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {c.role} · {c.state} · {c.source ?? "—"}
          </p>
        </div>
        <Pill tone={tone}>{d}d</Pill>
      </div>
      {badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.slice(0, 3).map((b, i) => (
            <Pill key={i} tone={b.tone}>{b.label}</Pill>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{c.recruiter ?? "Unassigned"}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {(c.next_action ?? c.pipeline_stage).length > 24 ? (c.next_action ?? c.pipeline_stage).slice(0, 24) + "…" : (c.next_action ?? c.pipeline_stage)}
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
const STAGE_PROGRESS: PipelineStage[] = [
  "New Applicant", "Phone Screen", "Interview Scheduled", "Interview Complete",
  "Offer Sent", "Offer Accepted", "Background Check", "Orientation Scheduled",
  "Onboarding", "Ready to Staff",
];

function CandidateSlideout({
  candidate, onClose, onStageChange, onClassificationChange,
}: {
  candidate: RecruitingCandidate | null;
  onClose: () => void;
  onStageChange: (stage: PipelineStage) => void;
  onClassificationChange: (patch: {
    rbt_certification_status?: RbtCertificationStatus;
    rbt_years_experience_direct?: number | null;
  }) => void | Promise<void>;
}) {
  useSlideout(!!candidate, onClose);
  if (!candidate) return null;
  const c = candidate;
  const stageIndex = STAGE_PROGRESS.indexOf(c.pipeline_stage);
  const done = stageIndex < 0 ? 0 : stageIndex + 1;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground truncate">{fullName(c)}</h2>
              <Pill tone="ok">{c.role}</Pill>
              <Pill tone={toneFor(c)}>{c.pipeline_stage}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.state}{c.city ? ` · ${c.city}` : ""}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Next action</h3>
            <p className="text-sm text-foreground">{c.next_action ?? "—"}</p>
            {c.next_action_due && (
              <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(c.next_action_due).toLocaleDateString()}</p>
            )}
          </section>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <PipelineQuickActions candidate={c} />
          </div>

          {/* Lifecycle progress */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Lifecycle progress</h3>
              <span className="text-[11px] text-muted-foreground">{done} of {STAGE_PROGRESS.length} stages</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done/STAGE_PROGRESS.length)*100}%` }} />
            </div>
            <ul className="space-y-1.5">
              {STAGE_PROGRESS.map((s, i) => {
                const ok = i < done;
                return (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      : <span className="h-4 w-4 rounded-full border border-border/70 shrink-0" />}
                    <span className={cn("text-foreground", ok && "text-muted-foreground")}>{s}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Pipeline / app details */}
          <section className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline status</h3>
            <Row label="Stage"         value={c.pipeline_stage} />
            <Row label="Days in stage" value={`${daysInStage(c)}d`} />
            <Row label="Email"         value={c.email ?? "—"} />
            <Row label="Phone"         value={c.phone ?? "—"} />
            <Row label="Rating"        value={c.rating ? `${c.rating}/5` : "—"} />
          </section>

          {/* Move to stage */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Move to stage</h3>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onStageChange(s.key)}
                  className={cn(
                    "h-7 px-2.5 rounded-full border text-[11px] hover:bg-muted/40 transition",
                    c.pipeline_stage === s.key
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border/70 text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() => onStageChange("Rejected")}
                className="h-7 px-2.5 rounded-full border border-destructive/30 text-[11px] text-destructive hover:bg-destructive/5 transition inline-flex items-center gap-1"
              >
                <XCircle className="h-3 w-3" /> Mark not qualified
              </button>
            </div>
          </section>

          {isRbtLikeRole(c.role) && (
            <section className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                RBT classification (recruiter)
              </h3>
              <p className="text-[11px] text-muted-foreground mb-2">
                Required before this candidate can advance to Orientation, Onboarding, or Ready to Staff.
              </p>
              <div className="grid grid-cols-1 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  Certification status
                  <select
                    value={c.rbt_certification_status ?? "unknown"}
                    onChange={(e) =>
                      onClassificationChange({
                        rbt_certification_status: e.target.value as RbtCertificationStatus,
                      })
                    }
                    className="mt-1 w-full h-8 rounded-md border border-border/70 bg-card text-xs px-2"
                  >
                    <option value="unknown">Unknown — not captured yet</option>
                    <option value="not_certified">Not certified</option>
                    <option value="certified">Certified</option>
                  </select>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  Years of direct RBT experience
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={c.rbt_years_experience_direct ?? ""}
                    disabled={c.rbt_certification_status !== "certified"}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const num = raw === "" ? null : Number(raw);
                      onClassificationChange({
                        rbt_years_experience_direct: Number.isNaN(num as number) ? null : num,
                      });
                    }}
                    placeholder={c.rbt_certification_status === "certified" ? "e.g. 2" : "Only for certified"}
                    className="mt-1 w-full h-8 rounded-md border border-border/70 bg-card text-xs px-2 disabled:opacity-50"
                  />
                </label>
              </div>
            </section>
          )}

          {c.notes && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
              <p className="text-sm text-foreground bg-muted/30 border border-border/60 rounded-lg px-3 py-2 whitespace-pre-wrap">{c.notes}</p>
            </section>
          )}

          {/* Meta */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <Meta label="Recruiter"     value={c.recruiter ?? "Unassigned"} />
            <Meta label="Source"        value={c.source ?? "—"} />
            <Meta label="Applied"       value={new Date(c.applied_date).toLocaleDateString()} />
            <Meta label="Days in stage" value={`${daysInStage(c)}d`} />
            <Meta label="State"         value={c.state} />
            <Meta label="City"          value={c.city ?? "—"} />
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
function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Not available" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted/40 transition",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function PipelineQuickActions({ candidate }: { candidate: RecruitingCandidate }) {
  const mut = useRecruitingMutations();
  const log = async (kind: string, extra?: Record<string, unknown>) => {
    await mut.logActivity(candidate.id, "recruiting_candidates", candidate.id, kind, null, null, extra);
    toast.success(`Logged: ${kind.replace(/_/g, " ")}`);
  };
  const call = () => {
    const phone = (candidate as any).phone;
    if (phone) window.location.href = `tel:${phone}`;
    void log("call_placed");
  };
  const message = () => {
    const email = (candidate as any).email;
    if (email) window.location.href = `mailto:${email}`;
    void log("message_sent");
  };
  return (
    <>
      <QuickAction icon={Send} label="Send interview link" onClick={() => log("interview_link_sent")} />
      <QuickAction icon={GraduationCap} label="Send 40-hour link" onClick={() => log("training_link_sent")} />
      <QuickAction icon={ShieldCheck} label="Verify BACB" onClick={() => log("bacb_verified")} />
      <QuickAction icon={MessageSquare} label="Message" onClick={message} />
      <QuickAction icon={Phone} label="Call" onClick={call} />
      <QuickAction icon={Eye} label="Open profile" onClick={() => log("profile_opened")} />
    </>
  );
}