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

export const executiveKpis: KpiSpec[] = [];

export const executiveAlerts: AlertItem[] = [];

export const departmentReadiness: ReadinessRow[] = [];

export const competencyAreas = [];

export const competencyGaps = [];

export const engagementScores: EngagementRow[] = [];

export const trainingFunnel = [];

export const completionTrend = trend(14, 65, 8);

export const coursePerformance: CourseStat[] = [];

export const complianceByState = [];

export const expiringCertifications: ComplianceItem[] = [];

export const complianceTrend = [];

export const atRiskEmployees = [];

export const onboardingStages = [];

export const onboardingByDept = [];

export const newHireProgress: NewHireProgress[] = [];

export const stateMetrics: StateMetric[] = [];

export const weeklyScorecard: ScorecardRowData[] = [];

export const monthlyScorecard: ScorecardRowData[] = [];

export const departmentScorecard: ScorecardRowData[] = [];

export const leadershipScorecard: ScorecardRowData[] = [];

export const riskInsights: RiskInsight[] = [];

export const reportTemplates: ReportTemplate[] = [];

export const availableMetrics = [];
