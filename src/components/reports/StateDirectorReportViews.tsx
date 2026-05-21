import { Sparkles, ArrowRight, AlertTriangle, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricCard } from "./MetricCard";
import { BreakdownTable } from "./BreakdownTable";
import { RiskAlertPanel } from "./RiskAlertPanel";
import { HoursVsClientsChart } from "@/components/state-director/HoursVsClientsChart";
import { GrowthTrendChart } from "./GrowthTrendChart";
import {
  sdStatePerformance, sdStaffing, sdStaffingByBcba, sdBcbaPerf, sdBcbaRows,
  sdAuthPrRisk, sdAuthPrRiskAlerts, sdRecruiting, sdGrowth, sdScheduling,
  sdParentTraining, sdSupervision, sdBottlenecks, sdComparison, sdStateComparison,
  sdActionReport, sdActionAlerts,
  type SdReport, type SdAiInsight,
} from "@/data/stateDirectorReports";

/* ---------- shared blocks ---------- */

function KpiRow({ kpis }: { kpis: SdReport["kpis"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((k) => <MetricCard key={k.id} metric={k} />)}
    </div>
  );
}

function AiInsightsCard({ insights }: { insights: SdAiInsight[] }) {
  const toneCls: Record<SdAiInsight["tone"], string> = {
    ok: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-rose-50 text-rose-700",
    info: "bg-[hsl(265_100%_97%)] text-[hsl(265_70%_45%)]",
  };
  const Icon = (t: SdAiInsight["tone"]) => t === "ok" ? ShieldCheck : t === "bad" ? AlertTriangle : t === "warn" ? AlertTriangle : Info;
  return (
    <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-[hsl(265_100%_98%)] to-white p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(265_70%_55%)] to-[hsl(285_70%_55%)] text-white">
          <Sparkles className="h-3 w-3" />
        </span>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(265_70%_55%)]">AI Insights</p>
      </div>
      <ul className="mt-3 space-y-2">
        {insights.map((i, idx) => {
          const I = Icon(i.tone);
          return (
            <li key={idx} className="flex items-start gap-2 text-[12.5px] leading-snug">
              <span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md", toneCls[i.tone])}>
                <I className="h-3 w-3" />
              </span>
              <span>{i.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActionStrip({ actions }: { actions: SdReport["actions"] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
      <TrendingUp className="h-3.5 w-3.5 text-[hsl(265_70%_55%)]" />
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Take action</span>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {actions.map((a, i) => (
          <button key={i} className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
            a.tone === "primary"
              ? "bg-[hsl(265_70%_55%)] text-white hover:bg-[hsl(265_70%_50%)]"
              : "border border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/70"
          )}>{a.label} <ArrowRight className="h-3 w-3" /></button>
        ))}
      </div>
    </div>
  );
}

/** Shared scaffold: KPIs · visual · table · AI · actions. */
function MiniReportFrame({
  report, visual, table,
}: { report: SdReport; visual?: React.ReactNode; table?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <KpiRow kpis={report.kpis} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {visual}
          {table}
        </div>
        <AiInsightsCard insights={report.insights} />
      </div>
      <ActionStrip actions={report.actions} />
    </div>
  );
}

/* ---------- per-report renderers ---------- */

export function renderSdReport(id: string): React.ReactNode | null {
  switch (id) {
    case "sd-state-performance":
      return (
        <MiniReportFrame
          report={sdStatePerformance}
          visual={
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Operational heartbeat</p>
              <p className="mt-0.5 text-[14px] font-semibold tracking-tight">Active Clients vs Total Service Hours</p>
              <div className="mt-3"><HoursVsClientsChart /></div>
            </div>
          }
        />
      );
    case "sd-staffing-health":
      return (
        <MiniReportFrame
          report={sdStaffing}
          table={
            <BreakdownTable
              title="Caseload by BCBA"
              subtitle="Where load is heaviest right now"
              columns={[
                { key: "name", label: "BCBA" },
                { key: "region", label: "Region" },
                { key: "caseload", label: "Caseload", align: "right" },
                { key: "capacity", label: "Capacity", align: "right" },
                { key: "status", label: "Status" },
              ]}
              rows={sdStaffingByBcba}
            />
          }
        />
      );
    case "sd-bcba-performance":
      return (
        <MiniReportFrame
          report={sdBcbaPerf}
          table={
            <BreakdownTable
              title="BCBA Scorecard"
              subtitle="Operational performance — not punitive"
              columns={[
                { key: "name", label: "BCBA" },
                { key: "caseload", label: "Caseload", align: "right" },
                { key: "supervision", label: "Supervision %", isBar: true, barTone: "primary", formatter: (v) => `${v}%` },
                { key: "prs", label: "Overdue PRs", align: "right" },
                { key: "cancellations", label: "Cancel %", align: "right", formatter: (v) => `${v}%` },
                { key: "retention", label: "Retention", align: "right", formatter: (v) => `${v}%` },
              ]}
              rows={sdBcbaRows}
            />
          }
        />
      );
    case "sd-auth-pr-risk":
      return (
        <MiniReportFrame
          report={sdAuthPrRisk}
          visual={<RiskAlertPanel alerts={sdAuthPrRiskAlerts} />}
        />
      );
    case "sd-recruiting":
      return <MiniReportFrame report={sdRecruiting} />;
    case "sd-growth":
      return <MiniReportFrame report={sdGrowth} visual={<GrowthTrendChart />} />;
    case "sd-scheduling":
      return <MiniReportFrame report={sdScheduling} />;
    case "sd-parent-training":
      return <MiniReportFrame report={sdParentTraining} />;
    case "sd-supervision":
      return <MiniReportFrame report={sdSupervision} />;
    case "sd-bottlenecks":
      return <MiniReportFrame report={sdBottlenecks} />;
    case "sd-state-comparison":
      return (
        <MiniReportFrame
          report={sdComparison}
          table={
            <BreakdownTable
              title="State Benchmark"
              subtitle="How VA stacks up across the network"
              columns={[
                { key: "state", label: "State" },
                { key: "clients", label: "Active", align: "right" },
                { key: "hoursWk", label: "Hrs/Wk", align: "right" },
                { key: "retention", label: "Retention %", isBar: true, barTone: "success", formatter: (v) => `${v}%` },
                { key: "cancellations", label: "Cancel %", align: "right", formatter: (v) => `${v}%` },
                { key: "recruiting", label: "Pipeline", align: "right" },
              ]}
              rows={sdStateComparison}
            />
          }
        />
      );
    case "sd-action-report":
      return (
        <MiniReportFrame
          report={sdActionReport}
          visual={<RiskAlertPanel alerts={sdActionAlerts} />}
        />
      );
    default:
      return null;
  }
}

export const SD_REPORT_IDS = new Set([
  "sd-state-performance",
  "sd-staffing-health",
  "sd-bcba-performance",
  "sd-auth-pr-risk",
  "sd-recruiting",
  "sd-growth",
  "sd-scheduling",
  "sd-parent-training",
  "sd-supervision",
  "sd-bottlenecks",
  "sd-state-comparison",
  "sd-action-report",
]);