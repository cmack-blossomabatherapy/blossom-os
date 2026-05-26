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

export const executiveKpis: KpiMetric[] = [];

// =================== LEAD FUNNEL ===================

export const leadFunnel: FunnelStage[] = [];

// =================== CLIENT FUNNEL ===================

export const clientFunnel: FunnelStage[] = [];

// =================== INTAKE PERFORMANCE ===================

export const intakeKpis: KpiMetric[] = [];

export const leadSourcePerformance = [];

export const intakeByState = [];

export const intakeCoordinatorPerf = [];

// =================== AUTH PERFORMANCE ===================

export const authKpis: KpiMetric[] = [];

export const denialsByPayor = [];

export const missingDocTrends = [];

// =================== QA PERFORMANCE ===================

export const qaKpis: KpiMetric[] = [];

// =================== SCHEDULING & STAFFING ===================

export const schedulingKpis: KpiMetric[] = [];

export const capacityByState = [];

// =================== CLIENT LIFECYCLE ===================

export const lifecycleKpis: KpiMetric[] = [];

// =================== REVENUE PIPELINE ===================

export const revenuePipeline = [];

export const projectedStarts = [];

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

export const teamPerformance: TeamMemberPerf[] = [];

// =================== ALERTS / RISK ===================

export interface RiskAlert {
  id: string;
  title: string;
  count: number;
  severity: "high" | "medium" | "low";
  description: string;
  drillTo: string;
}

export const riskAlerts: RiskAlert[] = [];

// =================== GROWTH TRENDS ===================

export const monthlyTrend = [];

// =================== Helpers ===================

export const trendOf = (n: number, inverse = false): "up" | "down" | "neutral" => {
  if (n === 0) return "neutral";
  const positive = n > 0;
  return positive === !inverse ? "up" : "down";
};
