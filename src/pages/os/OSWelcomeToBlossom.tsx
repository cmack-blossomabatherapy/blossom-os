import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight, PlayCircle, Sparkles, Heart, Compass, Users, ArrowLeft,
  BookOpen, MessageSquare, Quote, Video, Target, ListChecks, CheckCircle2,
  Building2, Workflow, Flag,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useAdminResources } from "@/hooks/useAdminResources";
import { computeSdWelcomeVideoState } from "@/lib/training/sdRuntimeReadiness";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";
import {
  completeWelcomeModuleEverywhere,
  getNextStateDirectorTrainingPath,
  isWelcomeModuleComplete,
  WELCOME_TO_SD_TRAINING_ID,
} from "@/lib/training/welcomeProgressBridge";
import { completeLearnerModule, loadLearnerHome, type LearnerHome } from "@/lib/academy/learnerHome";
import {
  WELCOME_TO_BLOSSOM_HERO,
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_CORE_VALUES,
  WELCOME_BLOSSOM_FLOW,
  WELCOME_LEADERSHIP_LETTERS,
  WELCOME_COMPLETION,
} from "@/lib/training/welcomeToBlossomContent";
import introVideoAsset from "@/assets/intro-video-1.1.mp4.asset.json";
import { WelcomeReflectionForm } from "@/components/training/WelcomeReflectionForm";

/**
 * Welcome video configuration — resolved from Resource Library at runtime.
 *
 * The video is loaded from a Lovable CDN asset by default. If a
 * published Resource titled "Welcome Video from Blossom" (or close
 * variants) exists in the Resource Library it will take precedence.
 * If neither resolves, the page renders a calm "being prepared" panel
 * instead of a broken <video> element.
 */
const WELCOME_VIDEO_URL = introVideoAsset.url;
const WELCOME_VIDEO_POSTER_URL = "";

/**
 * Welcome to Blossom — Day 1, shared across every role.
 */
export default function OSWelcomeToBlossom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const status = useOnboardingStatus();
  const [displayName, setDisplayName] = useState<string>("");
  const [videoBroken, setVideoBroken] = useState(false);
  const { resources } = useAdminResources();
  const welcomeVideo = computeSdWelcomeVideoState(resources, WELCOME_VIDEO_URL);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (welcomeVideo.url) {
      setResolvedVideoUrl(welcomeVideo.url);
      return;
    }
    // Storage-path-only resource — resolve to signed URL.
    if (welcomeVideo.resource) {
      void resolveResourceOpenUrl(welcomeVideo.resource).then((url) => {
        if (!cancelled) setResolvedVideoUrl(url);
      });
    } else {
      setResolvedVideoUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [welcomeVideo.url, welcomeVideo.resource?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName((data?.display_name as string) ?? ""));
  }, [user?.id]);

  const firstName =
    (displayName || (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "there")
      .split(" ")[0];

  const videoDone = isWelcomeModuleComplete("welcome-video-from-blossom", status.modulesComplete);
  const hasVideo = Boolean(resolvedVideoUrl) && !videoBroken;

  // Welcome-to-Blossom overall progress across the 7 modules.
  const welcomeDoneCount = WELCOME_TO_BLOSSOM_MODULES.filter((m) =>
    isWelcomeModuleComplete(m.id, status.modulesComplete),
  ).length;
  const welcomeTotal = WELCOME_TO_BLOSSOM_MODULES.length;
  const welcomePercent =
    welcomeTotal === 0 ? 0 : Math.round((welcomeDoneCount / welcomeTotal) * 100);
  const allWelcomeDone = welcomeDoneCount === welcomeTotal;

  const syncWelcomeToAcademy = async (welcomeModuleId: string) => {
    if (!user?.id) return;
    try {
      const home = await loadLearnerHome(user.id);
      const academyModule = findAcademyWelcomeModule(home, welcomeModuleId);
      if (home.enrollment && academyModule) {
        await completeLearnerModule(home.enrollment.id, academyModule.id);
      }
    } catch { /* local completion is still valid if live sync is unavailable */ }
  };

  const markReviewed = () => {
    completeWelcomeModuleEverywhere("welcome-video-from-blossom");
    void syncWelcomeToAcademy("welcome-video-from-blossom");
  };

  const continueToStateDirectorJourney = () => {
    markReviewed();
    navigate(getNextStateDirectorTrainingPath());
  };

  const pillars = [
    { icon: Heart, title: "Who we are", body: "Blossom ABA Therapy supports children and families across multiple states with calm, compassionate, structured care." },
    { icon: Compass, title: "How we work", body: "Operations, clinical, scheduling, and HR all move together. Clear systems make great care possible." },
    { icon: Users, title: "Your team", body: "You're joining people who care deeply about the work and about each other. You're never doing this alone." },
  ];

  const leaders = WELCOME_LEADERSHIP_LETTERS.map((l) => ({
    ...l,
    initial: l.initials.slice(0, 1),
  }));

  const values = WELCOME_CORE_VALUES;
  void WELCOME_TO_BLOSSOM_HERO;
  void WELCOME_TO_BLOSSOM_MODULES;
  void WELCOME_COMPLETION;

  const leadershipRoles = [
    { role: "Chief Executive Officer", body: "Sets company direction, growth strategy, and organizational standards." },
    { role: "Director of Operations", body: "Leads operational consistency, department accountability, escalation standards, and state execution." },
    { role: "Operations Leadership", body: "Supports department performance, cross-state consistency, and state-level issue resolution." },
    { role: "State Directors", body: "Own state-level operations, health, follow-through, and cross-department coordination." },
    { role: "Clinical Leadership", body: "Protects clinical quality, supervision, treatment planning, and BCBA/RBT support." },
    { role: "HR / Recruiting / Training", body: "Supports hiring, onboarding, employee readiness, training, and people operations." },
    { role: "Billing / Finance / Authorizations", body: "Protects revenue continuity, payer requirements, authorization health, billing accuracy, and reimbursement." },
  ];

  const flowSteps = WELCOME_BLOSSOM_FLOW;

  const watchPoints = [
    "Leads aging without next steps.",
    "VOB or intake delays.",
    "Assessment scheduling gaps.",
    "Authorizations close to expiration.",
    "Missing progress reports.",
    "Scheduling gaps.",
    "Staffing capacity issues.",
    "Utilization below target.",
    "Families or staff waiting too long for answers.",
  ];

  const relationshipMap = [
    "Intake and leads — to understand how families enter the system.",
    "Authorizations — to protect treatment continuity and revenue.",
    "Scheduling — to protect service delivery and utilization.",
    "Staffing and recruiting — to ensure the state can actually serve the families it accepts.",
    "Clinical leadership — to ensure quality and supervision stay strong.",
    "QA and compliance — to prevent documentation and authorization gaps.",
    "HR and training — to support new hires and role readiness.",
    "Executive and operations leadership — to remove structural blockers.",
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-5xl space-y-10 pb-16">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
            <Link to="/academy"><ArrowLeft className="h-3.5 w-3.5" /> Training Academy</Link>
          </Button>
        </div>

        {/* HERO */}
        <header>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Day 1 — Welcome to Blossom</span>
          </div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground md:text-[34px]">
            Welcome to Blossom, <span className="capitalize">{firstName}</span>.
            <span className="ml-2 text-muted-foreground">Start here.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Before you learn the systems, dashboards, SOPs, and weekly rhythms, start here. This is the
            part of training that explains who we are, why the work matters, and how we show up for
            families and for each other. You do not need to know everything today. You only need to get
            grounded, meet the company, and take the next step.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <p className="text-[12.5px] text-muted-foreground">
              Read each section below and confirm you've read it. When all sections are confirmed, the <span className="font-medium text-foreground">Start Training</span> button at the bottom will unlock.
            </p>
          </div>

          {/* Overall Welcome progress — updates the moment a module is marked complete */}
          <div
            data-testid="welcome-overall-progress"
            className="mt-5 max-w-2xl rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Welcome progress
                </p>
                <p className="mt-0.5 text-[13.5px] font-semibold text-foreground">
                  {welcomeDoneCount} of {welcomeTotal} modules complete
                  {allWelcomeDone && (
                    <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> All done
                    </span>
                  )}
                </p>
              </div>
              <span className="tabular-nums text-[15px] font-semibold text-foreground">
                {welcomePercent}%
              </span>
            </div>
            <Progress value={welcomePercent} className="mt-3 h-2" />
          </div>
        </header>

        {/* MODULE SEQUENCE — visible 7-step rail */}
        <section
          aria-label="Welcome to Blossom modules"
          data-testid="welcome-module-sequence"
          className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Universal onboarding - Phase 0
              </p>
              <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-foreground">
                Your 7 Welcome to Blossom modules
              </h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Every employee starts here. Each step is tracked separately - you can revisit any of them anytime.
              </p>
            </div>
            <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {welcomeDoneCount}/{welcomeTotal} complete · {welcomePercent}%
            </span>
          </div>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {WELCOME_TO_BLOSSOM_MODULES.map((m, idx) => {
              const done = isWelcomeModuleComplete(m.id, status.modulesComplete);
              const cta = done ? "Review" : "Start";
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => scrollToWelcomeSection(m.id)}
                    data-testid={`welcome-module-start-${m.id}`}
                    data-module-id={m.id}
                    data-module-type={m.moduleType}
                    className="group flex w-full items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                        done ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">{m.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] capitalize">
                          {m.moduleType}
                        </Badge>
                        <span>~{m.estimatedMinutes} min</span>
                        {done && <span className="text-emerald-700">· Complete</span>}
                      </p>
                    </div>
                    <span className="ml-1 inline-flex shrink-0 items-center gap-1 self-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {cta} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {/* WELCOME VIDEO */}
        <section id="welcome-video-from-blossom" className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm scroll-mt-24">
          {hasVideo ? (
            <video
              src={resolvedVideoUrl ?? undefined}
              poster={WELCOME_VIDEO_POSTER_URL || undefined}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoBroken(true)}
              onPlay={markReviewed}
              className="aspect-video w-full bg-black object-cover"
            />
          ) : (
            <div className="relative aspect-video w-full overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--accent)/0.14)_55%,hsl(var(--primary)/0.08))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.28),transparent_55%),radial-gradient(circle_at_75%_80%,hsl(var(--accent)/0.20),transparent_50%)]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground">Welcome Video from Blossom</p>
                <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  The welcome video is being prepared. You can continue with the written Welcome
                  to Blossom guidance below right now — nothing on Day 1 is blocked by the video.
                </p>
                <Badge variant="outline" className="mt-1 gap-1 text-[10px] backdrop-blur">
                  <Sparkles className="h-3 w-3 text-primary" /> Pending upload
                </Badge>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Welcome Video from Blossom</p>
                <p className="text-[12px] text-muted-foreground">
                  {hasVideo ? "~3 min · Watch all the way through" : "Read the leadership notes below while the video is prepared"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={videoDone ? "outline" : "default"}
                className="rounded-full"
                onClick={markReviewed}
                data-testid="welcome-module-complete-welcome-video-from-blossom"
              >
                {videoDone ? (
                  <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmed read</>
                ) : (
                  "I've read / watched this"
                )}
              </Button>
            </div>
          </div>
          {/* Learner study guide for the welcome video */}
          <div className="grid gap-4 border-t border-border/60 bg-card px-5 py-5 sm:grid-cols-2">
            <GuideBlock icon={Target} label="Learning objective"
              body="Understand the tone, purpose, and leadership expectations behind Blossom ABA Therapy." />
            <GuideBlock icon={Heart} label="Why this matters"
              body="The State Director role is not just a management role. You are responsible for how a state feels, functions, communicates, and recovers when things get hard. This welcome sets the tone for the kind of leader Blossom expects you to become." />
            <GuideBlock icon={ListChecks} label="What to do" items={[
              "Watch the video when available.",
              "If the video is pending, read the leadership letters below.",
              "Write down one sentence that captures what Blossom is here to do.",
              "Bring that sentence to your first mentor check-in.",
            ]} />
            <GuideBlock icon={CheckCircle2} label="Completion evidence"
              body="Mark the welcome reviewed and capture one takeaway for your mentor." />
            <GuideBlock icon={MessageSquare} label="Reflection"
              body="What kind of leader will families and staff need you to be in your first 30 days?" />
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="grid gap-3 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        {/* MISSION & VISION */}
        <section id="welcome-mission-vision" className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8 scroll-mt-24">
          <SectionHeader icon={Flag} eyebrow="Mission & Vision" title="What we're here to do"
            description="Blossom exists to help children and families access high-quality ABA therapy with a system behind it that is organized, responsive, and human." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mission</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-foreground">
                Blossom ABA Therapy provides compassionate, high-quality ABA services to children and
                families while building the operational structure needed for care to be consistent,
                timely, and sustainable.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vision</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-foreground">
                Our vision is to build a multi-state ABA organization where families feel supported,
                clinicians feel equipped, and operations are clear enough that great care can happen
                without chaos.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">In plain language</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground">
              We help families get care that works, and we build the systems that make that care reliable.
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <GuideBlock icon={Heart} label="Why this matters for a State Director"
              body="Your job is to protect the bridge between care and operations. Families experience Blossom through scheduling, communication, authorization continuity, staffing, clinical quality, and follow-through. If the state is disorganized, the family feels it. If the state is calm and accountable, the family feels that too." />
            <GuideBlock icon={ListChecks} label="What to do" items={[
              "Read the mission and vision.",
              "Rewrite them in your own words.",
              "Connect them to one operational metric you will watch as a State Director.",
            ]} />
            <GuideBlock icon={CheckCircle2} label="Completion evidence"
              body="Bring your one-sentence version to your mentor check-in." />
            <GuideBlock icon={MessageSquare} label="Reflection"
              body="Which part of the mission will be hardest to protect when the state is busy?" />
          </div>
          <ModuleCompleteAction moduleId="welcome-mission-vision" status={status} syncWelcomeToAcademy={syncWelcomeToAcademy} />
        </section>

        {/* CORE VALUES */}
        <section id="welcome-core-values" className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8 scroll-mt-24">
          <SectionHeader icon={Sparkles} eyebrow="Core Values" title="Standards we use when the day gets complicated"
            description="Values are not slogans. They are the standards we use when the day gets complicated." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                <p className="text-[13.5px] font-semibold text-foreground">{v.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <GuideBlock icon={Heart} label="Why this matters for a State Director"
              body="Your team will learn the values by watching your decisions. If you tolerate unclear ownership, the state will become unclear. If you model calm follow-up, the state will become calmer. Values become real through the way you run meetings, escalations, and daily priorities." />
            <GuideBlock icon={ListChecks} label="What to do" items={[
              "Read each value.",
              "Pick one value that feels natural to you.",
              "Pick one value that will require discipline.",
              "Write one action you can take this week to model that value.",
            ]} />
            <GuideBlock icon={CheckCircle2} label="Completion evidence"
              body="Share one chosen value and one action with your mentor." />
            <GuideBlock icon={MessageSquare} label="Reflection"
              body="Which value will your team most need from you during your first month?" />
          </div>
          <ModuleCompleteAction moduleId="welcome-core-values" status={status} syncWelcomeToAcademy={syncWelcomeToAcademy} />
        </section>

        {/* MEET THE TEAM */}
        <section id="welcome-meet-the-team" className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8 scroll-mt-24">
          <SectionHeader icon={Building2} eyebrow="Meet the Team" title="Who owns what at Blossom"
            description="You are not expected to solve everything alone. Blossom works because departments own their lanes and communicate across them." />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {leadershipRoles.map((r) => (
              <div key={r.role} className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                <p className="text-[13.5px] font-semibold text-foreground">{r.role}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-5">
            <p className="text-[13.5px] font-semibold text-foreground">State Director relationship map</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">As a State Director, you will work most closely with:</p>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {relationshipMap.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <GuideBlock icon={Heart} label="Why this matters"
              body="Knowing who owns what prevents delay. If the wrong person is holding the problem, the problem grows. A strong State Director routes issues quickly and respectfully." />
            <GuideBlock icon={ListChecks} label="What to do" items={[
              "Review the leadership and department map.",
              "Identify your primary mentor.",
              "Identify the department leaders you will need during week one.",
              "Schedule or confirm your first check-in.",
            ]} />
            <GuideBlock icon={CheckCircle2} label="Completion evidence"
              body="Write down your mentor, your first three department partners, and one question for each." />
          </div>
          <ModuleCompleteAction moduleId="welcome-meet-the-team" status={status} syncWelcomeToAcademy={syncWelcomeToAcademy} />
        </section>

        {/* HOW BLOSSOM WORKS */}
        <section id="welcome-how-blossom-works" className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8 scroll-mt-24">
          <SectionHeader icon={Workflow} eyebrow="How Blossom Works" title="The Blossom flow, at a glance"
            description="Blossom is an ABA care organization supported by an operational system. The work moves from family interest to verified benefits, assessment, authorization, scheduling, active treatment, utilization, progress reporting, and renewal." />
          <ol className="mt-5 space-y-2.5">
            {flowSteps.map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {step}
                </span>
                <span className="text-[13.5px] leading-relaxed text-foreground">{text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">State Director lens</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground">
              You are not the owner of every task. You are the owner of the flow. Your job is to know
              where the flow is healthy, where it is stuck, who owns the next action, and what needs
              escalation.
            </p>
          </div>
          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 p-5">
            <p className="text-[13.5px] font-semibold text-foreground">What to watch</p>
            <ul className="mt-3 grid gap-1.5 text-[13px] leading-relaxed text-muted-foreground sm:grid-cols-2">
              {watchPoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <GuideBlock icon={ListChecks} label="What to do" items={[
              "Read the flow once.",
              "Draw it from memory.",
              "Mark the three places where you think a state is most likely to get stuck.",
              "Bring those three risk points to your mentor.",
            ]} />
            <GuideBlock icon={CheckCircle2} label="Completion evidence"
              body="Share your drawn flow and three risk points with your mentor." />
          </div>
          <ModuleCompleteAction moduleId="welcome-how-blossom-works" status={status} syncWelcomeToAcademy={syncWelcomeToAcademy} />
        </section>

        {/* LEADERSHIP LETTERS */}
        <section className="space-y-4" data-testid="leadership-letters-section">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">A welcome from leadership</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Start here before the systems and SOPs. These notes set the tone for how Blossom leads, communicates, and follows through.
            </p>
          </div>

          {/* Intro strip */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
            <p className="text-[13px] leading-relaxed text-foreground">
              Before you begin the State Director launch path, take a moment to hear directly from leadership. The systems matter, but the standard behind the systems matters more: families deserve clarity, teams deserve support, and leaders are expected to follow through.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {leaders.map((l) => (
              <article
                key={l.name}
                id={l.id}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm scroll-mt-24"
              >
                {/* Card header */}
                <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-[15px] font-semibold text-primary">
                      {l.initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{l.displayTitle}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-[12px] text-muted-foreground">{l.name} · {l.role}</p>
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Leadership note
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  <div className="space-y-3 text-[13.5px] leading-relaxed text-muted-foreground">
                    {l.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                  </div>

                  {/* Pull quote */}
                  <div className="mt-5 rounded-xl border-l-2 border-primary/40 bg-primary/5 p-4">
                    <Quote className="mb-2 h-4 w-4 text-primary/40" aria-hidden />
                    <p className="text-[13.5px] font-medium italic leading-relaxed text-foreground">
                      {l.pullQuote}
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="mt-5 border-t border-border/60 pt-4">
                    <p className="text-[12.5px] font-medium text-foreground">— {l.signoff}</p>
                  </div>
                  <ModuleCompleteAction moduleId={l.id} status={status} syncWelcomeToAcademy={syncWelcomeToAcademy} />
                </div>
              </article>
            ))}
          </div>

          {/* Reflection panel */}
          <div
            data-testid="leadership-reflection-panel"
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Day-One evidence</p>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Part of training
                  </span>
                </div>
                <h3 className="mt-1 text-[16px] font-semibold tracking-tight text-foreground">Leadership-letter takeaway</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  Write one sentence from these letters — something from Chad or Shira you want to carry into your first 30 days as a State Director. This is not a side note — it is the first piece of evidence your mentor will ask you about.
                </p>
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-[13px] leading-relaxed text-foreground">
                    <span className="font-medium text-foreground">Completion evidence:</span>{' '}
                    Bring that sentence to your first mentor check-in, and mark the
                    <em> Leadership-letter takeaway</em> signal on your Day-One readiness panel.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={videoDone ? "outline" : "default"}
                    className="rounded-full"
                    onClick={markReviewed}
                    data-testid="welcome-reflection-continue"
                  >
                    {videoDone ? (
                      <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmed read</>
                    ) : (
                      "I've read this section"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REFLECTION — written, saved to the learner's training record */}
        <section
          data-testid="welcome-reflection-prompt"
          className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
        >
          <SectionHeader
            icon={MessageSquare}
            eyebrow="Reflection"
            title="Before you move on, take five minutes."
            description="Reflection is part of the work — not extra. Write a few honest sentences for each question. Your answers save automatically and become part of your training record."
          />
          <div className="mt-5">
            <WelcomeReflectionForm
              context="welcome-to-blossom"
              questions={[
                { key: "blossom-in-one-sentence", question: "What does Blossom feel like to you so far, in one sentence?" },
                { key: "easiest-vs-hardest-value", question: "Which of our core values will be easiest for you to model? Which one will take work?" },
                { key: "leader-in-first-30-days", question: "What kind of leader will families and staff need you to be in your first 30 days?" },
                { key: "question-for-mentor", question: "What is one question you want to bring to your mentor this week?" },
              ]}
            />
          </div>
        </section>

        {/* CONTINUE TO JOURNEY */}
        <section className="flex flex-col items-center gap-3 pt-2">
          <Button
            size="lg"
            className="rounded-2xl shadow-md shadow-primary/20"
            onClick={continueToStateDirectorJourney}
            disabled={!allWelcomeDone}
            data-testid="welcome-continue-launch-path"
          >
            {allWelcomeDone ? (
              <>Continue to Journey <ArrowRight className="ml-1 h-4 w-4" /></>
            ) : (
              <>Confirm all sections to continue ({welcomeDoneCount}/{welcomeTotal})</>
            )}
          </Button>
        </section>

        <p className="text-center text-[12px] text-muted-foreground">
          <MessageSquare className="mr-1 inline h-3 w-3" />
          Questions on Day 1? Message your HR partner or mentor — they're expecting you.
        </p>
      </div>
    </OSShell>
  );
}

/* -------- helpers -------- */

function SectionHeader({
  icon: Icon, eyebrow, title, description,
}: { icon: React.ComponentType<{ className?: string }>; eyebrow: string; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-0.5 text-[20px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function findAcademyWelcomeModule(home: LearnerHome, welcomeModuleId: string) {
  const modules = home.weeks.flatMap((week) => week.modules);
  const expectedTrainingId = WELCOME_TO_SD_TRAINING_ID[welcomeModuleId];
  const normalizedTitle = (WELCOME_TO_BLOSSOM_MODULES.find((m) => m.id === welcomeModuleId)?.title ?? "")
    .toLowerCase();

  return modules.find((module) => {
    const title = (module.title ?? "").toLowerCase();
    if (module.id === expectedTrainingId || title === normalizedTitle) return true;
    if (welcomeModuleId === "welcome-video-from-blossom") return title.includes("welcome to blossom") || title.startsWith("welcome video");
    if (welcomeModuleId === "welcome-mission-vision") return title.includes("mission") && title.includes("vision");
    if (welcomeModuleId === "welcome-core-values") return title.includes("core values");
    if (welcomeModuleId === "welcome-meet-the-team") return title.includes("meet the team");
    if (welcomeModuleId === "welcome-how-blossom-works") return title.includes("how blossom works");
    if (welcomeModuleId === "welcome-letter-chad") return title.includes("chad");
    if (welcomeModuleId === "welcome-letter-shira") return title.includes("shira");
    return false;
  }) ?? null;
}

function GuideBlock({
  icon: Icon, label, body, items,
}: { icon: React.ComponentType<{ className?: string }>; label: string; body?: string; items?: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      {body && <p className="mt-2 text-[13px] leading-relaxed text-foreground">{body}</p>}
      {items && (
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground">
          {items.map((it) => (
            <li key={it} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Smooth-scroll to a module section on the same page and focus it. */
function scrollToWelcomeSection(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Make the section programmatically focusable so screen readers land there too.
  const prev = el.getAttribute("tabindex");
  if (prev === null) el.setAttribute("tabindex", "-1");
  (el as HTMLElement).focus({ preventScroll: true });
}

/**
 * Per-module "Mark complete" control. Writes through the same onboarding
 * storage as the welcome video so progress, the rail status pills, and the
 * Day-One readiness panel all stay in sync.
 */
function ModuleCompleteAction({
  moduleId,
  status,
  syncWelcomeToAcademy,
}: {
  moduleId: string;
  status: { modulesComplete: string[] };
  syncWelcomeToAcademy: (welcomeModuleId: string) => void | Promise<void>;
}) {
  const done = isWelcomeModuleComplete(moduleId, status.modulesComplete);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
      <p className="text-[12.5px] text-muted-foreground">
        {done
          ? "You've confirmed you read this section."
          : "Please confirm you've read this section before continuing."}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={done ? "outline" : "default"}
          className="rounded-full"
          onClick={() => {
            if (!done) {
              completeWelcomeModuleEverywhere(moduleId);
              void syncWelcomeToAcademy(moduleId);
            }
          }}
          data-testid={`welcome-module-complete-${moduleId}`}
          aria-pressed={done}
        >
          {done ? (
            <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmed read</>
          ) : (
            "I've read this section"
          )}
        </Button>
      </div>
    </div>
  );
}
