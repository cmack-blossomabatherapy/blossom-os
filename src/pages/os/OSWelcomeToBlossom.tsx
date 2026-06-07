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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { markModuleComplete } from "@/lib/onboarding/storage";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import {
  WELCOME_TO_BLOSSOM_HERO,
  WELCOME_TO_BLOSSOM_MODULES,
  WELCOME_CORE_VALUES,
  WELCOME_BLOSSOM_FLOW,
  WELCOME_LEADERSHIP_LETTERS,
  WELCOME_COMPLETION,
} from "@/lib/training/welcomeToBlossomContent";

/**
 * Welcome video configuration.
 *
 * Replace these constants when the real Blossom welcome video (Chad / Shira)
 * is uploaded. While empty, the page renders a calm "being prepared" panel
 * instead of a broken video element.
 *
 * - WELCOME_VIDEO_URL: path or full URL to the welcome MP4
 * - WELCOME_VIDEO_POSTER_URL: poster image shown before play
 */
const WELCOME_VIDEO_URL = "";
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

  const videoDone = status.modulesComplete.includes("p0.intro-video");
  const hasVideo = Boolean(WELCOME_VIDEO_URL) && !videoBroken;

  const markReviewed = () => {
    if (!videoDone) markModuleComplete("p0.intro-video");
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
            <Link to="/training"><ArrowLeft className="h-3.5 w-3.5" /> Training Academy</Link>
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
            <Button size="sm" className="rounded-full" onClick={markReviewed}>
              Start Welcome to Blossom <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/training")}>
              Continue to State Director Journey
            </Button>
          </div>
        </header>

        {/* WELCOME VIDEO */}
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          {hasVideo ? (
            <video
              src={WELCOME_VIDEO_URL}
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
                  The welcome video is being prepared. You can continue with the written Welcome to
                  Blossom guidance now and revisit the video later.
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
              >
                {videoDone ? "Marked reviewed" : "Mark welcome reviewed"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => navigate("/training")}
              >
                Continue to State Director Journey <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
            <GuideBlock icon={MessageSquare} label="Reflection prompt"
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
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
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
            <GuideBlock icon={MessageSquare} label="Reflection prompt"
              body="Which part of the mission will be hardest to protect when the state is busy?" />
          </div>
        </section>

        {/* CORE VALUES */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
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
            <GuideBlock icon={MessageSquare} label="Reflection prompt"
              body="Which value will your team most need from you during your first month?" />
          </div>
        </section>

        {/* MEET THE TEAM */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
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
        </section>

        {/* HOW BLOSSOM WORKS */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
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
        </section>

        {/* LEADERSHIP LETTERS */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">A note from leadership</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Two short letters worth reading once.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {leaders.map((l) => (
              <article key={l.name} className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
                <Quote className="absolute right-5 top-5 h-5 w-5 text-primary/30" aria-hidden />
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-[14px] font-semibold text-primary">
                    {l.initial}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{l.displayTitle}</p>
                    <p className="text-[12px] text-muted-foreground">{l.subtitle}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  {l.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <p className="mt-4 text-[12.5px] font-medium text-foreground">— {l.signoff}</p>
              </article>
            ))}
          </div>
        </section>

        {/* COMPLETION CARD */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10),hsl(var(--accent)/0.06))] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Next up
              </div>
              <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                You are ready for the State Director Journey.
              </h3>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                You have met the company, read the leadership notes, reviewed the mission and values,
                and walked the high-level Blossom flow. Now move into the State Director launch journey.
                You will go one day at a time, with SOPs, walkthroughs, mentor check-ins, shadowing, and
                readiness sign-off. Nothing here has to be solved alone.
              </p>
            </div>
            <div className="flex flex-col gap-2 self-start sm:self-auto">
              <Button
                size="lg"
                className="rounded-2xl shadow-md shadow-primary/20"
                onClick={() => navigate("/training")}
                data-testid="welcome-continue-launch-path"
              >
                Continue to my State Director launch path <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <span className="sr-only">Continue to State Director Journey</span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-2xl gap-1.5"
                onClick={() => navigate("/resource-library")}
              >
                <BookOpen className="h-3.5 w-3.5" /> Open Resource Library
              </Button>
            </div>
          </div>
        </section>

        {/* REFLECTION PROMPT */}
        <section
          data-testid="welcome-reflection-prompt"
          className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-8"
        >
          <SectionHeader
            icon={MessageSquare}
            eyebrow="Reflection prompt"
            title="Before you move on, take five minutes."
            description="Reflection is part of the work — not extra. Jot a few honest sentences and bring them to your first mentor check-in."
          />
          <ul className="mt-5 grid gap-2 text-[13.5px] leading-relaxed text-foreground sm:grid-cols-2">
            {[
              "What does Blossom feel like to you so far, in one sentence?",
              "Which of our core values will be easiest for you to model? Which one will take work?",
              "What kind of leader will families and staff need you to be in your first 30 days?",
              "What is one question you want to bring to your mentor this week?",
            ].map((q) => (
              <li key={q} className="flex gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
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
