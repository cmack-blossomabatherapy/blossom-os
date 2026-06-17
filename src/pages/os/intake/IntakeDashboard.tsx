import { useMemo, useState } from "react";
import { ClipboardList, TrendingUp, MessageSquare, AlertCircle, FileText, ShieldCheck, Plus, ArrowRightLeft } from "lucide-react";
import { GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";

const PIPELINE_STAGES = new Set([
  "New Lead", "In Contact", "Sent Form", "Missing Information",
  "Form Received", "Sent to VOB",
]);
const MISSING_STAGES = new Set(["Missing Information"]);
const AWAITING_VOB_STAGES = new Set(["Sent to VOB"]);
const CONVERTED_STAGES = new Set(["VOB Completed"]);

export default function IntakeDashboard() {
  const { leads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const newReferrals = leads.filter((l) => l.status === "New Lead").length;
    const inPipeline = leads.filter((l) => PIPELINE_STAGES.has(l.status)).length;
    const missing = leads.filter((l) => MISSING_STAGES.has(l.status)).length;
    const followUps = leads.filter((l) => l.tasks?.some((t) => !t.completed)).length;
    const awaiting = leads.filter((l) => AWAITING_VOB_STAGES.has(l.status)).length;
    const converted = leads.filter((l) => {
      if (!CONVERTED_STAGES.has(l.status)) return false;
      const d = new Date(l.updatedAt).getTime();
      return Number.isFinite(d) && now - d <= thirtyDays;
    }).length;
    return { newReferrals, inPipeline, missing, followUps, awaiting, converted };
  }, [leads]);

  const fmt = (n: number) => (loading ? "…" : n.toLocaleString());

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Dashboard"
      description="Manage new referrals, parent communication, missing information, insurance checks, and movement from lead to active care."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Log parent contact", icon: MessageSquare, to: "/intake/parent-communication" },
        { label: "Request missing info", icon: AlertCircle, to: "/intake/missing-information" },
        { label: "Convert lead", icon: ArrowRightLeft, to: "/intake/lead-to-active" },
      ]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="New referrals" value={fmt(counts.newReferrals)} hint="Status: New Lead" status={counts.newReferrals ? "live" : "ready"} icon={ClipboardList} />
        <StatCard label="In pipeline" value={fmt(counts.inPipeline)} hint="New → Sent to VOB" status={counts.inPipeline ? "live" : "ready"} icon={TrendingUp} />
        <StatCard label="Missing info" value={fmt(counts.missing)} hint="Blocked leads" status={counts.missing ? "live" : "ready"} icon={AlertCircle} />
        <StatCard label="Open follow-ups" value={fmt(counts.followUps)} hint="Tasks open" status={counts.followUps ? "live" : "ready"} icon={MessageSquare} />
        <StatCard label="Awaiting benefits" value={fmt(counts.awaiting)} hint="Sent to VOB" status={counts.awaiting ? "live" : "ready"} icon={ShieldCheck} />
        <StatCard label="Converted (30d)" value={fmt(counts.converted)} hint="VOB Completed" status={counts.converted ? "live" : "ready"} icon={ArrowRightLeft} />
      </div>

      <Section title="Intake workspaces" description="Open any area to manage that part of intake.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <LinkCard title="New Referral Queue" description="Inbound referrals awaiting first contact." to="/intake/referral-queue" status="live" icon={ClipboardList} />
          <LinkCard title="Lead To Active Pipeline" description="Stage-by-stage view from lead through active care." to="/intake/lead-to-active" status="live" icon={TrendingUp} />
          <LinkCard title="Missing Information" description="Leads blocked by missing documents or details." to="/intake/missing-information" status="live" icon={AlertCircle} />
          <LinkCard title="Parent Communication" description="Open conversations and required follow-ups with families." to="/intake/parent-communication" status="live" icon={MessageSquare} />
          <LinkCard title="Intake Tasks" description="Personal task list for the intake team." to="/intake/tasks" status="live" icon={FileText} />
          <LinkCard title="Lead Benefits Cheat Sheets" description="Payer guidance to support eligibility and qualification." to="/intake/benefits-cheat-sheets" status="live" icon={ShieldCheck} />
        </div>
      </Section>

      {leads.length === 0 && (
        <ReadyForDataNotice message="This workspace is ready for live data. Create your first lead with Add Lead, or connect a source to populate intake queues automatically." />
      )}
      <NewLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaults={buildLeadSourceDefaults("Website", { sourcePage: "intake-dashboard" })}
      />
    </GrowthPageShell>
  );
}