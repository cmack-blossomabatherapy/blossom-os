import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Award, CheckCircle2, Clock, ExternalLink, FileText, HelpCircle, LinkIcon, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { getStoredTrainingCourses, trainingDepartments, TRAINING_UPDATED_EVENT, type TrainingLesson } from "@/data/training";

const toTangoEmbedUrl = (url?: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("tango.us")) return url;
    if (parsed.pathname.includes("/embed/")) return url;
    parsed.pathname = parsed.pathname.replace("/app/workflow/", "/embed/workflow/");
    return parsed.toString();
  } catch {
    return url;
  }
};

const openResource = (url?: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const TRAINING_CHECKLIST_STORAGE_KEY = "blossom-training-checklist-completions";
const defaultChecklistItems = ["Review the SOP", "Confirm required fields", "Identify the owner", "Document blockers", "Complete knowledge check"];

const checklistKey = (courseId?: string, lessonId?: string) => courseId && lessonId ? `${courseId}:${lessonId}` : "";
const getStoredChecklistMap = (): Record<string, string[]> => {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(TRAINING_CHECKLIST_STORAGE_KEY) || "{}"); } catch { return {}; }
};
const getStoredChecklistItems = (courseId?: string, lessonId?: string) => new Set(getStoredChecklistMap()[checklistKey(courseId, lessonId)] ?? []);
const saveStoredChecklistItems = (courseId: string, lessonId: string, items: Set<string>) => {
  const stored = getStoredChecklistMap();
  stored[checklistKey(courseId, lessonId)] = [...items];
  window.localStorage.setItem(TRAINING_CHECKLIST_STORAGE_KEY, JSON.stringify(stored));
};

function LessonEmbed({ lesson }: { lesson: TrainingLesson }) {
  if (lesson.tangoUrl) {
    return <div className="bg-background"><iframe title={lesson.title} src={toTangoEmbedUrl(lesson.tangoUrl)} className="h-[420px] w-full border-0" allow="fullscreen" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>;
  }
  if (lesson.resourceUrl) {
    return <div className="flex min-h-[260px] items-center justify-center bg-muted/40 p-8 text-center"><div><FileText className="mx-auto h-14 w-14 text-primary" /><h2 className="mt-4 text-xl font-semibold text-foreground">Resource attached</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Open the linked resource to view or download it.</p><Button className="mt-4" variant="outline" onClick={() => openResource(lesson.resourceUrl)}><ExternalLink className="mr-2 h-4 w-4" />Open resource</Button></div></div>;
  }
  return <div className="flex min-h-[260px] items-center justify-center bg-muted/40 p-8 text-center"><div><PlayCircle className="mx-auto h-14 w-14 text-primary" /><h2 className="mt-4 text-xl font-semibold text-foreground">Training content</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Review the written content below, then mark the lesson complete.</p></div></div>;
}

export default function TrainingCourse() {
  const { courseId } = useParams();
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
  const course = trainingCourses.find((c) => c.id === courseId);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(course?.lessons.filter((l) => l.completed).map((l) => l.id) ?? []));
  const [activeLessonId, setActiveLessonId] = useState(course?.lessons[0]?.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(course?.quizScore ?? null);
  const [checkedChecklist, setCheckedChecklist] = useState<Set<string>>(() => getStoredChecklistItems(course?.id, course?.lessons[0]?.id));

  useEffect(() => {
    setCompleted(new Set(course?.lessons.filter((l) => l.completed).map((l) => l.id) ?? []));
    setActiveLessonId(course?.lessons[0]?.id);
    setAnswers({});
    setScore(course?.quizScore ?? null);
  }, [course]);

  useEffect(() => {
    setCheckedChecklist(getStoredChecklistItems(course?.id, activeLessonId));
  }, [course?.id, activeLessonId]);

  if (!course) return <Navigate to="/training" replace />;
  const dept = trainingDepartments.find((d) => d.id === course.departmentId)!;
  const activeLesson = course.lessons.find((lesson) => lesson.id === activeLessonId) ?? course.lessons[0];
  const checklistItems = course.completionChecklist?.length ? course.completionChecklist.map((item) => item.label) : defaultChecklistItems;
  const progress = course.lessons.length ? Math.round((completed.size / course.lessons.length) * 100) : 0;
  const markComplete = () => { setCompleted((current) => new Set([...current, activeLesson.id])); toast.success("Lesson marked complete"); };
  const submitQuiz = () => { if (!course.quiz) return; const correct = course.quiz.questions.filter((q) => (answers[q.id] ?? "").toLowerCase().trim() === q.answer.toLowerCase().trim()).length; const next = Math.round((correct / course.quiz.questions.length) * 100); setScore(next); toast[next >= course.quiz.passingScore ? "success" : "error"](next >= course.quiz.passingScore ? "Quiz passed" : "Quiz needs a retake"); };
  const toggleChecklistItem = (item: string, checked: boolean) => setCheckedChecklist((current) => { const next = new Set(current); checked ? next.add(item) : next.delete(item); saveStoredChecklistItems(course.id, activeLesson.id, next); return next; });

  return <div className="-m-6 grid min-h-[calc(100vh-3.5rem)] bg-background lg:grid-cols-[280px_1fr_320px]"><aside className="border-r border-border/60 bg-card p-4"><Button variant="ghost" size="sm" asChild className="mb-4"><Link to={`/training/department/${dept.slug}`}><ArrowLeft className="mr-2 h-4 w-4" />{dept.shortName}</Link></Button><h2 className="text-lg font-semibold text-foreground">Module outline</h2><p className="mt-1 text-xs text-muted-foreground">{course.lessons.length} lessons · {course.minutes} minutes</p><div className="mt-5 space-y-2">{course.lessons.map((lesson, index) => <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)} className={cn("w-full rounded-xl border p-3 text-left transition-colors", activeLesson.id === lesson.id ? "border-primary/40 bg-primary/10" : "border-border/60 bg-background hover:bg-muted/30")}><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">Lesson {index + 1}</span>{completed.has(lesson.id) ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="h-4 w-4 rounded-full border border-border" />}</div><p className="mt-1 text-sm font-medium text-foreground">{lesson.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{lesson.type} · {lesson.minutes} min</p></button>)}</div></aside><main className="overflow-y-auto p-5 md:p-8"><div className="mx-auto max-w-4xl space-y-5"><div><p className="text-sm font-medium text-primary">{dept.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{course.title}</h1><p className="mt-2 text-muted-foreground">{course.description}</p></div><section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"><LessonEmbed lesson={activeLesson} /><div className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-foreground">{activeLesson.title}</h2><p className="mt-1 text-sm text-muted-foreground">{activeLesson.description}</p></div><StatusBadge status={activeLesson.type} variant="info" /></div><Tabs defaultValue="content" className="mt-5"><TabsList><TabsTrigger value="content">Content</TabsTrigger><TabsTrigger value="checklist">Checklist</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="quiz">Quiz</TabsTrigger></TabsList><TabsContent value="content" className="space-y-4 pt-4"><div className="rounded-xl border border-border/60 bg-background p-4"><p className="whitespace-pre-line text-sm leading-6 text-foreground">{activeLesson.content}</p></div><div className="flex flex-wrap gap-2">{(activeLesson.resourceUrl || activeLesson.tangoUrl) && <Button variant="outline" onClick={() => openResource(activeLesson.resourceUrl || activeLesson.tangoUrl)}><ExternalLink className="mr-2 h-4 w-4" />Open resource</Button>}{activeLesson.tangoUrl && <Button variant="outline" onClick={() => openResource(activeLesson.tangoUrl)}><LinkIcon className="mr-2 h-4 w-4" />Open Tango</Button>}</div></TabsContent><TabsContent value="checklist" className="space-y-2 pt-4">{["Review the SOP", "Confirm required fields", "Identify the owner", "Document blockers", "Complete knowledge check"].map((item) => <label key={item} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3 text-sm"><input type="checkbox" className="h-4 w-4" />{item}</label>)}</TabsContent><TabsContent value="notes" className="pt-4"><Textarea rows={7} placeholder="Write private notes for this training..." /></TabsContent><TabsContent value="quiz" className="space-y-4 pt-4">{course.quiz?.questions.map((q) => <div key={q.id} className="rounded-xl border border-border/60 bg-background p-4"><p className="font-medium text-foreground">{q.question}</p>{q.options ? <div className="mt-3 grid gap-2">{q.options.map((option) => <button key={option} onClick={() => setAnswers((a) => ({ ...a, [q.id]: option }))} className={cn("rounded-lg border px-3 py-2 text-left text-sm", answers[q.id] === option ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/30")}>{option}</button>)}</div> : <Textarea className="mt-3" onChange={(event) => setAnswers((a) => ({ ...a, [q.id]: event.target.value }))} placeholder="Short answer placeholder" />}</div>)}<div className="flex items-center gap-3"><Button onClick={submitQuiz}>Submit quiz</Button>{score !== null && <StatusBadge status={`Score ${score}% · ${score >= (course.quiz?.passingScore ?? 80) ? "Pass" : "Fail"}`} variant={score >= (course.quiz?.passingScore ?? 80) ? "success" : "destructive"} />}<Button variant="outline" onClick={() => { setAnswers({}); setScore(null); }}>Retake</Button></div></TabsContent></Tabs><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4"><p className="text-sm text-muted-foreground">Passing score: {course.quiz?.passingScore ?? 80}%</p><Button onClick={markComplete}><CheckCircle2 className="mr-2 h-4 w-4" />Mark lesson complete</Button></div></div></section></div></main><aside className="border-l border-border/60 bg-card p-4"><h2 className="text-lg font-semibold text-foreground">Progress tracker</h2><div className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-center"><div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-primary/20"><span className="text-2xl font-semibold text-foreground">{progress}%</span></div><p className="mt-3 text-sm text-muted-foreground">{completed.size}/{course.lessons.length} lessons complete</p>{progress === 100 && <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-warning"><Award className="mx-auto h-5 w-5" /><p className="mt-1 text-xs font-medium">Completion badge earned</p></div>}</div><div className="mt-4 space-y-3">{[["Estimated time", `${course.minutes} minutes`, Clock], ["Department owner", course.owner, HelpCircle], ["Related resources", `${course.resources.length} resources`, FileText]].map(([label, value, Icon]) => <div key={label as string} className="rounded-xl border border-border/60 bg-background p-3"><Icon className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">{label as string}</p><p className="text-sm font-medium text-foreground">{value as string}</p></div>)}</div><div className="mt-4 rounded-xl border border-border/60 bg-background p-3"><p className="text-sm font-semibold text-foreground">Help contact</p><p className="mt-1 text-xs text-muted-foreground">Ask {course.owner} for help with this module.</p></div></aside></div>;
}
