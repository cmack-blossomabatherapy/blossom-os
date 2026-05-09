import { Link } from "react-router-dom";
import { Award, BookOpen, CheckCircle2, Clock, GraduationCap, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">My Learning</h1>
        <p className="text-sm text-muted-foreground">Everything assigned to you, in progress, or recommended.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <s.icon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
            </div>
            <ul className="space-y-2">
              {s.items.map((it) => (
                <li key={it.title}>
                  <Link to="/catalog" className="block rounded-xl border border-border/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
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
