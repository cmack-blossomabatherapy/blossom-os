import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Search, ShieldCheck, AlertTriangle, Compass, UserCircle2,
  ClipboardCheck, FileText, X, MessageSquare, BookOpen, Sparkles,
  PlayCircle, CheckCircle2, Clock, Ban, ArrowRight, GraduationCap,
  CircleDot, ListChecks,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { RBT_PATHS, type RBTPathId, type SignoffItem } from "@/lib/training/rbtAcademy";
import {
  useReadinessTrainees, summarize, READINESS_TONE, EXPERIENCE_BUCKETS,
  CERTIFICATION_STATUSES,
  assignPathRow, recordSignoffRow, markBlockedRow,
  setNeedsCoachingRow, updateAssignmentRow, addCoachingNoteRow,
  type RBTTrainee, type ReadinessStatus, type ExperienceBucket,
  type CertificationStatus,
} from "@/lib/training/rbtReadiness";
import { useRBTResources, getResourcesForModule } from "@/lib/training/rbtResources";

const ADMIN_ROLES = new Set([
  "admin", "super_admin", "training_admin",
  "hr", "hr_admin", "hr_manager",
  "bcba", "bcba_supervisor", "clinical_director", "clinical_leadership",
  "lead_rbt_trainer", "operations", "coo",
]);

const STATUS_ORDER: ReadinessStatus[] = [
  "Blocked", "Needs Coaching", "Awaiting BCBA Signoff",
  "Awaiting Lead RBT Signoff", "In Training", "Not Started",
  "Ready for Independent Assignment",
];

const STATE_CHIPS = ["All", "GA", "NC", "TN", "VA", "MD"] as const;

export default function OSRBTAcademyAdmin() {
  const { roles } = useAuth();
  const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));
  const { trainees, loading, empty } = useReadinessTrainees();

  const [query, setQuery] = useState("");
  const [state, setState] = useState<(typeof STATE_CHIPS)[number]>("All");
  const [clinic, setClinic] = useState<string>("All");
  const [trainer, setTrainer] = useState<string>("All");
  const [bcba, setBcba] = useState<string>("All");
  const [bucket, setBucket] = useState<ExperienceBucket | "All">("All");
  const [cert, setCert] = useState<CertificationStatus | "All">("All");
  const [status, setStatus] = useState<ReadinessStatus | "All">("All");
  const [hiredAfter, setHiredAfter] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const distinct = useMemo(() => ({
    clinics: ["All", ...Array.from(new Set(trainees.map((t) => t.clinic ?? "—")))],
    trainers: ["All", ...Array.from(new Set(trainees.map((t) => t.leadRbtTrainer ?? "Unassigned")))],
    bcbas: ["All", ...Array.from(new Set(trainees.map((t) => t.bcba ?? "Unassigned")))],
  }), [trainees]);

  const enriched = useMemo(
    () => trainees.map((t) => ({ t, s: summarize(t) })),
    [trainees],
  );

  const counts = useMemo(() => {
    const acc: Record<ReadinessStatus, number> = {
      "Not Started": 0, "In Training": 0, "Needs Coaching": 0,
      "Awaiting Lead RBT Signoff": 0, "Awaiting BCBA Signoff": 0,
      "Ready for Independent Assignment": 0, Blocked: 0,
    };
    enriched.forEach(({ s }) => { acc[s.status]++; });
    return acc;
  }, [enriched]);

  const rows = useMemo(() => {
    return enriched
      .filter(({ t }) => state === "All" || t.state === state)
      .filter(({ t }) => clinic === "All" || (t.clinic ?? "—") === clinic)
      .filter(({ t }) => trainer === "All" || (t.leadRbtTrainer ?? "Unassigned") === trainer)
      .filter(({ t }) => bcba === "All" || (t.bcba ?? "Unassigned") === bcba)
      .filter(({ t }) => bucket === "All" || t.experienceBucket === bucket)
      .filter(({ t }) => cert === "All" || t.certification === cert)
      .filter(({ t }) => !hiredAfter || t.startDate >= hiredAfter)
      .filter(({ s }) => status === "All" || s.status === status)
      .filter(({ t, s }) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          (t.leadRbtTrainer ?? "").toLowerCase().includes(q) ||
          (t.bcba ?? "").toLowerCase().includes(q) ||
          s.path.label.toLowerCase().includes(q) ||
          (t.clinic ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => STATUS_ORDER.indexOf(a.s.status) - STATUS_ORDER.indexOf(b.s.status));
  }, [enriched, state, clinic, trainer, bcba, bucket, cert, hiredAfter, status, query]);

  const open = openId ? enriched.find(({ t }) => t.id === openId) ?? null : null;

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 pb-24 pt-5 md:px-6 md:pt-8">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt/training-academy" className="hover:text-foreground">RBT Training Academy</Link>
          <ChevronRight className="size-3" />
          <span>Admin Command Center</span>
        </div>

        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Training Admin · Clinical Leadership · Lead RBT Trainers · BCBAs</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">RBT Academy Command Center</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                One workspace to assign paths, record signoffs, resolve blockers, and clear RBTs for independent assignment.
              </p>
            </div>
            {!isAdmin && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                Read-only — your role can view but not edit.
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "All" : s)}
                className={cn(
                  "rounded-xl border bg-card p-2.5 text-left transition hover:bg-muted",
                  status === s ? "border-primary/60 ring-2 ring-primary/20" : "border-border/70",
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground line-clamp-2">{s}</p>
                <p className="mt-1 text-base font-semibold tabular-nums">{counts[s]}</p>
              </button>
            ))}
          </div>
        </header>

        <Filters
          query={query} setQuery={setQuery}
          state={state} setState={setState}
          clinic={clinic} setClinic={setClinic} clinics={distinct.clinics}
          trainer={trainer} setTrainer={setTrainer} trainers={distinct.trainers}
          bcba={bcba} setBcba={setBcba} bcbas={distinct.bcbas}
          bucket={bucket} setBucket={setBucket}
          cert={cert} setCert={setCert}
          hiredAfter={hiredAfter} setHiredAfter={setHiredAfter}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-2">
            {loading ? (
              <LoadingState />
            ) : empty ? (
              <EmptySetupState />
            ) : rows.length === 0 ? (
              <EmptyState />
            ) : rows.map(({ t, s }) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOpenId(t.id)}
                className={cn(
                  "w-full rounded-2xl border bg-card p-4 text-left transition hover:border-border",
                  openId === t.id ? "border-primary/50 ring-2 ring-primary/10" : "border-border/70",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold tracking-tight">{t.name}</h3>
                      <Chip>{t.state}{t.clinic ? ` · ${t.clinic}` : ""}</Chip>
                      <Chip muted>{s.path.label}</Chip>
                      {t.pathOverridden && <Chip warn>Path overridden</Chip>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.currentPhaseTitle.replace(/^Phase \d+ · /, "")} · {s.currentModuleTitle} ·
                      Hired {new Date(t.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={s.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                  <Mini icon={Compass} label="Lead RBT" value={t.leadRbtTrainer ?? "—"} />
                  <Mini icon={UserCircle2} label="BCBA" value={t.bcba ?? "—"} />
                  <Mini icon={ClipboardCheck} label="Signoffs" value={`${s.signedCount}/${s.requiredCount}`} />
                  <Mini icon={CircleDot} label="Cert" value={t.certification} />
                </div>
              </button>
            ))}
          </div>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            {open ? (
              <TraineePanel
                trainee={open.t}
                summaryStatus={open.s.status}
                isAdmin={isAdmin}
                onClose={() => setOpenId(null)}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-3 size-5 text-primary" />
                Select a trainee to manage their path, signoffs, and coaching.
              </div>
            )}
          </aside>
        </div>
      </div>
    </OSShell>
  );
}

// ---------- Filters ----------

function Filters(p: {
  query: string; setQuery: (v: string) => void;
  state: string; setState: (v: typeof STATE_CHIPS[number]) => void;
  clinic: string; setClinic: (v: string) => void; clinics: string[];
  trainer: string; setTrainer: (v: string) => void; trainers: string[];
  bcba: string; setBcba: (v: string) => void; bcbas: string[];
  bucket: ExperienceBucket | "All"; setBucket: (v: ExperienceBucket | "All") => void;
  cert: CertificationStatus | "All"; setCert: (v: CertificationStatus | "All") => void;
  hiredAfter: string; setHiredAfter: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={p.query} onChange={(e) => p.setQuery(e.target.value)}
            placeholder="Search trainee, trainer, BCBA, clinic, path…"
            className="w-full rounded-xl border border-border/70 bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
          {STATE_CHIPS.map((c) => (
            <button key={c} onClick={() => p.setState(c)} className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition",
              p.state === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}>{c}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select label="Clinic" value={p.clinic} onChange={p.setClinic} options={p.clinics} />
        <Select label="Lead RBT" value={p.trainer} onChange={p.setTrainer} options={p.trainers} />
        <Select label="BCBA" value={p.bcba} onChange={p.setBcba} options={p.bcbas} />
        <Select label="Experience" value={p.bucket} onChange={(v) => p.setBucket(v as ExperienceBucket | "All")}
          options={["All", ...EXPERIENCE_BUCKETS]} />
        <Select label="Certification" value={p.cert} onChange={(v) => p.setCert(v as CertificationStatus | "All")}
          options={["All", ...CERTIFICATION_STATUSES]} />
        <label className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground">Hired ≥</span>
          <input type="date" value={p.hiredAfter} onChange={(e) => p.setHiredAfter(e.target.value)}
            className="bg-transparent text-xs outline-none" />
          {p.hiredAfter && (
            <button type="button" onClick={() => p.setHiredAfter("")} className="text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </label>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-2.5 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="max-w-[160px] truncate bg-transparent text-xs font-medium text-foreground outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// ---------- Trainee panel ----------

function TraineePanel({ trainee: t, isAdmin, onClose }: {
  trainee: RBTTrainee; summaryStatus: ReadinessStatus; isAdmin: boolean; onClose: () => void;
}) {
  const s = summarize(t);
  const allResources = useRBTResources();
  const [tab, setTab] = useState<"overview" | "progress" | "evidence" | "actions" | "resources">("overview");

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-[0_8px_28px_-14px_oklch(0.2_0.02_260/0.18)]">
      <header className="flex items-start justify-between gap-3 border-b border-border/70 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{t.name}</h2>
            <StatusPill status={s.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {s.path.label} · {t.state}{t.clinic ? ` · ${t.clinic}` : ""} · Hired {new Date(t.startDate).toLocaleDateString()}
          </p>
        </div>
        <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Close">
          <X className="size-4" />
        </button>
      </header>

      <nav className="flex gap-1 border-b border-border/70 p-2">
        {([
          ["overview",  "Overview",  GraduationCap],
          ["progress",  "Progress",  PlayCircle],
          ["evidence",  "Evidence",  ClipboardCheck],
          ["actions",   "Actions",   ShieldCheck],
          ["resources", "Resources", BookOpen],
        ] as const).map(([v, label, Icon]) => (
          <button key={v} onClick={() => setTab(v)} className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition",
            tab === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </nav>

      <div className="max-h-[70vh] overflow-y-auto p-4">
        {tab === "overview"  && <OverviewTab  trainee={t} summary={s} isAdmin={isAdmin} />}
        {tab === "progress"  && <ProgressTab  trainee={t} />}
        {tab === "evidence"  && <EvidenceTab  trainee={t} />}
        {tab === "actions"   && <ActionsTab   trainee={t} summary={s} isAdmin={isAdmin} />}
        {tab === "resources" && <ResourcesTab trainee={t} all={allResources} />}
      </div>
    </div>
  );
}

function OverviewTab({ trainee: t, summary: s, isAdmin }: {
  trainee: RBTTrainee; summary: ReturnType<typeof summarize>; isAdmin: boolean;
}) {
  const [editAssign, setEditAssign] = useState(false);
  return (
    <div className="space-y-4">
      <section>
        <SectionTitle>Assigned path</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {RBT_PATHS.map((p) => {
            const active = p.id === t.pathId;
            return (
              <button
                key={p.id} disabled={!isAdmin}
                onClick={() => {
                  if (!confirm(`Reassign ${t.name} to "${p.label}"?\n\nThis resets signoff progress.`)) return;
                  void assignPathRow(t.id, p.id as RBTPathId, { override: true });
                }}
                className={cn(
                  "rounded-xl border p-2.5 text-left text-xs transition",
                  active ? "border-primary/50 bg-primary/5" : "border-border/70 hover:border-border",
                  !isAdmin && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{p.label}</span>
                  {active && <CheckCircle2 className="size-3.5 text-primary" />}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{p.tagline}</p>
              </button>
            );
          })}
        </div>
        {t.pathOverridden && (
          <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300">
            Path overridden by admin — auto-bucketing is disabled for this trainee.
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <SectionTitle>Ownership</SectionTitle>
          {isAdmin && (
            <button onClick={() => setEditAssign((v) => !v)} className="text-[11px] font-medium text-primary hover:underline">
              {editAssign ? "Done" : "Edit"}
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Assign icon={Compass} label="Lead RBT Trainer" value={t.leadRbtTrainer}
            editing={editAssign} onChange={(v) => void updateAssignmentRow(t.id, "leadRbtTrainer", v)} />
          <Assign icon={UserCircle2} label="BCBA" value={t.bcba}
            editing={editAssign} onChange={(v) => void updateAssignmentRow(t.id, "bcba", v)} />
          <Assign icon={ClipboardCheck} label="Training Admin" value={t.trainingAdmin}
            editing={editAssign} onChange={(v) => void updateAssignmentRow(t.id, "trainingAdmin", v)} />
          <Assign icon={FileText} label="Documentation Reviewer" value={t.documentationReviewer}
            editing={editAssign} onChange={(v) => void updateAssignmentRow(t.id, "documentationReviewer", v)} />
        </div>
      </section>

      {s.missing.length > 0 && (
        <section>
          <SectionTitle>Missing for independent readiness ({s.missing.length})</SectionTitle>
          <ul className="space-y-1 rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs">
            {s.missing.map((m) => (
              <li key={m} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProgressTab({ trainee: t }: { trainee: RBTTrainee }) {
  const path = RBT_PATHS.find((p) => p.id === t.pathId)!;
  const progress = t.moduleProgress ?? {};
  return (
    <div className="space-y-3">
      {path.phases.map((phase, idx) => (
        <div key={phase.id} className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Phase {idx}</p>
          <p className="text-sm font-medium">{phase.title.replace(/^Phase \d+ · /, "")}</p>
          <ul className="mt-2 space-y-1">
            {phase.modules.map((m) => {
              const st = progress[m.id]?.status ?? m.status;
              const tone =
                st === "completed" ? "text-emerald-600 dark:text-emerald-400"
                : st === "in_progress" ? "text-primary"
                : "text-muted-foreground";
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs">
                  <span className="truncate">{m.title}</span>
                  <span className={cn("shrink-0 text-[11px] font-medium", tone)}>
                    {st === "completed" ? "Done" : st === "in_progress" ? `${progress[m.id]?.progress ?? m.progress ?? 0}%` : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EvidenceTab({ trainee: t }: { trainee: RBTTrainee }) {
  return (
    <div className="space-y-4">
      <section>
        <SectionTitle>Quiz & test results</SectionTitle>
        {(t.quizResults ?? []).length === 0 ? (
          <Empty>No quiz results recorded yet.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {t.quizResults!.map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs">
                <div>
                  <p className="font-medium">{q.title}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(q.takenAt).toLocaleDateString()}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium",
                  q.passed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive")}>
                  {q.score}% · {q.passed ? "Passed" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Shadowing</SectionTitle>
        {(t.shadowRecords ?? []).length === 0 ? (
          <Empty>No shadow sessions logged.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {t.shadowRecords!.map((r) => (
              <li key={r.id} className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.title}</p>
                  <Chip muted>{r.status}</Chip>
                </div>
                <p className="text-[11px] text-muted-foreground">{r.observer} · {new Date(r.date).toLocaleDateString()}</p>
                {r.notes && <p className="mt-1 text-[11px] text-foreground/80">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle>Mock session note review</SectionTitle>
        {(t.mockNoteReviews ?? []).length === 0 ? (
          <Empty>No mock note submissions reviewed yet.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {t.mockNoteReviews!.map((r) => (
              <li key={r.id} className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.reviewer}</p>
                  <Chip muted>{r.status}</Chip>
                </div>
                <p className="text-[11px] text-muted-foreground">{new Date(r.date).toLocaleDateString()}</p>
                {r.feedback && <p className="mt-1 text-[11px] text-foreground/80">{r.feedback}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActionsTab({ trainee: t, summary: s, isAdmin }: {
  trainee: RBTTrainee; summary: ReturnType<typeof summarize>; isAdmin: boolean;
}) {
  const [noteText, setNoteText] = useState("");
  const [noteRole, setNoteRole] = useState<"Lead RBT Trainer" | "BCBA" | "Training Admin" | "Clinical Leadership">("Lead RBT Trainer");
  const [blockReason, setBlockReason] = useState(t.flags?.blocked?.reason ?? "");

  return (
    <div className="space-y-4">
      <section>
        <SectionTitle>Required signoffs</SectionTitle>
        <ul className="space-y-1.5">
          {s.requiredSignoffs.map(({ item, status }) => (
            <SignoffRow
              key={item.id}
              item={item}
              status={status}
              traineeId={t.id}
              currentSignoffs={t.signoffs}
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-3">
        <SectionTitle>Coaching</SectionTitle>
        <label className="flex items-center justify-between gap-2 text-xs">
          <span>Mark this trainee as <b>Needs Coaching</b></span>
          <input
            type="checkbox"
            disabled={!isAdmin}
            checked={!!t.flags?.needsCoaching}
            onChange={(e) => void setNeedsCoachingRow(t.id, e.target.checked, t.flags)}
          />
        </label>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">As</span>
            <select value={noteRole} onChange={(e) => setNoteRole(e.target.value as never)}
              className="rounded-md border border-border/70 bg-card px-2 py-1 text-xs">
              <option>Lead RBT Trainer</option>
              <option>BCBA</option>
              <option>Training Admin</option>
              <option>Clinical Leadership</option>
            </select>
          </div>
          <textarea
            value={noteText} onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a coaching note…"
            disabled={!isAdmin}
            className="min-h-[80px] w-full rounded-lg border border-border/70 bg-card p-2 text-xs outline-none focus:border-primary/60"
          />
          <button
            type="button" disabled={!isAdmin || !noteText.trim()}
            onClick={() => {
              void addCoachingNoteRow(t.id, t.flags, t.coachingNotes, { author: "You", authorRole: noteRole, text: noteText.trim() });
              setNoteText("");
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            Add note
          </button>
        </div>
        {(t.coachingNotes ?? []).length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {t.coachingNotes!.slice().reverse().map((n) => (
              <li key={n.id} className="rounded-lg border border-border/60 bg-secondary/40 p-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span><b className="text-foreground">{n.author}</b> · {n.authorRole}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-foreground/90">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
        <SectionTitle>Blocked status</SectionTitle>
        {t.flags?.blocked ? (
          <div className="space-y-2 text-xs">
            <p className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-3.5" /> Blocked: {t.flags.blocked.reason}
            </p>
            <button
              type="button" disabled={!isAdmin}
              onClick={() => void markBlockedRow(t.id, null, t.flags)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" /> Clear block
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (e.g. background check pending)"
              disabled={!isAdmin}
              className="h-8 w-full rounded-lg border border-border/70 bg-card px-2 text-xs outline-none focus:border-destructive/60"
            />
            <button
              type="button" disabled={!isAdmin || !blockReason.trim()}
              onClick={() => void markBlockedRow(t.id, blockReason.trim(), t.flags)}
              className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Ban className="size-3.5" /> Mark blocked
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SignoffRow({ item, status, traineeId, currentSignoffs, isAdmin }: {
  item: SignoffItem; status: SignoffItem["status"]; traineeId: string;
  currentSignoffs: Record<string, SignoffItem["status"]>; isAdmin: boolean;
}) {
  const signed = status === "signed";
  return (
    <li className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/40 p-2.5 text-xs">
      <span className={cn(
        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
        signed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
               : "border-border/70 bg-card text-muted-foreground",
      )}>
        {signed ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="font-medium text-foreground">{item.label}</p>
          {item.required && <Chip>Required</Chip>}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Owner · {item.owner}</p>
      </div>
      <button
        type="button" disabled={!isAdmin}
        onClick={() => void recordSignoffRow(traineeId, item.id, signed ? "pending" : "signed", currentSignoffs)}
        className={cn(
          "shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-50",
          signed ? "border-border/70 bg-card text-muted-foreground hover:bg-muted"
                 : "border-primary/40 bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        {signed ? "Revoke" : "Sign off"}
      </button>
    </li>
  );
}

function ResourcesTab({ trainee: t, all }: {
  trainee: RBTTrainee; all: ReturnType<typeof useRBTResources>;
}) {
  const path = RBT_PATHS.find((p) => p.id === t.pathId)!;
  const phase = path.phases[Math.min(t.currentPhaseIndex, path.phases.length - 1)];
  const moduleId = t.currentModuleId;
  const attached = getResourcesForModule(all, moduleId);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Manage resources directly from the academy. New attachments here apply to the whole module.
      </p>
      <div className="rounded-xl border border-border/70 bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current module</p>
        <p className="mt-0.5 text-sm font-medium">{phase.modules.find((m) => m.id === moduleId)?.title ?? "—"}</p>
        {attached.length === 0 ? (
          <Empty>No resources attached to this module yet.</Empty>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {attached.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 p-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">{r.type}{r.minutes ? ` · ${r.minutes} min` : ""}</p>
                </div>
                {r.url && (
                  /^https?:\/\//.test(r.url) ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] text-primary hover:underline">Open</a>
                  ) : (
                    <Link to={r.url} className="shrink-0 text-[11px] text-primary hover:underline">Open</Link>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        to="/rbt/training-academy"
        className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-xs font-medium hover:bg-muted"
      >
        <span className="inline-flex items-center gap-2"><BookOpen className="size-3.5" /> Open Academy · Resources tab (add / edit)</span>
        <ArrowRight className="size-3.5 text-muted-foreground" />
      </Link>
    </div>
  );
}

// ---------- Tiny helpers ----------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border/70 bg-card p-3 text-center text-[11px] text-muted-foreground">{children}</p>;
}
function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
      <ListChecks className="mx-auto mb-3 size-5 text-muted-foreground" />
      No trainees match these filters.
    </div>
  );
}
function LoadingState() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
      <ClipboardCheck className="mx-auto mb-3 size-5 text-muted-foreground animate-pulse" />
      Loading readiness records…
    </div>
  );
}
function EmptySetupState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center text-sm text-muted-foreground">
      <Sparkles className="mx-auto mb-3 size-5 text-primary" />
      <p className="text-foreground font-medium">No RBT readiness records yet</p>
      <p className="mt-1 text-xs">
        As RBTs are added to the Academy, their readiness records will appear here.
        Records live in <code className="rounded bg-muted px-1 py-0.5 text-[10px]">rbt_readiness_records</code>.
      </p>
    </div>
  );
}
function Mini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}
function Chip({ children, muted, warn }: { children: React.ReactNode; muted?: boolean; warn?: boolean }) {
  return (
    <span className={cn(
      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
      warn ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : muted ? "bg-secondary text-foreground"
      : "bg-primary/10 text-primary",
    )}>{children}</span>
  );
}
function StatusPill({ status }: { status: ReadinessStatus }) {
  const tone = READINESS_TONE[status];
  const cls =
    tone === "good" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
    : tone === "warn" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
    : tone === "bad" ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cls)}>
      <ShieldCheck className="size-3" />{status}
    </span>
  );
}
function Assign({ icon: Icon, label, value, editing, onChange }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | null;
  editing: boolean; onChange: (v: string | null) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      {editing ? (
        <input
          defaultValue={value ?? ""} placeholder="Unassigned"
          onBlur={(e) => onChange(e.target.value.trim() || null)}
          className="mt-1 h-7 w-full rounded-md border border-border/70 bg-card px-2 text-xs outline-none focus:border-primary/60"
        />
      ) : (
        <p className={cn("mt-0.5 truncate text-xs font-medium", value ? "text-foreground" : "italic text-muted-foreground")}>
          {value ?? "Unassigned"}
        </p>
      )}
    </div>
  );
}