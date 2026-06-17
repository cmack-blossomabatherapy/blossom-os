import { Link } from "react-router-dom";
import {
  GraduationCap, Clock, ArrowRight, BookOpen, CheckCircle2, Compass,
  PlayCircle, ClipboardList, Users, Settings2, FileText, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PATHS, type TrainingPath } from "@/lib/academy/trainingPaths";

const TONE = {
  Foundations: "bg-primary/10 text-primary",
  Role: "bg-accent/40 text-foreground",
  Department: "bg-muted text-muted-foreground",
} as const;

/**
 * Training Academy landing — universal home for every role.
 * Sections: My Training · Required · Role Paths · Department · Completed.
 * Super Admin sees a Training Management quick-access panel at the bottom.
 */
export default function TrainingAcademyHome() {
  const { isAdmin } = useAuth();

  const myTraining = TRAINING_PATHS.slice(0, 3).map((p, i) => ({
    ...p,
    progress: [62, 28, 10][i] ?? 0,
    lastOpened: ["Today", "Yesterday", "3 days ago"][i] ?? "—",
  }));
  const required = TRAINING_PATHS.filter((p) => p.category !== "Role").slice(0, 4);
  const rolePaths = TRAINING_PATHS.filter((p) => p.category === "Role");
  const departmentPaths = TRAINING_PATHS.filter((p) => p.category === "Department");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      {/* ---------- Hero ---------- */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <GraduationCap className="h-3 w-3" /> Training Academy
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Training Academy
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Role-based training paths for onboarding, department readiness, continued
          education, and Blossom OS adoption.
        </p>
      </header>

      {/* ---------- My Training (Continue) ---------- */}
      <Section
        eyebrow="Continue learning"
        title="My Training"
        description="Pick up where you left off."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {myTraining.map((t) => (
            <Link
              key={t.slug}
              to={`/academy/path/${t.slug}`}
              className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] transition-all hover:-translate-y-0.5 hover:border-border"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px]">{t.audience}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{t.title}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">{t.description}</p>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{t.progress}%</span>
                </div>
                <Progress value={t.progress} className="h-1.5" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{t.estimatedHours}h</span>
                <span>Last opened {t.lastOpened}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                <PlayCircle className="h-4 w-4" /> Continue
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------- Required ---------- */}
      <Section
        eyebrow="Required"
        title="Required Training"
        description="Training expected of you based on your role and onboarding stage."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {required.map((t) => (
            <PathRow key={t.slug} path={t} required />
          ))}
        </div>
      </Section>

      {/* ---------- Role Training Paths ---------- */}
      <Section
        eyebrow="By role"
        title="Role Training Paths"
        description="Structured learning for every Blossom role."
      >
        <PathGrid paths={rolePaths} />
      </Section>

      {/* ---------- Department Training ---------- */}
      <Section
        eyebrow="By department"
        title="Department Training"
        description="Operational training built around how each department runs."
      >
        <PathGrid paths={departmentPaths} />
      </Section>

      {/* ---------- Completed ---------- */}
      <Section
        eyebrow="Completed"
        title="Completed Training"
        description="A record of what you've finished."
      >
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No completed training yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Completed paths will appear here once you finish them.
          </p>
        </div>
      </Section>

      {/* ---------- Super Admin: Training Management ---------- */}
      {isAdmin && (
        <Section
          eyebrow="Super Admin"
          title="Training Management"
          description="Assign, edit, and report on training across the organization."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard to="/hr/training-management" icon={Users} title="All Users Training Status" body="See who is in progress, overdue, or complete." />
            <AdminCard to="/hr/training-assign" icon={ClipboardList} title="Assign Training" body="Assign paths to roles, departments, or individuals." />
            <AdminCard to="/training/academy/editor" icon={Settings2} title="Create / Edit Training Path" body="Build new paths or edit existing structure and content." />
            <AdminCard to="/training/academy/leadership" icon={BarChart3} title="Training Completion Report" body="Leadership reporting on training engagement." />
          </div>
        </Section>
      )}
    </div>
  );
}

/* ============================== components ============================== */

function Section({
  eyebrow, title, description, children,
}: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          <p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PathGrid({ paths }: { paths: TrainingPath[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {paths.map((p) => (
        <PathCard key={p.slug} path={p} />
      ))}
    </div>
  );
}

function PathCard({ path }: { path: TrainingPath }) {
  // The State Director card is special: it routes to the live 5-week / 25-day
  // journey at /training (SDLearnerHome), not the generic academy stub.
  const isStateDirector = path.slug === "state-director";
  const to = isStateDirector ? "/training" : `/academy/path/${path.slug}`;
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-foreground">
          <path.icon className="h-5 w-5" />
        </div>
        {isStateDirector ? (
          <Badge className="bg-primary text-primary-foreground hover:bg-primary text-[10px]">Live Journey</Badge>
        ) : (
          <Badge variant="outline" className={`text-[10px] ${TONE[path.category]}`}>{path.category}</Badge>
        )}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{path.title}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
        {isStateDirector
          ? "5-week / 25-day live State Director journey — Welcome to Blossom, leadership letters, daily modules, SOPs, shadowing, and certification."
          : path.description}
      </p>
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{path.lessonCount} lessons</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{path.estimatedHours}h</span>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
        {isStateDirector ? "Open State Director Journey" : "Open path"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function PathRow({ path, required }: { path: TrainingPath; required?: boolean }) {
  const to = path.slug === "state-director" ? "/training" : `/academy/path/${path.slug}`;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4 transition hover:border-border"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
        <path.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{path.title}</p>
        <p className="truncate text-[12px] text-muted-foreground">{path.description}</p>
      </div>
      {required && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Required</Badge>}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function AdminCard({
  to, icon: Icon, title, body,
}: { to: string; icon: typeof FileText; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{body}</p>
      <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}