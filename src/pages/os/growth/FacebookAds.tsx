import { Megaphone } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";
import { SourceEventInbox } from "@/components/marketing/SourceEventInbox";
import { useSourceStats } from "@/hooks/useSourceStats";

const FB_SOURCES = ["facebook_ads", "meta_ads"];

export default function FacebookAds() {
  const s = useSourceStats(FB_SOURCES);
  const fmt = (n: number) => (n ? n.toString() : "—");
  const st = (n: number): "live" | "needs_data" => (n ? "live" : "needs_data");
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Facebook Ads"
      description="Meta campaign performance, spend, and downstream lead quality."
    >
      <LeadSourceActions sourceLabel="Facebook Ads" sourceValue="Facebook Ads" integrationId="meta_ads" sourcePage="facebook-ads" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Events (7d)" value={fmt(s.last7)} status={st(s.last7)} icon={Megaphone} />
        <StatCard label="Events (30d)" value={fmt(s.last30)} status={st(s.last30)} />
        <StatCard label="Converted to leads" value={fmt(s.converted)} status={st(s.converted)} />
        <StatCard label="Awaiting review" value={fmt(s.newCount)} status={st(s.newCount)} />
      </div>
      <SourceEventInbox sourceSystems={FB_SOURCES} />
    </GrowthPageShell>
  );
}