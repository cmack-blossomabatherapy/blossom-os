import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { getStoredTrainingCourses, iconMap, trainingDepartments, trainingPathSteps, TRAINING_UPDATED_EVENT } from "@/data/training";

const statusVariant = (status: string) => status === "Completed" ? "success" : status === "Overdue" ? "destructive" : status === "In Progress" ? "warning" : "muted";

export default function TrainingDepartment() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [trainingCourses, setTrainingCourses] = useState(() => getStoredTrainingCourses());
  useEffect(() => {
    const refresh = () => setTrainingCourses(getStoredTrainingCourses());
    window.addEventListener(TRAINING_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRAINING_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const dept = trainingDepartments.find((d) => d.slug === slug) ?? trainingDepartments[0];
  const Icon = iconMap[dept.icon];
  const courses = trainingCourses.filter((course) => course.departmentId === dept.id);
  const completion = courses.length ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0;
  const requiredCompleted = courses.filter((c) => c.required && c.status === "Completed").length;
  const optionalCompleted = courses.filter((c) => !c.required && c.status === "Completed").length;

  return <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in"><Button variant="ghost" size="sm" asChild><Link to="/training"><ArrowLeft className="mr-2 h-4 w-4" />Training Hub</Link></Button><section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card p-6 shadow-sm md:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center"><div><div className={cn("mb-5 flex h-14 w-14 items-center justify-center rounded-2xl", dept.accent)}><Icon className="h-7 w-7" /></div><h1 className="text-4xl font-semibold tracking-tight text-foreground">{dept.name} Training</h1><p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">{dept.description}</p></div><div className="rounded-2xl border border-border/60 bg-background p-5"><p className="text-sm font-medium text-muted-foreground">Department completion</p><p className="mt-2 text-4xl font-semibold text-foreground">{completion}%</p><Progress value={completion} className="mt-3 h-2" /><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground"><span>Required done: {requiredCompleted}</span><span>Optional done: {optionalCompleted}</span><span>Last activity: Apr 26</span><span>{courses.length} modules</span></div></div></div></section>

  <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold text-foreground">Training Path</h2></div><div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">{trainingPathSteps.map((step, index) => <div key={step} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>{index < Math.round((completion / 100) * trainingPathSteps.length) ? <CheckCircle2 className="h-4 w-4 text-success" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}</div><p className="text-sm font-medium text-foreground">{step}</p></div>)}</div></section>

  <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-foreground">Training Cards</h2><span className="text-sm text-muted-foreground">{courses.length} trainings</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <div key={course.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{course.title}</h3><p className="mt-1 text-xs text-muted-foreground">{course.type} · {course.minutes} min · {course.difficulty}</p></div><StatusBadge status={course.status} variant={statusVariant(course.status)} /></div><p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{course.description}</p><div className="mt-4"><div className="mb-1 flex items-center justify-between text-xs text-muted-foreground"><span>Progress</span><span>{course.progress}%</span></div><Progress value={course.progress} className="h-2" /></div><Button className="mt-4 w-full" onClick={() => navigate(`/training/course/${course.id}`)}><PlayCircle className="mr-2 h-4 w-4" />Open</Button></div>)}</div>{courses.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">This department does not have many trainings yet. Add SOPs, videos, Tangos, or checklists as they are created.</div>}</section>

  <section className="grid gap-5 xl:grid-cols-[1fr_0.75fr]"><div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold text-foreground">Resources</h2></div><div className="grid gap-3 md:grid-cols-2">{["SOP files", "Tango links", "Checklists", "Templates", "Videos placeholder", "Related policies"].map((resource) => <div key={resource} className="rounded-xl border border-border/60 bg-background p-4"><p className="font-medium text-foreground">{resource}</p><p className="mt-1 text-xs text-muted-foreground">Connected resource placeholder for {dept.shortName} training.</p></div>)}</div></div><div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold text-foreground">Completion Summary</h2></div><div className="space-y-3">{[["User completion", `${completion}%`], ["Required modules completed", `${requiredCompleted}/${courses.filter((c) => c.required).length}`], ["Optional modules completed", `${optionalCompleted}/${courses.filter((c) => !c.required).length}`], ["Last activity", "Apr 26, 2026"]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3"><span className="text-sm text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>)}</div></div></section></div>;
}
