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

export const sopChanges: SopChange[] = [];

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
export const readinessTrend: number[] = [];

export const readinessFactors: ReadinessFactor[] = [];

export const readinessBreakdowns: ReadinessBreakdown[] = [];

/* ---------- Compliance & Audit ---------- */

export const complianceItems: ComplianceItem[] = [];

export const auditPackets: AuditPacket[] = [];

/* ---------- Smart Recommendations ---------- */

export const recommendations: Recommendation[] = [];

/* ---------- Simulations ---------- */

export const simulations: Simulation[] = [];

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

export const automationTemplates: AutomationTemplate[] = [];

/* ---------- Approvals & Workflows ---------- */

export const approvalRequests: ApprovalRequest[] = [];

/* ---------- Enterprise Reports ---------- */

export const enterpriseReports: EnterpriseReport[] = [];

/* ---------- Permissions Matrix ---------- */

export const matrixRoles = []as const;

export const permissionsMatrix: PermissionRow[] = [];

/* ---------- Scalability Map ---------- */

export const scalabilityStates: ScalabilityState[] = [];