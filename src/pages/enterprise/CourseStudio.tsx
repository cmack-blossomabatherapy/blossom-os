import { useState } from "react";
import { Sparkles, FileText, Wand2, Loader2, Plus, Trash2, RefreshCw, Mic, ListChecks, BookOpen, Upload, Video, FileCode2, StickyNote, PlayCircle, ChevronDown, ChevronUp, Check } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ---------- Types ---------- */

type SourceKind = "SOP" | "Tango" | "Loom" | "PDF" | "Video" | "Notes";

interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  meta: string;
  content: string;
}

interface QuizItem {
  question: string;
  choices: string[];
  correctIndex: number;
  rationale: string;
}

interface Module {
  id: string;
  title: string;
  summary: string;
  objectives: string[];
  durationMin: number;
  keyPoints: string[];
  scenarios: { prompt: string; ideal: string }[];
  voiceoverScript: string;
  quiz: QuizItem[];
}

interface Course {
  title: string;
  competency: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tone: string;
  role: string;
  totalMin: number;
  summary: string;
  outcomes: string[];
  modules: Module[];
}

const KIND_ICON: Record<SourceKind, typeof FileText> = {
  SOP: FileText, Tango: FileCode2, Loom: PlayCircle, PDF: Upload, Video: Video, Notes: StickyNote,
};

const SAMPLE_SOURCES: Source[] = [
  { id: "s1", kind: "SOP", title: "Initial VOB Process", meta: "12 steps · 1.4k words", content: "Step 1: Open Solum and select payor. Step 2: Enter subscriber DOB and member ID. Step 3: Attach prescriber referral. Step 4: Submit and wait for VOB result. Common errors: wrong group ID, mismatched address." },
  { id: "s2", kind: "Tango", title: "Adding a Client to CentralReach", meta: "23 steps", content: "Walks through creating the client profile, adding contacts, attaching insurance, scheduling intake assessment, and assigning a BCBA in CentralReach." },
  { id: "s3", kind: "Loom", title: "Scheduling Conflict Walkthrough", meta: "8m 14s", content: "When an RBT calls out: check the float pool, then in-clinic coverage, then offer virtual parent training. Notify family within 30 min and log in scheduling tracker." },
  { id: "s4", kind: "PDF", title: "Authorization Denial Playbook", meta: "9 pages", content: "Resubmit within 1 business day. BCBA must add medical-necessity rationale on clinical denials. Devorah is the escalation owner." },
  { id: "s5", kind: "Video", title: "Parent Intake Call Demo", meta: "12m 02s", content: "Open with empathy, capture diagnosis, current services, geographic constraints, and goals. Confirm next step in writing within 1 hour." },
  { id: "s6", kind: "Notes", title: "QA Review Checklist Notes", meta: "Pasted text", content: "Every session note must include: behavior data, intervention used, parent involvement, response to programming, next session focus." },
];

/* ---------- Page ---------- */

export default function CourseStudio() {
  // Brief
  const [courseTitle, setCourseTitle] = useState("");
  const [competency, setCompetency] = useState("");
  const [role, setRole] = useState("Intake Coordinator");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [tone, setTone] = useState("Warm professional");
  const [moduleCount, setModuleCount] = useState(4);
  const [quizPerModule, setQuizPerModule] = useState(4);
  const [includeVoiceover, setIncludeVoiceover] = useState(true);
  const [includeScenarios, setIncludeScenarios] = useState(true);

  // Sources
  const [sources, setSources] = useState<Source[]>(SAMPLE_SOURCES.slice(0, 3));
  const [newKind, setNewKind] = useState<SourceKind>("SOP");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Output
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  const addSource = () => {
    if (!newTitle.trim()) { toast.error("Source needs a title"); return; }
    const s: Source = {
      id: `s-${Date.now()}`, kind: newKind, title: newTitle.trim(),
      meta: newContent ? `${newContent.length} chars` : "Manual",
      content: newContent.trim(),
    };
    setSources(prev => [...prev, s]);
    setNewTitle(""); setNewContent("");
    toast.success("Source added");
  };

  const removeSource = (id: string) => setSources(prev => prev.filter(s => s.id !== id));

  const generate = async () => {
    if (sources.length === 0) { toast.error("Add at least one source"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-course", {
        body: {
          courseTitle, competency, role, level, tone,
          moduleCount, quizPerModule, includeVoiceover, includeScenarios,
          sources,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCourse((data as any).course as Course);
      setOpenModule((data as any).course?.modules?.[0]?.id ?? null);
      toast.success("Course generated");
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async (moduleId: string, field: "module" | "quiz" | "voiceover" | "objectives", instructions = "") => {
    if (!course) return;
    setRegenId(`${moduleId}:${field}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-course", {
        body: {
          courseTitle: course.title, competency: course.competency, role: course.role,
          level: course.level, tone: course.tone,
          moduleCount: course.modules.length, quizPerModule,
          includeVoiceover, includeScenarios,
          sources,
          regenerateModuleId: moduleId,
          regenerateField: field,
          existingCourse: course,
          instructions,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCourse((data as any).course as Course);
      toast.success(`Regenerated ${field}`);
    } catch (e: any) {
      toast.error(e.message ?? "Regeneration failed");
    } finally {
      setRegenId(null);
    }
  };

  return (
    <GlassPageShell
      eyebrow="Operations Academy"
      eyebrowIcon={Sparkles}
      title="AI Course Studio"
      description="Drop in SOPs, Tango walkthroughs, Loom transcripts, PDFs, videos or notes. Lovable AI drafts modules, quizzes, voiceover scripts, and scenarios — and you can regenerate any piece on demand."
    >
      <div className="grid lg:grid-cols-[420px_1fr] gap-4 pb-20 lg:pb-0">
        {/* ---------------- LEFT: Brief + Sources ---------------- */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" /> Course brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Working title</Label>
                <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="e.g. VOB Mastery — From Lead to Verified" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Competency</Label>
                  <Input value={competency} onChange={(e) => setCompetency(e.target.value)} placeholder="e.g. VOB" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Target role</Label>
                  <Input value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tone</Label>
                  <Input value={tone} onChange={(e) => setTone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Modules</Label>
                  <Input type="number" min={2} max={8} value={moduleCount} onChange={(e) => setModuleCount(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quiz per module</Label>
                  <Input type="number" min={2} max={10} value={quizPerModule} onChange={(e) => setQuizPerModule(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-2.5">
                <div className="text-sm flex items-center gap-2"><Mic className="h-4 w-4 text-primary" /> Voiceover scripts</div>
                <Switch checked={includeVoiceover} onCheckedChange={setIncludeVoiceover} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-2.5">
                <div className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Practice scenarios</div>
                <Switch checked={includeScenarios} onCheckedChange={setIncludeScenarios} />
              </div>
              <Button className="w-full gap-2 h-11 hidden lg:inline-flex" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating course…" : "Generate course"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Sources
                <Badge variant="outline" className="ml-auto text-[10px]">{sources.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="max-h-64 pr-2">
                <div className="space-y-1.5">
                  {sources.map(s => {
                    const Icon = KIND_ICON[s.kind];
                    return (
                      <div key={s.id} className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 p-2.5">
                        <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{s.title}</div>
                          <div className="text-[11px] text-muted-foreground">{s.kind} · {s.meta}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSource(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                  {sources.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">No sources yet.</div>
                  )}
                </div>
              </ScrollArea>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Add a source</Label>
                <div className="grid grid-cols-[110px_1fr] gap-2">
                  <Select value={newKind} onValueChange={(v) => setNewKind(v as SourceKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["SOP","Tango","Loom","PDF","Video","Notes"] as SourceKind[]).map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Source title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <Textarea
                  placeholder="Paste content, transcript, steps, or notes (optional but recommended)"
                  value={newContent} onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[90px] text-sm"
                />
                <Button variant="outline" className="w-full gap-2" onClick={addSource}>
                  <Plus className="h-4 w-4" /> Add source
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------------- RIGHT: Output ---------------- */}
        <div className="space-y-4">
          {!course && !loading && (
            <Card className="border-dashed border-border/50 bg-card/40 backdrop-blur">
              <CardContent className="p-10 text-center space-y-3">
                <Sparkles className="h-10 w-10 text-primary mx-auto" />
                <div className="text-lg font-semibold">Your AI-drafted course will appear here</div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Set the brief, drop in SOPs, Tango walkthroughs, Loom transcripts, PDFs, videos or notes,
                  then generate. Every module ships with objectives, scenarios, a quiz, and a narratable voiceover script.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-border/50 bg-card/60 backdrop-blur">
              <CardContent className="p-10 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
                <div className="text-sm text-muted-foreground">Drafting modules, quizzes and voiceover scripts…</div>
              </CardContent>
            </Card>
          )}

          {course && (
            <>
              <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur overflow-hidden">
                <CardContent className="p-5 md:p-6 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px]">Generated course</Badge>
                      <h2 className="text-2xl font-semibold leading-tight">{course.title}</h2>
                      <div className="text-xs text-muted-foreground">
                        {course.competency} · {course.role} · {course.level} · {course.totalMin} min · {course.modules.length} modules
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={generate} disabled={loading}>
                      <RefreshCw className="h-3.5 w-3.5" /> Regenerate course
                    </Button>
                  </div>
                  {course.summary && <p className="text-sm leading-relaxed">{course.summary}</p>}
                  {course.outcomes?.length > 0 && (
                    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Learning outcomes</div>
                      <ul className="space-y-1">
                        {course.outcomes.map((o, i) => (
                          <li key={i} className="text-sm flex gap-2"><Check className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {course.modules.map((m, idx) => {
                const open = openModule === m.id;
                const busy = (f: string) => regenId === `${m.id}:${f}`;
                return (
                  <Card key={m.id} className="border-border/50 bg-card/60 backdrop-blur">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <button onClick={() => setOpenModule(open ? null : m.id)} className="flex items-start gap-3 text-left flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center shrink-0">{idx + 1}</div>
                          <div className="min-w-0">
                            <div className="font-semibold leading-tight">{m.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {m.durationMin} min · {m.quiz?.length ?? 0} quiz · {m.scenarios?.length ?? 0} scenarios
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => regenerate(m.id, "module")} disabled={!!regenId}>
                            {busy("module") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            Regenerate
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenModule(open ? null : m.id)}>
                            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {open && (
                      <CardContent className="space-y-4 pt-0">
                        {m.summary && <p className="text-sm leading-relaxed">{m.summary}</p>}

                        {/* Objectives */}
                        <Section
                          icon={<ListChecks className="h-4 w-4 text-primary" />}
                          title="Learning objectives"
                          action={
                            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => regenerate(m.id, "objectives")} disabled={!!regenId}>
                              {busy("objectives") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
                            </Button>
                          }
                        >
                          <ul className="space-y-1">
                            {m.objectives?.map((o, i) => (
                              <li key={i} className="text-sm flex gap-2"><Check className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />{o}</li>
                            ))}
                          </ul>
                        </Section>

                        {/* Key points */}
                        {m.keyPoints?.length > 0 && (
                          <Section icon={<BookOpen className="h-4 w-4 text-primary" />} title="Teaching points">
                            <ul className="space-y-1 list-disc list-inside marker:text-primary text-sm">
                              {m.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </Section>
                        )}

                        {/* Scenarios */}
                        {m.scenarios?.length > 0 && (
                          <Section icon={<PlayCircle className="h-4 w-4 text-primary" />} title="Practice scenarios">
                            <div className="space-y-2">
                              {m.scenarios.map((s, i) => (
                                <div key={i} className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm space-y-1">
                                  <div><span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1.5">Prompt</span>{s.prompt}</div>
                                  <div><span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1.5">Ideal</span>{s.ideal}</div>
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}

                        {/* Voiceover */}
                        {m.voiceoverScript && (
                          <Section
                            icon={<Mic className="h-4 w-4 text-primary" />}
                            title="Voiceover script"
                            action={
                              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => regenerate(m.id, "voiceover")} disabled={!!regenId}>
                                {busy("voiceover") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
                              </Button>
                            }
                          >
                            <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                              {m.voiceoverScript}
                            </div>
                          </Section>
                        )}

                        {/* Quiz */}
                        {m.quiz?.length > 0 && (
                          <Section
                            icon={<ListChecks className="h-4 w-4 text-primary" />}
                            title={`Quiz (${m.quiz.length})`}
                            action={
                              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => regenerate(m.id, "quiz")} disabled={!!regenId}>
                                {busy("quiz") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
                              </Button>
                            }
                          >
                            <div className="space-y-3">
                              {m.quiz.map((q, qi) => (
                                <div key={qi} className="rounded-lg border border-border/40 bg-background/40 p-3">
                                  <div className="text-sm font-medium mb-2">{qi + 1}. {q.question}</div>
                                  <div className="grid sm:grid-cols-2 gap-1.5">
                                    {q.choices?.map((c, ci) => (
                                      <div key={ci} className={`rounded-md border px-2.5 py-1.5 text-sm flex items-start gap-2 ${ci === q.correctIndex ? "border-primary/50 bg-primary/10" : "border-border/40 bg-background/40"}`}>
                                        {ci === q.correctIndex && <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />}
                                        <span>{c}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {q.rationale && (
                                    <div className="text-[11px] text-muted-foreground mt-2"><span className="uppercase tracking-wide mr-1">Why</span>{q.rationale}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Mobile sticky generate bar — sits above the bottom tab bar + safe area */}
      <div
        className="fixed left-0 right-0 z-30 lg:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl px-3 py-2"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <Button className="w-full h-12 gap-2 active:scale-[0.99]" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating course…" : course ? "Regenerate course" : "Generate course"}
        </Button>
      </div>
    </GlassPageShell>
  );
}

function Section({ icon, title, action, children }: { icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-2">{icon}{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}