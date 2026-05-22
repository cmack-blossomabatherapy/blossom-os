/**
 * Training Academy — role-journey data model.
 *
 * Reset and simplified:
 *  - Modules instead of duplicated training cards
 *  - Role Journeys map an OSRole to an ordered list of modules
 *  - Small Systems + Shared (cross-department) catalogs
 *  - SOP/Resource library lives in /sop; modules reference it
 */
import {
  ClipboardList, ShieldCheck, CalendarClock, Users, Heart, CheckCircle2,
  Wallet, Stethoscope, Crown, Workflow, type LucideIcon,
} from "lucide-react";

export type TrainingType = "SOP" | "Workflow" | "Tango" | "Video" | "Checklist" | "Quick Guide";
export type TrainingStatus = "not_started" | "in_progress" | "completed" | "overdue";

export interface RoleJourney {
  id: string;
  role: string; // matches OSRole keys
  title: string;
  tagline: string;
  icon: LucideIcon;
  tone: "violet" | "sky" | "mint" | "rose" | "peach" | "lilac";
  moduleIds: string[]; // ordered
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
  sopRef?: string;
}

export interface TrainingProgress {
  trainingId: string;
  status: TrainingStatus;
  progressPercent: number;
  dueDate?: string;
}

/* ---------------- Modules ---------------- */

export const trainings: Training[] = [
  // Intake
  { id: "phone-leads", title: "Phone Calls & Leads", description: "End-to-end lead handling from first call through warm hand-off.", type: "Workflow", estimatedMinutes: 18, required: true, category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-10" },
  { id: "intake-workflow", title: "Intake Workflow", description: "From qualified lead to active client — stages, ownership, timing.", type: "Workflow", estimatedMinutes: 22, required: true, category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-08" },
  { id: "vob-basics", title: "VOB Basics", description: "Verify benefits accurately and route the file correctly the first time.", type: "SOP", estimatedMinutes: 20, required: true, category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-15" },
  { id: "client-setup", title: "Client Setup", description: "Create a new client cleanly in CentralReach.", type: "Tango", estimatedMinutes: 14, category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-12" },
  { id: "family-communication", title: "Family Communication", description: "Cadence, tone, and templates for parent communication.", type: "Quick Guide", estimatedMinutes: 10, category: "role", department: "intake", owner: "Intake Lead", lastUpdated: "2026-05-04" },

  // Authorizations
  { id: "auth-lifecycle", title: "Authorization Lifecycle", description: "Initial auth → treatment auth → reauth, with payor notes.", type: "Workflow", estimatedMinutes: 30, required: true, category: "role", department: "authorizations", owner: "Auth Coordinator", lastUpdated: "2026-05-04" },
  { id: "reauth-process", title: "Reauthorization Process", description: "Reauth checklist, payor expectations, and avoiding gaps.", type: "SOP", estimatedMinutes: 22, required: true, category: "role", department: "authorizations", owner: "Auth Coordinator", lastUpdated: "2026-05-02" },
  { id: "payor-notes", title: "Payor-Specific Notes", description: "Quick reference for our top payors.", type: "Quick Guide", estimatedMinutes: 12, category: "role", department: "authorizations", owner: "Auth Coordinator", lastUpdated: "2026-04-28" },

  // Scheduling
  { id: "scheduling-process", title: "Scheduling Process", description: "Weekly schedule build, conflict resolution, and capacity check.", type: "Workflow", estimatedMinutes: 25, required: true, category: "role", department: "scheduling", owner: "Scheduling Lead", lastUpdated: "2026-04-28" },
  { id: "schedule-conflicts", title: "Resolving Conflicts", description: "Standard pattern for fixing schedule conflicts without escalation.", type: "SOP", estimatedMinutes: 14, category: "role", department: "scheduling", owner: "Scheduling Lead", lastUpdated: "2026-05-03" },
  { id: "weekly-forecast", title: "Weekly Capacity Forecast", description: "Look ahead 1–2 weeks to spot staffing gaps early.", type: "Quick Guide", estimatedMinutes: 10, category: "role", department: "scheduling", owner: "Scheduling Lead", lastUpdated: "2026-05-05" },

  // QA
  { id: "qa-audit", title: "QA Audit Workflow", description: "Audit session notes and document findings cleanly.", type: "Workflow", estimatedMinutes: 28, required: true, category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-06" },
  { id: "doc-quality", title: "Documentation Quality", description: "What clean documentation looks like and common misses.", type: "SOP", estimatedMinutes: 18, category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-05-02" },
  { id: "supervision-review", title: "Supervision Review", description: "Auditing BCBA supervision hours and notes.", type: "Workflow", estimatedMinutes: 22, category: "role", department: "qa", owner: "QA Lead", lastUpdated: "2026-04-30" },

  // Recruiting
  { id: "recruiting-pipeline", title: "Recruiting Pipeline", description: "Sourcing, screening, and BCBA/RBT pipeline cadence.", type: "Workflow", estimatedMinutes: 24, required: true, category: "role", department: "recruiting", owner: "Recruiting Lead", lastUpdated: "2026-05-12" },
  { id: "screening", title: "Candidate Screening", description: "Phone screen flow and red flags to watch for.", type: "SOP", estimatedMinutes: 16, category: "role", department: "recruiting", owner: "Recruiting Lead", lastUpdated: "2026-05-04" },
  { id: "onboarding-handoff", title: "Onboarding Hand-off", description: "Clean hand-off from Recruiting → HR.", type: "Checklist", estimatedMinutes: 8, category: "role", department: "recruiting", owner: "Recruiting Lead", lastUpdated: "2026-04-30" },

  // BCBA
  { id: "bcba-pr", title: "BCBA Performance Review", description: "PR cadence, expectations, and documentation.", type: "SOP", estimatedMinutes: 20, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-01" },
  { id: "bcba-supervision", title: "Supervision Standards", description: "Cadence, structure, and documentation for supervision.", type: "Workflow", estimatedMinutes: 24, required: true, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-09" },
  { id: "treatment-plans", title: "Treatment Plans", description: "Writing clean, defensible treatment plans.", type: "SOP", estimatedMinutes: 28, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-11" },

  // RBT
  { id: "rbt-first-week", title: "RBT First Week", description: "What to expect — day by day.", type: "Checklist", estimatedMinutes: 12, required: true, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-18" },
  { id: "session-notes", title: "Session Notes", description: "Writing complete, on-time session notes.", type: "SOP", estimatedMinutes: 14, required: true, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-10" },
  { id: "supervision-prep", title: "Preparing for Supervision", description: "How to come prepared every time.", type: "Quick Guide", estimatedMinutes: 8, category: "role", department: "clinical", owner: "Clinical Director", lastUpdated: "2026-05-06" },

  // State Director / Leadership
  { id: "state-rhythm", title: "State Operations Rhythm", description: "The weekly + monthly cadence that keeps a state on track.", type: "Workflow", estimatedMinutes: 28, required: true, category: "role", department: "leadership", owner: "Executive Team", lastUpdated: "2026-05-11" },
  { id: "staffing-management", title: "Staffing Management", description: "How State Directors lead staffing across clinics.", type: "Workflow", estimatedMinutes: 24, category: "role", department: "leadership", owner: "Executive Team", lastUpdated: "2026-05-09" },
  { id: "kpi-review", title: "KPI Review", description: "Reading the KPI scorecards and acting on them.", type: "Quick Guide", estimatedMinutes: 12, category: "role", department: "leadership", owner: "Executive Team", lastUpdated: "2026-05-14" },
  { id: "escalations", title: "Operational Escalations", description: "When and how to escalate — clean and fast.", type: "SOP", estimatedMinutes: 14, category: "role", department: "leadership", owner: "Executive Team", lastUpdated: "2026-05-07" },

  // HR
  { id: "hr-onboarding", title: "Employee Onboarding", description: "Standard onboarding flow inside Viventium + Blossom OS.", type: "Workflow", estimatedMinutes: 22, required: true, category: "role", department: "hr", owner: "HR Team", lastUpdated: "2026-05-12" },
  { id: "evaluations", title: "Evaluations", description: "Quarterly and annual evaluation cadence.", type: "SOP", estimatedMinutes: 18, category: "role", department: "hr", owner: "HR Team", lastUpdated: "2026-05-08" },
  { id: "hr-compliance", title: "Compliance Basics", description: "Day-to-day HR compliance must-knows.", type: "Quick Guide", estimatedMinutes: 12, category: "role", department: "hr", owner: "HR Team", lastUpdated: "2026-04-30" },

  // Billing & Finance
  { id: "claims", title: "Claims Submission", description: "Standard process for clean claims and corrections.", type: "SOP", estimatedMinutes: 22, required: true, category: "role", department: "billing", owner: "Billing Lead", lastUpdated: "2026-04-30" },
  { id: "payment-plans", title: "Payment Plans", description: "Setting up family payment plans cleanly.", type: "Workflow", estimatedMinutes: 18, category: "role", department: "billing", owner: "Billing Lead", lastUpdated: "2026-05-02" },
  { id: "ar-followup", title: "AR Follow-up", description: "How we work AR every week.", type: "SOP", estimatedMinutes: 16, category: "role", department: "billing", owner: "Billing Lead", lastUpdated: "2026-05-04" },

  // Systems
  { id: "sys-centralreach", title: "CentralReach Essentials", description: "Scheduling, notes, and billing basics inside CR.", type: "Tango", estimatedMinutes: 30, category: "systems", department: "systems", owner: "Systems Admin", lastUpdated: "2026-04-20" },
  { id: "sys-viventium", title: "Viventium Payroll", description: "Time entry, approvals, and pay-period close.", type: "Quick Guide", estimatedMinutes: 15, category: "systems", department: "systems", owner: "Payroll", lastUpdated: "2026-04-15" },
  { id: "sys-solum", title: "Solum for VOBs", description: "Run VOBs cleanly inside Solum.", type: "Tango", estimatedMinutes: 16, category: "systems", department: "systems", owner: "Intake Lead", lastUpdated: "2026-05-01" },
  { id: "sys-outlook", title: "Outlook & Calendar", description: "Email + calendar setup for Blossom workflows.", type: "Quick Guide", estimatedMinutes: 10, category: "systems", department: "systems", owner: "Systems Admin", lastUpdated: "2026-04-22" },
  { id: "sys-bloom", title: "Bloom Growth Rhythm", description: "Quarterly planning + weekly L10 cadence.", type: "Workflow", estimatedMinutes: 28, category: "systems", department: "systems", owner: "Executive Team", lastUpdated: "2026-05-14" },
  { id: "sys-teams", title: "Microsoft Teams Basics", description: "Channels, meetings, and Blossom Teams etiquette.", type: "Quick Guide", estimatedMinutes: 8, category: "systems", department: "systems", owner: "Systems Admin", lastUpdated: "2026-04-18" },

  // Shared / Cross-department
  { id: "shared-hipaa", title: "HIPAA Foundations", description: "PHI handling, breach response, and everyday compliance.", type: "Video", estimatedMinutes: 25, required: true, category: "shared", department: "shared", owner: "Compliance", lastUpdated: "2026-03-12" },
  { id: "shared-new-hire", title: "New Hire: Your First Week", description: "What to do day by day during your first week.", type: "Checklist", estimatedMinutes: 12, required: true, category: "shared", department: "shared", owner: "HR Team", lastUpdated: "2026-05-18" },
  { id: "shared-leadership", title: "Leadership Foundations", description: "How leaders lead at Blossom.", type: "Workflow", estimatedMinutes: 22, category: "shared", department: "shared", owner: "Executive Team", lastUpdated: "2026-05-10" },
];

/* ---------------- Role Journeys ---------------- */

export const ROLE_JOURNEYS: RoleJourney[] = [
  { id: "j-intake", role: "intake_coordinator", title: "Intake Coordinator Journey", tagline: "From first phone call to a happy active client.", icon: ClipboardList, tone: "lilac", moduleIds: ["phone-leads", "intake-workflow", "vob-basics", "client-setup", "family-communication"] },
  { id: "j-auth", role: "authorization_coordinator", title: "Authorization Coordinator Journey", tagline: "Auths approved on time, every time.", icon: ShieldCheck, tone: "sky", moduleIds: ["auth-lifecycle", "reauth-process", "payor-notes"] },
  { id: "j-scheduling", role: "scheduling_team", title: "Scheduling Journey", tagline: "Build clean schedules that hold up.", icon: CalendarClock, tone: "mint", moduleIds: ["scheduling-process", "schedule-conflicts", "weekly-forecast"] },
  { id: "j-qa", role: "qa_team", title: "QA Journey", tagline: "Protect clinical quality with calm rigor.", icon: CheckCircle2, tone: "violet", moduleIds: ["qa-audit", "doc-quality", "supervision-review"] },
  { id: "j-recruiting", role: "recruiting_team", title: "Recruiting Journey", tagline: "A predictable pipeline of great clinicians.", icon: Users, tone: "peach", moduleIds: ["recruiting-pipeline", "screening", "onboarding-handoff"] },
  { id: "j-bcba", role: "bcba", title: "BCBA Journey", tagline: "Clinical excellence and clean supervision.", icon: Stethoscope, tone: "sky", moduleIds: ["bcba-supervision", "treatment-plans", "bcba-pr"] },
  { id: "j-rbt", role: "rbt", title: "RBT Journey", tagline: "Show up prepared, document on time.", icon: Stethoscope, tone: "mint", moduleIds: ["rbt-first-week", "session-notes", "supervision-prep"] },
  { id: "j-state", role: "state_director", title: "State Director Journey", tagline: "Run a state with calm, operational rhythm.", icon: Crown, tone: "violet", moduleIds: ["state-rhythm", "staffing-management", "kpi-review", "escalations"] },
  { id: "j-hr", role: "hr_team", title: "HR Journey", tagline: "Take care of the people who take care of clients.", icon: Heart, tone: "rose", moduleIds: ["hr-onboarding", "evaluations", "hr-compliance"] },
  { id: "j-billing", role: "billing_finance", title: "Billing & Finance Journey", tagline: "Keep revenue clean and predictable.", icon: Wallet, tone: "lilac", moduleIds: ["claims", "payment-plans", "ar-followup"] },
  { id: "j-exec", role: "executive_leadership", title: "Executive Leadership Journey", tagline: "Lead Blossom with rhythm and clarity.", icon: Crown, tone: "violet", moduleIds: ["state-rhythm", "kpi-review", "escalations", "sys-bloom"] },
  { id: "j-ops", role: "operations_leadership", title: "Operations Leadership Journey", tagline: "Keep all states pulling the same direction.", icon: Workflow, tone: "violet", moduleIds: ["state-rhythm", "kpi-review", "staffing-management", "escalations"] },
];

/* ---------------- Mock progress ---------------- */

export const trainingProgress: Record<string, TrainingProgress> = {
  "phone-leads": { trainingId: "phone-leads", status: "in_progress", progressPercent: 60 },
  "vob-basics": { trainingId: "vob-basics", status: "in_progress", progressPercent: 35 },
  "sys-centralreach": { trainingId: "sys-centralreach", status: "completed", progressPercent: 100 },
  "shared-hipaa": { trainingId: "shared-hipaa", status: "completed", progressPercent: 100 },
  "shared-new-hire": { trainingId: "shared-new-hire", status: "overdue", progressPercent: 20, dueDate: "2026-05-15" },
  "qa-audit": { trainingId: "qa-audit", status: "in_progress", progressPercent: 45 },
};

export function getProgress(id: string): TrainingProgress {
  return trainingProgress[id] ?? { trainingId: id, status: "not_started", progressPercent: 0 };
}

/* ---------------- Lookups ---------------- */

export function getTraining(id: string): Training | undefined {
  return trainings.find((t) => t.id === id);
}

export function getJourneyForRole(role: string): RoleJourney {
  const direct = ROLE_JOURNEYS.find((j) => j.role === role);
  if (direct) return direct;
  if (role === "super_admin") return ROLE_JOURNEYS.find((j) => j.role === "executive_leadership")!;
  return ROLE_JOURNEYS.find((j) => j.role === "operations_leadership")!;
}

export function getJourneyModules(j: RoleJourney): Training[] {
  return j.moduleIds.map((id) => getTraining(id)).filter(Boolean) as Training[];
}

export function continueLearning(): { training: Training; progress: TrainingProgress }[] {
  return Object.values(trainingProgress)
    .filter((p) => p.status === "in_progress" || p.status === "overdue")
    .map((p) => ({ training: getTraining(p.trainingId)!, progress: p }))
    .filter((x) => x.training)
    .sort((a, b) => {
      const aOver = a.progress.status === "overdue" ? 0 : 1;
      const bOver = b.progress.status === "overdue" ? 0 : 1;
      return aOver - bOver;
    });
}

export function requiredDue(): Training[] {
  return trainings.filter((t) => t.required && getProgress(t.id).status !== "completed");
}

export function systemsTrainings(): Training[] {
  return trainings.filter((t) => t.category === "systems");
}

export function sharedTrainings(): Training[] {
  return trainings.filter((t) => t.category === "shared");
}

export function searchTrainings(q: string): Training[] {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return trainings.filter((t) =>
    [t.title, t.description, t.type, t.department ?? "", t.owner ?? ""]
      .join(" ").toLowerCase().includes(term),
  );
}

/* ---------------- Detail-page compatibility ---------------- *
 * OSTrainingDetail.tsx uses the section/checklist/resource/quiz API.
 * We keep generic fallbacks so every module opens cleanly.
 */

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

export function getSectionsFor(id: string): TrainingSection[] {
  return [
    { id: `${id}-ov`, trainingId: id, type: "Overview", title: "Overview", content: "Why this module matters and how it connects to your role." },
    { id: `${id}-sop`, trainingId: id, type: "SOP", title: "Standard Operating Procedure", content: "## SOP\nThe written SOP for this module lives in the Resource Library and is linked here." },
    { id: `${id}-wt`, trainingId: id, type: "Walkthrough", title: "Tango Walkthrough", content: "Click-by-click walkthrough.", tangoUrl: "#" },
    { id: `${id}-ck`, trainingId: id, type: "Checklist", title: "Checklist" },
    { id: `${id}-rs`, trainingId: id, type: "Resources", title: "Resources" },
  ];
}

export function getChecklistFor(id: string): TrainingChecklistItem[] {
  return [
    { id: `${id}-c1`, trainingId: id, item: "Read the SOP top to bottom", required: true },
    { id: `${id}-c2`, trainingId: id, item: "Watch the Tango walkthrough", required: true },
    { id: `${id}-c3`, trainingId: id, item: "Try the workflow once (sandbox or shadow a teammate)", required: true },
  ];
}

export function getResourcesFor(id: string): TrainingResource[] {
  return [
    { id: `${id}-r1`, trainingId: id, type: "Tango", title: "Live walkthrough", url: "#" },
    { id: `${id}-r2`, trainingId: id, type: "PDF", title: "One-pager", url: "#" },
    { id: `${id}-r3`, trainingId: id, type: "Link", title: "Resource Library entry", url: "/sop" },
  ];
}

export const trainingQuiz: TrainingQuizQuestion[] = [
  { id: "q-1", question: "What's the first step in this workflow?", kind: "multiple_choice", options: ["Send the form", "Call the family", "Open CentralReach", "Notify the team"], answerIndex: 2 },
  { id: "q-2", question: "You should escalate before trying the standard SOP.", kind: "true_false", options: ["True", "False"], answerIndex: 1 },
];