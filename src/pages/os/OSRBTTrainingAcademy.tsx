import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle, CheckCircle2, Lock, Clock, ChevronRight, Sparkles,
  BookOpen, LifeBuoy, MessageSquare, FileText, ListChecks, Video,
  GraduationCap, ArrowRight,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// RBT Training Academy — calm, guided, mobile-first.
// Module structure mirrors the existing RBT journey logic; this is a UX redesign.

type ModuleStatus = "completed" | "in_progress" | "not_started" | "locked";
type ModuleType = "SOP" | "Video" | "Walkthrough" | "Checklist" | "Overview";

type Module = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  type: ModuleType;
  status: ModuleStatus;
  progress?: number; // 0–100
  required?: boolean;
};

const MODULES: Module[] = [
  { id: "m1", title: "Welcome to Blossom",            summary: "Mission, values, and how we support families.",                minutes: 6,  type: "Overview",    status: "completed",   progress: 100, required: true },
  { id: "m2", title: "RBT Role Foundations",          summary: "Scope of practice, ethics, and how RBTs fit the team.",        minutes: 12, type: "SOP",         status: "completed",   progress: 100, required: true },
  { id: "m3", title: "Working With Clients",          summary: "Rapport, reinforcement, and respectful first impressions.",    minutes: 10, type: "Video",       status: "in_progress", progress: 60,  required: true },
  { id: "m4", title: "Session Expectations",          summary: "Arrival, structure, transitions, and clean wrap-ups.",         minutes: 7,  type: "Walkthrough", status: "not_started", required: true },
  { id: "m5", title: "Communication Standards",       summary: "Parent comms, professional tone, what to escalate.",            minutes: 8,  type: "SOP",         status: "not_started", required: true },
  { id: "m6", title: "Supervision & BCBA Support",    summary: "How supervision works and how to make the most of it.",         minutes: 9,  type: "Overview",    status: "not_started" },
  { id: "m7", title: "Using Blossom OS",              summary: "My Day, schedule changes, resources, and quick help.",          minutes: 5,  type: "Walkthrough", status: "not_started" },
  { id: "m8", title: "Safety & Escalations",          summary: "Recognizing risk and following the escalation path.",           minutes: 11, type: "SOP",         status: "locked",      required: true },
  { id: "m9", title: "Documentation Expectations",    summary: "Session notes, timeliness, and data integrity.",                 minutes: 8,  type: "Checklist",   status: "locked" },
  { id: "m10", title: "Professionalism & Field Standards", summary: "Reliability, appearance, boundaries, and conduct.",        minutes: 7,  type: "SOP",         status: "locked" },
];

const RESOURCES = [
  { id: "r1", title: "Session-ready checklist",     type: "Checklist", icon: ListChecks },
  { id: "r2", title: "Parent communication script", type: "SOP",       icon: FileText },
  { id: "r3", title: "Safety & escalation flow",    type: "SOP",       icon: FileText },
  { id: "r4", title: "Blossom OS quick tour",       type: "Video",     icon: Video },
];

function firstName(n?: string | null) { return n ? n.trim().split(/\s+/)[0] : "there"; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function OSRBTTrainingAcademy() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);
  const [filter, setFilter] = useState<"all" | "required" | "in_progress">("all");

  const stats = useMemo(() => {
    const total = MODULES.length;
    const completed = MODULES.filter((m) => m.status === "completed").length;
    const required = MODULES.filter((m) => m.required).length;
    const requiredDone = MODULES.filter((m) => m.required && m.status === "completed").length;
    const pct = Math.round((completed / total) * 100);
    return { total, completed, pct, required, requiredDone };
  }, []);

  const current = MODULES.find((m) => m.status === "in_progress")
    ?? MODULES.find((m) => m.status === "not_started");

  const filtered = MODULES.filter((m) =>
    filter === "required" ? m.required :
    filter === "in_progress" ? (m.status === "in_progress" || m.status === "not_started") :
    true
  );

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-5 md:px-6 md:pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Training Academy</span>
        </div>
        {/* 1. Academy Welcome Header */}
        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">RBT Training Academy</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You're {stats.pct}% through your RBT journey. {stats.required - stats.requiredDone > 0
              ? `${stats.required - stats.requiredDone} required module${stats.required - stats.requiredDone === 1 ? "" : "s"} left.`
              : "All required modules complete — nice work."}
          </p>

          <div className="mt-5">
            <ProgressBar value={stats.pct} />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{stats.completed} of {stats.total} modules</span>
              <span>{stats.pct}%</span>
            </div>
          </div>
        </header>

        {/* 2. Continue Learning */}
        {current && <ContinueCard module={current} />}

        {/* 3 + 4. RBT Journey Path with module cards */}
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Your RBT journey</h2>
              <p className="text-xs text-muted-foreground">Sequential path — complete to unlock the next.</p>
            </div>
            <FilterPills value={filter} onChange={setFilter} />
          </div>

          <ol className="relative space-y-3">
            <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
            {filtered.map((m, i) => (
              <ModuleRow key={m.id} module={m} index={i + 1} />
            ))}
          </ol>
        </section>

        {/* 6. Recommended Resources */}
        <section className="space-y-2">
          <div className="flex items-end justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Recommended for you</h2>
            <Link to="/rbt/resources" className="text-sm text-primary hover:opacity-80">View library</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.id}
                  to="/rbt/resources"
                  className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* 7. Support & Help */}
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Support</p>
          </div>
          <p className="mt-2 text-sm text-foreground">Stuck on something? We're here.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <SupportLink to="/ask-blossom" icon={Sparkles} label="Ask Blossom AI" />
            <SupportLink to="/rbt/help" icon={LifeBuoy} label="Get help" />
            <SupportLink to="/rbt/messages" icon={MessageSquare} label="Contact training" />
          </div>
        </section>
      </div>
    </OSShell>
  );
}

// --- Subcomponents ---

function ContinueCard({ module: m }: { module: Module }) {
  const isResume = m.status === "in_progress";
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_32px_-16px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <PlayCircle className="size-3.5" /> {isResume ? "Continue learning" : "Start next module"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {isResume && m.progress ? `${Math.max(1, Math.round(m.minutes * (1 - m.progress / 100)))} min left` : `${m.minutes} min`}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{m.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>

      {isResume && typeof m.progress === "number" && (
        <div className="mt-4">
          <ProgressBar value={m.progress} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {isResume ? "Resume" : "Start"} <ArrowRight className="size-4" />
        </button>
        <span className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-4 text-xs font-medium text-secondary-foreground">
          <TypeIcon type={m.type} className="size-3.5" /> {m.type}
        </span>
      </div>
    </section>
  );
}

function ModuleRow({ module: m, index }: { module: Module; index: number }) {
  const dotCls =
    m.status === "completed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : m.status === "in_progress" ? "border-primary/40 bg-primary/10 text-primary"
    : m.status === "locked" ? "border-border/70 bg-muted text-muted-foreground"
    : "border-border/70 bg-card text-muted-foreground";

  const statusLabel =
    m.status === "completed" ? "Completed"
    : m.status === "in_progress" ? `${m.progress ?? 0}% in progress`
    : m.status === "locked" ? "Locked"
    : "Not started";

  const isLocked = m.status === "locked";

  return (
    <li className="relative pl-10">
      <span className={cn("absolute left-2 top-4 grid size-6 place-items-center rounded-full border bg-card", dotCls)}>
        {m.status === "completed" ? <CheckCircle2 className="size-3.5" />
          : m.status === "locked" ? <Lock className="size-3" />
          : <span className="text-[10px] font-semibold tabular-nums">{index}</span>}
      </span>

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-card p-4 transition",
          "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]",
          isLocked ? "opacity-60" : "hover:-translate-y-0.5 hover:border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              {m.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{m.summary}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {m.minutes} min</span>
              <span className="inline-flex items-center gap-1"><TypeIcon type={m.type} className="size-3" /> {m.type}</span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>

            {m.status === "in_progress" && typeof m.progress === "number" && (
              <div className="mt-3"><ProgressBar value={m.progress} /></div>
            )}
          </div>

          {!isLocked && (
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 rounded-xl border border-border/70 bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-muted sm:inline-flex"
            >
              {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
              <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        {!isLocked && (
          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 sm:hidden"
          >
            {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function FilterPills({
  value, onChange,
}: { value: "all" | "required" | "in_progress"; onChange: (v: "all" | "required" | "in_progress") => void }) {
  const opts: { v: typeof value; label: string }[] = [
    { v: "all",         label: "All" },
    { v: "required",    label: "Required" },
    { v: "in_progress", label: "To do" },
  ];
  return (
    <div className="inline-flex rounded-full border border-border/70 bg-muted/50 p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            value === o.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function TypeIcon({ type, className }: { type: ModuleType; className?: string }) {
  const map: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
    SOP: FileText, Video: Video, Walkthrough: PlayCircle, Checklist: ListChecks, Overview: GraduationCap,
  };
  const Icon = map[type] ?? BookOpen;
  return <Icon className={className} />;
}

function SupportLink({
  to, icon: Icon, label,
}: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/60 p-3 text-sm font-medium text-foreground transition hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </Link>
  );
}
