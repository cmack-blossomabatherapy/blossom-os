import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft, Clock, FileText, Workflow, Play, CheckCircle2, BookOpen,
  BookMarked, Download, ExternalLink, Sparkles, ArrowRight, ListChecks,
  HelpCircle, FolderOpen, Check, ShieldCheck, ChevronRight, Library,
  Lightbulb, Compass, Pencil,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useAcademy, getTraining, getSectionsFor, getChecklistFor, getResourcesFor, getProgress,
  trainingQuiz, type TrainingSection, type TrainingResource, type Training,
} from "@/lib/training/academyData";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadLearnerHome, startLearnerModule, completeLearnerModule,
  emptyLearnerHome, type LearnerHome,
} from "@/lib/academy/learnerHome";
import { upsertProgress } from "@/lib/academy/api";
import {
  getStateDirectorFullContent, isStateDirectorModule,
  type SDFullContent, type SDKnowledgeQ,
  getStateDirectorScreenshots, getStateDirectorScreenshotById, isScreenshotPiiSafe,
  type SDScreenshotAsset,
} from "@/lib/training/stateDirectorFullTraining";
import { getSopTitleForModule } from "@/lib/training/stateDirectorModuleSopMap";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { findResourceForSopTitle } from "@/lib/resources/sdSopCoverage";
import { resolveResourceOpenUrl } from "@/lib/resources/resourceStorage";

/** A resource is "pending" when it has no usable destination yet. */
function isPendingResource(r: TrainingResource): boolean {
  const u = (r.url ?? "").trim();
  return u === "" || u === "#";
}

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
  const { trainings } = useAcademy();
  const training = useMemo(() => getTraining(id), [id, trainings]);
  const sections = useMemo(() => getSectionsFor(id), [id, trainings]);
  const checklist = useMemo(() => getChecklistFor(id), [id, trainings]);
  const resources = useMemo(() => getResourcesFor(id), [id, trainings]);
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

  const isSD = training.id.startsWith("sd-") || training.department === "state_director";

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

      {isSD && <SDModuleDetailPanel training={training} />}

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
              {activeSection?.type === "Overview" && activeSection?.videoUrl && (
                <section className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                  <video
                    src={activeSection.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster="/placeholder.svg"
                    className="aspect-video w-full bg-black object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Play className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
                      <span className="font-medium text-foreground">Welcome video</span>
                      <span>· Watch before continuing</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Required</Badge>
                  </div>
                </section>
              )}
              {activeSection?.content && (
                <div className="prose prose-sm mt-3 max-w-none text-[13.5px] text-foreground prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-foreground/90 prose-li:text-foreground/90">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSection.content}</ReactMarkdown>
                </div>
              )}
              {activeSection?.type === "Overview" && (
                <section className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "Who we are", body: "The mission, vision, and values that guide every decision at Blossom." },
                    { title: "How we work", body: "How families, clinical care, and operations all fit together." },
                    { title: "Your team", body: "The people you'll work alongside and how to ask for help." },
                  ].filter(() => training.id === "sd-m1-welcome").map((x) => (
                    <div key={x.title} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                      <p className="text-[13px] font-semibold text-foreground">{x.title}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{x.body}</p>
                    </div>
                  ))}
                </section>
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
              {resources.map((r) =>
                isPendingResource(r) ? (
                  <div
                    key={r.id}
                    data-testid="resource-pending"
                    className="flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <BookMarked className="h-3.5 w-3.5" />
                      {r.title}
                    </span>
                    <span className="text-[10px]">Attachment pending</span>
                  </div>
                ) : (
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
                ),
              )}
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
        {resources.map((r) =>
          isPendingResource(r) ? (
            <div
              key={r.id}
              data-testid="resource-pending"
              className="flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                {r.title}
              </span>
              <span className="text-[10px]">Attachment pending — this resource will appear once published.</span>
            </div>
          ) : (
            <a key={r.id} href={r.url} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-[13px] hover:border-primary/40 hover:bg-muted/40">
              <span className="inline-flex items-center gap-2">
                {r.type === "PDF" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                {r.title}
              </span>
              <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
            </a>
          ),
        )}
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

/* =============== State Director Module Detail Panel =============== */

function pickModuleFlow(title: string): { label: string; steps: string[] } | null {
  const t = title.toLowerCase();
  if (/(lead|intake|client lifecycle|vob|assessment|active client)/.test(t)) {
    return {
      label: "How a lead becomes an active client",
      steps: ["Lead", "Intake", "VOB", "BCBA Assignment", "Assessment", "Auth", "Staffing", "Treatment", "Utilization"],
    };
  }
  if (/(recruit|apploi|interview|offer|viventium|orientation|onboard|hiring)/.test(t)) {
    return {
      label: "How a candidate becomes an active staff member",
      steps: ["Candidate", "Apploi", "Cert Check", "Interview", "Offer", "Viventium", "Orientation", "Training"],
    };
  }
  if (/(auth|utilization|progress report|pr|reassessment)/.test(t)) {
    return {
      label: "Authorization lifecycle",
      steps: ["Awaiting Submission", "Submitted", "Approved", "Expiring Soon", "QA Review"],
    };
  }
  if (/(schedul|coverage|cancellation|pairing)/.test(t)) {
    return {
      label: "Schedule health checks",
      steps: ["Coverage Gaps", "Cancellations", "Unconverted Sessions", "Pairing Risks", "Utilization"],
    };
  }
  return null;
}

interface KCheckQ { id: string; question: string; options: string[]; answerIndex: number; }

function defaultKnowledgeCheck(t: Training): KCheckQ[] {
  // Generic 2-question scenario quiz — used when no DB quiz exists.
  return [
    {
      id: `${t.id}-q1`,
      question: `${t.title}: who owns the next move when this workflow stalls in your state?`,
      options: ["The State Director alone", "The department that owns the step, escalated by the State Director", "Nobody — wait for it to resolve"],
      answerIndex: 1,
    },
    {
      id: `${t.id}-q2`,
      question: "A State Director's role in this workflow is best described as:",
      options: ["Performing every task personally", "Understanding ownership, metrics, and where it gets stuck", "Approving every decision"],
      answerIndex: 1,
    },
  ];
}

function SDScreenshotCard({ asset }: { asset: SDScreenshotAsset }) {
  const pending = asset.resourceStatus === "pending_upload";
  const heldForRedaction =
    asset.resourceStatus === "needs_redaction" || asset.sensitivity === "needs_redaction";
  const safeToShow =
    !pending && !heldForRedaction && !!asset.imageUrl && isScreenshotPiiSafe(asset);
  return (
    <div
      data-testid="sd-screenshot"
      data-screenshot-id={asset.id}
      data-screenshot-status={asset.resourceStatus}
      className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[12.5px]"
    >
      <div className="font-semibold text-foreground">{asset.title}</div>
      <p className="mt-0.5 text-muted-foreground">{asset.description}</p>
      {safeToShow ? (
        <img
          src={asset.imageUrl}
          alt={asset.alt}
          loading="lazy"
          className="mt-2 max-h-72 w-full rounded-lg border border-border/60 object-contain bg-background"
        />
      ) : pending ? (
        <p
          data-testid="sd-screenshot-pending"
          className="mt-2 rounded-md border border-dashed border-border bg-background px-3 py-2 text-muted-foreground"
        >
          Screenshot pending — this visual will appear once the training asset is uploaded.
        </p>
      ) : heldForRedaction ? (
        <p
          data-testid="sd-screenshot-held"
          className="mt-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-amber-800"
        >
          Screenshot held for redaction — not visible to learners yet.
        </p>
      ) : null}
      {asset.callouts && asset.callouts.length > 0 && (
        <ol className="mt-2 space-y-1 text-muted-foreground">
          {asset.callouts.map((c, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {idx + 1}
              </span>
              <span>
                <span className="font-semibold text-foreground/80">{c.label}: </span>
                {c.description}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SDModuleDetailPanel({ training }: { training: Training }) {
  const { user } = useAuth();
  const [learnerHome, setLearnerHome] = useState<LearnerHome>(() => emptyLearnerHome());
  const [busy, setBusy] = useState<null | "start" | "complete" | "notes">(null);
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  const fullContent: SDFullContent | null = useMemo(
    () => getStateDirectorFullContent(training),
    [training.id],
  );

  const stepScreenshots: SDScreenshotAsset[] = useMemo(
    () => getStateDirectorScreenshots(training.id),
    [training.id],
  );

  async function refresh() {
    if (!user?.id) return;
    try { setLearnerHome(await loadLearnerHome(user.id)); } catch { /* non-fatal */ }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const dbMatch = useMemo(() => {
    const title = training.title.trim().toLowerCase();
    for (const w of learnerHome.weeks) {
      for (const m of w.modules) {
        if (m.title.trim().toLowerCase() === title) return { module: m, week: w };
      }
    }
    return null;
  }, [learnerHome, training.title]);

  const dbProgress = useMemo(() => {
    if (!dbMatch) return null;
    return learnerHome.rawProgress.find((p) => p.module_id === dbMatch.module.id) ?? null;
  }, [dbMatch, learnerHome.rawProgress]);

  useEffect(() => {
    if (dbProgress?.reflection && !notes) setNotes(dbProgress.reflection);
    // eslint-disable-next-line
  }, [dbProgress?.reflection]);

  const hasDb = !!learnerHome.enrollment && !!dbMatch;
  const requiresMentorSignoff = /shadow|signoff|sign-off|mentor|certification/i.test(training.title)
    || /^Shadowing$|^Meeting$/.test(training.type);
  const hasSignoff = !!dbProgress?.verified_at;
  const completed = dbProgress?.status === "completed";

  async function handleStart() {
    if (!hasDb) {
      toast.success("Started locally — connect an enrollment to sync with leadership.");
      return;
    }
    setBusy("start");
    const res = await startLearnerModule(learnerHome.enrollment!.id, dbMatch!.module.id);
    setBusy(null);
    if ((res as any)?.error) toast.error("Could not start module");
    else { toast.success("Started — visible in Training Management"); await refresh(); }
  }

  async function handleComplete() {
    if (requiresMentorSignoff && !hasSignoff) {
      toast.info("Mentor signoff required before this can be marked complete.");
      return;
    }
    if (!hasDb) {
      toast.success("Marked complete locally — connect an enrollment to sync.");
      return;
    }
    setBusy("complete");
    const res = await completeLearnerModule(learnerHome.enrollment!.id, dbMatch!.module.id);
    setBusy(null);
    if ((res as any)?.error) toast.error("Could not complete module");
    else { toast.success("Complete — synced to Training Management"); await refresh(); }
  }

  async function handleSaveNotes() {
    if (!hasDb) {
      toast.success("Notes saved locally");
      return;
    }
    setBusy("notes");
    const res = await upsertProgress(learnerHome.enrollment!.id, dbMatch!.module.id, { reflection: notes });
    setBusy(null);
    if ((res as any)?.error) toast.error("Could not save notes");
    else toast.success("Reflection saved");
  }

  async function handleSubmitQuiz() {
    const qs = quizQs;
    const correct = qs.filter((q) => answers[q.id] === q.answerIndex).length;
    const score = Math.round((correct / qs.length) * 100);
    setSubmitted(true);
    if (hasDb) {
      await upsertProgress(learnerHome.enrollment!.id, dbMatch!.module.id, { score });
    }
    toast.success(`Knowledge check: ${correct}/${qs.length}`);
  }

  const weekDay = (() => {
    const m = /^sd-w(\d+)d(\d+)-/.exec(training.id);
    return m ? `Week ${m[1]} · Day ${m[2]}` : "State Director Academy";
  })();

  const flow = pickModuleFlow(training.title);
  // Prefer DB quiz, then full-content module-specific questions, then generic.
  const quizQs: KCheckQ[] =
    (dbMatch?.module?.quiz?.questions as KCheckQ[] | undefined)
    ?? (fullContent?.knowledgeCheck as SDKnowledgeQ[] | undefined)
    ?? defaultKnowledgeCheck(training);

  return (
    <section data-testid="sd-module-detail-panel" className="mt-6 space-y-6">
      {/* SD module header summary */}
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{weekDay}</p>
            <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{training.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">{training.type}</Badge>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {training.estimatedMinutes} min</span>
              {requiresMentorSignoff && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Mentor signoff required
                </Badge>
              )}
              {completed && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">Complete</Badge>
              )}
              {!hasDb && (
                <span className="text-[10.5px] text-muted-foreground">Local-only progress (no enrollment linked)</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={handleStart} disabled={busy !== null}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {busy === "start" ? "Starting…" : "Mark started"}
            </Button>
            <Button size="sm" className="rounded-full" onClick={handleComplete} disabled={busy !== null} data-testid="sd-mark-complete">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {busy === "complete" ? "Saving…" : "Mark complete"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          {/* Why this matters */}
          <div data-testid="sd-why-matters" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Why this matters</h3>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">
              {training.whyItMatters
                ?? "A State Director does not perform every task. Your job is to understand who owns this workflow, what the metrics should look like, and where it tends to get stuck — so you can unblock it fast."}
            </p>
          </div>

          {/* What to do */}
          <div data-testid="sd-what-to-do" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">What to do</h3>
            </div>
            <ul className="mt-3 space-y-2 text-[13px]">
              {(training.whatToDo
                ? training.whatToDo.split(/\n+/).filter(Boolean)
                : [
                    "Review the linked SOP and any attached resources.",
                    "Watch the walkthrough (Tango / video) if one is attached.",
                    "Walk the simulation below — say out loud who owns each step.",
                    "Capture notes/reflection on what surprised you.",
                    "Ask your mentor one specific question before marking complete.",
                  ]
              ).map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* State Director Lens */}
          {fullContent && (
            <div data-testid="sd-state-director-lens" className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-primary">State Director lens</h3>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">
                {fullContent.stateDirectorLens}
              </p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground/80">Objective:</span> {fullContent.learningObjective}
              </p>
            </div>
          )}

          {/* Step-by-step walkthrough */}
          {fullContent && (
            <div data-testid="sd-walkthrough" className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Step-by-step walkthrough</h3>
              </div>
              <ol className="mt-3 space-y-3 text-[13px]">
                {fullContent.stepByStep.map((s, i) => (
                  <li key={i} className="rounded-xl border border-border/60 bg-background p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
                      <p className="font-medium text-foreground">{s.action}</p>
                    </div>
                    <dl className="mt-2 grid grid-cols-1 gap-1.5 pl-7 text-[12px] text-muted-foreground sm:grid-cols-2">
                      <div><dt className="inline font-semibold text-foreground/70">Look for: </dt><dd className="inline">{s.lookFor}</dd></div>
                      <div><dt className="inline font-semibold text-foreground/70">Owner: </dt><dd className="inline">{s.owner}</dd></div>
                      {s.escalation && (
                        <div className="sm:col-span-2"><dt className="inline font-semibold text-amber-700">Escalate when: </dt><dd className="inline">{s.escalation}</dd></div>
                      )}
                    </dl>
                    {(() => {
                      const shots: SDScreenshotAsset[] = [];
                      if (s.screenshotId) {
                        const a = getStateDirectorScreenshotById(s.screenshotId);
                        if (a) shots.push(a);
                      }
                      for (const a of stepScreenshots) {
                        if (a.stepIndex === i && !shots.includes(a)) shots.push(a);
                      }
                      if (shots.length === 0) return null;
                      return (
                        <div className="mt-3 space-y-2 pl-7">
                          {shots.map((shot) => (
                            <SDScreenshotCard key={shot.id} asset={shot} />
                          ))}
                        </div>
                      );
                    })()}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Workflow content */}
          {flow && (
            <div data-testid="sd-workflow-content" className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Workflow · {flow.label}</h3>
              </div>
              <div className="mt-4 -mx-1 flex flex-wrap items-center gap-y-3 overflow-x-auto pb-1">
                {flow.steps.map((step, idx) => (
                  <div key={step} className="flex items-center">
                    <div className="rounded-2xl border border-border/70 bg-background px-3 py-2 text-[12.5px] font-medium text-foreground">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">{String(idx + 1).padStart(2, "0")}</span>
                      {step}
                    </div>
                    {idx < flow.steps.length - 1 && <ChevronRight className="mx-1.5 h-4 w-4 shrink-0 text-muted-foreground/70" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOP detail */}
          {fullContent && (
            <div data-testid="sd-sop" className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">SOP</h3>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Purpose</p>
                  <p className="mt-1 text-foreground/90">{fullContent.sop.purpose}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Owner</p>
                  <p className="mt-1 text-foreground/90">{fullContent.sop.owner}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inputs</p>
                  <ul className="mt-1 list-disc pl-5 text-foreground/90">
                    {fullContent.sop.inputs.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Process</p>
                  <ol className="mt-1 list-decimal pl-5 text-foreground/90 space-y-0.5">
                    {fullContent.sop.process.map((x, i) => <li key={i}>{x}</li>)}
                  </ol>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Escalation triggers</p>
                  <ul className="mt-1 list-disc pl-5 text-foreground/90">
                    {fullContent.sop.escalationTriggers.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quality standard</p>
                  <p className="mt-1 text-foreground/90">{fullContent.sop.qualityStandard}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">State Director review rhythm</p>
                  <p className="mt-1 text-foreground/90">{fullContent.sop.reviewRhythm}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scenario practice */}
          {fullContent && (
            <div data-testid="sd-scenario" className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Scenario practice</h3>
              </div>
              <div className="mt-3 space-y-3 text-[13px]">
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Situation</p>
                  <p className="mt-1 text-foreground/90">{fullContent.scenario.situation}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your prompt</p>
                  <p className="mt-1 text-foreground/90">{fullContent.scenario.prompt}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expected response</p>
                    <Button size="sm" variant="ghost" onClick={() => setShowExpected((v) => !v)} data-testid="sd-scenario-toggle">
                      {showExpected ? "Hide" : "Reveal"}
                    </Button>
                  </div>
                  {showExpected && (
                    <p data-testid="sd-scenario-expected" className="mt-2 text-foreground/90">{fullContent.scenario.expectedResponse}</p>
                  )}
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Escalation path</p>
                  <p className="mt-1 text-foreground/90">{fullContent.scenario.escalationPath}</p>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge check */}
          <div data-testid="sd-knowledge-check" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Knowledge check</h3>
            </div>
            <div className="mt-3 space-y-3">
              {quizQs.map((q, qi) => (
                <div key={q.id} className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[13px] font-medium">{qi + 1}. {q.question}</p>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, i) => {
                      const selected = answers[q.id] === i;
                      const isCorrect = submitted && i === q.answerIndex;
                      const isWrong = submitted && selected && i !== q.answerIndex;
                      return (
                        <button
                          key={i}
                          onClick={() => setAnswers({ ...answers, [q.id]: i })}
                          disabled={submitted}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-left text-[12.5px] transition",
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
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11.5px] text-muted-foreground">
                {submitted
                  ? `Saved score: ${Math.round((quizQs.filter((q) => answers[q.id] === q.answerIndex).length / quizQs.length) * 100)}%`
                  : "Choose answers and submit. Score is logged to your enrollment."}
              </p>
              <Button size="sm" onClick={handleSubmitQuiz} disabled={submitted || Object.keys(answers).length < quizQs.length}>
                Submit
              </Button>
            </div>
          </div>

          {/* Notes / reflection */}
          <div data-testid="sd-notes" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Notes & reflection</h3>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What surprised you? What would you do differently when you own a state?"
              rows={4}
              className="mt-3"
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={busy !== null}>
                {busy === "notes" ? "Saving…" : "Save reflection"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right rail — Resources + Signoff */}
        <aside className="space-y-4">
          <SdMappedSopCard moduleId={training.id} />
          <div data-testid="sd-resources" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Resources</h3>
            </div>
            <div className="mt-3 space-y-2 text-[12.5px]">
              {(training.resources ?? []).length === 0 && (
                <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-3 text-[12px] text-muted-foreground">
                  Attachment pending — this resource will appear here once published.
                </p>
              )}
              {(training.resources ?? []).map((r) =>
                isPendingResource(r) ? (
                  <div key={r.id} data-testid="resource-pending" className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                    <p className="font-medium text-foreground/80">{r.title}</p>
                    <p className="text-[11px]">Attachment pending — this resource will appear once published.</p>
                  </div>
                ) : (
                  <a
                    key={r.id}
                    href={r.url}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 hover:bg-muted/40"
                  >
                    <span className="inline-flex items-center gap-2">
                      {r.type === "PDF" ? <Download className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                      {r.title}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                  </a>
                ),
              )}
              <Link
                to="/resource-library"
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2 hover:bg-muted/40"
              >
                <span className="inline-flex items-center gap-2">
                  <Library className="h-3.5 w-3.5" />
                  Open Resource Library
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          <div data-testid="sd-signoff" className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Completion evidence</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px]">
              <SignoffRow label="Started" done={!!dbProgress?.started_at || dbProgress?.status === "in_progress"} />
              <SignoffRow label="Knowledge check submitted" done={submitted} />
              <SignoffRow label="Reflection captured" done={!!notes.trim()} />
              <SignoffRow
                label={requiresMentorSignoff ? "Mentor signoff" : "Mentor signoff (not required)"}
                done={requiresMentorSignoff ? hasSignoff : true}
              />
              <SignoffRow label="Module marked complete" done={completed} />
            </ul>
            {requiresMentorSignoff && !hasSignoff && (
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                Ask your mentor to log a check-in or shadow signoff before this module is considered complete.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function SignoffRow({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg px-2 py-1">
      <span className="text-foreground/90">{label}</span>
      <span className={cn("inline-flex items-center gap-1 text-[11px]", done ? "text-emerald-600" : "text-muted-foreground")}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        {done ? "Done" : "Pending"}
      </span>
    </li>
  );
}

/**
 * Surfaces the SOP mapped to this State Director module from
 * `stateDirectorModuleSopMap`. Resolves the live Resource Library row by
 * normalized title match. Always renders a calm state — never a hash link.
 */
function SdMappedSopCard({ moduleId }: { moduleId: string }) {
  const sopTitle = getSopTitleForModule(moduleId);
  const { resources } = useLibraryResources();
  if (!sopTitle) return null;
  const resource = findResourceForSopTitle(resources, sopTitle);
  const hasUsableUrl = !!(resource?.url || resource?.fileUrl);
  const hasStoragePath = !!resource?.storagePath;
  const isPublishedRecord =
    !!resource &&
    resource.uploadStatus === "published" &&
    resource.status !== "Archived" &&
    resource.attachmentStatus !== "pending_upload";
  const isOpenable = isPublishedRecord && (hasUsableUrl || hasStoragePath);
  const needsFileRepair = isPublishedRecord && !hasUsableUrl && !hasStoragePath;
  const isPending = !!resource && !isOpenable && !needsFileRepair;

  const status: "published" | "needs_file_repair" | "pending" | "missing" = isOpenable
    ? "published"
    : needsFileRepair
      ? "needs_file_repair"
      : isPending
        ? "pending"
        : "missing";

  const handleOpen = async () => {
    if (!resource) return;
    // External URL — open directly.
    if (resource.url && /^https?:\/\//i.test(resource.url)) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (resource.fileUrl && /^https?:\/\//i.test(resource.fileUrl)) {
      window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const signed = await resolveResourceOpenUrl(resource);
    if (signed) {
      window.open(signed, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Could not open SOP — please try again or contact Training Management.");
    }
  };

  return (
    <div
      data-testid="sd-mapped-sop"
      data-sop-status={status}
      className="rounded-2xl border border-border/70 bg-card p-5"
    >
      <div className="flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mapped SOP
        </h3>
      </div>
      <p className="mt-2 text-[13.5px] font-medium text-foreground">{sopTitle}</p>
      {isOpenable ? (
        <button
          type="button"
          onClick={handleOpen}
          data-testid="sd-mapped-sop-open"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-[12.5px] font-medium hover:bg-muted/40"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open SOP
        </button>
      ) : needsFileRepair ? (
        <p
          data-testid="sd-mapped-sop-needs-repair"
          className="mt-3 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/60 px-3 py-2 text-[12px] text-amber-900"
        >
          SOP record exists, file link missing — ask Training Management to repair the upload.
        </p>
      ) : isPending ? (
        <p
          data-testid="sd-mapped-sop-pending"
          className="mt-3 rounded-xl border border-dashed border-amber-300/60 bg-amber-50/60 px-3 py-2 text-[12px] text-amber-900"
        >
          SOP upload pending — continue with the written guidance and mentor review.
        </p>
      ) : (
        <p
          data-testid="sd-mapped-sop-missing"
          className="mt-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground"
        >
          SOP not linked yet — your mentor can review this live.
        </p>
      )}
    </div>
  );
}