import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Award, CheckCircle2, Clock, Flame, Play, Search, Sparkles, Layers, GraduationCap } from "lucide-react";
import { Pin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { iconMap, trainingDepartments } from "@/data/training";
import { GlassHero } from "@/components/shared/GlassHero";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const statusVariant = (status: string) => status === "Completed" ? "success" : status === "Overdue" ? "destructive" : status === "In Progress" ? "warning" : "muted";

type LiveCourse = {
  id: string;
  title: string;
  description: string | null;
  training_type: string | null;
  estimated_minutes: number | null;
  category: string | null;
  external_url: string | null;
  is_pinned: boolean;
};
type LiveAssignment = { id: string; course_id: string; status: string; due_date: string | null; completed_at: string | null };
type LiveProgress = { course_id: string; status: string; progress_percentage: number; quiz_score: number | null; last_opened_at: string | null };
type LiveBadge = { id: string; title: string; description: string | null; icon: string | null; earned_at: string | null };

type CourseDisplayStatus = { status: string; progress: number; dueDate?: string; required: boolean };

export default function TrainingHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ !== query) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<LiveCourse[]>([]);
  const [assignments, setAssignments] = useState<LiveAssignment[]>([]);
  const [progress, setProgress] = useState<LiveProgress[]>([]);
  const [badges, setBadges] = useState<LiveBadge[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id;
      // Find employee record for current user
      let employeeId: string | null = null;
      if (userId) {
        const { data: emp } = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
        employeeId = emp?.id ?? null;
      }
      const [c, a, p, b] = await Promise.all([
        supabase.from("training_courses").select("id,title,description,training_type,estimated_minutes,category,external_url,is_pinned").eq("is_active", true).order("title"),
        employeeId
          ? supabase.from("employee_trainings").select("id,course_id,status,due_date,completed_at").eq("employee_id", employeeId)
          : Promise.resolve({ data: [], error: null } as never),
        userId
          ? supabase.from("training_progress").select("course_id,status,progress_percentage,quiz_score,last_opened_at").eq("user_id", userId)
          : Promise.resolve({ data: [], error: null } as never),
        userId
          ? supabase.from("user_training_badges").select("id,earned_at,badge:training_badges(title,description,icon)").eq("user_id", userId)
          : Promise.resolve({ data: [], error: null } as never),
      ]);
      if (!active) return;
      setCourses((c.data ?? []) as never);
      setAssignments((a.data ?? []) as never);
      setProgress((p.data ?? []) as never);
      setBadges(((b.data ?? []) as unknown as Array<{ id: string; earned_at: string | null; badge: { title: string; description: string | null; icon: string | null } | null }>).map((row) => ({ id: row.id, earned_at: row.earned_at, title: row.badge?.title ?? "Badge", description: row.badge?.description ?? null, icon: row.badge?.icon ?? "🏅" })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Blossom teammate";

  const progressByCourse = useMemo(() => Object.fromEntries(progress.map((p) => [p.course_id, p])), [progress]);
  const assignmentByCourse = useMemo(() => Object.fromEntries(assignments.map((a) => [a.course_id, a])), [assignments]);

  const courseStatus = (c: LiveCourse): CourseDisplayStatus => {
    const a = assignmentByCourse[c.id];
    const p = progressByCourse[c.id];
    const pct = p?.progress_percentage ?? 0;
    const aStatus = a?.status;
    const status = pct >= 100 || aStatus === "completed"
      ? "Completed"
      : aStatus === "overdue"
      ? "Overdue"
      : pct > 0 || aStatus === "in_progress"
      ? "In Progress"
      : aStatus === "assigned"
      ? "Not Started"
      : "Not Started";
    return { status, progress: pct, dueDate: a?.due_date ?? undefined, required: !!a };
  };

  const visibleCourses = courses;
  const pinnedCourses = courses.filter((c) => c.is_pinned).slice(0, 8);

  const searched = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return visibleCourses;
    return visibleCourses.filter((c) => [c.title, c.description, c.training_type, c.category].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [query, visibleCourses]);

  const continueCourses = visibleCourses.filter((c) => { const s = courseStatus(c); return s.status === "In Progress"; }).slice(0, 4);
  const allRequiredCourses = visibleCourses.filter((c) => courseStatus(c).required);
  const completedCourses = allRequiredCourses.filter((c) => courseStatus(c).status === "Completed");
  const requiredCourses = allRequiredCourses.filter((c) => courseStatus(c).status !== "Completed").slice(0, 8);

  const visibleTrainingDepartments = trainingDepartments;

  // No live trainings yet — show an empty state instead of mock departments
  if (!loading && courses.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-8 text-primary-foreground shadow-lg sm:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%)]" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Training Hub
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">No live trainings yet</h1>
            <p className="max-w-xl text-sm text-primary-foreground/85 sm:text-base">
              The Blossom Academy library is being built. Once HR publishes courses they'll appear here automatically.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to="/onboarding">Open onboarding journey <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                <Link to="/help">Help & Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="aurora-bg -mx-3 -my-3 px-3 py-3 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 animate-fade-in">
        <GlassHero
          eyebrow="Internal learning OS"
          eyebrowIcon={Sparkles}
          title="Blossom Training Hub"
          subtitle={<>Learn the systems, workflows, and standards that keep Blossom running smoothly. <span className="font-medium text-foreground">Welcome back, {displayName}.</span></>}
          right={
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <GlassStat icon={GraduationCap} tone="primary" label="Assigned" value={assignments.length} />
              <GlassStat icon={Flame} tone="warning" label="In progress" value={continueCourses.length} />
              <GlassStat icon={Award} tone="success" label="Badges" value={badges.length} />
            </div>
          }
        >
          <div className="relative max-w-2xl">
            <Search className="absolute z-10 left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics, SOPs, systems, departments..."
              className="h-12 md:h-14 rounded-2xl border-border/60 bg-background/70 pl-12 text-sm md:text-base shadow-sm backdrop-blur-md focus-visible:ring-primary/40"
            />
          </div>
        </GlassHero>

        {query && (
          <GlassPanel
            title="Search results"
            description={`${searched.length} trainings`}
            icon={Search}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {searched.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} compact training={courseStatus(course)} />
              ))}
            </div>
          </GlassPanel>
        )}

        {pinnedCourses.length > 0 && !query && (
          <GlassPanel
            title="Pinned by HR"
            description="Highlighted trainings everyone should know about."
            icon={Pin}
            iconTone="warning"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pinnedCourses.map((p) => (
                <Link
                  key={p.id}
                  to={`/training/course/${p.id}`}
                  className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-4 transition-all hover:border-primary/60 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Pin className="h-4 w-4 text-primary fill-primary/30" />
                    {p.external_url && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />}
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{p.title}</p>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="h-5 text-[10px]">{p.training_type ?? "Course"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{p.estimated_minutes ?? 0} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </GlassPanel>
        )}

        <GlassPanel
          title="Continue learning"
          description="Started trainings and failed quizzes that need another attempt."
          icon={Flame}
          iconTone="warning"
        >
          {continueCourses.length ? (
            <div className="grid items-stretch gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {continueCourses.map((course) => (
                <CourseCard key={course.id} course={course} training={courseStatus(course)} />
              ))}
            </div>
          ) : (
            <EmptyState text={loading ? "Loading…" : "No trainings are in progress yet. Start a required course or browse the Training Library below."} />
          )}
        </GlassPanel>

        <GlassPanel
          title="Required training"
          description="Personalized by role, department, and assignments."
          icon={Clock}
          iconTone="primary"
          bodyClassName="p-0"
        >
          {requiredCourses.length ? (
            <div className="overflow-x-auto -mx-px">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    {["Training", "Type", "Due date", "Status", "Progress", "Action"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requiredCourses.map((course) => {
                    const training = courseStatus(course);
                    return (
                      <tr key={course.id} className="border-t border-border/40 transition-colors hover:bg-primary/5">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.category ?? "General"} · {course.training_type ?? "Course"}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{course.training_type ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{training.dueDate ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={training.status} variant={statusVariant(training.status)} /></td>
                        <td className="px-4 py-3 min-w-[150px]">
                          <Progress value={training.progress} className="h-2" />
                          <span className="mt-1 block text-[11px] text-muted-foreground">{training.progress}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" onClick={() => navigate(`/training/course/${course.id}`)}>{training.progress ? "Continue" : "Start"}</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5"><EmptyState text={loading ? "Loading…" : "No open required trainings. Completed required courses appear below."} /></div>
          )}
        </GlassPanel>

        <GlassPanel title="Completed training" description="Required trainings completed with passing quiz results when a quiz is included." icon={CheckCircle2} iconTone="success">
          {completedCourses.length ? (
            <div className="grid items-stretch gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {completedCourses.map((course) => <CourseCard key={course.id} course={course} training={courseStatus(course)} />)}
            </div>
          ) : <EmptyState text="Completed trainings will appear here after you finish the lessons and pass the quiz." />}
        </GlassPanel>

        <GlassPanel title="Department training library" description="Choose a department path and build confidence step by step." icon={Layers}>
          <div className="grid items-stretch gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTrainingDepartments.map((dept) => {
              const Icon = iconMap[dept.icon];
              const deptCourses = visibleCourses.filter((c) => (c.category ?? "").toLowerCase() === dept.id.toLowerCase() || (c.category ?? "").toLowerCase() === dept.name.toLowerCase());
              const completion = deptCourses.length ? Math.round(deptCourses.reduce((sum, c) => sum + courseStatus(c).progress, 0) / deptCourses.length) : 0;
              return (
                <Link key={dept.id} to={`/training/department/${dept.slug}`} className="glass-tile group flex min-h-[220px] sm:min-h-[260px] flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/40", dept.accent)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-4 truncate text-base font-semibold text-foreground" title={dept.name}>{dept.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{dept.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <span>{deptCourses.length} trainings</span>
                    <span className="font-medium text-foreground">{completion}%</span>
                  </div>
                  <Progress value={completion} className="mt-2 h-1.5" />
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-background/60 backdrop-blur-sm">View training</Button>
                </Link>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel title="My badges" icon={Award} iconTone="warning">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.length ? badges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-3 backdrop-blur">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-lg ring-1 ring-warning/20">{badge.icon ?? "🏅"}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{badge.title}</p>
                  {badge.description && <p className="text-xs text-muted-foreground">{badge.description}</p>}
                </div>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
            )) : <EmptyState text="No badges yet. Earn badges by completing required training courses." />}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function CourseCard({ course, compact = false, training }: { course: LiveCourse; compact?: boolean; training?: CourseDisplayStatus }) {
  const minutes = course.estimated_minutes ?? 0;
  const display = training ?? { status: "Not Started", progress: 0, required: false };
  return (
    <div className="glass-tile flex min-h-[230px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={course.title}>{course.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{course.category ?? "General"} · {minutes} min</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={display.status} variant={statusVariant(display.status)} />
        </div>
      </div>
      {!compact && course.description && <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{course.description}</p>}
      <div className="mt-auto pt-4">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{display.progress}%</span>
          <span className="shrink-0">{display.progress && minutes ? `${Math.max(3, Math.round((100 - display.progress) / 100 * minutes))} min left` : `${minutes} min`}</span>
        </div>
        <Progress value={display.progress} className="h-1.5" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="truncate text-xs text-muted-foreground">{course.training_type ?? "Course"}</span>
        <Button asChild size="sm" className="shrink-0">
          <Link to={`/training/course/${course.id}`}><Play className="mr-1 h-3.5 w-3.5" />{display.progress ? "Continue" : "Start"}</Link>
        </Button>
      </div>
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-8 text-center text-sm text-muted-foreground backdrop-blur-sm">{text}</div>;
}
