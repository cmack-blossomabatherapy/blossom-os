import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, Circle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRbtIdentity } from "../useRbtIdentity";
import { CardFrame } from "../CardFrame";
import { toast } from "sonner";

interface Course {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  external_url?: string | null;
}
interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  lesson_type?: string | null;
  is_required?: boolean | null;
  sort_order?: number | null;
  video_url?: string | null;
  resource_url?: string | null;
  tango_url?: string | null;
  content?: string | null;
}

export function isCoursePublished(c: Course | null): boolean {
  return Boolean(c && c.is_active !== false && c.status !== "draft" && c.status !== "archived");
}

export function canAcknowledge(opts: {
  published: boolean;
  requiredLessonIds: string[];
  completedLessonIds: Set<string>;
  alreadyCompleted: boolean;
  canWrite: boolean;
}): { allowed: boolean; reason?: string } {
  if (opts.alreadyCompleted) return { allowed: false, reason: "already_completed" };
  if (!opts.canWrite) return { allowed: false, reason: "preview" };
  if (!opts.published) return { allowed: false, reason: "unpublished" };
  if (opts.requiredLessonIds.length === 0) return { allowed: false, reason: "no_content" };
  const missing = opts.requiredLessonIds.some((id) => !opts.completedLessonIds.has(id));
  if (missing) return { allowed: false, reason: "incomplete_required" };
  return { allowed: true };
}

export default function RbtCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { authUserId, writableEmployeeId, isPreviewing, loading: idLoading } = useRbtIdentity();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [progress, setProgress] = useState<{ status?: string | null; completed_at?: string | null } | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canWrite = Boolean(writableEmployeeId) && !isPreviewing && Boolean(authUserId);

  async function load() {
    if (!courseId) return;
    setErr(null);
    const [c, l, p] = await Promise.all([
      supabase.from("training_courses").select("id,title,name,description,status,is_active,external_url").eq("id", courseId).maybeSingle(),
      supabase.from("training_lessons").select("id,title,description,lesson_type,is_required,sort_order,video_url,resource_url,tango_url,content").eq("course_id", courseId).order("sort_order"),
      authUserId
        ? supabase.from("user_training_progress").select("status,completed_at").eq("user_id", authUserId).eq("training_id", courseId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (c.error) setErr(c.error.message);
    setCourse((c.data as any) ?? null);
    setLessons(((l.data as any[]) ?? []) as Lesson[]);
    setProgress((p as any).data ?? null);

    if (authUserId) {
      const lessonIds = ((l.data as any[]) ?? []).map((x) => x.id);
      if (lessonIds.length) {
        const { data: lp } = await supabase.from("training_lesson_progress")
          .select("lesson_id,completed")
          .eq("user_id", authUserId)
          .in("lesson_id", lessonIds);
        const map: Record<string, boolean> = {};
        ((lp as any[]) ?? []).forEach((r) => { map[r.lesson_id] = Boolean(r.completed); });
        setLessonProgress(map);
      } else {
        setLessonProgress({});
      }
    }
  }

  useEffect(() => { if (!idLoading) void load(); /* eslint-disable-next-line */ }, [courseId, authUserId, idLoading]);

  const published = isCoursePublished(course);
  const requiredLessons = useMemo(() => (lessons ?? []).filter((x) => x.is_required), [lessons]);
  const completedLessonIds = useMemo(
    () => new Set(Object.entries(lessonProgress).filter(([, v]) => v).map(([k]) => k)),
    [lessonProgress],
  );
  const alreadyCompleted = progress?.status === "completed";
  const ack = canAcknowledge({
    published,
    requiredLessonIds: requiredLessons.map((l) => l.id),
    completedLessonIds,
    alreadyCompleted,
    canWrite,
  });

  async function openLesson(l: Lesson) {
    const url = l.video_url || l.resource_url || l.tango_url;
    if (url) window.open(url, "_blank", "noreferrer");
    if (!canWrite || !authUserId) return;
    // Mark opened as completed (open counts as "reviewed").
    if (lessonProgress[l.id]) return;
    const { error } = await supabase.from("training_lesson_progress")
      .upsert({ user_id: authUserId, lesson_id: l.id, completed: true, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
    if (error) return toast.error(error.message);
    setLessonProgress((m) => ({ ...m, [l.id]: true }));
  }

  async function acknowledgeAndComplete() {
    if (!ack.allowed || !authUserId || !courseId) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("user_training_progress").upsert({
      user_id: authUserId,
      training_id: courseId,
      status: "completed",
      progress_percent: 100,
      completed_at: now,
      updated_at: now,
    }, { onConflict: "user_id,training_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Course marked complete");
    setProgress({ status: "completed", completed_at: now });
  }

  const label = course?.title || course?.name || (courseId ? `Course ${courseId.slice(0, 8)}` : "Course");

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Learn
      </button>

      <CardFrame
        title={label}
        subtitle={course?.description ?? undefined}
        state={err ? "error" : course === null || lessons === null ? "loading" : "success"}
        errorLabel="We couldn't load this course."
      >
        {!published && course && (
          <div className="rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs p-3 flex items-start gap-2">
            <Lock className="h-4 w-4 mt-0.5" />
            <p>
              This course isn't published yet. A coordinator must publish it before you can complete it.
              You can still preview available content below.
            </p>
          </div>
        )}

        {published && lessons && lessons.length === 0 && (
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            No content has been added to this course yet. Completion is disabled until content is published.
          </div>
        )}

        {lessons && lessons.length > 0 && (
          <ul className="mt-3 divide-y divide-border/70 border border-border/70 rounded-2xl bg-card">
            {lessons.map((l) => {
              const done = lessonProgress[l.id];
              const url = l.video_url || l.resource_url || l.tango_url;
              return (
                <li key={l.id} className="p-3 flex items-start gap-3">
                  {done ? <CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {l.title}
                      {l.is_required && <span className="ml-2 text-[10px] uppercase text-amber-700 dark:text-amber-400">Required</span>}
                    </p>
                    {l.description && <p className="text-xs text-muted-foreground mt-0.5">{l.description}</p>}
                  </div>
                  <button
                    onClick={() => openLesson(l)}
                    disabled={!url && !l.content}
                    className="text-xs inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 hover:bg-muted/70 disabled:opacity-50 shrink-0"
                  >
                    {url ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                    {done ? "Reopen" : "Open"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 rounded-2xl bg-muted/50 p-4 space-y-2">
          {alreadyCompleted ? (
            <p className="text-sm text-primary font-medium">
              ✓ Completed {progress?.completed_at ? new Date(progress.completed_at).toLocaleDateString() : ""}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                By acknowledging, you confirm you've reviewed the required content above. This is recorded once.
              </p>
              <button
                onClick={acknowledgeAndComplete}
                disabled={!ack.allowed || saving}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
              >
                {saving
                  ? "Saving…"
                  : ack.reason === "unpublished" ? "Locked — course not published"
                  : ack.reason === "no_content" ? "Locked — no content published"
                  : ack.reason === "incomplete_required" ? "Open all required content first"
                  : ack.reason === "preview" ? "Disabled in preview mode"
                  : "Acknowledge & mark complete"}
              </button>
            </>
          )}
        </div>

        <div className="mt-3 text-center">
          <Link to="/rbt/app/learn" className="text-xs text-muted-foreground underline underline-offset-4">
            ← Back to Learn
          </Link>
        </div>
      </CardFrame>
    </div>
  );
}