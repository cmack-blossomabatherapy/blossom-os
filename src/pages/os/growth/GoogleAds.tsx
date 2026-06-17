import { TrendingUp } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";

export default function GoogleAds() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Google Ads"
      description="Search and performance max campaigns with keyword and conversion visibility."
    >
      <LeadSourceActions sourceLabel="Google Ads" sourceValue="Google Ads" utmSource="google" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active campaigns" value="—" status="needs_data" icon={TrendingUp} />
        <StatCard label="Spend (30d)" value="—" status="needs_data" />
        <StatCard label="Conversions (30d)" value="—" status="needs_data" />
        <StatCard label="Cost / conversion" value="—" status="needs_data" />
      </div>
    </GrowthPageShell>
  );
}