import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Filter, ChevronDown, X, Loader2, UserPlus, Clock, CheckCircle2,
  XCircle, AlertTriangle, Users, Inbox,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
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
import {
  useApploiIntegrationStatus,
  importApploiNormalizedRecords,
} from "@/hooks/useApploiIntegration";
import { classifyJobFamily, type RecruitingJobFamily } from "@/lib/recruiting/jobFamily";

/**
 * Shared first-class recruiting pipeline for a single hiring job family
 * (Office Staff / Clinic Staff).
 *
 * Everything rendered here comes from `recruiting_candidates` via
 * `useRecruitingCandidates`. There are no demo candidates, no synthetic
 * fallbacks, and no local-only workflow state: stage moves go through
 * `updateStage` (which persists `pipeline_stage` and writes a
 * `recruiting_activity_events` audit row) and candidate edits go through
 * `updateCandidate`.
 */

type Tone = "ok" | "warn" | "crit" | "muted";

export const CANONICAL_STAGES: { key: PipelineStage; label: string }[] = [
  { key: "New Applicant",         label: "New Applicant" },
  { key: "Phone Screen",          label: "Phone Screen / Needs Review" },
  { key: "Interview Scheduled",   label: "Interview Scheduled / Ready" },
  { key: "Interview Complete",    label: "Interview Complete" },
  { key: "Offer Sent",            label: "Offer Sent" },
  { key: "Offer Accepted",        label: "Offer Accepted" },
  { key: "Background Check",      label: "Background Check" },
  { key: "Orientation Scheduled", label: "Orientation Scheduled" },
  { key: "Onboarding",            label: "Onboarding" },
  { key: "Ready to Staff",        label: "Ready to Staff" },
];

export const EXCEPTION_STAGES: PipelineStage[] = ["On Hold", "Withdrawn", "Rejected"];

const STALLED_DAYS = 7;

function toneFor(c: RecruitingCandidate): Tone {
  if (EXCEPTION_STAGES.includes(c.pipeline_stage)) return "muted";
  const d = daysInStage(c);
  if (d >= STALLED_DAYS) return "crit";
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

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap",
      toneClass(tone),
    )}>{children}</span>
  );
}

function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export interface StaffFamilyPipelineProps {
  family: Extract<RecruitingJobFamily, "Office Staff" | "Clinic Staff">;
  title: string;
  description: string;
  searchPlaceholder: string;
}

export function StaffFamilyPipeline({
  family, title, description, searchPlaceholder,
}: StaffFamilyPipelineProps) {
  const { candidates, loading, updateStage, updateCandidate } = useRecruitingCandidates();
  const { status: apploiStatus } = useApploiIntegrationStatus();

  const [selected, setSelected] = useState<RecruitingCandidate | null>(null);
  const [search, setSearch] = useState("");
  const [stateF, setStateF] = useState("all");
  const [recruiterF, setRecruiterF] = useState("all");
  const [sourceF, setSourceF] = useState("all");
  const [chip, setChip] = useState<"all" | PipelineStage | "stalled" | "exceptions">("all");

  const familyCandidates = useMemo(
    () => candidates.filter((c) => classifyJobFamily(c) === family),
    [candidates, family],
  );

  const allStates = useMemo(
    () => Array.from(new Set(familyCandidates.map((c) => c.state).filter(Boolean))) as string[],
    [familyCandidates],
  );
  const allRecruiters = useMemo(
    () => Array.from(new Set(familyCandidates.map((c) => c.recruiter).filter(Boolean))) as string[],
    [familyCandidates],
  );
  const allSources = useMemo(
    () => Array.from(new Set(familyCandidates.map((c) => c.source).filter(Boolean))) as string[],
    [familyCandidates],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return familyCandidates.filter((c) => {
      if (stateF !== "all" && c.state !== stateF) return false;
      if (recruiterF !== "all" && c.recruiter !== recruiterF) return false;
      if (sourceF !== "all" && c.source !== sourceF) return false;
      if (chip === "stalled" && daysInStage(c) < STALLED_DAYS) return false;
      if (chip === "exceptions" && !EXCEPTION_STAGES.includes(c.pipeline_stage)) return false;
      if (chip !== "all" && chip !== "stalled" && chip !== "exceptions" && c.pipeline_stage !== chip) return false;
      if (!q) return true;
      return [
        fullName(c), c.applied_title, c.role, c.state, c.city,
        c.source, c.recruiter, c.email, c.pipeline_stage,
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [familyCandidates, search, stateF, recruiterF, sourceF, chip]);

  const buckets = useMemo(() => {
    const map = new Map<PipelineStage, RecruitingCandidate[]>();
    CANONICAL_STAGES.forEach((s) => map.set(s.key, []));
    EXCEPTION_STAGES.forEach((s) => map.set(s, []));
    filtered.forEach((c) => map.get(c.pipeline_stage)?.push(c));
    return map;
  }, [filtered]);

  const summary = useMemo(() => {
    const inStages = (stages: PipelineStage[]) =>
      familyCandidates.filter((c) => stages.includes(c.pipeline_stage)).length;
    return [
      { key: "active",   label: "Active",          value: familyCandidates.filter((c) => !EXCEPTION_STAGES.includes(c.pipeline_stage)).length, hint: `${familyCandidates.length} in family`, tone: "ok" as Tone },
      { key: "new",      label: "New Applicants",  value: inStages(["New Applicant"]),                                     hint: "Just landed",           tone: "ok" as Tone },
      { key: "screen",   label: "Screen / Review", value: inStages(["Phone Screen"]),                                      hint: "Needs recruiter review", tone: "warn" as Tone },
      { key: "interview",label: "In Interview",    value: inStages(["Interview Scheduled", "Interview Complete"]),         hint: "Scheduled + complete",  tone: "warn" as Tone },
      { key: "offer",    label: "Offer Stage",     value: inStages(["Offer Sent", "Offer Accepted"]),                      hint: "Sent or accepted",      tone: "warn" as Tone },
      { key: "onboard",  label: "Onboarding",      value: inStages(["Background Check", "Orientation Scheduled", "Onboarding"]), hint: "BG / orient / paperwork", tone: "warn" as Tone },
      { key: "ready",    label: "Ready to Staff",  value: inStages(["Ready to Staff"]),                                    hint: "Cleared for handoff",   tone: "ok" as Tone },
      { key: "stalled",  label: `Stalled ${STALLED_DAYS}+ Days`, value: familyCandidates.filter((c) => daysInStage(c) >= STALLED_DAYS).length, hint: "Needs intervention", tone: "crit" as Tone },
    ];
  }, [familyCandidates]);

  const byState = useMemo(
    () => allStates.map((s) => ({ key: s, count: familyCandidates.filter((c) => c.state === s).length })),
    [allStates, familyCandidates],
  );
  const byRecruiter = useMemo(
    () => allRecruiters.map((r) => ({ key: r, count: familyCandidates.filter((c) => c.recruiter === r).length })),
    [allRecruiters, familyCandidates],
  );
  const bySource = useMemo(
    () => allSources.map((s) => ({ key: s, count: familyCandidates.filter((c) => c.source === s).length })),
    [allSources, familyCandidates],
  );

  const handleApploiImport = async () => {
    if (apploiStatus !== "connected") { notifyApploiNotConnected(); return; }
    await importApploiNormalizedRecords();
  };

  const clearFilters = () => {
    setSearch(""); setStateF("all"); setRecruiterF("all"); setSourceF("all"); setChip("all");
  };
  const filtersActive = !!search || stateF !== "all" || recruiterF !== "all" || sourceF !== "all" || chip !== "all";

  return (
    <OSShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/70 bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="max-w-[1500px] mx-auto px-6 py-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Link to="/recruiting-team" className="hover:text-foreground transition">Recruiting</Link>
              <span>/</span>
              <span>Candidates</span>
              <span>/</span>
              <span className="text-foreground">{title}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApploiImport}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border/70 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Import from Apploi
                </button>
                <Link
                  to="/recruiting/pipeline"
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                >
                  <Users className="h-3.5 w-3.5" /> All applicants
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-border/70 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Select value={stateF}     onChange={setStateF}     options={[{v:"all",l:"All states"},     ...allStates.map((s)=>({v:s,l:s}))]} />
              <Select value={recruiterF} onChange={setRecruiterF} options={[{v:"all",l:"All recruiters"}, ...allRecruiters.map((r)=>({v:r,l:r}))]} />
              <Select value={sourceF}    onChange={setSourceF}    options={[{v:"all",l:"All sources"},    ...allSources.map((s)=>({v:s,l:s}))]} />
              {filtersActive && (
                <button onClick={clearFilters} className="h-10 px-3 rounded-xl text-muted-foreground hover:bg-muted transition inline-flex items-center gap-1 text-sm">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading candidates…
            </div>
          )}

          {/* SUMMARY */}
          <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {summary.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setChip(s.key === "stalled" ? (chip === "stalled" ? "all" : "stalled") : "all")}
                className={cn(
                  "rounded-2xl border bg-card text-left p-3.5 transition hover:-translate-y-0.5",
                  s.key === "stalled" && chip === "stalled" ? "border-primary/40 ring-2 ring-primary/20" : "border-border/70",
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
            ))}
          </section>

          {/* SEGMENT CHIPS: state / recruiter / source */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <ChipGroup title="By state"     items={byState}     active={stateF}     onSelect={setStateF} />
            <ChipGroup title="By recruiter" items={byRecruiter} active={recruiterF} onSelect={setRecruiterF} />
            <ChipGroup title="By source"    items={bySource}    active={sourceF}    onSelect={setSourceF} />
          </section>

          {/* STAGE CHIPS */}
          <section className="flex flex-wrap items-center gap-1.5">
            <Chip active={chip === "all"} onClick={() => setChip("all")}>All</Chip>
            {CANONICAL_STAGES.map((s) => (
              <Chip key={s.key} active={chip === s.key} onClick={() => setChip(s.key)}>{s.label}</Chip>
            ))}
            <Chip active={chip === "exceptions"} onClick={() => setChip("exceptions")}>On Hold / Withdrawn / Rejected</Chip>
            <Chip active={chip === "stalled"} onClick={() => setChip("stalled")} tone="crit">Stalled {STALLED_DAYS}+ days</Chip>
          </section>

          {/* BOARD */}
          <section className="overflow-x-auto -mx-2 px-2 pb-3">
            <div className="flex gap-3 min-w-max">
              {[...CANONICAL_STAGES, ...EXCEPTION_STAGES.map((s) => ({ key: s, label: s }))].map((s) => {
                const list = buckets.get(s.key) ?? [];
                const stalled = list.filter((c) => daysInStage(c) >= STALLED_DAYS).length;
                const avg = list.length
                  ? Math.round(list.reduce((a, c) => a + daysInStage(c), 0) / list.length)
                  : 0;
                return (
                  <div
                    key={s.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("text/candidate-id");
                      if (id) void updateStage(id, s.key);
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
                      ) : list.map((c) => (
                        <CandidateCard
                          key={c.id}
                          candidate={c}
                          onOpen={() => setSelected(c)}
                          onDragStart={(e) => e.dataTransfer.setData("text/candidate-id", c.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STALLED QUEUE */}
          <section className="rounded-2xl border border-border/70 bg-card p-4">
            <header className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-semibold text-foreground">Stalled &amp; aging</h3>
              </div>
              <span className="text-xs text-muted-foreground">Oldest time-in-stage first</span>
            </header>
            {(() => {
              const aging = familyCandidates
                .filter((c) => !["Withdrawn", "Rejected"].includes(c.pipeline_stage))
                .sort((a, b) => daysInStage(b) - daysInStage(a))
                .slice(0, 8);
              if (aging.length === 0) {
                return <p className="text-sm text-muted-foreground py-6 text-center">No {family.toLowerCase()} candidates in the pipeline yet.</p>;
              }
              return (
                <ul className="space-y-2">
                  {aging.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:bg-muted/30 transition">
                      <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground shrink-0">
                        {initials(fullName(c))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{fullName(c)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {c.applied_title ?? c.role} · {c.state} · {c.recruiter ?? "Unassigned"} · {c.pipeline_stage}
                        </p>
                      </div>
                      <Pill tone={toneFor(c)}>{daysInStage(c)}d</Pill>
                      <button
                        onClick={() => setSelected(c)}
                        className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-lg border border-border/70 text-xs hover:bg-muted/40 transition"
                      >
                        Open
                      </button>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>
        </div>

        <CandidateSlideout
          candidate={selected}
          family={family}
          onClose={() => setSelected(null)}
          onStageChange={async (stage) => {
            if (!selected) return;
            const ok = await updateStage(selected.id, stage);
            if (ok) setSelected({ ...selected, pipeline_stage: stage });
          }}
          onPatch={async (patch) => {
            if (!selected) return;
            const ok = await updateCandidate(selected.id, patch);
            if (ok) setSelected({ ...selected, ...patch } as RecruitingCandidate);
          }}
        />
      </div>
    </OSShell>
  );
}

/* ---------- Cards & controls ---------- */

function CandidateCard({
  candidate: c, onOpen, onDragStart,
}: {
  candidate: RecruitingCandidate;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const d = daysInStage(c);
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
            {c.applied_title ?? c.role} · {c.state} · {c.source ?? "—"}
          </p>
        </div>
        <Pill tone={toneFor(c)}>{d}d</Pill>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{c.recruiter ?? "Unassigned"}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {c.next_action ?? c.pipeline_stage}
        </span>
      </div>
    </article>
  );
}

function ChipGroup({
  title, items, active, onSelect,
}: {
  title: string;
  items: { key: string; count: number }[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3">
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <button
              key={i.key}
              onClick={() => onSelect(active === i.key ? "all" : i.key)}
              className={cn(
                "h-7 px-2.5 rounded-full border text-[11px] transition",
                active === i.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-foreground border-border/70 hover:bg-muted",
              )}
            >
              {i.key} · {i.count}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="relative">
      <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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

/* ---------- Slideout ---------- */

function CandidateSlideout({
  candidate, family, onClose, onStageChange, onPatch,
}: {
  candidate: RecruitingCandidate | null;
  family: "Office Staff" | "Clinic Staff";
  onClose: () => void;
  onStageChange: (stage: PipelineStage) => void | Promise<void>;
  onPatch: (patch: Partial<RecruitingCandidate>) => void | Promise<void>;
}) {
  useSlideout(!!candidate, onClose);
  const [titleDraft, setTitleDraft] = useState("");
  if (!candidate) return null;
  const c = candidate;
  const idx = CANONICAL_STAGES.findIndex((s) => s.key === c.pipeline_stage);
  const done = idx < 0 ? 0 : idx + 1;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/10 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground truncate">{fullName(c)}</h2>
              <Pill tone="ok">{family}</Pill>
              <Pill tone={toneFor(c)}>{c.pipeline_stage}</Pill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.applied_title ?? c.role} · {c.state}{c.city ? ` · ${c.city}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted grid place-items-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Lifecycle progress</h3>
              <span className="text-[11px] text-muted-foreground">{done} of {CANONICAL_STAGES.length} stages</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done / CANONICAL_STAGES.length) * 100}%` }} />
            </div>
            <ul className="space-y-1.5">
              {CANONICAL_STAGES.map((s, i) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  {i < done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    : <span className="h-4 w-4 rounded-full border border-border/70 shrink-0" />}
                  <span className={cn("text-foreground", i < done && "text-muted-foreground")}>{s.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Details</h3>
            <Row label="Applied title"  value={c.applied_title ?? "—"} />
            <Row label="Persisted role" value={c.role} />
            <Row label="Days in stage"  value={`${daysInStage(c)}d`} />
            <Row label="Recruiter"      value={c.recruiter ?? "Unassigned"} />
            <Row label="Source"         value={c.source ?? "—"} />
            <Row label="Email"          value={c.email ?? "—"} />
            <Row label="Phone"          value={c.phone ?? "—"} />
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Move to stage</h3>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => void onStageChange(s.key)}
                  className={cn(
                    "h-7 px-2.5 rounded-full border text-[11px] hover:bg-muted/40 transition",
                    c.pipeline_stage === s.key ? "border-primary/40 bg-primary/5 text-primary" : "border-border/70 text-foreground",
                  )}
                >
                  {s.key}
                </button>
              ))}
              {EXCEPTION_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => void onStageChange(s)}
                  className={cn(
                    "h-7 px-2.5 rounded-full border text-[11px] transition inline-flex items-center gap-1",
                    c.pipeline_stage === s
                      ? "border-destructive/40 bg-destructive/5 text-destructive"
                      : "border-destructive/30 text-destructive hover:bg-destructive/5",
                  )}
                >
                  <XCircle className="h-3 w-3" /> {s}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground">Job family &amp; title</h3>
            <input
              value={titleDraft || (c.applied_title ?? "")}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Applied title (e.g. Scheduling Coordinator)"
              className="w-full h-9 px-3 rounded-lg bg-card border border-border/70 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void onPatch({ applied_title: (titleDraft || c.applied_title || "").trim() || null })}
                className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
              >
                Save title
              </button>
              {c.role !== family && (
                <button
                  onClick={() => void onPatch({ role: family as RecruitingCandidate["role"] })}
                  className="h-8 px-3 rounded-lg border border-border/70 text-xs hover:bg-muted/40 transition"
                >
                  Set role to {family}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right break-words">{value}</span>
    </div>
  );
}