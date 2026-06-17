import { ClipboardList, TrendingUp, MessageSquare, AlertCircle, FileText, ShieldCheck, Plus, ArrowRightLeft } from "lucide-react";
import { GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";

export default function IntakeDashboard() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Dashboard"
      description="Manage new referrals, parent communication, missing information, insurance checks, and movement from lead to active care."
      actions={[
        { label: "Claim referral", icon: Plus, variant: "default" },
        { label: "Log parent contact", icon: MessageSquare },
        { label: "Request missing info", icon: AlertCircle },
        { label: "Convert lead", icon: ArrowRightLeft },
      ]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="New referrals" value="—" hint="No data yet" status="needs_data" icon={ClipboardList} />
        <StatCard label="In pipeline" value="—" hint="No data yet" status="needs_data" icon={TrendingUp} />
        <StatCard label="Missing info" value="—" hint="No data yet" status="needs_data" icon={AlertCircle} />
        <StatCard label="Open follow-ups" value="—" hint="No data yet" status="needs_data" icon={MessageSquare} />
        <StatCard label="Awaiting benefits" value="—" hint="No data yet" status="needs_data" icon={ShieldCheck} />
        <StatCard label="Converted (30d)" value="—" hint="No data yet" status="needs_data" icon={ArrowRightLeft} />
      </div>

      <Section title="Intake workspaces" description="Open any area to manage that part of intake.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <LinkCard title="New Referral Queue" description="Inbound referrals awaiting first contact." to="/intake/referral-queue" status="ready" icon={ClipboardList} />
          <LinkCard title="Lead To Active Pipeline" description="Stage-by-stage view from lead through active care." to="/intake/lead-to-active" status="ready" icon={TrendingUp} />
          <LinkCard title="Missing Information" description="Leads blocked by missing documents or details." to="/intake/missing-information" status="ready" icon={AlertCircle} />
          <LinkCard title="Parent Communication" description="Open conversations and required follow-ups with families." to="/intake/parent-communication" status="ready" icon={MessageSquare} />
          <LinkCard title="Intake Tasks" description="Personal task list for the intake team." to="/intake/tasks" status="ready" icon={FileText} />
          <LinkCard title="Lead Benefits Cheat Sheets" description="Payer guidance to support eligibility and qualification." to="/intake/benefits-cheat-sheets" status="live" icon={ShieldCheck} />
        </div>
      </Section>

      <ReadyForDataNotice message="This workspace is ready for live data. As intake activity comes in, this dashboard will surface live queues, ownership, blockers, and the next action for every lead." />
    </GrowthPageShell>
  );
}