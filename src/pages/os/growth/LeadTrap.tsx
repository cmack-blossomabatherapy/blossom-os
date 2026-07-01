import { PhoneCall } from "lucide-react";
import { GrowthPageShell, StatCard } from "@/components/os/growth/GrowthPageShell";
import { LeadSourceActions } from "@/components/marketing/LeadSourceActions";
import { SourceEventInbox } from "@/components/marketing/SourceEventInbox";
import { useSourceStats } from "@/hooks/useSourceStats";

const LEADTRAP_SOURCES = ["leadtrap"];

export default function LeadTrap() {
  const s = useSourceStats(LEADTRAP_SOURCES);
  const fmt = (n: number) => (n ? n.toString() : "—");
  const st = (n: number): "live" | "needs_data" => (n ? "live" : "needs_data");
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="LeadTrap"
      description="Inbound web leads captured through Blossom forms and landing pages."
    >
      <LeadSourceActions sourceLabel="LeadTrap" sourceValue="LeadTrap" integrationId="leadtrap" sourcePage="leadtrap" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Events (7d)" value={fmt(s.last7)} status={st(s.last7)} icon={PhoneCall} />
        <StatCard label="Events (30d)" value={fmt(s.last30)} status={st(s.last30)} />
        <StatCard label="Converted to leads" value={fmt(s.converted)} status={st(s.converted)} />
        <StatCard label="Awaiting review" value={fmt(s.newCount)} status={st(s.newCount)} />
      </div>
      <SourceEventInbox sourceSystems={LEADTRAP_SOURCES} />
    </GrowthPageShell>
  );
}