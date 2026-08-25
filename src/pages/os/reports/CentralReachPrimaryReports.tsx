/**
 * Dedicated renderer for the 8 primary CentralReach-backed reports.
 *
 * `ReportDetail` routes these report IDs here *before* any State-Director,
 * Authorization, or generic placeholder handling, so the primary reports never
 * fall through to the legacy generic report shell or its skeleton fallback cards.
 *
 * Every target page owns its own OSShell chrome (via `PrimaryReportShell` or,
 * for the two legacy-native pages, its own layout), so this renderer returns
 * the page element directly rather than embedding it inside another shell.
 *
 * There are intentionally no upload controls in this module or in the primary
 * report pages it renders — CentralReach files are ingested only from the
 * CentralReach Data Hub.
 */
import type { ReactElement } from "react";
import BcbaProductivityReportV3 from "@/pages/os/reports/BcbaProductivityReportV3";
import { CentralReachPrimaryReport } from "@/pages/os/reports/CentralReachPrimaryReport";
import CancellationCommandCenter from "@/pages/os/reports/CancellationCommandCenter";
import AuthorizationAnalysisPage from "@/pages/os/reports/AuthorizationAnalysisPage";
import AuthorizationUtilizationPage from "@/pages/os/reports/AuthorizationUtilizationPage";
import BcbaPerformancePage from "@/pages/os/reports/BcbaPerformancePage";
import BcbaSupervisionPage from "@/pages/os/reports/BcbaSupervisionPage";
import ParentTrainingPage from "@/pages/os/reports/ParentTrainingPage";
import ProgressReportsPage from "@/pages/os/reports/ProgressReportsPage";

/** Canonical IDs of the 8 primary CentralReach-backed reports. */
export const PRIMARY_CR_REPORT_IDS = [
  "bcba-productivity-report-v3",
  "cancellation-command-center",
  "authorization-analysis",
  "authorization-utilization-hour-based",
  "bcba-performance",
  "bcba-supervision",
  "parent-training",
  "progress-reports",
] as const;

export type PrimaryCrReportId = (typeof PRIMARY_CR_REPORT_IDS)[number];

const PRIMARY_ID_SET = new Set<string>(PRIMARY_CR_REPORT_IDS);

export function isPrimaryCrReport(reportId: string | null | undefined): boolean {
  return !!reportId && PRIMARY_ID_SET.has(reportId);
}

/** Canonical deep-link route for each primary report. */
export const PRIMARY_CR_REPORT_ROUTES: Record<PrimaryCrReportId, string> = {
  "bcba-productivity-report-v3": "/reports/bcba-productivity-report-v3",
  "cancellation-command-center": "/reports/cancellation-command-center",
  "authorization-analysis": "/reports/authorization-analysis",
  "authorization-utilization-hour-based": "/reports/authorization-utilization-hour-based",
  "bcba-performance": "/reports/bcba-performance",
  "bcba-supervision": "/reports/bcba-supervision",
  "parent-training": "/reports/parent-training",
  "progress-reports": "/reports/progress-reports",
};

/**
 * Canonical `/reports/<id>` page components, still mounted directly by the
 * router in `App.tsx`. `ReportDetail` renders the shared operator dashboard
 * (`CentralReachPrimaryReport`) for the 7 non-BCBA reports instead, so the
 * generic placeholder shell can never appear for them.
 */
export const PRIMARY_CR_REPORT_PAGES = {
  "bcba-productivity-report-v3": BcbaProductivityReportV3,
  "cancellation-command-center": CancellationCommandCenter,
  "authorization-analysis": AuthorizationAnalysisPage,
  "authorization-utilization-hour-based": AuthorizationUtilizationPage,
  "bcba-performance": BcbaPerformancePage,
  "bcba-supervision": BcbaSupervisionPage,
  "parent-training": ParentTrainingPage,
  "progress-reports": ProgressReportsPage,
} as const;

/**
 * Returns the dedicated page element for a primary report ID, or `null` when
 * the ID is not one of the 8 primary reports.
 */
export function renderPrimaryCrReport(
  reportId: string | null | undefined,
): ReactElement | null {
  switch (reportId) {
    case "bcba-productivity-report-v3":
      // BCBA V3 ownership inference and its historical-assignment logic are
      // owned entirely by this page — rendered as-is, never re-implemented.
      return <BcbaProductivityReportV3 />;
    case "bcba-performance":
      // Phase 2B1 rebuild: five-dimension scorecard with a separate incentive
      // panel, attributed through the canonical V3 ownership adapter.
      return <BcbaPerformancePage />;
    case "bcba-supervision":
      // Phase 2B1 rebuild: 97155 ÷ 97153 with Past and Projected views.
      return <BcbaSupervisionPage />;
    case "parent-training":
      // Phase 2B1 rebuild: completed / upcoming / cancelled 97156 plus queues.
      return <ParentTrainingPage />;
    case "cancellation-command-center":
    case "authorization-analysis":
    case "authorization-utilization-hour-based":
    case "progress-reports":
      // Shared operator dashboard: freshness, filters, KPIs, Recharts,
      // grouped table, source-row drilldown, and CSV export.
      return <CentralReachPrimaryReport reportId={reportId} />;
    default:
      return null;
  }
}

export default renderPrimaryCrReport;
