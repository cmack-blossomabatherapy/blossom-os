import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, Flame, GraduationCap, Play, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { featuredResources, getStoredTrainingAssignments, getStoredTrainingCourses, iconMap, trainingBadges, trainingDepartments, TRAINING_ASSIGNMENTS_UPDATED_EVENT, TRAINING_UPDATED_EVENT, type TrainingAssignmentRecord, type TrainingCourse } from "@/data/training";

const statusVariant = (status: string) => status === "Completed" ? "success" : status === "Overdue" ? "destructive" : status === "In Progress" ? "warning" : "muted";

export default function TrainingHub() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>(() => getStoredTrainingCourses());
  const [assignments, setAssignments] = useState<TrainingAssignmentRecord[]>(() => getStoredTrainingAssignments());
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
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Blossom teammate";
  const roleSet = useMemo(() => new Set(roles), [roles]);
  const myAssignments = useMemo(() => assignments.filter((assignment) => assignment.employeeEmail && user?.email && assignment.employeeEmail.toLowerCase() === user.email.toLowerCase()), [assignments, user?.email]);
  const assignedCourseIds = useMemo(() => new Set(myAssignments.map((assignment) => assignment.courseId)), [myAssignments]);
  const visibleCourses = useMemo(() => trainingCourses.filter((course) => assignedCourseIds.has(course.id) || course.roleVisibility.length === 0 || course.roleVisibility.some((role) => roleSet.has(role as never)) || roles.length === 0), [assignedCourseIds, roleSet, roles.length, trainingCourses]);
  const courseAssignment = (courseId: string) => myAssignments.find((assignment) => assignment.courseId === courseId);
  const courseStatus = (course: TrainingCourse) => {
    const assignment = courseAssignment(course.id);
    if (!assignment) return { status: course.status, progress: course.progress, dueDate: course.dueDate, required: course.required };
    return { status: assignment.status === "completed" ? "Completed" : assignment.status === "overdue" ? "Overdue" : assignment.status === "in_progress" ? "In Progress" : "Not Started", progress: assignment.progress, dueDate: assignment.dueDate || course.dueDate, required: assignment.required };
  };
  const searched = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return visibleCourses;
    return visibleCourses.filter((course) => {
      const dept = trainingDepartments.find((d) => d.id === course.departmentId);
      return [course.title, course.description, course.type, dept?.name, course.resources.join(" ")].join(" ").toLowerCase().includes(q);
    });
  }, [query, visibleCourses]);
  const continueCourses = visibleCourses.filter((course) => courseStatus(course).status === "In Progress").slice(0, 4);
  const requiredCourses = visibleCourses.filter((course) => courseStatus(course).required).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.14),transparent_30%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> Internal learning OS</div>
            <div><h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Blossom Training Hub</h1><p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">Learn the systems, workflows, and standards that keep Blossom running smoothly.</p><p className="mt-3 text-sm font-medium text-foreground">Welcome back, {displayName}. Continue where you left off.</p></div>
            <div className="relative max-w-2xl"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, SOPs, systems, departments..." className="h-14 rounded-2xl border-border/70 bg-background/80 pl-12 text-base shadow-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: "Assigned", value: myAssignments.length || requiredCourses.length }, { label: "In progress", value: continueCourses.length }, { label: "Badges", value: trainingBadges.filter((b) => b.earned).length }].map((item) => <div key={item.label} className="rounded-2xl border border-border/60 bg-background/75 p-4 text-center shadow-sm backdrop-blur"><p className="text-3xl font-semibold text-foreground">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></div>)}
          </div>
        </div>
      </section>

      {query && <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">Search results</h2><span className="text-xs text-muted-foreground">{searched.length} trainings</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{searched.slice(0, 6).map((course) => <CourseCard key={course.id} course={course} compact />)}</div></section>}

      <section className="space-y-3"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-foreground">Continue Learning</h2><p className="text-sm text-muted-foreground">Started trainings that are waiting for you.</p></div><Flame className="h-5 w-5 text-warning" /></div>{continueCourses.length ? <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">{continueCourses.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <EmptyState text="No trainings are in progress yet. Start a required course or browse the Training Library below." />}</section>

      <section className="rounded-2xl border border-border/60 bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border/60 p-4"><div><h2 className="text-xl font-semibold text-foreground">Required Training</h2><p className="text-sm text-muted-foreground">Personalized by role, department, and assignments.</p></div><Clock className="h-5 w-5 text-primary" /></div>{requiredCourses.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{["Training", "Required by", "Due date", "Status", "Progress", "Action"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead><tbody>{requiredCourses.map((course) => { const training = courseStatus(course); return <tr key={course.id} className="border-t border-border/50 hover:bg-muted/25"><td className="px-4 py-3"><p className="font-medium text-foreground">{course.title}</p><p className="text-xs text-muted-foreground">{trainingDepartments.find((d) => d.id === course.departmentId)?.name} · {course.type}</p></td><td className="px-4 py-3 text-xs text-muted-foreground">{course.requiredBy ?? "General Blossom path"}</td><td className="px-4 py-3 text-xs text-muted-foreground">{training.dueDate ?? "—"}</td><td className="px-4 py-3"><StatusBadge status={training.status} variant={statusVariant(training.status)} /></td><td className="px-4 py-3 min-w-[150px]"><Progress value={training.progress} className="h-2" /><span className="mt-1 block text-[11px] text-muted-foreground">{training.progress}%</span></td><td className="px-4 py-3"><Button size="sm" onClick={() => navigate(`/training/course/${course.id}`)}>{training.progress ? "Continue" : "Start"}</Button></td></tr>; })}</tbody></table></div> : <EmptyState text="No required trainings have been assigned yet." />}</section>

      <section className="space-y-3"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-foreground">Department Training Library</h2><p className="text-sm text-muted-foreground">Choose a department path and build confidence step by step.</p></div><BookOpen className="h-5 w-5 text-primary" /></div><div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">{trainingDepartments.map((dept) => { const Icon = iconMap[dept.icon]; const courses = visibleCourses.filter((c) => c.departmentId === dept.id); const completion = courses.length ? Math.round(courses.reduce((sum, c) => sum + courseStatus(c).progress, 0) / courses.length) : 0; return <Link key={dept.id} to={`/training/department/${dept.slug}`} className="group flex min-h-[260px] flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", dept.accent)}><Icon className="h-5 w-5" /></div><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h3 className="mt-4 truncate text-base font-semibold text-foreground" title={dept.name}>{dept.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{dept.description}</p><div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground"><span>{courses.length} trainings</span><span>{completion}% complete</span></div><Progress value={completion} className="mt-2 h-2" /><Button variant="outline" size="sm" className="mt-4 w-full">View Training</Button></Link>; })}</div></section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold text-foreground">Featured Resources</h2></div><div className="grid gap-3 md:grid-cols-2">{featuredResources.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-xl border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/30"><p className="font-medium text-foreground">{item}</p><p className="mt-1 text-xs text-muted-foreground">Open SOPs, Tangos, checklists, and walkthroughs.</p></button>)}</div></div><div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-warning" /><h2 className="text-xl font-semibold text-foreground">My Badges</h2></div><div className="space-y-3">{trainingBadges.map((badge) => <div key={badge.id} className={cn("flex items-center gap-3 rounded-xl border p-3", badge.earned ? "border-warning/30 bg-warning/5" : "border-border/60 bg-background opacity-70")}><div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning"><Award className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{badge.title}</p><p className="text-xs text-muted-foreground">{badge.earned ? `Earned ${badge.earnedAt}` : "Not earned yet"}</p></div>{badge.earned && <CheckCircle2 className="h-4 w-4 text-success" />}</div>)}</div></div></section>
    </div>
  );
}

function CourseCard({ course, compact = false }: { course: TrainingCourse; compact?: boolean }) {
  const dept = trainingDepartments.find((d) => d.id === course.departmentId);
  return <div className="flex min-h-[230px] flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground" title={course.title}>{course.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{dept?.name} · {course.minutes} min</p></div><div className="shrink-0"><StatusBadge status={course.status} variant={statusVariant(course.status)} /></div></div>{!compact && <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{course.description}</p>}<div className="mt-auto pt-4"><div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{course.progress}% complete</span><span className="shrink-0">{course.progress ? `${Math.max(3, Math.round((100 - course.progress) / 100 * course.minutes))} min left` : `${course.minutes} min`}</span></div><Progress value={course.progress} className="h-2" /></div><div className="mt-4 flex items-center justify-between gap-3"><span className="truncate text-xs text-muted-foreground">Last opened {course.lastOpened ?? "—"}</span><Button asChild size="sm" className="shrink-0"><Link to={`/training/course/${course.id}`}><Play className="mr-1 h-3.5 w-3.5" />{course.progress ? "Continue" : "Start"}</Link></Button></div></div>;
}
function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{text}</div>; }
