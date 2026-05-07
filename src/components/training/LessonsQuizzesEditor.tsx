import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, Save, FileText, HelpCircle, Loader2, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ingestKnowledge } from "@/lib/knowledgeIngest";

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_type: string;
  content: string;
  resource_url: string | null;
  video_url: string | null;
  tango_url: string | null;
  sort_order: number;
  is_required: boolean;
};

type Quiz = { id: string; course_id: string; title: string; passing_score: number };

type Question = {
  id: string;
  quiz_id: string;
  question: string;
  question_type: string;
  options: string[];
  correct_answer: string | null;
  sort_order: number;
};

const LESSON_TYPES = ["Written SOP", "Video", "Tango Walkthrough", "Reading", "Practice", "Discussion"];

export function LessonsQuizzesEditor({
  course,
  open,
  onOpenChange,
}: {
  course: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState("lessons");

  useEffect(() => {
    if (open && course) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, course?.id]);

  async function load() {
    if (!course) return;
    setLoading(true);
    const [l, q] = await Promise.all([
      supabase.from("training_lessons").select("*").eq("course_id", course.id).order("sort_order"),
      supabase.from("training_quizzes").select("*").eq("course_id", course.id),
    ]);
    setLessons((l.data ?? []) as Lesson[]);
    setQuizzes((q.data ?? []) as Quiz[]);
    if (q.data?.length) {
      const { data: qs } = await supabase
        .from("training_quiz_questions")
        .select("*")
        .in("quiz_id", q.data.map((x: any) => x.id))
        .order("sort_order");
      const grouped: Record<string, Question[]> = {};
      (qs ?? []).forEach((row: any) => {
        const opts = Array.isArray(row.options) ? row.options : [];
        (grouped[row.quiz_id] ||= []).push({ ...row, options: opts });
      });
      setQuestionsByQuiz(grouped);
    } else {
      setQuestionsByQuiz({});
    }
    setLoading(false);
  }

  // ── Lessons
  async function addLesson() {
    if (!course) return;
    const max = lessons.length ? Math.max(...lessons.map((l) => l.sort_order)) : 0;
    const { data, error } = await supabase
      .from("training_lessons")
      .insert({ course_id: course.id, title: "New lesson", lesson_type: "Written SOP", sort_order: max + 1 })
      .select("*")
      .single();
    if (error) { toast.error(error.message); return; }
    setLessons((prev) => [...prev, data as Lesson]);
  }

  async function saveLesson(l: Lesson) {
    setSavingId(l.id);
    const { error } = await supabase
      .from("training_lessons")
      .update({
        title: l.title, description: l.description, lesson_type: l.lesson_type,
        content: l.content, resource_url: l.resource_url, video_url: l.video_url,
        tango_url: l.tango_url, is_required: l.is_required, sort_order: l.sort_order,
      })
      .eq("id", l.id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Lesson saved");
    // Auto-ingest into AI knowledge
    if (l.title.trim() || l.content.trim() || l.description.trim()) {
      void ingestKnowledge({
        source_type: "training_lesson",
        source_id: l.id,
        source_title: `${course?.title ?? ""} — ${l.title}`.trim(),
        source_url: l.resource_url || l.video_url || l.tango_url,
        content: [l.title, l.description, l.content].filter(Boolean).join("\n\n"),
        metadata: { course_id: course?.id, lesson_type: l.lesson_type },
      });
    }
  }

  async function removeLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("training_lessons").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLessons((prev) => prev.filter((x) => x.id !== id));
  }

  function patchLesson(id: string, patch: Partial<Lesson>) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function moveLesson(id: string, dir: -1 | 1) {
    const idx = lessons.findIndex((l) => l.id === id);
    const newIdx = idx + dir;
    if (idx < 0 || newIdx < 0 || newIdx >= lessons.length) return;
    const next = [...lessons];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    const reordered = next.map((l, i) => ({ ...l, sort_order: i + 1 }));
    setLessons(reordered);
    await Promise.all(
      reordered.map((l) => supabase.from("training_lessons").update({ sort_order: l.sort_order }).eq("id", l.id)),
    );
  }

  // ── Quizzes
  async function addQuiz() {
    if (!course) return;
    const { data, error } = await supabase
      .from("training_quizzes")
      .insert({ course_id: course.id, title: "New quiz", passing_score: 80 })
      .select("*").single();
    if (error) { toast.error(error.message); return; }
    setQuizzes((p) => [...p, data as Quiz]);
    setQuestionsByQuiz((p) => ({ ...p, [(data as Quiz).id]: [] }));
  }

  async function saveQuiz(q: Quiz) {
    const { error } = await supabase.from("training_quizzes").update({ title: q.title, passing_score: q.passing_score }).eq("id", q.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Quiz saved");
  }

  async function removeQuiz(id: string) {
    if (!confirm("Delete this quiz and all its questions?")) return;
    const { error } = await supabase.from("training_quizzes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setQuizzes((p) => p.filter((x) => x.id !== id));
    setQuestionsByQuiz((p) => { const n = { ...p }; delete n[id]; return n; });
  }

  function patchQuiz(id: string, patch: Partial<Quiz>) {
    setQuizzes((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  // ── Questions
  async function addQuestion(quizId: string) {
    const arr = questionsByQuiz[quizId] ?? [];
    const max = arr.length ? Math.max(...arr.map((x) => x.sort_order)) : 0;
    const { data, error } = await supabase
      .from("training_quiz_questions")
      .insert({ quiz_id: quizId, question: "New question", question_type: "Multiple choice", options: ["Option A", "Option B"], correct_answer: "Option A", sort_order: max + 1 })
      .select("*").single();
    if (error) { toast.error(error.message); return; }
    setQuestionsByQuiz((p) => ({ ...p, [quizId]: [...(p[quizId] ?? []), { ...(data as any), options: (data as any).options ?? [] }] }));
  }

  async function saveQuestion(q: Question) {
    const { error } = await supabase
      .from("training_quiz_questions")
      .update({ question: q.question, question_type: q.question_type, options: q.options, correct_answer: q.correct_answer, sort_order: q.sort_order })
      .eq("id", q.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Question saved");
  }

  async function removeQuestion(quizId: string, id: string) {
    const { error } = await supabase.from("training_quiz_questions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setQuestionsByQuiz((p) => ({ ...p, [quizId]: (p[quizId] ?? []).filter((x) => x.id !== id) }));
  }

  function patchQuestion(quizId: string, id: string, patch: Partial<Question>) {
    setQuestionsByQuiz((p) => ({
      ...p,
      [quizId]: (p[quizId] ?? []).map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  }

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lessons & Quizzes — {course.title}</DialogTitle>
          <DialogDescription>Build out the lesson sequence and add a knowledge check at the end. Saved lessons auto-feed the AI assistant.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="lessons"><FileText className="h-3.5 w-3.5 mr-1.5" /> Lessons ({lessons.length})</TabsTrigger>
            <TabsTrigger value="quizzes"><HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Quizzes ({quizzes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-3 mt-4">
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && lessons.length === 0 && (
              <p className="rounded-lg border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground">
                No lessons yet. Add one to start building this course.
              </p>
            )}
            {lessons.map((l, i) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-card/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveLesson(l.id, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none">▲</button>
                    <button onClick={() => moveLesson(l.id, 1)} disabled={i === lessons.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none">▼</button>
                  </div>
                  <Badge variant="outline" className="h-5 text-[10px]">#{l.sort_order}</Badge>
                  <Input value={l.title} onChange={(e) => patchLesson(l.id, { title: e.target.value })} className="h-8 flex-1 font-semibold" />
                  <Select value={l.lesson_type} onValueChange={(v) => patchLesson(l.id, { lesson_type: v })}>
                    <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{LESSON_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5">
                    <Switch checked={l.is_required} onCheckedChange={(v) => patchLesson(l.id, { is_required: v })} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Req</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => saveLesson(l)} disabled={savingId === l.id}>
                    {savingId === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeLesson(l.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Textarea rows={2} value={l.description} onChange={(e) => patchLesson(l.id, { description: e.target.value })} placeholder="Short description for the learner…" className="text-xs" />
                <Textarea rows={4} value={l.content} onChange={(e) => patchLesson(l.id, { content: e.target.value })} placeholder="Lesson body / written SOP content (markdown OK)…" className="text-xs font-mono" />
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input value={l.video_url ?? ""} onChange={(e) => patchLesson(l.id, { video_url: e.target.value || null })} placeholder="Video URL" className="h-8 text-xs" />
                  <Input value={l.tango_url ?? ""} onChange={(e) => patchLesson(l.id, { tango_url: e.target.value || null })} placeholder="Tango walkthrough URL" className="h-8 text-xs" />
                  <Input value={l.resource_url ?? ""} onChange={(e) => patchLesson(l.id, { resource_url: e.target.value || null })} placeholder="Resource URL (PDF, doc)" className="h-8 text-xs" />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addLesson}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add lesson</Button>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-3 mt-4">
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
            {!loading && quizzes.length === 0 && (
              <p className="rounded-lg border border-dashed border-border/50 py-6 text-center text-xs text-muted-foreground">
                No quizzes yet. Add a knowledge check to gate completion.
              </p>
            )}
            {quizzes.map((q) => (
              <div key={q.id} className="rounded-xl border border-border/60 bg-card/40 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={q.title} onChange={(e) => patchQuiz(q.id, { title: e.target.value })} className="h-8 flex-1 font-semibold" />
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Pass</Label>
                    <Input type="number" min={0} max={100} value={q.passing_score} onChange={(e) => patchQuiz(q.id, { passing_score: Number(e.target.value) })} className="h-8 w-16 text-xs" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => saveQuiz(q)}><Save className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => removeQuiz(q.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  {(questionsByQuiz[q.id] ?? []).map((qu, idx) => (
                    <div key={qu.id} className="rounded-lg border border-border/50 bg-background/50 p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 text-[10px]">Q{idx + 1}</Badge>
                        <Select value={qu.question_type} onValueChange={(v) => patchQuestion(q.id, qu.id, { question_type: v })}>
                          <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Multiple choice">Multiple choice</SelectItem>
                            <SelectItem value="True/False">True/False</SelectItem>
                            <SelectItem value="Short answer">Short answer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => saveQuestion(qu)}><Save className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id, qu.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Textarea rows={2} value={qu.question} onChange={(e) => patchQuestion(q.id, qu.id, { question: e.target.value })} placeholder="Question text…" className="text-xs" />
                      {qu.question_type !== "Short answer" && (
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Options (correct option must match exactly)</Label>
                          {(qu.question_type === "True/False" ? ["True", "False"] : qu.options).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  if (qu.question_type === "True/False") return;
                                  const next = [...qu.options]; next[optIdx] = e.target.value;
                                  patchQuestion(q.id, qu.id, { options: next });
                                }}
                                disabled={qu.question_type === "True/False"}
                                className="h-7 text-xs flex-1"
                              />
                              <Button
                                size="sm"
                                variant={qu.correct_answer === opt ? "default" : "outline"}
                                onClick={() => patchQuestion(q.id, qu.id, { correct_answer: opt })}
                                className="h-7 text-[10px] px-2"
                              >
                                {qu.correct_answer === opt ? "Correct ✓" : "Mark correct"}
                              </Button>
                              {qu.question_type === "Multiple choice" && (
                                <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => {
                                  const next = qu.options.filter((_, i) => i !== optIdx);
                                  patchQuestion(q.id, qu.id, { options: next });
                                }}><X className="h-3 w-3" /></Button>
                              )}
                            </div>
                          ))}
                          {qu.question_type === "Multiple choice" && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => patchQuestion(q.id, qu.id, { options: [...qu.options, `Option ${String.fromCharCode(65 + qu.options.length)}`] })}>
                              <Plus className="h-3 w-3 mr-1" /> Add option
                            </Button>
                          )}
                        </div>
                      )}
                      {qu.question_type === "Short answer" && (
                        <Input value={qu.correct_answer ?? ""} onChange={(e) => patchQuestion(q.id, qu.id, { correct_answer: e.target.value })} placeholder="Expected answer (case-insensitive match)" className="h-7 text-xs" />
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addQuestion(q.id)}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add question</Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addQuiz}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add quiz</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
