import {
  Activity, AlertTriangle, BarChart3, Brain, Briefcase, CalendarDays, ClipboardCheck,
  DollarSign, FileCheck2, GraduationCap, HeartPulse, LineChart, MapPin, ShieldCheck, Calculator,
  Sparkles, Stethoscope, Target, TrendingUp, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "./permissions";

export type ReportCategoryId =
  | "operations" | "qa" | "authorizations" | "scheduling" | "recruiting"
  | "financial" | "clinical" | "training" | "leadership" | "state" | "hr"
  | "credentialing" | "business_development";

export interface ReportCategoryDef {
  id: ReportCategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
  tone: string; // tailwind gradient classes
  accent: string; // hsl token for accents
}

export const REPORT_CATEGORIES: ReportCategoryDef[] = [
  { id: "operations", name: "Operations", description: "Pipeline health, throughput, bottlenecks across every queue.", icon: Activity, tone: "from-[hsl(265_100%_97%)] to-[hsl(225_100%_97%)]", accent: "hsl(265 70% 55%)" },
  { id: "qa", name: "QA & Compliance", description: "Supervision, parent training, documentation integrity.", icon: ShieldCheck, tone: "from-[hsl(165_70%_95%)] to-[hsl(190_70%_95%)]", accent: "hsl(170 65% 40%)" },
  { id: "authorizations", name: "Authorizations", description: "Utilization, expirations, denials, payor performance.", icon: FileCheck2, tone: "from-[hsl(35_100%_95%)] to-[hsl(20_100%_95%)]", accent: "hsl(28 90% 50%)" },
  { id: "scheduling", name: "Scheduling", description: "Session completion, cancellations, capacity gaps.", icon: CalendarDays, tone: "from-[hsl(210_100%_96%)] to-[hsl(235_100%_97%)]", accent: "hsl(215 80% 55%)" },
  { id: "recruiting", name: "Recruiting", description: "Pipeline velocity, source quality, offer conversion.", icon: Users, tone: "from-[hsl(280_70%_96%)] to-[hsl(310_70%_96%)]", accent: "hsl(290 60% 55%)" },
  { id: "financial", name: "Financial", description: "Revenue, claims, payment plans, AR aging.", icon: DollarSign, tone: "from-[hsl(140_60%_95%)] to-[hsl(165_60%_95%)]", accent: "hsl(145 55% 40%)" },
  { id: "clinical", name: "Clinical", description: "Caseload outcomes, progress trends, treatment quality.", icon: Stethoscope, tone: "from-[hsl(195_80%_95%)] to-[hsl(215_80%_96%)]", accent: "hsl(200 75% 45%)" },
  { id: "training", name: "Training", description: "Academy progress, certifications, learning velocity.", icon: GraduationCap, tone: "from-[hsl(45_100%_94%)] to-[hsl(30_100%_95%)]", accent: "hsl(38 85% 50%)" },
  { id: "leadership", name: "Leadership", description: "Executive KPIs, growth, operating posture.", icon: Briefcase, tone: "from-[hsl(255_70%_96%)] to-[hsl(225_70%_96%)]", accent: "hsl(255 65% 55%)" },
  { id: "state", name: "State Analytics", description: "Cross-state benchmarks, regional risk, market share.", icon: MapPin, tone: "from-[hsl(345_85%_96%)] to-[hsl(15_85%_96%)]", accent: "hsl(350 70% 55%)" },
  { id: "hr", name: "HR & Payroll", description: "Payroll readiness, employee hours, BCBA minimums, exceptions.", icon: Calculator, tone: "from-[hsl(265_100%_97%)] to-[hsl(245_100%_97%)]", accent: "hsl(265 70% 55%)" },
  { id: "credentialing", name: "Credentialing", description: "Provider credentialing status, BCBA coverage, expirations, payer matrix.", icon: ShieldCheck, tone: "from-[hsl(195_80%_95%)] to-[hsl(215_80%_96%)]", accent: "hsl(200 75% 45%)" },
  { id: "business_development", name: "Business Development", description: "Referral partners, outreach follow-up, source handoffs, provider and community activity.", icon: HeartPulse, tone: "from-[hsl(320_70%_96%)] to-[hsl(300_70%_96%)]", accent: "hsl(320 65% 50%)" },
];

export type ReportType = "dashboard" | "table" | "summary" | "trend";

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  category: ReportCategoryId;
  visibleTo: OSRole[] | "all";
  type: ReportType;
  owner: string;
  lastUpdated: string;
  popularity: number; // 0-100
  featured?: boolean;
  aiInsight?: string;
  kpiPreviews?: { label: string; value: string; delta?: string; trend?: "up" | "down" | "neutral" }[];
  // sparkline points 0-100
  sparkline?: number[];
  tags?: string[];
  /** Maps to one of the legacy detail views to render real content. */
  detailView?: "executive" | "intake" | "auth" | "qa" | "scheduling" | "lifecycle" | "revenue" | "team" | "growth";
  /**
   * Optional drilldown route. When set, report tiles on /reports navigate
   * straight to this filtered detail view instead of the generic ReportDetail.
   */
  drilldownPath?: string;
}

export const REPORTS: ReportDef[] = [
  /* ============================================================
   * Reports Consolidation — Approved Six
   * ----------------------------------------------------------------
   * The Reports page surfaces exactly six report cards for every
   * Blossom OS user. These entries own the canonical id/title/route
   * for each; visibleReportsForRole() below returns only these six.
   *
   * Each report opens a real, working page. Backing data comes from
   * the Admin / Data Upload flows (BCBA Productivity V3 upload,
   * Cancellation Command Center upload, CR authorization upload,
   * CR billing upload for supervision & parent training). Where a
   * shared page (QA Supervision & Parent Training, QA Auth
   * Utilization) supports two of the six reports, we pass a ?view
   * query string so the page can focus the correct lens.
   * ============================================================ */
  {
    id: "bcba-productivity-report-v3",
    title: "BCBA Productivity Report V3",
    description:
      "Single billing upload → BCBA productivity by DOS with permanent Assignment History as source of truth. CR export required: billing/service export with service date, client, provider, procedure code, worked hours, location/state, and BCBA assignment/history source.",
    category: "clinical",
    visibleTo: "all",
    type: "dashboard",
    owner: "Operations",
    lastUpdated: "On upload",
    popularity: 99,
    featured: true,
    aiInsight:
      "Historical ownership. No auth uploads. No seeded data. Unassigned rows are visible, not silently dropped.",
    kpiPreviews: [
      { label: "Total Hours", value: "Auto", trend: "up" },
      { label: "97153 Hours", value: "Auto", trend: "up" },
      { label: "Unassigned", value: "Auto", trend: "down" },
    ],
    sparkline: [44, 52, 60, 66, 72, 78, 82, 86, 92],
    tags: ["BCBA", "Productivity", "V3", "Featured"],
    drilldownPath: "/reports/bcba-productivity-report-v3",
  },
  {
    id: "cancellation-command-center",
    title: "Cancellation Command Center",
    description:
      "Cancellations, lost hours, lost revenue, BCBA/RBT/client impact and state-level utilization leakage. CR exports required: scheduling cancellations export, billing/service export, and authorization/utilization export (for lost hours/revenue).",
    category: "scheduling",
    visibleTo: "all",
    type: "dashboard",
    owner: "Operations",
    lastUpdated: "On upload",
    popularity: 98,
    featured: true,
    aiInsight:
      "Single source of truth for cancellation reporting, lost-hours analysis and revenue leakage.",
    kpiPreviews: [
      { label: "Cancel %", value: "Auto", trend: "down" },
      { label: "Lost hours", value: "Auto", trend: "down" },
      { label: "Lost $", value: "Auto", trend: "down" },
    ],
    sparkline: [60, 56, 58, 50, 48, 44, 42, 38, 36],
    tags: ["Cancellation", "Lost Revenue", "Scheduling", "Featured"],
    drilldownPath: "/reports/cancellation-command-center",
  },
  {
    id: "authorization-analysis",
    title: "Authorization Analysis",
    description:
      "Per-client authorization health: authorized vs worked vs pending vs remaining hours by client, auth #, payor, and service code. CR export required: authorization export with client, authorization number, start/end date, payor, service code, authorized hours/units, worked/used hours, pending hours, remaining hours, auth manager/BCBA (if available).",
    category: "authorizations",
    visibleTo: "all",
    type: "dashboard",
    owner: "Auth Team",
    lastUpdated: "On upload",
    popularity: 96,
    featured: true,
    aiInsight:
      "Upload one CR authorization export — instantly see per-client authorization risk, remaining hours, and expirations.",
    kpiPreviews: [
      { label: "Auths", value: "Auto", trend: "up" },
      { label: "Remaining hrs", value: "Auto", trend: "up" },
      { label: "Exp <30d", value: "Auto", trend: "down" },
    ],
    sparkline: [40, 46, 52, 58, 62, 68, 72, 76, 80],
    tags: ["Authorization", "Analysis", "Featured"],
    drilldownPath: "/reports/qa-auth-utilization?view=analysis",
  },
  {
    id: "authorization-utilization-hour-based",
    title: "Authorization Utilization — Hour Based",
    description:
      "Hour-based utilization vs authorized (and prorated authorized where available) by client, service code/category, location/state and date range. CR export required: authorization utilization export with authorized hours, worked hours, prorated authorized hours (if available), service code/category, client, location/state, date range.",
    category: "authorizations",
    visibleTo: "all",
    type: "dashboard",
    owner: "Auth Team",
    lastUpdated: "On upload",
    popularity: 95,
    featured: true,
    aiInsight:
      "Hour-based utilization view — highlights over- and under-utilized authorizations before they impact revenue.",
    kpiPreviews: [
      { label: "Avg Util %", value: "Auto", trend: "up" },
      { label: "Over-util", value: "Auto", trend: "down" },
      { label: "Under-util", value: "Auto", trend: "down" },
    ],
    sparkline: [42, 48, 55, 60, 65, 68, 72, 76, 80],
    tags: ["Authorization", "Utilization", "Hours", "Featured"],
    drilldownPath: "/reports/qa-auth-utilization?view=hours",
  },
  {
    id: "parent-training",
    title: "Parent Training",
    description:
      "97156 parent training presence, hours, and gaps by client, provider and payor. CR export required: billing/service export filtered or parseable for 97156, including service date, client, provider, hours, payor, location/state.",
    category: "qa",
    visibleTo: "all",
    type: "dashboard",
    owner: "QA / Compliance",
    lastUpdated: "On upload",
    popularity: 94,
    featured: true,
    aiInsight:
      "Upload one CR billing export — instantly see 97156 parent training gaps by client.",
    kpiPreviews: [
      { label: "97156 hrs", value: "Auto", trend: "up" },
      { label: "PT gaps", value: "Auto", trend: "down" },
      { label: "Coverage %", value: "Auto", trend: "up" },
    ],
    sparkline: [40, 48, 52, 60, 58, 64, 70, 74, 78],
    tags: ["97156", "Parent Training", "Featured"],
    drilldownPath: "/reports/qa-supervision-pt?view=parent-training",
  },
  {
    id: "bcba-supervision",
    title: "BCBA Supervision",
    description:
      "97153 vs 97155 supervision ratios, below-threshold clients, and BCBA supervision load. CR export required: billing/service export with 97153 and 97155 rows, service date, client, provider/BCBA, hours, payor, location/state.",
    category: "qa",
    visibleTo: "all",
    type: "dashboard",
    owner: "QA / Compliance",
    lastUpdated: "On upload",
    popularity: 94,
    featured: true,
    aiInsight:
      "Upload one CR billing export — instantly see supervision % and clients below threshold.",
    kpiPreviews: [
      { label: "97153 hrs", value: "Auto", trend: "up" },
      { label: "97155 hrs", value: "Auto", trend: "up" },
      { label: "Supervision %", value: "Auto", trend: "up" },
    ],
    sparkline: [50, 55, 60, 64, 68, 72, 70, 74],
    tags: ["97153", "97155", "Supervision", "Featured"],
    drilldownPath: "/reports/qa-supervision-pt?view=supervision",
  },

  // Leadership
  { id: "exec-overview", title: "Executive Overview", description: "Company-wide KPIs, lead flow, and operating posture.", category: "leadership", visibleTo: ["super_admin", "executive_leadership", "operations_leadership"], type: "dashboard", owner: "Leadership", lastUpdated: "2h ago", popularity: 97, featured: true, aiInsight: "Net growth up +11 - fastest weekly gain since Feb.", kpiPreviews: [{ label: "Active Clients", value: "142", delta: "+8", trend: "up" }, { label: "Pipeline", value: "$182k", delta: "+$24k", trend: "up" }, { label: "Conversion", value: "34%", delta: "+4pt", trend: "up" }], sparkline: [22, 28, 26, 35, 41, 48, 52, 60, 58, 67, 72, 78], tags: ["KPI", "Growth"], detailView: "executive" },
  { id: "bcba-performance", title: "BCBA Performance", description: "Live billing, supervision, and revenue health from CMS session data.", category: "leadership", visibleTo: ["super_admin", "executive_leadership", "operations_leadership", "state_director", "billing_finance", "qa_team", "clinical_director", "behavioral_support"], type: "dashboard", owner: "Leadership", lastUpdated: "Live", popularity: 99, featured: true, aiInsight: "Drives Hours/Active Client efficiency and revenue leak detection.", kpiPreviews: [{ label: "Live data", value: "CMS", trend: "up" }, { label: "Drill-downs", value: "BCBA/Code", trend: "up" }], sparkline: [40, 48, 52, 58, 60, 65, 68, 72, 78, 82], tags: ["BCBA", "Billing", "Revenue"] },
  { id: "growth-trends", title: "Growth Trends", description: "Lead, client, and active growth across the last 6 months.", category: "leadership", visibleTo: ["super_admin", "executive_leadership", "operations_leadership"], type: "trend", owner: "Leadership", lastUpdated: "Yesterday", popularity: 71, aiInsight: "Q2 active-client growth pacing 18% above plan.", sparkline: [40, 44, 48, 55, 62, 68, 72, 78, 82, 86], tags: ["Trends"], detailView: "growth" },

  // Operations
  { id: "lifecycle", title: "Client Lifecycle", description: "Lead -> Start Date timing, conversion, and flake risk.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership", "clinical_director", "behavioral_support"], type: "dashboard", owner: "Operations", lastUpdated: "1h ago", popularity: 84, featured: true, aiInsight: "Lead->Start dropped 3 days week-over-week.", kpiPreviews: [{ label: "Lead->Start", value: "42d", delta: "-3d", trend: "up" }, { label: "Active %", value: "82%", delta: "+2pt", trend: "up" }], sparkline: [60, 58, 55, 52, 49, 47, 45, 44, 42], tags: ["Funnel"], detailView: "lifecycle" },
  { id: "intake-perf", title: "Intake Performance", description: "Contact rate, time-to-form, and coordinator productivity.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "intake_coordinator"], type: "dashboard", owner: "Intake", lastUpdated: "45m ago", popularity: 78, aiInsight: "Time-to-contact down 18% - best month on record.", kpiPreviews: [{ label: "Contact rate", value: "74%", delta: "+6pt", trend: "up" }, { label: "Time to contact", value: "2.4h", delta: "-18%", trend: "up" }], sparkline: [55, 58, 60, 62, 66, 70, 72, 74], tags: ["Intake", "Velocity"], detailView: "intake" },

  // QA
  { id: "qa-performance", title: "QA Performance", description: "QA turnaround, queue size, and revenue impact of delays.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "qa_team", "bcba", "clinical_director", "behavioral_support"], type: "dashboard", owner: "QA / Compliance", lastUpdated: "3h ago", popularity: 88, aiInsight: "QA turnaround 3.1d (-1d). Watch: 2 plans stuck >7 days.", kpiPreviews: [{ label: "Turnaround", value: "3.1d", delta: "-1d", trend: "up" }, { label: "Queue", value: "15", delta: "+2", trend: "down" }, { label: "Stuck >5d", value: "12%", delta: "-3pt", trend: "up" }], sparkline: [72, 68, 65, 60, 58, 54, 52, 50, 48], tags: ["QA", "Bottleneck"], detailView: "qa" },
  { id: "qa-supervision-pt", title: "Supervision & Parent Training", description: "Upload a CentralReach billing CSV to instantly review 97153 supervision ratios and 97156 parent training completion by client.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "qa_team", "bcba", "clinical_director", "behavioral_support"], type: "dashboard", owner: "QA / Compliance", lastUpdated: "On upload", popularity: 95, featured: true, aiInsight: "Upload one CR billing export - instantly see supervision % and 97156 gaps by client.", kpiPreviews: [{ label: "97153 hrs", value: "Auto", trend: "up" }, { label: "Supervision %", value: "Auto", trend: "up" }, { label: "97156 gaps", value: "Auto", trend: "down" }], sparkline: [40, 48, 52, 60, 58, 64, 70, 74, 78], tags: ["97153", "97155", "97156", "Supervision", "Parent Training"] },
  { id: "qa-auth-utilization", title: "Authorization Utilization", description: "Upload a CentralReach authorization export and instantly identify utilization risks, expiring auths, exhausted auths, and client authorization health.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "qa_team", "authorization_coordinator", "state_director", "clinical_director", "behavioral_support"], type: "dashboard", owner: "QA / Compliance", lastUpdated: "On upload", popularity: 94, featured: true, aiInsight: "Upload one CR auth export - instantly see utilization risks and expirations by client.", kpiPreviews: [{ label: "Avg Util %", value: "Auto", trend: "up" }, { label: "Exp <30d", value: "Auto", trend: "down" }, { label: "Over-util", value: "Auto", trend: "down" }], sparkline: [42, 48, 55, 60, 65, 68, 72, 76, 80], tags: ["Authorization", "Utilization", "Expiration", "Risk"] },
  { id: "qa-cancellation", title: "Session Cancellation Dashboard", description: "Upload a CentralReach Scheduling Cancellation export and instantly analyze cancellation trends, reasons, provider impacts and client attendance risks.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "qa_team", "state_director", "scheduling_team", "behavioral_support"], type: "dashboard", owner: "QA / Compliance", lastUpdated: "On upload", popularity: 93, featured: true, aiInsight: "Upload one CR cancellation export - instantly see top reasons, provider impact and at-risk clients.", kpiPreviews: [{ label: "Total cancels", value: "Auto", trend: "down" }, { label: "Provider %", value: "Auto", trend: "down" }, { label: "No shows", value: "Auto", trend: "down" }], sparkline: [60, 58, 62, 55, 50, 48, 52, 46, 42], tags: ["Cancellation", "Attendance", "No Show", "Scheduling"] },
  { id: "hr-payroll-command", title: "Payroll Command Center", description: "Upload payroll, billing, and employee-hour exports to instantly review payroll readiness, missing hours, BCBA minimums, exceptions, and state-level payroll risks.", category: "hr", visibleTo: ["super_admin", "hr_team"], type: "dashboard", owner: "HR Team", lastUpdated: "On upload", popularity: 96, featured: true, aiInsight: "Upload payroll & hours exports - instantly see who's ready, who's blocking payroll, and where to fix.", kpiPreviews: [{ label: "Readiness %", value: "Auto", trend: "up" }, { label: "Open issues", value: "Auto", trend: "down" }, { label: "BCBA <min", value: "Auto", trend: "down" }], sparkline: [55, 62, 68, 72, 75, 78, 82, 86, 90], tags: ["Payroll", "HR", "BCBA Minimums", "Exceptions"] },
  { id: "hr-recruiting-pipeline", title: "Recruiting Pipeline Dashboard", description: "Upload Apploi, Monday Recruiting, Orientation, Background Check or Staffing exports to instantly see the recruiting funnel, staffing needs, recruiter performance, source quality and hiring bottlenecks.", category: "hr", visibleTo: ["super_admin", "hr_team", "recruiting_team"], type: "dashboard", owner: "HR Team", lastUpdated: "On upload", popularity: 95, featured: true, aiInsight: "Upload recruiting exports - instantly see funnel, bottlenecks, recruiter performance and urgent staffing needs.", kpiPreviews: [{ label: "Applicants", value: "Auto", trend: "up" }, { label: "Offer accept", value: "Auto", trend: "up" }, { label: "Open needs", value: "Auto", trend: "down" }], sparkline: [40, 48, 55, 60, 64, 70, 74, 78, 82], tags: ["Recruiting", "Hiring", "Pipeline", "Staffing"] },
  { id: "hr-employee-compliance", title: "Employee Compliance Dashboard", description: "Upload Employee Master, Viventium, Monday Employee Board, Certification Tracker, Training Academy, I9 or Background Check exports to instantly review certifications, trainings, documentation, expirations, risks and audit readiness across all states.", category: "hr", visibleTo: ["super_admin", "hr_team"], type: "dashboard", owner: "HR Team", lastUpdated: "On upload", popularity: 94, featured: true, aiInsight: "Upload HR & certification exports - instantly see expirations, missing docs, training gaps and compliance risks.", kpiPreviews: [{ label: "Readiness %", value: "Auto", trend: "up" }, { label: "Expiring", value: "Auto", trend: "down" }, { label: "Holds", value: "Auto", trend: "down" }], sparkline: [50, 56, 62, 66, 70, 75, 80, 84, 88], tags: ["Compliance", "Certifications", "Training", "HR"] },
  { id: "hr-employee-onboarding", title: "Employee Onboarding Command Center", description: "Upload Apploi, Viventium, Monday Onboarding, Orientation, Background Check, Training Academy or Staffing exports to instantly track every new hire from offer to active employee - onboarding progress, bottlenecks, background, orientation, training, staffing readiness and activation.", category: "hr", visibleTo: ["super_admin", "hr_team", "recruiting_team"], type: "dashboard", owner: "HR Team", lastUpdated: "On upload", popularity: 95, featured: true, aiInsight: "Upload onboarding exports - instantly see who is onboarding, who is stuck, who is ready for staffing, and what blocks activation.", kpiPreviews: [{ label: "In progress", value: "Auto", trend: "up" }, { label: "Ready", value: "Auto", trend: "up" }, { label: "Delayed", value: "Auto", trend: "down" }], sparkline: [45, 52, 58, 64, 68, 72, 78, 82, 86], tags: ["Onboarding", "New Hire", "Activation", "HR"] },
  { id: "hr-bcba-productivity", title: "BCBA Productivity & Minimum Hours Dashboard", description: "Upload CR billing, service, payroll, caseload or earnings exports to instantly review BCBA productivity, minimum hours compliance, 97155 supervision, 97156 parent training, earnings, caseload, payroll risk and state-level performance.", category: "hr", visibleTo: ["super_admin", "hr_team", "payroll_coordinator", "operations_leadership"], type: "dashboard", owner: "HR Team", lastUpdated: "On upload", popularity: 96, featured: true, aiInsight: "Upload BCBA hours & billing exports - instantly see who's below minimum, who's at risk, top performers and payroll risk.", kpiPreviews: [{ label: "Meeting min", value: "Auto", trend: "up" }, { label: "Below min", value: "Auto", trend: "down" }, { label: "Avg score", value: "Auto", trend: "up" }], sparkline: [50, 58, 62, 68, 72, 76, 80, 84, 88], tags: ["BCBA", "Productivity", "Minimum Hours", "Payroll", "Supervision"] },
  
  { id: "bcba-productivity-report-v3", title: "BCBA Productivity Report V3", description: "One billing upload. Permanent BCBA Assignment History is the source of truth for ownership at DOS. Preserves both ClientId and normalized name matching, surfaces unassigned hours and dropped rows in a validation panel.", category: "clinical", visibleTo: ["super_admin", "executive_leadership", "operations_leadership", "state_director", "hr_team", "qa_team", "bcba", "behavioral_support", "clinical_director"], type: "dashboard", owner: "Operations", lastUpdated: "On upload", popularity: 95, featured: true, aiInsight: "Historical ownership. No auth uploads. No seeded data. Unassigned rows are visible, not silently dropped.", kpiPreviews: [{ label: "Total Hours", value: "Auto", trend: "up" }, { label: "97153 Hours", value: "Auto", trend: "up" }, { label: "Unassigned", value: "Auto", trend: "down" }], sparkline: [44, 52, 60, 66, 72, 78, 82, 86, 92], tags: ["BCBA", "Productivity", "Historical Ownership", "97153", "Featured", "V3"] },
  { id: "cancellation-command-center", title: "Cancellation Command Center", description: "Upload CR Scheduling, Billing and Authorization exports to instantly analyze cancellations, lost hours, lost revenue, BCBA / RBT / client impact and state-level utilization leakage.", category: "scheduling", visibleTo: "all", type: "dashboard", owner: "Operations", lastUpdated: "On upload", popularity: 99, featured: true, aiInsight: "Single source of truth for cancellation reporting, lost-hours analysis and revenue leakage.", kpiPreviews: [{ label: "Cancel %", value: "Auto", trend: "down" }, { label: "Lost hours", value: "Auto", trend: "down" }, { label: "Lost $", value: "Auto", trend: "down" }], sparkline: [60, 56, 58, 50, 48, 44, 42, 38, 36], tags: ["Cancellation", "Attendance", "Lost Revenue", "BCBA", "Scheduling", "Featured"] },
  // Executive Leadership Pass 4: explicit catalog entries so hidden runtime
  // routes /reports/bcba-productivity-report and /reports/progress-reports can
  // be wrapped with ReportRoleGuard instead of being silently unguarded.
  { id: "bcba-productivity-report", title: "BCBA Productivity Report", description: "Legacy BCBA productivity report - available to all authenticated users for now (business rule).", category: "clinical", visibleTo: "all", type: "dashboard", owner: "Operations", lastUpdated: "On upload", popularity: 90, aiInsight: "Kept broadly available while V3 becomes the source of truth.", sparkline: [40, 48, 54, 60, 66, 72, 78, 82], tags: ["BCBA", "Productivity", "Legacy"] },
  { id: "progress-reports", title: "Progress Reports", description: "QA / clinical leadership progress report tracking.", category: "qa", visibleTo: ["super_admin", "qa_team", "qa_director", "qa_specialist", "clinical_director", "bcba", "behavioral_support", "operations_leadership", "executive_leadership", "state_director", "assistant_state_director"], type: "table", owner: "QA / Compliance", lastUpdated: "Live", popularity: 78, aiInsight: "Tracks in-progress QA reports across BCBA authors.", sparkline: [30, 34, 40, 44, 50, 56, 62, 68], tags: ["QA", "Progress"] },
  { id: "qa-supervision", title: "Supervision Compliance", description: "BCBA supervision hours by client and credentialing status.", category: "qa", visibleTo: ["super_admin", "qa_team", "bcba", "operations_leadership", "clinical_director", "behavioral_support"], type: "summary", owner: "QA / Compliance", lastUpdated: "Today", popularity: 81, aiInsight: "4 clients under supervision threshold this week.", sparkline: [50, 55, 60, 64, 68, 72, 70, 74], tags: ["Compliance"] },
  { id: "qa-parent-training", title: "Parent Training 97156", description: "Authorized vs delivered parent training hours.", category: "qa", visibleTo: ["super_admin", "qa_team", "bcba", "clinical_director", "behavioral_support"], type: "table", owner: "QA / Compliance", lastUpdated: "Today", popularity: 64, aiInsight: "Utilization improved to 78% (+9pt vs March).", sparkline: [40, 48, 52, 58, 60, 65, 68, 72, 78], tags: ["97156"] },

  // Authorizations
  { id: "auth-performance", title: "Authorization Performance", description: "Submit time, approval rate, and denial patterns.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director"], type: "dashboard", owner: "Auth Team", lastUpdated: "30m ago", popularity: 91, featured: true, aiInsight: "United denials trending up (23%). Recommend payor escalation.", kpiPreviews: [{ label: "Approval", value: "87%", delta: "+3pt", trend: "up" }, { label: "Time to submit", value: "4.2d", delta: "-0.8d", trend: "up" }, { label: "Pending", value: "27", delta: "+4", trend: "down" }], sparkline: [60, 64, 68, 70, 74, 78, 82, 85, 87], tags: ["Auth", "Payor"], detailView: "auth" },
  { id: "auth-expiring", title: "Expiring Authorizations", description: "Auths expiring in the next 30 / 60 / 90 days.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership"], type: "table", owner: "Auth Team", lastUpdated: "1h ago", popularity: 76, aiInsight: "9 auths expiring inside 30 days - start reauth now.", sparkline: [20, 22, 26, 28, 30, 32, 30, 32], tags: ["Expiring"] },
  { id: "auth-utilization", title: "Authorization Utilization", description: "Authorized vs delivered hours by client and payor.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "billing_finance", "bcba", "clinical_director", "behavioral_support"], type: "dashboard", owner: "Auth Team", lastUpdated: "Today", popularity: 82, aiInsight: "Utilization risk: 7 clients below 60% delivered.", sparkline: [55, 58, 62, 64, 66, 68, 70, 72], tags: ["Utilization"] },

  /* ---------- Authorization - Operational Reporting Layer ---------- */
  { id: "auth-expiration-risk", title: "Authorization Expiration Risk", description: "Proactive view of auths approaching expiration, PR readiness, and continuation risk.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director", "qa_team", "executive_leadership"], type: "dashboard", owner: "Auth Team", lastUpdated: "Live", popularity: 96, aiInsight: "Operational priority - surfaces expirations before they become reauth failures.", kpiPreviews: [{ label: "<14 days", value: "-", trend: "down" }, { label: "<30 days", value: "-", trend: "down" }], sparkline: [30, 34, 38, 42, 46, 50, 55, 60], tags: ["Expiration", "Risk", "Reauth"], drilldownPath: "/authorizations?view=expiring" },
  { id: "auth-workflow-bottleneck", title: "Authorization Workflow Bottlenecks", description: "Where authorization work is getting stuck - QA, submission, missing docs, denials, reassessment.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director", "qa_team"], type: "dashboard", owner: "Auth Team", lastUpdated: "Live", popularity: 93, aiInsight: "Operational flow intelligence - identifies stalls before they become escalations.", kpiPreviews: [{ label: "Stalled", value: "-", trend: "down" }, { label: "Avg age", value: "-", trend: "neutral" }], sparkline: [45, 48, 52, 50, 54, 58, 60, 56], tags: ["Bottleneck", "Workflow"], drilldownPath: "/authorizations?view=qa" },
  { id: "auth-operational-performance", title: "Authorization Operational Performance", description: "Workflow health, turnaround, escalation effectiveness, and continuation stability for leadership.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director", "executive_leadership"], type: "trend", owner: "Auth Team", lastUpdated: "Live", popularity: 90, featured: true, aiInsight: "Leadership view - operational health, not financial reporting.", kpiPreviews: [{ label: "Approval", value: "-", trend: "up" }, { label: "Turnaround", value: "-", trend: "up" }], sparkline: [60, 64, 68, 70, 74, 78, 82, 85], tags: ["Performance", "Leadership"], drilldownPath: "/authorizations?view=all" },
  { id: "auth-denials-rework", title: "Denials & Rework", description: "Denial volume by payer, reason code, and rework turnaround.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director"], type: "table", owner: "Auth Team", lastUpdated: "Live", popularity: 84, aiInsight: "Denials feed into the activity audit log automatically.", sparkline: [10, 12, 14, 13, 16, 18, 17, 19], tags: ["Denials", "Rework"] },
  { id: "auth-missing-documentation", title: "Missing Documentation", description: "Open documentation gaps blocking submission or reauth.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director", "qa_team"], type: "table", owner: "Auth Team", lastUpdated: "Live", popularity: 87, aiInsight: "Doc resolution events surface here as they are logged.", sparkline: [22, 24, 26, 28, 30, 28, 27, 25], tags: ["Documentation", "Blockers"] },
  { id: "auth-payer-requirement-risk", title: "Payer Requirement Risk", description: "Payer-specific requirement changes and at-risk submissions.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "executive_leadership"], type: "dashboard", owner: "Auth Team", lastUpdated: "Live", popularity: 80, aiInsight: "Cross-references payer_requirements with active authorizations.", sparkline: [30, 32, 34, 36, 38, 36, 40, 42], tags: ["Payer", "Risk"] },

  /* ---------- Credentialing - Operational Reporting ---------- */
  { id: "cred-status", title: "Credentialing Status", description: "Live snapshot of every provider/payer credentialing record by status, state, and follow-up cadence.", category: "credentialing", visibleTo: ["super_admin", "credentialing_team", "credentialing_lead", "operations_leadership", "executive_leadership"], type: "dashboard", owner: "Credentialing", lastUpdated: "Live", popularity: 88, aiInsight: "Setup ready - data populated as credentialing records are entered.", sparkline: [40, 44, 50, 54, 58, 62, 68, 72], tags: ["Credentialing", "Status"], drilldownPath: "/credentialing?from=reports&report=cred-status" },
  { id: "cred-bcba-coverage", title: "BCBA Credential Coverage", description: "BCBA coverage by payer and state - where can each BCBA bill today?", category: "credentialing", visibleTo: ["super_admin", "credentialing_team", "credentialing_lead", "operations_leadership", "executive_leadership"], type: "summary", owner: "Credentialing", lastUpdated: "Live", popularity: 84, aiInsight: "Surfaces BCBAs without payer coverage as soon as records exist.", sparkline: [50, 54, 58, 62, 66, 70, 74, 78], tags: ["BCBA", "Coverage"], drilldownPath: "/credentialing/bcba?from=reports&report=cred-bcba-coverage" },
  { id: "cred-uncredentialed-bcbas", title: "Uncredentialed BCBAs", description: "BCBAs missing payer credentialing or actively blocked - the daily working list.", category: "credentialing", visibleTo: ["super_admin", "credentialing_team", "credentialing_lead", "operations_leadership", "executive_leadership"], type: "table", owner: "Credentialing", lastUpdated: "Live", popularity: 90, aiInsight: "Drives the Uncredentialed BCBAs workspace.", sparkline: [30, 32, 28, 26, 24, 22, 20, 18], tags: ["Risk", "BCBA"], drilldownPath: "/credentialing/uncredentialed-bcbas?from=reports&report=cred-uncredentialed-bcbas" },
  { id: "cred-expiring", title: "Expiring Credentials", description: "Credentials expiring within 30/60/90 days and the renewal owners.", category: "credentialing", visibleTo: ["super_admin", "credentialing_team", "credentialing_lead", "operations_leadership", "executive_leadership"], type: "table", owner: "Credentialing", lastUpdated: "Live", popularity: 87, aiInsight: "Sub-15 day expirations are flagged as critical in the workspace.", sparkline: [10, 12, 14, 16, 18, 20, 22, 24], tags: ["Expiring", "Renewal"], drilldownPath: "/credentialing/expiring?from=reports&report=cred-expiring" },
  { id: "cred-payer-matrix", title: "Payer Credentialing Matrix", description: "Payer x state matrix: credentialed, pending, blocked, expiring - growth and risk in one view.", category: "credentialing", visibleTo: ["super_admin", "credentialing_team", "credentialing_lead", "operations_leadership", "executive_leadership"], type: "dashboard", owner: "Credentialing", lastUpdated: "Live", popularity: 82, aiInsight: "Identify payers blocking growth or authorizations.", sparkline: [40, 44, 48, 52, 56, 60, 64, 68], tags: ["Payer", "Matrix"], drilldownPath: "/credentialing/insurance?from=reports&report=cred-payer-matrix" },

  // Scheduling
  { id: "scheduling-perf", title: "Scheduling & Staffing", description: "Time-to-schedule, fill rate, and capacity gaps by state.", category: "scheduling", visibleTo: ["super_admin", "scheduling_team", "state_director", "operations_leadership"], type: "dashboard", owner: "Scheduling", lastUpdated: "2h ago", popularity: 79, featured: true, aiInsight: "Georgia capacity gap widened to 62 hrs - recruit lever.", kpiPreviews: [{ label: "Fill rate", value: "78%", delta: "+5pt", trend: "up" }, { label: "Time to schedule", value: "2.6d", delta: "-0.4d", trend: "up" }], sparkline: [55, 60, 64, 68, 70, 74, 76, 78], tags: ["Capacity"], detailView: "scheduling" },
  { id: "session-completion", title: "Session Completion", description: "Cancellations, no-shows, and delivered hours.", category: "scheduling", visibleTo: ["super_admin", "scheduling_team", "state_director", "bcba"], type: "trend", owner: "Scheduling", lastUpdated: "Today", popularity: 68, aiInsight: "Cancellation rate steady at 8% - within tolerance.", sparkline: [78, 80, 82, 81, 83, 85, 84, 86], tags: ["Sessions"] },

  // Recruiting
  { id: "recruiting-pipeline", title: "Recruiting Pipeline", description: "Applicants, time-to-hire, and source quality.", category: "recruiting", visibleTo: ["super_admin", "recruiting_team", "hr_team", "state_director"], type: "dashboard", owner: "Recruiting", lastUpdated: "1h ago", popularity: 72, aiInsight: "Indeed source: 2x conversion vs ZipRecruiter.", sparkline: [40, 44, 48, 52, 55, 58, 60, 64], tags: ["Hiring"] },

  // Financial
  { id: "revenue-pipeline", title: "Revenue Pipeline", description: "Projected starts and weighted pipeline value.", category: "financial", visibleTo: ["super_admin", "executive_leadership", "billing_finance", "operations_leadership"], type: "dashboard", owner: "Finance", lastUpdated: "Today", popularity: 86, featured: true, aiInsight: "$182k pipeline - $76k weighted to start in 4 weeks.", kpiPreviews: [{ label: "Pipeline", value: "$182k", delta: "+$24k", trend: "up" }, { label: "4-wk starts", value: "25", delta: "+6", trend: "up" }], sparkline: [50, 56, 62, 66, 70, 74, 78, 82], tags: ["Revenue"], detailView: "revenue" },
  { id: "claims-aging", title: "Claims & AR Aging", description: "Outstanding claims and aging buckets.", category: "financial", visibleTo: ["super_admin", "billing_finance"], type: "table", owner: "Finance", lastUpdated: "Today", popularity: 58, aiInsight: "AR > 60d up 4% - Aetna primary contributor.", sparkline: [30, 34, 36, 38, 40, 42, 44], tags: ["Billing"] },

  // Clinical
  { id: "caseload", title: "BCBA Caseload", description: "Active caseload, hours, and supervision balance.", category: "clinical", visibleTo: ["super_admin", "bcba", "operations_leadership", "qa_team", "clinical_director", "behavioral_support"], type: "dashboard", owner: "Clinical", lastUpdated: "Today", popularity: 74, aiInsight: "2 BCBAs over recommended caseload ceiling.", sparkline: [45, 48, 50, 52, 55, 56, 58, 60], tags: ["Caseload"] },
  { id: "progress-trends", title: "Progress Trends", description: "Client outcome trajectories across goal domains.", category: "clinical", visibleTo: ["super_admin", "bcba", "operations_leadership", "clinical_director", "behavioral_support"], type: "trend", owner: "Clinical", lastUpdated: "Yesterday", popularity: 62, aiInsight: "Mastered goals +14% vs prior quarter.", sparkline: [50, 54, 58, 62, 64, 68, 70, 74], tags: ["Outcomes"] },

  // Team
  { id: "team-performance", title: "Team Performance", description: "Individual productivity and quality across departments.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership"], type: "table", owner: "Operations", lastUpdated: "Today", popularity: 70, aiInsight: "Maria K. conversion trending down - coaching opportunity.", sparkline: [55, 58, 60, 62, 64, 66, 65, 67], tags: ["People"], detailView: "team" },

  // State
  { id: "state-performance", title: "State Performance", description: "Cross-state benchmarks: leads, conversion, capacity, revenue.", category: "state", visibleTo: ["super_admin", "executive_leadership", "operations_leadership"], type: "dashboard", owner: "Leadership", lastUpdated: "1h ago", popularity: 80, aiInsight: "GA leads the network in conversion; TX leads in capacity.", sparkline: [50, 56, 60, 64, 68, 72, 74, 78], tags: ["Geo"] },

  /* ---------- State Director - Operational Intelligence ---------- */
  { id: "sd-state-performance", title: "State Performance", description: "Operational heartbeat: active clients, service hours, retention, growth.", category: "state", visibleTo: ["super_admin", "executive_leadership", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 99, featured: true, aiInsight: "Hours/active client trending up - operations efficiency improving.", kpiPreviews: [{ label: "Active", value: "83", delta: "+6", trend: "up" }, { label: "Hrs/Wk", value: "1,284", delta: "+4.2%", trend: "up" }], sparkline: [60, 64, 68, 72, 75, 78, 82, 86, 88, 90], tags: ["State", "Heartbeat"] },
  { id: "sd-staffing-health", title: "Staffing Health", description: "Where are we understaffed or overloaded - by BCBA, region, and urgency.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 97, featured: true, aiInsight: "Charlotte short 1 BCBA - projected starts will slip 7 days.", kpiPreviews: [{ label: "Unstaffed", value: "3", trend: "down" }, { label: "Overloaded", value: "1", trend: "neutral" }], sparkline: [70, 68, 66, 64, 65, 62, 60, 58], tags: ["Staffing", "Mission Control"] },
  { id: "sd-bcba-performance", title: "BCBA Performance", description: "Supervision, PRs, caseload, hours, retention - operational, not punitive.", category: "clinical", visibleTo: ["super_admin", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 94, featured: true, aiInsight: "3 PRs overdue > 7 days across the state.", kpiPreviews: [{ label: "Supervision", value: "84%", delta: "+2pt", trend: "up" }, { label: "PR Done", value: "91%", delta: "-2pt", trend: "down" }], sparkline: [78, 80, 82, 84, 85, 86, 87, 88], tags: ["BCBA"] },
  { id: "sd-auth-pr-risk", title: "Auth / PR Risk", description: "Expiring auths, overdue PRs, missing supervision and 97156 - actionable.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 92, featured: true, aiInsight: "2 Anthem auths expire inside 10 days - start packets today.", kpiPreviews: [{ label: "Auths <30d", value: "9", trend: "down" }, { label: "Overdue PRs", value: "6", trend: "down" }], sparkline: [40, 42, 46, 48, 52, 55, 60, 64], tags: ["Risk", "Compliance"] },
  { id: "sd-recruiting", title: "Recruiting Pipeline", description: "Can we support growth? Applicants, interviews, onboarding, credentialing.", category: "recruiting", visibleTo: ["super_admin", "operations_leadership", "state_director", "recruiting_team"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 88, aiInsight: "BCBA pipeline can cover next 30 days of starts.", kpiPreviews: [{ label: "Applicants", value: "62", delta: "+8", trend: "up" }, { label: "Onboarding", value: "12", trend: "neutral" }], sparkline: [40, 44, 48, 52, 56, 60, 62, 64], tags: ["Growth", "Hiring"] },
  { id: "sd-growth", title: "Client Growth", description: "New, discharged, flaked, waitlist, hours - growth over time.", category: "state", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership"], type: "trend", owner: "State Director", lastUpdated: "Live", popularity: 86, aiInsight: "Richmond region driving 60% of new starts this month.", kpiPreviews: [{ label: "New MTD", value: "14", delta: "+3", trend: "up" }, { label: "Net", value: "+9", trend: "up" }], sparkline: [50, 56, 62, 66, 70, 74, 78, 82], tags: ["Growth"] },
  { id: "sd-scheduling", title: "Scheduling Health", description: "Completion, cancellations, no-shows, uncovered sessions, fill rate.", category: "scheduling", visibleTo: ["super_admin", "operations_leadership", "state_director", "scheduling_team"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 84, aiInsight: "Tuesday afternoons in Richmond - 6 uncovered sessions pattern.", kpiPreviews: [{ label: "Completion", value: "92%", trend: "up" }, { label: "Fill Rate", value: "88%", trend: "up" }], sparkline: [78, 80, 82, 84, 85, 86, 88], tags: ["Sessions"] },
  { id: "sd-parent-training", title: "Parent Training 97156", description: "Which clients are missing parent training, by BCBA and month.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "state_director", "qa_team", "bcba", "clinical_director"], type: "summary", owner: "State Director", lastUpdated: "Live", popularity: 82, aiInsight: "Utilization up 6 points - coaching impact visible.", kpiPreviews: [{ label: "Utilization", value: "77%", delta: "+6pt", trend: "up" }], sparkline: [55, 60, 62, 66, 70, 72, 74, 77], tags: ["97156", "Compliance"] },
  { id: "sd-supervision", title: "Supervision Report", description: "97153 vs 97155 hours, % supervision, below-target clients, BCBA load.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "state_director", "qa_team", "bcba", "clinical_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 80, aiInsight: "6 clients below the 10% supervision threshold this period.", kpiPreviews: [{ label: "Avg %", value: "11.6%", delta: "+0.4pt", trend: "up" }], sparkline: [62, 64, 66, 68, 70, 72, 74], tags: ["Supervision"] },
  { id: "sd-bottlenecks", title: "Operational Bottlenecks", description: "Where workflows are stuck: intake, auth, onboarding, recruiting, staffing, QA.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 78, aiInsight: "Staffing is the #1 bottleneck - 8 clients waiting.", sparkline: [40, 42, 46, 48, 52, 55, 60], tags: ["Friction"] },
  { id: "sd-state-comparison", title: "State Comparison", description: "How your state ranks across growth, retention, cancellations, recruiting.", category: "state", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 75, aiInsight: "VA leads the network in hours-per-client efficiency.", sparkline: [60, 62, 64, 66, 68, 70, 72], tags: ["Benchmark"] },
  { id: "sd-action-report", title: "Operational Action Report", description: "What actually needs action - overdue, urgent, escalations, unresolved.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director"], type: "dashboard", owner: "State Director", lastUpdated: "Live", popularity: 90, aiInsight: "5 critical items unresolved - staffing dominant theme.", kpiPreviews: [{ label: "Critical", value: "5", trend: "down" }, { label: "Resolved", value: "12", delta: "+4", trend: "up" }], sparkline: [30, 34, 38, 44, 48, 52, 58, 60], tags: ["Action", "Execution"] },

  /* ---------- Business Development - Growth Reports ---------- */
  { id: "bd-referral-sources", title: "Referral Sources", description: "Referral partner activity, volume, and conversion by source.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead", "executive_leadership"], type: "dashboard", owner: "Business Development", lastUpdated: "Live", popularity: 90, aiInsight: "Live from referral_companies and outreach events.", sparkline: [30, 34, 40, 44, 50, 56, 60, 66], tags: ["Referrals", "Sources"], drilldownPath: "/business-development?tab=partners" },
  { id: "bd-outreach-followup", title: "Outreach Follow-Up", description: "Open referral partner follow-ups and recent outreach activity.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "table", owner: "Business Development", lastUpdated: "Live", popularity: 88, aiInsight: "Overdue follow-ups appear here as tasks age.", sparkline: [22, 24, 26, 28, 32, 34, 36, 40], tags: ["Follow-Up", "Outreach"], drilldownPath: "/business-development?tab=outreach" },
  { id: "bd-partner-activity", title: "Partner Activity", description: "Every referral partner with last-contact recency and pipeline stage.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "table", owner: "Business Development", lastUpdated: "Live", popularity: 86, aiInsight: "Sort by last activity to prioritize outreach.", sparkline: [50, 54, 58, 60, 64, 68, 72, 76], tags: ["Partners"], drilldownPath: "/business-development?tab=partners" },
  { id: "bd-follow-up-risk", title: "Partner Follow-Up Risk", description: "Stale partners, overdue follow-ups, and warm partners without a next step.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "table", owner: "Business Development", lastUpdated: "Live", popularity: 84, aiInsight: "Anything past due surfaces on the Tasks tab.", sparkline: [40, 42, 44, 48, 52, 56, 60, 64], tags: ["Risk", "Follow-Up"], drilldownPath: "/business-development?tab=tasks" },
  { id: "bd-source-handoff", title: "Source Handoff Performance", description: "Lead source signals ready for BD outreach by source, channel, and state.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "dashboard", owner: "Business Development", lastUpdated: "Live", popularity: 82, aiInsight: "Reads live marketing_sources + marketing_source_events.", sparkline: [30, 34, 38, 42, 48, 52, 58, 64], tags: ["Handoff", "Sources"], drilldownPath: "/business-development?tab=sources" },
  { id: "bd-provider-relationships", title: "Provider Relationship Activity", description: "Pediatric offices, therapy practices, and health systems referring families.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "table", owner: "Business Development", lastUpdated: "Live", popularity: 78, aiInsight: "Filtered to provider-typed referral partners.", sparkline: [20, 24, 28, 32, 36, 40, 44, 48], tags: ["Providers"], drilldownPath: "/business-development?tab=providers" },
  { id: "bd-community-relationships", title: "Community Relationship Activity", description: "Schools, autism organizations, and community partners you engage with.", category: "business_development", visibleTo: ["super_admin", "business_development", "marketing_growth_lead"], type: "table", owner: "Business Development", lastUpdated: "Live", popularity: 76, aiInsight: "Filtered to community-typed referral partners.", sparkline: [18, 22, 26, 28, 32, 36, 40, 44], tags: ["Community"], drilldownPath: "/business-development?tab=community" },

  /* ---------- RBT - My personal reports ---------- */
  { id: "rbt-training-progress", title: "My Training Progress", description: "Your RBT Training Academy progress, phase completion, and next required module.", category: "training", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership"], type: "dashboard", owner: "RBT", lastUpdated: "Live", popularity: 90, aiInsight: "Progress is read from your Academy enrollment and module completion.", sparkline: [10, 20, 30, 45, 60, 70, 78, 84], tags: ["RBT", "Training"], drilldownPath: "/rbt/training-academy" },
  { id: "rbt-readiness-status", title: "My Readiness Status", description: "Your current readiness gates - signoffs, competency assessment, and blockers.", category: "training", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership"], type: "summary", owner: "RBT", lastUpdated: "Live", popularity: 88, aiInsight: "Reflects live signoffs from Lead RBT, BCBA, Training Admin, Documentation Reviewer.", sparkline: [30, 40, 50, 55, 60, 68, 72, 78], tags: ["RBT", "Readiness"], drilldownPath: "/rbt/readiness" },
  { id: "rbt-sessions-attendance", title: "My Sessions & Attendance", description: "Your delivered sessions, cancellations, and attendance streak.", category: "scheduling", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership"], type: "trend", owner: "RBT", lastUpdated: "Live", popularity: 86, aiInsight: "Pulled from rbt_sessions and CentralReach scheduling data.", sparkline: [70, 74, 78, 80, 82, 84, 86, 88], tags: ["RBT", "Sessions", "Attendance"], drilldownPath: "/rbt/schedule" },
  { id: "rbt-my-supervision", title: "My Supervision", description: "Recent supervision, feedback, and 97155 coverage from your BCBA.", category: "clinical", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership", "bcba"], type: "summary", owner: "RBT", lastUpdated: "Live", popularity: 80, aiInsight: "Reads supervision logs and coaching notes for your record.", sparkline: [40, 46, 52, 58, 62, 68, 72, 76], tags: ["RBT", "Supervision"], drilldownPath: "/rbt/supervision" },
  { id: "rbt-help-requests", title: "My Help Requests", description: "Open and resolved help requests you've raised from the field.", category: "operations", visibleTo: ["rbt", "super_admin", "operations_leadership"], type: "table", owner: "RBT", lastUpdated: "Live", popularity: 74, aiInsight: "Time-to-resolution surfaces bottlenecks in field support.", sparkline: [20, 24, 22, 28, 32, 34, 30, 28], tags: ["RBT", "Help"], drilldownPath: "/rbt/help" },
  { id: "rbt-resource-completion", title: "My Resource Completion", description: "Which SOPs, guides, and quick references you've viewed and completed.", category: "training", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership"], type: "table", owner: "RBT", lastUpdated: "Live", popularity: 70, aiInsight: "Backed by public.rbt_resource_prefs - persisted per user.", sparkline: [30, 36, 42, 48, 54, 60, 66, 72], tags: ["RBT", "Resources"], drilldownPath: "/rbt/resources" },
  { id: "rbt-centralreach-sync", title: "My CentralReach Sync Status", description: "Whether your sessions, supervision, and notes have synced to CentralReach.", category: "operations", visibleTo: ["rbt", "super_admin", "operations_leadership", "executive_leadership"], type: "summary", owner: "RBT", lastUpdated: "Live", popularity: 68, aiInsight: "Pending items flag before they hold up payroll.", sparkline: [60, 66, 72, 76, 80, 84, 88, 92], tags: ["RBT", "CentralReach", "Sync"], drilldownPath: "/rbt/my-day" },
];

export function visibleReportsForRole(role: OSRole): ReportDef[] {
  // Reports consolidation: the /reports surface intentionally shows the
  // same six approved report cards to every Blossom OS user. All other
  // catalog entries remain in REPORTS for cross-linking, drilldowns, and
  // legacy compatibility but are hidden from the Reports page and gated
  // out of direct /reports/<id> URLs via ReportRoleGuard.
  void role;
  const APPROVED_IDS = [
    "bcba-productivity-report-v3",
    "cancellation-command-center",
    "authorization-analysis",
    "authorization-utilization-hour-based",
    "parent-training",
    "bcba-supervision",
  ];
  return APPROVED_IDS
    .map((id) => REPORTS.find((r) => r.id === id))
    .filter((r): r is ReportDef => Boolean(r));
}

export function visibleCategoriesForRole(role: OSRole): (ReportCategoryDef & { count: number; mostViewed?: ReportDef })[] {
  const reports = visibleReportsForRole(role);
  return REPORT_CATEGORIES
    .map(cat => {
      const inCat = reports.filter(r => r.category === cat.id).sort((a, b) => b.popularity - a.popularity);
      return { ...cat, count: inCat.length, mostViewed: inCat[0] };
    })
    .filter(c => c.count > 0);
}

/**
 * Pass 3: State Director / Assistant State Director scoped reports view.
 * Returns the reports that are visible for the role AND annotates each with
 * the active state code so downstream UI can show "GA · State-scoped" style
 * badging without duplicating catalog entries per state.
 */
export interface StateScopedReport extends ReportDef {
  stateScope: string;
}

export function stateScopedReportsForDirector(role: OSRole, stateCode: string): StateScopedReport[] {
  return visibleReportsForRole(role).map((r) => ({ ...r, stateScope: stateCode }));
}

export interface RoleAISummary {
  headline: string;
  insights: { icon: LucideIcon; text: string; tone: "violet" | "emerald" | "amber" | "rose" | "sky" }[];
}

export const ROLE_AI_SUMMARY: Partial<Record<OSRole, RoleAISummary>> = {
  super_admin:           { headline: "Network in healthy posture. 3 operational risks worth your attention this week.", insights: [
    { icon: TrendingUp, text: "Active client growth pacing 18% above plan.", tone: "emerald" },
    { icon: AlertTriangle, text: "GA capacity gap widened to 62 hours.", tone: "amber" },
    { icon: Brain, text: "QA turnaround down 1 day - revenue recognition improves.", tone: "violet" },
  ]},
  executive_leadership:  { headline: "Strong growth quarter - financial pipeline strengthening, watch GA capacity.", insights: [
    { icon: TrendingUp, text: "Revenue pipeline up $24k week-over-week.", tone: "emerald" },
    { icon: Target, text: "Conversion at 34% - best in 6 months.", tone: "violet" },
    { icon: AlertTriangle, text: "United denial rate climbing - payor strategy review.", tone: "amber" },
  ]},
  operations_leadership: { headline: "Throughput improving across intake and QA. One staffing bottleneck remains.", insights: [
    { icon: Activity, text: "Lead -> Start time dropped 3 days.", tone: "emerald" },
    { icon: AlertTriangle, text: "11 clients stuck in Staffing Needed > 5 days.", tone: "amber" },
    { icon: ShieldCheck, text: "Supervision compliance back above target.", tone: "emerald" },
  ]},
  state_director:        { headline: "Operational intelligence - your state at a glance. Staffing needs your attention this week.", insights: [
    { icon: MapPin, text: "Hours/active client trending up - operational efficiency improving.", tone: "emerald" },
    { icon: AlertTriangle, text: "5 critical actions unresolved - staffing is the dominant theme.", tone: "rose" },
    { icon: TrendingUp, text: "BCBA pipeline can cover next 30 days of projected starts.", tone: "violet" },
  ]},
  intake_coordinator:    { headline: "Best month on record for time-to-contact. Keep the momentum.", insights: [
    { icon: TrendingUp, text: "Contact rate 74% - up 6 points.", tone: "emerald" },
    { icon: Sparkles, text: "Form completion +2pt to 57%.", tone: "violet" },
    { icon: AlertTriangle, text: "7 leads still uncontacted past 24h.", tone: "amber" },
  ]},
  authorization_coordinator: { headline: "Approval rate at 87%. United payor trending negative - escalate.", insights: [
    { icon: ShieldCheck, text: "Approval rate at 87% (+3pt).", tone: "emerald" },
    { icon: AlertTriangle, text: "United denials at 23% - outlier.", tone: "rose" },
    { icon: CalendarDays, text: "9 auths expire within 30 days.", tone: "amber" },
  ]},
  scheduling_team:       { headline: "Fill rate climbing. Watch capacity gap in Georgia.", insights: [
    { icon: TrendingUp, text: "Fill rate at 78% - up 5 points.", tone: "emerald" },
    { icon: AlertTriangle, text: "GA: 62 hour capacity gap this week.", tone: "amber" },
    { icon: CalendarDays, text: "2.6 day time-to-schedule - best ever.", tone: "violet" },
  ]},
  recruiting_team:       { headline: "Indeed converting 2x ZipRecruiter - rebalance spend.", insights: [
    { icon: TrendingUp, text: "Time-to-hire down to 14 days.", tone: "emerald" },
    { icon: Sparkles, text: "Indeed: 2x conversion vs ZipRecruiter.", tone: "violet" },
    { icon: AlertTriangle, text: "Charlotte open req sitting > 30 days.", tone: "amber" },
  ]},
  hr_team:               { headline: "Onboarding pipeline strong. 4 new hires complete week-one this week.", insights: [
    { icon: Users, text: "4 new hires graduating week-one.", tone: "emerald" },
    { icon: ShieldCheck, text: "Credentialing turnaround steady at 8 days.", tone: "violet" },
    { icon: AlertTriangle, text: "2 BBA renewals due in 14 days.", tone: "amber" },
  ]},
  billing_finance:       { headline: "AR aging widened slightly. Aetna primary contributor.", insights: [
    { icon: DollarSign, text: "Cash collections +6% MoM.", tone: "emerald" },
    { icon: AlertTriangle, text: "AR > 60d up 4% - Aetna driver.", tone: "amber" },
    { icon: TrendingUp, text: "Claim acceptance rate at 96%.", tone: "violet" },
  ]},
  qa_team:               { headline: "QA turnaround at 3.1d - best of quarter. Parent training compliance climbing.", insights: [
    { icon: ShieldCheck, text: "QA turnaround -1 day to 3.1d.", tone: "emerald" },
    { icon: TrendingUp, text: "Parent training 97156 utilization 78%.", tone: "violet" },
    { icon: AlertTriangle, text: "2 plans stuck in QA > 7 days.", tone: "amber" },
  ]},
  payroll_coordinator:   { headline: "Run on schedule. 2 timesheet exceptions to resolve.", insights: [
    { icon: Wallet, text: "Payroll run ready for Thursday.", tone: "emerald" },
    { icon: AlertTriangle, text: "2 timesheets missing approval.", tone: "amber" },
    { icon: ShieldCheck, text: "Compliance clean across all states.", tone: "violet" },
  ]},
  bcba:                  { headline: "Caseload stable. 2 progress reports due this week.", insights: [
    { icon: HeartPulse, text: "Mastered goals +14% vs prior quarter.", tone: "emerald" },
    { icon: ClipboardCheck, text: "2 progress reports due this week.", tone: "amber" },
    { icon: ShieldCheck, text: "Supervision hours on track for all clients.", tone: "violet" },
  ]},
  rbt:                   { headline: "Sessions on pace. Keep notes within 24h to stay green.", insights: [
    { icon: CalendarDays, text: "32 sessions scheduled this week.", tone: "sky" },
    { icon: ShieldCheck, text: "Note compliance at 98%.", tone: "emerald" },
    { icon: AlertTriangle, text: "1 session note pending > 24h.", tone: "amber" },
  ]},
  marketing_team:        { headline: "Growth trending up across organic and recruiting funnels.", insights: [
    { icon: TrendingUp, text: "Lead volume +14% week-over-week.", tone: "emerald" },
    { icon: Sparkles, text: "Google Ads CAC down 12% - scale leader.", tone: "violet" },
    { icon: AlertTriangle, text: "GA local SEO ranking slipped on 4 terms.", tone: "amber" },
  ]},
  case_manager:          { headline: "Family relationships calm. A few follow-ups need a gentle touch this week.", insights: [
    { icon: HeartPulse, text: "Engagement strong across assigned families.", tone: "emerald" },
    { icon: ClipboardCheck, text: "3 follow-ups scheduled in the next 48 hours.", tone: "violet" },
    { icon: AlertTriangle, text: "1 service continuity risk worth a quick check-in.", tone: "amber" },
  ]},
  behavioral_support:    { headline: "Behavioral Support dashboard active - escalations, plans, and follow-ups are tracked here.", insights: [
    { icon: ShieldCheck, text: "Crisis escalations and support plans flow into your queue.", tone: "emerald" },
    { icon: TrendingUp, text: "Supervision visibility highlights clients that need clinical outreach.", tone: "sky" },
    { icon: GraduationCap, text: "Reports remain shared through /reports.", tone: "violet" },
  ]},
  clinical_director:     { headline: "Clinical oversight across BCBAs, supervision, treatment plans, and escalations.", insights: [
    { icon: Stethoscope, text: "Watch BCBA caseload health and supervision ratios.", tone: "emerald" },
    { icon: ClipboardCheck, text: "Treatment plan and progress report aging surface here.", tone: "violet" },
    { icon: AlertTriangle, text: "Clinical escalations flow into your queue.", tone: "amber" },
  ]},
  business_development:  { headline: "Referral partners active. A few source handoffs waiting on first outreach.", insights: [
    { icon: TrendingUp, text: "New source signals flow in from marketing_source_events.", tone: "emerald" },
    { icon: AlertTriangle, text: "Stale partners with no touch in 30+ days need follow-up.", tone: "amber" },
    { icon: Sparkles, text: "Referral CRM is shared with Marketing - all activity is durable.", tone: "violet" },
  ]},
};

/* ---------- Request store (localStorage Phase 1) ---------- */

// Operations Leadership completion pass:
// Canonical persistence for report requests + recents is now Supabase.
// The localStorage paths below remain ONLY as a fallback for signed-out
// users and for immediate synchronous UI reads. Every write is mirrored
// to Supabase (`report_requests`, `shared_report_recents`) in the
// background so favorites and history follow users across devices.
import { supabase } from "@/integrations/supabase/client";

export interface ReportRequestRecord {
  id: string;
  title: string;
  department: string;
  purpose: string;
  metrics: string;
  dataSources: string[];
  frequency: string;
  priority: string;
  visualization: string;
  aiAssist: boolean;
  attachmentName?: string;
  status: "New Request" | "Reviewing" | "Building" | "Awaiting Data" | "Testing" | "Published" | "Archived";
  createdAt: string;
  requestedBy: string;
}

const REQ_KEY = "os.reportRequests";

export function readReportRequests(): ReportRequestRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(REQ_KEY) || "[]"); } catch { return []; }
}

export function saveReportRequest(r: ReportRequestRecord) {
  if (typeof window === "undefined") return;
  const all = readReportRequests();
  all.unshift(r);
  window.localStorage.setItem(REQ_KEY, JSON.stringify(all.slice(0, 100)));
  // Fire-and-forget: mirror into Supabase so the request is durable and
  // visible to Systems & Software regardless of which device it came from.
  void (async () => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      await supabase.from("report_requests").insert({
        title: r.title,
        department: r.department || null,
        purpose: r.purpose || null,
        metrics: r.metrics || null,
        data_sources: r.dataSources ?? [],
        frequency: r.frequency || null,
        priority: r.priority || "Normal",
        visualization: r.visualization || null,
        ai_assist: !!r.aiAssist,
        attachment_name: r.attachmentName || null,
        status: r.status,
        requested_by_user_id: uid,
        requested_by_name: r.requestedBy || null,
      } as never);
    } catch {
      /* offline-safe: localStorage row above is the fallback */
    }
  })();
}

const FAV_KEY = "os.reportFavorites";

export function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}

export function toggleFavorite(id: string): string[] {
  const cur = new Set(readFavorites());
  if (cur.has(id)) cur.delete(id); else cur.add(id);
  const next = Array.from(cur);
  if (typeof window !== "undefined") window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

const RECENT_KEY = "os.reportRecent";

export function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

export function pushRecent(id: string) {
  if (typeof window === "undefined") return;
  const cur = readRecent().filter(x => x !== id);
  cur.unshift(id);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 8)));
  // Fire-and-forget upsert into shared_report_recents so recents follow
  // the user across devices. ReportsHome already reads Supabase first
  // and merges local; this keeps the two lists in sync.
  void (async () => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return;
      await supabase
        .from("shared_report_recents")
        .upsert(
          { user_id: uid, report_key: id, opened_at: new Date().toISOString() } as never,
          { onConflict: "user_id,report_key" },
        );
    } catch {
      /* offline-safe: localStorage row above is the fallback */
    }
  })();
}

export { BarChart3, LineChart };