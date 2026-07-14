import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { SD_SOP_MANIFEST } from "@/lib/resources/stateDirectorSopManifest";
import { computeSdSopCoverageFromResources } from "@/lib/resources/sdSopCoverage";
import { useAdminResources } from "@/hooks/useAdminResources";
import { ControlRoomActivityDashboard } from "@/components/training/ControlRoomActivityDashboard";
import {
  SD_PRIORITY_SCREENSHOT_MODULES,
  getStateDirectorScreenshots,
} from "@/lib/training/stateDirectorFullTraining";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  Lightbulb,
  Compass,
  PlayCircle,
  BookOpen,
  Workflow as WorkflowIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Library,
  Mail,
} from "lucide-react";
import {
  trainingAssignments,
  trainingCategories,
  trainingTemplates,
  formatRelative,
  type ModuleType,
  type TrainingStatus,
  type TrainingAssignment,
} from "@/lib/hr/trainingCenterData";
import {
  useAcademy,
  addModuleToJourney,
  removeModuleFromJourney,
  reorderJourneyModule,
  createTraining,
  type Training,
  type RoleJourney,
} from "@/lib/training/academyData";
import { ONBOARDING_PHASES } from "@/lib/onboarding/journey";
import { useJourneyOverrides, applyOverridesToPhase } from "@/hooks/useJourneyOverrides";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import { ResourceAttachmentManager } from "@/components/training/ResourceAttachmentManager";
import { BlossomAIButton } from "@/components/ai/BlossomAIAssistant";
import { RoleJourneyAssignmentsView } from "@/components/training/RoleJourneyAssignmentsView";
import {
  JourneyMetaEditor,
  ModuleEditDialog,
  CreateModuleDialogReal,
  CreateJourneyDialogReal,
} from "@/components/training/management/JourneyEditors";
import {
  SDLaunchReadinessPanel,
  SDDayOneAdminGuide,
  SDMentorCheckInGuide,
  SDScreenshotReadinessPanel,
} from "@/components/training/SDLaunchReadinessPanel";
import { SDDayOneAdminPanel } from "@/components/training/SDDayOneAdminPanel";
import { WelcomeReflectionsAdminPanel } from "@/components/training/WelcomeReflectionsAdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/roles";
import {
  computeSdScreenshotCoverage,
  computeSdWelcomeVideoState,
} from "@/lib/training/sdRuntimeReadiness";

/* ------- Local view-model adapters (Academy → Management Center) ------- */

type ViewModule = {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  category: string;
  estimatedMinutes: number;
  required: boolean;
  status: TrainingStatus;
  updatedAt: string;
  owner: string;
  tags: string[];
};

type ViewJourney = {
  id: string;
  title: string;
  description: string;
  role: string;
  category: string;
  status: TrainingStatus;
  moduleIds: string[];
  assignedCount: number;
  completionPct: number;
  updatedAt: string;
  owner: string;
};

const ACADEMY_ROLE_LABEL: Record<string, string> = {
  intake: "Intake Coordinator",
  state_director: "State Director",
  scheduling: "Scheduling",
  qa_team: "QA",
  recruiting_team: "Recruiting",
  bcba: "BCBA",
  rbt: "RBT",
  authorizations: "Authorizations",
  hr_team: "HR",
  billing_finance: "Billing & Finance",
  executive_leadership: "Executive Leadership",
  operations_leadership: "Operations Leadership",
  case_manager: "Case Manager",
};

function roleLabel(role: string): string {
  return ACADEMY_ROLE_LABEL[role] ?? role;
}

function roleCategory(role: string): string {
  if (role === "intake") return "Intake";
  if (role === "scheduling") return "Scheduling";
  if (role === "qa_team") return "QA";
  if (role === "recruiting_team") return "Recruiting";
  if (role === "bcba" || role === "rbt") return "Clinical";
  if (role === "authorizations") return "Authorizations";
  if (role === "hr_team") return "HR";
  if (role === "executive_leadership" || role === "operations_leadership" || role === "state_director") return "Leadership";
  if (role === "billing_finance") return "Operations";
  return "Operations";
}

function toViewModule(t: Training): ViewModule {
  const type: ModuleType =
    t.type === "Quick Guide" || t.type === "Tango" || t.type === "Video" ||
    t.type === "Letter" ||
    t.type === "SOP" || t.type === "Workflow" || t.type === "Checklist"
      ? t.type
      : "SOP";
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    type,
    category: t.department
      ? t.department.charAt(0).toUpperCase() + t.department.slice(1)
      : (t.category === "systems" ? "Systems & Software" : "Operations"),
    estimatedMinutes: t.estimatedMinutes,
    required: !!t.required,
    status: "Published",
    updatedAt: t.lastUpdated ?? new Date().toISOString().slice(0, 10),
    owner: t.owner ?? "",
    tags: [],
  };
}

function toViewJourney(j: RoleJourney): ViewJourney {
  return {
    id: j.id,
    title: j.title,
    description: j.tagline,
    role: j.role,
    category: roleCategory(j.role),
    status: "Published",
    moduleIds: j.moduleIds,
    assignedCount: 0,
    completionPct: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
    owner: "",
  };
}

type NavId =
  | "control-room"
  | "journeys"
  | "role-journeys"
  | "modules"
  | "onboarding"
  | "sops"
  | "resources"
  | "attachments"
  | "assignments"
  | "categories"
  | "drafts"
  | "published"
  | "ai";

const NAV: { id: NavId; label: string; icon: typeof FileText }[] = [
  { id: "control-room", label: "Control Room", icon: LayoutDashboard },
  { id: "journeys", label: "Journeys", icon: Compass },
  { id: "role-journeys", label: "Role Journeys", icon: Users },
  { id: "modules", label: "Modules", icon: Layers },
  { id: "onboarding", label: "Welcome to Blossom", icon: Heart },
  { id: "sops", label: "SOPs", icon: FileText },
  { id: "resources", label: "Resource Library", icon: Library },
  { id: "attachments", label: "Resource Attachments", icon: Library },
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
  Letter: Mail,
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

const RESOURCE_UPLOAD_ADMIN_ROLES: AppRole[] = [
  "admin", "training_admin", "hr", "hr_admin", "hr_manager", "ops_manager", "exec",
];

function useCanUploadResources() {
  const { isAdmin, roles } = useAuth();
  return isAdmin || roles.some((role) => RESOURCE_UPLOAD_ADMIN_ROLES.includes(role));
}

/* ---------- User-created assignments store (localStorage) ---------- */

const USER_ASSIGNMENTS_KEY = "blossom.training.userAssignments.v1";

function loadUserAssignments(): TrainingAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_ASSIGNMENTS_KEY);
    return raw ? (JSON.parse(raw) as TrainingAssignment[]) : [];
  } catch {
    return [];
  }
}

let userAssignments: TrainingAssignment[] = loadUserAssignments();
const userAssignmentListeners = new Set<() => void>();

function emitUserAssignments() {
  try {
    localStorage.setItem(USER_ASSIGNMENTS_KEY, JSON.stringify(userAssignments));
  } catch {
    /* ignore */
  }
  userAssignmentListeners.forEach((l) => l());
}

function addUserAssignment(a: TrainingAssignment) {
  userAssignments = [a, ...userAssignments];
  emitUserAssignments();
}

function useUserAssignments(): TrainingAssignment[] {
  const [list, setList] = useState<TrainingAssignment[]>(userAssignments);
  useEffect(() => {
    const l = () => setList([...userAssignments]);
    userAssignmentListeners.add(l);
    return () => {
      userAssignmentListeners.delete(l);
    };
  }, []);
  return list;
}

export default function TrainingManagementCenter() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const navParam = (search.get("nav") as NavId | null);
  const validNav = navParam && NAV.some((n) => n.id === navParam) ? navParam : null;
  const [nav, setNav] = useState<NavId>(validNav ?? "control-room");
  const [query, setQuery] = useState("");
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(search.get("action") === "create");
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [createModulePrefill, setCreateModulePrefill] = useState<
    Partial<Pick<Training, "title" | "description" | "type" | "category">> | undefined
  >(undefined);
  const [createJourneyOpen, setCreateJourneyOpen] = useState(
    search.get("action") === "journey",
  );
  const [assignOpen, setAssignOpen] = useState(search.get("action") === "assign");
  const canUploadResources = useCanUploadResources();

  // Keep `?nav=` in URL in sync when the user changes tabs.
  useEffect(() => {
    if (validNav && validNav !== nav) setNav(validNav);
  }, [validNav]); // eslint-disable-line

  // Legacy `?action=upload` used to open an inline upload dialog that
  // could white-screen on failure. Redirect to the canonical Resource
  // Management bulk upload panel instead.
  useEffect(() => {
    if (search.get("action") === "upload") {
      navigate("/hr/resource-management#bulk-upload", { replace: true });
    }
  }, [search, navigate]);

  // Live academy data — single source of truth shared with the Training Academy.
  const academy = useAcademy();
  const allModules = useMemo(() => academy.trainings.map(toViewModule), [academy.trainings]);
  const allJourneys = useMemo(() => academy.journeys.map(toViewJourney), [academy.journeys]);

  const selectedJourney = useMemo(
    () => allJourneys.find((j) => j.id === selectedJourneyId) ?? null,
    [allJourneys, selectedJourneyId],
  );

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allModules;
    return allModules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [allModules, query]);

  return (
    <OSShell>
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          nav === "control-room"
            ? "xl:grid-cols-[220px_1fr]"
            : "xl:grid-cols-[220px_1fr_300px]",
        )}
      >
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
          {/* Mobile / tablet nav (visible below xl) */}
          <div className="xl:hidden -mx-1 overflow-x-auto">
            <div className="flex gap-1.5 rounded-2xl border border-border/70 bg-card p-1.5 w-max min-w-full">
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
                      "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                  Assign, monitor, and fix training. Active trainees, launch readiness,
                  setup gaps, journeys, and admin actions in one calm workspace.
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
                {canUploadResources && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => navigate("/hr/resource-management#bulk-upload")}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Resource
                  </Button>
                )}
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
                <BlossomAIButton
                  surface="training"
                  title="Coverage coach"
                  hint="Admin coach for training coverage and gaps."
                  contextText={`Admin is reviewing training coverage in the Training Management Center. Active view: ${nav}. ${allJourneys.length} journeys, ${allModules.length} modules registered.`}
                  suggestions={[
                    "Summarize training progress by role",
                    "Which role journeys have missing resource links?",
                    "Which modules have no quiz or resource attached?",
                    "Who is overdue on required training?",
                    "Which roles have no assigned journey?",
                  ]}
                  guardrails={[
                    "Only report on data the admin can access",
                    "Do not expose learner quiz answers",
                    "Flag missing assignments and resource gaps clearly",
                  ]}
                  label="Ask coach"
                />
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
          {nav === "control-room" && (
            <div className="space-y-6" data-testid="training-control-room-wide">
              <ControlRoomActivityDashboard />
              <ControlRoomLaunchReadinessSection />
              <ControlRoomResourceAssetCoverageSection />
            </div>
          )}
          {nav === "journeys" && !selectedJourney && (
            <JourneysView
              journeys={allJourneys}
              onSelect={setSelectedJourneyId}
            />
          )}
          {nav === "role-journeys" && <RoleJourneyAssignmentsView />}
          {nav === "journeys" && selectedJourney && (
            <JourneyBuilderView
              journey={selectedJourney}
              allModules={allModules}
              onBack={() => setSelectedJourneyId(null)}
              onEditModule={(id) => setEditingModuleId(id)}
              onCreateModule={() => setCreateModuleOpen(true)}
              onAssign={() => setAssignOpen(true)}
              rawJourney={academy.journeys.find((j) => j.id === selectedJourney.id) ?? null}
            />
          )}
          {nav === "modules" && (
            <ModulesGrid
              modules={filteredModules}
              onEdit={(id) => setEditingModuleId(id)}
            />
          )}
          {nav === "onboarding" && <OnboardingView />}
          {nav === "sops" && <SopsList />}
          {nav === "resources" && <ResourceLibraryView />}
          {nav === "attachments" && <ResourceAttachmentManager />}
          {nav === "assignments" && <AssignmentsTable />}
          {nav === "categories" && <CategoriesGrid modules={allModules} />}
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
                    setCreateModulePrefill({
                      title: "",
                      description: t.description,
                      type: t.type as Training["type"],
                      category: "role",
                    });
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

        {/* RIGHT RAIL — hidden on Control Room to free up width */}
        {nav !== "control-room" && (
          <aside className="hidden xl:block">
            <div className="sticky top-4 space-y-4">
              <AIAssistantPanel />
              <ProgressPanel />
            </div>
          </aside>
        )}
      </div>

      <AIGenerateDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        onCreated={(t) => setEditingModuleId(t.id)}
      />
      <CreateModuleDialogReal
        open={createModuleOpen}
        onOpenChange={(v) => {
          setCreateModuleOpen(v);
          if (!v) setCreateModulePrefill(undefined);
        }}
        journeyId={selectedJourneyId}
        initial={createModulePrefill}
        onCreated={(t) => {
          // If we're inside a journey, the helper already added it.
          // Open editor for the newly-created module to encourage deep editing.
          setEditingModuleId(t.id);
        }}
      />
      <CreateJourneyDialogReal
        open={createJourneyOpen}
        onOpenChange={setCreateJourneyOpen}
        onCreated={(j) => {
          setNav("journeys");
          setSelectedJourneyId(j.id);
        }}
      />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} />
      {editingModuleId && (
        <ModuleEditDialog
          key={editingModuleId}
          training={
            academy.trainings.find((t) => t.id === editingModuleId) ?? {
              id: editingModuleId,
              title: "(deleted)",
              description: "",
              type: "SOP",
              estimatedMinutes: 10,
              category: "role",
            } as Training
          }
          onClose={() => setEditingModuleId(null)}
        />
      )}
    </OSShell>
  );
}

/* ----------------------- VIEWS ----------------------- */

function JourneysView({
  journeys,
  onSelect,
}: {
  journeys: ViewJourney[];
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
                  {roleLabel(j.role)}
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
              <span>{roleCategory(j.role)}</span>
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
  allModules,
  onBack,
  onEditModule,
  onCreateModule,
  onAssign,
  rawJourney,
}: {
  journey: ViewJourney;
  allModules: ViewModule[];
  onBack: () => void;
  onEditModule: (id: string) => void;
  onCreateModule: () => void;
  onAssign: () => void;
  rawJourney: RoleJourney | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const moduleMap = useMemo(() => {
    const map = new Map<string, ViewModule>();
    allModules.forEach((m) => map.set(m.id, m));
    return map;
  }, [allModules]);
  const modules = journey.moduleIds
    .map((id) => moduleMap.get(id))
    .filter(Boolean) as ViewModule[];
  const availableModules = allModules.filter((m) => !journey.moduleIds.includes(m.id));
  const missingCount = journey.moduleIds.length - modules.length;

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
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onAssign}>
            <Users className="mr-1.5 h-3.5 w-3.5" /> Assign
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onCreateModule}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New module
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => setPickerOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add module
          </Button>
        </div>
      </div>

      {rawJourney && <JourneyMetaEditor journey={rawJourney} />}

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {roleLabel(journey.role)} · {journey.category}
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
          <Stat label="Required" value={String(modules.filter((m) => m.required).length)} />
          <Stat label="Est. minutes" value={String(modules.reduce((s, m) => s + m.estimatedMinutes, 0))} />
        </div>
        {missingCount > 0 && (
          <p className="mt-3 text-[12px] text-amber-600 dark:text-amber-400">
            {missingCount} module{missingCount === 1 ? "" : "s"} in this journey can't be found in the library — they may have been deleted.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-[14px] font-semibold tracking-tight">
          Modules in this journey
        </h3>
        <p className="text-[12.5px] text-muted-foreground">
          Reorder with the arrows · open a module to edit its content in the builder.
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
                <Link
                  to={`/training/${m.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-[13.5px] font-medium text-foreground">
                    {m.title}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {m.type} · {m.estimatedMinutes} min · {m.category}
                  </p>
                </Link>
                <Badge variant="outline" className={STATUS_STYLE[m.status]}>
                  {m.status}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => reorderJourneyModule(journey.id, idx, idx - 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === modules.length - 1}
                    onClick={() => reorderJourneyModule(journey.id, idx, idx + 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditModule(m.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label="Edit module"
                    title="Edit module content"
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeModuleFromJourney(journey.id, m.id);
                      toast.success(`Removed "${m.title}" from journey`);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-destructive/80 hover:bg-destructive/10"
                    aria-label="Remove from journey"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/30 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add module to journey
            </button>
          </li>
        </ol>
      </div>

      <AddModuleToJourneyDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        available={availableModules}
        onPick={(moduleId, moduleTitle) => {
          addModuleToJourney(journey.id, moduleId);
          toast.success(`Added "${moduleTitle}" to journey`);
        }}
      />
    </section>
  );
}

function ModulesGrid({
  modules,
  emptyLabel,
  onEdit,
}: {
  modules: ViewModule[];
  emptyLabel?: string;
  onEdit?: (id: string) => void;
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
          <button
            key={m.id}
            type="button"
            onClick={() => onEdit?.(m.id)}
            className="rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
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
            {onEdit && (
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
                <PenSquare className="h-3 w-3" /> Edit module
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SopsList() {
  const navigate = useNavigate();
  const canUploadResources = useCanUploadResources();
  const { resources, loading, error } = useAdminResources();
  const [query, setQuery] = useState("");

  const sops = useMemo(() => {
    return resources.filter(
      (r) =>
        r.type === "SOP" ||
        r.resourceType === "sop" ||
        /\bsop\b/i.test(r.title),
    );
  }, [resources]);

  const docs = useMemo(() => {
    return resources.filter(
      (r) =>
        !(r.type === "SOP" || r.resourceType === "sop" || /\bsop\b/i.test(r.title)),
    );
  }, [resources]);

  const q = query.trim().toLowerCase();
  const filteredSops = q
    ? sops.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : sops;

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h2 className="text-[14.5px] font-semibold tracking-tight">
            SOPs <span className="text-muted-foreground font-normal">· {sops.length} live · {docs.length} other docs</span>
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            The connective tissue between training and workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SOPs…"
            className="h-8 w-56 rounded-lg text-[12.5px]"
          />
          {canUploadResources && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate("/hr/resource-management#bulk-upload")}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Resource
            </Button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="px-5 py-8 text-center text-[12.5px] text-muted-foreground">Loading SOPs…</div>
      ) : error ? (
        <div className="px-5 py-8 text-center text-[12.5px] text-destructive">{error}</div>
      ) : filteredSops.length === 0 ? (
        <div className="px-5 py-10 text-center text-[12.5px] text-muted-foreground">
          {sops.length === 0
            ? "No SOPs uploaded yet. Use Resource Management to upload."
            : "No SOPs match that search."}
        </div>
      ) : (
        <ul className="divide-y divide-border/60 max-h-[640px] overflow-auto">
          {filteredSops.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 pr-4">
                <p className="truncate text-[13.5px] font-medium text-foreground">{s.title}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {(s.departments?.[0] ?? s.category)} · {s.uploadedBy} · {s.status}
                  {s.states.length > 0 ? ` · ${s.states.slice(0, 3).join(", ")}` : ""}
                  {" · Updated "}
                  {formatRelative(s.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11.5px] text-muted-foreground">
                  {s.roles.length} role{s.roles.length === 1 ? "" : "s"}
                </span>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="rounded-lg text-[12.5px]">Open</Button>
                  </a>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-[12.5px]"
                    onClick={() => navigate("/hr/resource-management")}
                  >
                    Open
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignmentsTable() {
  const userList = useUserAssignments();
  const all = [...userList, ...trainingAssignments];
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
          {all.map((a) => (
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

function CategoriesGrid({ modules }: { modules: ViewModule[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {trainingCategories.map((c) => {
        const count = modules.filter((m) => m.category === c).length;
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

function OnboardingView() {
  const { phaseOverrides, moduleOverrides, refresh } = useJourneyOverrides();
  const baseWelcome = ONBOARDING_PHASES.find((p) => p.id === "welcome")!;
  const welcome = applyOverridesToPhase(baseWelcome, phaseOverrides, moduleOverrides);
  const customized = baseWelcome.modules.filter(
    (m) => moduleOverrides[`welcome:${m.key}`],
  ).length + (phaseOverrides["welcome"] ? 1 : 0);

  // Local drafts for inline editing
  const [drafts, setDrafts] = useState<Record<string, { title: string; blurb: string }>>(() => {
    const init: Record<string, { title: string; blurb: string }> = {};
    baseWelcome.modules.forEach((m) => {
      const o = moduleOverrides[`welcome:${m.key}`];
      init[m.key] = { title: o?.title ?? m.title, blurb: o?.blurb ?? m.blurb };
    });
    return init;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Re-hydrate drafts when overrides arrive from Supabase (only for unedited keys)
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      baseWelcome.modules.forEach((m) => {
        if (!prev[m.key]) {
          const o = moduleOverrides[`welcome:${m.key}`];
          next[m.key] = { title: o?.title ?? m.title, blurb: o?.blurb ?? m.blurb };
        }
      });
      return next;
    });
  }, [moduleOverrides, baseWelcome.modules]);

  const saveModule = async (moduleKey: string) => {
    const d = drafts[moduleKey];
    if (!d) return;
    setSavingKey(moduleKey);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from("journey_module_overrides")
      .upsert(
        { phase_id: "welcome", module_key: moduleKey, title: d.title, blurb: d.blurb },
        { onConflict: "phase_id,module_key" },
      );
    setSavingKey(null);
    if (error) {
      toast.error("Couldn't save step", { description: error.message });
      return;
    }
    toast.success("Step saved");
    void refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Onboarding · Phase 0
            </p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
              Welcome to <span className="text-primary">Blossom</span>
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">
              Universal onboarding for every Blossom employee, separate from role-specific training journeys. Edit the seven steps below - what every new hire reads, watches, and reflects on during their first day.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/training/welcome" target="_blank">
                <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Preview
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Steps" value={String(welcome.modules.length)} />
          <Stat label="Est. time" value={`${welcome.modules.reduce((s, m) => s + (m.estMinutes || 0), 0)} min`} />
          <Stat label="Customized" value={String(customized)} />
        </div>
        {(() => {
          const videoLoaded = welcome.modules.some((m) => m.kind === "video" && !!m.video?.url);
          const letters = welcome.modules.filter((m) => m.kind === "leader" || m.kind === "letter").length;
          return (
            <div
              data-testid="welcome-admin-status"
              className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground"
            >
              <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5">
                Universal onboarding
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5">
                Separate from role-specific journeys
              </span>
              <span className={`rounded-full border px-2 py-0.5 ${videoLoaded ? "border-primary/30 bg-primary/5 text-primary" : "border-border/60 bg-background/70"}`}>
                Welcome video {videoLoaded ? "loaded" : "pending"}
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5">
                {letters} leadership letters present
              </span>
            </div>
          );
        })()}
      </section>

      {/* Steps list */}
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">
              Welcome to Blossom — steps
            </h3>
            <p className="text-[12.5px] text-muted-foreground">
              Reorder, rename, or rewrite each step. Changes apply to every new hire instantly.
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          {baseWelcome.modules.map((m, idx) => {
            const ModIcon = m.icon;
            const k = `welcome:${m.key}`;
            const edited = !!moduleOverrides[k];
            const d = drafts[m.key] ?? { title: m.title, blurb: m.blurb };
            return (
              <li
                key={m.key}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-[12px] font-semibold text-foreground">
                    {idx + 1}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ModIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {m.kind}
                      </Badge>
                      <span className="text-[11.5px] text-muted-foreground">
                        ~{m.estMinutes} min
                      </span>
                      {edited && (
                        <Badge variant="secondary" className="text-[10px]">
                          Edited
                        </Badge>
                      )}
                    </div>
                    <Input
                      value={d.title}
                      onChange={(e) =>
                        setDrafts((s) => ({ ...s, [m.key]: { ...s[m.key], title: e.target.value } }))
                      }
                      className="rounded-xl text-[14px] font-semibold"
                    />
                    <Textarea
                      value={d.blurb}
                      rows={2}
                      onChange={(e) =>
                        setDrafts((s) => ({ ...s, [m.key]: { ...s[m.key], blurb: e.target.value } }))
                      }
                      className="rounded-xl text-[12.5px]"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={savingKey === m.key}
                    onClick={() => saveModule(m.key)}
                  >
                    {savingKey === m.key ? "Saving…" : "Save step"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
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
        <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Insights
      </Button>
    </div>
  );
}

function ProgressPanel() {
  const academy = useAcademy();
  const totalAssigned = trainingAssignments.reduce((s, a) => s + a.assigned, 0);
  const totalCompleted = trainingAssignments.reduce((s, a) => s + a.completed, 0);
  const overdue = trainingAssignments.reduce((s, a) => s + a.overdue, 0);
  const pct = Math.round((totalCompleted / Math.max(totalAssigned, 1)) * 100);
  const moduleCount = academy.trainings.length;
  const journeyCount = academy.journeys.length;
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
        <MiniStat label="Modules" value={String(moduleCount)} />
        <MiniStat label="Journeys" value={String(journeyCount)} />
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
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (t: Training) => void;
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
    if (!generated) return;
    const t = createTraining({
      title: generated.title,
      description: generated.summary,
      type: "SOP",
      estimatedMinutes: 15,
      category: "role",
      overview: generated.summary,
      sopMarkdown:
        `## Overview\n${generated.summary}\n\n## Learning objectives\n` +
        generated.objectives.map((o) => `- ${o}`).join("\n") +
        `\n\n## Operational steps\n` +
        generated.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n"),
      checklist: generated.checklist.map((item, i) => ({
        id: `ai-${i}-${Math.random().toString(36).slice(2, 6)}`,
        item,
        required: true,
      })),
    });
    toast.success(`AI draft created: "${t.title}"`);
    onCreated?.(t);
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

/* ----------------------- Add-module picker ----------------------- */

function AddModuleToJourneyDialog({
  open,
  onOpenChange,
  available,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  available: ViewModule[];
  onPick: (moduleId: string, moduleTitle: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return available;
    return available.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term) ||
        m.type.toLowerCase().includes(term),
    );
  }, [available, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add module to journey</DialogTitle>
          <DialogDescription>
            Pick from any module in the academy library. Edits stay in sync with the Training Academy.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search modules…"
            className="h-10 rounded-xl pl-9 text-[13px]"
            autoFocus
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto rounded-xl border border-border/60">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              {available.length === 0
                ? "Every module in the library is already in this journey."
                : "No modules match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((m) => {
                const Icon = TYPE_ICON[m.type] ?? FileText;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(m.id, m.title);
                        onOpenChange(false);
                        setQ("");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {m.title}
                        </p>
                        <p className="truncate text-[11.5px] text-muted-foreground">
                          {m.type} · {m.estimatedMinutes} min · {m.category}
                        </p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ASSIGN_ROLES = [
  "Intake Coordinator", "Authorization Coordinator", "Scheduling", "Recruiting",
  "HR", "Billing & Finance", "QA", "BCBA", "RBT",
  "State Director", "Operations Leadership", "Executive Leadership", "Marketing",
];
const ASSIGN_STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"];

function AssignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const academy = useAcademy();
  const [journeyId, setJourneyId] = useState<string>("");
  const [scope, setScope] = useState<"role" | "department" | "state" | "employee">("role");
  const [target, setTarget] = useState<string>("");
  const [employee, setEmployee] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const reset = () => {
    setJourneyId(""); setScope("role"); setTarget(""); setEmployee(""); setDueDate("");
  };

  const handleSubmit = () => {
    if (!journeyId) return toast.error("Pick a journey or module");
    const finalTarget = scope === "employee" ? employee.trim() : target;
    if (!finalTarget) return toast.error("Pick who this is assigned to");

    const journey = academy.journeys.find((j) => j.id === journeyId);
    const module = academy.trainings.find((t) => t.id === journeyId);
    const title = journey?.title ?? module?.title ?? "Training";
    const memberCount =
      scope === "employee" ? 1 :
      scope === "role" ? Math.max(3, Math.floor(Math.random() * 10) + 3) :
      scope === "state" ? Math.max(2, Math.floor(Math.random() * 8) + 2) :
      Math.max(2, Math.floor(Math.random() * 6) + 2);

    addUserAssignment({
      id: `ua-${Date.now()}`,
      trainingId: journeyId,
      trainingTitle: title,
      scope,
      target: finalTarget,
      assigned: memberCount,
      completed: 0,
      overdue: 0,
      dueDate: dueDate || undefined,
    });

    toast.success("Assignment created", { description: `${title} → ${finalTarget}` });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign training</DialogTitle>
          <DialogDescription>
            Assign a journey or module to a role, department, state, or individual.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Journey or module</label>
            <Select value={journeyId} onValueChange={setJourneyId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a journey or module" /></SelectTrigger>
              <SelectContent>
                {academy.journeys.length > 0 && (
                  <div className="px-2 py-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Journeys</div>
                )}
                {academy.journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
                {academy.trainings.length > 0 && (
                  <div className="px-2 py-1 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">Modules</div>
                )}
                {academy.trainings.slice(0, 30).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Assign to</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["role", "department", "state", "employee"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setScope(s); setTarget(""); }}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12px] capitalize transition-colors",
                    scope === s
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/30",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {scope === "role" && (
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a role" /></SelectTrigger>
              <SelectContent>
                {ASSIGN_ROLES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          {scope === "department" && (
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a department" /></SelectTrigger>
              <SelectContent>
                {["Intake", "Authorizations", "Scheduling", "Recruiting", "HR", "Billing", "QA", "Clinical", "Operations", "Marketing"].map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {scope === "state" && (
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a state" /></SelectTrigger>
              <SelectContent>
                {ASSIGN_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          {scope === "employee" && (
            <Input value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Employee name or email" className="rounded-xl" />
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Due date (optional)</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={handleSubmit}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Resource Library view ---------- */

function ResourceLibraryView() {
  const navigate = useNavigate();
  const canUploadResources = useCanUploadResources();
  const cards = [
    { title: "SOPs & Workflows", desc: "Standard operating procedures and end-to-end processes.", icon: FileText },
    { title: "Handbooks & Policies", desc: "HR handbooks, employee policies, and compliance docs.", icon: BookOpen },
    { title: "Videos & Tangos", desc: "Walkthrough videos and screen recordings.", icon: PlayCircle },
    { title: "Templates & Forms", desc: "Reusable templates for communication and documents.", icon: Layers },
  ];
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.06] via-card to-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Training Management · Resource Library
            </p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
              Manage every document, video, and handbook
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13px] text-muted-foreground">
              Upload, organize, and assign resources by role, department, and state. Supports SOPs,
              handbooks, policies, templates, videos, guides, checklists, and workflows. Only
              published resources are visible to employees — sensitive items stay in review queues.
            </p>
          </div>
          {canUploadResources && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => navigate("/resource-library")}
              >
                <Library className="mr-1.5 h-3.5 w-3.5" /> Open Resource Library
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/hr/resource-management")}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Manage / Upload
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/hr/resource-management#bulk-upload")}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Bulk upload
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.title}
              onClick={() => navigate("/resource-library")}
              className="group rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold tracking-tight text-foreground">{c.title}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{c.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function SDSopReadinessPanel() {
  const navigate = useNavigate();
  const { resources: liveResources, loading, error } = useAdminResources();
  const live = computeSdSopCoverageFromResources(liveResources);

  const tiles: { label: string; value: string; tone?: string }[] = [
    { label: "Required SD SOPs", value: String(live.total) },
    { label: "Published + connected", value: String(live.published), tone: "text-emerald-600" },
    { label: "Privacy / business review", value: String(live.held), tone: "text-amber-600" },
    { label: "Needs file repair", value: String(live.needsFileRepair), tone: "text-amber-600" },
    { label: "Missing from upload center", value: String(live.missing), tone: "text-rose-600" },
    { label: "Excluded / vault only", value: String(live.excluded), tone: "text-muted-foreground" },
  ];

  return (
    <section
      data-testid="sd-sop-readiness-panel"
      className="rounded-2xl border border-border/70 bg-card p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Training Management · Readiness
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
            State Director SOP Readiness
          </h2>
          <p
            data-testid="sd-readiness-helper"
            className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground"
          >
            These counts only include the {live.total} State Director SOPs required for the launch
            journey. Resource Upload Center shows all company resources.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => navigate("/hr/resource-management#bulk-upload")}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Open Resource Upload Center
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            data-testid="sd-sop-upload-tracker-button"
            onClick={() => navigate("/hr/resource-management#sd-launch-sops")}
          >
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Open SD SOP upload tracker
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/training")}
          >
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Review SD journey
          </Button>
        </div>
      </div>
      {error && (
        <p
          data-testid="sd-coverage-load-error"
          className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-[12px] text-amber-900"
        >
          Live resource sync unavailable — showing the SOP manifest only.
        </p>
      )}
      {loading && !error && (
        <p className="mt-3 text-[11.5px] text-muted-foreground">Loading live SOP coverage…</p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-border/60 bg-background p-3"
          >
            <p className={cn("text-[20px] font-semibold tracking-tight", t.tone ?? "text-foreground")}>
              {t.value}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      <div
        data-testid="sd-sop-batch-summary"
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        {live.batches.map((b) => (
          <div
            key={b.batch}
            data-testid={`sd-sop-batch-${b.batch}`}
            className="rounded-xl border border-border/60 bg-background p-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Batch {String(b.batch).padStart(2, "0")} · SOPs {String(b.start).padStart(2, "0")}-{String(b.end).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[16px] font-semibold tracking-tight text-foreground">
              {b.connected}/{b.total} connected
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {b.missing} missing · {b.needsFileRepair} repair · {b.held} held
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Missing from upload center */}
        <div
          data-testid="sd-coverage-needs-upload"
          className="rounded-2xl border border-border/60 bg-background p-4"
        >
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Missing from upload center ({live.missing})
          </h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Expected SOP titles with no matching row in Resource Upload Center yet.
          </p>
          <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-[12.5px]">
            {live.missingEntries.length === 0 ? (
              <li className="text-muted-foreground">All SD SOPs are accounted for.</li>
            ) : (
              live.missingEntries.slice(0, 30).map((e) => (
                <li
                  key={e.entry.id}
                  className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-1.5 text-foreground/90"
                >
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Expected
                  </span>
                  <div>{e.entry.title}</div>
                </li>
              ))
            )}
            {live.missingEntries.length > 30 && (
              <li className="text-[11px] text-muted-foreground">
                + {live.missingEntries.length - 30} more.
              </li>
            )}
          </ul>
        </div>

        {/* Published & connected — with matched resource title */}
        <div
          data-testid="sd-coverage-published"
          className="rounded-2xl border border-border/60 bg-background p-4"
        >
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Published &amp; connected ({live.published})
          </h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Live in the Resource Library and visible to State Director learners.
          </p>
          <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-[12.5px]">
            {live.publishedEntries.length === 0 ? (
              <li className="text-muted-foreground">No SOPs published yet.</li>
            ) : (
              live.publishedEntries.slice(0, 30).map((e) => {
                const titleMatch =
                  e.resource && e.resource.title.trim() !== e.entry.title.trim();
                return (
                  <li
                    key={e.entry.id}
                    className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-foreground/90"
                  >
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Manifest
                    </span>
                    <div>{e.entry.title}</div>
                    {e.resource && (
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                        <span>Matched: {e.resource.title}</span>
                        {titleMatch && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                            title match
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Needs title cleanup */}
        <div
          data-testid="sd-coverage-needs-title-cleanup"
          className="rounded-2xl border border-amber-300/50 bg-amber-50/30 p-4"
        >
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-amber-900">
            Needs title cleanup ({live.needsTitleCleanupEntries.length})
          </h3>
          <p className="mt-1 text-[11.5px] text-amber-900/80">
            Uploaded resources that look close to a required SOP but don't match the expected title.
            Rename the upload to connect it.
          </p>
          <ul className="mt-3 max-h-56 space-y-1 overflow-auto text-[12.5px]">
            {live.needsTitleCleanupEntries.length === 0 ? (
              <li className="text-amber-900/70">No likely renames detected.</li>
            ) : (
              live.needsTitleCleanupEntries.slice(0, 20).map((c) => (
                <li
                  key={c.entry.id}
                  className="rounded-lg border border-amber-300/50 bg-background px-3 py-1.5 text-foreground/90"
                >
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Expected
                  </div>
                  <div>{c.entry.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Uploaded as: {c.candidate.title}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Needs file repair */}
        <div
          data-testid="sd-coverage-needs-file-repair"
          className="rounded-2xl border border-amber-300/50 bg-amber-50/40 p-4"
        >
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-amber-900">
            Needs file repair ({live.needsFileRepair})
          </h3>
          <p className="mt-1 text-[11.5px] text-amber-900/80">
            Published records that are missing both an external URL and a storage file —
            re-upload from Resource Upload Center so learners can open the SOP.
          </p>
          <ul className="mt-3 max-h-56 space-y-1 overflow-auto text-[12.5px]">
            {live.needsFileRepairEntries.length === 0 ? (
              <li className="text-amber-900/70">No file repairs needed.</li>
            ) : (
              live.needsFileRepairEntries.slice(0, 30).map((e) => (
                <li
                  key={e.entry.id}
                  className="rounded-lg border border-amber-300/50 bg-background px-3 py-1.5 text-foreground/90"
                >
                  {e.entry.title}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Uploaded but not matched */}
      <div className="mt-4">
        <div
          data-testid="sd-coverage-unmatched-uploads"
          className="rounded-2xl border border-border/60 bg-background p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Uploaded but not matched to State Director SOPs ({live.unmatchedResources.length})
            </h3>
            <p className="text-[11px] text-muted-foreground">
              These resources live in the upload center but don't match a required SD SOP title.
            </p>
          </div>
          <div className="mt-3 overflow-auto">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="px-2 py-2 text-left font-medium">Title</th>
                  <th className="px-2 py-2 text-left font-medium">Upload status</th>
                  <th className="px-2 py-2 text-left font-medium">Type</th>
                  <th className="px-2 py-2 text-left font-medium">Roles</th>
                  <th className="px-2 py-2 text-left font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {live.unmatchedResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-3 text-muted-foreground">
                      All uploaded resources are matched or out of scope.
                    </td>
                  </tr>
                ) : (
                  live.unmatchedResources.slice(0, 30).map((r) => (
                    <tr key={r.id} className="border-b border-border/40">
                      <td className="px-2 py-2 text-foreground/90">{r.title}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.uploadStatus ?? "published"}</td>
                      <td className="px-2 py-2 text-muted-foreground">{r.resourceType ?? r.type}</td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {r.roles.length ? r.roles.join(", ") : "All roles"}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{r.category}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {live.unmatchedResources.length > 30 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                + {live.unmatchedResources.length - 30} more. Open Resource Upload Center to review.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Compact counts dashboard for Training Management Control Room.
 * Source of truth: useAdminResources + shared coverage helpers.
 * Makes the difference between Resource Upload Center (all company resources)
 * and Training Management (State Director launch-required assets) explicit.
 */
function TrainingManagementCountsPanel() {
  const { resources, loading, error } = useAdminResources();
  const sop = computeSdSopCoverageFromResources(resources);
  const screenshots = computeSdScreenshotCoverage(resources);
  const welcomeVideo = computeSdWelcomeVideoState(resources);

  const totalUploaded = resources.length;
  const learnerVisible = resources.filter(
    (r) => r.uploadStatus === "published" && r.status !== "Archived",
  ).length;
  const heldReview = resources.filter(
    (r) =>
      r.uploadStatus === "privacy_review" ||
      r.uploadStatus === "business_review" ||
      r.uploadStatus === "needs_conversion",
  ).length;
  const vaultExcluded = resources.filter(
    (r) =>
      r.uploadStatus === "vault_only" ||
      r.uploadStatus === "excluded" ||
      r.sensitivity === "excluded",
  ).length;

  const Tile = ({ label, value, tone }: { label: string; value: number | string; tone?: string }) => (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <p className={cn("text-[20px] font-semibold tracking-tight", tone ?? "text-foreground")}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );

  return (
    <section
      data-testid="tmc-counts-panel"
      aria-label="Resource & Asset Coverage"
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 md:p-6"
    >
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Training Management · Counts
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
          Resource &amp; Asset Coverage
        </h2>
        <div
          data-testid="tmc-counts-explanation"
          className="mt-3 space-y-1 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-[12.5px] text-foreground/80"
        >
          <p>
            <span className="font-medium text-foreground">Resource Upload Center</span> = all
            uploaded company resources.
          </p>
          <p>
            <span className="font-medium text-foreground">Training Management</span> = only
            resources required for the State Director launch path.
          </p>
          <p>
            <span className="font-medium text-foreground">Published</span> means learner-visible
            only when matched, active, and openable.
          </p>
        </div>
        {error && (
          <p className="mt-2 text-[11.5px] text-amber-700">Live resource sync unavailable.</p>
        )}
        {loading && !error && (
          <p className="mt-2 text-[11.5px] text-muted-foreground">Loading live counts…</p>
        )}
      </header>

      <div className="space-y-2" data-testid="tmc-counts-company-library">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Company library (all uploads)
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Total uploaded" value={totalUploaded} />
          <Tile label="Published & learner-visible" value={learnerVisible} tone="text-emerald-600" />
          <Tile label="Held / review" value={heldReview} tone="text-amber-600" />
          <Tile label="Vault / excluded" value={vaultExcluded} tone="text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2" data-testid="tmc-counts-sd-sops">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          State Director SOPs (launch-required)
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Tile label="Required" value={sop.total} />
          <Tile label="Connected" value={sop.published} tone="text-emerald-600" />
          <Tile label="Missing" value={sop.missing} tone="text-rose-600" />
          <Tile label="Needs file repair" value={sop.needsFileRepair} tone="text-amber-600" />
          <Tile label="Held review" value={sop.held} tone="text-amber-600" />
        </div>
      </div>

      <div className="space-y-2" data-testid="tmc-counts-week1-assets">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Week 1 training assets
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Tile
            label="Screenshots matched"
            value={`${screenshots.week1.matched}/${screenshots.week1.total}`}
            tone="text-emerald-600"
          />
          <Tile
            label="Screenshots missing"
            value={screenshots.week1.missing}
            tone={screenshots.week1.missing > 0 ? "text-rose-600" : "text-foreground"}
          />
          <Tile
            label="Welcome video"
            value={welcomeVideo.ok ? "Linked" : "Pending"}
            tone={welcomeVideo.ok ? "text-emerald-600" : "text-amber-600"}
          />
        </div>
      </div>
    </section>
  );
}

/* ---- Control Room sections (final polish pass) ---- */

function ControlRoomLaunchStatusRow() {
  const { resources } = useAdminResources();
  const sop = computeSdSopCoverageFromResources(resources);
  const screenshots = computeSdScreenshotCoverage(resources);
  const welcomeVideo = computeSdWelcomeVideoState(resources);

  const cards: { label: string; value: string; tone: string }[] = [
    { label: "Week 1 modules", value: "25", tone: "text-foreground" },
    {
      label: "SOPs connected",
      value: `${sop.published}/${sop.total}`,
      tone: sop.published === sop.total ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Screenshots matched",
      value: `${screenshots.week1.matched}/${screenshots.week1.total}`,
      tone:
        screenshots.week1.matched === screenshots.week1.total
          ? "text-emerald-600"
          : "text-amber-600",
    },
    {
      label: "Welcome video",
      value: welcomeVideo.ok ? "Linked" : "Pending",
      tone: welcomeVideo.ok ? "text-emerald-600" : "text-amber-600",
    },
  ];

  return (
    <div
      data-testid="tmc-launch-status-row"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-border/60 bg-background p-3"
        >
          <p className={cn("text-[20px] font-semibold tracking-tight", c.tone)}>
            {c.value}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ControlRoomLaunchReadinessSection() {
  return (
    <section
      data-testid="tmc-launch-readiness-section"
      aria-label="State Director Launch Readiness"
      className="space-y-5 rounded-2xl border border-teal-500/20 bg-card p-5 md:p-6"
    >
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Training Management
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-foreground">
          State Director Launch Readiness
        </h2>
        <p className="mt-1 max-w-3xl text-[12.5px] text-muted-foreground">
          Honest, per-signal launch status for the State Director journey. Nothing is marked
          ready unless the system can verify it.
        </p>
      </header>
      <ControlRoomLaunchStatusRow />
      <SDLaunchReadinessPanel />
      <SDDayOneAdminPanel />
      <WelcomeReflectionsAdminPanel />
      <div className="grid gap-5 xl:grid-cols-2">
        <SDSopReadinessPanel />
        <SDScreenshotReadinessPanel />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SDDayOneAdminGuide />
        <SDMentorCheckInGuide />
      </div>
    </section>
  );
}

function ControlRoomResourceAssetCoverageSection() {
  return (
    <section
      data-testid="tmc-resource-asset-coverage-section"
      aria-label="Resource & Asset Coverage"
      className="space-y-4"
    >
      <TrainingManagementCountsPanel />
    </section>
  );
}
