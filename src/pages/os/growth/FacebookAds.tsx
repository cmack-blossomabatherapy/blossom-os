import { Megaphone } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";

export default function FacebookAds() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Facebook Ads"
      description="Meta campaign performance, spend, and downstream lead quality."
    >
      <LeadSourceActions sourceLabel="Facebook Ads" sourceValue="Facebook Ads" utmSource="facebook" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active campaigns" value="—" status="needs_data" icon={Megaphone} />
        <StatCard label="Spend (30d)" value="—" status="needs_data" />
        <StatCard label="Leads (30d)" value="—" status="needs_data" />
        <StatCard label="Cost / lead" value="—" status="needs_data" />
      </div>
    </GrowthPageShell>
  );
}