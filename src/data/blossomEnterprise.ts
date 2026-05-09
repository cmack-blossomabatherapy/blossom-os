// Phase 6 — Enterprise mock data. Shapes mirror eventual Supabase tables.
// All values are illustrative; no live integrations yet.

export type Severity = "low" | "medium" | "high" | "critical";
export type TrendDir = "up" | "down" | "flat";

/* ============== Workforce Readiness Index ============== */
export interface ReadinessFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
  trend: TrendDir;
  delta: number;
}

export interface ReadinessBreakdown {
  id: string;
  scope: "department" | "state" | "manager" | "clinic";
  name: string;
  score: number;
  headcount: number;
  trend: TrendDir;
  delta: number;
}

export const readinessScore = {
  composite: 87,
  trend: "up" as TrendDir,
  delta: 3,
  history: [78, 79, 81, 80, 83, 84, 85, 86, 87],
  asOf: "Today",
  factors: [
    { key: "onboarding", label: "Onboarding completion", score: 92, weight: 0.18, trend: "up" as TrendDir, delta: 4 },
    { key: "compliance", label: "Compliance & certs", score: 88, weight: 0.20, trend: "up" as TrendDir, delta: 2 },
    { key: "competencies", label: "Competencies verified", score: 84, weight: 0.18, trend: "flat" as TrendDir, delta: 0 },
    { key: "training", label: "Operational training", score: 90, weight: 0.16, trend: "up" as TrendDir, delta: 5 },
    { key: "engagement", label: "Engagement & culture", score: 81, weight: 0.14, trend: "up" as TrendDir, delta: 3 },
    { key: "tasks", label: "Task completion", score: 85, weight: 0.14, trend: "down" as TrendDir, delta: -1 },
  ] as ReadinessFactor[],
};

export const readinessBreakdowns: ReadinessBreakdown[] = [
  { id: "intake", scope: "department", name: "Intake", score: 91, headcount: 14, trend: "up", delta: 4 },
  { id: "auth", scope: "department", name: "Authorizations", score: 86, headcount: 9, trend: "up", delta: 2 },
  { id: "scheduling", scope: "department", name: "Scheduling", score: 78, headcount: 12, trend: "down", delta: -3 },
  { id: "qa", scope: "department", name: "QA & Compliance", score: 74, headcount: 8, trend: "down", delta: -5 },
  { id: "clinical", scope: "department", name: "Clinical", score: 89, headcount: 142, trend: "up", delta: 2 },
  { id: "fl", scope: "state", name: "Florida", score: 90, headcount: 78, trend: "up", delta: 3 },
  { id: "ga", scope: "state", name: "Georgia", score: 79, headcount: 52, trend: "down", delta: -2 },
  { id: "tx", scope: "state", name: "Texas", score: 86, headcount: 31, trend: "up", delta: 4 },
  { id: "nc", scope: "state", name: "North Carolina", score: 84, headcount: 18, trend: "flat", delta: 0 },
  { id: "tn", scope: "state", name: "Tennessee", score: 81, headcount: 12, trend: "up", delta: 2 },
];

/* ============== Compliance & Audit ============== */
export interface ComplianceItem {
  id: string;
  title: string;
  category: "Certification" | "Policy" | "Training" | "Signature" | "Audit";
  status: "ok" | "expiring" | "overdue" | "missing";
  owner: string;
  expiresOn?: string;
  daysOut?: number;
}

export const complianceItems: ComplianceItem[] = [
  { id: "c1", title: "BCBA Certification — A. Park", category: "Certification", status: "expiring", owner: "Aaron Park", expiresOn: "2026-06-12", daysOut: 33 },
  { id: "c2", title: "RBT 40-hr Renewal — M. Chen", category: "Training", status: "overdue", owner: "Mei Chen", expiresOn: "2026-04-22", daysOut: -16 },
  { id: "c3", title: "HIPAA Annual Acknowledgement", category: "Policy", status: "expiring", owner: "All Staff", expiresOn: "2026-06-30", daysOut: 51 },
  { id: "c4", title: "Background Check — J. Rivera", category: "Audit", status: "ok", owner: "Jordan Rivera", expiresOn: "2027-01-10" },
  { id: "c5", title: "CPR Certification — D. Singh", category: "Certification", status: "missing", owner: "Devorah Singh" },
  { id: "c6", title: "PHI Handling Signature — New Hires", category: "Signature", status: "expiring", owner: "Onboarding", expiresOn: "2026-05-25", daysOut: 16 },
];

export interface AuditPacket {
  id: string;
  name: string;
  range: string;
  itemCount: number;
  status: "draft" | "ready" | "exported";
}

export const auditPackets: AuditPacket[] = [
  { id: "ap1", name: "Q2 2026 Compliance Packet", range: "Apr–Jun 2026", itemCount: 142, status: "draft" },
  { id: "ap2", name: "Florida State Audit", range: "Last 12 months", itemCount: 318, status: "ready" },
  { id: "ap3", name: "Annual HIPAA Acknowledgements", range: "2025", itemCount: 89, status: "exported" },
];

/* ============== AI Course Studio ============== */
export interface CourseSource {
  id: string;
  kind: "SOP" | "Tango" | "Loom" | "PDF" | "Video" | "Notes";
  title: string;
  meta: string;
}

export const courseSources: CourseSource[] = [
  { id: "s1", kind: "SOP", title: "Initial VOB Process", meta: "12 steps · 1.4k words" },
  { id: "s2", kind: "Tango", title: "Adding a Client to CentralReach", meta: "23 steps" },
  { id: "s3", kind: "Loom", title: "Scheduling Conflict Walkthrough", meta: "8m 14s" },
  { id: "s4", kind: "PDF", title: "Authorization Denial Playbook", meta: "9 pages" },
  { id: "s5", kind: "Video", title: "Parent Intake Call Demo", meta: "12m 02s" },
  { id: "s6", kind: "Notes", title: "QA Review Checklist Notes", meta: "Pasted text" },
];

export interface GeneratedModule {
  id: string;
  title: string;
  objectives: string[];
  summary: string;
  quizQuestions: number;
  durationMin: number;
  scenarios: number;
}

export const generatedCourse = {
  title: "VOB Mastery — From Lead to Verified",
  competency: "Verification of Benefits",
  level: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
  tone: "Warm professional",
  role: "Intake Coordinator",
  totalMin: 42,
  modules: [
    { id: "m1", title: "Why VOB Matters", objectives: ["Explain VOB role in revenue", "Identify common payors", "Recognize red flags"], summary: "Sets the stage with the business and family impact of accurate VOBs.", quizQuestions: 4, durationMin: 8, scenarios: 1 },
    { id: "m2", title: "Submitting a Solum Request", objectives: ["Complete a Solum form", "Attach the right documents", "Avoid 3 common errors"], summary: "Step-by-step Tango walkthrough with knowledge checks.", quizQuestions: 5, durationMin: 12, scenarios: 2 },
    { id: "m3", title: "Reading & Communicating Results", objectives: ["Interpret coverage codes", "Explain results to families", "Escalate appropriately"], summary: "Includes a branching parent-call simulation.", quizQuestions: 6, durationMin: 14, scenarios: 2 },
    { id: "m4", title: "Handoff & Financial Gate", objectives: ["Trigger financial review", "Document outcomes", "Move to client conversion"], summary: "Closes the loop and links to the Financial Gate SOP.", quizQuestions: 4, durationMin: 8, scenarios: 1 },
  ] as GeneratedModule[],
};

/* ============== SOP Intelligence ============== */
export interface SopAnswer {
  id: string;
  question: string;
  answer: string;
  citedSops: { id: string; title: string }[];
  relatedTrainings: { id: string; title: string }[];
}

export const sopAnswers: SopAnswer[] = [
  { id: "sa1", question: "How do auth denials work?", answer: "When an auth is denied, the assigned coordinator receives an immediate task to correct the documentation. Devorah is the default escalation owner. The team has 1 business day to resubmit; if the denial reason is medical-necessity related, the BCBA must add justification before resubmission.", citedSops: [{ id: "sop-12", title: "Authorization Denial Playbook" }, { id: "sop-08", title: "Documentation Correction Workflow" }], relatedTrainings: [{ id: "t-44", title: "Auth Submission Mastery" }, { id: "t-77", title: "Working with Devorah on Escalations" }] },
  { id: "sa2", question: "What is the financial gate process?", answer: "After VOB is received, leads enter Financial Review. Medicaid is auto-approved. Commercial payors require Gabi's review and may trigger a payment plan or non-viable status. Approved gates create a client-pipeline conversion task automatically.", citedSops: [{ id: "sop-15", title: "Financial Gate SOP" }], relatedTrainings: [{ id: "t-12", title: "Financial Review Fundamentals" }] },
];

export interface SopChange {
  id: string;
  sopTitle: string;
  changedAt: string;
  changedBy: string;
  summary: string;
  diff: { added: string[]; removed: string[] };
}

export const sopChanges: SopChange[] = [
  { id: "sc1", sopTitle: "Authorization Denial Playbook", changedAt: "2 days ago", changedBy: "Devorah Singh", summary: "Tightened resubmission SLA from 3 days to 1 business day.", diff: { added: ["Resubmit within 1 business day", "BCBA must add medical-necessity note"], removed: ["Resubmit within 3 business days"] } },
  { id: "sc2", sopTitle: "Onboarding — Georgia New Hires", changedAt: "5 days ago", changedBy: "HR Admin", summary: "Added state-specific signature packet.", diff: { added: ["GA Sworn Statement", "GA Background Authorization"], removed: [] } },
];

/* ============== Smart Recommendations ============== */
export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  owner: string;
  category: "Compliance" | "Training" | "Onboarding" | "SOP" | "Performance";
  actions: string[];
}

export const recommendations: Recommendation[] = [
  { id: "r1", title: "QA department compliance is declining", detail: "QA dept readiness dropped 5 pts in 14 days. Two RBTs missed retraining.", severity: "high", owner: "QA Lead", category: "Compliance", actions: ["Assign retraining", "Schedule check-in"] },
  { id: "r2", title: "New schedulers struggling with CentralReach", detail: "3 of 4 May hires are below 60% on CR module quizzes.", severity: "medium", owner: "Scheduling Manager", category: "Training", actions: ["Add CR refresher", "Assign mentor"] },
  { id: "r3", title: "Georgia onboarding completion is slowing", detail: "Avg time-to-active rose from 11 to 18 days in GA.", severity: "high", owner: "GA State Director", category: "Onboarding", actions: ["Audit GA bottleneck", "Add automation"] },
  { id: "r4", title: "This SOP may need updating", detail: "Auth Denial SOP was edited but 4 linked trainings still cite the old SLA.", severity: "medium", owner: "Training Admin", category: "SOP", actions: ["Open SOP", "Sync trainings"] },
  { id: "r5", title: "Leadership Academy lifted performance", detail: "Graduates show +14% task-completion and +9 readiness.", severity: "low", owner: "L&D", category: "Performance", actions: ["Expand cohort"] },
];

/* ============== Simulations ============== */
export interface Simulation {
  id: string;
  title: string;
  scenario: "Intake Call" | "Parent Comm" | "Insurance" | "Scheduling Conflict" | "QA Review" | "Leadership Decision";
  difficulty: "Easy" | "Medium" | "Hard";
  durationMin: number;
  bestScore?: number;
  description: string;
  competency: string;
}

export const simulations: Simulation[] = [
  { id: "sim-intake-1", title: "First-Touch Intake Call", scenario: "Intake Call", difficulty: "Easy", durationMin: 6, bestScore: 92, description: "Handle a parent inquiry, capture key details, and route appropriately.", competency: "Empathic intake" },
  { id: "sim-parent-1", title: "Frustrated Parent — Schedule Change", scenario: "Parent Comm", difficulty: "Medium", durationMin: 8, description: "De-escalate, validate, and offer concrete next steps.", competency: "Family communication" },
  { id: "sim-ins-1", title: "Tricky Out-of-Network Call", scenario: "Insurance", difficulty: "Hard", durationMin: 10, description: "Troubleshoot a denial with conflicting payor info.", competency: "Insurance navigation" },
  { id: "sim-sched-1", title: "Double-Booked RBT", scenario: "Scheduling Conflict", difficulty: "Medium", durationMin: 7, description: "Resolve overlap without breaking continuity of care.", competency: "Scheduling judgment" },
  { id: "sim-qa-1", title: "Note Review with Repeat Errors", scenario: "QA Review", difficulty: "Medium", durationMin: 8, description: "Identify root cause and choose the right intervention.", competency: "QA decision-making" },
  { id: "sim-lead-1", title: "Manager Coaching Moment", scenario: "Leadership Decision", difficulty: "Hard", durationMin: 12, bestScore: 78, description: "Coach a struggling team member without micromanaging.", competency: "Leadership" },
];

export interface SimStepOption { id: string; label: string; outcome: "great" | "ok" | "poor"; feedback: string; points: number }
export interface SimulationStep { id: string; prompt: string; options: SimStepOption[] }

export const simulationSteps: Record<string, SimulationStep[]> = {
  "sim-intake-1": [
    { id: "s1", prompt: "A parent calls and immediately asks about pricing. How do you start?", options: [
      { id: "a", label: "Quote the standard rate right away", outcome: "poor", feedback: "Skips relationship-building and may misquote.", points: 5 },
      { id: "b", label: "Acknowledge their question and ask about their child first", outcome: "great", feedback: "Builds trust before diving into logistics.", points: 20 },
      { id: "c", label: "Transfer to billing", outcome: "ok", feedback: "Misses chance to engage. Acceptable as fallback.", points: 10 },
    ] },
    { id: "s2", prompt: "They mention an autism diagnosis from a year ago. What do you note?", options: [
      { id: "a", label: "Diagnosis date and provider, plus current concerns", outcome: "great", feedback: "Captures everything VOB and clinical need.", points: 20 },
      { id: "b", label: "Just the diagnosis", outcome: "ok", feedback: "Misses important context.", points: 10 },
      { id: "c", label: "Nothing — wait for the form", outcome: "poor", feedback: "Loses warm context for the team.", points: 0 },
    ] },
    { id: "s3", prompt: "How do you close the call?", options: [
      { id: "a", label: "Send the intake form and confirm next-step timing", outcome: "great", feedback: "Sets expectations and reduces drop-off.", points: 20 },
      { id: "b", label: "Promise a callback with no timeline", outcome: "poor", feedback: "Vague promises hurt conversion.", points: 5 },
    ] },
  ],
  "sim-parent-1": [
    { id: "s1", prompt: "Parent opens with: 'You moved the session AGAIN.' Best opener?", options: [
      { id: "a", label: "Apologize sincerely and acknowledge the disruption", outcome: "great", feedback: "Validation lowers the temperature.", points: 20 },
      { id: "b", label: "Explain the staffing constraint right away", outcome: "poor", feedback: "Defending too early escalates.", points: 5 },
    ] },
  ],
  "sim-ins-1": [
    { id: "s1", prompt: "Payor portal says 'in-network' but the EOB says otherwise. Next move?", options: [
      { id: "a", label: "Call payor with both documents in hand", outcome: "great", feedback: "Brings evidence; fastest resolution.", points: 20 },
      { id: "b", label: "Tell family they're out of network", outcome: "poor", feedback: "Premature and harmful.", points: 0 },
    ] },
  ],
  "sim-sched-1": [
    { id: "s1", prompt: "RBT booked at two clinics in same hour. First step?", options: [
      { id: "a", label: "Check which client has higher continuity risk", outcome: "great", feedback: "Clinical-first decision-making.", points: 20 },
      { id: "b", label: "Pick alphabetically", outcome: "poor", feedback: "Ignores care impact.", points: 0 },
    ] },
  ],
  "sim-qa-1": [
    { id: "s1", prompt: "Same RBT has 3 flagged notes this month. What do you do?", options: [
      { id: "a", label: "Open a coaching plan with their BCBA", outcome: "great", feedback: "Targets root cause.", points: 20 },
      { id: "b", label: "Send another email reminder", outcome: "poor", feedback: "Patterns won't change.", points: 5 },
    ] },
  ],
  "sim-lead-1": [
    { id: "s1", prompt: "A team member misses 2 deadlines. Open with…", options: [
      { id: "a", label: "Curious questions about workload and blockers", outcome: "great", feedback: "Coaching > controlling.", points: 20 },
      { id: "b", label: "A formal warning email", outcome: "poor", feedback: "Skips the relationship step.", points: 5 },
    ] },
  ],
};

/* ============== Automations & Approvals ============== */
export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: number;
  category: "Onboarding" | "Compliance" | "Training" | "Operations" | "HR";
  popularity: number;
}

export const automationTemplates: AutomationTemplate[] = [
  { id: "at1", name: "Overdue Onboarding Escalation", description: "Notify manager → HR → Director on day 7/10/14.", trigger: "Onboarding > 7 days incomplete", steps: 4, category: "Onboarding", popularity: 92 },
  { id: "at2", name: "Expiring Cert Auto-Reassign", description: "Re-enroll employee 30 days before expiration.", trigger: "Cert expires in 30 days", steps: 3, category: "Compliance", popularity: 88 },
  { id: "at3", name: "Manager Approval Chain", description: "Route requests to manager → director → exec.", trigger: "Request submitted", steps: 3, category: "Operations", popularity: 81 },
  { id: "at4", name: "QA Repeat Error Coaching", description: "Trigger coaching plan after 3 flagged notes.", trigger: "3+ flagged notes / 30d", steps: 5, category: "HR", popularity: 76 },
  { id: "at5", name: "Competency Verification Loop", description: "Schedule supervisor check after training pass.", trigger: "Training completed", steps: 4, category: "Training", popularity: 84 },
  { id: "at6", name: "Auth Denial Recovery", description: "Auto-create resubmit + escalation tasks.", trigger: "Auth status = Denied", steps: 6, category: "Operations", popularity: 95 },
];

export interface ApprovalRequest {
  id: string;
  title: string;
  type: "PTO" | "Schedule Change" | "Cert Reimbursement" | "Title Change" | "Termination";
  requester: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  chain: { name: string; role: string; status: "approved" | "pending" | "skip" }[];
}

export const approvalRequests: ApprovalRequest[] = [
  { id: "ap1", title: "PTO June 14–18", type: "PTO", requester: "Mei Chen", submittedAt: "2h ago", status: "pending", chain: [{ name: "K. Patel", role: "Manager", status: "approved" }, { name: "S. Vance", role: "Director", status: "pending" }] },
  { id: "ap2", title: "Cert Reimbursement — RBT renewal", type: "Cert Reimbursement", requester: "Jordan Rivera", submittedAt: "1d ago", status: "pending", chain: [{ name: "M. Holt", role: "Manager", status: "pending" }, { name: "Finance", role: "Finance", status: "pending" }] },
  { id: "ap3", title: "Title change — Lead Scheduler", type: "Title Change", requester: "Aaron Park", submittedAt: "3d ago", status: "approved", chain: [{ name: "S. Vance", role: "Director", status: "approved" }, { name: "HR", role: "HR", status: "approved" }] },
];

/* ============== Enterprise Reports ============== */
export interface EnterpriseReport {
  id: string;
  name: string;
  cadence: "On-demand" | "Weekly" | "Monthly" | "Quarterly";
  recipients: number;
  lastRun: string;
  type: "Executive" | "Operational" | "Compliance" | "Workforce";
}

export const enterpriseReports: EnterpriseReport[] = [
  { id: "er1", name: "Executive Weekly Summary", cadence: "Weekly", recipients: 6, lastRun: "Mon 8:00 AM", type: "Executive" },
  { id: "er2", name: "Compliance Audit Packet", cadence: "Quarterly", recipients: 4, lastRun: "Apr 1", type: "Compliance" },
  { id: "er3", name: "Workforce Readiness Snapshot", cadence: "Monthly", recipients: 9, lastRun: "May 1", type: "Workforce" },
  { id: "er4", name: "Operational Bottlenecks", cadence: "Weekly", recipients: 5, lastRun: "Mon 8:30 AM", type: "Operational" },
  { id: "er5", name: "State Performance Roll-up", cadence: "Monthly", recipients: 7, lastRun: "May 1", type: "Executive" },
];

/* ============== Permissions Matrix ============== */
export type RoleKey = "super_admin" | "executive" | "dept_admin" | "manager" | "trainer" | "hr" | "employee" | "contractor";

export interface PermissionRow {
  capability: string;
  group: "Dashboards" | "Analytics" | "Reports" | "Automations" | "Resources" | "People" | "Compliance";
  access: Record<RoleKey, "full" | "read" | "none">;
}

export const roleColumns: { key: RoleKey; label: string }[] = [
  { key: "super_admin", label: "Super Admin" },
  { key: "executive", label: "Executive" },
  { key: "dept_admin", label: "Dept Admin" },
  { key: "manager", label: "Manager" },
  { key: "trainer", label: "Trainer" },
  { key: "hr", label: "HR" },
  { key: "employee", label: "Employee" },
  { key: "contractor", label: "Contractor" },
];

const A = (full: RoleKey[], read: RoleKey[] = []): Record<RoleKey, "full" | "read" | "none"> => {
  const out: Record<RoleKey, "full" | "read" | "none"> = {
    super_admin: "full", executive: "none", dept_admin: "none", manager: "none",
    trainer: "none", hr: "none", employee: "none", contractor: "none",
  };
  full.forEach((k) => (out[k] = "full"));
  read.forEach((k) => { if (out[k] === "none") out[k] = "read"; });
  return out;
};

export const permissionsMatrix: PermissionRow[] = [
  { capability: "Executive dashboards", group: "Dashboards", access: A(["super_admin", "executive"], ["dept_admin"]) },
  { capability: "Department dashboards", group: "Dashboards", access: A(["super_admin", "executive", "dept_admin", "manager"]) },
  { capability: "Workforce intelligence", group: "Analytics", access: A(["super_admin", "executive"], ["dept_admin", "hr", "manager"]) },
  { capability: "Compliance intelligence", group: "Analytics", access: A(["super_admin", "executive", "hr"], ["dept_admin"]) },
  { capability: "Enterprise reports", group: "Reports", access: A(["super_admin", "executive"], ["dept_admin", "hr"]) },
  { capability: "Build automations", group: "Automations", access: A(["super_admin"], ["dept_admin"]) },
  { capability: "Approve workflow steps", group: "Automations", access: A(["super_admin", "executive", "dept_admin", "manager"]) },
  { capability: "Manage resources", group: "Resources", access: A(["super_admin", "hr", "trainer"], ["dept_admin"]) },
  { capability: "View employee profiles", group: "People", access: A(["super_admin", "executive", "hr", "manager"], ["dept_admin", "trainer"]) },
  { capability: "Edit employee status", group: "People", access: A(["super_admin", "hr"], ["executive"]) },
  { capability: "Audit packets & exports", group: "Compliance", access: A(["super_admin", "hr"], ["executive"]) },
  { capability: "Acknowledge policies", group: "Compliance", access: A(["super_admin", "executive", "dept_admin", "manager", "trainer", "hr", "employee", "contractor"]) },
];

/* ============== Scalability Map ============== */
export interface ScalabilityState {
  code: string;
  name: string;
  clinics: number;
  departments: number;
  employees: number;
  readiness: number;
  status: "Active" | "Launching" | "Planned";
}

export const scalabilityStates: ScalabilityState[] = [
  { code: "FL", name: "Florida", clinics: 4, departments: 8, employees: 78, readiness: 90, status: "Active" },
  { code: "GA", name: "Georgia", clinics: 3, departments: 7, employees: 52, readiness: 79, status: "Active" },
  { code: "TX", name: "Texas", clinics: 2, departments: 6, employees: 31, readiness: 86, status: "Active" },
  { code: "NC", name: "North Carolina", clinics: 1, departments: 5, employees: 18, readiness: 84, status: "Active" },
  { code: "TN", name: "Tennessee", clinics: 1, departments: 4, employees: 12, readiness: 81, status: "Launching" },
  { code: "SC", name: "South Carolina", clinics: 0, departments: 0, employees: 0, readiness: 0, status: "Planned" },
  { code: "VA", name: "Virginia", clinics: 0, departments: 0, employees: 0, readiness: 0, status: "Planned" },
];

/* ============== Global Search Index ============== */
export interface SearchEntry {
  id: string;
  type: "SOP" | "Course" | "User" | "Department" | "Resource" | "Workflow" | "Report" | "Announcement" | "Competency";
  title: string;
  subtitle?: string;
  path: string;
}

export const enterpriseSearchIndex: SearchEntry[] = [
  { id: "g1", type: "SOP", title: "Authorization Denial Playbook", subtitle: "Updated 2d ago", path: "/enterprise/sop-intelligence" },
  { id: "g2", type: "SOP", title: "Financial Gate SOP", subtitle: "Intake → Conversion", path: "/enterprise/sop-intelligence" },
  { id: "g3", type: "Course", title: "VOB Mastery", subtitle: "Intermediate · 42 min", path: "/enterprise/course-studio" },
  { id: "g4", type: "Course", title: "Leadership Academy", subtitle: "Multi-week", path: "/training" },
  { id: "g5", type: "User", title: "Aaron Park", subtitle: "BCBA · Florida", path: "/blossom/users" },
  { id: "g6", type: "User", title: "Mei Chen", subtitle: "RBT · Florida", path: "/blossom/users" },
  { id: "g7", type: "Department", title: "Authorizations", subtitle: "9 employees · 86% readiness", path: "/blossom/departments" },
  { id: "g8", type: "Department", title: "Scheduling", subtitle: "12 employees · 78% readiness", path: "/blossom/departments" },
  { id: "g9", type: "Resource", title: "Parent Welcome Letter", subtitle: "Template", path: "/resources" },
  { id: "g10", type: "Workflow", title: "Auth Denial Recovery", subtitle: "6 steps · live", path: "/enterprise/automations" },
  { id: "g11", type: "Report", title: "Workforce Readiness Snapshot", subtitle: "Monthly · 9 recipients", path: "/enterprise/reports" },
  { id: "g12", type: "Announcement", title: "Q2 Town Hall — Save the Date", subtitle: "Pinned", path: "/hr/announcements" },
  { id: "g13", type: "Competency", title: "Family Communication", subtitle: "Used in 7 courses", path: "/enterprise/course-studio" },
  { id: "g14", type: "Competency", title: "Insurance Navigation", subtitle: "Used in 4 courses", path: "/enterprise/course-studio" },
];
