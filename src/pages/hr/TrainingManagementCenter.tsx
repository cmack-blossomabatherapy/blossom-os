import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Sparkles,
  Upload,
  Users,
  GraduationCap,
  Layers,
  FileText,
  Play,
  ListChecks,
  FolderOpen,
  CheckCircle2,
  PenSquare,
  Wand2,
  ArrowRight,
  Clock,
  MoreHorizontal,
  Lightbulb,
  Compass,
  PlayCircle,
  BookOpen,
  Workflow as WorkflowIcon,
} from "lucide-react";
import {
  trainingJourneys,
  trainingModules,
  trainingSops,
  trainingTangos,
  trainingAssignments,
  trainingCategories,
  trainingTemplates,
  formatRelative,
  ROLE_LABEL,
  type ModuleType,
  type TrainingStatus,
  type TrainingModule,
  type TrainingJourney,
} from "@/lib/hr/trainingCenterData";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";
import { useJourneyOverrides, applyOverridesToPhase } from "@/hooks/useJourneyOverrides";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

type NavId =
  | "journeys"
  | "modules"
  | "onboarding"
  | "sops"
  | "tangos"
  | "assignments"
  | "categories"
  | "drafts"
  | "published"
  | "ai";

const NAV: { id: NavId; label: string; icon: typeof FileText }[] = [
  { id: "journeys", label: "Journeys", icon: Compass },
  { id: "modules", label: "Modules", icon: Layers },
  { id: "onboarding", label: "Welcome to Blossom", icon: Heart },
  { id: "sops", label: "SOPs", icon: FileText },
  { id: "tangos", label: "Tango Walkthroughs", icon: PlayCircle },
  { id: "assignments", label: "Assignments", icon: Users },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "drafts", label: "Drafts", icon: PenSquare },
  { id: "published", label: "Published", icon: CheckCircle2 },
  { id: "ai", label: "AI Suggestions", icon: Sparkles },
];

const TYPE_ICON: Record<ModuleType, typeof FileText> = {
  SOP: FileText,
  Workflow: WorkflowIcon,
  Tango: Play,
  Video: Play,
  Checklist: ListChecks,
  "Quick Guide": BookOpen,
  "Resource Collection": FolderOpen,
};

const STATUS_STYLE: Record<TrainingStatus, string> = {
  Draft: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "In Review": "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Archived: "border-border/70 bg-muted text-muted-foreground",
};

const AI_SUGGESTIONS = [
  "Summarize this SOP into a 5-step checklist.",
  "Create a checklist from this workflow.",
  "Suggest learning objectives for the State Director Journey.",
  "Find duplicate trainings across departments.",
  "Suggest role assignments for the VOB Basics module.",
  "Recommend related modules to add to the Intake Journey.",
];

export default function TrainingManagementCenter() {
  const [search] = useSearchParams();
  const [nav, setNav] = useState<NavId>("journeys");
  const [query, setQuery] = useState("");
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(search.get("action") === "create");
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [createJourneyOpen, setCreateJourneyOpen] = useState(
    search.get("action") === "journey",
  );
  const [uploadSopOpen, setUploadSopOpen] = useState(
    search.get("action") === "upload",
  );
  const [assignOpen, setAssignOpen] = useState(search.get("action") === "assign");

  const selectedJourney = useMemo(
    () => trainingJourneys.find((j) => j.id === selectedJourneyId) ?? null,
    [selectedJourneyId],
  );

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trainingModules;
    return trainingModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <OSShell>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_1fr_300px]">
        {/* LEFT NAV */}
        <aside className="hidden xl:block">
          <nav className="sticky top-4 space-y-0.5 rounded-2xl border border-border/70 bg-card p-2">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = nav === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setNav(n.id);
                    setSelectedJourneyId(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/75 hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 truncate font-medium">{n.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTER */}
        <main className="min-w-0 space-y-8">
          {/* Header */}
          <header>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  HR Suite · Training
                </p>
                <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground md:text-[30px]">
                  Training Management Center
                </h1>
                <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
                  Build journeys, modules, SOPs, and operational learning paths
                  across Blossom.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCreateModuleOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Training
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCreateJourneyOpen(true)}
                >
                  <Compass className="mr-1.5 h-3.5 w-3.5" /> Create Journey
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setUploadSopOpen(true)}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload SOP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setAssignOpen(true)}
                >
                  <Users className="mr-1.5 h-3.5 w-3.5" /> Assign
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setAiOpen(true)}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Generate
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-5 max-w-xl">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2.25}
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search journeys, modules, SOPs, Tangos…"
                className="os-glass-input h-11 rounded-2xl pl-11 text-[13.5px]"
              />
            </div>
          </header>

          {/* Content by nav */}
          {nav === "journeys" && !selectedJourney && (
            <JourneysView
              journeys={trainingJourneys}
              onSelect={setSelectedJourneyId}
            />
          )}
          {nav === "journeys" && selectedJourney && (
            <JourneyBuilderView
              journey={selectedJourney}
              onBack={() => setSelectedJourneyId(null)}
            />
          )}
          {nav === "modules" && <ModulesGrid modules={filteredModules} />}
          {nav === "sops" && <SopsList />}
          {nav === "tangos" && <TangosGrid />}
          {nav === "assignments" && <AssignmentsTable />}
          {nav === "categories" && <CategoriesGrid />}
          {nav === "drafts" && (
            <ModulesGrid
              modules={filteredModules.filter((m) => m.status === "Draft")}
              emptyLabel="No drafts. Create a training to get started."
            />
          )}
          {nav === "published" && (
            <ModulesGrid
              modules={filteredModules.filter((m) => m.status === "Published")}
              emptyLabel="Nothing published yet."
            />
          )}
          {nav === "ai" && <AISuggestionsView />}

          {/* Templates strip */}
          <section className="rounded-2xl border border-border/70 bg-muted/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">
                  Create from template
                </h3>
                <p className="text-[12.5px] text-muted-foreground">
                  Skip the blank page — start from a proven module shape.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {trainingTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    toast.success(`Started new ${t.title}`);
                    setCreateModuleOpen(true);
                  }}
                  className="rounded-xl border border-border/60 bg-background px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <p className="text-[12.5px] font-medium text-foreground">
                    {t.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </main>

        {/* RIGHT RAIL */}
        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <AIAssistantPanel />
            <ProgressPanel />
          </div>
        </aside>
      </div>

      <AIGenerateDialog open={aiOpen} onOpenChange={setAiOpen} />
      <CreateModuleDialog
        open={createModuleOpen}
        onOpenChange={setCreateModuleOpen}
      />
      <CreateJourneyDialog
        open={createJourneyOpen}
        onOpenChange={setCreateJourneyOpen}
      />
      <UploadSopDialog open={uploadSopOpen} onOpenChange={setUploadSopOpen} />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </OSShell>
  );
}

/* ----------------------- VIEWS ----------------------- */

function JourneysView({
  journeys,
  onSelect,
}: {
  journeys: TrainingJourney[];
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold tracking-tight">Role journeys</h2>
      <p className="text-[13px] text-muted-foreground">
        The backbone of operational enablement — one journey per role.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {journeys.map((j) => (
          <button
            key={j.id}
            onClick={() => onSelect(j.id)}
            className="group rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_-16px_hsl(265_60%_50%/0.25)]"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABEL[j.role]}
                </p>
                <h3 className="mt-0.5 text-[15.5px] font-semibold tracking-tight text-foreground">
                  {j.title}
                </h3>
              </div>
              <Badge variant="outline" className={STATUS_STYLE[j.status]}>
                {j.status}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
              {j.description}
            </p>
            <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{j.moduleIds.length} modules</span>
              <span>{j.assignedCount} assigned</span>
              <span>Updated {formatRelative(j.updatedAt)}</span>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium text-foreground">
                  {j.completionPct}%
                </span>
              </div>
              <Progress value={j.completionPct} className="h-1.5" />
            </div>
            <div className="mt-3 flex items-center text-[12.5px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open builder <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function JourneyBuilderView({
  journey,
  onBack,
}: {
  journey: TrainingJourney;
  onBack: () => void;
}) {
  const modules = journey.moduleIds
    .map((id) => trainingModules.find((m) => m.id === id))
    .filter(Boolean) as TrainingModule[];

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          ← All journeys
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Assign
          </Button>
          <Button size="sm" className="rounded-xl">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add module
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {ROLE_LABEL[journey.role]} · {journey.category}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
              {journey.title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">
              {journey.description}
            </p>
          </div>
          <Badge variant="outline" className={STATUS_STYLE[journey.status]}>
            {journey.status}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <Stat label="Modules" value={String(modules.length)} />
          <Stat label="Assigned" value={String(journey.assignedCount)} />
          <Stat label="Completion" value={`${journey.completionPct}%`} />
        </div>
      </div>

      <div>
        <h3 className="text-[14px] font-semibold tracking-tight">
          Modules in this journey
        </h3>
        <p className="text-[12.5px] text-muted-foreground">
          Drag to reorder · click to edit content.
        </p>
        <ol className="mt-4 space-y-2">
          {modules.map((m, idx) => {
            const Icon = TYPE_ICON[m.type] ?? FileText;
            return (
              <li
                key={m.id}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/30"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-[12px] font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {m.title}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {m.type} · {m.estimatedMinutes} min · {m.category}
                  </p>
                </div>
                <Badge variant="outline" className={STATUS_STYLE[m.status]}>
                  {m.status}
                </Badge>
                <button
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                  aria-label="Module actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => toast.info("Module picker coming soon")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/30 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add module to journey
            </button>
          </li>
        </ol>
      </div>
    </section>
  );
}

function ModulesGrid({
  modules,
  emptyLabel,
}: {
  modules: TrainingModule[];
  emptyLabel?: string;
}) {
  if (!modules.length) {
    return (
      <EmptyState label={emptyLabel ?? "No modules match your search."} />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => {
        const Icon = TYPE_ICON[m.type] ?? FileText;
        return (
          <div
            key={m.id}
            className="rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <Badge variant="outline" className={STATUS_STYLE[m.status]}>
                {m.status}
              </Badge>
            </div>
            <h3 className="mt-3 text-[14.5px] font-semibold tracking-tight text-foreground">
              {m.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[12.5px] text-muted-foreground">
              {m.description}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>{m.type}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {m.estimatedMinutes} min
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>{m.category}</span>
              <span>Updated {formatRelative(m.updatedAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SopsList() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-[14.5px] font-semibold tracking-tight">SOPs</h2>
          <p className="text-[12.5px] text-muted-foreground">
            The connective tissue between training and workflows.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload SOP
        </Button>
      </div>
      <ul className="divide-y divide-border/60">
        {trainingSops.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-5 py-4">
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-foreground">{s.title}</p>
              <p className="text-[12px] text-muted-foreground">
                {s.department} · {s.owner} · {s.version} · Updated{" "}
                {formatRelative(s.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-muted-foreground">
                {s.linkedModuleIds.length} linked
              </span>
              <Button variant="ghost" size="sm" className="rounded-lg text-[12.5px]">
                Open
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TangosGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {trainingTangos.map((t) => (
        <a
          key={t.id}
          href={t.url}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <PlayCircle className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-[14.5px] font-semibold tracking-tight text-foreground">
            {t.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {t.durationMinutes} min walkthrough
          </p>
          <p className="mt-3 text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Open in Tango →
          </p>
        </a>
      ))}
    </div>
  );
}

function AssignmentsTable() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-[14.5px] font-semibold tracking-tight">Assignments</h2>
          <p className="text-[12.5px] text-muted-foreground">
            What's assigned, to whom, and how it's tracking.
          </p>
        </div>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-border/60 text-[11.5px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Training</th>
            <th className="px-3 py-3 font-medium">Scope</th>
            <th className="px-3 py-3 font-medium">Target</th>
            <th className="px-3 py-3 font-medium">Assigned</th>
            <th className="px-3 py-3 font-medium">Completed</th>
            <th className="px-3 py-3 font-medium">Overdue</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {trainingAssignments.map((a) => (
            <tr key={a.id} className="hover:bg-muted/40">
              <td className="px-5 py-3 font-medium text-foreground">
                {a.trainingTitle}
              </td>
              <td className="px-3 py-3 capitalize text-muted-foreground">
                {a.scope}
              </td>
              <td className="px-3 py-3 text-muted-foreground">{a.target}</td>
              <td className="px-3 py-3 text-foreground">{a.assigned}</td>
              <td className="px-3 py-3 text-foreground">{a.completed}</td>
              <td className="px-3 py-3">
                {a.overdue > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-destructive"
                  >
                    {a.overdue}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <Button variant="ghost" size="sm" className="rounded-lg text-[12.5px]">
                  Manage
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {trainingCategories.map((c) => {
        const count = trainingModules.filter((m) => m.category === c).length;
        return (
          <div
            key={c}
            className="rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
          >
            <p className="text-[13.5px] font-semibold tracking-tight text-foreground">
              {c}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {count} {count === 1 ? "module" : "modules"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AISuggestionsView() {
  const suggestions = [
    {
      title: "Add 'Cancellation Handling' to Intake Journey",
      reason:
        "Cancellation volume is rising in GA — your intake journey doesn't cover this workflow yet.",
    },
    {
      title: "Merge two QA modules",
      reason: "PR Workflow & QA Review and PR Review SOP cover ~70% of the same content.",
    },
    {
      title: "Promote 'Staffing Management' to required for State Directors",
      reason: "Currently optional but referenced in 4 other modules.",
    },
    {
      title: "Generate checklist from VOB SOP",
      reason: "Your VOB SOP is dense — a 5-step checklist would help intake act faster.",
    },
  ];
  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <div
          key={s.title}
          className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-5"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold tracking-tight text-foreground">
              {s.title}
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {s.reason}
            </p>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl">
            Apply
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ----------------------- RIGHT RAIL ----------------------- */

function AIAssistantPanel() {
  const [input, setInput] = useState("");
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(285_85%_70%)] text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[13px] font-semibold tracking-tight">
            AI Training Assistant
          </p>
          <p className="text-[11.5px] text-muted-foreground">
            Operational copilot for builders.
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {AI_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="w-full rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5 text-left text-[11.5px] text-foreground/80 transition-colors hover:border-primary/30 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask the assistant…"
        className="mt-3 min-h-[64px] resize-none rounded-xl text-[12.5px]"
      />
      <Button
        size="sm"
        className="mt-2 w-full rounded-xl"
        onClick={() => {
          if (!input.trim()) return;
          toast.success("AI assistant queued (mock).");
          setInput("");
        }}
      >
        <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Ask Blossom
      </Button>
    </div>
  );
}

function ProgressPanel() {
  const totalAssigned = trainingAssignments.reduce((s, a) => s + a.assigned, 0);
  const totalCompleted = trainingAssignments.reduce((s, a) => s + a.completed, 0);
  const overdue = trainingAssignments.reduce((s, a) => s + a.overdue, 0);
  const pct = Math.round((totalCompleted / Math.max(totalAssigned, 1)) * 100);
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[13px] font-semibold tracking-tight">Library health</p>
      <p className="text-[11.5px] text-muted-foreground">
        Across all journeys and modules.
      </p>
      <div className="mt-4 space-y-3">
        <MiniStat label="Completion" value={`${pct}%`} progress={pct} />
        <MiniStat
          label="Overdue"
          value={String(overdue)}
          tone={overdue > 0 ? "amber" : "default"}
        />
        <MiniStat
          label="Drafts"
          value={String(trainingModules.filter((m) => m.status === "Draft").length)}
        />
        <MiniStat
          label="Published"
          value={String(
            trainingModules.filter((m) => m.status === "Published").length,
          )}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  progress,
  tone,
}: {
  label: string;
  value: string;
  progress?: number;
  tone?: "amber" | "default";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-semibold tracking-tight",
            tone === "amber" ? "text-amber-600 dark:text-amber-300" : "text-foreground",
          )}
        >
          {value}
        </span>
      </div>
      {typeof progress === "number" && (
        <Progress value={progress} className="mt-1.5 h-1" />
      )}
    </div>
  );
}

/* ----------------------- HELPERS ----------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center">
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ----------------------- DIALOGS ----------------------- */

function AIGenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [generated, setGenerated] = useState<null | {
    title: string;
    objectives: string[];
    checklist: string[];
    summary: string;
    suggestedJourney: string;
  }>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!input.trim()) {
      toast.error("Paste an SOP, transcript, or workflow first.");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setGenerated({
        title: "Verification of Benefits (VOB) Workflow",
        objectives: [
          "Read a benefits sheet and identify risk flags",
          "Decide when to escalate to the VOB Decision Center",
          "Document VOB outcomes cleanly in CentralReach",
        ],
        checklist: [
          "Collect insurance details from the lead",
          "Run VOB through Solum",
          "Flag any cost-share risk above $50",
          "Route to BCBA review if authorization is uncertain",
          "Log VOB result and notify intake",
        ],
        summary:
          "This SOP defines how Intake coordinators verify insurance benefits and escalate authorization risk before client setup.",
        suggestedJourney: "Intake Coordinator Journey",
      });
      setGenerating(false);
    }, 900);
  };

  const handleSave = () => {
    toast.success("Module draft saved to library.");
    onOpenChange(false);
    setInput("");
    setGenerated(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Generate Training
          </DialogTitle>
          <DialogDescription>
            Paste an SOP, meeting transcript, workflow notes, or a Tango link — AI
            will draft a training module for you to review.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste content here…"
          className="min-h-[140px] rounded-xl text-[13px]"
        />
        {generated && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Suggested title
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-foreground">
                {generated.title}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Summary
              </p>
              <p className="mt-0.5 text-[12.5px] text-foreground/85">
                {generated.summary}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Learning objectives
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12.5px] text-foreground/85">
                {generated.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Operational checklist
              </p>
              <ul className="mt-1 space-y-1 text-[12.5px] text-foreground/85">
                {generated.checklist.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />{" "}
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Suggested journey:{" "}
              <span className="font-medium text-foreground">
                {generated.suggestedJourney}
              </span>
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          {!generated ? (
            <Button
              className="rounded-xl"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Generating…" : "Generate draft"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setGenerated(null)}
              >
                Regenerate
              </Button>
              <Button className="rounded-xl" onClick={handleSave}>
                Save as draft
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateModuleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create training module</DialogTitle>
          <DialogDescription>
            Start a new module — pick a type and add sections in the builder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-medium text-muted-foreground">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Running a Clean VOB"
              className="mt-1 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["SOP", "Workflow", "Tango", "Video", "Checklist", "Quick Guide"] as ModuleType[]).map(
              (t) => (
                <button
                  key={t}
                  className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-left text-[12.5px] hover:border-primary/40"
                >
                  {t}
                </button>
              ),
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            className="rounded-xl"
            onClick={() => {
              if (!title.trim()) return toast.error("Add a title");
              toast.success("Module created as draft");
              onOpenChange(false);
              setTitle("");
            }}
          >
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateJourneyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create role journey</DialogTitle>
          <DialogDescription>
            Journeys group modules into a learning path for one role.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Authorizations Journey"
          className="rounded-xl"
        />
        <DialogFooter>
          <Button
            className="rounded-xl"
            onClick={() => {
              if (!title.trim()) return toast.error("Add a title");
              toast.success("Journey created as draft");
              onOpenChange(false);
              setTitle("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadSopDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload SOP</DialogTitle>
          <DialogDescription>
            Drop a file or link — AI will summarize and connect it to modules.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-10 text-center">
          <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-[13px] text-muted-foreground">
            Drag and drop a PDF, DOCX, or link.
          </p>
        </div>
        <DialogFooter>
          <Button
            className="rounded-xl"
            onClick={() => {
              toast.success("SOP queued for processing");
              onOpenChange(false);
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign training</DialogTitle>
          <DialogDescription>
            Assign a journey or module to a role, department, state, or individual.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {["Role", "Department", "State", "Employee"].map((s) => (
            <button
              key={s}
              className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-left text-[12.5px] hover:border-primary/40"
            >
              {s}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            className="rounded-xl"
            onClick={() => {
              toast.success("Assignment created");
              onOpenChange(false);
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}