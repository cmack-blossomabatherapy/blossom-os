import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft, Clock, FileText, Workflow, Play, CheckCircle2, BookOpen,
  BookMarked, Download, ExternalLink, Sparkles, ArrowRight, ListChecks,
  HelpCircle, FolderOpen, Check,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getTraining, getSectionsFor, getChecklistFor, getResourcesFor, getProgress,
  trainingQuiz, type TrainingSection,
} from "@/lib/training/academyData";

const SECTION_ICON: Record<TrainingSection["type"], typeof FileText> = {
  Overview: BookMarked,
  SOP: FileText,
  Walkthrough: Play,
  Checklist: ListChecks,
  Quiz: HelpCircle,
  Resources: FolderOpen,
};

export default function OSTrainingDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const training = useMemo(() => getTraining(id), [id]);
  const sections = useMemo(() => getSectionsFor(id), [id]);
  const checklist = useMemo(() => getChecklistFor(id), [id]);
  const resources = useMemo(() => getResourcesFor(id), [id]);
  const progress = useMemo(() => getProgress(id), [id]);

  // local-only progress controls (no backend yet)
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const checklistDone = checklist.filter((c) => checked[c.id]).length;

  if (!training) {
    return (
      <OSShell>
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Training not found.</p>
          <Button className="mt-3" onClick={() => navigate("/training")}>Back to Academy</Button>
        </div>
      </OSShell>
    );
  }

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

  return (
    <OSShell>
      <div className="os-rise">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <header className="os-glass-panel mt-3 rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
                Training Academy · {training.department}
              </p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-tight md:text-[28px]">{training.title}</h1>
              <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">{training.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{training.type}</Badge>
                {training.required && (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">Required</Badge>
                )}
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{training.estimatedMinutes} min</span>
                <span>·</span>
                <span>{training.difficulty}</span>
                <span>·</span>
                <span>Owner: {training.owner}</span>
                <span>·</span>
                <span>Updated {training.lastUpdated}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button onClick={() => toast.success("Marked as in progress")} className="rounded-full">
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {progress.status === "completed" ? "Review" : progress.status === "not_started" ? "Start" : "Continue"}
              </Button>
              <div className="w-56">
                <Progress value={progress.progressPercent} className="h-1.5" />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{progress.progressPercent}% complete</p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_300px]">
        {/* Left nav */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="os-glass-panel rounded-2xl p-2">
            {sections.map((s) => {
              const Icon = SECTION_ICON[s.type];
              const active = s.id === activeSection?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSectionId(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition",
                    active ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
            {checklist.length > 0 && !sections.some((s) => s.type === "Checklist") && (
              <button
                onClick={() => setActiveSectionId("__checklist")}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition",
                  activeSectionId === "__checklist" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50",
                )}
              >
                <ListChecks className="h-3.5 w-3.5" /> Checklist
              </button>
            )}
            <button
              onClick={() => setActiveSectionId("__quiz")}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition",
                activeSectionId === "__quiz" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50",
              )}
            >
              <HelpCircle className="h-3.5 w-3.5" /> Quiz <span className="ml-1 text-[10px] text-muted-foreground">(optional)</span>
            </button>
          </nav>
        </aside>

        {/* Center content */}
        <main className="os-glass-panel min-h-[400px] rounded-2xl p-6">
          {activeSectionId === "__quiz" ? (
            <QuizSection />
          ) : activeSectionId === "__checklist" ? (
            <ChecklistBlock checklist={checklist} checked={checked} setChecked={setChecked} done={checklistDone} />
          ) : activeSection?.type === "Checklist" ? (
            <ChecklistBlock checklist={checklist} checked={checked} setChecked={setChecked} done={checklistDone} />
          ) : activeSection?.type === "Resources" ? (
            <ResourcesBlock resources={resources} />
          ) : activeSection?.type === "Walkthrough" ? (
            <WalkthroughBlock section={activeSection} />
          ) : (
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">{activeSection?.title}</h2>
              {activeSection?.content && (
                <div className="prose prose-sm mt-3 max-w-none text-[13.5px] text-foreground prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-foreground/90 prose-li:text-foreground/90">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSection.content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
            <Button variant="ghost" size="sm" onClick={() => toast.success("Notes saved (local)")}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> My notes
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => toast.success("Marked complete")}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark section complete
            </Button>
          </div>
        </main>

        {/* Right rail */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <div className="os-glass-panel rounded-2xl p-5">
            <h3 className="text-[13px] font-semibold">Resources</h3>
            <div className="mt-3 space-y-2">
              {resources.length === 0 && <p className="text-[12px] text-muted-foreground">No resources attached yet.</p>}
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="inline-flex items-center gap-2">
                    {r.type === "PDF" ? <Download className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    {r.title}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                </a>
              ))}
            </div>
          </div>

          <div className="os-glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(265_70%_55%)]" />
              <h3 className="text-[13px] font-semibold">Ask Blossom AI</h3>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">Get help with this training.</p>
            <div className="mt-3 space-y-2">
              {[
                `Explain "${training.title}" in simple terms.`,
                "Summarize this SOP.",
                "Show me related trainings.",
              ].map((p) => (
                <Link
                  key={p}
                  to={`/ai/assistant?q=${encodeURIComponent(p)}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-[12px] hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="truncate">{p}</span>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </OSShell>
  );
}

function ChecklistBlock({
  checklist, checked, setChecked, done,
}: {
  checklist: ReturnType<typeof getChecklistFor>;
  checked: Record<string, boolean>;
  setChecked: (v: Record<string, boolean>) => void;
  done: number;
}) {
  if (checklist.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No checklist items for this training.</p>;
  }
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">On-call checklist</h2>
          <p className="text-[12.5px] text-muted-foreground">Run through this every time you start the workflow.</p>
        </div>
        <span className="text-[12px] tabular-nums text-muted-foreground">{done} / {checklist.length}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {checklist.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2"
          >
            <label className="flex items-center gap-3 text-[13px]">
              <Checkbox
                checked={!!checked[c.id]}
                onCheckedChange={(v) => setChecked({ ...checked, [c.id]: !!v })}
              />
              <span className={cn(checked[c.id] && "line-through text-muted-foreground")}>{c.item}</span>
            </label>
            {c.required && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">Required</Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResourcesBlock({ resources }: { resources: ReturnType<typeof getResourcesFor> }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold tracking-tight">Resources</h2>
      <p className="text-[12.5px] text-muted-foreground">Templates, links, and walkthroughs.</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {resources.map((r) => (
          <a key={r.id} href={r.url} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-[13px] hover:border-primary/40 hover:bg-muted/40">
            <span className="inline-flex items-center gap-2">
              {r.type === "PDF" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              {r.title}
            </span>
            <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
          </a>
        ))}
      </div>
    </div>
  );
}

function WalkthroughBlock({ section }: { section: TrainingSection }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold tracking-tight">{section.title}</h2>
      {section.content && <p className="mt-1 text-[13px] text-muted-foreground">{section.content}</p>}
      <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-[hsl(265_100%_97%)] to-[hsl(280_100%_98%)]">
        <div className="text-center">
          <Play className="mx-auto h-8 w-8 text-[hsl(265_70%_55%)]" />
          <p className="mt-2 text-[13px] font-medium">Tango walkthrough</p>
          <p className="text-[11.5px] text-muted-foreground">Click-by-click guided demo.</p>
          {section.tangoUrl && (
            <a href={section.tangoUrl} className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
              Open in Tango <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizSection() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const correct = trainingQuiz.filter((q) => answers[q.id] === q.answerIndex).length;
  return (
    <div>
      <h2 className="text-[18px] font-semibold tracking-tight">Quick check</h2>
      <p className="text-[12.5px] text-muted-foreground">Lightweight — just to confirm the basics stuck.</p>
      <div className="mt-4 space-y-4">
        {trainingQuiz.map((q, qi) => (
          <div key={q.id} className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-[13px] font-medium">{qi + 1}. {q.question}</p>
            <div className="mt-3 space-y-1.5">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === i;
                const isCorrect = submitted && i === q.answerIndex;
                const isWrong = submitted && selected && i !== q.answerIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [q.id]: i })}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[12.5px] transition",
                      selected ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40",
                      isCorrect && "border-emerald-400 bg-emerald-50",
                      isWrong && "border-red-300 bg-red-50",
                    )}
                  >
                    {opt}
                    {isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {submitted ? `Score: ${correct} / ${trainingQuiz.length}` : "Choose your answers and submit."}
        </p>
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < trainingQuiz.length}>
          Submit
        </Button>
      </div>
    </div>
  );
}