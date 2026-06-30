import { useMemo } from "react";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";

/**
 * Computes live KPI previews for the three Authorizations operational
 * reports. Returns truthful "Setup" labels when no data exists rather
 * than bare "-" dashes, so the Reports surface never lies.
 *
 * Keys map to report ids in src/lib/os/reportsCatalog.ts.
 */
export interface ReportKpiOverride {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

export function useAuthorizationReportMetrics(): {
  loading: boolean;
  byReportId: Record<string, ReportKpiOverride[]>;
} {
  const live = useLiveAuthorizations();

  return useMemo(() => {
    if (live.loading) {
      return { loading: true, byReportId: {} };
    }
    const items = live.items;
    const total = items.length;
    const truthful = (n: number) => (total === 0 ? "Setup" : String(n));

    const now = Date.now();
    const daysUntil = (iso: string | null | undefined) => {
      if (!iso) return null;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return null;
      return Math.round((t - now) / 86400000);
    };

    let exp14 = 0;
    let exp30 = 0;
    let stalled = 0;
    let approved = 0;
    let denied = 0;
    let submittedWithApproval = 0;
    let turnaroundDaysSum = 0;
    let turnaroundCount = 0;
    let ageInStageSum = 0;
    let ageInStageCount = 0;

    for (const a of items) {
      const dExp = daysUntil(a.expirationDate);
      if (dExp != null && dExp >= 0) {
        if (dExp <= 14) exp14++;
        if (dExp <= 30) exp30++;
      }
      const stage = a.stage ?? "";
      const isStalled =
        a.missingInfo ||
        a.riskLevel === "High" ||
        stage === "In QA Review" ||
        stage === "Awaiting Submission" ||
        stage === "Submitted" ||
        stage === "Denied";
      if (isStalled) stalled++;
      if (a.lastActivity) {
        const d = daysUntil(a.lastActivity);
        if (d != null) {
          ageInStageSum += Math.max(0, -d);
          ageInStageCount++;
        }
      }
      if (stage === "Approved") approved++;
      if (stage === "Denied") denied++;
      if (a.submittedDate && a.approvedDate) {
        const t1 = new Date(a.submittedDate).getTime();
        const t2 = new Date(a.approvedDate).getTime();
        if (!Number.isNaN(t1) && !Number.isNaN(t2) && t2 >= t1) {
          turnaroundDaysSum += (t2 - t1) / 86400000;
          turnaroundCount++;
          submittedWithApproval++;
        }
      }
    }

    const approvalDen = approved + denied;
    const approvalRate = approvalDen > 0 ? Math.round((approved / approvalDen) * 100) : null;
    const avgTurnaround = turnaroundCount > 0 ? Math.round(turnaroundDaysSum / turnaroundCount) : null;
    const avgAge = ageInStageCount > 0 ? Math.round(ageInStageSum / ageInStageCount) : null;

    return {
      loading: false,
      byReportId: {
        "auth-expiration-risk": [
          { label: "<14 days", value: truthful(exp14), trend: exp14 > 0 ? "down" : "neutral" },
          { label: "<30 days", value: truthful(exp30), trend: exp30 > 0 ? "down" : "neutral" },
        ],
        "auth-workflow-bottleneck": [
          { label: "Stalled", value: truthful(stalled), trend: stalled > 0 ? "down" : "up" },
          { label: "Avg age", value: avgAge == null ? "Setup" : `${avgAge}d`, trend: "neutral" },
        ],
        "auth-operational-performance": [
          { label: "Approval", value: approvalRate == null ? "Setup" : `${approvalRate}%`, trend: "up" },
          {
            label: "Turnaround",
            value: avgTurnaround == null
              ? (submittedWithApproval === 0 ? "Setup" : "—")
              : `${avgTurnaround}d`,
            trend: "up",
          },
        ],
      },
    };
  }, [live.loading, live.items]);
}