import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, GraduationCap, Library, Megaphone, Sparkles, Trophy, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { to: "/academy", label: "Blossom Academy", desc: "Role-based learning tracks", icon: Compass },
  { to: "/my-learning", label: "My Learning", desc: "Continue where you left off", icon: GraduationCap },
  { to: "/catalog", label: "Training Catalog", desc: "Browse every course", icon: BookOpen },
  { to: "/resources", label: "Resource Hub", desc: "SOPs, guides, templates", icon: Library },
];

const onboardingSteps = [
  { n: 1, title: "Welcome to Blossom", done: true },
  { n: 2, title: "Meet Your Team", done: true },
  { n: 3, title: "Learn Our Systems", done: false },
  { n: 4, title: "Complete Required Training", done: false },
  { n: 5, title: "Certification & Readiness", done: false },
];

export default function WelcomeHome() {
  const { user, isAdmin } = useAuth();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0]?.split(/[._-]/)[0] ||
    "there";
  const completed = onboardingSteps.filter((s) => s.done).length;
  const pct = Math.round((completed / onboardingSteps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Blossom Academy
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              Your home for onboarding, training, and growth at Blossom ABA Therapy. Pick up where you left off or explore what's new.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-primary-foreground/85">
                <span>Onboarding progress</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-2 bg-primary-foreground/20" />
              <p className="text-[11px] text-primary-foreground/80">{completed} of {onboardingSteps.length} milestones complete</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/my-learning">Continue Learning <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              {isAdmin && (
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                  <Link to="/leadership-dashboard">Switch to Operations</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <q.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{q.label}</p>
              <p className="text-[11px] text-muted-foreground">{q.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Onboarding roadmap */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your onboarding journey</h2>
            <p className="text-xs text-muted-foreground">A guided path through your first weeks at Blossom.</p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to="/academy">View academy <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        <ol className="space-y-2">
          {onboardingSteps.map((step) => (
            <li
              key={step.n}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                step.done ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.n}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{step.title}</span>
              <span className={`text-[11px] font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                {step.done ? "Complete" : "Up next"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Three-up: Continue, Announcements, Achievements */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Continue Learning</h3>
          </div>
          <div className="space-y-3">
            {["Blossom Systems Overview", "HIPAA & Compliance Basics", "Parent Communication"].map((t) => (
              <Link
                key={t}
                to="/my-learning"
                className="block rounded-xl border border-border/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <p className="text-sm font-medium text-foreground">{t}</p>
                <Progress value={Math.floor(Math.random() * 70) + 10} className="mt-2 h-1.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Latest Announcements</h3>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              { t: "New onboarding track released", d: "2d ago" },
              { t: "Q2 compliance training assigned", d: "5d ago" },
              { t: "Welcome to 12 new RBTs", d: "1w ago" },
            ].map((a) => (
              <li key={a.t} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                <span className="text-foreground">{a.t}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.d}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="sm" variant="ghost" className="mt-3 w-full">
            <Link to="/announcements">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Your Achievements</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { e: "🌱", l: "Day 1" },
              { e: "📘", l: "First Course" },
              { e: "🤝", l: "Team Met" },
              { e: "🔒", l: "HIPAA" },
              { e: "⭐", l: "5 Lessons" },
              { e: "🏆", l: "Locked" },
            ].map((b, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 rounded-xl border border-border/50 p-2 text-[11px] ${
                  b.l === "Locked" ? "opacity-40" : ""
                }`}
              >
                <span className="text-xl">{b.e}</span>
                <span className="text-muted-foreground">{b.l}</span>
              </div>
            ))}
          </div>
          <Button asChild size="sm" variant="ghost" className="mt-3 w-full">
            <Link to="/profile"><User className="mr-1 h-3.5 w-3.5" /> View profile</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
