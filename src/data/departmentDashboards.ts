// =====================================================================
// Department Dashboards — Pass 01
// ---------------------------------------------------------------------
// Simple, operational department dashboard definitions rendered by
// <DepartmentDashboardView />. Numbers here are labeled setup/demo data
// until live sources are wired. Structure is intentionally uniform so
// new departments can be added with one entry.
// =====================================================================

import type { OSRole } from "@/lib/os/permissions";

export type Trend = "up" | "down" | "neutral";
export type Tone = "healthy" | "attention" | "critical" | "neutral";

export interface DeptKpi {
  label: string;
  value: string;
  delta?: string;
  trend?: Trend;
  hint?: string;
}

export interface DeptTrendRow {
  label: string; // e.g. week / month bucket
  value: number;
}

export interface DeptWorkQueueRow {
  name: string;
  status: string;
  owner?: string;
  age?: string;
  detail?: string;
  tone?: Tone;
  /** Optional deep-link to the operational record (lead, auth, task…). */
  href?: string;
}

export interface DeptStatusRow {
  label: string;
  count: number;
  tone?: Tone;
}

export interface DeptRiskRow {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface DepartmentDashboardDef {
  id: string;
  title: string;
  department: string;
  owner: string;
  visibleTo: OSRole[];
  kpis: DeptKpi[];
  workQueueTitle: string;
  workQueue: DeptWorkQueueRow[];
  statusTitle: string;
  status: DeptStatusRow[];
  trendTitle: string;
  trend: DeptTrendRow[];
  risks: DeptRiskRow[];
  dataNote?: string;
}

// ---- shared role bundles ---------------------------------------------
const LEADERSHIP: OSRole[] = ["super_admin", "executive_leadership", "operations_leadership"];
const SD: OSRole[] = ["state_director", "assistant_state_director", "regional_state_director"];

const DEMO_NOTE = "Setup / demo data — structure is live and ready to be wired to real source systems.";

// ---- Intake -----------------------------------------------------------
const intake: DepartmentDashboardDef = {
  id: "department-intake-dashboard",
  title: "Intake Dashboard",
  department: "Intake",
  owner: "Intake Team",
  visibleTo: [...LEADERSHIP, ...SD, "intake_coordinator", "intake_lead"],
  kpis: [
    { label: "Lead Volume (30d)", value: "184", delta: "+12", trend: "up" },
    { label: "Lead → Assessment", value: "34%", delta: "+3pt", trend: "up" },
    { label: "Avg Lead Age", value: "3.1d", delta: "-0.4d", trend: "up" },
    { label: "Forms Completion", value: "72%", delta: "+5pt", trend: "up" },
    { label: "VOB Complete", value: "81%", delta: "+2pt", trend: "up" },
    { label: "Open Bottlenecks", value: "9", delta: "+2", trend: "down" },
  ],
  workQueueTitle: "Intake bottlenecks",
  workQueue: [
    { name: "Awaiting VOB response", status: "VOB", age: "4d", owner: "Solum", tone: "attention" },
    { name: "Missing intake form", status: "Forms", age: "6d", owner: "Coordinator", tone: "critical" },
    { name: "Uncontacted lead >24h", status: "Contact", age: "2d", owner: "Intake", tone: "attention" },
    { name: "Assessment not scheduled", status: "Scheduling", age: "5d", owner: "Scheduling", tone: "critical" },
    { name: "Insurance benefits unclear", status: "VOB", age: "3d", owner: "Solum", tone: "attention" },
  ],
  statusTitle: "Lead status breakdown",
  status: [
    { label: "New", count: 42, tone: "neutral" },
    { label: "Contacted", count: 61, tone: "healthy" },
    { label: "Forms Sent", count: 38, tone: "healthy" },
    { label: "VOB Pending", count: 22, tone: "attention" },
    { label: "Assessment Scheduled", count: 15, tone: "healthy" },
    { label: "Stalled >7d", count: 6, tone: "critical" },
  ],
  trendTitle: "Weekly lead volume",
  trend: [
    { label: "W1", value: 38 }, { label: "W2", value: 44 }, { label: "W3", value: 47 },
    { label: "W4", value: 55 },
  ],
  risks: [
    { title: "VOB backlog rising", detail: "22 VOBs pending — 6 over 5 days.", severity: "high" },
    { title: "Uncontacted leads", detail: "7 leads uncontacted past 24h.", severity: "medium" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Authorizations ---------------------------------------------------
const authorizations: DepartmentDashboardDef = {
  id: "department-authorizations-dashboard",
  title: "Authorizations Dashboard",
  department: "Authorizations",
  owner: "Auth Team",
  visibleTo: [...LEADERSHIP, ...SD, "authorization_coordinator", "authorization_manager"],
  kpis: [
    { label: "Pending Auths", value: "27", delta: "+4", trend: "down" },
    { label: "Expiring <30d", value: "12", delta: "+3", trend: "down" },
    { label: "Reassessments Current", value: "94%", delta: "+1pt", trend: "up" },
    { label: "Denial-Free Rate", value: "88%", delta: "+2pt", trend: "up" },
    { label: "On-time Submissions", value: "91%", delta: "+3pt", trend: "up" },
    { label: "Denials (30d)", value: "6", delta: "-2", trend: "up" },
  ],
  workQueueTitle: "Auth work queue",
  workQueue: [
    { name: "Auth #A-10241 · BCBS", status: "Pending submission", age: "3d", owner: "Auth Team", tone: "attention" },
    { name: "Auth #A-10199 · Aetna", status: "Denied — rework", age: "5d", owner: "Auth Team", tone: "critical" },
    { name: "Auth #A-10118 · United", status: "Expiring 12d", age: "—", owner: "Auth Team", tone: "attention" },
    { name: "Auth #A-10084 · Medicaid", status: "Missing docs", age: "6d", owner: "QA", tone: "critical" },
    { name: "Auth #A-10077 · Cigna", status: "Submitted", age: "1d", owner: "Auth Team", tone: "healthy" },
  ],
  statusTitle: "Auth status",
  status: [
    { label: "Approved", count: 142, tone: "healthy" },
    { label: "Pending", count: 27, tone: "attention" },
    { label: "Expiring <30d", count: 12, tone: "attention" },
    { label: "Denied", count: 6, tone: "critical" },
    { label: "Reassessment Due", count: 9, tone: "attention" },
  ],
  trendTitle: "Weekly submissions",
  trend: [
    { label: "W1", value: 24 }, { label: "W2", value: 28 }, { label: "W3", value: 31 },
    { label: "W4", value: 34 },
  ],
  risks: [
    { title: "United denials trending up", detail: "3 denials in 14 days — payor review recommended.", severity: "high" },
    { title: "12 auths expiring <30d", detail: "Kick off reauth workflow immediately.", severity: "medium" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Staffing ---------------------------------------------------------
const staffing: DepartmentDashboardDef = {
  id: "department-staffing-dashboard",
  title: "Staffing Dashboard",
  department: "Staffing",
  owner: "Staffing Team",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "staffing_team", "staffing_coordinator", "staffing_lead",
    "scheduling_team", "scheduling_coordinator", "scheduling_lead",
  ],
  kpis: [
    { label: "Open Staffing Needs", value: "18", delta: "+3", trend: "down" },
    { label: "RBT Coverage", value: "82%", delta: "+4pt", trend: "up" },
    { label: "Avg Client Wait", value: "6.4d", delta: "-1.2d", trend: "up" },
    { label: "Pipeline Ready", value: "11", delta: "+2", trend: "up" },
    { label: "Unfilled >14d", value: "4", delta: "-1", trend: "up" },
    { label: "Hours Gap (wk)", value: "62 hrs", delta: "-8", trend: "up" },
  ],
  workQueueTitle: "Open staffing needs",
  workQueue: [
    { name: "Client · CH-2201", status: "Need RBT · 20h/wk", age: "9d", owner: "Staffing", tone: "critical" },
    { name: "Client · CH-2188", status: "Partial coverage", age: "4d", owner: "Staffing", tone: "attention" },
    { name: "Client · CH-2174", status: "Need BCBA hours", age: "3d", owner: "Clinical", tone: "attention" },
    { name: "Client · CH-2160", status: "Ready to staff", age: "1d", owner: "Staffing", tone: "healthy" },
    { name: "Client · CH-2152", status: "Waiting on schedule", age: "5d", owner: "Scheduling", tone: "attention" },
  ],
  statusTitle: "Staffing status",
  status: [
    { label: "Fully Staffed", count: 96, tone: "healthy" },
    { label: "Partial", count: 22, tone: "attention" },
    { label: "Needs Staffing", count: 18, tone: "attention" },
    { label: "Unfilled >14d", count: 4, tone: "critical" },
  ],
  trendTitle: "Open needs by week",
  trend: [
    { label: "W1", value: 22 }, { label: "W2", value: 20 }, { label: "W3", value: 19 },
    { label: "W4", value: 18 },
  ],
  risks: [
    { title: "GA capacity gap", detail: "62 weekly RBT hours short in Georgia.", severity: "high" },
    { title: "4 unfilled >14 days", detail: "Escalate to recruiting for pipeline pull.", severity: "medium" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Scheduling -------------------------------------------------------
const scheduling: DepartmentDashboardDef = {
  id: "department-scheduling-dashboard",
  title: "Scheduling Dashboard",
  department: "Scheduling",
  owner: "Scheduling Team",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "scheduling_team", "scheduling_coordinator", "scheduling_lead",
  ],
  kpis: [
    { label: "Scheduling Gaps", value: "14", delta: "-3", trend: "up" },
    { label: "Start Date Delays", value: "5", delta: "-2", trend: "up" },
    { label: "Active Issues", value: "9", delta: "+1", trend: "down" },
    { label: "Fill Rate", value: "78%", delta: "+5pt", trend: "up" },
    { label: "Time to Schedule", value: "2.6d", delta: "-0.4d", trend: "up" },
    { label: "Sessions Delivered", value: "1,284", delta: "+62", trend: "up" },
  ],
  workQueueTitle: "Active scheduling issues",
  workQueue: [
    { name: "Client · CH-2199", status: "Start date slipped", age: "3d", owner: "Scheduling", tone: "attention" },
    { name: "Client · CH-2181", status: "RBT reassignment needed", age: "2d", owner: "Scheduling", tone: "attention" },
    { name: "Client · CH-2170", status: "Recurring cancellation pattern", age: "7d", owner: "BCBA", tone: "critical" },
    { name: "Client · CH-2166", status: "Session gap this week", age: "1d", owner: "Scheduling", tone: "attention" },
  ],
  statusTitle: "Coverage status",
  status: [
    { label: "Full coverage", count: 112, tone: "healthy" },
    { label: "Gap this week", count: 14, tone: "attention" },
    { label: "Start delayed", count: 5, tone: "critical" },
    { label: "Cancel risk", count: 8, tone: "attention" },
  ],
  trendTitle: "Fill rate by week",
  trend: [
    { label: "W1", value: 71 }, { label: "W2", value: 73 }, { label: "W3", value: 76 },
    { label: "W4", value: 78 },
  ],
  risks: [
    { title: "Recurring cancellations", detail: "Client CH-2170 pattern impacting BCBA hours.", severity: "high" },
    { title: "Start delays", detail: "5 clients slipped past target start.", severity: "medium" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Recruiting -------------------------------------------------------
const recruiting: DepartmentDashboardDef = {
  id: "department-recruiting-dashboard",
  title: "Recruiting Dashboard",
  department: "Recruiting",
  owner: "Recruiting Team",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "recruiting_team", "recruiting_coordinator", "recruiting_lead",
    "hr_team", "hr_lead",
  ],
  kpis: [
    { label: "Applications (30d)", value: "142", delta: "+18", trend: "up" },
    { label: "Interviews", value: "44", delta: "+6", trend: "up" },
    { label: "Offers Extended", value: "18", delta: "+3", trend: "up" },
    { label: "Background Checks", value: "11 in review", trend: "neutral" },
    { label: "Orientation Starts", value: "9", delta: "+2", trend: "up" },
    { label: "Offer Accept %", value: "72%", delta: "+4pt", trend: "up" },
  ],
  workQueueTitle: "Candidates needing action",
  workQueue: [
    { name: "A. Rivera · RBT", status: "Background pending", age: "4d", owner: "Recruiting", tone: "attention" },
    { name: "J. Thompson · BCBA", status: "Offer sent", age: "2d", owner: "Recruiting", tone: "healthy" },
    { name: "M. Chen · RBT", status: "Interview scheduled", age: "1d", owner: "Hiring Mgr", tone: "healthy" },
    { name: "L. Patel · RBT", status: "No response 5d", age: "5d", owner: "Recruiting", tone: "attention" },
  ],
  statusTitle: "Pipeline stages",
  status: [
    { label: "Applied", count: 142, tone: "neutral" },
    { label: "Screened", count: 68, tone: "healthy" },
    { label: "Interviewed", count: 44, tone: "healthy" },
    { label: "Offer", count: 18, tone: "healthy" },
    { label: "Background", count: 11, tone: "attention" },
    { label: "Orientation", count: 9, tone: "healthy" },
  ],
  trendTitle: "Applications by week",
  trend: [
    { label: "W1", value: 28 }, { label: "W2", value: 34 }, { label: "W3", value: 38 },
    { label: "W4", value: 42 },
  ],
  risks: [
    { title: "Background bottleneck", detail: "11 candidates stalled in background review.", severity: "medium" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- HR ---------------------------------------------------------------
const hr: DepartmentDashboardDef = {
  id: "department-hr-dashboard",
  title: "HR Dashboard",
  department: "HR",
  owner: "HR Team",
  visibleTo: [...LEADERSHIP, "hr_team", "hr_lead"],
  kpis: [
    { label: "Onboarding In Progress", value: "12", delta: "+3", trend: "up" },
    { label: "Onboarding Complete (30d)", value: "9", delta: "+2", trend: "up" },
    { label: "Evaluations Complete", value: "84%", delta: "+3pt", trend: "up" },
    { label: "Compliance Items Open", value: "17", delta: "-4", trend: "up" },
    { label: "Active Employees", value: "218", delta: "+6", trend: "up" },
    { label: "Terminations (30d)", value: "3", delta: "-1", trend: "up" },
  ],
  workQueueTitle: "HR items needing action",
  workQueue: [
    { name: "Emp · E-1042 · I-9", status: "Missing verification", age: "5d", owner: "HR", tone: "critical" },
    { name: "Emp · E-1031 · CPR", status: "Expiring 12d", age: "—", owner: "HR", tone: "attention" },
    { name: "Emp · E-1017 · Eval", status: "90-day due", age: "3d", owner: "Manager", tone: "attention" },
    { name: "Emp · E-1008 · Onboarding", status: "Awaiting orientation", age: "2d", owner: "HR", tone: "attention" },
  ],
  statusTitle: "Employee status",
  status: [
    { label: "Active", count: 218, tone: "healthy" },
    { label: "Onboarding", count: 12, tone: "attention" },
    { label: "Leave", count: 4, tone: "neutral" },
    { label: "Compliance Hold", count: 3, tone: "critical" },
  ],
  trendTitle: "Compliance items closed by week",
  trend: [
    { label: "W1", value: 6 }, { label: "W2", value: 8 }, { label: "W3", value: 9 },
    { label: "W4", value: 11 },
  ],
  risks: [
    { title: "3 compliance holds", detail: "Certifications missing on active RBTs.", severity: "high" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- QA ---------------------------------------------------------------
const qa: DepartmentDashboardDef = {
  id: "department-qa-dashboard",
  title: "QA Dashboard",
  department: "QA",
  owner: "QA / Compliance",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "qa_team", "qa_director", "qa_specialist",
    "clinical_director", "bcba", "behavioral_support",
  ],
  kpis: [
    { label: "Treatment Plans Active", value: "142", delta: "+4", trend: "up" },
    { label: "QA Reviews (30d)", value: "63", delta: "+8", trend: "up" },
    { label: "Compliance %", value: "94%", delta: "+2pt", trend: "up" },
    { label: "Doc Completion", value: "88%", delta: "+3pt", trend: "up" },
    { label: "Turnaround", value: "3.1d", delta: "-1d", trend: "up" },
    { label: "Stuck >5d", value: "4", delta: "-2", trend: "up" },
  ],
  workQueueTitle: "QA review queue",
  workQueue: [
    { name: "TP · CH-2201", status: "Awaiting QA", age: "2d", owner: "QA", tone: "attention" },
    { name: "TP · CH-2188", status: "Rework requested", age: "4d", owner: "BCBA", tone: "critical" },
    { name: "TP · CH-2170", status: "Signature pending", age: "1d", owner: "Parent", tone: "attention" },
    { name: "TP · CH-2166", status: "Approved", age: "—", owner: "QA", tone: "healthy" },
  ],
  statusTitle: "Plan status",
  status: [
    { label: "Approved", count: 128, tone: "healthy" },
    { label: "In Review", count: 15, tone: "attention" },
    { label: "Rework", count: 6, tone: "critical" },
    { label: "Signature Pending", count: 8, tone: "attention" },
  ],
  trendTitle: "Reviews completed by week",
  trend: [
    { label: "W1", value: 12 }, { label: "W2", value: 15 }, { label: "W3", value: 17 },
    { label: "W4", value: 19 },
  ],
  risks: [
    { title: "2 plans stuck >7d", detail: "Escalate to QA Director.", severity: "high" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Clinic -----------------------------------------------------------
const clinic: DepartmentDashboardDef = {
  id: "department-clinic-dashboard",
  title: "Clinic Dashboard",
  department: "Clinic",
  owner: "Clinic Operations",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "clinical_director", "clinical_lead", "clinic_growth", "office_manager",
  ],
  kpis: [
    { label: "Clinic Census", value: "142", delta: "+8", trend: "up" },
    { label: "Staffing", value: "218", delta: "+6", trend: "up" },
    { label: "Capacity Used", value: "82%", delta: "+3pt", trend: "up" },
    { label: "Utilization", value: "76%", delta: "+2pt", trend: "up" },
    { label: "New Starts (30d)", value: "14", delta: "+3", trend: "up" },
    { label: "Discharges (30d)", value: "5", delta: "-1", trend: "up" },
  ],
  workQueueTitle: "Clinic focus items",
  workQueue: [
    { name: "Capacity: GA", status: "Near limit (92%)", age: "—", owner: "State Director", tone: "attention" },
    { name: "Capacity: NC", status: "Healthy (74%)", age: "—", owner: "State Director", tone: "healthy" },
    { name: "Capacity: TN", status: "Growth ready", age: "—", owner: "State Director", tone: "healthy" },
    { name: "Capacity: VA", status: "Watch (81%)", age: "—", owner: "State Director", tone: "attention" },
  ],
  statusTitle: "Census by state",
  status: [
    { label: "GA", count: 58, tone: "attention" },
    { label: "NC", count: 42, tone: "healthy" },
    { label: "TN", count: 22, tone: "healthy" },
    { label: "VA", count: 20, tone: "attention" },
  ],
  trendTitle: "Census by week",
  trend: [
    { label: "W1", value: 132 }, { label: "W2", value: 135 }, { label: "W3", value: 139 },
    { label: "W4", value: 142 },
  ],
  risks: [
    { title: "GA capacity nearing limit", detail: "92% used — plan RBT hires now.", severity: "high" },
  ],
  dataNote: DEMO_NOTE,
};

// ---- Training ---------------------------------------------------------
const training: DepartmentDashboardDef = {
  id: "department-training-dashboard",
  title: "Training Dashboard",
  department: "Training",
  owner: "Training Team",
  visibleTo: [
    ...LEADERSHIP, ...SD,
    "training_manager", "hr_team", "hr_lead",
  ],
  kpis: [
    { label: "Completion Rate", value: "78%", delta: "+4pt", trend: "up" },
    { label: "Assigned Trainings", value: "312", delta: "+22", trend: "up" },
    { label: "In Progress", value: "58", delta: "+6", trend: "neutral" },
    { label: "Overdue", value: "14", delta: "-3", trend: "up" },
    { label: "New Hire Path", value: "9 active", trend: "neutral" },
    { label: "Completed (30d)", value: "82", delta: "+12", trend: "up" },
  ],
  workQueueTitle: "Overdue trainings",
  workQueue: [
    { name: "Emp · E-1017", status: "HIPAA overdue", age: "6d", owner: "Employee", tone: "critical" },
    { name: "Emp · E-1031", status: "CPR renewal overdue", age: "12d", owner: "Employee", tone: "critical" },
    { name: "Emp · E-1042", status: "Safety module overdue", age: "3d", owner: "Employee", tone: "attention" },
    { name: "Emp · E-1051", status: "Ethics quiz overdue", age: "2d", owner: "Employee", tone: "attention" },
  ],
  statusTitle: "By department",
  status: [
    { label: "Clinical", count: 118, tone: "healthy" },
    { label: "Operations", count: 62, tone: "healthy" },
    { label: "HR", count: 24, tone: "healthy" },
    { label: "Overdue (all)", count: 14, tone: "critical" },
  ],
  trendTitle: "Completions by week",
  trend: [
    { label: "W1", value: 14 }, { label: "W2", value: 18 }, { label: "W3", value: 22 },
    { label: "W4", value: 28 },
  ],
  risks: [
    { title: "14 overdue trainings", detail: "Focus on CPR renewals blocking staffing.", severity: "high" },
  ],
  dataNote: DEMO_NOTE,
};

export const DEPARTMENT_DASHBOARDS: DepartmentDashboardDef[] = [
  intake, authorizations, staffing, scheduling, recruiting, hr, qa, clinic, training,
];

export const DEPARTMENT_DASHBOARD_IDS = new Set(DEPARTMENT_DASHBOARDS.map((d) => d.id));

export function getDepartmentDashboard(id: string): DepartmentDashboardDef | undefined {
  return DEPARTMENT_DASHBOARDS.find((d) => d.id === id);
}