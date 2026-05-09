import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, GraduationCap, Sparkles, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const sections: Array<{ title: string; icon: typeof BookOpen; items: Array<{ title: string; meta: string; progress?: number; status?: string }> }> = [
  {
    title: "Continue Learning",
    icon: GraduationCap,
    items: [
      { title: "Blossom Systems Overview", meta: "Module 3 of 6", progress: 48 },
      { title: "Parent Communication Essentials", meta: "Module 2 of 4", progress: 32 },
    ],
  },
  {
    title: "Assigned Courses",
    icon: BookOpen,
    items: [
      { title: "HIPAA & Compliance Basics", meta: "Due in 7 days", status: "Required" },
      { title: "Intake Workflow 101", meta: "Due in 14 days", status: "Required" },
    ],
  },
  {
    title: "Upcoming Trainings",
    icon: Clock,
    items: [
      { title: "Quarterly Safety Refresher", meta: "Starts May 20" },
      { title: "New Hire Cohort — June", meta: "Starts Jun 3" },
    ],
  },
  {
    title: "Completed Courses",
    icon: CheckCircle2,
    items: [
      { title: "Welcome to Blossom", meta: "Completed Apr 28" },
      { title: "Meet Your Team", meta: "Completed May 1" },
    ],
  },
  {
    title: "Certifications",
    icon: Award,
    items: [
      { title: "HIPAA Awareness", meta: "Valid through 2026" },
      { title: "Blossom Systems Foundation", meta: "Awarded May 1" },
    ],
  },
  {
    title: "Recommended for You",
    icon: Star,
    items: [
      { title: "Leadership Foundations", meta: "Based on your role" },
      { title: "Difficult Conversations", meta: "Popular this week" },
    ],
  },
];

export default function MyLearning() {
  const { user } = useAuth();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0]?.split(/[._-]/)[0] ||
    "there";

  const inProgress = sections[0].items.length;
  const assigned = sections[1].items.length;
  const completed = sections[3].items.length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {/* Premium hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> My Learning
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Keep growing, <span className="capitalize">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              Everything assigned to you, in progress, or recommended — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { l: "In progress", v: inProgress },
              { l: "Assigned", v: assigned },
              { l: "Completed", v: completed },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
                <p className="text-2xl font-semibold">{s.v}</p>
                <p className="text-[11px] text-primary-foreground/85">{s.l}</p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/catalog">Browse catalog <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
              </div>
              <span className="text-[11px] text-muted-foreground">{s.items.length}</span>
            </div>
            <ul className="space-y-2">
              {s.items.map((it) => (
                <li key={it.title}>
                  <Link to="/catalog" className="block rounded-xl border border-border/50 bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{it.title}</p>
                        <p className="text-[11px] text-muted-foreground">{it.meta}</p>
                      </div>
                      {it.status && <Badge variant="outline" className="text-[10px]">{it.status}</Badge>}
                    </div>
                    {typeof it.progress === "number" && <Progress value={it.progress} className="mt-2 h-1.5" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
