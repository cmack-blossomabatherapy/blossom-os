import { Megaphone, ArrowUpRight } from "lucide-react";
import { GrowthPageShell, StatCard, ComingSoonNotice } from "@/components/os/growth/GrowthPageShell";

export default function FacebookAds() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Facebook Ads"
      description="Meta campaign performance, spend, and downstream lead quality."
      actions={[{ label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: ArrowUpRight }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active campaigns" value="—" status="needs_data" icon={Megaphone} />
        <StatCard label="Spend (30d)" value="—" status="needs_data" />
        <StatCard label="Leads (30d)" value="—" status="needs_data" />
        <StatCard label="Cost / lead" value="—" status="needs_data" />
      </div>
      <ComingSoonNotice message="This page will connect source, campaign, call, and referral activity so Blossom can understand where every lead started and what happened next." />
    </GrowthPageShell>
  );
}