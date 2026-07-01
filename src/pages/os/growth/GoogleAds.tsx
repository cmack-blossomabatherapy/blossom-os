import { TrendingUp } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";
import { SourceEventInbox } from "@/components/marketing/SourceEventInbox";
import { SourceOpsPanel } from "@/components/marketing/SourceOpsPanel";
import { useSourceStats } from "@/hooks/useSourceStats";

const GA_SOURCES = ["google_ads"];

export default function GoogleAds() {
  const s = useSourceStats(GA_SOURCES);
  const fmt = (n: number) => (n ? n.toString() : "-");
  const st = (n: number): "live" | "needs_data" => (n ? "live" : "needs_data");
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Google Ads"
      description="Search and performance max campaigns with keyword and conversion visibility."
    >
      <LeadSourceActions sourceLabel="Google Ads" sourceValue="Google Ads" integrationId="google_ads" sourcePage="google-ads" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Events (7d)" value={fmt(s.last7)} status={st(s.last7)} icon={TrendingUp} />
        <StatCard label="Events (30d)" value={fmt(s.last30)} status={st(s.last30)} />
        <StatCard label="Converted to leads" value={fmt(s.converted)} status={st(s.converted)} />
        <StatCard label="Awaiting review" value={fmt(s.newCount)} status={st(s.newCount)} />
      </div>
      <SourceOpsPanel
        sourceSlugs={["google_ads", "google ads"]}
        nextActionCopy="Import daily Google Ads campaign metrics (spend, clicks, conversions) under Campaigns."
      />
      <SourceEventInbox sourceSystems={GA_SOURCES} />
    </GrowthPageShell>
  );
}