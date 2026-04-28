import { Award, BarChart3, BookOpen, Briefcase, Building2, CheckCircle2, ClipboardCheck, FileText, GraduationCap, HeartHandshake, Landmark, Laptop, Phone, ShieldCheck, Sparkles, Stethoscope, Users, Wallet } from "lucide-react";

export type TrainingStatus = "Not Started" | "In Progress" | "Completed" | "Overdue";
export type TrainingType = "SOP" | "Video" | "Tango" | "Checklist" | "Quiz" | "Policy" | "Workflow" | "System Training" | "Onboarding" | "Clinical";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type LessonType = "Written SOP" | "Video" | "Tango" | "Checklist" | "Quiz" | "File" | "External Link";

export interface TrainingLesson { id: string; title: string; description: string; type: LessonType; minutes: number; required: boolean; content: string; resourceUrl?: string; tangoUrl?: string; completed?: boolean; }
export interface QuizQuestion { id: string; question: string; type: "Multiple choice" | "True / false" | "Short answer"; options?: string[]; answer: string; explanation?: string; }
export interface TrainingVersion { id: string; version: number; savedAt: string; savedBy: string; changeSummary: string[]; snapshot: Omit<TrainingCourse, "versions">; }
export interface TrainingCourse { id: string; departmentId: string; title: string; description: string; type: TrainingType; difficulty: Difficulty; minutes: number; required: boolean; status: TrainingStatus; progress: number; dueDate?: string; requiredBy?: string; lastOpened?: string; startedAt?: string; quizScore?: number; popular?: boolean; recentlyAdded?: boolean; archived?: boolean; roleVisibility: string[]; lessons: TrainingLesson[]; quiz?: { passingScore: number; allowRetake?: boolean; questions: QuizQuestion[] }; resources: string[]; owner: string; versions?: TrainingVersion[]; objectives?: string[]; sop?: { title: string; content: string; fileName?: string; fileUrl?: string; useAsMainContent: boolean }; walkthroughs?: { id: string; url: string; label: string }[]; trainingSteps?: { id: string; title: string; description: string; imagePlaceholder?: string; tangoReference?: string; systemTag?: string }[]; contentBlocks?: { id: string; type: string; title: string; body: string; url?: string }[]; completionChecklist?: { id: string; label: string; required: boolean }[]; commonMistakes?: { id: string; error: string; consequence: string; avoid: string }[]; badge?: { title: string; description: string; awardOnCompletion: boolean }; assignmentSettings?: { role: string; department: string; individual: string; dueDate: string; required: boolean; reminder: boolean }; qualityScore?: number; published?: boolean; templateName?: string; builderVersion?: number; updatedAt?: string; }
export type TrainingAuditAction = "created" | "edited" | "archived" | "deleted" | "restored" | "resource_added" | "resource_changed" | "rolled_back";
export interface TrainingAuditEntry { id: string; trainingId: string; trainingTitle: string; action: TrainingAuditAction; actor: string; actorRole: string; occurredAt: string; summary: string; details: string[]; itemType: "Training" | "Resource"; }
export interface TrainingDepartment { id: string; slug: string; name: string; shortName: string; description: string; icon: keyof typeof iconMap; accent: string; sort: number; }
export interface TrainingProgressRecord { userId: string; trainingId: string; department: string; startedDate?: string; lastOpenedDate?: string; completedDate?: string; progressPercentage: number; lessonsCompleted: string[]; quizScore?: number; status: TrainingStatus; timeSpentMinutes: number; required: boolean; dueDate?: string; assignedBy?: string; }
export type TrainingBadgeReason = "Course completion" | "Role certification" | "Compliance readiness" | "Workflow mastery" | "Leadership recognition" | "Systems proficiency";
export interface TrainingBadge { id: string; emoji: string; title: string; reason: TrainingBadgeReason; description: string; earned: boolean; earnedAt?: string; }
export type TrainingResourceCategory = "SOP" | "Tango" | "Checklist" | "Policy" | "System Guide" | "Workflow";
export interface TrainingResourcePlaceholder { id: string; category: TrainingResourceCategory; roleGroup: string; title: string; description: string; }

export const iconMap = { Award, BarChart3, BookOpen, Briefcase, Building2, CheckCircle2, ClipboardCheck, FileText, GraduationCap, HeartHandshake, Landmark, Laptop, Phone, ShieldCheck, Sparkles, Stethoscope, Users, Wallet };

export const trainingDepartments: TrainingDepartment[] = [
  { id: "exec", slug: "executive-leadership", name: "Executive Leadership", shortName: "Leadership", icon: "BarChart3", accent: "bg-primary/10 text-primary", sort: 1, description: "Leadership dashboards, multi-state oversight, KPIs, and escalation standards." },
  { id: "ops", slug: "operations", name: "Operations", shortName: "Operations", icon: "Briefcase", accent: "bg-success/10 text-success", sort: 2, description: "Department handoffs, Monday ownership, communication, and execution rhythms." },
  { id: "systems", slug: "systems-software", name: "Systems & Software", shortName: "Systems", icon: "Laptop", accent: "bg-info/10 text-info", sort: 3, description: "Blossom OS, Monday.com, automations, SharePoint, and CentralReach access." },
  { id: "hr", slug: "hr-recruiting", name: "HR & Recruiting", shortName: "HR", icon: "HeartHandshake", accent: "bg-accent/10 text-accent", sort: 4, description: "Recruiting, onboarding, background checks, interviews, and Viventium workflows." },
  { id: "finance", slug: "finance-payroll", name: "Finance & Payroll", shortName: "Finance", icon: "Wallet", accent: "bg-warning/10 text-warning", sort: 5, description: "Payroll basics, EOBs, payment plans, client responsibility, and escalations." },
  { id: "intake", slug: "intake", name: "Intake", shortName: "Intake", icon: "Phone", accent: "bg-primary/10 text-primary", sort: 6, description: "Leads, forms, follow-ups, VOB handoffs, phone calls, and Monday workflows." },
  { id: "auth", slug: "authorizations", name: "Authorizations", shortName: "Auth", icon: "ShieldCheck", accent: "bg-destructive/10 text-destructive", sort: 7, description: "Authorization lifecycle from awaiting submission through approval, denial, and reauth." },
  { id: "clients", slug: "client-lifecycle", name: "Client Lifecycle", shortName: "Clients", icon: "Users", accent: "bg-success/10 text-success", sort: 8, description: "Client movement from BCBA assignment to active services." },
  { id: "qa", slug: "qa-compliance", name: "QA & Compliance", shortName: "QA", icon: "ClipboardCheck", accent: "bg-warning/10 text-warning", sort: 9, description: "Treatment plan review, documentation standards, checklists, and progress reports." },
  { id: "clinic", slug: "clinic-operations", name: "Clinic Operations", shortName: "Clinics", icon: "Building2", accent: "bg-info/10 text-info", sort: 10, description: "Clinic scheduling, staff coordination, daily clinic standards, and site operations." },
  { id: "state", slug: "state-leadership", name: "State Leadership", shortName: "State", icon: "Landmark", accent: "bg-primary/10 text-primary", sort: 11, description: "State director responsibilities, staffing escalations, and BCBA accountability." },
  { id: "clinical", slug: "clinical-bcba-rbt-support", name: "Clinical / BCBA / RBT Support", shortName: "Clinical", icon: "Stethoscope", accent: "bg-success/10 text-success", sort: 12, description: "CentralReach, parent communication, progress reports, RBT support, and BCBA basics." },
  { id: "general", slug: "general-blossom-training", name: "General Blossom Training", shortName: "General", icon: "Sparkles", accent: "bg-accent/10 text-accent", sort: 13, description: "Company mission, HIPAA awareness, communication standards, systems overview, and help paths." },
];

export const TRAINING_STORAGE_KEY = "blossom-training-courses";
export const TRAINING_UPDATED_EVENT = "blossom-training-courses-updated";
export const TRAINING_AUDIT_STORAGE_KEY = "blossom-training-audit-log";
export const TRAINING_AUDIT_UPDATED_EVENT = "blossom-training-audit-updated";
export const TRAINING_ASSIGNMENTS_STORAGE_KEY = "blossom-training-assignments";
export const TRAINING_ASSIGNMENTS_UPDATED_EVENT = "blossom-training-assignments-updated";
export const TRAINING_BADGES_STORAGE_KEY = "blossom-training-badges";
export const TRAINING_BADGES_UPDATED_EVENT = "blossom-training-badges-updated";

export const trainingCourses: TrainingCourse[] = [];

export type TrainingAssignmentStatus = "assigned" | "in_progress" | "completed" | "overdue";
export interface TrainingAssignmentRecord { id: string; courseId: string; courseTitle: string; target: string; department: string; role: string; dueDate: string; required: boolean; assignedAt: string; employeeId: string; employeeName: string; employeeEmail?: string; status: TrainingAssignmentStatus; progress: number; startedAt?: string; completedAt?: string; }

export type CreateTrainingInput = Pick<TrainingCourse, "departmentId" | "title" | "description" | "type" | "difficulty" | "minutes" | "required" | "roleVisibility" | "owner"> & {
  dueDate?: string;
  requiredBy?: string;
  resources?: string[];
};

export function getStoredTrainingCourses(): TrainingCourse[] {
  if (typeof window === "undefined") return trainingCourses;
  try {
    const stored = window.localStorage.getItem(TRAINING_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TrainingCourse[]) : trainingCourses;
  } catch {
    return trainingCourses;
  }
}

export function saveStoredTrainingCourses(courses: TrainingCourse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(courses));
  window.dispatchEvent(new Event(TRAINING_UPDATED_EVENT));
}

export function getStoredTrainingAuditLog(): TrainingAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(TRAINING_AUDIT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TrainingAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredTrainingAuditLog(entries: TrainingAuditEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINING_AUDIT_STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(TRAINING_AUDIT_UPDATED_EVENT));
}

export function getStoredTrainingAssignments(): TrainingAssignmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(TRAINING_ASSIGNMENTS_STORAGE_KEY);
    const rows = stored ? (JSON.parse(stored) as TrainingAssignmentRecord[]) : [];
    const today = new Date().toISOString().slice(0, 10);
    return rows.map((row) => row.dueDate && row.dueDate < today && row.status !== "completed" ? { ...row, status: "overdue", progress: Math.max(row.progress ?? 0, 0) } : row);
  } catch {
    return [];
  }
}

export function saveStoredTrainingAssignments(assignments: TrainingAssignmentRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINING_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  window.dispatchEvent(new Event(TRAINING_ASSIGNMENTS_UPDATED_EVENT));
}

export function getStoredTrainingBadges(): TrainingBadge[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(TRAINING_BADGES_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TrainingBadge[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredTrainingBadges(badges: TrainingBadge[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINING_BADGES_STORAGE_KEY, JSON.stringify(badges));
  window.dispatchEvent(new Event(TRAINING_BADGES_UPDATED_EVENT));
}

export function createTrainingCourse(input: CreateTrainingInput): TrainingCourse {
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "training";
  const id = `${input.departmentId}-${slug}-${Date.now()}`;
  return {
    id,
    departmentId: input.departmentId,
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    difficulty: input.difficulty,
    minutes: input.minutes,
    required: input.required,
    status: "Not Started",
    progress: 0,
    dueDate: input.dueDate || undefined,
    requiredBy: input.requiredBy || undefined,
    recentlyAdded: true,
    archived: false,
    roleVisibility: input.roleVisibility,
    owner: input.owner.trim() || "Training Admin",
    resources: input.resources?.filter(Boolean) ?? [],
    lessons: makeLessons(id, input.title.trim(), input.type, input.minutes),
    quiz: makeQuiz(input.title.trim()),
  };
}

function makeLessons(courseId: string, title: string, type: TrainingType, minutes: number): TrainingLesson[] {
  return [
    { id: `${courseId}-start`, title: "Start Here", description: "Understand why this workflow matters.", type: "Written SOP", minutes: 4, required: true, completed: false, content: `${title} starts with clear ownership, accurate documentation, and timely handoffs. Review the standard, then apply it to real Blossom examples.` },
    { id: `${courseId}-workflow`, title: "Core Workflow", description: "Walk through the steps and expected outcomes.", type: type === "Tango" ? "Tango" : "Written SOP", minutes: Math.max(6, Math.round(minutes * 0.35)), required: true, completed: false, tangoUrl: "https://app.tango.us/app/workflow/blossom-placeholder", content: "Follow each stage, confirm required fields, document blockers, and move work only when the next team has what they need." },
    { id: `${courseId}-mistakes`, title: "Common Mistakes", description: "See what usually slows teams down.", type: "Checklist", minutes: 5, required: true, completed: false, content: "Common mistakes include missing owners, unclear notes, skipped verification steps, and moving records without required documents." },
    { id: `${courseId}-quiz`, title: "Knowledge Check", description: "Confirm readiness with a short quiz.", type: "Quiz", minutes: 5, required: true, completed: false, content: "Answer the questions to complete this module." },
  ];
}
function makeQuiz(title: string) { return { passingScore: 80, questions: [{ id: "q1", question: `The main goal of ${title} is to create clear ownership and clean handoffs.`, type: "True / false" as const, options: ["True", "False"], answer: "True" }, { id: "q2", question: "What should you do when required information is missing?", type: "Multiple choice" as const, options: ["Move it forward anyway", "Document the blocker and notify the owner", "Delete the task", "Wait silently"], answer: "Document the blocker and notify the owner" }, { id: "q3", question: "Short answer placeholder: where would you document a blocker?", type: "Short answer" as const, answer: "In the record notes or task comments" }] }; }

export const trainingBadges: TrainingBadge[] = [];
export const badgeReasonOptions: TrainingBadgeReason[] = ["Course completion", "Role certification", "Compliance readiness", "Workflow mastery", "Leadership recognition", "Systems proficiency"];
export const featuredResources: TrainingResourcePlaceholder[] = [];
export const resourcePlaceholders: TrainingResourcePlaceholder[] = [
  { id: "resource-sop", category: "SOP", roleGroup: "Role-specific", title: "SOP resource slot", description: "Add the best SOP for this teammate’s role." },
  { id: "resource-tango", category: "Tango", roleGroup: "Role-specific", title: "Tango walkthrough slot", description: "Add the best guided walkthrough for this role." },
  { id: "resource-checklist", category: "Checklist", roleGroup: "Role-specific", title: "Checklist resource slot", description: "Add the checklist that helps this role move faster." },
  { id: "resource-policy", category: "Policy", roleGroup: "Compliance", title: "Policy resource slot", description: "Add policy guidance when the resource library is ready." },
];
export const demoLearners = ["Alyssa Morgan", "Priya Shah", "Marcus Green", "Nina Patel", "Jordan Miles", "Kayla Reed", "Devon Stone", "Riki Santos", "Taylor Quinn", "Avery Brooks", "Sam Rivera", "Jamie Lin"].map((name, i) => ({ id: `emp-${i}`, name, role: ["Intake Coordinator", "Auth Coordinator", "BCBA", "Scheduler", "HR Manager", "RBT"][i % 6], department: trainingDepartments[i % trainingDepartments.length].shortName, state: ["GA", "NC", "TN", "VA", "MD"][i % 5], assigned: 8 + (i % 7), completed: 3 + (i % 6), inProgress: 2 + (i % 3), overdue: i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0, lastActive: `Apr ${26 - (i % 8)}`, completion: 45 + (i * 7) % 52, quiz: 76 + (i * 3) % 22 }));
export const trainingPathSteps = ["Start Here", "Core Workflow", "System Training", "SOP Review", "Common Mistakes", "Quiz / Knowledge Check", "Completion"];
