import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { ActionCenter } from "@/components/dashboard/ActionCenter";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { BottleneckPanel } from "@/components/dashboard/BottleneckPanel";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { GrowthInsights } from "@/components/dashboard/GrowthInsights";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { AlertsRisks } from "@/components/dashboard/AlertsRisks";
import { QuickActions } from "@/components/dashboard/QuickActions";

const growthKpis = [
  { label: "New Leads Today", value: 8, change: "+3", trend: "up" as const, detail: "34 this week · 112 this month" },
  { label: "Lead → Client", value: "62%", change: "+4%", trend: "up" as const, detail: "vs 58% last month" },
  { label: "Active Clients", value: 142, change: "+8", trend: "up" as const, detail: "Across 6 states" },
  { label: "Net Growth (Month)", value: "+12", change: "↑", trend: "up" as const, detail: "8 starts, 4 discharges offset" },
];

const revenueKpis = [
  { label: "Pending Start Date", value: 5, detail: "Future revenue pipeline" },
  { label: "Pending Treatment Auth", value: 7, detail: "Revenue locked until approved" },
  { label: "VOB Completed", value: 22, change: "+6", trend: "up" as const, detail: "Pipeline health indicator" },
  { label: "Staffing Needed", value: 13, change: "+4", trend: "down" as const, detail: "Blocking starts" },
];

const speedKpis = [
  { label: "Lead → Contact", value: "2.4h", change: "-18min", trend: "up" as const, detail: "Target: < 1h" },
  { label: "Lead → VOB", value: "3.2d", change: "-0.5d", trend: "up" as const, detail: "Target: < 2d" },
  { label: "VOB → Start Date", value: "14.6d", change: "+1.2d", trend: "down" as const, detail: "Target: < 10d" },
  { label: "Assessment → Active", value: "18.3d", change: "-2.1d", trend: "up" as const, detail: "Includes staffing time" },
];

const leadsFunnel = [
  { stage: "New Lead", count: 34, dropOff: 0 },
  { stage: "In Contact", count: 28, dropOff: 18 },
  { stage: "Form Sent", count: 22, dropOff: 21 },
  { stage: "Form Received", count: 18, dropOff: 18 },
  { stage: "Sent to VOB", count: 15, dropOff: 17 },
  { stage: "VOB Complete", count: 12, dropOff: 20 },
  { stage: "Converted", count: 10, dropOff: 17 },
];

const clientsFunnel = [
  { stage: "BCBA Assignment", count: 4 },
  { stage: "Initial Auth", count: 11, dropOff: 0 },
  { stage: "Assessment", count: 6 },
  { stage: "QA Review", count: 9 },
  { stage: "Treatment Auth", count: 7 },
  { stage: "Staffing", count: 13, dropOff: 35 },
  { stage: "Pending Start", count: 5 },
  { stage: "Active", count: 142 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section 1: KPI Strip */}
      <div className="space-y-4">
        <KpiStrip title="Growth" items={growthKpis} />
        <KpiStrip title="Revenue Drivers" items={revenueKpis} />
        <KpiStrip title="Speed Metrics" items={speedKpis} />
      </div>

      {/* Section 2: Today's Action Center */}
      <ActionCenter />

      {/* Section 3 & 4: Pipeline + Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnel title="Leads Funnel" stages={leadsFunnel} maxCount={34} />
        <PipelineFunnel title="Client Pipeline" stages={clientsFunnel} maxCount={142} />
      </div>

      <BottleneckPanel />

      {/* Section 5: Team Performance */}
      <TeamPerformance />

      {/* Section 6, 7, 8, 9: Insights + Forecast + Alerts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GrowthInsights />
        <ForecastPanel />
        <div className="space-y-6">
          <AlertsRisks />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
