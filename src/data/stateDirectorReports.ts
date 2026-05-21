// State Director Operational Intelligence — mock data per report.
// Each report is a small "operational app": KPIs + visuals + table + AI + actions.

import type { KpiMetric, RiskAlert } from "./reports";

export interface SdAction { label: string; tone?: "primary" | "default" | "destructive"; href?: string }
export interface SdAiInsight { icon?: string; text: string; tone: "ok" | "warn" | "bad" | "info" }

export interface SdReport {
  kpis: KpiMetric[];
  insights: SdAiInsight[];
  actions: SdAction[];
}

/* ---------- 1. State Performance ---------- */
export const sdStatePerformance: SdReport = {
  kpis: [
    { id: "p1", label: "Active Clients", value: "83", rawValue: 83, change: "+6 MoM", trend: "up", hint: "Virginia", drillTo: "/clients" },
    { id: "p2", label: "Service Hours / Wk", value: "1,284", rawValue: 1284, change: "+4.2%", trend: "up", drillTo: "/scheduling" },
    { id: "p3", label: "Retention 90d", value: "94%", rawValue: 94, change: "+1pt", trend: "up", drillTo: "/clients" },
    { id: "p4", label: "Cancellation Rate", value: "8.1%", rawValue: 8.1, change: "-0.6pt", trend: "up", drillTo: "/scheduling" },
    { id: "p5", label: "Auth Risks", value: "9", rawValue: 9, change: "+2", trend: "down", drillTo: "/authorizations" },
    { id: "p6", label: "Recruiting Pipeline", value: "27", rawValue: 27, change: "+5", trend: "up", drillTo: "/recruiting" },
  ],
  insights: [
    { tone: "ok", text: "Hours/active client trending up — operational efficiency improving." },
    { tone: "warn", text: "Cancellation spike in Norfolk — 3 RBTs out this week." },
    { tone: "bad", text: "2 expiring auths in Richmond inside 10 days." },
  ],
  actions: [
    { label: "Open Operations Brief", tone: "primary", href: "/operations" },
    { label: "Schedule State Review", href: "/calendar" },
    { label: "Export Snapshot" },
  ],
};

/* ---------- 2. Staffing Health ---------- */
export const sdStaffing: SdReport = {
  kpis: [
    { id: "s1", label: "Unstaffed Clients", value: "3", rawValue: 3, change: "+1", trend: "down", drillTo: "/clients" },
    { id: "s2", label: "Partially Staffed", value: "7", rawValue: 7, change: "−2", trend: "up", drillTo: "/scheduling" },
    { id: "s3", label: "Overloaded BCBAs", value: "1", rawValue: 1, change: "0", trend: "neutral", drillTo: "/staff" },
    { id: "s4", label: "Underutilized RBTs", value: "2", rawValue: 2, change: "+1", trend: "down", drillTo: "/staff" },
    { id: "s5", label: "Urgent Staffing", value: "5", rawValue: 5, change: "+2", trend: "down", drillTo: "/staff" },
    { id: "s6", label: "Avg Time to Staff", value: "4.1d", rawValue: 4.1, change: "−0.3d", trend: "up", drillTo: "/staff" },
  ],
  insights: [
    { tone: "bad", text: "Charlotte: 1 BCBA short — projected starts will slip 7 days." },
    { tone: "warn", text: "12 RBT hours unassigned in Richmond — redeploy candidates available." },
    { tone: "ok", text: "Norfolk capacity restored after 2 onboarding completions." },
  ],
  actions: [
    { label: "Open Scheduling", tone: "primary", href: "/scheduling" },
    { label: "Open Recruiting", href: "/recruiting" },
    { label: "Assign Staff", href: "/staff" },
    { label: "Escalate to Ops", href: "/operations" },
  ],
};

export const sdStaffingByBcba = [
  { name: "Dr. Maya Patel", region: "Richmond", caseload: 14, capacity: 12, gap: 0, status: "Overloaded" },
  { name: "Camila Ortiz", region: "Arlington", caseload: 12, capacity: 12, gap: 1, status: "Near Cap" },
  { name: "Priya Shah", region: "Richmond", caseload: 13, capacity: 12, gap: 1, status: "Near Cap" },
  { name: "Marcus Hill", region: "Roanoke", caseload: 9, capacity: 12, gap: 0, status: "Healthy" },
  { name: "Jordan Lee", region: "Norfolk", caseload: 11, capacity: 12, gap: 0, status: "Healthy" },
];

/* ---------- 3. BCBA Performance ---------- */
export const sdBcbaPerf: SdReport = {
  kpis: [
    { id: "b1", label: "Avg Supervision %", value: "84%", rawValue: 84, change: "+2pt", trend: "up", drillTo: "/staff" },
    { id: "b2", label: "PR Completion", value: "91%", rawValue: 91, change: "−2pt", trend: "down", drillTo: "/qa" },
    { id: "b3", label: "Avg Caseload", value: "11.8", rawValue: 11.8, change: "+0.4", trend: "neutral", drillTo: "/staff" },
    { id: "b4", label: "Service Hours / BCBA", value: "34.7", rawValue: 34.7, change: "+1.1", trend: "up", drillTo: "/staff" },
    { id: "b5", label: "Cancellations", value: "7.2%", rawValue: 7.2, change: "−0.4pt", trend: "up", drillTo: "/scheduling" },
    { id: "b6", label: "Parent Training", value: "78%", rawValue: 78, change: "+5pt", trend: "up", drillTo: "/authorizations" },
  ],
  insights: [
    { tone: "warn", text: "Dr. Maya Patel — supervision at 78%, caseload 14/12. Coaching opportunity." },
    { tone: "ok", text: "Jordan Lee — 92% supervision, 0 overdue PRs. Model performance." },
    { tone: "bad", text: "3 PRs overdue > 7 days across the state." },
  ],
  actions: [
    { label: "Open BCBA Workspace", tone: "primary", href: "/staff" },
    { label: "Send Coaching Note", href: "/staff" },
    { label: "Export Scorecard" },
  ],
};

export const sdBcbaRows = [
  { name: "Jordan Lee", caseload: 11, supervision: 92, prs: 0, cancellations: 5.1, retention: 97 },
  { name: "Priya Shah", caseload: 13, supervision: 88, prs: 0, cancellations: 6.4, retention: 94 },
  { name: "Camila Ortiz", caseload: 12, supervision: 84, prs: 1, cancellations: 7.8, retention: 92 },
  { name: "Marcus Hill", caseload: 9, supervision: 65, prs: 2, cancellations: 9.1, retention: 88 },
  { name: "Dr. Maya Patel", caseload: 14, supervision: 78, prs: 3, cancellations: 8.2, retention: 90 },
];

/* ---------- 4. Auth / PR Risk ---------- */
export const sdAuthPrRisk: SdReport = {
  kpis: [
    { id: "a1", label: "Auths < 30d", value: "9", rawValue: 9, change: "+3", trend: "down", drillTo: "/authorizations" },
    { id: "a2", label: "Overdue PRs", value: "6", rawValue: 6, change: "+2", trend: "down", drillTo: "/qa" },
    { id: "a3", label: "Missing 97155", value: "4", rawValue: 4, change: "−1", trend: "up", drillTo: "/clients" },
    { id: "a4", label: "Missing 97156", value: "11", rawValue: 11, change: "−3", trend: "up", drillTo: "/authorizations" },
    { id: "a5", label: "QA Delays > 5d", value: "5", rawValue: 5, change: "+1", trend: "down", drillTo: "/qa" },
    { id: "a6", label: "Reassessment Risk", value: "3", rawValue: 3, change: "0", trend: "neutral", drillTo: "/clients" },
  ],
  insights: [
    { tone: "bad", text: "2 Anthem auths expire inside 10 days — start reauth packets today." },
    { tone: "warn", text: "5 PRs stuck in QA > 7 days. Holding $14k in billable hours." },
    { tone: "info", text: "Parent training 97156 utilization climbing — keep pushing." },
  ],
  actions: [
    { label: "Open Auth Workqueue", tone: "primary", href: "/authorizations" },
    { label: "Open QA Queue", href: "/qa" },
    { label: "Notify BCBAs", href: "/staff" },
  ],
};

export const sdAuthPrRiskAlerts: RiskAlert[] = [
  { id: "x1", title: "Auths expiring < 10 days", count: 2, severity: "high", description: "Anthem, Aetna — start packets", drillTo: "/authorizations" },
  { id: "x2", title: "Overdue PRs > 7 days", count: 3, severity: "high", description: "Held in QA", drillTo: "/qa" },
  { id: "x3", title: "Missing supervision (97155)", count: 4, severity: "medium", description: "Below threshold this period", drillTo: "/clients" },
  { id: "x4", title: "Missing parent training", count: 11, severity: "medium", description: "Authorized but undelivered", drillTo: "/authorizations" },
];

/* ---------- 5. Recruiting Pipeline ---------- */
export const sdRecruiting: SdReport = {
  kpis: [
    { id: "r1", label: "Active Applicants", value: "62", rawValue: 62, change: "+8", trend: "up", drillTo: "/recruiting" },
    { id: "r2", label: "BCBA Pipeline", value: "9", rawValue: 9, change: "+2", trend: "up", drillTo: "/recruiting" },
    { id: "r3", label: "RBT Pipeline", value: "53", rawValue: 53, change: "+6", trend: "up", drillTo: "/recruiting" },
    { id: "r4", label: "Interviews / Wk", value: "21", rawValue: 21, change: "+3", trend: "up", drillTo: "/recruiting" },
    { id: "r5", label: "Onboarding", value: "12", rawValue: 12, change: "−1", trend: "neutral", drillTo: "/employee-ops" },
    { id: "r6", label: "Orientation Done", value: "84%", rawValue: 84, change: "+4pt", trend: "up", drillTo: "/training" },
  ],
  insights: [
    { tone: "ok", text: "BCBA pipeline can cover next 30 days of projected starts." },
    { tone: "warn", text: "Credentialing average: 11 days — 4 days longer than target." },
    { tone: "info", text: "Indeed converting 2x ZipRecruiter — rebalance spend." },
  ],
  actions: [
    { label: "Open Recruiting", tone: "primary", href: "/recruiting" },
    { label: "Open Onboarding", href: "/employee-ops" },
    { label: "Pull Indeed Funnel" },
  ],
};

/* ---------- 6. Client Growth ---------- */
export const sdGrowth: SdReport = {
  kpis: [
    { id: "g1", label: "New Clients (MTD)", value: "14", rawValue: 14, change: "+3", trend: "up", drillTo: "/clients" },
    { id: "g2", label: "Discharged", value: "3", rawValue: 3, change: "−1", trend: "up", drillTo: "/clients" },
    { id: "g3", label: "Flaked", value: "2", rawValue: 2, change: "0", trend: "neutral", drillTo: "/leads" },
    { id: "g4", label: "Waitlist", value: "11", rawValue: 11, change: "+4", trend: "down", drillTo: "/intake" },
    { id: "g5", label: "Net Growth", value: "+9", rawValue: 9, change: "+2", trend: "up", drillTo: "/clients" },
    { id: "g6", label: "Hours Growth", value: "+5.4%", rawValue: 5.4, change: "+1.2pt", trend: "up", drillTo: "/scheduling" },
  ],
  insights: [
    { tone: "ok", text: "Richmond region driving 60% of new starts this month." },
    { tone: "warn", text: "Waitlist climbing — staffing throughput becoming the bottleneck." },
    { tone: "info", text: "Roanoke is your slowest-growing region — consider focused marketing." },
  ],
  actions: [
    { label: "Open Growth Plan", tone: "primary", href: "/clients" },
    { label: "Open Waitlist", href: "/intake" },
    { label: "Marketing Brief", href: "/marketing" },
  ],
};

/* ---------- 7. Scheduling Health ---------- */
export const sdScheduling: SdReport = {
  kpis: [
    { id: "h1", label: "Session Completion", value: "92%", rawValue: 92, change: "+1pt", trend: "up", drillTo: "/scheduling" },
    { id: "h2", label: "Cancellations", value: "8.1%", rawValue: 8.1, change: "−0.4pt", trend: "up", drillTo: "/scheduling" },
    { id: "h3", label: "No-Shows", value: "2.3%", rawValue: 2.3, change: "−0.2pt", trend: "up", drillTo: "/scheduling" },
    { id: "h4", label: "Uncovered Sessions", value: "11", rawValue: 11, change: "+3", trend: "down", drillTo: "/scheduling" },
    { id: "h5", label: "Scheduling Conflicts", value: "4", rawValue: 4, change: "0", trend: "neutral", drillTo: "/scheduling" },
    { id: "h6", label: "Fill Rate", value: "88%", rawValue: 88, change: "+2pt", trend: "up", drillTo: "/scheduling" },
  ],
  insights: [
    { tone: "warn", text: "Tuesday afternoons in Richmond — 6 uncovered sessions pattern." },
    { tone: "ok", text: "Fill rate improved across all regions vs last week." },
    { tone: "bad", text: "3 RBT cancellations cluster — review attendance with team." },
  ],
  actions: [
    { label: "Open Scheduling", tone: "primary", href: "/scheduling" },
    { label: "Open Attendance", href: "/scheduling" },
  ],
};

/* ---------- 8. Parent Training (97156) ---------- */
export const sdParentTraining: SdReport = {
  kpis: [
    { id: "pt1", label: "Authorized 97156 Hrs", value: "412", rawValue: 412, change: "+24", trend: "up", drillTo: "/authorizations" },
    { id: "pt2", label: "Delivered", value: "318", rawValue: 318, change: "+38", trend: "up", drillTo: "/scheduling" },
    { id: "pt3", label: "Utilization", value: "77%", rawValue: 77, change: "+6pt", trend: "up", drillTo: "/authorizations" },
    { id: "pt4", label: "Clients w/o PT this Mo", value: "11", rawValue: 11, change: "−3", trend: "up", drillTo: "/clients" },
    { id: "pt5", label: "Below Target BCBAs", value: "2", rawValue: 2, change: "−1", trend: "up", drillTo: "/staff" },
    { id: "pt6", label: "Net Gain MoM", value: "+9pt", rawValue: 9, change: "vs March", trend: "up", drillTo: "/authorizations" },
  ],
  insights: [
    { tone: "warn", text: "11 clients had zero parent training this month — Camila + Marcus cases." },
    { tone: "ok", text: "Utilization up 6 points — coaching impact visible." },
    { tone: "info", text: "Top BCBA: Priya Shah at 96% delivery." },
  ],
  actions: [
    { label: "Open 97156 List", tone: "primary", href: "/authorizations" },
    { label: "Notify Below-Target BCBAs", href: "/staff" },
  ],
};

/* ---------- 9. Supervision ---------- */
export const sdSupervision: SdReport = {
  kpis: [
    { id: "v1", label: "97153 Hours", value: "928", rawValue: 928, change: "+34", trend: "up", drillTo: "/scheduling" },
    { id: "v2", label: "97155 Hours", value: "212", rawValue: 212, change: "+12", trend: "up", drillTo: "/scheduling" },
    { id: "v3", label: "Avg Supervision %", value: "11.6%", rawValue: 11.6, change: "+0.4pt", trend: "up", drillTo: "/staff" },
    { id: "v4", label: "Below Target Clients", value: "6", rawValue: 6, change: "−2", trend: "up", drillTo: "/clients" },
    { id: "v5", label: "BCBA Supervision Load", value: "42 hrs/wk", rawValue: 42, change: "+3", trend: "neutral", drillTo: "/staff" },
    { id: "v6", label: "Clients > 15%", value: "9", rawValue: 9, change: "+2", trend: "up", drillTo: "/clients" },
  ],
  insights: [
    { tone: "bad", text: "6 clients below the 10% supervision threshold this period." },
    { tone: "ok", text: "Supervision ratio improving across the state — coaching working." },
    { tone: "warn", text: "Dr. Maya Patel — supervision load nearing 50 hrs/wk." },
  ],
  actions: [
    { label: "Open Below-Target Clients", tone: "primary", href: "/clients" },
    { label: "Schedule Coaching", href: "/staff" },
  ],
};

/* ---------- 10. Operational Bottlenecks ---------- */
export const sdBottlenecks: SdReport = {
  kpis: [
    { id: "k1", label: "Intake Stuck", value: "4", rawValue: 4, change: "+1", trend: "down", drillTo: "/intake" },
    { id: "k2", label: "Auth Stuck", value: "6", rawValue: 6, change: "0", trend: "neutral", drillTo: "/authorizations" },
    { id: "k3", label: "Onboarding Stuck", value: "3", rawValue: 3, change: "−1", trend: "up", drillTo: "/employee-ops" },
    { id: "k4", label: "Recruiting Stuck", value: "2", rawValue: 2, change: "0", trend: "neutral", drillTo: "/recruiting" },
    { id: "k5", label: "Staffing Stuck", value: "8", rawValue: 8, change: "+2", trend: "down", drillTo: "/staff" },
    { id: "k6", label: "QA Delays", value: "5", rawValue: 5, change: "+1", trend: "down", drillTo: "/qa" },
  ],
  insights: [
    { tone: "bad", text: "Staffing is the #1 bottleneck right now — 8 clients waiting." },
    { tone: "warn", text: "Auth pipeline averaging 7.2 days — above target by 1.4 days." },
    { tone: "info", text: "Intake throughput improving since coordinator change." },
  ],
  actions: [
    { label: "Open Workflows", tone: "primary", href: "/workflows" },
    { label: "Escalate", href: "/operations" },
  ],
};

/* ---------- 11. State Comparison ---------- */
export const sdStateComparison = [
  { state: "VA", clients: 83, hoursWk: 1284, retention: 94, cancellations: 8.1, recruiting: 27 },
  { state: "NC", clients: 124, hoursWk: 1812, retention: 92, cancellations: 9.0, recruiting: 41 },
  { state: "GA", clients: 76, hoursWk: 1112, retention: 90, cancellations: 10.4, recruiting: 18 },
  { state: "TN", clients: 52, hoursWk: 822, retention: 91, cancellations: 8.6, recruiting: 12 },
  { state: "MD", clients: 41, hoursWk: 612, retention: 93, cancellations: 7.9, recruiting: 9 },
];
export const sdComparison: SdReport = {
  kpis: [
    { id: "c1", label: "VA Rank: Retention", value: "#1", rawValue: 1, change: "↑ 1", trend: "up" },
    { id: "c2", label: "VA Rank: Growth", value: "#3", rawValue: 3, change: "↓ 1", trend: "down" },
    { id: "c3", label: "VA Rank: Cancellations", value: "#2", rawValue: 2, change: "↑ 1", trend: "up" },
    { id: "c4", label: "VA Rank: Recruiting", value: "#3", rawValue: 3, change: "=", trend: "neutral" },
    { id: "c5", label: "VA Rank: Hours/Client", value: "#1", rawValue: 1, change: "↑ 2", trend: "up" },
    { id: "c6", label: "VA Rank: Supervision %", value: "#2", rawValue: 2, change: "=", trend: "neutral" },
  ],
  insights: [
    { tone: "ok", text: "VA leads the network in hours-per-client efficiency." },
    { tone: "warn", text: "NC outpacing VA in net growth this quarter." },
    { tone: "info", text: "GA cancellation trend rising — opportunity to share VA playbook." },
  ],
  actions: [
    { label: "Open State Benchmarks", tone: "primary", href: "/analytics" },
    { label: "Share Playbook", href: "/sop" },
  ],
};

/* ---------- 12. Operational Action Report ---------- */
export const sdActionAlerts: RiskAlert[] = [
  { id: "ac1", title: "Unstaffed clients", count: 3, severity: "high", description: "Approved auths waiting > 5 days", drillTo: "/staffing" },
  { id: "ac2", title: "Auths expiring < 10 days", count: 2, severity: "high", description: "Anthem, Aetna", drillTo: "/authorizations" },
  { id: "ac3", title: "Overdue PRs > 7 days", count: 3, severity: "high", description: "Held in QA", drillTo: "/qa" },
  { id: "ac4", title: "BCBA over capacity", count: 1, severity: "medium", description: "Dr. Maya Patel — 14/12", drillTo: "/staff" },
  { id: "ac5", title: "Onboarding stalled", count: 3, severity: "medium", description: "> 10 days incomplete", drillTo: "/recruiting" },
  { id: "ac6", title: "Underutilized RBTs", count: 2, severity: "low", description: "30 hrs available to redeploy", drillTo: "/staff" },
];
export const sdActionReport: SdReport = {
  kpis: [
    { id: "ar1", label: "Critical", value: "5", rawValue: 5, change: "+2", trend: "down" },
    { id: "ar2", label: "High", value: "4", rawValue: 4, change: "−1", trend: "up" },
    { id: "ar3", label: "Medium", value: "6", rawValue: 6, change: "+1", trend: "neutral" },
    { id: "ar4", label: "Resolved this Wk", value: "12", rawValue: 12, change: "+4", trend: "up" },
    { id: "ar5", label: "Avg Time to Resolve", value: "2.6d", rawValue: 2.6, change: "−0.5d", trend: "up" },
    { id: "ar6", label: "Open Escalations", value: "2", rawValue: 2, change: "0", trend: "neutral" },
  ],
  insights: [
    { tone: "bad", text: "5 critical items unresolved — staffing is the dominant theme." },
    { tone: "ok", text: "Resolution velocity improving — 12 closed this week." },
    { tone: "info", text: "No escalation aged > 3 days — discipline is holding." },
  ],
  actions: [
    { label: "Open Action Inbox", tone: "primary", href: "/open-issues" },
    { label: "Assign Owners", href: "/staff" },
    { label: "Export PDF" },
  ],
};