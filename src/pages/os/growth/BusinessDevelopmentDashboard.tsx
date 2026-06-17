import { HeartHandshake, MessageSquare, Briefcase, Users, BarChart3, Plus, CalendarPlus, ArrowRightLeft } from "lucide-react";
import { GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";

export default function BusinessDevelopmentDashboard() {
  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Business Development Dashboard"
      description="Referral partner relationships, outreach activity, community growth, provider relationships, and follow-up accountability."
      actions={[
        { label: "Add referral partner", icon: Plus, variant: "default" },
        { label: "Log outreach", icon: MessageSquare },
        { label: "Schedule follow-up", icon: CalendarPlus },
        { label: "Handoff to Intake", icon: ArrowRightLeft },
      ]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Active partners" value="—" hint="No data yet" status="needs_data" icon={HeartHandshake} />
        <StatCard label="Outreach this week" value="—" hint="No data yet" status="needs_data" icon={MessageSquare} />
        <StatCard label="Follow-ups due" value="—" hint="No data yet" status="needs_data" icon={CalendarPlus} />
        <StatCard label="Open opportunities" value="—" hint="No data yet" status="needs_data" icon={Briefcase} />
        <StatCard label="New partners (30d)" value="—" hint="No data yet" status="needs_data" icon={Users} />
        <StatCard label="Conversion rate" value="—" hint="No data yet" status="needs_data" icon={BarChart3} />
      </div>

      <Section title="Workspaces" description="Open any area to manage relationships and activity.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <LinkCard title="Referral Partner CRM" description="All referral partners with owner, status, and last contact." to="/marketing/referral-crm" status="live" icon={HeartHandshake} />
          <LinkCard title="Outreach Pipeline" description="Active outreach with stage, owner, and next step." to="/business-development?tab=outreach" status="ready" icon={MessageSquare} />
          <LinkCard title="Follow-Up Tasks" description="Open follow-ups with due dates and owners." to="/business-development?tab=tasks" status="ready" icon={CalendarPlus} />
          <LinkCard title="Provider Relationships" description="Pediatricians, psychologists, and clinical partners." to="/business-development?tab=providers" status="ready" icon={Briefcase} />
          <LinkCard title="Community Relationships" description="Schools, support groups, advocacy organizations." to="/business-development?tab=community" status="ready" icon={Users} />
          <LinkCard title="Referral Source Reports" description="Volume, conversion, and quality by partner." to="/reports" status="live" icon={BarChart3} />
        </div>
      </Section>

      <ReadyForDataNotice message="This workspace is ready for live data. As outreach, partner CRM, and referral activity comes in, this dashboard will surface live partner health and the next best actions to grow the network." />
    </GrowthPageShell>
  );
}