// Phase 4 mock intelligence data — Blossom OS analytics layer.
// Frontend-only. Shapes mirror eventual Supabase tables.

export interface KpiSpec {
  id: string;
  label: string;
  value: string | number;
  delta: number; // percent change vs prior period
  trend: number[]; // sparkline values
  hint?: string;
  link?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  detail: string;
  time: string;
  category: string;
}

export interface ReadinessRow {
  department: string;
  competencies: number[]; // 0-100 across 6 competency areas
  overall: number;
}

export interface EngagementRow {
  name: string;
  department: string;
  engagement: "Low" | "Medium" | "High";
  lastActive: string;
  completion: number;
}

export interface CourseStat {
  title: string;
  enrolled: number;
  completion: number;
  avgMinutes: number;
  quizPassRate: number;
  dropoff: number;
}

export interface ComplianceItem {
  id: string;
  employee: string;
  item: string;
  state: string;
  expires: string;
  status: "OK" | "Expiring" | "Expired" | "Missing";
}

export interface NewHireProgress {
  id: string;
  name: string;
  role: string;
  department: string;
  state: string;
  daysSinceHire: number;
  progress: number;
  stage: string;
}

export interface StateMetric {
  id: string;
  name: string;
  state: string;
  type: "State" | "Clinic";
  employees: number;
  onboarding: number;
  compliance: number;
  training: number;
  alerts: number;
}

export interface ScorecardRowData {
  id: string;
  kpi: string;
  owner: string;
  target: number | string;
  current: number | string;
  trend: number[];
  status: "green" | "yellow" | "red";
  unit?: string;
}

export interface RiskInsight {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
  affected: number;
  category: string;
  cta: string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  metrics: string[];
  category: string;
}

const trend = (n: number, base: number, vol = 5) =>
  Array.from({ length: n }, (_, i) => Math.max(0, Math.round(base + Math.sin(i / 1.5) * vol + (i % 3) * 1.5)));

export const operationalHealthScore = 82;
export const workforceReadinessScore = 76;

export const executiveKpis: KpiSpec[] = [
  { id: "active-emp", label: "Active Employees", value: 184, delta: 4.2, trend: trend(12, 180), hint: "+8 this month" },
  { id: "in-training", label: "In Training", value: 67, delta: 12.4, trend: trend(12, 60, 8), hint: "36% of workforce" },
  { id: "compliance", label: "Compliance %", value: "94%", delta: -1.8, trend: trend(12, 94, 2), hint: "Org-wide" },
  { id: "overdue", label: "Overdue Trainings", value: 11, delta: -22, trend: trend(12, 14, 4).reverse(), hint: "Down from 14" },
  { id: "new-hires", label: "New Hires (Mo)", value: 12, delta: 33, trend: trend(12, 9, 3), hint: "vs 9 last month" },
  { id: "completion", label: "Completion Rate", value: "73%", delta: 5.1, trend: trend(12, 70), hint: "Last 30 days" },
  { id: "dept-readiness", label: "Dept Readiness", value: "81%", delta: 2.4, trend: trend(12, 80, 3), hint: "Avg across 16" },
  { id: "avg-onboard", label: "Avg Onboarding", value: "11.4d", delta: -8.5, trend: trend(12, 13, 2).reverse(), hint: "Target: 10d" },
  { id: "open-tasks", label: "Open Tasks", value: 142, delta: -6, trend: trend(12, 150).reverse(), hint: "Across teams" },
  { id: "competencies", label: "Competencies Earned", value: 528, delta: 14, trend: trend(12, 480, 12), hint: "QTD" },
  { id: "certs-exp", label: "Certs Expiring", value: 8, delta: 0, trend: trend(12, 8, 2), hint: "Next 30 days" },
  { id: "automation", label: "Automation Success", value: "98.2%", delta: 0.4, trend: trend(12, 98, 1), hint: "Last 7 days" },
];

export const executiveAlerts: AlertItem[] = [
  { id: "a1", title: "Georgia compliance dropped 6%", severity: "high", detail: "5 RBT certifications need renewal this week.", time: "2h ago", category: "Compliance" },
  { id: "a2", title: "12 users have overdue onboarding", severity: "high", detail: "Across Intake and Staffing teams.", time: "4h ago", category: "Onboarding" },
  { id: "a3", title: "QA Department completion +12%", severity: "low", detail: "QA Academy completion improved week-over-week.", time: "1d ago", category: "Training" },
  { id: "a4", title: "3 certifications expire this week", severity: "medium", detail: "BCBA — Sarah K, RBT — Marcus W, RBT — Priya P.", time: "1d ago", category: "Compliance" },
  { id: "a5", title: "Operational bottleneck detected", severity: "medium", detail: "Authorization queue depth above threshold.", time: "2d ago", category: "Operations" },
  { id: "a6", title: "Integration sync warning", severity: "medium", detail: "CentralReach last synced 6h ago.", time: "6h ago", category: "Integrations" },
];

export const departmentReadiness: ReadinessRow[] = [
  { department: "Intake", competencies: [85, 78, 90, 72, 80, 88], overall: 82 },
  { department: "Authorizations", competencies: [70, 88, 75, 82, 68, 76], overall: 76 },
  { department: "Scheduling", competencies: [90, 85, 78, 92, 88, 80], overall: 86 },
  { department: "Staffing", competencies: [65, 72, 80, 68, 75, 70], overall: 72 },
  { department: "QA", competencies: [88, 92, 90, 85, 94, 91], overall: 90 },
  { department: "Clinics", competencies: [78, 82, 75, 80, 78, 85], overall: 80 },
  { department: "HR", competencies: [82, 88, 85, 90, 86, 88], overall: 87 },
  { department: "Recruiting", competencies: [72, 68, 75, 70, 65, 72], overall: 70 },
  { department: "Systems", competencies: [92, 95, 90, 88, 94, 96], overall: 93 },
  { department: "Leadership", competencies: [80, 85, 82, 78, 88, 84], overall: 83 },
];

export const competencyAreas = ["Process", "Tools", "Compliance", "Communication", "Quality", "Leadership"];

export const competencyGaps = [
  { area: "Compliance", gap: 18 },
  { area: "Tools", gap: 14 },
  { area: "Quality", gap: 11 },
  { area: "Process", gap: 9 },
  { area: "Communication", gap: 7 },
  { area: "Leadership", gap: 5 },
];

export const engagementScores: EngagementRow[] = [
  { name: "Sarah Kim", department: "Intake", engagement: "High", lastActive: "10m ago", completion: 92 },
  { name: "Marcus Webb", department: "Authorizations", engagement: "Low", lastActive: "5d ago", completion: 38 },
  { name: "Dana Pierce", department: "Scheduling", engagement: "High", lastActive: "30m ago", completion: 100 },
  { name: "Priya Patel", department: "Staffing", engagement: "Medium", lastActive: "2h ago", completion: 64 },
  { name: "Jordan Hayes", department: "QA", engagement: "High", lastActive: "1h ago", completion: 88 },
  { name: "Reese Cooper", department: "HR", engagement: "High", lastActive: "1h ago", completion: 95 },
  { name: "Sam Ortiz", department: "Recruiting", engagement: "Low", lastActive: "2w ago", completion: 22 },
  { name: "Alex Chen", department: "Systems", engagement: "High", lastActive: "Just now", completion: 100 },
];

export const trainingFunnel = [
  { stage: "Assigned", count: 240 },
  { stage: "Started", count: 198 },
  { stage: "50% Complete", count: 156 },
  { stage: "Completed", count: 124 },
  { stage: "Quiz Passed", count: 109 },
];

export const completionTrend = trend(14, 65, 8);

export const coursePerformance: CourseStat[] = [
  { title: "HIPAA Foundations", enrolled: 184, completion: 94, avgMinutes: 42, quizPassRate: 96, dropoff: 4 },
  { title: "CentralReach Essentials", enrolled: 168, completion: 78, avgMinutes: 64, quizPassRate: 82, dropoff: 14 },
  { title: "Documentation Quality", enrolled: 142, completion: 56, avgMinutes: 58, quizPassRate: 71, dropoff: 28 },
  { title: "ABA Foundations for Ops", enrolled: 96, completion: 62, avgMinutes: 78, quizPassRate: 74, dropoff: 22 },
  { title: "Parent Communication", enrolled: 110, completion: 88, avgMinutes: 38, quizPassRate: 90, dropoff: 8 },
  { title: "First-Time Manager Toolkit", enrolled: 32, completion: 41, avgMinutes: 92, quizPassRate: 68, dropoff: 36 },
];

export const complianceByState = [
  { state: "Georgia", score: 92, employees: 62 },
  { state: "North Carolina", score: 96, employees: 24 },
  { state: "Tennessee", score: 88, employees: 18 },
  { state: "Virginia", score: 94, employees: 21 },
  { state: "Maryland", score: 91, employees: 15 },
];

export const expiringCertifications: ComplianceItem[] = [
  { id: "e1", employee: "Sarah Kim", item: "BCBA License", state: "GA", expires: "2026-05-22", status: "Expiring" },
  { id: "e2", employee: "Marcus Webb", item: "RBT Cert", state: "GA", expires: "2026-05-12", status: "Expiring" },
  { id: "e3", employee: "Priya Patel", item: "RBT Cert", state: "VA", expires: "2026-06-04", status: "Expiring" },
  { id: "e4", employee: "Jordan Hayes", item: "HIPAA Annual", state: "GA", expires: "2026-04-30", status: "Expired" },
  { id: "e5", employee: "Sam Ortiz", item: "Background Check", state: "TN", expires: "2026-05-30", status: "Missing" },
  { id: "e6", employee: "Dana Pierce", item: "RBT Cert", state: "NC", expires: "2026-07-15", status: "OK" },
];

export const complianceTrend = [89, 91, 90, 93, 95, 94];

export const atRiskEmployees = [
  { name: "Marcus Webb", department: "Authorizations", risk: "Multiple overdue items", severity: "high" as const },
  { name: "Sam Ortiz", department: "Recruiting", risk: "No activity 2 weeks", severity: "high" as const },
  { name: "Priya Patel", department: "Staffing", risk: "RBT cert expiring", severity: "medium" as const },
  { name: "Jordan Hayes", department: "QA", risk: "HIPAA expired", severity: "high" as const },
];

export const onboardingStages = [
  { stage: "Hired", count: 24 },
  { stage: "Enrolled", count: 22 },
  { stage: "In Progress", count: 18 },
  { stage: "Completed", count: 14 },
  { stage: "Verified", count: 11 },
  { stage: "Operational", count: 9 },
];

export const onboardingByDept = [
  { department: "Intake", completion: 86 },
  { department: "Authorizations", completion: 72 },
  { department: "Scheduling", completion: 91 },
  { department: "Staffing", completion: 64 },
  { department: "QA", completion: 88 },
  { department: "Clinics", completion: 78 },
  { department: "HR", completion: 95 },
];

export const newHireProgress: NewHireProgress[] = [
  { id: "n1", name: "Avery Long", role: "RBT", department: "Behavioral", state: "GA", daysSinceHire: 4, progress: 22, stage: "Enrolled" },
  { id: "n2", name: "Beth Martin", role: "Intake Coord.", department: "Intake", state: "GA", daysSinceHire: 8, progress: 64, stage: "In Progress" },
  { id: "n3", name: "Carlos Reyes", role: "BCBA", department: "Behavioral", state: "NC", daysSinceHire: 12, progress: 88, stage: "Verified" },
  { id: "n4", name: "Dani Patel", role: "QA Reviewer", department: "QA", state: "VA", daysSinceHire: 6, progress: 40, stage: "In Progress" },
  { id: "n5", name: "Eve Nakamura", role: "Scheduler", department: "Scheduling", state: "TN", daysSinceHire: 16, progress: 100, stage: "Operational" },
  { id: "n6", name: "Frank Owens", role: "Recruiter", department: "Recruiting", state: "GA", daysSinceHire: 22, progress: 55, stage: "Stuck" },
];

export const stateMetrics: StateMetric[] = [
  { id: "ga", name: "Georgia", state: "GA", type: "State", employees: 62, onboarding: 88, compliance: 92, training: 78, alerts: 4 },
  { id: "nc", name: "North Carolina", state: "NC", type: "State", employees: 24, onboarding: 92, compliance: 96, training: 84, alerts: 1 },
  { id: "tn", name: "Tennessee", state: "TN", type: "State", employees: 18, onboarding: 76, compliance: 88, training: 70, alerts: 3 },
  { id: "va", name: "Virginia", state: "VA", type: "State", employees: 21, onboarding: 84, compliance: 94, training: 82, alerts: 2 },
  { id: "md", name: "Maryland", state: "MD", type: "State", employees: 15, onboarding: 90, compliance: 91, training: 78, alerts: 1 },
  { id: "peachtree", name: "Peachtree Corners", state: "GA", type: "Clinic", employees: 28, onboarding: 92, compliance: 95, training: 86, alerts: 1 },
  { id: "riverdale", name: "Riverdale", state: "GA", type: "Clinic", employees: 22, onboarding: 80, compliance: 88, training: 72, alerts: 2 },
];

export const weeklyScorecard: ScorecardRowData[] = [
  { id: "w1", kpi: "New hires onboarded", owner: "Reese Cooper", target: 6, current: 4, trend: trend(8, 5), status: "yellow" },
  { id: "w2", kpi: "Compliance completion %", owner: "Jordan Hayes", target: "95%", current: "94%", trend: trend(8, 93), status: "green" },
  { id: "w3", kpi: "Avg onboarding speed (days)", owner: "Avery Lin", target: 10, current: 11.4, trend: trend(8, 12).reverse(), status: "yellow" },
  { id: "w4", kpi: "Training completion %", owner: "Avery Lin", target: "80%", current: "73%", trend: trend(8, 70), status: "yellow" },
  { id: "w5", kpi: "Operational task completion %", owner: "Ops Manager", target: "90%", current: "92%", trend: trend(8, 88), status: "green" },
  { id: "w6", kpi: "QA training completion", owner: "Jordan Hayes", target: "100%", current: "88%", trend: trend(8, 84), status: "yellow" },
  { id: "w7", kpi: "Leadership accountability score", owner: "Exec", target: 90, current: 85, trend: trend(8, 82), status: "yellow" },
];

export const monthlyScorecard: ScorecardRowData[] = [
  { id: "m1", kpi: "Net workforce growth", owner: "HR", target: 12, current: 14, trend: trend(8, 10), status: "green" },
  { id: "m2", kpi: "Cert renewal rate", owner: "Compliance", target: "95%", current: "92%", trend: trend(8, 90), status: "yellow" },
  { id: "m3", kpi: "Department readiness avg", owner: "Ops", target: "85%", current: "81%", trend: trend(8, 78), status: "yellow" },
  { id: "m4", kpi: "Automation coverage", owner: "Systems", target: "70%", current: "62%", trend: trend(8, 55), status: "yellow" },
];

export const departmentScorecard: ScorecardRowData[] = [
  { id: "d1", kpi: "Intake completion", owner: "Sarah Kim", target: "90%", current: "92%", trend: trend(8, 89), status: "green" },
  { id: "d2", kpi: "Auth turnaround days", owner: "Marcus Webb", target: 3, current: 4.2, trend: trend(8, 4).reverse(), status: "red" },
  { id: "d3", kpi: "Schedule fill rate", owner: "Dana Pierce", target: "95%", current: "97%", trend: trend(8, 95), status: "green" },
  { id: "d4", kpi: "QA pass rate", owner: "Jordan Hayes", target: "92%", current: "94%", trend: trend(8, 91), status: "green" },
];

export const leadershipScorecard: ScorecardRowData[] = [
  { id: "l1", kpi: "L10 attendance", owner: "All Leaders", target: "100%", current: "94%", trend: trend(8, 92), status: "green" },
  { id: "l2", kpi: "Rocks on track", owner: "Exec", target: "80%", current: "72%", trend: trend(8, 70), status: "yellow" },
  { id: "l3", kpi: "1:1s completed", owner: "Managers", target: "100%", current: "88%", trend: trend(8, 85), status: "yellow" },
];

export const riskInsights: RiskInsight[] = [
  { id: "r1", title: "Users likely to fall behind", severity: "high", description: "8 employees showing engagement decline over 2 weeks.", affected: 8, category: "Engagement", cta: "View users" },
  { id: "r2", title: "Departments with declining completion", severity: "medium", description: "Authorizations completion dropped 9% this month.", affected: 1, category: "Training", cta: "View department" },
  { id: "r3", title: "Compliance risk alerts", severity: "high", description: "3 certifications expiring within 7 days.", affected: 3, category: "Compliance", cta: "View certs" },
  { id: "r4", title: "Low engagement users", severity: "medium", description: "11 users have not logged activity in 14+ days.", affected: 11, category: "Engagement", cta: "Send reminder" },
  { id: "r5", title: "Overdue onboarding risk", severity: "high", description: "5 new hires past day 14 without completion.", affected: 5, category: "Onboarding", cta: "Review hires" },
  { id: "r6", title: "High workload managers", severity: "medium", description: "2 managers with 12+ direct report tasks open.", affected: 2, category: "Workload", cta: "Rebalance" },
  { id: "r7", title: "Training bottlenecks", severity: "low", description: "Documentation Quality course has 28% dropoff.", affected: 1, category: "Training", cta: "Review course" },
];

export const reportTemplates: ReportTemplate[] = [
  { id: "t1", title: "Onboarding Report", description: "New hire progress, time-to-completion, stuck stages.", metrics: ["new_hires", "onboarding_progress", "stuck_count"], category: "Onboarding" },
  { id: "t2", title: "Compliance Report", description: "Org-wide compliance %, expiring items, at-risk employees.", metrics: ["compliance_pct", "expiring_certs", "at_risk"], category: "Compliance" },
  { id: "t3", title: "Department Training Report", description: "Per-department training completion and engagement.", metrics: ["completion_by_dept", "engagement", "open_tasks"], category: "Training" },
  { id: "t4", title: "Competency Report", description: "Competencies earned by team and individual.", metrics: ["competencies_earned", "competency_gaps"], category: "Performance" },
  { id: "t5", title: "Certification Report", description: "All certifications by status, expiry, owner.", metrics: ["certs_active", "certs_expiring", "certs_expired"], category: "Compliance" },
  { id: "t6", title: "Operational Readiness", description: "Workforce readiness, dept readiness, ops health score.", metrics: ["readiness_score", "dept_readiness", "ops_health"], category: "Executive" },
];

export const availableMetrics = [
  "new_hires", "onboarding_progress", "stuck_count", "compliance_pct", "expiring_certs", "at_risk",
  "completion_by_dept", "engagement", "open_tasks", "competencies_earned", "competency_gaps",
  "certs_active", "certs_expiring", "certs_expired", "readiness_score", "dept_readiness", "ops_health",
  "training_completion", "course_dropoff", "automation_success",
];
