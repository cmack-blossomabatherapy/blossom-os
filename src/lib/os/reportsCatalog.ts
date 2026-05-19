import {
  Activity, AlertTriangle, BarChart3, Brain, Briefcase, CalendarDays, ClipboardCheck,
  DollarSign, FileCheck2, GraduationCap, HeartPulse, LineChart, MapPin, ShieldCheck,
  Sparkles, Stethoscope, Target, TrendingUp, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { OSRole } from "./permissions";

export type ReportCategoryId =
  | "operations" | "qa" | "authorizations" | "scheduling" | "recruiting"
  | "financial" | "clinical" | "training" | "leadership" | "state";

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
}

export const REPORTS: ReportDef[] = [
  // Leadership
  { id: "exec-overview", title: "Executive Overview", description: "Company-wide KPIs, lead flow, and operating posture.", category: "leadership", visibleTo: ["super_admin", "executive_leadership", "operations_leadership"], type: "dashboard", owner: "Leadership", lastUpdated: "2h ago", popularity: 97, featured: true, aiInsight: "Net growth up +11 — fastest weekly gain since Feb.", kpiPreviews: [{ label: "Active Clients", value: "142", delta: "+8", trend: "up" }, { label: "Pipeline", value: "$182k", delta: "+$24k", trend: "up" }, { label: "Conversion", value: "34%", delta: "+4pt", trend: "up" }], sparkline: [22, 28, 26, 35, 41, 48, 52, 60, 58, 67, 72, 78], tags: ["KPI", "Growth"], detailView: "executive" },
  { id: "growth-trends", title: "Growth Trends", description: "Lead, client, and active growth across the last 6 months.", category: "leadership", visibleTo: ["super_admin", "executive_leadership", "operations_leadership"], type: "trend", owner: "Leadership", lastUpdated: "Yesterday", popularity: 71, aiInsight: "Q2 active-client growth pacing 18% above plan.", sparkline: [40, 44, 48, 55, 62, 68, 72, 78, 82, 86], tags: ["Trends"], detailView: "growth" },

  // Operations
  { id: "lifecycle", title: "Client Lifecycle", description: "Lead → Start Date timing, conversion, and flake risk.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership"], type: "dashboard", owner: "Operations", lastUpdated: "1h ago", popularity: 84, featured: true, aiInsight: "Lead→Start dropped 3 days week-over-week.", kpiPreviews: [{ label: "Lead→Start", value: "42d", delta: "-3d", trend: "up" }, { label: "Active %", value: "82%", delta: "+2pt", trend: "up" }], sparkline: [60, 58, 55, 52, 49, 47, 45, 44, 42], tags: ["Funnel"], detailView: "lifecycle" },
  { id: "intake-perf", title: "Intake Performance", description: "Contact rate, time-to-form, and coordinator productivity.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "intake_coordinator"], type: "dashboard", owner: "Intake", lastUpdated: "45m ago", popularity: 78, aiInsight: "Time-to-contact down 18% — best month on record.", kpiPreviews: [{ label: "Contact rate", value: "74%", delta: "+6pt", trend: "up" }, { label: "Time to contact", value: "2.4h", delta: "-18%", trend: "up" }], sparkline: [55, 58, 60, 62, 66, 70, 72, 74], tags: ["Intake", "Velocity"], detailView: "intake" },

  // QA
  { id: "qa-performance", title: "QA Performance", description: "QA turnaround, queue size, and revenue impact of delays.", category: "qa", visibleTo: ["super_admin", "operations_leadership", "qa_team", "bcba"], type: "dashboard", owner: "QA Team", lastUpdated: "3h ago", popularity: 88, featured: true, aiInsight: "QA turnaround 3.1d (-1d). Watch: 2 plans stuck >7 days.", kpiPreviews: [{ label: "Turnaround", value: "3.1d", delta: "-1d", trend: "up" }, { label: "Queue", value: "15", delta: "+2", trend: "down" }, { label: "Stuck >5d", value: "12%", delta: "-3pt", trend: "up" }], sparkline: [72, 68, 65, 60, 58, 54, 52, 50, 48], tags: ["QA", "Bottleneck"], detailView: "qa" },
  { id: "qa-supervision", title: "Supervision Compliance", description: "BCBA supervision hours by client and credentialing status.", category: "qa", visibleTo: ["super_admin", "qa_team", "bcba", "operations_leadership"], type: "summary", owner: "QA Team", lastUpdated: "Today", popularity: 81, aiInsight: "4 clients under supervision threshold this week.", sparkline: [50, 55, 60, 64, 68, 72, 70, 74], tags: ["Compliance"] },
  { id: "qa-parent-training", title: "Parent Training 97156", description: "Authorized vs delivered parent training hours.", category: "qa", visibleTo: ["super_admin", "qa_team", "bcba"], type: "table", owner: "QA Team", lastUpdated: "Today", popularity: 64, aiInsight: "Utilization improved to 78% (+9pt vs March).", sparkline: [40, 48, 52, 58, 60, 65, 68, 72, 78], tags: ["97156"] },

  // Authorizations
  { id: "auth-performance", title: "Authorization Performance", description: "Submit time, approval rate, and denial patterns.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership", "state_director"], type: "dashboard", owner: "Auth Team", lastUpdated: "30m ago", popularity: 91, featured: true, aiInsight: "United denials trending up (23%). Recommend payor escalation.", kpiPreviews: [{ label: "Approval", value: "87%", delta: "+3pt", trend: "up" }, { label: "Time to submit", value: "4.2d", delta: "-0.8d", trend: "up" }, { label: "Pending", value: "27", delta: "+4", trend: "down" }], sparkline: [60, 64, 68, 70, 74, 78, 82, 85, 87], tags: ["Auth", "Payor"], detailView: "auth" },
  { id: "auth-expiring", title: "Expiring Authorizations", description: "Auths expiring in the next 30 / 60 / 90 days.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "operations_leadership"], type: "table", owner: "Auth Team", lastUpdated: "1h ago", popularity: 76, aiInsight: "9 auths expiring inside 30 days — start reauth now.", sparkline: [20, 22, 26, 28, 30, 32, 30, 32], tags: ["Expiring"] },
  { id: "auth-utilization", title: "Authorization Utilization", description: "Authorized vs delivered hours by client and payor.", category: "authorizations", visibleTo: ["super_admin", "authorization_coordinator", "billing_finance", "bcba"], type: "dashboard", owner: "Auth Team", lastUpdated: "Today", popularity: 82, aiInsight: "Utilization risk: 7 clients below 60% delivered.", sparkline: [55, 58, 62, 64, 66, 68, 70, 72], tags: ["Utilization"] },

  // Scheduling
  { id: "scheduling-perf", title: "Scheduling & Staffing", description: "Time-to-schedule, fill rate, and capacity gaps by state.", category: "scheduling", visibleTo: ["super_admin", "scheduling_team", "state_director", "operations_leadership"], type: "dashboard", owner: "Scheduling", lastUpdated: "2h ago", popularity: 79, featured: true, aiInsight: "Georgia capacity gap widened to 62 hrs — recruit lever.", kpiPreviews: [{ label: "Fill rate", value: "78%", delta: "+5pt", trend: "up" }, { label: "Time to schedule", value: "2.6d", delta: "-0.4d", trend: "up" }], sparkline: [55, 60, 64, 68, 70, 74, 76, 78], tags: ["Capacity"], detailView: "scheduling" },
  { id: "session-completion", title: "Session Completion", description: "Cancellations, no-shows, and delivered hours.", category: "scheduling", visibleTo: ["super_admin", "scheduling_team", "state_director", "bcba"], type: "trend", owner: "Scheduling", lastUpdated: "Today", popularity: 68, aiInsight: "Cancellation rate steady at 8% — within tolerance.", sparkline: [78, 80, 82, 81, 83, 85, 84, 86], tags: ["Sessions"] },

  // Recruiting
  { id: "recruiting-pipeline", title: "Recruiting Pipeline", description: "Applicants, time-to-hire, and source quality.", category: "recruiting", visibleTo: ["super_admin", "recruiting_team", "hr_team", "state_director"], type: "dashboard", owner: "Recruiting", lastUpdated: "1h ago", popularity: 72, aiInsight: "Indeed source: 2x conversion vs ZipRecruiter.", sparkline: [40, 44, 48, 52, 55, 58, 60, 64], tags: ["Hiring"] },

  // Financial
  { id: "revenue-pipeline", title: "Revenue Pipeline", description: "Projected starts and weighted pipeline value.", category: "financial", visibleTo: ["super_admin", "executive_leadership", "billing_finance", "operations_leadership"], type: "dashboard", owner: "Finance", lastUpdated: "Today", popularity: 86, featured: true, aiInsight: "$182k pipeline — $76k weighted to start in 4 weeks.", kpiPreviews: [{ label: "Pipeline", value: "$182k", delta: "+$24k", trend: "up" }, { label: "4-wk starts", value: "25", delta: "+6", trend: "up" }], sparkline: [50, 56, 62, 66, 70, 74, 78, 82], tags: ["Revenue"], detailView: "revenue" },
  { id: "claims-aging", title: "Claims & AR Aging", description: "Outstanding claims and aging buckets.", category: "financial", visibleTo: ["super_admin", "billing_finance"], type: "table", owner: "Finance", lastUpdated: "Today", popularity: 58, aiInsight: "AR > 60d up 4% — Aetna primary contributor.", sparkline: [30, 34, 36, 38, 40, 42, 44], tags: ["Billing"] },

  // Clinical
  { id: "caseload", title: "BCBA Caseload", description: "Active caseload, hours, and supervision balance.", category: "clinical", visibleTo: ["super_admin", "bcba", "operations_leadership", "qa_team"], type: "dashboard", owner: "Clinical", lastUpdated: "Today", popularity: 74, aiInsight: "2 BCBAs over recommended caseload ceiling.", sparkline: [45, 48, 50, 52, 55, 56, 58, 60], tags: ["Caseload"] },
  { id: "progress-trends", title: "Progress Trends", description: "Client outcome trajectories across goal domains.", category: "clinical", visibleTo: ["super_admin", "bcba", "operations_leadership"], type: "trend", owner: "Clinical", lastUpdated: "Yesterday", popularity: 62, aiInsight: "Mastered goals +14% vs prior quarter.", sparkline: [50, 54, 58, 62, 64, 68, 70, 74], tags: ["Outcomes"] },

  // Team
  { id: "team-performance", title: "Team Performance", description: "Individual productivity and quality across departments.", category: "operations", visibleTo: ["super_admin", "operations_leadership", "state_director", "executive_leadership"], type: "table", owner: "Operations", lastUpdated: "Today", popularity: 70, aiInsight: "Maria K. conversion trending down — coaching opportunity.", sparkline: [55, 58, 60, 62, 64, 66, 65, 67], tags: ["People"], detailView: "team" },

  // State
  { id: "state-performance", title: "State Performance", description: "Cross-state benchmarks: leads, conversion, capacity, revenue.", category: "state", visibleTo: ["super_admin", "executive_leadership", "operations_leadership", "state_director"], type: "dashboard", owner: "Leadership", lastUpdated: "1h ago", popularity: 80, aiInsight: "GA leads the network in conversion; TX leads in capacity.", sparkline: [50, 56, 60, 64, 68, 72, 74, 78], tags: ["Geo"] },
];

export function visibleReportsForRole(role: OSRole): ReportDef[] {
  return REPORTS.filter(r => r.visibleTo === "all" || (r.visibleTo as OSRole[]).includes(role));
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

export interface RoleAISummary {
  headline: string;
  insights: { icon: LucideIcon; text: string; tone: "violet" | "emerald" | "amber" | "rose" | "sky" }[];
}

export const ROLE_AI_SUMMARY: Record<OSRole, RoleAISummary> = {
  super_admin:           { headline: "Network in healthy posture. 3 operational risks worth your attention this week.", insights: [
    { icon: TrendingUp, text: "Active client growth pacing 18% above plan.", tone: "emerald" },
    { icon: AlertTriangle, text: "GA capacity gap widened to 62 hours.", tone: "amber" },
    { icon: Brain, text: "QA turnaround down 1 day — revenue recognition improves.", tone: "violet" },
  ]},
  executive_leadership:  { headline: "Strong growth quarter — financial pipeline strengthening, watch GA capacity.", insights: [
    { icon: TrendingUp, text: "Revenue pipeline up $24k week-over-week.", tone: "emerald" },
    { icon: Target, text: "Conversion at 34% — best in 6 months.", tone: "violet" },
    { icon: AlertTriangle, text: "United denial rate climbing — payor strategy review.", tone: "amber" },
  ]},
  operations_leadership: { headline: "Throughput improving across intake and QA. One staffing bottleneck remains.", insights: [
    { icon: Activity, text: "Lead → Start time dropped 3 days.", tone: "emerald" },
    { icon: AlertTriangle, text: "11 clients stuck in Staffing Needed > 5 days.", tone: "amber" },
    { icon: ShieldCheck, text: "Supervision compliance back above target.", tone: "emerald" },
  ]},
  state_director:        { headline: "State performance solid. Charlotte staffing escalation requires attention.", insights: [
    { icon: MapPin, text: "Your region: 14 active starts in next 30 days.", tone: "sky" },
    { icon: AlertTriangle, text: "Charlotte: 1 BCBA short for projected starts.", tone: "rose" },
    { icon: TrendingUp, text: "Conversion rate +6pt vs last month.", tone: "emerald" },
  ]},
  intake_coordinator:    { headline: "Best month on record for time-to-contact. Keep the momentum.", insights: [
    { icon: TrendingUp, text: "Contact rate 74% — up 6 points.", tone: "emerald" },
    { icon: Sparkles, text: "Form completion +2pt to 57%.", tone: "violet" },
    { icon: AlertTriangle, text: "7 leads still uncontacted past 24h.", tone: "amber" },
  ]},
  authorization_coordinator: { headline: "Approval rate at 87%. United payor trending negative — escalate.", insights: [
    { icon: ShieldCheck, text: "Approval rate at 87% (+3pt).", tone: "emerald" },
    { icon: AlertTriangle, text: "United denials at 23% — outlier.", tone: "rose" },
    { icon: CalendarDays, text: "9 auths expire within 30 days.", tone: "amber" },
  ]},
  scheduling_team:       { headline: "Fill rate climbing. Watch capacity gap in Georgia.", insights: [
    { icon: TrendingUp, text: "Fill rate at 78% — up 5 points.", tone: "emerald" },
    { icon: AlertTriangle, text: "GA: 62 hour capacity gap this week.", tone: "amber" },
    { icon: CalendarDays, text: "2.6 day time-to-schedule — best ever.", tone: "violet" },
  ]},
  recruiting_team:       { headline: "Indeed converting 2x ZipRecruiter — rebalance spend.", insights: [
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
    { icon: AlertTriangle, text: "AR > 60d up 4% — Aetna driver.", tone: "amber" },
    { icon: TrendingUp, text: "Claim acceptance rate at 96%.", tone: "violet" },
  ]},
  qa_team:               { headline: "QA turnaround at 3.1d — best of quarter. Parent training compliance climbing.", insights: [
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
};

/* ---------- Request store (localStorage Phase 1) ---------- */

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
}

export { BarChart3, LineChart };