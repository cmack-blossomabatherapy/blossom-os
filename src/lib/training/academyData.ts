/**
 * Training Academy - mock data layer.
 * Mirrors the future Supabase schema (training_departments, trainings,
 * training_sections, training_progress, training_checklists, training_resources)
 * so we can swap in real data later without page rewrites.
 */
import {
  Stethoscope, ClipboardList, ShieldCheck, CalendarClock, Users, Heart,
  CheckCircle2, Wallet, Brain, MonitorCog, Crown, Workflow, type LucideIcon,
} from "lucide-react";

export type TrainingType =
  | "SOP"
  | "Workflow"
  | "Tango"
  | "Video"
  | "Checklist"
  | "Quick Guide"
  | "Operational Overview";

export type TrainingDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type TrainingStatus = "not_started" | "in_progress" | "completed" | "overdue";

export interface TrainingDepartment {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: "violet" | "lilac" | "sky" | "mint" | "peach" | "rose";
}

export interface TrainingSection {
  id: string;
  trainingId: string;
  type: "Overview" | "SOP" | "Walkthrough" | "Checklist" | "Quiz" | "Resources";
  title: string;
  /** Rich-text/markdown body (mock). */
  content?: string;
  /** For walkthrough sections: a Tango embed URL. */
  tangoUrl?: string;
  /** For video sections. */
  videoUrl?: string;
}

export interface TrainingChecklistItem {
  id: string;
  trainingId: string;
  item: string;
  required: boolean;
}

export interface TrainingResource {
  id: string;
  trainingId: string;
  type: "PDF" | "Link" | "Tango" | "Video" | "Template";
  title: string;
  url: string;
}

export interface TrainingQuizQuestion {
  id: string;
  question: string;
  kind: "multiple_choice" | "true_false";
  options: string[];
  answerIndex: number;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  department: string;
  type: TrainingType;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  required: boolean;
  featured?: boolean;
  lastUpdated: string;
  owner: string;
  system?: string;
  tags: string[];
}

export interface TrainingProgress {
  trainingId: string;
  status: TrainingStatus;
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
  lastViewedAt?: string;
  dueDate?: string;
}

/* ---------------- Departments ---------------- */

export const trainingDepartments: TrainingDepartment[] = [
  { id: "operations", name: "Operations", description: "Daily operational rhythm and cross-functional flow.", icon: Workflow, tone: "violet" },
  { id: "intake", name: "Intake", description: "Lead handling, family communication, and onboarding.", icon: ClipboardList, tone: "lilac" },
  { id: "authorizations", name: "Authorizations", description: "Initial auths, reauths, and payor workflows.", icon: ShieldCheck, tone: "sky" },
  { id: "scheduling", name: "Scheduling", description: "Schedule build, conflicts, and weekly forecasting.", icon: CalendarClock, tone: "mint" },
  { id: "recruiting", name: "Recruiting", description: "Sourcing, screening, and pipeline cadence.", icon: Users, tone: "peach" },
  { id: "hr", name: "HR", description: "People ops, compliance, and employee lifecycle.", icon: Heart, tone: "rose" },
  { id: "qa", name: "QA", description: "Documentation review and clinical quality.", icon: CheckCircle2, tone: "violet" },
  { id: "billing", name: "Billing & Finance", description: "Claims, AR, and revenue operations.", icon: Wallet, tone: "lilac" },
  { id: "clinical", name: "Clinical", description: "BCBA / RBT clinical operations and supervision.", icon: Stethoscope, tone: "sky" },
  { id: "systems", name: "Systems & Software", description: "CentralReach, Monday, Viventium, Solum, Bloom Growth.", icon: MonitorCog, tone: "mint" },
  { id: "leadership", name: "Leadership", description: "State Directors, Clinic Directors, and executives.", icon: Crown, tone: "peach" },
];

/* ---------------- Trainings ---------------- */

export const trainings: Training[] = [
  {
    id: "t-phone-leads",
    title: "Phone Calls & Leads Workflow",
    description: "End-to-end lead handling from first call through warm hand-off to Intake.",
    department: "intake",
    type: "Workflow",
    difficulty: "Beginner",
    estimatedMinutes: 18,
    required: true,
    featured: true,
    lastUpdated: "2026-05-10",
    owner: "Intake Lead",
    tags: ["leads", "phones", "intake"],
  },
  {
    id: "t-auth-lifecycle",
    title: "Authorization Lifecycle",
    description: "Initial auth → treatment auth → reauth, with payor-specific notes.",
    department: "authorizations",
    type: "Operational Overview",
    difficulty: "Intermediate",
    estimatedMinutes: 35,
    required: true,
    featured: true,
    lastUpdated: "2026-05-04",
    owner: "Auth Coordinator",
    tags: ["auths", "reauth", "payors"],
  },
  {
    id: "t-vob-decision",
    title: "VOB Decision Center",
    description: "Verify benefits accurately and route the file the right way the first time.",
    department: "intake",
    type: "SOP",
    difficulty: "Intermediate",
    estimatedMinutes: 22,
    required: true,
    featured: true,
    lastUpdated: "2026-05-15",
    owner: "Intake Lead",
    tags: ["vob", "insurance"],
  },
  {
    id: "t-scheduling-process",
    title: "Scheduling Process",
    description: "Weekly schedule build, conflict resolution, and capacity check.",
    department: "scheduling",
    type: "Workflow",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    required: true,
    featured: true,
    lastUpdated: "2026-04-28",
    owner: "Scheduling Lead",
    tags: ["schedule", "centralreach"],
  },
  {
    id: "t-bcba-pr",
    title: "BCBA PR Process",
    description: "Performance review cadence, expectations, and documentation.",
    department: "clinical",
    type: "SOP",
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    required: false,
    featured: true,
    lastUpdated: "2026-05-01",
    owner: "Clinical Director",
    tags: ["bcba", "performance"],
  },
  {
    id: "t-recruiting-pipeline",
    title: "Recruiting Pipeline",
    description: "Sourcing, screening, and BCBA/RBT pipeline cadence.",
    department: "recruiting",
    type: "Operational Overview",
    difficulty: "Beginner",
    estimatedMinutes: 28,
    required: true,
    featured: true,
    lastUpdated: "2026-05-12",
    owner: "Recruiting Lead",
    tags: ["recruiting", "pipeline"],
  },
  {
    id: "t-cr-essentials",
    title: "CentralReach Essentials",
    description: "Navigate CR like a pro — scheduling, notes, billing basics.",
    department: "systems",
    type: "Tango",
    difficulty: "Beginner",
    estimatedMinutes: 30,
    required: true,
    lastUpdated: "2026-04-20",
    owner: "Systems Admin",
    system: "CentralReach",
    tags: ["centralreach", "system"],
  },
  {
    id: "t-monday-ops",
    title: "Monday.com for Operations",
    description: "Boards, automations, and how ops uses Monday daily.",
    department: "systems",
    type: "Tango",
    difficulty: "Beginner",
    estimatedMinutes: 22,
    required: false,
    lastUpdated: "2026-05-08",
    owner: "Systems Admin",
    system: "Monday.com",
    tags: ["monday", "system"],
  },
  {
    id: "t-viventium",
    title: "Viventium Payroll Basics",
    description: "Time entry, approvals, and pay-period close.",
    department: "systems",
    type: "Quick Guide",
    difficulty: "Beginner",
    estimatedMinutes: 15,
    required: false,
    lastUpdated: "2026-04-15",
    owner: "Payroll",
    system: "Viventium",
    tags: ["payroll", "viventium"],
  },
  {
    id: "t-bloom-growth",
    title: "Bloom Growth Rhythm",
    description: "Quarterly planning + weekly L10 cadence inside Bloom Growth.",
    department: "leadership",
    type: "Operational Overview",
    difficulty: "Intermediate",
    estimatedMinutes: 40,
    required: false,
    lastUpdated: "2026-05-14",
    owner: "Executive Team",
    system: "Bloom Growth",
    tags: ["leadership", "bloom growth"],
  },
  {
    id: "t-qa-audit",
    title: "QA Audit Workflow",
    description: "How to audit session notes and document findings cleanly.",
    department: "qa",
    type: "Workflow",
    difficulty: "Intermediate",
    estimatedMinutes: 32,
    required: true,
    lastUpdated: "2026-05-06",
    owner: "QA Lead",
    tags: ["qa", "audit", "documentation"],
  },
  {
    id: "t-billing-claims",
    title: "Claims Submission SOP",
    description: "Standard process for clean claim submissions and corrections.",
    department: "billing",
    type: "SOP",
    difficulty: "Intermediate",
    estimatedMinutes: 26,
    required: true,
    lastUpdated: "2026-04-30",
    owner: "Billing Lead",
    tags: ["billing", "claims"],
  },
  {
    id: "t-hipaa",
    title: "HIPAA Foundations",
    description: "PHI handling, breach response, and everyday compliance.",
    department: "operations",
    type: "Video",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    required: true,
    lastUpdated: "2026-03-12",
    owner: "Compliance",
    tags: ["hipaa", "compliance"],
  },
  {
    id: "t-onboarding",
    title: "New Hire: Your First Week",
    description: "What to do day-by-day during your first week at Blossom.",
    department: "hr",
    type: "Checklist",
    difficulty: "Beginner",
    estimatedMinutes: 12,
    required: true,
    lastUpdated: "2026-05-18",
    owner: "HR Team",
    tags: ["onboarding", "new hire"],
  },
  {
    id: "t-state-director",
    title: "State Director Operating Rhythm",
    description: "Weekly clinic check-ins, KPI review, and escalation paths.",
    department: "leadership",
    type: "Operational Overview",
    difficulty: "Advanced",
    estimatedMinutes: 45,
    required: false,
    lastUpdated: "2026-05-11",
    owner: "Executive Team",
    tags: ["leadership", "state director"],
  },
];

/* ---------------- Mock Progress ---------------- */

export const trainingProgress: Record<string, TrainingProgress> = {
  "t-phone-leads": { trainingId: "t-phone-leads", status: "in_progress", progressPercent: 60, startedAt: "2026-05-12", lastViewedAt: "2026-05-19" },
  "t-vob-decision": { trainingId: "t-vob-decision", status: "in_progress", progressPercent: 35, startedAt: "2026-05-15", lastViewedAt: "2026-05-18" },
  "t-cr-essentials": { trainingId: "t-cr-essentials", status: "completed", progressPercent: 100, startedAt: "2026-04-22", completedAt: "2026-04-23", lastViewedAt: "2026-04-23" },
  "t-hipaa": { trainingId: "t-hipaa", status: "completed", progressPercent: 100, completedAt: "2026-03-15" },
  "t-onboarding": { trainingId: "t-onboarding", status: "overdue", progressPercent: 20, startedAt: "2026-05-01", dueDate: "2026-05-15", lastViewedAt: "2026-05-10" },
  "t-qa-audit": { trainingId: "t-qa-audit", status: "in_progress", progressPercent: 45, startedAt: "2026-05-10", lastViewedAt: "2026-05-17" },
};

export function getProgress(id: string): TrainingProgress {
  return (
    trainingProgress[id] ?? {
      trainingId: id,
      status: "not_started",
      progressPercent: 0,
    }
  );
}

/* ---------------- Sections / Checklists / Resources ---------------- */

export const trainingSections: TrainingSection[] = [
  {
    id: "s-phone-1", trainingId: "t-phone-leads", type: "Overview", title: "Why this matters",
    content:
      "Every great client relationship starts with a phone call. This training walks through how Blossom handles inbound leads, the tools you'll use, and the standards we hold ourselves to.",
  },
  {
    id: "s-phone-2", trainingId: "t-phone-leads", type: "SOP", title: "Standard Operating Procedure",
    content:
      "## Phone & Lead SOP\n\n1. Answer within 3 rings.\n2. Use the Blossom greeting script.\n3. Capture caller info into the Lead form.\n4. Identify intent — new client / existing family / partner.\n5. Hand off to the right teammate inside 10 minutes.",
  },
  {
    id: "s-phone-3", trainingId: "t-phone-leads", type: "Walkthrough", title: "Tango walkthrough",
    content: "Open the Tango walkthrough to follow the live click-by-click.",
    tangoUrl: "https://app.tango.us/app/workflow/lead-intake-demo",
  },
  { id: "s-phone-4", trainingId: "t-phone-leads", type: "Checklist", title: "On-call checklist" },
  { id: "s-phone-5", trainingId: "t-phone-leads", type: "Resources", title: "Resources & templates" },
];

export const trainingChecklists: TrainingChecklistItem[] = [
  { id: "ck-1", trainingId: "t-phone-leads", item: "Open CentralReach lead view", required: true },
  { id: "ck-2", trainingId: "t-phone-leads", item: "Capture caller name + best callback", required: true },
  { id: "ck-3", trainingId: "t-phone-leads", item: "Verify insurance basics", required: true },
  { id: "ck-4", trainingId: "t-phone-leads", item: "Send intake packet", required: true },
  { id: "ck-5", trainingId: "t-phone-leads", item: "Update lead status in Monday", required: false },
  { id: "ck-6", trainingId: "t-phone-leads", item: "Notify intake coordinator", required: true },
];

export const trainingResources: TrainingResource[] = [
  { id: "r-1", trainingId: "t-phone-leads", type: "Tango", title: "Live walkthrough — Lead Intake", url: "#" },
  { id: "r-2", trainingId: "t-phone-leads", type: "PDF", title: "Greeting script (one-pager)", url: "#" },
  { id: "r-3", trainingId: "t-phone-leads", type: "Template", title: "Intake packet template", url: "#" },
  { id: "r-4", trainingId: "t-phone-leads", type: "Link", title: "CentralReach lead view", url: "#" },
];

export const trainingQuiz: TrainingQuizQuestion[] = [
  {
    id: "q-1",
    question: "Within how many rings should you answer an inbound lead call?",
    kind: "multiple_choice",
    options: ["1", "3", "5", "It depends"],
    answerIndex: 1,
  },
  {
    id: "q-2",
    question: "You should always send the intake packet before verifying insurance.",
    kind: "true_false",
    options: ["True", "False"],
    answerIndex: 1,
  },
];

/* ---------------- Helpers ---------------- */

export function getTraining(id: string): Training | undefined {
  return trainings.find((t) => t.id === id);
}

export function getSectionsFor(id: string): TrainingSection[] {
  const list = trainingSections.filter((s) => s.trainingId === id);
  if (list.length) return list;
  // Generic fallback so every training opens cleanly
  return [
    { id: `${id}-ov`, trainingId: id, type: "Overview", title: "Overview", content: "Overview content for this training is being finalized. Use the SOP and Walkthrough sections to start." },
    { id: `${id}-sop`, trainingId: id, type: "SOP", title: "Standard Operating Procedure", content: "## SOP\nThe written SOP for this training will appear here." },
    { id: `${id}-wt`, trainingId: id, type: "Walkthrough", title: "Walkthrough", content: "Embedded Tango walkthrough coming soon.", tangoUrl: "#" },
    { id: `${id}-rs`, trainingId: id, type: "Resources", title: "Resources" },
  ];
}

export function getChecklistFor(id: string): TrainingChecklistItem[] {
  return trainingChecklists.filter((c) => c.trainingId === id);
}

export function getResourcesFor(id: string): TrainingResource[] {
  return trainingResources.filter((r) => r.trainingId === id);
}

export function getDepartment(id: string): TrainingDepartment | undefined {
  return trainingDepartments.find((d) => d.id === id);
}

export function trainingsByDepartment(id: string): Training[] {
  return trainings.filter((t) => t.department === id);
}

export function continueLearning(): { training: Training; progress: TrainingProgress }[] {
  return Object.values(trainingProgress)
    .filter((p) => p.status === "in_progress" || p.status === "overdue")
    .map((p) => ({ training: getTraining(p.trainingId)!, progress: p }))
    .filter((x) => x.training)
    .sort((a, b) => (a.progress.status === "overdue" ? -1 : 1));
}

export function featuredTrainings(): Training[] {
  return trainings.filter((t) => t.featured);
}

export function recentlyAdded(limit = 6): Training[] {
  return [...trainings].sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1)).slice(0, limit);
}

export function searchTrainings(q: string): Training[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return trainings.filter((t) =>
    [t.title, t.description, t.department, t.type, t.owner, t.system ?? "", ...(t.tags ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

/* Role → preferred departments (visibility hint, not a hard filter). */
export function preferredDepartmentsFor(role: string): string[] {
  switch (role) {
    case "intake_coordinator": return ["intake", "authorizations", "operations"];
    case "authorization_coordinator": return ["authorizations", "intake", "operations"];
    case "scheduling_team": return ["scheduling", "operations", "systems"];
    case "recruiting_team": return ["recruiting", "hr", "operations"];
    case "hr_team": return ["hr", "recruiting", "operations"];
    case "qa_team": return ["qa", "clinical", "operations"];
    case "billing_finance": return ["billing", "operations", "systems"];
    case "bcba":
    case "rbt": return ["clinical", "qa", "scheduling"];
    case "state_director":
    case "executive_leadership":
    case "operations_leadership": return ["leadership", "operations", "qa"];
    default: return ["operations", "intake", "systems"];
  }
}

/* SOP-only library view. */
export function sopLibrary(): Training[] {
  return trainings.filter((t) => t.type === "SOP" || t.type === "Workflow" || t.type === "Operational Overview");
}