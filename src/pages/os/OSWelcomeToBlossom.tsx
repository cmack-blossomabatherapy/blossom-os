import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight, PlayCircle, Sparkles, Heart, Compass, Users, ArrowLeft,
  CalendarDays, BookOpen, MessageSquare, Quote,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { markModuleComplete } from "@/lib/onboarding/storage";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

/**
 * Welcome to Blossom — Day 1.
 *
 * The very first day of every employee's journey. One calm OS-styled page
 * focused on: who we are, our mission, our values, the team, and the
 * welcome video. From here, employees move into Week 1.
 */
export default function OSWelcomeToBlossom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const status = useOnboardingStatus();
  const [displayName, setDisplayName] = useState<string>("");
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

  const pillars = [
    {
      icon: Heart,
      title: "Who we are",
      body: "Blossom ABA Therapy supports children and families across multiple states with calm, compassionate, structured care.",
    },
    {
      icon: Compass,
      title: "How we work",
      body: "Operations, clinical, scheduling, and HR all move together. Clear systems make great care possible.",
    },
    {
      icon: Users,
      title: "Your team",
      body: "You're joining people who care deeply about the work and about each other. You're never doing this alone.",
    },
  ];

  const leaders = [
    {
      name: "Chad Kaufman",
      role: "Chief Executive Officer",
      initial: "C",
      letter:
        "Welcome to Blossom. The reason this company exists is simple — we believe families deserve calm, structured, deeply caring ABA therapy, and the people delivering it deserve a real operational system behind them. You're not joining a startup figuring it out. You're joining a team that has done this work before, in multiple states, and that takes the responsibility seriously. Take your first week slow. Ask anything. We're glad you're here.",
    },
    {
      name: "Shira Lasry",
      role: "Director of Operations",
      initial: "S",
      letter:
        "My job — and your mentor's job — is to make sure you never feel lost. Blossom OS, our SOPs, your training path, and your weekly check-ins exist so the operational work is clear. Your first job isn't to know everything. It's to get grounded. Follow the launch path, lean on your mentor, and tell us where the system is unclear so we can fix it for the next person.",
    },
  ];

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-5xl space-y-10 pb-16">
        {/* Back to training */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
            <Link to="/training"><ArrowLeft className="h-3.5 w-3.5" /> Training Academy</Link>
          </Button>
        </div>

        {/* HERO */}
        <header>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Day 1 · Welcome to Blossom</span>
          </div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground md:text-[34px]">
            Welcome, <span className="capitalize">{firstName}</span>.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Today is just about getting grounded — who we are, what we believe, and the people you're
            joining. Watch the welcome video, then we'll move into Week 1 together.
          </p>
        </header>

        {/* WELCOME VIDEO */}
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <video
            src="/videos/intro-welcome.mp4"
            poster="/videos/intro-welcome-poster.jpg"
            controls
            playsInline
            preload="metadata"
            onPlay={() => { if (!videoDone) markModuleComplete("p0.intro-video"); }}
            className="aspect-video w-full bg-black object-cover"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">A note from Blossom</p>
                <p className="text-[12px] text-muted-foreground">~3 min · Watch all the way through</p>
              </div>
            </div>
            <Button
              size="sm"
              variant={videoDone ? "outline" : "default"}
              className="rounded-full"
              onClick={() => markModuleComplete("p0.intro-video")}
            >
              {videoDone ? "Marked watched" : "Mark as watched"}
            </Button>
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="grid gap-3 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        {/* LEADERSHIP LETTERS */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
              A note from leadership
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Two short letters worth reading once.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {leaders.map((l) => (
              <article
                key={l.name}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <Quote className="absolute right-5 top-5 h-5 w-5 text-primary/30" aria-hidden />
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-[14px] font-semibold text-primary">
                    {l.initial}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{l.name}</p>
                    <p className="text-[12px] text-muted-foreground">{l.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
                  {l.letter}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* QUICK LINKS — calm, single column of subtle rows */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                Get to know Blossom
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Optional reading for Day 1. Skim what speaks to you — we'll go deeper in Week 1.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
            {[
              { to: "/onboarding/mission", icon: Heart, title: "Mission & Vision", desc: "Why we exist and where we're headed." },
              { to: "/onboarding/values", icon: Compass, title: "Our Core Values", desc: "The four values that guide every decision." },
              { to: "/onboarding/meet-the-team", icon: Users, title: "Meet the Team", desc: "Leadership, departments, and who supports you." },
              { to: "/onboarding/how-it-works", icon: BookOpen, title: "How Blossom Works", desc: "How learning, operations, and growth fit together." },
            ].map(({ to, icon: Icon, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-foreground">{title}</p>
                  <p className="truncate text-[12.5px] text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        {/* CONTINUE TO WEEK 1 */}
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary)/0.10),hsl(var(--accent)/0.06))] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3 w-3 text-primary" /> Next up
              </div>
              <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                Week 1 — Foundation, Culture & Systems Tour
              </h3>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                Four short hours a day. You'll meet the team, learn how Blossom thinks, and take
                a guided tour of the systems you'll use. Nothing to memorize — just look and ask.
              </p>
            </div>
            <div className="flex flex-col gap-2 self-start">
              <Button
                size="lg"
                className="rounded-2xl shadow-md shadow-primary/20"
                onClick={() => navigate("/onboarding/week/1")}
              >
                Start Week 1 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-2xl"
                onClick={() => navigate("/training")}
              >
                Continue to State Director Journey
              </Button>
            </div>
          </div>
        </section>

        <p className="text-center text-[12px] text-muted-foreground">
          <MessageSquare className="mr-1 inline h-3 w-3" />
          Questions on Day 1? Message your HR partner — they're expecting you.
        </p>
      </div>
    </OSShell>
  );
}
