import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, Bot, Download, ExternalLink, FileText, Gauge, ListChecks, Plus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { ROLE_META, roleLabel, type AppRole } from "@/lib/roles";
import { createTrainingCourse, trainingDepartments, type Difficulty, type TrainingCourse, type TrainingLesson, type TrainingType } from "@/data/training";
import { supabase } from "@/integrations/supabase/client";

const builderSteps = ["Basics", "Objectives", "SOP", "Tango", "Steps", "Blocks", "Checklist", "Mistakes", "Quiz", "Badge", "Assignment", "Preview"];
const trainingTypes: TrainingType[] = ["Workflow", "SOP", "System Training", "Policy", "Onboarding", "Clinical", "Tango", "Checklist", "Quiz", "Video"];
const difficultyLevels: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const systems = ["Blossom OS", "Monday", "CentralReach", "Viventium", "SharePoint", "Email", "Phone"];
const templates = [
  { name: "Workflow Training Template", type: "Workflow" as TrainingType, blocks: ["Why this workflow matters", "Where the work starts", "Required handoff standard"] },
  { name: "SOP Training Template", type: "SOP" as TrainingType, blocks: ["Purpose", "Standard operating procedure", "Quality checks"] },
  { name: "System Training Template", type: "Tango" as TrainingType, blocks: ["System overview", "Walkthrough", "Practice task"] },
  { name: "Onboarding Training Template", type: "Workflow" as TrainingType, blocks: ["Welcome context", "First-week expectations", "Readiness checklist"] },
];

type BuilderStatus = "draft" | "published";
type ContentBlock = { id: string; type: string; title: string; body: string; url?: string };
type TrainingStep = { id: string; title: string; description: string; imagePlaceholder?: string; tangoReference?: string; systemTag?: string };
type ChecklistItem = { id: string; label: string; required: boolean };
type MistakeItem = { id: string; error: string; consequence: string; avoid: string };
type QuizQuestion = { id: string; type: "Multiple choice" | "True / false"; question: string; options: string[]; answer: string; explanation: string };
type WalkthroughLink = { id: string; url: string; label: string };
type AiSourceType = "tango" | "upload" | "paste" | "combined";
type QuizComplexity = "easy" | "medium" | "hard";
type AiDraft = { title: string; description: string; departmentId: string; difficulty: Difficulty; type: TrainingType; minutes: number; objectives: string[]; sop: { title?: string; content?: string }; walkthrough?: { url?: string; label?: string; summary?: string }; steps: Array<{ title?: string; description?: string; systemTag?: string }>; checklist: string[]; commonMistakes: Array<{ error?: string; consequence?: string; avoid?: string }>; quiz: Array<{ type?: "Multiple choice" | "True / false"; question?: string; options?: string[]; answer?: string; explanation?: string }>; badge?: { title?: string; description?: string }; qualityScore?: number };

const quizComplexities: QuizComplexity[] = ["easy", "medium", "hard"];
const quizComplexityDefaultKey = "blossom.trainingBuilder.quizComplexityDefault";
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const getSavedQuizComplexity = (): QuizComplexity => {
  if (typeof window === "undefined") return "medium";
  const saved = window.localStorage.getItem(quizComplexityDefaultKey);
  return quizComplexities.includes(saved as QuizComplexity) ? saved as QuizComplexity : "medium";
};
const downloadResource = (url: string, name: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name || "training-resource";
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
};

interface BuilderDraft {
  title: string;
  description: string;
  departmentId: string;
  roleVisibility: AppRole[];
  required: boolean;
  minutes: number;
  difficulty: Difficulty;
  type: TrainingType;
  objectives: string[];
  sopTitle: string;
  sopContent: string;
  sopFileName: string;
  sopFileUrl: string;
  sopAsMain: boolean;
  walkthroughs: WalkthroughLink[];
  steps: TrainingStep[];
  blocks: ContentBlock[];
  checklist: ChecklistItem[];
  mistakes: MistakeItem[];
  quizEnabled: boolean;
  passingScore: number;
  allowRetake: boolean;
  quiz: QuizQuestion[];
  badgeTitle: string;
  badgeDescription: string;
  awardBadge: boolean;
  assignRole: string;
  assignDepartment: string;
  assignIndividual: string;
  dueDate: string;
  reminder: boolean;
  status: BuilderStatus;
  owner: string;
  templateName?: string;
}

const emptyDraft = (): BuilderDraft => ({
  title: "",
  description: "",
  departmentId: trainingDepartments[0].id,
  roleVisibility: [],
  required: true,
  minutes: 30,
  difficulty: "Beginner",
  type: "Workflow",
  objectives: [""],
  sopTitle: "",
  sopContent: "",
  sopFileName: "",
  sopFileUrl: "",
  sopAsMain: true,
  walkthroughs: [{ id: uid("tango"), url: "", label: "Open Walkthrough" }],
  steps: [{ id: uid("step"), title: "", description: "", systemTag: "Blossom OS" }],
  blocks: [],
  checklist: [{ id: uid("check"), label: "", required: true }],
  mistakes: [{ id: uid("mistake"), error: "", consequence: "", avoid: "" }],
  quizEnabled: false,
  passingScore: 80,
  allowRetake: true,
  quiz: [],
  badgeTitle: "",
  badgeDescription: "",
  awardBadge: false,
  assignRole: "All",
  assignDepartment: "All",
  assignIndividual: "",
  dueDate: "",
  reminder: true,
  status: "draft",
  owner: "Training Admin",
});

const draftFromCourse = (course: TrainingCourse): BuilderDraft => ({
  ...emptyDraft(),
  title: course.title,
  description: course.description,
  departmentId: course.departmentId,
  roleVisibility: course.roleVisibility as AppRole[],
  required: course.required,
  minutes: course.minutes,
  difficulty: course.difficulty,
  type: course.type,
  dueDate: course.dueDate ?? "",
  owner: course.owner,
  objectives: course.objectives?.length ? course.objectives : [""],
  sopTitle: course.sop?.title ?? "",
  sopContent: course.sop?.content ?? "",
  sopFileName: course.sop?.fileName ?? "",
  sopFileUrl: course.sop?.fileUrl ?? "",
  sopAsMain: course.sop?.useAsMainContent ?? true,
  walkthroughs: course.walkthroughs?.length ? course.walkthroughs : [{ id: uid("tango"), url: "", label: "Open Walkthrough" }],
  steps: course.trainingSteps?.length ? course.trainingSteps : [{ id: uid("step"), title: "", description: "", systemTag: "Blossom OS" }],
  blocks: course.contentBlocks ?? [],
  checklist: course.completionChecklist?.length ? course.completionChecklist : [{ id: uid("check"), label: "", required: true }],
  mistakes: course.commonMistakes?.length ? course.commonMistakes : [{ id: uid("mistake"), error: "", consequence: "", avoid: "" }],
  quizEnabled: Boolean(course.quiz?.questions?.length),
  passingScore: course.quiz?.passingScore ?? 80,
  quiz: (course.quiz?.questions ?? []).map((q) => ({ id: q.id, type: q.type === "True / false" ? "True / false" : "Multiple choice", question: q.question, options: q.options ?? ["", ""], answer: q.answer, explanation: q.explanation ?? "" })),
  badgeTitle: course.badge?.title ?? "",
  badgeDescription: course.badge?.description ?? "",
  awardBadge: course.badge?.awardOnCompletion ?? false,
  assignRole: course.assignmentSettings?.role ?? "All",
  assignDepartment: course.assignmentSettings?.department ?? "All",
  assignIndividual: course.assignmentSettings?.individual ?? "",
  reminder: course.assignmentSettings?.reminder ?? true,
  status: course.published ? "published" : "draft",
  templateName: course.templateName,
});

export function TrainingBuilderDialog({ open, onOpenChange, onSubmit, course, courses = [] }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (course: TrainingCourse) => void; course?: TrainingCourse; courses?: TrainingCourse[] }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BuilderDraft>(() => emptyDraft());
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSource, setAiSource] = useState<AiSourceType>("tango");
  const [aiTangoUrl, setAiTangoUrl] = useState("");
  const [aiSopText, setAiSopText] = useState("");
  const [aiFileName, setAiFileName] = useState("");
  const [aiQuizComplexity, setAiQuizComplexity] = useState<QuizComplexity>(() => getSavedQuizComplexity());
  const [aiQuizQuestionCount, setAiQuizQuestionCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sectionGenerating, setSectionGenerating] = useState<"sop" | "steps" | "quiz" | null>(null);
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDraft(course ? draftFromCourse(course) : emptyDraft());
  }, [course, open]);

  useEffect(() => {
    window.localStorage.setItem(quizComplexityDefaultKey, aiQuizComplexity);
  }, [aiQuizComplexity]);

  const quality = useMemo(() => getQualityScore(draft), [draft]);
  const blockers = useMemo(() => getPublishBlockers(draft), [draft]);
  const suggested = suggestionsForDepartment(draft.departmentId);

  const patch = <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setList = <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const generateWithAi = async () => {
    const body = { sourceType: aiSource, tangoUrl: aiTangoUrl.trim(), sopText: aiSopText.trim(), fileName: aiFileName, quizComplexity: aiQuizComplexity, quizQuestionCount: aiQuizQuestionCount };
    if (aiSource === "combined" && (!body.tangoUrl || !body.sopText)) return toast.error("Add both a Tango link and SOP content first");
    if (aiSource === "tango" && !body.tangoUrl) return toast.error("Add a Tango link first");
    if ((aiSource === "upload" || aiSource === "paste") && !body.sopText) return toast.error("Add SOP text first");
    setAiGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-training-draft", { body });
    setAiGenerating(false);
    if (error) return toast.error(error.message || "AI training generation failed");
    setAiDraft(data?.draft as AiDraft);
    toast.success("AI training draft generated");
  };

  const acceptAiDraft = () => {
    if (!aiDraft) return;
    setDraft((current) => ({
      ...current,
      title: aiDraft.title || current.title,
      description: aiDraft.description || current.description,
      departmentId: aiDraft.departmentId || current.departmentId,
      difficulty: aiDraft.difficulty || current.difficulty,
      type: aiDraft.type || current.type,
      minutes: aiDraft.minutes || current.minutes,
      objectives: aiDraft.objectives?.length ? aiDraft.objectives : current.objectives,
      sopTitle: aiDraft.sop?.title || aiDraft.title || current.sopTitle,
      sopContent: aiDraft.sop?.content || current.sopContent,
      sopFileName: aiFileName || current.sopFileName,
      walkthroughs: aiDraft.walkthrough?.url ? [{ id: uid("tango"), url: aiDraft.walkthrough.url, label: aiDraft.walkthrough.label || "Open Walkthrough" }] : current.walkthroughs,
      steps: aiDraft.steps?.length ? aiDraft.steps.map((item) => ({ id: uid("step"), title: item.title ?? "", description: item.description ?? "", systemTag: item.systemTag || "Blossom OS" })) : current.steps,
      checklist: aiDraft.checklist?.length ? aiDraft.checklist.map((label) => ({ id: uid("check"), label, required: true })) : current.checklist,
      mistakes: aiDraft.commonMistakes?.length ? aiDraft.commonMistakes.map((item) => ({ id: uid("mistake"), error: item.error ?? "", consequence: item.consequence ?? "", avoid: item.avoid ?? "" })) : current.mistakes,
      quizEnabled: Boolean(aiDraft.quiz?.length),
      quiz: aiDraft.quiz?.length ? aiDraft.quiz.map((item) => ({ id: uid("quiz"), type: item.type === "True / false" ? "True / false" : "Multiple choice", question: item.question ?? "", options: item.options?.length ? item.options : ["True", "False"], answer: item.answer ?? "", explanation: item.explanation ?? "" })) : current.quiz,
      badgeTitle: aiDraft.badge?.title || current.badgeTitle,
      badgeDescription: aiDraft.badge?.description || current.badgeDescription,
      awardBadge: Boolean(aiDraft.badge?.title) || current.awardBadge,
      templateName: "AI-generated training draft",
    }));
    setStep(11);
    setAiOpen(false);
    toast.success("AI draft loaded into the editable builder");
  };

  const regenerateSection = async (sectionMode: "sop" | "steps" | "quiz") => {
    const sopText = draft.sopContent.trim() || aiSopText.trim() || draft.steps.map((item) => `${item.title}: ${item.description}`).join("\n");
    const tangoUrl = draft.walkthroughs.find((item) => item.url.trim())?.url ?? aiTangoUrl.trim();
    setSectionGenerating(sectionMode);
    const { data, error } = await supabase.functions.invoke("generate-training-draft", {
      body: {
        sourceType: tangoUrl ? "tango" : "paste",
        tangoUrl,
        sopText,
        fileName: draft.sopFileName || aiFileName,
        quizComplexity: aiQuizComplexity,
        quizQuestionCount: aiQuizQuestionCount,
        sectionMode,
        currentDraft: draft,
      },
    });
    setSectionGenerating(null);
    if (error) return toast.error(error.message || `Could not regenerate ${sectionMode}`);
    applyAiSection(sectionMode, data?.draft as AiDraft);
  };

  const applyAiSection = (sectionMode: "sop" | "steps" | "quiz", nextDraft: AiDraft) => {
    setDraft((current) => {
      if (sectionMode === "sop") return { ...current, sopTitle: nextDraft.sop?.title || current.sopTitle, sopContent: nextDraft.sop?.content || current.sopContent };
      if (sectionMode === "steps") return { ...current, steps: nextDraft.steps?.length ? nextDraft.steps.map((item) => ({ id: uid("step"), title: item.title ?? "", description: item.description ?? "", systemTag: item.systemTag || "Blossom OS" })) : current.steps };
      return { ...current, quizEnabled: true, quiz: nextDraft.quiz?.length ? nextDraft.quiz.map((item) => ({ id: uid("quiz"), type: item.type === "True / false" ? "True / false" : "Multiple choice", question: item.question ?? "", options: item.options?.length ? item.options : ["True", "False"], answer: item.answer ?? "", explanation: item.explanation ?? "" })) : current.quiz };
    });
    toast.success(`${sectionMode === "sop" ? "SOP" : sectionMode === "steps" ? "Steps" : "Quiz"} regenerated without changing the rest`);
  };

  const applyTemplate = (name: string) => {
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    setDraft((current) => ({
      ...current,
      templateName: template.name,
      type: template.type,
      blocks: template.blocks.map((title) => ({ id: uid("block"), type: "Text explanation", title, body: "" })),
    }));
  };

  const duplicateCourse = (id: string) => {
    const source = courses.find((item) => item.id === id);
    if (!source) return;
    setDraft({ ...draftFromCourse(source), title: `${source.title} Copy`, status: "draft" });
  };

  const autoFormatSop = () => {
    const raw = draft.sopContent.trim();
    if (!raw) return toast.error("Paste SOP content first");
    const formatted = [
      "Purpose\n" + firstSentence(raw),
      "When used\nUse this training whenever the workflow is assigned, audited, or handed off.",
      `Systems required\n${suggested.systems.join(", ")}`,
      "Step-by-step instructions\n" + raw.split(/\n+/).filter(Boolean).map((line, index) => `${index + 1}. ${line.replace(/^[-•\d.\s]+/, "")}`).join("\n"),
      "Expected outcome\nThe learner can complete the workflow consistently and document the correct result.",
      "Common mistakes\nMissing required fields, skipping verification, and moving work forward without a clear owner.",
    ].join("\n\n");
    patch("sopContent", formatted);
    toast.success("SOP formatted into the Blossom training structure");
  };

  const submit = (status: BuilderStatus) => {
    if (!draft.title.trim() || !draft.description.trim()) return toast.error("Add training basics before saving");
    if (status === "published" && blockers.length) return toast.error(`Cannot publish: ${blockers[0]}`);
    const base = course ? { ...course } : createTrainingCourse({ departmentId: draft.departmentId, title: draft.title, description: draft.description, type: draft.type, difficulty: draft.difficulty, minutes: draft.minutes, required: draft.required, dueDate: draft.dueDate, requiredBy: draft.roleVisibility.length ? "Assigned roles" : undefined, roleVisibility: draft.roleVisibility, owner: draft.owner, resources: collectResources(draft) });
    const next: TrainingCourse = {
      ...base,
      title: draft.title.trim(),
      description: draft.description.trim(),
      departmentId: draft.departmentId,
      type: draft.type,
      difficulty: draft.difficulty,
      minutes: draft.minutes,
      required: draft.required,
      dueDate: draft.dueDate || undefined,
      requiredBy: draft.roleVisibility.length ? "Assigned roles" : undefined,
      roleVisibility: draft.roleVisibility,
      owner: draft.owner.trim() || "Training Admin",
      resources: collectResources(draft),
      lessons: makeLessonsFromDraft(base.id, draft),
      quiz: draft.quizEnabled ? { passingScore: draft.passingScore, allowRetake: draft.allowRetake, questions: draft.quiz.filter((q) => q.question.trim()).map((q) => ({ id: q.id, type: q.type, question: q.question.trim(), options: q.options.filter(Boolean), answer: q.answer, explanation: q.explanation })) } : undefined,
      objectives: draft.objectives.map((item) => item.trim()).filter(Boolean),
      sop: { title: draft.sopTitle.trim(), content: draft.sopContent.trim(), fileName: draft.sopFileName || undefined, fileUrl: draft.sopFileUrl || undefined, useAsMainContent: draft.sopAsMain },
      walkthroughs: draft.walkthroughs.filter((item) => item.url.trim()).map((item) => ({ ...item, url: item.url.trim(), label: item.label.trim() || "Open Walkthrough" })),
      trainingSteps: draft.steps.filter((item) => item.title.trim() || item.description.trim()),
      contentBlocks: draft.blocks.filter((item) => item.title.trim() || item.body.trim() || item.url?.trim()),
      completionChecklist: draft.checklist.filter((item) => item.label.trim()),
      commonMistakes: draft.mistakes.filter((item) => item.error.trim() || item.consequence.trim() || item.avoid.trim()),
      badge: { title: draft.badgeTitle.trim(), description: draft.badgeDescription.trim(), awardOnCompletion: draft.awardBadge },
      assignmentSettings: { role: draft.assignRole, department: draft.assignDepartment, individual: draft.assignIndividual, dueDate: draft.dueDate, required: draft.required, reminder: draft.reminder },
      qualityScore: quality,
      published: status === "published",
      templateName: draft.templateName,
      builderVersion: (course?.builderVersion ?? 0) + (course ? 1 : 1),
      updatedAt: new Date().toISOString(),
    };
    onSubmit(next);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{course ? "Edit Training Builder" : "Create Training Builder"}</DialogTitle></DialogHeader>
    <div className="space-y-5">
      {!course && <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div><div><p className="font-semibold text-primary">Generate Training with AI</p><p className="text-sm text-primary/80">Drop in a Tango link, SOP text, or both together and get a structured draft in seconds.</p></div></div><Button onClick={() => setAiOpen(true)}><Sparkles className="mr-2 h-4 w-4" />Generate Training with AI</Button></div></div>}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" /><div><p className="font-semibold text-foreground">Training Quality Score: {quality}% ({qualityLabel(quality)})</p><p className="text-xs text-muted-foreground">SOP, Tango, steps, checklist, quiz, and common mistakes raise readiness.</p></div></div><StatusBadge status={`Step ${step + 1} of ${builderSteps.length}`} variant="info" /></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background p-3"><span className="text-xs font-medium text-muted-foreground">Regenerate only</span>{(["sop", "steps", "quiz"] as const).map((sectionMode) => <Button key={sectionMode} size="sm" variant="outline" onClick={() => regenerateSection(sectionMode)} disabled={Boolean(sectionGenerating)}>{sectionGenerating === sectionMode ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}{sectionMode === "sop" ? "SOP section" : sectionMode === "steps" ? "Steps" : "Quiz"}</Button>)}</div>
        <Progress value={quality} className="mt-3 h-2" />
        <div className="mt-4 grid gap-2 md:grid-cols-6 xl:grid-cols-12">{builderSteps.map((label, index) => <button key={label} onClick={() => setStep(index)} className={cn("rounded-lg border px-2 py-2 text-xs transition-colors", index === step ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40")}>{index + 1}. {label}</button>)}</div>
      </div>

      {step === 0 && <BasicsStep draft={draft} patch={patch} applyTemplate={applyTemplate} duplicateCourse={duplicateCourse} courses={courses} />}
      {step === 1 && <ListStep title="Learning objectives" intro="By the end of this training, the user will be able to:" values={draft.objectives} onChange={(values) => setList("objectives", values)} placeholder="Understand the intake workflow" />}
      {step === 2 && <SopStep draft={draft} patch={patch} autoFormatSop={autoFormatSop} />}
      {step === 3 && <WalkthroughStep items={draft.walkthroughs} onChange={(items) => setList("walkthroughs", items)} />}
      {step === 4 && <StepsStep items={draft.steps} onChange={(items) => setList("steps", items)} suggested={suggested.steps} />}
      {step === 5 && <BlocksStep items={draft.blocks} onChange={(items) => setList("blocks", items)} />}
      {step === 6 && <ChecklistStep items={draft.checklist} onChange={(items) => setList("checklist", items)} requiredForWorkflow={draft.type === "Workflow"} />}
      {step === 7 && <MistakesStep items={draft.mistakes} onChange={(items) => setList("mistakes", items)} />}
      {step === 8 && <QuizStep draft={draft} patch={patch} />}
      {step === 9 && <BadgeStep draft={draft} patch={patch} />}
      {step === 10 && <AssignmentStep draft={draft} patch={patch} />}
      {step === 11 && <PreviewStep draft={draft} quality={quality} blockers={blockers} />}
    </div>
    <DialogFooter className="gap-2 sm:gap-2"><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>{step < builderSteps.length - 1 ? <Button onClick={() => setStep((current) => Math.min(builderSteps.length - 1, current + 1))}>Next<ArrowRight className="ml-2 h-4 w-4" /></Button> : <><Button variant="outline" onClick={() => submit("draft")}>Save draft</Button><Button onClick={() => submit("published")} disabled={blockers.length > 0}>Publish</Button><Button onClick={() => submit("published")} disabled={blockers.length > 0}>Assign now</Button></>}</DialogFooter>
    <AiTrainingDialog open={aiOpen} onOpenChange={setAiOpen} source={aiSource} setSource={setAiSource} tangoUrl={aiTangoUrl} setTangoUrl={setAiTangoUrl} sopText={aiSopText} setSopText={setAiSopText} fileName={aiFileName} setFileName={setAiFileName} quizComplexity={aiQuizComplexity} setQuizComplexity={setAiQuizComplexity} quizQuestionCount={aiQuizQuestionCount} setQuizQuestionCount={setAiQuizQuestionCount} generating={aiGenerating} draft={aiDraft} onDraftChange={setAiDraft} onGenerate={generateWithAi} onAccept={acceptAiDraft} />
  </DialogContent></Dialog>;
}

function AiTrainingDialog({ open, onOpenChange, source, setSource, tangoUrl, setTangoUrl, sopText, setSopText, fileName, setFileName, quizComplexity, setQuizComplexity, quizQuestionCount, setQuizQuestionCount, generating, draft, onDraftChange, onGenerate, onAccept }: { open: boolean; onOpenChange: (open: boolean) => void; source: AiSourceType; setSource: (source: AiSourceType) => void; tangoUrl: string; setTangoUrl: (value: string) => void; sopText: string; setSopText: (value: string) => void; fileName: string; setFileName: (value: string) => void; quizComplexity: QuizComplexity; setQuizComplexity: (value: QuizComplexity) => void; quizQuestionCount: number; setQuizQuestionCount: (value: number) => void; generating: boolean; draft: AiDraft | null; onDraftChange: (draft: AiDraft) => void; onGenerate: () => void; onAccept: () => void }) {
  const readUpload = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text().catch(() => "");
    setSopText(text);
    if (!text.trim()) toast.error("Could not read text from this file. Paste the SOP text instead.");
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Generate Training with AI</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid gap-2 md:grid-cols-4">{[["tango", "Tango Link"], ["upload", "SOP Upload"], ["paste", "Pasted SOP Text"], ["combined", "Tango + SOP"]].map(([key, label]) => <button key={key} onClick={() => setSource(key as AiSourceType)} className={cn("rounded-xl border p-3 text-left text-sm transition-colors", source === key ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background text-foreground hover:bg-muted/40")}><Sparkles className="mb-2 h-4 w-4" />{label}</button>)}</div><div className="grid gap-3 md:grid-cols-2"><Field label="Quiz question complexity"><Select value={quizComplexity} onValueChange={(value) => setQuizComplexity(value as QuizComplexity)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select></Field><Field label="Number of quiz questions"><Input type="number" min={3} max={10} value={quizQuestionCount} onChange={(event) => setQuizQuestionCount(Math.max(3, Math.min(10, Number(event.target.value) || 5)))} /></Field></div>{(source === "tango" || source === "combined") && <Field label="Tango URL"><Input value={tangoUrl} onChange={(event) => setTangoUrl(event.target.value)} placeholder="https://app.tango.us/app/workflow/..." /></Field>}{source === "combined" && <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">The AI will merge SOP standards with the Tango walkthrough flow into one cohesive course.</div>}{source === "upload" && <div className="space-y-3"><Field label="SOP file"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground hover:bg-muted/40"><Upload className="h-4 w-4" /><input type="file" accept=".txt,.md,.pdf,.doc,.docx" className="hidden" onChange={(event) => void readUpload(event.target.files?.[0])} />Upload PDF, DOC, or TXT</label></Field>{fileName && <StatusBadge status={fileName} variant="default" />}<Field label="Extracted / pasted SOP text"><Textarea value={sopText} onChange={(event) => setSopText(event.target.value)} rows={8} placeholder="If the upload does not extract cleanly, paste the SOP text here before generating." /></Field></div>}{(source === "paste" || source === "combined") && <Field label={source === "combined" ? "SOP content" : "Paste SOP text"}><Textarea value={sopText} onChange={(event) => setSopText(event.target.value)} rows={source === "combined" ? 8 : 12} placeholder="Paste the SOP, policy, workflow notes, or rough instructions here." /></Field>}<div className="flex flex-wrap gap-2"><Button onClick={onGenerate} disabled={generating}>{generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{draft ? "Regenerate" : "Generate draft"}</Button>{draft && <Button variant="outline" onClick={onAccept}><BadgeCheck className="mr-2 h-4 w-4" />Accept Training</Button>}</div>{draft && <AiDraftPreview draft={draft} onDraftChange={onDraftChange} quizComplexity={quizComplexity} quizQuestionCount={quizQuestionCount} />}</div></DialogContent></Dialog>;
}

function AiDraftPreview({ draft, onDraftChange, quizComplexity, quizQuestionCount }: { draft: AiDraft; onDraftChange: (draft: AiDraft) => void; quizComplexity: QuizComplexity; quizQuestionCount: number }) {
  const quizStyle = quizComplexity === "easy" ? "Direct recall and basic recognition" : quizComplexity === "hard" ? "Scenario-based judgment with edge cases" : "Applied workflow understanding";
  const updateQuiz = (index: number, patch: Partial<AiDraft["quiz"][number]>) => onDraftChange({ ...draft, quiz: draft.quiz.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  const removeQuiz = (index: number) => onDraftChange({ ...draft, quiz: draft.quiz.filter((_, itemIndex) => itemIndex !== index) });
  const addQuiz = () => onDraftChange({ ...draft, quiz: [...(draft.quiz ?? []), { type: "Multiple choice", question: "", options: ["", "", ""], answer: "", explanation: "" }] });

  return <section className="space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">AI-generated editable preview</p><h3 className="mt-1 text-xl font-semibold text-foreground">{draft.title}</h3><p className="mt-1 text-sm text-muted-foreground">{draft.description}</p></div><StatusBadge status={`AI Quality Score: ${draft.qualityScore ?? 0}%`} variant={(draft.qualityScore ?? 0) >= 75 ? "success" : "warning"} /></div><div className="grid gap-3 md:grid-cols-3"><PreviewCard title="Learning objectives" items={draft.objectives ?? []} /><PreviewCard title="Step-by-step breakdown" items={(draft.steps ?? []).map((step, index) => `${index + 1}. ${step.title ?? "Step"}`)} /><PreviewCard title="Checklist" items={draft.checklist ?? []} /></div><div className="grid gap-3 md:grid-cols-2"><PreviewCard title="Common mistakes" items={(draft.commonMistakes ?? []).map((item) => item.error ?? "").filter(Boolean)} /><div className="rounded-xl border border-border/60 bg-background p-3"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">Quiz editor</p><StatusBadge status={`${quizComplexity[0].toUpperCase()}${quizComplexity.slice(1)} complexity`} variant="info" /><StatusBadge status={`${draft.quiz?.length ?? 0}/${quizQuestionCount} questions`} variant={(draft.quiz?.length ?? 0) === quizQuestionCount ? "success" : "warning"} /></div><p className="mt-2 text-xs text-muted-foreground">{quizStyle}</p>{draft.quiz?.length ? <div className="mt-3 space-y-3">{draft.quiz.map((item, index) => <div key={`${item.question}-${index}`} className="rounded-lg border border-border/60 bg-card p-3"><div className="mb-3 flex items-center justify-between gap-2"><Select value={item.type ?? "Multiple choice"} onValueChange={(value) => updateQuiz(index, { type: value as "Multiple choice" | "True / false", options: value === "True / false" ? ["True", "False"] : item.options?.length ? item.options : ["", "", ""] })}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Multiple choice">Multiple choice</SelectItem><SelectItem value="True / false">True / false</SelectItem></SelectContent></Select><Button size="sm" variant="ghost" onClick={() => removeQuiz(index)}><Trash2 className="h-4 w-4" /></Button></div><Field label={`Question ${index + 1}`}><Input value={item.question ?? ""} onChange={(event) => updateQuiz(index, { question: event.target.value })} placeholder="Question" /></Field><Field label="Options"><Textarea className="mt-1" value={(item.options ?? []).join("\n")} onChange={(event) => updateQuiz(index, { options: event.target.value.split("\n") })} rows={3} placeholder="One option per line" /></Field><Field label="Correct answer"><Input value={item.answer ?? ""} onChange={(event) => updateQuiz(index, { answer: event.target.value })} placeholder="Correct answer" /></Field><Field label="Explanation"><Textarea value={item.explanation ?? ""} onChange={(event) => updateQuiz(index, { explanation: event.target.value })} rows={2} placeholder="Why this answer is correct" /></Field></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Not generated yet.</p>}<Button className="mt-3" variant="outline" onClick={addQuiz}><Plus className="mr-2 h-4 w-4" />Add question</Button></div></div></section>;
}

function BasicsStep({ draft, patch, applyTemplate, duplicateCourse, courses }: { draft: BuilderDraft; patch: <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => void; applyTemplate: (name: string) => void; duplicateCourse: (id: string) => void; courses: TrainingCourse[] }) {
  return <section className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Training template</Label><Select onValueChange={applyTemplate}><SelectTrigger><SelectValue placeholder="Start with a standardized template" /></SelectTrigger><SelectContent>{templates.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectContent></Select></div>{courses.length > 0 && <div className="space-y-2 md:col-span-2"><Label>Duplicate existing training</Label><Select onValueChange={duplicateCourse}><SelectTrigger><SelectValue placeholder="Clone a current training as a starting point" /></SelectTrigger><SelectContent>{courses.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></div>}<Field label="Training title" className="md:col-span-2"><Input value={draft.title} onChange={(e) => patch("title", e.target.value)} placeholder="Intake VOB handoff workflow" /></Field><Field label="Description" className="md:col-span-2"><Textarea value={draft.description} onChange={(e) => patch("description", e.target.value)} rows={3} placeholder="What this mini course teaches and when staff should use it." /></Field><Field label="Department"><Select value={draft.departmentId} onValueChange={(v) => patch("departmentId", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{trainingDepartments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Training type"><Select value={draft.type} onValueChange={(v) => patch("type", v as TrainingType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{trainingTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Difficulty"><Select value={draft.difficulty} onValueChange={(v) => patch("difficulty", v as Difficulty)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{difficultyLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Estimated time"><Input type="number" min={5} value={draft.minutes} onChange={(e) => patch("minutes", Number(e.target.value) || 5)} /></Field><Field label="Requirement"><Select value={draft.required ? "required" : "optional"} onValueChange={(v) => patch("required", v === "required")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="required">Required</SelectItem><SelectItem value="optional">Optional</SelectItem></SelectContent></Select></Field><Field label="Owner"><Input value={draft.owner} onChange={(e) => patch("owner", e.target.value)} /></Field><div className="space-y-2 md:col-span-2"><Label>Role visibility</Label><div className="grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-border/60 bg-background p-3 md:grid-cols-2 xl:grid-cols-3">{ROLE_META.filter((role) => role.group !== "Legacy").map((role) => <label key={role.key} className="flex items-center gap-2 text-sm text-foreground"><Checkbox checked={draft.roleVisibility.includes(role.key)} onCheckedChange={(checked) => patch("roleVisibility", checked ? [...draft.roleVisibility, role.key] : draft.roleVisibility.filter((item) => item !== role.key))} />{role.label}</label>)}</div></div></section>;
}

function SopStep({ draft, patch, autoFormatSop }: { draft: BuilderDraft; patch: <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => void; autoFormatSop: () => void }) {
  const updateFile = (file?: File) => {
    if (!file) return;
    if (draft.sopFileUrl?.startsWith("blob:")) URL.revokeObjectURL(draft.sopFileUrl);
    patch("sopFileName", file.name);
    patch("sopFileUrl", URL.createObjectURL(file));
  };
  return <section className="space-y-4"><div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary"><FileText className="mr-2 inline h-4 w-4" />SOP is required for every training and becomes the operational source of truth.</div><Field label="SOP title"><Input value={draft.sopTitle} onChange={(e) => patch("sopTitle", e.target.value)} placeholder="VOB Handoff SOP" /></Field><Field label="SOP content editor"><Textarea value={draft.sopContent} onChange={(e) => patch("sopContent", e.target.value)} rows={12} placeholder="Paste or write the SOP. Use Auto-format to structure it into Purpose, When used, Systems required, Steps, Expected outcome, and Common mistakes." /></Field><div className="rounded-xl border border-border/60 bg-background p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-foreground">SOP document resource</p><p className="text-xs text-muted-foreground">Upload, open, download, or replace the attached document.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={autoFormatSop}><Sparkles className="mr-2 h-4 w-4" />Auto-format SOP</Button>{draft.sopFileUrl && <Button type="button" variant="outline" onClick={() => window.open(draft.sopFileUrl, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 h-4 w-4" />Open</Button>}{draft.sopFileUrl && <Button type="button" variant="outline" onClick={() => downloadResource(draft.sopFileUrl, draft.sopFileName)}><Download className="mr-2 h-4 w-4" />Download</Button>}<label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm"><input type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={(e) => updateFile(e.target.files?.[0])} />{draft.sopFileName ? "Replace file" : "Upload file"}</label></div></div>{draft.sopFileName && <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.4fr] md:items-end"><Field label="Resource name"><Input value={draft.sopFileName} onChange={(e) => patch("sopFileName", e.target.value)} /></Field><Field label="Resource link"><Input value={draft.sopFileUrl} onChange={(e) => patch("sopFileUrl", e.target.value)} placeholder="Paste a SharePoint, Google Drive, or document URL" /></Field></div>}</div><label className="flex items-center gap-2 text-sm text-foreground"><Checkbox checked={draft.sopAsMain} onCheckedChange={(checked) => patch("sopAsMain", Boolean(checked))} />Use SOP as main training content</label></section>;
}

function WalkthroughStep({ items, onChange }: { items: WalkthroughLink[]; onChange: (items: WalkthroughLink[]) => void }) {
  return <section className="space-y-3"><p className="text-sm text-muted-foreground">Add at least one Tango walkthrough. Open, rename, or update each link in place.</p>{items.map((item, index) => <div key={item.id} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between gap-3"><p className="font-medium text-foreground">Walkthrough {index + 1}</p><div className="flex gap-2">{item.url && <Button size="sm" variant="outline" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 h-4 w-4" />Open</Button>}{item.url && <Button size="sm" variant="outline" onClick={() => downloadResource(item.url ?? "", item.title)}><Download className="mr-2 h-4 w-4" />Download</Button>}<Button size="sm" variant="ghost" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div></div><div className="grid gap-3 md:grid-cols-[1fr_220px]"><Field label="Resource link"><Input value={item.url} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, url: e.target.value } : row))} placeholder="https://app.tango.us/app/workflow/..." /></Field><Field label="Resource name"><Input value={item.label} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, label: e.target.value } : row))} placeholder="Open Walkthrough" /></Field></div>{item.url && <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">Linked resource · <span className="break-all text-foreground">{item.url}</span></div>}</div>)}<Button variant="outline" onClick={() => onChange([...items, { id: uid("tango"), url: "", label: "Open Walkthrough" }])}><Plus className="mr-2 h-4 w-4" />Add Tango link</Button></section>;
}

function StepsStep({ items, onChange, suggested }: { items: TrainingStep[]; onChange: (items: TrainingStep[]) => void; suggested: string[] }) {
  return <section className="space-y-3"><div className="rounded-xl border border-border/60 bg-muted/30 p-3"><p className="text-sm font-medium text-foreground">Suggested sections</p><div className="mt-2 flex flex-wrap gap-2">{suggested.map((title) => <Button key={title} size="sm" variant="outline" onClick={() => onChange([...items, { id: uid("step"), title, description: "", systemTag: systems[0] }])}>{title}</Button>)}</div></div>{items.map((item, index) => <div key={item.id} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between"><p className="font-medium text-foreground">Step {index + 1}</p><Button size="sm" variant="ghost" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-3 md:grid-cols-2"><Input value={item.title} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, title: e.target.value } : row))} placeholder="Step title" /><Select value={item.systemTag} onValueChange={(v) => onChange(items.map((row) => row.id === item.id ? { ...row, systemTag: v } : row))}><SelectTrigger><SelectValue placeholder="System tag" /></SelectTrigger><SelectContent>{systems.map((system) => <SelectItem key={system} value={system}>{system}</SelectItem>)}</SelectContent></Select><Textarea className="md:col-span-2" value={item.description} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, description: e.target.value } : row))} rows={3} placeholder="Step description" /><Input value={item.imagePlaceholder ?? ""} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, imagePlaceholder: e.target.value } : row))} placeholder="Optional image placeholder" /><Input value={item.tangoReference ?? ""} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, tangoReference: e.target.value } : row))} placeholder="Optional Tango reference" /></div></div>)}<Button variant="outline" onClick={() => onChange([...items, { id: uid("step"), title: "", description: "", systemTag: systems[0] }])}><Plus className="mr-2 h-4 w-4" />Add step</Button></section>;
}

function BlocksStep({ items, onChange }: { items: ContentBlock[]; onChange: (items: ContentBlock[]) => void }) {
  const types = ["Text explanation", "Video placeholder", "Checklist", "File attachment", "External link", "Watch this before continuing", "Important warning"];
  const updateFile = (id: string, file?: File) => {
    if (!file) return;
    onChange(items.map((row) => row.id === id ? { ...row, title: row.title === row.type ? file.name : row.title || file.name, url: URL.createObjectURL(file) } : row));
  };

  return <section className="space-y-3"><div className="flex flex-wrap gap-2">{types.map((type) => <Button key={type} variant="outline" size="sm" onClick={() => onChange([...items, { id: uid("block"), type, title: type, body: "" }])}><Plus className="mr-2 h-4 w-4" />{type}</Button>)}</div>{items.map((item) => <div key={item.id} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex items-center justify-between gap-3"><StatusBadge status={item.type} variant={item.type.includes("warning") ? "warning" : "info"} /><div className="flex gap-2">{item.url && <Button size="sm" variant="outline" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 h-4 w-4" />Open</Button>}{item.url && <Button size="sm" variant="outline" onClick={() => downloadResource(item.url ?? "", item.title)}><Download className="mr-2 h-4 w-4" />Download</Button>}<Button size="sm" variant="ghost" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div></div><div className="grid gap-3 md:grid-cols-2"><Field label="Resource name"><Input value={item.title} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, title: e.target.value } : row))} placeholder="Block title" /></Field><Field label="Resource link"><Input value={item.url ?? ""} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, url: e.target.value } : row))} placeholder="Paste a link or upload a file" /></Field></div><Textarea className="mt-3" value={item.body} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, body: e.target.value } : row))} rows={3} placeholder="Content, instruction, warning, or learner guidance" /><div className="mt-3 flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm"><input type="file" className="hidden" onChange={(event) => updateFile(item.id, event.target.files?.[0])} />{item.url ? "Replace document" : "Upload document"}</label>{item.url && <span className="max-w-full truncate text-xs text-muted-foreground">{item.url}</span>}</div></div>)}</section>;
}

function ChecklistStep({ items, onChange, requiredForWorkflow }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void; requiredForWorkflow: boolean }) {
  return <section className="space-y-3">{requiredForWorkflow && <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning"><ListChecks className="mr-2 inline h-4 w-4" />Workflow trainings require a completion checklist.</div>}{items.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-border/60 bg-background p-3 md:grid-cols-[1fr_140px_44px]"><Input value={item.label} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, label: e.target.value } : row))} placeholder="Located correct client" /><label className="flex items-center gap-2 text-sm"><Checkbox checked={item.required} onCheckedChange={(checked) => onChange(items.map((row) => row.id === item.id ? { ...row, required: Boolean(checked) } : row))} />Required</label><Button size="sm" variant="ghost" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" onClick={() => onChange([...items, { id: uid("check"), label: "", required: true }])}><Plus className="mr-2 h-4 w-4" />Add checklist item</Button></section>;
}

function MistakesStep({ items, onChange }: { items: MistakeItem[]; onChange: (items: MistakeItem[]) => void }) {
  return <section className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex justify-between"><p className="font-medium text-foreground">Common mistake</p><Button size="sm" variant="ghost" onClick={() => onChange(items.filter((row) => row.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div><div className="grid gap-3 md:grid-cols-3"><Textarea value={item.error} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, error: e.target.value } : row))} placeholder="Error" /><Textarea value={item.consequence} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, consequence: e.target.value } : row))} placeholder="Consequence" /><Textarea value={item.avoid} onChange={(e) => onChange(items.map((row) => row.id === item.id ? { ...row, avoid: e.target.value } : row))} placeholder="How to avoid" /></div></div>)}<Button variant="outline" onClick={() => onChange([...items, { id: uid("mistake"), error: "", consequence: "", avoid: "" }])}><Plus className="mr-2 h-4 w-4" />Add mistake</Button></section>;
}

function QuizStep({ draft, patch }: { draft: BuilderDraft; patch: <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => void }) {
  return <section className="space-y-4"><label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.quizEnabled} onCheckedChange={(checked) => patch("quizEnabled", Boolean(checked))} />Add quiz validation</label>{draft.quizEnabled && <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Passing score %"><Input type="number" min={50} max={100} value={draft.passingScore} onChange={(e) => patch("passingScore", Number(e.target.value) || 80)} /></Field><label className="mt-7 flex items-center gap-2 text-sm"><Checkbox checked={draft.allowRetake} onCheckedChange={(checked) => patch("allowRetake", Boolean(checked))} />Allow retake</label></div>{draft.quiz.map((q) => <div key={q.id} className="rounded-xl border border-border/60 bg-background p-3"><div className="mb-3 flex justify-between"><Select value={q.type} onValueChange={(v) => patch("quiz", draft.quiz.map((row) => row.id === q.id ? { ...row, type: v as "Multiple choice" | "True / false", options: v === "True / false" ? ["True", "False"] : row.options } : row))}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Multiple choice">Multiple choice</SelectItem><SelectItem value="True / false">True / false</SelectItem></SelectContent></Select><Button size="sm" variant="ghost" onClick={() => patch("quiz", draft.quiz.filter((row) => row.id !== q.id))}><Trash2 className="h-4 w-4" /></Button></div><Input value={q.question} onChange={(e) => patch("quiz", draft.quiz.map((row) => row.id === q.id ? { ...row, question: e.target.value } : row))} placeholder="Question" /><Textarea className="mt-3" value={q.options.join("\n")} onChange={(e) => patch("quiz", draft.quiz.map((row) => row.id === q.id ? { ...row, options: e.target.value.split("\n") } : row))} rows={3} placeholder="Answer options, one per line" /><Input className="mt-3" value={q.answer} onChange={(e) => patch("quiz", draft.quiz.map((row) => row.id === q.id ? { ...row, answer: e.target.value } : row))} placeholder="Correct answer" /><Textarea className="mt-3" value={q.explanation} onChange={(e) => patch("quiz", draft.quiz.map((row) => row.id === q.id ? { ...row, explanation: e.target.value } : row))} rows={2} placeholder="Explanation" /></div>)}<Button variant="outline" onClick={() => patch("quiz", [...draft.quiz, { id: uid("quiz"), type: "Multiple choice", question: "", options: ["", "", ""], answer: "", explanation: "" }])}><Plus className="mr-2 h-4 w-4" />Add question</Button></div>}</section>;
}

function BadgeStep({ draft, patch }: { draft: BuilderDraft; patch: <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => void }) {
  return <section className="grid gap-4 md:grid-cols-2"><label className="flex items-center gap-2 text-sm md:col-span-2"><Checkbox checked={draft.awardBadge} onCheckedChange={(checked) => patch("awardBadge", Boolean(checked))} />Award badge on completion</label><Field label="Badge title"><Input value={draft.badgeTitle} onChange={(e) => patch("badgeTitle", e.target.value)} placeholder="Intake Workflow Ready" /></Field><Field label="Icon placeholder"><div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"><BadgeCheck className="h-4 w-4 text-primary" /> Blossom badge icon</div></Field><Field label="Badge description" className="md:col-span-2"><Textarea value={draft.badgeDescription} onChange={(e) => patch("badgeDescription", e.target.value)} rows={3} /></Field></section>;
}

function AssignmentStep({ draft, patch }: { draft: BuilderDraft; patch: <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => void }) {
  return <section className="grid gap-4 md:grid-cols-2"><Field label="Assign to role"><Select value={draft.assignRole} onValueChange={(v) => patch("assignRole", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All roles</SelectItem>{ROLE_META.filter((role) => role.group !== "Legacy").map((role) => <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Assign to department"><Select value={draft.assignDepartment} onValueChange={(v) => patch("assignDepartment", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All departments</SelectItem>{trainingDepartments.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Individual user"><Input value={draft.assignIndividual} onChange={(e) => patch("assignIndividual", e.target.value)} placeholder="Optional name or email" /></Field><Field label="Due date"><Input type="date" value={draft.dueDate} onChange={(e) => patch("dueDate", e.target.value)} /></Field><label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.required} onCheckedChange={(checked) => patch("required", Boolean(checked))} />Required assignment</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.reminder} onCheckedChange={(checked) => patch("reminder", Boolean(checked))} />Send reminder</label></section>;
}

function PreviewStep({ draft, quality, blockers }: { draft: BuilderDraft; quality: number; blockers: string[] }) {
  return <section className="space-y-4"><div className="grid gap-3 md:grid-cols-4">{[["Quality", `${quality}%`], ["Objectives", clean(draft.objectives).length], ["Steps", draft.steps.filter((s) => s.title.trim()).length], ["Quiz", draft.quizEnabled ? `${draft.quiz.length} questions` : "Optional"]].map(([label, value]) => <div key={label} className="rounded-xl border border-border/60 bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold text-foreground">{value}</p></div>)}</div>{blockers.length > 0 && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 text-destructive" /><div><p className="font-medium text-destructive">Publish blockers</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{blockers.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div>}<div className="rounded-2xl border border-border/60 bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-2xl font-semibold text-foreground">{draft.title || "Untitled training"}</p><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{draft.description || "Training description preview."}</p></div><StatusBadge status={draft.required ? "Required" : "Optional"} variant={draft.required ? "warning" : "muted"} /></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><PreviewCard title="Learning objectives" items={clean(draft.objectives)} /><PreviewCard title="Workflow steps" items={draft.steps.filter((s) => s.title.trim()).map((s, i) => `${i + 1}. ${s.title}`)} /><PreviewCard title="Common mistakes" items={draft.mistakes.filter((m) => m.error.trim()).map((m) => m.error)} /><PreviewCard title="Checklist" items={draft.checklist.filter((item) => item.label.trim()).map((item) => item.label)} /></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-border/60 bg-background p-4"><p className="text-sm font-medium text-foreground">AI-generated sections</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={draft.sopContent.trim() ? "SOP drafted" : "SOP missing"} variant={draft.sopContent.trim() ? "success" : "warning"} /><StatusBadge status={draft.walkthroughs.some((item) => item.url.trim()) ? "Tango attached" : "No Tango"} variant={draft.walkthroughs.some((item) => item.url.trim()) ? "success" : "warning"} /><StatusBadge status={draft.quizEnabled ? "Quiz generated" : "Quiz off"} variant={draft.quizEnabled ? "success" : "muted"} /><StatusBadge status={draft.badgeTitle.trim() ? `Badge: ${draft.badgeTitle}` : "No badge title"} variant={draft.badgeTitle.trim() ? "info" : "muted"} /></div></div><div className="rounded-xl border border-border/60 bg-background p-4"><p className="text-sm font-medium text-foreground">SOP + walkthrough summary</p><p className="mt-2 text-sm text-muted-foreground line-clamp-6">{draft.sopContent.trim() || "Add SOP content to generate the structured training body."}</p></div></div></div></section>;
}

function ListStep({ title, intro, values, onChange, placeholder }: { title: string; intro: string; values: string[]; onChange: (values: string[]) => void; placeholder: string }) {
  return <section className="space-y-3"><div><h3 className="font-semibold text-foreground">{title}</h3><p className="text-sm text-muted-foreground">{intro}</p></div>{values.map((value, index) => <div key={index} className="flex gap-2"><Input value={value} onChange={(e) => onChange(values.map((item, i) => i === index ? e.target.value : item))} placeholder={placeholder} /><Button variant="ghost" onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" onClick={() => onChange([...values, ""])}><Plus className="mr-2 h-4 w-4" />Add objective</Button></section>;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) { return <div className={cn("space-y-2", className)}><Label>{label}</Label>{children}</div>; }
function PreviewCard({ title, items }: { title: string; items: string[] }) { return <div className="rounded-xl border border-border/60 bg-background p-3"><p className="font-medium text-foreground">{title}</p>{items.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Not added yet.</p>}</div>; }
function clean(items: string[]) { return items.map((item) => item.trim()).filter(Boolean); }
function firstSentence(value: string) { return value.split(/[.!?]\s/)[0]?.trim() || value.slice(0, 160); }
function qualityLabel(score: number) { if (score >= 90) return "Excellent"; if (score >= 75) return "Good, but can be improved"; if (score >= 50) return "Needs structure"; return "Weak training"; }
function getQualityScore(draft: BuilderDraft) { return Math.min(100, (draft.sopContent.trim() || draft.sopFileName ? 20 : 0) + (draft.walkthroughs.some((w) => w.url.trim()) ? 20 : 0) + (draft.steps.some((s) => s.title.trim() && s.description.trim()) ? 20 : 0) + (draft.checklist.some((c) => c.label.trim()) ? 15 : 0) + (draft.quizEnabled && draft.quiz.some((q) => q.question.trim() && q.answer.trim()) ? 15 : 0) + (draft.mistakes.some((m) => m.error.trim() && m.avoid.trim()) ? 10 : 0)); }
function getPublishBlockers(draft: BuilderDraft) { return [!clean(draft.objectives).length && "Add at least one learning objective", !(draft.sopContent.trim() || draft.sopFileName) && "Add SOP content or upload an SOP file", !draft.walkthroughs.some((w) => w.url.trim()) && "Add at least one Tango walkthrough", !draft.steps.some((s) => s.title.trim() && s.description.trim()) && "Add at least one step with a title and description", draft.type === "Workflow" && !draft.checklist.some((c) => c.label.trim()) && "Workflow trainings require a checklist", !draft.mistakes.some((m) => m.error.trim() && m.avoid.trim()) && "Add common mistakes and how to avoid them"].filter(Boolean) as string[]; }
function suggestionsForDepartment(departmentId: string) { const map: Record<string, { systems: string[]; steps: string[] }> = { intake: { systems: ["Blossom OS", "Monday", "Phone"], steps: ["Capture lead details", "Send intake form", "Complete VOB handoff"] }, auth: { systems: ["Blossom OS", "CentralReach", "SharePoint"], steps: ["Confirm required documents", "Submit authorization", "Track approval or denial"] }, clients: { systems: ["Blossom OS", "CentralReach"], steps: ["Confirm client stage", "Update next action", "Document handoff"] }, hr: { systems: ["Blossom OS", "Viventium"], steps: ["Verify employee record", "Assign onboarding task", "Confirm completion"] } }; return map[departmentId] ?? { systems: ["Blossom OS"], steps: ["Confirm record", "Complete action", "Document outcome"] }; }
function collectResources(draft: BuilderDraft) { return [...draft.walkthroughs.map((w) => w.url).filter(Boolean), draft.sopFileUrl || draft.sopFileName, ...draft.blocks.map((b) => b.url).filter(Boolean)].filter(Boolean); }
function makeLessonsFromDraft(courseId: string, draft: BuilderDraft): TrainingLesson[] { const lessons: TrainingLesson[] = [{ id: `${courseId}-objectives`, title: "Learning Objectives", description: "Understand what this training validates.", type: "Written SOP", minutes: 3, required: true, content: clean(draft.objectives).join("\n") }, { id: `${courseId}-sop`, title: draft.sopTitle || "SOP", description: "Review the required standard operating procedure.", type: "Written SOP", minutes: Math.max(5, Math.round(draft.minutes * 0.25)), required: true, content: draft.sopContent, resourceUrl: draft.sopFileUrl || draft.sopFileName }, ...draft.walkthroughs.filter((w) => w.url.trim()).map((w, index) => ({ id: `${courseId}-tango-${index}`, title: w.label || `Walkthrough ${index + 1}`, description: "Follow the guided Tango walkthrough.", type: "Tango" as const, minutes: 6, required: true, content: w.url, tangoUrl: w.url })), ...draft.blocks.filter((b) => b.url?.trim()).map((b, index) => ({ id: `${courseId}-resource-${index}`, title: b.title || `Resource ${index + 1}`, description: b.body || "Open the linked training resource.", type: b.type === "External link" ? "External Link" as const : "File" as const, minutes: 3, required: false, content: b.body || b.url || "", resourceUrl: b.url })), ...draft.steps.filter((s) => s.title.trim()).map((s, index) => ({ id: `${courseId}-step-${index}`, title: `${index + 1}. ${s.title}`, description: s.systemTag || "Workflow step", type: "Checklist" as const, minutes: 4, required: true, content: s.description })), { id: `${courseId}-mistakes`, title: "Common Mistakes", description: "Avoid the errors that cause rework.", type: "Checklist", minutes: 5, required: true, content: draft.mistakes.map((m) => `${m.error}\nConsequence: ${m.consequence}\nAvoid by: ${m.avoid}`).join("\n\n") }]; if (draft.quizEnabled) lessons.push({ id: `${courseId}-quiz`, title: "Knowledge Check", description: "Validate readiness before completion.", type: "Quiz", minutes: 5, required: true, content: "Complete the quiz to finish." }); return lessons; }
