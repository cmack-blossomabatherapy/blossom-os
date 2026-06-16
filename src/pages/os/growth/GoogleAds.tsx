import { TrendingUp, ArrowUpRight } from "lucide-react";
import { GrowthPageShell, StatCard, ComingSoonNotice } from "@/components/os/growth/GrowthPageShell";

export default function GoogleAds() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Google Ads"
      description="Search and performance max campaigns with keyword and conversion visibility."
      actions={[{ label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: ArrowUpRight }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active campaigns" value="—" status="needs_data" icon={TrendingUp} />
        <StatCard label="Spend (30d)" value="—" status="needs_data" />
        <StatCard label="Conversions (30d)" value="—" status="needs_data" />
        <StatCard label="Cost / conversion" value="—" status="needs_data" />
      </div>
      <ComingSoonNotice message="This page will connect source, campaign, call, and referral activity so Blossom can understand where every lead started and what happened next." />
    </GrowthPageShell>
  );
}