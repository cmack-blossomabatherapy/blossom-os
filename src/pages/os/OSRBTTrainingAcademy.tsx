import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle, CheckCircle2, Lock, Clock, ChevronRight, Sparkles,
  BookOpen, LifeBuoy, MessageSquare, FileText, ListChecks, Video,
  GraduationCap, ArrowRight, ShieldCheck, UserCircle2, ClipboardCheck,
  AlertCircle, Compass, Award, Plus, Pencil, Trash2, ExternalLink,
  Youtube, FileSpreadsheet, StickyNote, X,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  RBT_PATHS, RBT_OWNERSHIP, pathStats,
  type RBTPath, type RBTPathId, type RBTModule, type ModuleType, type SignoffItem,
} from "@/lib/training/rbtAcademy";
import {
  useRBTResources, getResourcesForModule, addResource, updateResource,
  removeResource, RBT_RESOURCE_TYPES,
  type RBTResource, type RBTResourceType,
} from "@/lib/training/rbtResources";
import { TRAINING_ADMIN_ROLES } from "@/lib/navigationAccess";

// RBT Training Academy — experience-based, guided journey. Calm, mobile-first.

type TabKey = "journey" | "resources" | "signoffs" | "support";

function firstName(n?: string | null) { return n ? n.trim().split(/\s+/)[0] : "there"; }
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function OSRBTTrainingAcademy() {
  const { user } = useAuth();
  const name = firstName((user?.user_metadata?.display_name as string) || user?.email?.split("@")[0]);

  const [assignedId, setAssignedId] = useState<RBTPathId>("certified_no_experience");
  const [tab, setTab] = useState<TabKey>("journey");

  const path = useMemo(
    () => RBT_PATHS.find((p) => p.id === assignedId) ?? RBT_PATHS[0],
    [assignedId],
  );
  const stats = useMemo(() => pathStats(path), [path]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-24 pt-5 md:px-6 md:pt-8">
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
          <ChevronRight className="size-3" />
          <span>Training Academy</span>
        </div>

        <header className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">RBT Training Academy</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            A guided, experience-based journey. Pick the path that matches you — every path starts
            with <span className="text-foreground font-medium">Welcome to Blossom for RBTs</span>.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your path</p>
            <TrackSelector value={assignedId} onChange={setAssignedId} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Assigned path" value={path.label} />
            <Stat label="Readiness" value={`${stats.readiness}%`} tone={stats.fieldReady ? "good" : stats.readiness >= 60 ? "warn" : "neutral"} />
            <Stat label="Modules" value={`${stats.completed}/${stats.total}`} />
            <Stat label="Signoffs" value={`${stats.signedCount}/${stats.signoffTotal}`} />
          </div>

          <div className="mt-4">
            <ProgressBar value={stats.readiness} />
            <p className="mt-2 text-xs text-muted-foreground">
              Required progress · {stats.requiredDone} of {stats.requiredTotal} required modules complete.
            </p>
          </div>

          <ReadinessBanner ready={stats.fieldReady} />
        </header>

        {stats.nextModule && <NextActionCard module={stats.nextModule} />}

        <Ownership />

        <Tabs value={tab} onChange={setTab} />

        {tab === "journey" && <JourneyTab path={path} />}
        {tab === "resources" && <ResourcesTab />}
        {tab === "signoffs" && <SignoffsTab signoffs={path.signoffs} />}
        {tab === "support" && <SupportTab />}
      </div>
    </OSShell>
  );
}

function TrackSelector({ value, onChange }: { value: RBTPathId; onChange: (v: RBTPathId) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {RBT_PATHS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={cn(
              "group flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition",
              active
                ? "border-primary/40 bg-primary/5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.12)]"
                : "border-border/70 bg-card hover:border-border hover:-translate-y-0.5",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-foreground">{p.label}</span>
              {active && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <CheckCircle2 className="size-3" /> Assigned
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{p.tagline}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Est. {p.estWeeks}</p>
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "neutral" }) {
  const toneCls =
    tone === "good" ? "text-emerald-600 dark:text-emerald-400" :
    tone === "warn" ? "text-amber-600 dark:text-amber-400" :
    "text-foreground";
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold tabular-nums", toneCls)}>{value}</p>
    </div>
  );
}

function ReadinessBanner({ ready }: { ready: boolean }) {
  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-3 rounded-xl border p-3.5",
        ready
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
      )}
    >
      {ready ? <ShieldCheck className="size-4 mt-0.5 shrink-0" /> : <AlertCircle className="size-4 mt-0.5 shrink-0" />}
      <p className="text-xs leading-relaxed">
        {ready ? (
          <>You are <span className="font-semibold">field-ready for independent assignment</span>. Your Lead RBT Trainer has signed off.</>
        ) : (
          <>RBTs are <span className="font-semibold">not eligible for independent client assignment</span> until all required modules are complete and a Lead RBT Trainer + BCBA signoff is recorded.</>
        )}
      </p>
    </div>
  );
}

function NextActionCard({ module: m }: { module: RBTModule }) {
  const resume = m.status === "in_progress";
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_12px_32px_-16px_oklch(0.2_0.02_260/0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <PlayCircle className="size-3.5" /> Next required action
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {resume && m.progress ? `${Math.max(1, Math.round(m.minutes * (1 - m.progress / 100)))} min left` : `${m.minutes} min`}
        </span>
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{m.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
      {resume && typeof m.progress === "number" && (
        <div className="mt-3"><ProgressBar value={m.progress} /></div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {resume ? "Resume" : "Start"} <ArrowRight className="size-4" />
        </button>
        <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-secondary px-3 text-xs font-medium text-secondary-foreground">
          <TypeIcon type={m.type} className="size-3.5" /> {m.type}
        </span>
      </div>
    </section>
  );
}

function Ownership() {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <OwnerCard icon={Compass} role={RBT_OWNERSHIP.leadTrainer.name} name={RBT_OWNERSHIP.leadTrainer.placeholder} note={RBT_OWNERSHIP.leadTrainer.role} />
        <OwnerCard icon={UserCircle2} role={RBT_OWNERSHIP.bcba.name} name={RBT_OWNERSHIP.bcba.placeholder} note={RBT_OWNERSHIP.bcba.role} />
      </div>
      <Link
        to="/training/rbt-readiness"
        className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/50 p-4 text-sm transition hover:bg-muted"
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Trainer & Scheduling · RBT Readiness Board
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    </section>
  );
}

function OwnerCard({ icon: Icon, role, name, note }: { icon: React.ComponentType<{ className?: string }>; role: string; name: string; note: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{role}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function Tabs({ value, onChange }: { value: TabKey; onChange: (v: TabKey) => void }) {
  const tabs: { v: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { v: "journey",   label: "Journey",   icon: GraduationCap },
    { v: "resources", label: "Resources", icon: BookOpen },
    { v: "signoffs",  label: "Signoffs",  icon: ClipboardCheck },
    { v: "support",   label: "Support",   icon: LifeBuoy },
  ];
  return (
    <div className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/80 p-1 backdrop-blur">
      <div className="flex gap-1">
        {tabs.map((t) => {
          const active = value === t.v;
          const Icon = t.icon;
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => onChange(t.v)}
              className={cn(
                "inline-flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JourneyTab({ path }: { path: RBTPath }) {
  return (
    <section className="space-y-5">
      {path.phases.map((phase, idx) => {
        const completed = phase.modules.filter((m) => m.status === "completed").length;
        const pct = phase.modules.length === 0 ? 0 : Math.round((completed / phase.modules.length) * 100);
        return (
          <div key={phase.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_4px_16px_-12px_oklch(0.2_0.02_260/0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Phase {idx}</p>
                <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{phase.title.replace(/^Phase \d+ · /, "")}</h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{phase.description}</p>
              </div>
              <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                {completed}/{phase.modules.length} · {pct}%
              </span>
            </div>

            <ol className="relative mt-4 space-y-2">
              <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-border/70" />
              {phase.modules.map((m, i) => (
                <ModuleRow key={m.id} module={m} index={i + 1} />
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

function ModuleRow({ module: m, index }: { module: RBTModule; index: number }) {
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
      <span className={cn("absolute left-2 top-3 grid size-6 place-items-center rounded-full border bg-card", dotCls)}>
        {m.status === "completed" ? <CheckCircle2 className="size-3.5" />
          : m.status === "locked" ? <Lock className="size-3" />
          : <span className="text-[10px] font-semibold tabular-nums">{index}</span>}
      </span>
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card/60 p-3 transition",
          isLocked ? "opacity-60" : "hover:border-border",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{m.title}</p>
              {m.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.summary}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {m.minutes} min</span>
              <span className="inline-flex items-center gap-1"><TypeIcon type={m.type} className="size-3" /> {m.type}</span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>
            {m.status === "in_progress" && typeof m.progress === "number" && (
              <div className="mt-2"><ProgressBar value={m.progress} /></div>
            )}
          </div>
          {!isLocked && (
            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground transition hover:bg-muted sm:inline-flex"
            >
              {m.status === "completed" ? "Review" : m.status === "in_progress" ? "Resume" : "Start"}
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function ResourcesTab() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {RBT_RESOURCES.map((r) => (
        <Link
          key={r.id}
          to="/rbt/resources"
          className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:border-border"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.type}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </Link>
      ))}
    </section>
  );
}

function SignoffsTab({ signoffs }: { signoffs: SignoffItem[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
        <Award className="size-4 mt-0.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Signoffs are recorded by your Lead RBT Trainer and BCBA. All required signoffs must be
          complete before you can be assigned to clients independently.
        </p>
      </div>
      <ul className="space-y-2">
        {signoffs.map((s) => (
          <li key={s.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <SignoffDot status={s.status} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                {s.required && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Required</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Owner · {s.owner}</p>
              {s.signedBy && s.signedOn && (
                <p className="mt-0.5 text-xs text-muted-foreground">Signed by {s.signedBy} · {s.signedOn}</p>
              )}
            </div>
            <SignoffBadge status={s.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SignoffDot({ status }: { status: SignoffItem["status"] }) {
  const cls =
    status === "signed" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
    status === "scheduled" ? "border-primary/40 bg-primary/10 text-primary" :
    "border-border/70 bg-muted text-muted-foreground";
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", cls)}>
      {status === "signed" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3" />}
    </span>
  );
}

function SignoffBadge({ status }: { status: SignoffItem["status"] }) {
  const map = {
    signed:    { label: "Signed",    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    scheduled: { label: "Scheduled", cls: "bg-primary/10 text-primary" },
    pending:   { label: "Pending",   cls: "bg-muted text-muted-foreground" },
  } as const;
  const m = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium", m.cls)}>{m.label}</span>;
}

function SupportTab() {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Stuck on something?</p>
        </div>
        <p className="mt-2 text-sm text-foreground">You are never on your own. Reach out — that's why we're here.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <SupportLink to="/ai/assistant" icon={Sparkles} label="Ask Blossom AI" />
          <SupportLink to="/rbt/help" icon={LifeBuoy} label="Get help" />
          <SupportLink to="/rbt/messages?focus=training" icon={MessageSquare} label="Contact training" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <p className="text-sm font-medium text-foreground">Common questions</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• How do I switch my assigned path? — Talk to your Lead RBT Trainer.</li>
          <li>• Who signs off field readiness? — Your Lead RBT Trainer, after BCBA observation.</li>
          <li>• When can I take clients independently? — After 100% required progress + all signoffs.</li>
        </ul>
      </div>
    </section>
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

function TypeIcon({ type, className }: { type: ModuleType; className?: string }) {
  const map: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
    SOP: FileText, Video: Video, Walkthrough: PlayCircle, Checklist: ListChecks,
    Overview: GraduationCap, Shadowing: Compass, Assessment: ClipboardCheck,
    "Role Play": Compass, Evaluation: ClipboardCheck, Signoff: ClipboardCheck,
  };
  const Icon = map[type] ?? BookOpen;
  return <Icon className={className} />;
}

function SupportLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
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