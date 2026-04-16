// =================== Reports mock dataset ===================
// All numbers are static demo data — wired to drill-down deep links.

export type DateRange = "today" | "week" | "month" | "quarter" | "custom";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change: string;
  trend: "up" | "down" | "neutral";
  drillTo?: string; // route for drill-down
  hint?: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  dropOff?: number;
  drillTo?: string;
}

// =================== EXECUTIVE OVERVIEW ===================

export const executiveKpis: KpiMetric[] = [
  { id: "new-leads", label: "New Leads", value: "84", rawValue: 84, change: "+12% vs last month", trend: "up", drillTo: "/leads", hint: "Last 30 days" },
  { id: "lead-conversion", label: "Lead → Client", value: "34%", rawValue: 34, change: "+4 pts", trend: "up", drillTo: "/leads" },
  { id: "active-clients", label: "Active Clients", value: "142", rawValue: 142, change: "+8", trend: "up", drillTo: "/clients" },
  { id: "net-growth", label: "Net Growth (Month)", value: "+11", rawValue: 11, change: "+3 vs prior", trend: "up", drillTo: "/clients" },
  { id: "pending-starts", label: "Pending Start Dates", value: "23", rawValue: 23, change: "+4", trend: "down", drillTo: "/clients", hint: "Stuck before active" },
  { id: "revenue-pipeline", label: "Revenue Pipeline", value: "$182k", rawValue: 182, change: "+$24k", trend: "up", drillTo: "/clients", hint: "Projected monthly" },
];

// =================== LEAD FUNNEL ===================

export const leadFunnel: FunnelStage[] = [
  { stage: "New Lead", count: 84, drillTo: "/leads" },
  { stage: "In Contact", count: 62, dropOff: 26, drillTo: "/leads" },
  { stage: "Sent Form", count: 48, dropOff: 23, drillTo: "/leads" },
  { stage: "Form Received", count: 36, dropOff: 25, drillTo: "/leads" },
  { stage: "Sent to VOB", count: 32, dropOff: 11, drillTo: "/leads" },
  { stage: "VOB Completed", count: 29, dropOff: 9, drillTo: "/leads" },
  { stage: "Converted to Client", count: 24, dropOff: 17, drillTo: "/clients" },
];

// =================== CLIENT FUNNEL ===================

export const clientFunnel: FunnelStage[] = [
  { stage: "BCBA Assignment", count: 24, drillTo: "/clients" },
  { stage: "Pending Initial Auth", count: 21, dropOff: 13, drillTo: "/authorizations" },
  { stage: "Schedule Assessment", count: 19, dropOff: 10, drillTo: "/scheduling" },
  { stage: "Assessment Scheduled", count: 18, dropOff: 5, drillTo: "/scheduling" },
  { stage: "In QA", count: 15, dropOff: 17, drillTo: "/qa" },
  { stage: "Pending Treatment Auth", count: 13, dropOff: 13, drillTo: "/authorizations" },
  { stage: "Staffing Needed", count: 11, dropOff: 15, drillTo: "/staffing" },
  { stage: "Pending Start Date", count: 9, dropOff: 18, drillTo: "/clients" },
  { stage: "Active", count: 8, dropOff: 11, drillTo: "/clients" },
];

// =================== INTAKE PERFORMANCE ===================

export const intakeKpis: KpiMetric[] = [
  { id: "leads-day", label: "Leads / Day", value: "2.8", rawValue: 2.8, change: "+0.4", trend: "up", drillTo: "/leads" },
  { id: "contact-rate", label: "Contact Rate", value: "74%", rawValue: 74, change: "+6 pts", trend: "up", drillTo: "/leads" },
  { id: "form-completion", label: "Form Completion", value: "57%", rawValue: 57, change: "+2 pts", trend: "up", drillTo: "/leads" },
  { id: "time-to-contact", label: "Time to Contact", value: "2.4h", rawValue: 2.4, change: "-18%", trend: "up", drillTo: "/phone-calls" },
  { id: "time-to-form", label: "Time to Form", value: "3.2d", rawValue: 3.2, change: "-8%", trend: "up", drillTo: "/leads" },
  { id: "time-to-vob", label: "Time to VOB", value: "1.8d", rawValue: 1.8, change: "+5%", trend: "down", drillTo: "/leads" },
];

export const leadSourcePerformance = [
  { source: "Google Ads", leads: 28, converted: 12, rate: 43 },
  { source: "Referral", leads: 22, converted: 11, rate: 50 },
  { source: "Facebook", leads: 18, converted: 5, rate: 28 },
  { source: "School", leads: 11, converted: 4, rate: 36 },
  { source: "Direct", leads: 5, converted: 2, rate: 40 },
];

export const intakeByState = [
  { state: "GA", leads: 52, conversion: 38 },
  { state: "TX", leads: 18, conversion: 28 },
  { state: "AZ", leads: 9, conversion: 33 },
  { state: "FL", leads: 5, conversion: 20 },
];

export const intakeCoordinatorPerf = [
  { name: "Sarah M.", handled: 31, avgContact: "1.8h", conversion: 42 },
  { name: "James R.", handled: 28, avgContact: "2.6h", conversion: 36 },
  { name: "Maria K.", handled: 25, avgContact: "3.1h", conversion: 28 },
];

// =================== AUTH PERFORMANCE ===================

export const authKpis: KpiMetric[] = [
  { id: "time-submit", label: "Time to Submit", value: "4.2d", rawValue: 4.2, change: "-0.8d", trend: "up", drillTo: "/authorizations" },
  { id: "approval-rate", label: "Approval Rate", value: "87%", rawValue: 87, change: "+3 pts", trend: "up", drillTo: "/authorizations" },
  { id: "denial-rate", label: "Denial Rate", value: "8%", rawValue: 8, change: "-2 pts", trend: "up", drillTo: "/authorizations" },
  { id: "time-approval", label: "Time to Approval", value: "9.1d", rawValue: 9.1, change: "+1.2d", trend: "down", drillTo: "/authorizations" },
  { id: "auths-pending", label: "Auths Pending", value: "27", rawValue: 27, change: "+4", trend: "down", drillTo: "/authorizations" },
  { id: "auths-expiring", label: "Expiring < 30d", value: "9", rawValue: 9, change: "+2", trend: "down", drillTo: "/authorizations" },
];

export const denialsByPayor = [
  { payor: "Aetna", denied: 4, total: 28, rate: 14 },
  { payor: "BCBS", denied: 3, total: 41, rate: 7 },
  { payor: "Cigna", denied: 2, total: 18, rate: 11 },
  { payor: "United", denied: 5, total: 22, rate: 23 },
  { payor: "Humana", denied: 1, total: 14, rate: 7 },
];

export const missingDocTrends = [
  { type: "Treatment Plan", count: 6, blocking: "Auth Submission" },
  { type: "Supporting Documentation", count: 4, blocking: "Auth Submission" },
  { type: "Consent Forms", count: 3, blocking: "Assessment" },
  { type: "Insurance Card", count: 2, blocking: "VOB" },
];

// =================== QA PERFORMANCE ===================

export const qaKpis: KpiMetric[] = [
  { id: "qa-turnaround", label: "QA Turnaround", value: "3.1d", rawValue: 3.1, change: "-1d", trend: "up", drillTo: "/qa" },
  { id: "qa-queue", label: "QA Queue Size", value: "15", rawValue: 15, change: "+2", trend: "down", drillTo: "/qa" },
  { id: "qa-completed", label: "Completed / Day", value: "4.2", rawValue: 4.2, change: "+0.5", trend: "up", drillTo: "/qa" },
  { id: "qa-stuck-pct", label: "Stuck > 5d", value: "12%", rawValue: 12, change: "-3 pts", trend: "up", drillTo: "/qa" },
  { id: "qa-assess-to-done", label: "Assess → QA Done", value: "8.4d", rawValue: 8.4, change: "-1.6d", trend: "up", drillTo: "/qa" },
];

// =================== SCHEDULING & STAFFING ===================

export const schedulingKpis: KpiMetric[] = [
  { id: "time-schedule", label: "Time to Schedule Assess", value: "2.6d", rawValue: 2.6, change: "-0.4d", trend: "up", drillTo: "/scheduling" },
  { id: "time-start", label: "Time to Start Date", value: "9.8d", rawValue: 9.8, change: "+1.1d", trend: "down", drillTo: "/scheduling" },
  { id: "fill-rate", label: "Staffing Fill Rate", value: "78%", rawValue: 78, change: "+5 pts", trend: "up", drillTo: "/staffing" },
  { id: "waiting-staffing", label: "Waiting on Staffing", value: "11", rawValue: 11, change: "+2", trend: "down", drillTo: "/staffing" },
];

export const capacityByState = [
  { state: "GA", available: 480, needed: 542, gap: 62 },
  { state: "TX", available: 220, needed: 196, gap: -24 },
  { state: "AZ", available: 110, needed: 138, gap: 28 },
  { state: "FL", available: 80, needed: 64, gap: -16 },
];

// =================== CLIENT LIFECYCLE ===================

export const lifecycleKpis: KpiMetric[] = [
  { id: "lead-to-start", label: "Lead → Start Date", value: "42d", rawValue: 42, change: "-3d", trend: "up", drillTo: "/clients" },
  { id: "vob-to-start", label: "VOB → Start Date", value: "31d", rawValue: 31, change: "-2d", trend: "up", drillTo: "/clients" },
  { id: "reach-active", label: "% Reaching Active", value: "82%", rawValue: 82, change: "+2 pts", trend: "up", drillTo: "/clients" },
  { id: "flake-rate", label: "Flake Rate", value: "5%", rawValue: 5, change: "-1 pt", trend: "up", drillTo: "/clients" },
  { id: "discharge-rate", label: "Discharge Rate", value: "3%", rawValue: 3, change: "0", trend: "neutral", drillTo: "/clients" },
  { id: "pause-rate", label: "Services on Pause", value: "4%", rawValue: 4, change: "+1 pt", trend: "down", drillTo: "/clients" },
];

// =================== REVENUE PIPELINE ===================

export const revenuePipeline = [
  { stage: "VOB Completed", clients: 29, weight: 0.2, value: 58 },
  { stage: "Pending Initial Auth", clients: 21, weight: 0.35, value: 73 },
  { stage: "Pending Treatment Auth", clients: 13, weight: 0.55, value: 71 },
  { stage: "Staffing Needed", clients: 11, weight: 0.7, value: 77 },
  { stage: "Pending Start Date", clients: 9, weight: 0.85, value: 76 },
];

export const projectedStarts = [
  { window: "This Week", count: 4, confidence: 92 },
  { window: "Next Week", count: 7, confidence: 78 },
  { window: "Week 3", count: 6, confidence: 64 },
  { window: "Week 4", count: 8, confidence: 51 },
];

// =================== TEAM PERFORMANCE ===================

export interface TeamMemberPerf {
  name: string;
  role: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
  metric3Label: string;
  metric3Value: string;
  trend: "up" | "down" | "neutral";
}

export const teamPerformance: TeamMemberPerf[] = [
  { name: "Sarah M.", role: "Intake Lead", metric1Label: "Leads", metric1Value: "31", metric2Label: "Contact", metric2Value: "1.8h", metric3Label: "Conv", metric3Value: "42%", trend: "up" },
  { name: "James R.", role: "Intake", metric1Label: "Leads", metric1Value: "28", metric2Label: "Contact", metric2Value: "2.6h", metric3Label: "Conv", metric3Value: "36%", trend: "up" },
  { name: "Mordy G.", role: "Auth & QA", metric1Label: "Auths", metric1Value: "23", metric2Label: "Submit", metric2Value: "3.8d", metric3Label: "Approval", metric3Value: "91%", trend: "up" },
  { name: "Dr. Karen Lee", role: "BCBA / QA", metric1Label: "QA", metric1Value: "18", metric2Label: "Turnaround", metric2Value: "2.6d", metric3Label: "Approved", metric3Value: "94%", trend: "up" },
  { name: "David C.", role: "Staffing", metric1Label: "Assigns", metric1Value: "14", metric2Label: "Fill Time", metric2Value: "4.2d", metric3Label: "Fill %", metric3Value: "82%", trend: "neutral" },
  { name: "Maria K.", role: "Intake", metric1Label: "Leads", metric1Value: "25", metric2Label: "Contact", metric2Value: "3.1h", metric3Label: "Conv", metric3Value: "28%", trend: "down" },
];

// =================== ALERTS / RISK ===================

export interface RiskAlert {
  id: string;
  title: string;
  count: number;
  severity: "high" | "medium" | "low";
  description: string;
  drillTo: string;
}

export const riskAlerts: RiskAlert[] = [
  { id: "r1", title: "Leads not contacted", count: 7, severity: "high", description: "Older than 24h with no outreach", drillTo: "/leads" },
  { id: "r2", title: "Clients stuck before staffing", count: 11, severity: "high", description: "Pending more than 5 days in Staffing Needed", drillTo: "/staffing" },
  { id: "r3", title: "Auth delays", count: 9, severity: "medium", description: "Submitted > 14 days, no decision", drillTo: "/authorizations" },
  { id: "r4", title: "QA backlog", count: 5, severity: "medium", description: "In QA review > 5 days", drillTo: "/qa" },
  { id: "r5", title: "Auths expiring < 30 days", count: 9, severity: "medium", description: "Renewal cycle starting now", drillTo: "/authorizations" },
  { id: "r6", title: "Staffing shortage GA", count: 62, severity: "high", description: "Hours gap (available vs needed)", drillTo: "/staffing" },
];

// =================== GROWTH TRENDS ===================

export const monthlyTrend = [
  { month: "Nov", leads: 62, clients: 18, active: 118 },
  { month: "Dec", leads: 71, clients: 19, active: 124 },
  { month: "Jan", leads: 68, clients: 22, active: 128 },
  { month: "Feb", leads: 76, clients: 23, active: 134 },
  { month: "Mar", leads: 79, clients: 26, active: 138 },
  { month: "Apr", leads: 84, clients: 28, active: 142 },
];

// =================== Helpers ===================

export const trendOf = (n: number, inverse = false): "up" | "down" | "neutral" => {
  if (n === 0) return "neutral";
  const positive = n > 0;
  return positive === !inverse ? "up" : "down";
};
