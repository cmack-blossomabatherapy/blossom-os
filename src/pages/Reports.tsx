import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BarChart3, Stethoscope, X } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { ReportsControlBar } from "@/components/reports/ReportsControlBar";
import { MetricCard } from "@/components/reports/MetricCard";
import { ReportFunnel } from "@/components/reports/ReportFunnel";
import { RiskAlertPanel } from "@/components/reports/RiskAlertPanel";
import { BreakdownTable } from "@/components/reports/BreakdownTable";
import { RevenuePipelinePanel } from "@/components/reports/RevenuePipelinePanel";
import { GrowthTrendChart } from "@/components/reports/GrowthTrendChart";
import { TeamPerformanceTable } from "@/components/reports/TeamPerformanceTable";
import {
  type DateRange,
  executiveKpis,
  leadFunnel,
  clientFunnel,
  intakeKpis,
  leadSourcePerformance,
  intakeByState,
  intakeCoordinatorPerf,
  authKpis,
  denialsByPayor,
  missingDocTrends,
  qaKpis,
  schedulingKpis,
  capacityByState,
  lifecycleKpis,
  riskAlerts,
} from "@/data/reports";

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [activeView, setActiveView] = useState<string>("executive");
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    if (category === "credentialing") setActiveView("credentialing");
  }, [category]);

  const clearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    setSearchParams(next, { replace: true });
  };

  return (
    <GlassPageShell
      eyebrow="Reporting"
      eyebrowIcon={BarChart3}
      title="Reports & insights"
      description="Growth, conversion, and operational performance — every number is clickable."
    >
      {category === "credentialing" && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <div className="inline-flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="font-medium">Credentialing filter active</span>
            <span className="text-muted-foreground text-xs">— showing Credentialing reports first.</span>
          </div>
          <button
            onClick={clearCategory}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <X className="h-3 w-3" /> Clear filter · View all reports
          </button>
        </div>
      )}

      <ReportsControlBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        activeView={activeView}
        onActiveViewChange={setActiveView}
      />

      {activeView === "executive" && <ExecutiveView />}
      {activeView === "intake" && <IntakeView />}
      {activeView === "auth" && <AuthView />}
      {activeView === "credentialing" && <CredentialingView />}
      {activeView === "qa" && <QAView />}
      {activeView === "scheduling" && <SchedulingView />}
      {activeView === "lifecycle" && <LifecycleView />}
      {activeView === "revenue" && <RevenueView />}
      {activeView === "team" && <TeamView />}
      {activeView === "growth" && <GrowthView />}
    </GlassPageShell>
  );
}

// ============== Views ==============

function ExecutiveView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {executiveKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportFunnel title="Lead Funnel" subtitle="Drop-off and bottlenecks" stages={leadFunnel} />
        <ReportFunnel title="Client Funnel" subtitle="Pipeline stages with delay indicators" stages={clientFunnel} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenuePipelinePanel />
        </div>
        <RiskAlertPanel alerts={riskAlerts} />
      </div>
    </div>
  );
}

function IntakeView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {intakeKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <ReportFunnel title="Lead Funnel" subtitle="Conversion across intake stages" stages={leadFunnel} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownTable
          title="By Lead Source"
          subtitle="Conversion rate by source"
          columns={[
            { key: "source", label: "Source" },
            { key: "leads", label: "Leads", align: "right" },
            { key: "converted", label: "Conv.", align: "right" },
            { key: "rate", label: "Rate %", isBar: true, barTone: "success", formatter: (v) => `${v}%` },
          ]}
          rows={leadSourcePerformance}
        />
        <BreakdownTable
          title="By State"
          columns={[
            { key: "state", label: "State" },
            { key: "leads", label: "Leads", align: "right" },
            { key: "conversion", label: "Conv. %", isBar: true, formatter: (v) => `${v}%` },
          ]}
          rows={intakeByState}
        />
        <BreakdownTable
          title="By Coordinator"
          columns={[
            { key: "name", label: "Name" },
            { key: "handled", label: "Handled", align: "right" },
            { key: "avgContact", label: "Avg Contact", align: "right" },
            { key: "conversion", label: "Conv. %", isBar: true, formatter: (v) => `${v}%` },
          ]}
          rows={intakeCoordinatorPerf}
        />
      </div>
    </div>
  );
}

function AuthView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {authKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownTable
          title="Denials by Payor"
          subtitle="Which insurance is causing problems"
          columns={[
            { key: "payor", label: "Payor" },
            { key: "total", label: "Submitted", align: "right" },
            { key: "denied", label: "Denied", align: "right" },
            { key: "rate", label: "Denial %", isBar: true, barTone: "destructive", formatter: (v) => `${v}%` },
          ]}
          rows={denialsByPayor}
        />
        <BreakdownTable
          title="Missing Documentation"
          subtitle="What's blocking submissions"
          columns={[
            { key: "type", label: "Doc Type" },
            { key: "blocking", label: "Blocking" },
            { key: "count", label: "Count", isBar: true, barTone: "warning" },
          ]}
          rows={missingDocTrends}
        />
      </div>
    </div>
  );
}

function QAView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {qaKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">QA Bottleneck Impact</h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          QA directly impacts revenue timing — every day in QA delays auth, staffing, and start date.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ImpactCard label="Avg QA Delay" value="3.1d" detail="On approved plans" />
          <ImpactCard label="Worst Case" value="9d" detail="2 plans stuck > 1 week" tone="destructive" />
          <ImpactCard label="Revenue Impact" value="~$12k" detail="Delayed monthly recognition" tone="warning" />
        </div>
      </div>
    </div>
  );
}

function SchedulingView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {schedulingKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <BreakdownTable
        title="Capacity by State"
        subtitle="RBT hours available vs needed (weekly)"
        columns={[
          { key: "state", label: "State" },
          { key: "available", label: "Available hrs", align: "right" },
          { key: "needed", label: "Needed hrs", align: "right" },
          {
            key: "gap",
            label: "Gap",
            isBar: true,
            barTone: "destructive",
            barMax: Math.max(...capacityByState.map((c) => Math.abs(c.gap))),
            formatter: (v) => (Number(v) >= 0 ? `+${v}` : `${v}`),
          },
        ]}
        rows={capacityByState.map((c) => ({ ...c, gap: Math.max(c.gap, 0) }))}
      />
    </div>
  );
}

function LifecycleView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {lifecycleKpis.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
      <ReportFunnel title="Client Funnel" subtitle="Where clients drop off across the lifecycle" stages={clientFunnel} />
    </div>
  );
}

function RevenueView() {
  return (
    <div className="space-y-4">
      <RevenuePipelinePanel />
      <ReportFunnel
        title="Pipeline Conversion"
        subtitle="Stages between VOB and Active"
        stages={clientFunnel}
      />
    </div>
  );
}

function TeamView() {
  return (
    <div className="space-y-4">
      <TeamPerformanceTable />
    </div>
  );
}

function GrowthView() {
  return (
    <div className="space-y-4">
      <GrowthTrendChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportFunnel title="Lead Funnel" stages={leadFunnel} />
        <ReportFunnel title="Client Funnel" stages={clientFunnel} />
      </div>
    </div>
  );
}

function CredentialingView() {
  const cards: { label: string; to: string; description: string }[] = [
    { label: "Provider Credentialing", to: "/credentialing/providers", description: "Provider directory, NPI/CAQH, licensing." },
    { label: "Insurance Credentialing", to: "/credentialing/insurance", description: "Payer/state credentialing pipeline and gaps." },
    { label: "BCBA Credentials", to: "/credentialing/bcba", description: "BCBA license, payer coverage, CentralReach IDs." },
    { label: "Uncredentialed BCBAs", to: "/credentialing/uncredentialed-bcbas", description: "Active BCBAs without approved coverage." },
    { label: "Expiring Credentials", to: "/credentialing/expiring", description: "30 / 60 / 90 day expiration window." },
    { label: "Credentialing Dashboard", to: "/credentialing", description: "Operational overview and follow-ups." },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Credentialing reports</h3>
        <p className="text-[11px] text-muted-foreground">
          Operational credentialing views — provider, payer, BCBA coverage, and expiring credentials.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-lg border border-border/60 bg-secondary/30 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{c.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImpactCard({
  label, value, detail, tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "destructive" | "warning";
}) {
  return (
    <div
      className={
        tone === "destructive"
          ? "bg-destructive/5 border border-destructive/30 rounded-lg p-3"
          : tone === "warning"
            ? "bg-warning/5 border border-warning/30 rounded-lg p-3"
            : "bg-secondary/30 border border-border/40 rounded-lg p-3"
      }
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          tone === "destructive"
            ? "text-2xl font-semibold text-destructive tabular-nums mt-0.5"
            : tone === "warning"
              ? "text-2xl font-semibold text-warning tabular-nums mt-0.5"
              : "text-2xl font-semibold text-foreground tabular-nums mt-0.5"
        }
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
    </div>
  );
}
