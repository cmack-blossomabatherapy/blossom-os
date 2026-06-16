import { useMemo, useState } from "react";
import { MktgPage, MktgCard, AIPrompt, ShareBar } from "./_shared";
import { useMarketingIntelligence } from "@/hooks/useMarketingIntelligence";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Megaphone,
  HeartHandshake,
  UserPlus,
  PhoneCall,
  Globe,
  Gauge,
  Star,
  Users2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Marketing Team — Marketing Reports
// Executive-friendly export hub. Pulls the same real signals every other
// marketing page consumes, surfaces them as one operational report, and lets
// the Marketing Team export to CSV / copy to Bloom Growth.
// ---------------------------------------------------------------------------

type SavedView = { id: string; label: string; description: string };

const SAVED_VIEWS: SavedView[] = [
  { id: "weekly", label: "Weekly Growth Pulse", description: "Last 7 days · all states · all sources" },
  { id: "state-momentum", label: "State Momentum", description: "7d vs prior 7d by state" },
  { id: "referral-trust", label: "Referral Trust Report", description: "Referral share by state" },
  { id: "recruiting", label: "Recruiting Reach", description: "Candidates by source · state pressure" },
];

function TrendBadge({ delta, pct }: { delta: number; pct: number }) {
  const tone =
    delta > 0
      ? "text-emerald-600 bg-emerald-500/10"
      : delta < 0
      ? "text-rose-600 bg-rose-500/10"
      : "text-muted-foreground bg-muted";
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

function KpiTile({
  label,
  value,
  hint,
  health,
}: {
  label: string;
  value: string | number;
  hint?: string;
  health?: "healthy" | "attention" | "critical";
}) {
  const dot =
    health === "healthy"
      ? "bg-emerald-500"
      : health === "attention"
      ? "bg-amber-500"
      : health === "critical"
      ? "bg-rose-500"
      : "bg-muted-foreground/40";
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      </div>
      <div className="mt-2 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ExportButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[12px] text-foreground/80 transition hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5 opacity-70" />
      {label}
    </button>
  );
}

const SECTION_LINKS = [
  { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/marketing/lead-sources", label: "Lead Sources", icon: ArrowUpRight },
  { to: "/marketing/seo", label: "SEO & Content", icon: Globe },
  { to: "/marketing/web-analytics", label: "Web Analytics", icon: Gauge },
  { to: "/marketing/call-tracking", label: "Call Tracking", icon: PhoneCall },
  { to: "/marketing/referrals", label: "Referrals", icon: HeartHandshake },
  { to: "/marketing/recruiting", label: "Recruiting", icon: UserPlus },
  { to: "/marketing/outreach", label: "Outreach", icon: Users2 },
  { to: "/marketing/reputation", label: "Reputation", icon: Star },
  { to: "/marketing/attribution", label: "Attribution & ROI", icon: Gauge },
  { to: "/marketing/state-growth", label: "State Growth", icon: MapPin },
];

export default function MarketingReports() {
  const intel = useMarketingIntelligence();
  const [activeView, setActiveView] = useState<string>("weekly");
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const visibleStates = useMemo(() => {
    const list = stateFilter ? intel.stateTrend.filter((s) => s.state === stateFilter) : intel.stateTrend;
    return list;
  }, [intel.stateTrend, stateFilter]);

  const totalRecent = useMemo(
    () => intel.stateTrend.reduce((sum, s) => sum + s.recent, 0),
    [intel.stateTrend],
  );
  const totalPrior = useMemo(
    () => intel.stateTrend.reduce((sum, s) => sum + s.prior, 0),
    [intel.stateTrend],
  );
  const momentumDelta = totalRecent - totalPrior;
  const momentumPct = totalPrior
    ? Math.round((momentumDelta / totalPrior) * 100)
    : totalRecent > 0
    ? 100
    : 0;

  const topSource = intel.bySource[0];
  const topState = intel.stateTrend[0];

  function buildCsv(): string {
    const lines = ["section,key,value"];
    lines.push(`totals,leads,${intel.totals.leads}`);
    lines.push(`totals,calls,${intel.totals.calls}`);
    lines.push(`totals,candidates,${intel.totals.candidates}`);
    lines.push(`velocity,leads_last_7,${intel.velocity.leadsLast7}`);
    lines.push(`velocity,leads_last_30,${intel.velocity.leadsLast30}`);
    lines.push(`velocity,qualified_rate_30d,${intel.velocity.qualifiedRate}%`);
    intel.bySource.forEach((s) =>
      lines.push(`source,${s.source},${s.count} (${s.share}% share · ${s.qualifiedRate}% qualified)`),
    );
    intel.stateTrend.forEach((s) =>
      lines.push(
        `state_momentum,${s.state},${s.recent} recent vs ${s.prior} prior (${s.delta >= 0 ? "+" : ""}${s.pct}%)`,
      ),
    );
    intel.referrals.byState.forEach((r) => lines.push(`referrals_by_state,${r.state},${r.count}`));
    intel.recruitingBySource.forEach((r) => lines.push(`recruiting_source,${r.source},${r.count}`));
    return lines.join("\n");
  }

  function downloadCsv() {
    const blob = new Blob([buildCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Marketing report exported to CSV");
  }

  function downloadPdf() {
    // Lightweight client-side fallback: print the page to PDF.
    toast.success("Opening print view for PDF export…");
    setTimeout(() => window.print(), 200);
  }

  function copyToBloom() {
    const summary = [
      `Blossom Marketing Weekly Pulse`,
      `Leads (7d): ${intel.velocity.leadsLast7} · Qualified rate (30d): ${intel.velocity.qualifiedRate}%`,
      `Top source: ${topSource ? `${topSource.source} (${topSource.share}%)` : "—"}`,
      `Top state: ${topState ? `${topState.state} (${topState.recent} new, ${topState.delta >= 0 ? "+" : ""}${topState.pct}%)` : "—"}`,
      `Inbound calls (24h): ${intel.calls.last24h} · Missed: ${intel.calls.missed}`,
      `Referrals total: ${intel.referrals.total} · Candidates: ${intel.totals.candidates}`,
    ].join("\n");
    navigator.clipboard.writeText(summary);
    toast.success("Copied weekly pulse for Bloom Growth");
  }

  return (
    <MktgPage
      title="Marketing Reports"
      subtitle="One operational view of growth, trust, and reach — exportable for L10 and executive reviews."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton label="CSV" icon={FileSpreadsheet} onClick={downloadCsv} />
          <ExportButton label="PDF" icon={FileText} onClick={downloadPdf} />
          <ExportButton label="Copy to Bloom" icon={Copy} onClick={copyToBloom} />
        </div>
      }
    >
      {/* Saved views */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Saved views
        </span>
        {SAVED_VIEWS.map((v) => {
          const active = v.id === activeView;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActiveView(v.id);
                toast.success(`View: ${v.label}`);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-card text-foreground/80 hover:bg-muted"
              }`}
              title={v.description}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile
          label="Leads · 7d"
          value={intel.velocity.leadsLast7}
          hint={`${intel.velocity.leadsLast30} in 30d`}
          health={intel.velocity.leadsLast7 > 0 ? "healthy" : "attention"}
        />
        <KpiTile
          label="Qualified rate · 30d"
          value={`${intel.velocity.qualifiedRate}%`}
          hint={`${intel.velocity.qualifiedLast30} qualified`}
          health={
            intel.velocity.qualifiedRate >= 40
              ? "healthy"
              : intel.velocity.qualifiedRate >= 20
              ? "attention"
              : "critical"
          }
        />
        <KpiTile
          label="Calls · 24h"
          value={intel.calls.last24h}
          hint={`${intel.calls.missed} missed`}
          health={intel.calls.missed === 0 ? "healthy" : intel.calls.missed < 3 ? "attention" : "critical"}
        />
        <KpiTile
          label="Candidates"
          value={intel.totals.candidates}
          hint={`${intel.referrals.total} referrals`}
        />
      </div>

      {/* Primary visual: state momentum */}
      <MktgCard title="State momentum">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted-foreground">
            Last 7 days vs the prior 7 days — the operational growth pulse by state.
          </p>
          <div className="flex items-center gap-2">
            <TrendBadge delta={momentumDelta} pct={momentumPct} />
            {stateFilter && (
              <button
                type="button"
                onClick={() => setStateFilter(null)}
                className="rounded-full border border-border/70 bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {visibleStates.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-6 text-center text-[13px] text-muted-foreground">
              No state activity in this view.
            </div>
          )}
          {visibleStates.map((s) => {
            const isActive = stateFilter === s.state;
            return (
              <button
                key={s.state}
                type="button"
                onClick={() => setStateFilter(isActive ? null : s.state)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/70 bg-card hover:border-border hover:bg-muted/50"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="w-10 text-[13px] font-medium text-foreground">{s.state}</span>
                <div className="flex-1">
                  <ShareBar value={Math.min(100, s.recent * 8)} tone="primary" />
                </div>
                <span className="w-16 text-right text-[12px] tabular-nums text-muted-foreground">
                  {s.recent} / {s.prior}
                </span>
                <TrendBadge delta={s.delta} pct={s.pct} />
              </button>
            );
          })}
        </div>
      </MktgCard>

      {/* Channel + referral row */}
      <div className="grid gap-3 md:grid-cols-2">
        <MktgCard title="Channel value">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-muted-foreground">Share of pipeline by source · qualified rate</p>
            <Link
              to="/marketing/attribution"
              className="inline-flex items-center gap-1 text-[12px] text-primary/80 hover:text-primary"
            >
              Attribution <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {intel.bySource.length === 0 && (
              <div className="text-[13px] text-muted-foreground">No channel data yet.</div>
            )}
            {intel.bySource.map((s) => (
              <div key={s.source} className="rounded-xl border border-border/70 bg-card px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground">{s.source}</span>
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">
                    {s.count} · {s.share}%
                  </span>
                </div>
                <div className="mt-1.5">
                  <ShareBar value={s.share} tone="primary" />
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  {s.qualifiedRate}% qualified
                </div>
              </div>
            ))}
          </div>
        </MktgCard>

        <MktgCard title="Referral trust by state">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-muted-foreground">Word-of-mouth growth signal</p>
            <Link
              to="/marketing/referrals"
              className="inline-flex items-center gap-1 text-[12px] text-primary/80 hover:text-primary"
            >
              Referrals <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {intel.referrals.byState.length === 0 && (
              <div className="text-[13px] text-muted-foreground">No referral activity yet.</div>
            )}
            {intel.referrals.byState.map((r) => (
              <div
                key={r.state}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="w-10 text-[13px] font-medium text-foreground">{r.state}</span>
                <div className="flex-1">
                  <ShareBar
                    value={Math.min(100, (r.count / Math.max(1, intel.referrals.total)) * 100)}
                    tone="accent"
                  />
                </div>
                <span className="w-10 text-right text-[12px] tabular-nums text-muted-foreground">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </MktgCard>
      </div>

      {/* Recruiting reach */}
      <MktgCard title="Recruiting reach">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted-foreground">Candidate sources fueling state staffing capacity</p>
          <Link
            to="/marketing/recruiting"
            className="inline-flex items-center gap-1 text-[12px] text-primary/80 hover:text-primary"
          >
            Recruiting Marketing <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {intel.recruitingBySource.length === 0 && (
            <div className="text-[13px] text-muted-foreground">No candidate activity yet.</div>
          )}
          {intel.recruitingBySource.map((r) => (
            <div key={r.source} className="rounded-xl border border-border/70 bg-card px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground">{r.source}</span>
                <span className="text-[12px] tabular-nums text-muted-foreground">{r.count}</span>
              </div>
            </div>
          ))}
        </div>
      </MktgCard>

      {/* AI insights */}
      <MktgCard title="AI report insights">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted-foreground">Insights for an executive read on this report.</p>
          <Sparkles className="h-4 w-4 text-primary/70" />
        </div>
        <div className="flex flex-wrap gap-2">
          <AIPrompt label="Summarize this report for L10" variant="card" />
          <AIPrompt label="Where is growth out of sync with staffing?" variant="card" />
          <AIPrompt label="Which state needs marketing attention?" variant="card" />
          <AIPrompt label="Which channel deserves more investment?" variant="card" />
          <AIPrompt label="Draft the weekly executive update" variant="card" />
        </div>
      </MktgCard>

      {/* Jump to */}
      <MktgCard title="Jump to a marketing area">
        <p className="mb-3 text-[12.5px] text-muted-foreground">
          All operational reports across the marketing footprint.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_LINKS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-border hover:bg-muted/40"
            >
              <span className="inline-flex items-center gap-2 text-[13px] text-foreground">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {s.label}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </MktgCard>
    </MktgPage>
  );
}