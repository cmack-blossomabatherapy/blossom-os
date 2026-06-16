import { PhoneCall, ArrowUpRight } from "lucide-react";
import { GrowthPageShell, StatCard, ComingSoonNotice } from "@/components/os/growth/GrowthPageShell";

export default function LeadTrap() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="LeadTrap"
      description="Inbound web leads captured through Blossom forms and landing pages."
      actions={[{ label: "Open Patient Lifetime Journey", to: "/patient-journey", icon: ArrowUpRight }]}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Leads captured (7d)" value="—" status="needs_data" icon={PhoneCall} />
        <StatCard label="Conversion to intake" value="—" status="needs_data" />
        <StatCard label="Top landing page" value="—" status="needs_data" />
        <StatCard label="Spam blocked" value="—" status="needs_data" />
      </div>
      <ComingSoonNotice message="This page will connect source, campaign, call, and referral activity so Blossom can understand where every lead started and what happened next." />
    </GrowthPageShell>
  );
}