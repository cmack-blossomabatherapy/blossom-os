/**
 * Training Academy — role-journey data model with editable store.
 *
 * Everything is editable per role through the Manage Journeys page.
 * Persistence: localStorage (no backend yet).
 */
import { useSyncExternalStore } from "react";
import {
  ClipboardList, ShieldCheck, CalendarClock, Users, Heart, CheckCircle2,
  Wallet, Stethoscope, Crown, Workflow, BookOpen, Sparkles, type LucideIcon,
} from "lucide-react";

export type TrainingType = "SOP" | "Workflow" | "Tango" | "Video" | "Checklist" | "Quick Guide";
export type TrainingStatus = "not_started" | "in_progress" | "completed" | "overdue";
export type JourneyTone = "violet" | "sky" | "mint" | "rose" | "peach" | "lilac";

export type IconKey =
  | "ClipboardList" | "ShieldCheck" | "CalendarClock" | "Users" | "Heart"
  | "CheckCircle2" | "Wallet" | "Stethoscope" | "Crown" | "Workflow"
  | "BookOpen" | "Sparkles";

export const ICONS: Record<IconKey, LucideIcon> = {
  ClipboardList, ShieldCheck, CalendarClock, Users, Heart,
  CheckCircle2, Wallet, Stethoscope, Crown, Workflow, BookOpen, Sparkles,
};

export const TONES: JourneyTone[] = ["violet", "sky", "mint", "rose", "peach", "lilac"];

export interface TrainingResource {
  id: string;
  type: "PDF" | "Link" | "Tango" | "Video" | "Template";
  title: string;
  url: string;
}

export interface TrainingChecklistItem {
  id: string;
  item: string;
  required: boolean;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  type: TrainingType;
  estimatedMinutes: number;
  required?: boolean;
  category: "role" | "systems" | "shared";
  department?: string;
  owner?: string;
  lastUpdated?: string;
  // Deep editable content
  overview?: string;
  sopMarkdown?: string;
  tangoUrl?: string;
  videoUrl?: string;
  checklist?: TrainingChecklistItem[];
  resources?: TrainingResource[];
}

export interface RoleJourney {
  id: string;
  role: string;
  title: string;
  tagline: string;
  icon: IconKey;
  tone: JourneyTone;
  moduleIds: string[];
}

export interface TrainingProgress {
  trainingId: string;
  status: TrainingStatus;
  progressPercent: number;
  dueDate?: string;
}

/* ---------------- Seed ---------------- */

const SEED_TRAININGS: Training[] = [
  {
    id: "phone-leads",
    title: "Phone Calls & Leads",
    description: "End-to-end lead handling from first call through warm hand-off.",
    type: "Workflow", estimatedMinutes: 18, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-10",
    overview: "Why clean lead handling matters and how it sets up the rest of intake.",
    sopMarkdown: "## SOP\n1. Answer within 2 rings.\n2. Capture name, child age, insurance, state.\n3. Log lead in Blossom OS.\n4. Warm hand-off to the right state intake lead.",
    tangoUrl: "",
    checklist: [
      { id: "c1", item: "Read the SOP top to bottom", required: true },
      { id: "c2", item: "Shadow 2 live calls", required: true },
      { id: "c3", item: "Log your first lead end-to-end", required: true },
    ],
    resources: [
      { id: "r1", type: "Link", title: "Resource Library entry", url: "/sop" },
    ],
  },
  {
    id: "intake-workflow",
    title: "Intake Workflow",
    description: "From qualified lead to active client — stages, ownership, timing.",
    type: "Workflow", estimatedMinutes: 22, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-08",
    overview: "The full intake pipeline and who owns each stage.",
    sopMarkdown: "## Intake Stages\n- New Lead → Qualified → VOB → Setup → Active",
    checklist: [
      { id: "c1", item: "Walk one client through every stage", required: true },
    ],
    resources: [],
  },
  {
    id: "vob-basics",
    title: "VOB Fundamentals",
    description: "Verify benefits accurately and route the file correctly the first time.",
    type: "SOP", estimatedMinutes: 20, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-15",
    overview: "Insurance verification fundamentals.",
    sopMarkdown: "## VOB SOP\nUse Solum. Capture all fields. Flag exclusions.",
    checklist: [{ id: "c1", item: "Complete 3 VOBs with QA review", required: true }],
    resources: [{ id: "r1", type: "Link", title: "VOB Decision Guide", url: "/resources" }],
  },
  {
    id: "family-communication",
    title: "Family Communication",
    description: "Cadence, tone, and templates for parent communication.",
    type: "Quick Guide", estimatedMinutes: 10, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-04",
    overview: "How we talk to families at every stage.",
    checklist: [{ id: "c1", item: "Send 3 templated updates", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Communication Templates", url: "/resources" }],
  },
  {
    id: "intake-foundations",
    title: "Intake Foundations",
    description: "What Intake owns, who we serve, and how the role connects to the rest of operations.",
    type: "Quick Guide", estimatedMinutes: 12, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-20",
    overview: "Intake exists to turn inquiries into ready-to-serve families. Calm, clear, fast.",
    sopMarkdown: "## Foundations\n- Intake is centralized (not state-scoped).\n- Goal: reduce time-to-service while keeping families informed.\n- Handoffs: Scheduling, BCBA, QA.",
    checklist: [{ id: "c1", item: "Read the Intake charter", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Intake Workspace", url: "/os/intake/workspace" }],
  },
  {
    id: "insurance-basics",
    title: "Insurance Basics",
    description: "Plans, payers, networks, and what each one means for an ABA family.",
    type: "Quick Guide", estimatedMinutes: 15, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-18",
    overview: "A practical insurance primer for intake — no jargon, just what you actually need.",
    sopMarkdown: "## Cheat Sheet\n- Commercial vs Medicaid.\n- In-network vs out-of-network.\n- Common BCBS / Aetna / UHC quirks by state.",
    checklist: [{ id: "c1", item: "Pass the insurance vocab quiz", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Insurance Cheat Sheet", url: "/resources" }],
  },
  {
    id: "assessment-coordination",
    title: "Assessment Coordination",
    description: "Schedule assessments, assign BCBAs, and keep families informed.",
    type: "Workflow", estimatedMinutes: 16, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-19",
    overview: "Owning the path from VOB approved to assessment complete.",
    sopMarkdown: "## Steps\n1. Confirm availability.\n2. Assign BCBA by state + caseload.\n3. Send pre-assessment packet.\n4. Confirm 24h before.",
    checklist: [{ id: "c1", item: "Coordinate one full assessment", required: true }],
    resources: [],
  },
  {
    id: "service-readiness",
    title: "Service Readiness",
    description: "What 'ready to serve' actually means and who signs off.",
    type: "SOP", estimatedMinutes: 12, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-17",
    overview: "Final-mile checklist before a family becomes active.",
    sopMarkdown: "## Readiness Checklist\n- Auth in hand.\n- BCBA assigned.\n- Schedule pattern proposed.\n- Family briefed.",
    checklist: [{ id: "c1", item: "Complete a readiness review", required: true }],
    resources: [],
  },
  {
    id: "intake-systems",
    title: "Intake Systems Training",
    description: "How Blossom OS Intake Workspace, CentralReach and Solum fit together.",
    type: "Tango", estimatedMinutes: 18, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-21",
    overview: "A click-by-click tour of every system you'll touch as an Intake Coordinator.",
    tangoUrl: "",
    checklist: [{ id: "c1", item: "Complete the Tango walkthrough", required: true }],
    resources: [{ id: "r1", type: "Link", title: "Intake Workspace", url: "/os/intake/workspace" }],
  },
  {
    id: "operational-escalations",
    title: "Operational Escalations",
    description: "When to escalate, who to escalate to, and how to write a clean escalation.",
    type: "Quick Guide", estimatedMinutes: 8, required: true,
    category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-16",
    overview: "Escalations protect families and keep operations calm.",
    sopMarkdown: "## Escalation Path\nIntake Lead → State Director → Ops Leadership.",
    checklist: [{ id: "c1", item: "Write one practice escalation", required: false }],
    resources: [],
  },
  {
    id: "sys-centralreach",
    title: "CentralReach Basics",
    description: "The essentials every intake user needs to know in CR.",
    type: "Tango", estimatedMinutes: 14,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-11",
    overview: "Client creation, scheduling fields, and where notes live.",
    checklist: [], resources: [],
  },
  {
    id: "sys-outlook",
    title: "Outlook Workflow",
    description: "Inbox rules, templates, and shared mailboxes.",
    type: "Quick Guide", estimatedMinutes: 8,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-09",
    checklist: [], resources: [],
  },
  {
    id: "sys-teams",
    title: "Microsoft Teams",
    description: "Channels, mentions, and how Intake collaborates async.",
    type: "Quick Guide", estimatedMinutes: 6,
    category: "systems", department: "intake", owner: "Systems", lastUpdated: "2026-05-06",
    checklist: [], resources: [],
  },
  {
    id: "shared-scheduling-overview",
    title: "Scheduling Overview",
    description: "How scheduling thinks so intake can hand off cleanly.",
    type: "Quick Guide", estimatedMinutes: 10,
    category: "shared", department: "scheduling", owner: "Scheduling", lastUpdated: "2026-05-13",
    checklist: [], resources: [],
  },
  {
    id: "shared-qa-basics",
    title: "QA Basics",
    description: "What QA looks at and how intake quality shows up downstream.",
    type: "Quick Guide", estimatedMinutes: 10,
    category: "shared", department: "qa", owner: "QA", lastUpdated: "2026-05-14",
    checklist: [], resources: [],
  },
];

/** Only Intake is seeded with modules. Other roles get empty journeys ready to edit. */
const SEED_JOURNEYS: RoleJourney[] = [
  { id: "j-intake", role: "intake_coordinator", title: "Intake Coordinator Journey", tagline: "From first phone call to a happy active client.", icon: "ClipboardList", tone: "lilac", moduleIds: [
    "intake-foundations",
    "phone-leads",
    "intake-workflow",
    "insurance-basics",
    "vob-basics",
    "family-communication",
    "assessment-coordination",
    "service-readiness",
    "intake-systems",
    "operational-escalations",
  ] },
  { id: "j-auth", role: "authorization_coordinator", title: "Authorization Coordinator Journey", tagline: "Auths approved on time, every time.", icon: "ShieldCheck", tone: "sky", moduleIds: [] },
  { id: "j-scheduling", role: "scheduling_team", title: "Scheduling Journey", tagline: "Build clean schedules that hold up.", icon: "CalendarClock", tone: "mint", moduleIds: [] },
  { id: "j-qa", role: "qa_team", title: "QA Journey", tagline: "Protect clinical quality with calm rigor.", icon: "CheckCircle2", tone: "violet", moduleIds: [] },
  { id: "j-recruiting", role: "recruiting_team", title: "Recruiting Journey", tagline: "A predictable pipeline of great clinicians.", icon: "Users", tone: "peach", moduleIds: [] },
  { id: "j-bcba", role: "bcba", title: "BCBA Journey", tagline: "Clinical excellence and clean supervision.", icon: "Stethoscope", tone: "sky", moduleIds: [] },
  { id: "j-rbt", role: "rbt", title: "RBT Journey", tagline: "Show up prepared, document on time.", icon: "Stethoscope", tone: "mint", moduleIds: [] },
  { id: "j-state", role: "state_director", title: "State Director Journey", tagline: "Run a state with calm, operational rhythm.", icon: "Crown", tone: "violet", moduleIds: [] },
  { id: "j-hr", role: "hr_team", title: "HR Journey", tagline: "Take care of the people who take care of clients.", icon: "Heart", tone: "rose", moduleIds: [] },
  { id: "j-billing", role: "billing_finance", title: "Billing & Finance Journey", tagline: "Keep revenue clean and predictable.", icon: "Wallet", tone: "lilac", moduleIds: [] },
  { id: "j-exec", role: "executive_leadership", title: "Executive Leadership Journey", tagline: "Lead Blossom with rhythm and clarity.", icon: "Crown", tone: "violet", moduleIds: [] },
  { id: "j-ops", role: "operations_leadership", title: "Operations Leadership Journey", tagline: "Keep all states pulling the same direction.", icon: "Workflow", tone: "violet", moduleIds: [] },
];

/* ---------------- Store ---------------- */

interface AcademyState {
  trainings: Training[];
  journeys: RoleJourney[];
}

const STORAGE_KEY = "blossom.training.academy.v3";

function loadInitial(): AcademyState {
  if (typeof window === "undefined") {
    return { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AcademyState;
      if (parsed?.trainings && parsed?.journeys) return parsed;
    }
  } catch { /* ignore */ }
  return { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
}

let state: AcademyState = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSnapshot() { return state; }

export function useAcademy(): AcademyState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---------------- Mutations ---------------- */

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resetAcademy() {
  state = { trainings: SEED_TRAININGS, journeys: SEED_JOURNEYS };
  emit();
}

export function clearAllModules() {
  state = {
    trainings: [],
    journeys: state.journeys.map((j) => ({ ...j, moduleIds: [] })),
  };
  emit();
}

export function upsertTraining(t: Training) {
  const idx = state.trainings.findIndex((x) => x.id === t.id);
  const next = [...state.trainings];
  if (idx >= 0) next[idx] = t;
  else next.push(t);
  state = { ...state, trainings: next };
  emit();
}

export function createTraining(partial: Partial<Training> & { title: string }): Training {
  const t: Training = {
    id: genId("m"),
    title: partial.title,
    description: partial.description ?? "",
    type: partial.type ?? "SOP",
    estimatedMinutes: partial.estimatedMinutes ?? 10,
    required: partial.required ?? false,
    category: partial.category ?? "role",
    department: partial.department,
    owner: partial.owner,
    lastUpdated: new Date().toISOString().slice(0, 10),
    overview: partial.overview ?? "",
    sopMarkdown: partial.sopMarkdown ?? "",
    tangoUrl: partial.tangoUrl ?? "",
    videoUrl: partial.videoUrl ?? "",
    checklist: partial.checklist ?? [],
    resources: partial.resources ?? [],
  };
  state = { ...state, trainings: [...state.trainings, t] };
  emit();
  return t;
}

export function deleteTraining(id: string) {
  state = {
    trainings: state.trainings.filter((t) => t.id !== id),
    journeys: state.journeys.map((j) => ({ ...j, moduleIds: j.moduleIds.filter((m) => m !== id) })),
  };
  emit();
}

export function updateJourney(id: string, patch: Partial<Omit<RoleJourney, "id" | "role">>) {
  state = {
    ...state,
    journeys: state.journeys.map((j) => (j.id === id ? { ...j, ...patch } : j)),
  };
  emit();
}

export function setJourneyModules(journeyId: string, moduleIds: string[]) {
  updateJourney(journeyId, { moduleIds });
}

export function addModuleToJourney(journeyId: string, moduleId: string) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j || j.moduleIds.includes(moduleId)) return;
  setJourneyModules(journeyId, [...j.moduleIds, moduleId]);
}

export function removeModuleFromJourney(journeyId: string, moduleId: string) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j) return;
  setJourneyModules(journeyId, j.moduleIds.filter((m) => m !== moduleId));
}

export function reorderJourneyModule(journeyId: string, fromIndex: number, toIndex: number) {
  const j = state.journeys.find((x) => x.id === journeyId);
  if (!j) return;
  const ids = [...j.moduleIds];
  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);
  setJourneyModules(journeyId, ids);
}

/* ---------------- Mock progress ---------------- */

export const trainingProgress: Record<string, TrainingProgress> = {
  "intake-foundations": { trainingId: "intake-foundations", status: "completed", progressPercent: 100 },
  "phone-leads": { trainingId: "phone-leads", status: "completed", progressPercent: 100 },
  "intake-workflow": { trainingId: "intake-workflow", status: "in_progress", progressPercent: 60 },
  "insurance-basics": { trainingId: "insurance-basics", status: "in_progress", progressPercent: 25 },
  "vob-basics": { trainingId: "vob-basics", status: "overdue", progressPercent: 10, dueDate: "2026-05-18" },
};

export function getProgress(id: string): TrainingProgress {
  return trainingProgress[id] ?? { trainingId: id, status: "not_started", progressPercent: 0 };
}

/* ---------------- Lookups (read live state) ---------------- */

export function getTrainings(): Training[] { return state.trainings; }
export function getJourneys(): RoleJourney[] { return state.journeys; }

export function getTraining(id: string): Training | undefined {
  return state.trainings.find((t) => t.id === id);
}

export function getJourneyForRole(role: string): RoleJourney {
  const direct = state.journeys.find((j) => j.role === role);
  if (direct) return direct;
  if (role === "super_admin") {
    return state.journeys.find((j) => j.role === "executive_leadership")
      ?? state.journeys[0]
      ?? { id: "j-empty", role, title: "Your Journey", tagline: "No modules yet.", icon: "BookOpen", tone: "violet", moduleIds: [] };
  }
  return state.journeys.find((j) => j.role === "operations_leadership")
    ?? state.journeys[0]
    ?? { id: "j-empty", role, title: "Your Journey", tagline: "No modules yet.", icon: "BookOpen", tone: "violet", moduleIds: [] };
}

export function getJourneyModules(j: RoleJourney): Training[] {
  return j.moduleIds.map((id) => getTraining(id)).filter(Boolean) as Training[];
}

export function continueLearning(): { training: Training; progress: TrainingProgress }[] {
  return Object.values(trainingProgress)
    .filter((p) => p.status === "in_progress" || p.status === "overdue")
    .map((p) => ({ training: getTraining(p.trainingId)!, progress: p }))
    .filter((x) => x.training);
}

export function requiredDue(): Training[] {
  return state.trainings.filter((t) => t.required && getProgress(t.id).status !== "completed");
}

export function systemsTrainings(): Training[] {
  return state.trainings.filter((t) => t.category === "systems");
}

export function sharedTrainings(): Training[] {
  return state.trainings.filter((t) => t.category === "shared");
}

export function searchTrainings(q: string): Training[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return state.trainings.filter((t) =>
    [t.title, t.description, t.type, t.department ?? "", t.owner ?? ""]
      .join(" ").toLowerCase().includes(term),
  );
}

/** Recently published / updated modules — sorted by lastUpdated desc. */
export function recentlyAdded(limit = 4): Training[] {
  return [...state.trainings]
    .filter((t) => !!t.lastUpdated)
    .sort((a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""))
    .slice(0, limit);
}

/** Required modules scoped to a department (role-aware). */
export function requiredForDepartment(department: string): Training[] {
  return state.trainings.filter(
    (t) => t.required && (t.department ?? "").toLowerCase() === department.toLowerCase(),
  );
}

/* ---------------- Detail-page compatibility ---------------- */

export type TrainingSectionType = "Overview" | "SOP" | "Walkthrough" | "Checklist" | "Quiz" | "Resources";

export interface TrainingSection {
  id: string;
  trainingId: string;
  type: TrainingSectionType;
  title: string;
  content?: string;
  tangoUrl?: string;
  videoUrl?: string;
}

export function getSectionsFor(id: string): TrainingSection[] {
  const t = getTraining(id);
  return [
    { id: `${id}-ov`, trainingId: id, type: "Overview", title: "Overview", content: t?.overview || "Why this module matters and how it connects to your role." },
    { id: `${id}-sop`, trainingId: id, type: "SOP", title: "Standard Operating Procedure", content: t?.sopMarkdown || "## SOP\nThe written SOP for this module lives in the Resource Library and is linked here." },
    { id: `${id}-wt`, trainingId: id, type: "Walkthrough", title: "Tango Walkthrough", content: "Click-by-click walkthrough.", tangoUrl: t?.tangoUrl || "#", videoUrl: t?.videoUrl },
    { id: `${id}-ck`, trainingId: id, type: "Checklist", title: "Checklist" },
    { id: `${id}-rs`, trainingId: id, type: "Resources", title: "Resources" },
  ];
}

export function getChecklistFor(id: string): (TrainingChecklistItem & { trainingId: string })[] {
  const t = getTraining(id);
  return (t?.checklist ?? []).map((c) => ({ ...c, trainingId: id }));
}

export function getResourcesFor(id: string): (TrainingResource & { trainingId: string })[] {
  const t = getTraining(id);
  return (t?.resources ?? []).map((r) => ({ ...r, trainingId: id }));
}

export interface TrainingQuizQuestion {
  id: string;
  question: string;
  kind: "multiple_choice" | "true_false";
  options: string[];
  answerIndex: number;
}

export const trainingQuiz: TrainingQuizQuestion[] = [];
