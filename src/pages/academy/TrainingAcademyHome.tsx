import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Clock, ArrowRight, BookOpen, CheckCircle2,
  PlayCircle, ClipboardList, Users, Settings2, FileText, BarChart3,
  Sparkles, Flame, Library, Target, Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PATHS, type TrainingPath } from "@/lib/academy/trainingPaths";
import {
  loadLearnerHome, emptyLearnerHome, type LearnerHome,
} from "@/lib/academy/learnerHome";

const TONE = {
  Foundations: "bg-primary/10 text-primary",
  Role: "bg-accent/40 text-foreground",
  Department: "bg-muted text-muted-foreground",
} as const;

/** Warm, color-coded accents for the LMS home. Used sparingly on icon
 *  tiles and status chips so the page feels alive without losing the
 *  Blossom OS calm-Apple feel. */
const ACCENTS = {
  mint:    { bg: "bg-emerald-50",  fg: "text-emerald-700", ring: "ring-emerald-200" },
  sky:     { bg: "bg-sky-50",      fg: "text-sky-700",     ring: "ring-sky-200" },
  citrus:  { bg: "bg-amber-50",    fg: "text-amber-700",   ring: "ring-amber-200" },
  coral:   { bg: "bg-rose-50",     fg: "text-rose-700",    ring: "ring-rose-200" },
  orchid:  { bg: "bg-violet-50",   fg: "text-violet-700",  ring: "ring-violet-200" },
  teal:    { bg: "bg-teal-50",     fg: "text-teal-700",    ring: "ring-teal-200" },
} as const;
type Accent = keyof typeof ACCENTS;
const ROTATE: Accent[] = ["orchid", "sky", "mint", "citrus", "coral", "teal"];

/**
 * Training Academy landing — universal home for every role.
 * Sections: My Training · Required · Role Paths · Department · Completed.
 * Super Admin sees a Training Management quick-access panel at the bottom.
 */
export default function TrainingAcademyHome() {
  const { isAdmin, user, roles } = useAuth();
  const isRbt = roles.includes("rbt" as never);
  const isBcba = roles.includes("bcba" as never);
  // Every operational role has an assigned wireframe training path.
  // Map the learner's role(s) to the TRAINING_PATHS slug so /academy always
  // surfaces "your journey" first — not just for RBT/BCBA.
  const ROLE_TO_SLUG: Record<string, string> = {
    rbt: "rbt",
    bcba: "bcba",
    case_manager: "case-manager",
    behavioral_support: "behavioral-support",
    clinical_director: "clinical-director",
    clinical_lead: "clinical-director",
    state_director: "state-director",
    assistant_state_director: "state-director",
    intake_coordinator: "intake",
    intake_lead: "intake",
    intake_team: "intake",
    marketing_team: "marketing",
    marketing_growth_lead: "marketing",
    business_development: "business-development",
    recruiting_team: "recruiting",
    recruiting_lead: "recruiting",
    recruiting_coordinator: "recruiting",
    authorization_coordinator: "authorizations",
    authorization_manager: "authorizations",
    authorizations_team: "authorizations",
    scheduling_team: "scheduling",
    scheduling_lead: "scheduling",
    scheduling_coordinator: "scheduling",
    staffing_team: "staffing",
    staffing_lead: "staffing",
    staffing_coordinator: "staffing",
    hr_team: "hr",
    hr_lead: "hr",
    hr: "hr",
    credentialing_team: "credentialing",
    credentialing_lead: "credentialing",
    qa_team: "qa",
    qa_director: "qa",
    qa_specialist: "qa",
  };
  const resolvedFromRoles = (roles as string[])
    .map((r) => ROLE_TO_SLUG[r])
    .find(Boolean);
  const [home, setHome] = useState<LearnerHome>(() => emptyLearnerHome());
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setHome(emptyLearnerHome()); return; }
    loadLearnerHome(user.id).then((h) => { if (!cancelled) setHome(h); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // Role-aware "My Training": surface the learner's own role path first.
  const primarySlug = isRbt ? "rbt" : isBcba ? "bcba" : (resolvedFromRoles ?? null);
  const orderedPaths = primarySlug
    ? [
        ...TRAINING_PATHS.filter((p) => p.slug === primarySlug),
        ...TRAINING_PATHS.filter((p) => p.slug !== primarySlug),
      ]
    : TRAINING_PATHS;
  const myTraining = orderedPaths.slice(0, 3).map((p, i) => ({
    ...p,
    progress: [62, 28, 10][i] ?? 0,
    lastOpened: ["Today", "Yesterday", "3 days ago"][i] ?? "—",
  }));
  const required = orderedPaths.filter((p) => p.category !== "Role" || p.slug === primarySlug).slice(0, 4);
  const rolePaths = TRAINING_PATHS.filter((p) => p.category === "Role");
  const departmentPaths = TRAINING_PATHS.filter((p) => p.category === "Department");

  const firstName =
    home.employee?.first_name ||
    (user?.email?.split("@")[0]) ||
    "there";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // For RBT/BCBA, the "journey" is their academy path — always available.
  const hasJourney = primarySlug ? true : (!!home.enrollment && home.weeks.length > 0);
  const next = home.nextAction;
  const launchPct = home.launchProgress.pct;
  const primaryPath = primarySlug ? TRAINING_PATHS.find((p) => p.slug === primarySlug) : null;
  const continueTo = primarySlug ? `/academy/path/${primarySlug}` : (hasJourney ? "/training" : "#paths");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      {/* ---------- Hero ---------- */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <GraduationCap className="h-3 w-3" /> Training Academy
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Your central place to learn the way Blossom runs — role-based journeys,
          SOPs, walkthroughs, and quick checks, all in one place.
        </p>

        {/* Today / Continue strip — colorful, live when enrolled */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <TodayCard
            accent="orchid"
            icon={Target}
            eyebrow={primarySlug ? "Your journey" : hasJourney ? "Today" : "Get started"}
            title={primaryPath
              ? primaryPath.title
              : hasJourney && next
                ? next.module.title
                : "No active journey yet"}
            body={primaryPath
              ? primaryPath.description
              : hasJourney && next
                ? `Week ${next.week.week_number} · ${next.week.title}`
                : "Pick a role path below to start your training."}
            to={continueTo}
            cta={primarySlug ? "Open my journey" : hasJourney ? "Continue today" : "Browse paths"}
          />
          <TodayCard
            accent="mint"
            icon={Trophy}
            eyebrow="Journey progress"
            title={hasJourney ? `${launchPct}% complete` : "—"}
            body={hasJourney
              ? `${home.launchProgress.requiredCompleted} of ${home.launchProgress.requiredTotal} required modules`
              : "Progress will appear once you're enrolled in a journey."}
            to="/training"
            cta={hasJourney ? "Open journey" : "Learn more"}
            meter={hasJourney ? launchPct : null}
          />
          <TodayCard
            accent="sky"
            icon={Library}
            eyebrow="Resources"
            title="Resource Library"
            body="Find SOPs, walkthroughs, and policy documents you need."
            to="/hr/resources"
            cta="Open library"
          />
        </div>
      </header>

      {/* ---------- My Training (Continue) ---------- */}
      <Section
        eyebrow="Continue learning"
        title="My Training"
        description="Pick up where you left off."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {myTraining.map((t, i) => (
            <Link
              key={t.slug}
              to={t.slug === "state-director" ? "/training" : `/academy/path/${t.slug}`}
              className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] transition-all hover:-translate-y-0.5 hover:border-border"
            >
              <div className="flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${ACCENTS[ROTATE[i % ROTATE.length]].bg} ${ACCENTS[ROTATE[i % ROTATE.length]].fg}`}>
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
        anchorId="paths"
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
  eyebrow, title, description, children, anchorId,
}: { eyebrow: string; title: string; description: string; children: React.ReactNode; anchorId?: string }) {
  return (
    <section id={anchorId} className="mt-12 first:mt-0 scroll-mt-24">
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

function TodayCard({
  accent, icon: Icon, eyebrow, title, body, to, cta, meter,
}: {
  accent: Accent;
  icon: typeof Target;
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  cta: string;
  meter?: number | null;
}) {
  const a = ACCENTS[accent];
  return (
    <Link
      to={to}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)] transition-all hover:-translate-y-0.5 hover:border-border`}
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${a.bg} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${a.bg} ${a.fg} ring-1 ${a.ring}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
      </div>
      <h3 className="relative mt-4 line-clamp-2 text-base font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-1 line-clamp-2 text-[13px] text-muted-foreground">{body}</p>
      {typeof meter === "number" && (
        <div className="relative mt-3">
          <Progress value={meter} className="h-1.5" />
        </div>
      )}
      <div className="relative mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
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