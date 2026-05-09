// Phase 6 Enterprise mock data — typed, deterministic, no API calls.

export type Severity = "low" | "medium" | "high" | "critical";
export type Trend = "up" | "down" | "flat";
export type TrendDir = Trend;

export interface SopChange {
  id: string;
  sopTitle: string;
  changedAt: string;
  changedBy: string;
  summary: string;
}

export const sopChanges: SopChange[] = [
  { id: "sc1", sopTitle: "Authorization renewal", changedAt: "Mar 18, 2026", changedBy: "Devorah Klein", summary: "Updated UHC and Aetna pre-auth submission paths and added 97155 modifier guidance." },
  { id: "sc2", sopTitle: "Session note thoroughness", changedAt: "Apr 02, 2026", changedBy: "Rochel Levy", summary: "Clarified required behavior tracking fields and example phrasing for new RBTs." },
  { id: "sc3", sopTitle: "Onboarding consent forms", changedAt: "Apr 21, 2026", changedBy: "Nikki Goldenberg", summary: "Reordered consent collection to front-load HIPAA + telehealth before financial." },
  { id: "sc4", sopTitle: "Family communication standard", changedAt: "Apr 28, 2026", changedBy: "Eli Berman", summary: "New script for de-escalating concerned parents and escalation paths to BCBA." },
];

export interface ReadinessBreakdown {
  id: string;
  label: string;
  group: "Department" | "State" | "Manager";
  score: number;       // 0-100
  delta: number;       // vs last period
  headcount: number;
  topRisk: string;
}

export interface ReadinessFactor {
  key: string;
  label: string;
  weight: number;      // 0-1
  score: number;       // 0-100
  detail: string;
}

export interface ComplianceItem {
  id: string;
  category: "Certification" | "Policy" | "Signature" | "Retraining";
  title: string;
  owner: string;
  status: "On Track" | "Due Soon" | "Overdue" | "Complete";
  dueDate: string;
  severity: Severity;
}

export interface AuditPacket {
  id: string;
  name: string;
  generated: string;
  scope: string;
  items: number;
  size: string;
}

export interface Recommendation {
  id: string;
  title: string;
  insight: string;
  severity: Severity;
  owner: string;
  module: string;
  actions: string[];
  delta: string;
}

export interface Simulation {
  id: string;
  title: string;
  scenario: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  durationMin: number;
  competency: string;
  avgScore: number;
  attempts: number;
  category: "Intake" | "Family Comm" | "Insurance" | "Scheduling" | "QA" | "Leadership";
}

export interface SimulationStep {
  id: string;
  prompt: string;
  options: { label: string; outcome: string; score: number }[];
  coachingTip: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  department: string;
  active: boolean;
  runs30d: number;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  requester: string;
  type: "PTO" | "Expense" | "Hire" | "Schedule Change" | "Auth Override" | "Course Publish";
  amount?: string;
  submitted: string;
  chain: { name: string; role: string; status: "approved" | "pending" | "skipped" }[];
  severity: Severity;
}

export interface EnterpriseReport {
  id: string;
  name: string;
  cadence: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Ad-hoc";
  audience: string;
  lastRun: string;
  nextRun: string;
  format: "PDF" | "XLSX" | "Dashboard";
  category: "Executive" | "Compliance" | "Workforce" | "Finance";
}

export interface PermissionRow {
  capability: string;
  group: "Data" | "People" | "Workflow" | "Admin";
  roles: Record<string, "read" | "write" | "—">;
}

export interface ScalabilityState {
  code: string;
  name: string;
  clinics: number;
  employees: number;
  departments: number;
  readiness: number;
  status: "Operational" | "Scaling" | "Pilot" | "Planned";
}

/* ---------- Workforce Readiness ---------- */

export const readinessScore = 87;
export const readinessDelta = +3.2;
export const readinessTrend: number[] = [78, 79, 80, 82, 81, 84, 85, 84, 86, 86, 87];

export const readinessFactors: ReadinessFactor[] = [
  { key: "onboarding", label: "Onboarding completion", weight: 0.18, score: 92, detail: "94% of new hires hit Day-30 milestones" },
  { key: "compliance", label: "Compliance & certs", weight: 0.22, score: 81, detail: "11 certs expiring within 60 days" },
  { key: "competency", label: "Competency scores", weight: 0.18, score: 88, detail: "Avg post-training quiz: 88%" },
  { key: "engagement", label: "Engagement signals", weight: 0.12, score: 84, detail: "Recognition & comments trending up" },
  { key: "tasks", label: "Task on-time rate", weight: 0.15, score: 90, detail: "On-time task completion 90%" },
  { key: "tenure", label: "Tenure stability", weight: 0.15, score: 79, detail: "GA region turnover slightly elevated" },
];

export const readinessBreakdowns: ReadinessBreakdown[] = [
  { id: "d-clin", label: "Clinical", group: "Department", score: 89, delta: +2.1, headcount: 142, topRisk: "BCBA recerts due Q1" },
  { id: "d-int", label: "Intake", group: "Department", score: 91, delta: +4.0, headcount: 24, topRisk: "—" },
  { id: "d-ops", label: "Operations", group: "Department", score: 84, delta: +1.4, headcount: 38, topRisk: "Scheduling certs" },
  { id: "d-fin", label: "Finance / RCM", group: "Department", score: 86, delta: +0.6, headcount: 19, topRisk: "Auth knowledge gaps" },
  { id: "s-ny", label: "New York", group: "State", score: 90, delta: +2.7, headcount: 121, topRisk: "—" },
  { id: "s-nj", label: "New Jersey", group: "State", score: 88, delta: +3.1, headcount: 64, topRisk: "—" },
  { id: "s-ga", label: "Georgia", group: "State", score: 79, delta: -1.3, headcount: 38, topRisk: "Onboarding velocity" },
  { id: "m-eli", label: "Eli Berman", group: "Manager", score: 92, delta: +3.4, headcount: 28, topRisk: "—" },
  { id: "m-gabi", label: "Gabi Kaweblum", group: "Manager", score: 87, delta: +1.2, headcount: 22, topRisk: "Auth backlog" },
  { id: "m-jaz", label: "Jaz Scarponi", group: "Manager", score: 83, delta: +0.4, headcount: 19, topRisk: "QA coaching" },
];

/* ---------- Compliance & Audit ---------- */

export const complianceItems: ComplianceItem[] = [
  { id: "c1", category: "Certification", title: "BCBA recert — Sara Cohen", owner: "Sara Cohen", status: "Due Soon", dueDate: "2026-05-22", severity: "medium" },
  { id: "c2", category: "Certification", title: "RBT 40-hr renewal — Maya Rodriguez", owner: "Maya Rodriguez", status: "Overdue", dueDate: "2026-05-02", severity: "high" },
  { id: "c3", category: "Policy", title: "HIPAA acknowledgement — Q2", owner: "All staff", status: "On Track", dueDate: "2026-06-30", severity: "low" },
  { id: "c4", category: "Signature", title: "Updated PTO policy v3.1", owner: "All staff", status: "Due Soon", dueDate: "2026-05-15", severity: "medium" },
  { id: "c5", category: "Retraining", title: "NoteGuard refresher — flagged RBTs (6)", owner: "Clinical Ops", status: "Due Soon", dueDate: "2026-05-18", severity: "high" },
  { id: "c6", category: "Certification", title: "CPR/First Aid — Clinic GA", owner: "GA Clinic", status: "On Track", dueDate: "2026-08-10", severity: "low" },
  { id: "c7", category: "Policy", title: "Telehealth consent v2", owner: "All clinical", status: "Complete", dueDate: "2026-04-01", severity: "low" },
  { id: "c8", category: "Retraining", title: "Insurance auth process", owner: "Auth team", status: "Due Soon", dueDate: "2026-05-20", severity: "medium" },
];

export const auditPackets: AuditPacket[] = [
  { id: "a1", name: "Q1 2026 Compliance Snapshot", generated: "2026-04-05", scope: "All clinics, all states", items: 412, size: "8.2 MB" },
  { id: "a2", name: "Georgia State Audit Pack", generated: "2026-03-18", scope: "Georgia clinics + RBT certs", items: 168, size: "3.1 MB" },
  { id: "a3", name: "HIPAA Acknowledgements 2025", generated: "2026-01-10", scope: "All employees, calendar 2025", items: 247, size: "1.6 MB" },
];

/* ---------- Smart Recommendations ---------- */

export const recommendations: Recommendation[] = [
  { id: "r1", title: "QA pass rate declining in GA region", insight: "Pass rate dropped 6 pts over 3 weeks. Most failures cluster on session-note thoroughness.", severity: "high", owner: "QA Lead — Rochel", module: "QA & Compliance", actions: ["Schedule retraining cohort", "Create SOP recap card", "Pair with mentor BCBA"], delta: "-6pts" },
  { id: "r2", title: "GA onboarding velocity is slipping", insight: "Average days-to-billable rose from 14 → 19. Bottleneck is consent forms.", severity: "high", owner: "Ops — Jaz", module: "HR Onboarding", actions: ["Automate consent reminder", "Add onboarding nudge", "Review intake handoff"], delta: "+5d" },
  { id: "r3", title: "SOP 'Authorization renewal' may be outdated", insight: "Last edit 142 days ago; payor rules changed Mar 18. 3 recent denials cite stale process.", severity: "medium", owner: "Auth Lead — Devorah", module: "SOP Library", actions: ["Open SOP", "Assign editor", "Notify auth team"], delta: "142d" },
  { id: "r4", title: "Leadership Academy lifted ops manager scores", insight: "Cohort 3 graduates show +12% on 'Decision Quality'. Consider expanding.", severity: "low", owner: "People Ops — Nikki", module: "Operations Academy", actions: ["Open cohort 4", "Publish recap", "Invite directors"], delta: "+12%" },
  { id: "r5", title: "Insurance denial pattern — UHC Behavioral", insight: "12 denials in 30 days share missing CPT 97155 modifier. AI suggests SOP update.", severity: "high", owner: "Finance — Gabi", module: "Authorizations", actions: ["Open denial cluster", "Update SOP", "Train auth team"], delta: "12 denials" },
  { id: "r6", title: "Recognition trending up across NY", insight: "Applause reactions +38% MoM after Welcome flow rollout.", severity: "low", owner: "HR — Nikki", module: "Recognition", actions: ["Publish recap"], delta: "+38%" },
];

/* ---------- Simulations ---------- */

export const simulations: Simulation[] = [
  { id: "sim-intake", title: "Intake call with anxious parent", scenario: "First call after referral; parent worried about wait time and insurance.", difficulty: "Intermediate", durationMin: 12, competency: "Empathetic intake", avgScore: 84, attempts: 132, category: "Intake" },
  { id: "sim-comm", title: "Difficult parent communication", scenario: "Parent challenges the BCBA's treatment plan; requires de-escalation.", difficulty: "Advanced", durationMin: 18, competency: "Clinical communication", avgScore: 76, attempts: 88, category: "Family Comm" },
  { id: "sim-ins", title: "Insurance pre-auth walkthrough", scenario: "Walk Medicaid family through pre-auth and consent.", difficulty: "Beginner", durationMin: 9, competency: "Benefits explanation", avgScore: 91, attempts: 211, category: "Insurance" },
  { id: "sim-sched", title: "Schedule conflict resolution", scenario: "RBT calls out; reassign without breaking continuity.", difficulty: "Intermediate", durationMin: 10, competency: "Operational triage", avgScore: 82, attempts: 154, category: "Scheduling" },
  { id: "sim-qa", title: "QA review of flagged note", scenario: "Coach RBT through correcting a flagged session note.", difficulty: "Intermediate", durationMin: 14, competency: "Coaching & QA", avgScore: 79, attempts: 96, category: "QA" },
  { id: "sim-lead", title: "Leadership decision: scaling a clinic", scenario: "Decide whether to open a new clinic given staffing & demand.", difficulty: "Advanced", durationMin: 22, competency: "Strategic decisioning", avgScore: 73, attempts: 41, category: "Leadership" },
];

export const simulationStepsByScenario: Record<string, SimulationStep[]> = {
  "sim-intake": [
    { id: "s1", prompt: "Parent opens the call upset about a 6-week wait. What do you do first?", options: [
      { label: "Acknowledge feelings, then explain the why", outcome: "Builds trust, parent calms.", score: 95 },
      { label: "Jump straight into pricing & insurance", outcome: "Parent feels unheard.", score: 55 },
      { label: "Offer to call back later", outcome: "Loses momentum.", score: 40 },
    ], coachingTip: "Acknowledge before informing. Mirror back what you heard." },
    { id: "s2", prompt: "Parent asks if they can switch to telehealth. How do you respond?", options: [
      { label: "Explain telehealth fit, offer assessment", outcome: "Parent feels guided.", score: 92 },
      { label: "Say 'we don't really do that'", outcome: "Closes the door.", score: 30 },
      { label: "Defer to BCBA without context", outcome: "Adds friction.", score: 60 },
    ], coachingTip: "Frame options around their child's needs, not the org's defaults." },
    { id: "s3", prompt: "Wrap up — confirm next step.", options: [
      { label: "Send form + book intro call", outcome: "Clear handoff.", score: 96 },
      { label: "Promise to call them back", outcome: "Drops in queue.", score: 50 },
      { label: "Tell them to wait for an email", outcome: "Vague.", score: 45 },
    ], coachingTip: "Always close with a calendar action, not a promise." },
  ],
};

/* ---------- Advanced Automations ---------- */

export const automationTemplates: AutomationTemplate[] = [
  { id: "auto1", name: "New Hire Welcome Drip", trigger: "Employee created", steps: ["Send welcome email", "Schedule Day-1 onboarding tasks", "Notify hiring manager", "Add to Welcome flow"], department: "HR", active: true, runs30d: 24 },
  { id: "auto2", name: "Cert expiry reminder chain", trigger: "Certification within 60 days of expiry", steps: ["Email employee", "Notify manager", "Open retraining task", "Escalate to HR Admin if no action in 14d"], department: "Compliance", active: true, runs30d: 41 },
  { id: "auto3", name: "Note flagged → coaching loop", trigger: "Session note flagged by NoteGuard", steps: ["Notify RBT", "Assign coaching micro-course", "Schedule QA review", "Re-check in 7 days"], department: "QA", active: true, runs30d: 18 },
  { id: "auto4", name: "Auth denial → SOP review", trigger: "Authorization denied", steps: ["Log denial reason", "Cluster pattern", "Open SOP review", "Notify auth lead"], department: "Authorizations", active: true, runs30d: 12 },
  { id: "auto5", name: "Onboarding stalled → escalate", trigger: "Onboarding step open >5 days", steps: ["Nudge employee", "Notify manager", "Open HR ticket"], department: "HR", active: false, runs30d: 9 },
  { id: "auto6", name: "PTO request → coverage check", trigger: "PTO submitted", steps: ["Check coverage", "Notify scheduling", "Approve / route to manager", "Update calendar"], department: "Scheduling", active: true, runs30d: 33 },
];

/* ---------- Approvals & Workflows ---------- */

export const approvalRequests: ApprovalRequest[] = [
  { id: "ap1", title: "PTO — Maya Rodriguez (May 18-22)", requester: "Maya Rodriguez", type: "PTO", submitted: "2026-05-08", severity: "low", chain: [
    { name: "Sara Uhr", role: "Direct manager", status: "approved" },
    { name: "Daylis", role: "Scheduling", status: "pending" },
    { name: "Nikki", role: "HR", status: "pending" },
  ] },
  { id: "ap2", title: "Expense — Conference travel ($1,840)", requester: "Devorah", type: "Expense", amount: "$1,840", submitted: "2026-05-07", severity: "medium", chain: [
    { name: "Eli Berman", role: "Ops Manager", status: "approved" },
    { name: "Baila", role: "Finance", status: "pending" },
  ] },
  { id: "ap3", title: "New Hire — Senior BCBA (NY)", requester: "Rochell", type: "Hire", submitted: "2026-05-06", severity: "high", chain: [
    { name: "Hiring Manager", role: "BCBA Lead", status: "approved" },
    { name: "Eli Berman", role: "Ops Manager", status: "approved" },
    { name: "Chad", role: "Exec", status: "pending" },
  ] },
  { id: "ap4", title: "Auth Override — UHC denial appeal", requester: "Kayla", type: "Auth Override", submitted: "2026-05-09", severity: "high", chain: [
    { name: "Devorah", role: "Auth Lead", status: "approved" },
    { name: "Gabi", role: "Finance", status: "pending" },
  ] },
  { id: "ap5", title: "Course Publish — Insurance Basics v2", requester: "Training Admin", type: "Course Publish", submitted: "2026-05-08", severity: "low", chain: [
    { name: "Nikki", role: "HR", status: "approved" },
    { name: "Eli Berman", role: "Ops Manager", status: "pending" },
  ] },
];

/* ---------- Enterprise Reports ---------- */

export const enterpriseReports: EnterpriseReport[] = [
  { id: "rep1", name: "Executive Weekly Brief", cadence: "Weekly", audience: "C-Suite", lastRun: "2026-05-05", nextRun: "2026-05-12", format: "PDF", category: "Executive" },
  { id: "rep2", name: "Workforce Readiness Snapshot", cadence: "Monthly", audience: "Leadership + State Directors", lastRun: "2026-05-01", nextRun: "2026-06-01", format: "Dashboard", category: "Workforce" },
  { id: "rep3", name: "Compliance Audit Pack", cadence: "Quarterly", audience: "HR + Legal", lastRun: "2026-04-05", nextRun: "2026-07-05", format: "PDF", category: "Compliance" },
  { id: "rep4", name: "Cert Expiry Roll-up", cadence: "Weekly", audience: "HR Admin", lastRun: "2026-05-06", nextRun: "2026-05-13", format: "XLSX", category: "Compliance" },
  { id: "rep5", name: "Revenue & Auth Health", cadence: "Weekly", audience: "Finance + Ops", lastRun: "2026-05-06", nextRun: "2026-05-13", format: "Dashboard", category: "Finance" },
  { id: "rep6", name: "Onboarding Velocity Report", cadence: "Monthly", audience: "HR + State Directors", lastRun: "2026-05-01", nextRun: "2026-06-01", format: "PDF", category: "Workforce" },
  { id: "rep7", name: "QA Trend Report", cadence: "Monthly", audience: "Clinical Leadership", lastRun: "2026-05-02", nextRun: "2026-06-02", format: "PDF", category: "Compliance" },
];

/* ---------- Permissions Matrix ---------- */

export const matrixRoles = ["Super Admin", "Exec", "Ops Manager", "HR Admin", "Manager", "Trainer", "Employee", "Contractor"] as const;

export const permissionsMatrix: PermissionRow[] = [
  { capability: "View company-wide dashboards", group: "Data", roles: { "Super Admin": "write", Exec: "read", "Ops Manager": "read", "HR Admin": "read", Manager: "read", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "View own team analytics", group: "Data", roles: { "Super Admin": "write", Exec: "read", "Ops Manager": "write", "HR Admin": "read", Manager: "write", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "Edit employee records", group: "People", roles: { "Super Admin": "write", Exec: "—", "Ops Manager": "—", "HR Admin": "write", Manager: "read", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "Approve PTO / expenses", group: "Workflow", roles: { "Super Admin": "write", Exec: "write", "Ops Manager": "write", "HR Admin": "write", Manager: "write", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "Generate AI courses", group: "Workflow", roles: { "Super Admin": "write", Exec: "—", "Ops Manager": "write", "HR Admin": "write", Manager: "—", Trainer: "write", Employee: "—", Contractor: "—" } },
  { capability: "Edit SOPs", group: "Workflow", roles: { "Super Admin": "write", Exec: "—", "Ops Manager": "write", "HR Admin": "write", Manager: "—", Trainer: "write", Employee: "—", Contractor: "—" } },
  { capability: "Manage automations", group: "Admin", roles: { "Super Admin": "write", Exec: "—", "Ops Manager": "write", "HR Admin": "—", Manager: "—", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "Manage permissions", group: "Admin", roles: { "Super Admin": "write", Exec: "—", "Ops Manager": "—", "HR Admin": "—", Manager: "—", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "View enterprise reports", group: "Data", roles: { "Super Admin": "write", Exec: "read", "Ops Manager": "read", "HR Admin": "read", Manager: "—", Trainer: "—", Employee: "—", Contractor: "—" } },
  { capability: "Submit time / requests", group: "People", roles: { "Super Admin": "write", Exec: "write", "Ops Manager": "write", "HR Admin": "write", Manager: "write", Trainer: "write", Employee: "write", Contractor: "read" } },
];

/* ---------- Scalability Map ---------- */

export const scalabilityStates: ScalabilityState[] = [
  { code: "NY", name: "New York", clinics: 6, employees: 121, departments: 8, readiness: 90, status: "Operational" },
  { code: "NJ", name: "New Jersey", clinics: 3, employees: 64, departments: 6, readiness: 88, status: "Operational" },
  { code: "GA", name: "Georgia", clinics: 4, employees: 38, departments: 5, readiness: 79, status: "Scaling" },
  { code: "FL", name: "Florida", clinics: 1, employees: 12, departments: 3, readiness: 74, status: "Pilot" },
  { code: "TX", name: "Texas", clinics: 0, employees: 4, departments: 2, readiness: 60, status: "Pilot" },
  { code: "PA", name: "Pennsylvania", clinics: 0, employees: 0, departments: 0, readiness: 0, status: "Planned" },
  { code: "NC", name: "North Carolina", clinics: 0, employees: 0, departments: 0, readiness: 0, status: "Planned" },
];