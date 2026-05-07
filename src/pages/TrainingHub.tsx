import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, Flame, Play, Search, Sparkles, Layers, GraduationCap } from "lucide-react";
import { Pin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTrainingAssignments, getStoredTrainingBadges, getStoredTrainingCourses, iconMap, resourcePlaceholders, trainingDepartments, TRAINING_ASSIGNMENTS_UPDATED_EVENT, TRAINING_BADGES_UPDATED_EVENT, TRAINING_UPDATED_EVENT, type TrainingAssignmentRecord, type TrainingBadge, type TrainingCourse } from "@/data/training";
import { GlassHero } from "@/components/shared/GlassHero";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { GlassStat } from "@/components/shared/GlassStat";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const statusVariant = (status: string) => status === "Completed" ? "success" : status === "Overdue" ? "destructive" : status === "In Progress" ? "warning" : "muted";
const executiveOnlyDepartmentIds = new Set(["exec", "ops", "systems", "hr", "finance"]);

type CourseDisplayStatus = { status: string; progress: number; dueDate?: string; required: boolean };
type QuizDisplayResult = { label: string; shortLabel: string; variant: "success" | "destructive"; failed: boolean };

export default function TrainingHub() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ !== query) setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>(() => getStoredTrainingCourses());
  const [assignments, setAssignments] = useState<TrainingAssignmentRecord[]>(() => getStoredTrainingAssignments());
  const [badges, setBadges] = useState<TrainingBadge[]>(() => getStoredTrainingBadges());
  const [pinnedCourses, setPinnedCourses] = useState<Array<{ id: string; title: string; description: string | null; training_type: string; estimated_minutes: number; external_url: string | null }>>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("training_courses")
        .select("id,title,description,training_type,estimated_minutes,external_url")
        .eq("is_pinned", true)
        .eq("is_active", true)
        .order("title")
        .limit(8);
      if (active) setPinnedCourses((data ?? []) as never);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const refresh = () => setTrainingCourses(getStoredTrainingCourses());
    window.addEventListener(TRAINING_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRAINING_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setAssignments(getStoredTrainingAssignments());
    window.addEventListener(TRAINING_ASSIGNMENTS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRAINING_ASSIGNMENTS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setBadges(getStoredTrainingBadges());
    window.addEventListener(TRAINING_BADGES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRAINING_BADGES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Blossom teammate";
  const roleSet = useMemo(() => new Set(roles), [roles]);
  const canSeeExecutiveTraining = roleSet.has("admin") || roleSet.has("exec");
  const visibleTrainingDepartments = useMemo(() => trainingDepartments.filter((dept) => canSeeExecutiveTraining || !executiveOnlyDepartmentIds.has(dept.id)), [canSeeExecutiveTraining]);
  const myAssignments = useMemo(() => assignments.filter((assignment) => assignment.employeeEmail && user?.email && assignment.employeeEmail.toLowerCase() === user.email.toLowerCase()), [assignments, user?.email]);
  const assignedCourseIds = useMemo(() => new Set(myAssignments.map((assignment) => assignment.courseId)), [myAssignments]);
  const visibleCourses = useMemo(() => trainingCourses.filter((course) => {
    const canSeeDepartment = canSeeExecutiveTraining || !executiveOnlyDepartmentIds.has(course.departmentId);
    const canSeeCourse = assignedCourseIds.has(course.id) || course.roleVisibility.length === 0 || course.roleVisibility.some((role) => roleSet.has(role as never)) || roles.length === 0;
    return canSeeDepartment && canSeeCourse;
  }), [assignedCourseIds, canSeeExecutiveTraining, roleSet, roles.length, trainingCourses]);

  const courseAssignment = (courseId: string) => myAssignments.find((assignment) => assignment.courseId === courseId);
  const quizResult = (course: TrainingCourse): QuizDisplayResult | null => {
    if (!course.quiz || course.quizScore == null) return null;
    const passed = course.quizScore >= course.quiz.passingScore;
    return {
      label: `${passed ? "Quiz passed" : "Quiz failed"} · ${course.quizScore}%`,
      shortLabel: `${passed ? "Passed" : "Failed"} ${course.quizScore}%`,
      variant: passed ? "success" : "destructive",
      failed: !passed,
    };
  };
  const courseStatus = (course: TrainingCourse): CourseDisplayStatus => {
    const assignment = courseAssignment(course.id);
    const base = assignment
      ? { status: assignment.status === "completed" ? "Completed" : assignment.status === "overdue" ? "Overdue" : assignment.status === "in_progress" ? "In Progress" : "Not Started", progress: assignment.progress, dueDate: assignment.dueDate || course.dueDate, required: assignment.required }
      : { status: course.status, progress: course.progress, dueDate: course.dueDate, required: course.required };
    const quiz = quizResult(course);
    if (quiz?.failed) return { ...base, status: "In Progress" };
    if (quiz && base.progress >= 100) return { ...base, status: "Completed" };
    return base;
  };

  const searched = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return visibleCourses;
    return visibleCourses.filter((course) => {
      const dept = trainingDepartments.find((d) => d.id === course.departmentId);
      return [course.title, course.description, course.type, dept?.name, course.resources.join(" ")].join(" ").toLowerCase().includes(q);
    });
  }, [query, visibleCourses]);

  const continueCourses = visibleCourses.filter((course) => courseStatus(course).status === "In Progress" || quizResult(course)?.failed).slice(0, 4);
  const allRequiredCourses = visibleCourses.filter((course) => courseStatus(course).required);
  const completedCourses = allRequiredCourses.filter((course) => courseStatus(course).status === "Completed");
  const requiredCourses = allRequiredCourses.filter((course) => courseStatus(course).status !== "Completed").slice(0, 8);

  return (
    <div className="aurora-bg -mx-4 -my-4 px-4 py-4 md:-mx-6 md:-my-6 md:px-6 md:py-6 min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
        <GlassHero
          eyebrow="Internal learning OS"
          eyebrowIcon={Sparkles}
          title="Blossom Training Hub"
          subtitle={<>Learn the systems, workflows, and standards that keep Blossom running smoothly. <span className="font-medium text-foreground">Welcome back, {displayName}.</span></>}
          right={
            <div className="grid grid-cols-3 gap-3">
              <GlassStat icon={GraduationCap} tone="primary" label="Assigned" value={myAssignments.length || allRequiredCourses.length} />
              <GlassStat icon={Flame} tone="warning" label="In progress" value={continueCourses.length} />
              <GlassStat icon={Award} tone="success" label="Badges" value={badges.filter((b) => b.earned).length} />
            </div>
          }
        >
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics, SOPs, systems, departments..."
              className="h-14 rounded-2xl border-border/60 bg-background/70 pl-12 text-base shadow-sm backdrop-blur-md focus-visible:ring-primary/40"
            />
          </div>
        </GlassHero>

        {query && (
          <GlassPanel
            title="Search results"
            description={`${searched.length} trainings`}
            icon={Search}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {searched.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} compact training={courseStatus(course)} quiz={quizResult(course)} />
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {pinnedCourses.map((p) => (
                <a
                  key={p.id}
                  href={p.external_url ?? "#"}
                  target={p.external_url ? "_blank" : undefined}
                  rel={p.external_url ? "noreferrer noopener" : undefined}
                  className="group rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-4 transition-all hover:border-primary/60 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Pin className="h-4 w-4 text-primary fill-primary/30" />
                    {p.external_url && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />}
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{p.title}</p>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="h-5 text-[10px]">{p.training_type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{p.estimated_minutes} min</span>
                  </div>
                </a>
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
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              {continueCourses.map((course) => (
                <CourseCard key={course.id} course={course} training={courseStatus(course)} quiz={quizResult(course)} />
              ))}
            </div>
          ) : (
            <EmptyState text="No trainings are in progress yet. Start a required course or browse the Training Library below." />
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    {["Training", "Required by", "Due date", "Status", "Quiz", "Progress", "Action"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requiredCourses.map((course) => {
                    const training = courseStatus(course);
                    const quiz = quizResult(course);
                    return (
                      <tr key={course.id} className="border-t border-border/40 transition-colors hover:bg-primary/5">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{trainingDepartments.find((d) => d.id === course.departmentId)?.name} · {course.type}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{course.requiredBy ?? "General Blossom path"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{training.dueDate ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={training.status} variant={statusVariant(training.status)} /></td>
                        <td className="px-4 py-3">{quiz ? <StatusBadge status={quiz.label} variant={quiz.variant} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
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
            <div className="p-5"><EmptyState text="No open required trainings. Completed required courses appear below." /></div>
          )}
        </GlassPanel>

        <GlassPanel title="Completed training" description="Required trainings completed with passing quiz results when a quiz is included." icon={CheckCircle2} iconTone="success">
          {completedCourses.length ? (
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              {completedCourses.map((course) => <CourseCard key={course.id} course={course} training={courseStatus(course)} quiz={quizResult(course)} />)}
            </div>
          ) : <EmptyState text="Completed trainings will appear here after you finish the lessons and pass the quiz." />}
        </GlassPanel>

        <GlassPanel title="Department training library" description="Choose a department path and build confidence step by step." icon={Layers}>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTrainingDepartments.map((dept) => {
              const Icon = iconMap[dept.icon];
              const courses = visibleCourses.filter((c) => c.departmentId === dept.id);
              const completion = courses.length ? Math.round(courses.reduce((sum, c) => sum + courseStatus(c).progress, 0) / courses.length) : 0;
              return (
                <Link key={dept.id} to={`/training/department/${dept.slug}`} className="glass-tile group flex min-h-[260px] flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/40", dept.accent)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-4 truncate text-base font-semibold text-foreground" title={dept.name}>{dept.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{dept.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <span>{courses.length} trainings</span>
                    <span className="font-medium text-foreground">{completion}%</span>
                  </div>
                  <Progress value={completion} className="mt-2 h-1.5" />
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-background/60 backdrop-blur-sm">View training</Button>
                </Link>
              );
            })}
          </div>
        </GlassPanel>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <GlassPanel title="Featured resources" icon={Sparkles}>
            <div className="grid gap-3 md:grid-cols-2">
              {resourcePlaceholders.map((item) => (
                <div key={item.id} className="glass-tile">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <StatusBadge status={item.category} variant="muted" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.roleGroup}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel title="My badges" icon={Award} iconTone="warning">
            <div className="space-y-3">
              {badges.length ? badges.map((badge) => (
                <div key={badge.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 backdrop-blur", badge.earned ? "border-warning/30 bg-warning/5" : "border-border/40 bg-card/40 opacity-70")}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-lg ring-1 ring-warning/20">{badge.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{badge.title}</p>
                    <p className="text-xs text-muted-foreground">{badge.reason}</p>
                  </div>
                  {badge.earned && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
              )) : <EmptyState text="No badges yet. Badges will appear here after Training Dashboard creates them." />}
            </div>
          </GlassPanel>
        </section>
      </div>
    </div>
  );
}

function CourseCard({ course, compact = false, training, quiz }: { course: TrainingCourse; compact?: boolean; training?: CourseDisplayStatus; quiz?: QuizDisplayResult | null }) {
  const dept = trainingDepartments.find((d) => d.id === course.departmentId);
  const display = training ?? { status: course.status, progress: course.progress, dueDate: course.dueDate, required: course.required };
  return (
    <div className="glass-tile flex min-h-[230px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={course.title}>{course.title}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{dept?.name} · {course.minutes} min</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={display.status} variant={statusVariant(display.status)} />
          {quiz && <StatusBadge status={quiz.shortLabel} variant={quiz.variant} />}
        </div>
      </div>
      {!compact && <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{course.description}</p>}
      <div className="mt-auto pt-4">
        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{display.progress}%</span>
          <span className="shrink-0">{display.progress ? `${Math.max(3, Math.round((100 - display.progress) / 100 * course.minutes))} min left` : `${course.minutes} min`}</span>
        </div>
        <Progress value={display.progress} className="h-1.5" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="truncate text-xs text-muted-foreground">Last opened {course.lastOpened ?? "—"}</span>
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
