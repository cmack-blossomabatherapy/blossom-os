import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, Clock, ArrowRight, CheckCircle2,
  PlayCircle, ClipboardList, Users, Settings2, FileText, BarChart3,
  Library, Target, Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { TRAINING_PATHS } from "@/lib/academy/trainingPaths";
import {
  loadLearnerHome, emptyLearnerHome, type LearnerHome,
} from "@/lib/academy/learnerHome";
import { WelcomeToBlossomCard } from "@/components/onboarding/WelcomeToBlossomCard";
import { resolveRoleJourney } from "@/lib/training/roleJourneyAssignments";
import { useRoleJourneyAssignments } from "@/hooks/useRoleJourneyAssignments";
import { BlossomAIButton } from "@/components/ai/BlossomAIAssistant";

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
 * Learners see Welcome to Blossom plus their assigned role journey only.
 * Super Admin sees a Training Management quick-access panel at the bottom.
 */
export default function TrainingAcademyHome() {
  const { isAdmin, user, roles } = useAuth();
  // Role → wireframe path mapping (default + HR overrides from
  // training_role_journey_assignments). Every signed-in user falls back
  // to "blossom-os-basics" so the home page never shows "No active journey".
  const { overrides } = useRoleJourneyAssignments();
  const resolvedFromRoles = user ? resolveRoleJourney(roles as string[], overrides) : null;
  const [home, setHome] = useState<LearnerHome>(() => emptyLearnerHome());
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setHome(emptyLearnerHome()); return; }
    loadLearnerHome(user.id).then((h) => { if (!cancelled) setHome(h); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  // Role-aware "My Training": surface the learner's resolved role path,
  // honoring HR overrides for every role (including rbt/bcba).
  const primarySlug = resolvedFromRoles ?? "blossom-os-basics";
  const myPath = TRAINING_PATHS.find((p) => p.slug === primarySlug) ?? null;
  const myTraining = myPath
    ? [{ ...myPath, progress: 0, lastOpened: "—" }]
    : [];
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
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="h-3 w-3" /> Training Academy
          </div>
          <BlossomAIButton
            surface="training"
            title="Training coach"
            hint="Your role-based coach for modules, SOPs, and quiz prep."
            contextText={primaryPath
              ? `Learner is on training path: ${primaryPath.title}. Description: ${primaryPath.description}`
              : "Learner is browsing the Training Academy home."}
            guardrails={[
              "Do not complete training or quizzes for the user",
              "Do not reveal quiz answers before the user submits",
              "Explain SOPs and modules in simpler language",
              "Suggest resources to review after modules",
            ]}
            label="Ask coach"
          />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Your central place to learn the way Blossom runs — role-based journeys,
          SOPs, walkthroughs, and quick checks, all in one place.
        </p>

        {/* Today / Continue strip — role-scoped for learners */}
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

      {/* ---------- Welcome to Blossom (universal Phase 0) ---------- */}
      <div className="mt-8">
        <WelcomeToBlossomCard />
      </div>

      {/* ---------- My Training (Continue) — role-scoped, single path ---------- */}
      <Section
        eyebrow="Continue learning"
        title="My Training Journey"
        description="Your assigned role journey — everything you need, nothing you don't."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myTraining.map((t, i) => (
            <Link
              key={t.slug}
              to={`/academy/path/${t.slug}`}
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