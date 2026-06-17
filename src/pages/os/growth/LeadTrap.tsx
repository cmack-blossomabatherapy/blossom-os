import { PhoneCall } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";

export default function LeadTrap() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="LeadTrap"
      description="Inbound web leads captured through Blossom forms and landing pages."
    >
      <LeadSourceActions sourceLabel="LeadTrap" sourceValue="LeadTrap" integrationId="leadtrap" sourcePage="leadtrap" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Leads captured (7d)" value="—" status="needs_data" icon={PhoneCall} />
        <StatCard label="Conversion to intake" value="—" status="needs_data" />
        <StatCard label="Top landing page" value="—" status="needs_data" />
        <StatCard label="Spam blocked" value="—" status="needs_data" />
      </div>
    </GrowthPageShell>
  );
}