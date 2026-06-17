import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  HeartHandshake, MessageSquare, Briefcase, Users, BarChart3,
  Plus, CalendarPlus, ArrowRightLeft, ClipboardList, type LucideIcon,
} from "lucide-react";
import {
  GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice,
} from "@/components/os/growth/GrowthPageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabKey = "overview" | "partners" | "outreach" | "tasks" | "providers" | "community";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview",   label: "Overview",   icon: BarChart3 },
  { key: "partners",   label: "Partners",   icon: HeartHandshake },
  { key: "outreach",   label: "Outreach",   icon: MessageSquare },
  { key: "tasks",      label: "Tasks",      icon: ClipboardList },
  { key: "providers",  label: "Providers",  icon: Briefcase },
  { key: "community",  label: "Community",  icon: Users },
];

export default function BusinessDevelopmentDashboard() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = useMemo<TabKey>(() => {
    const t = params.get("tab") as TabKey | null;
    return TABS.some((x) => x.key === t) ? (t as TabKey) : "overview";
  }, [params]);

  const onTabChange = (next: string) => {
    const sp = new URLSearchParams(params);
    if (next === "overview") sp.delete("tab");
    else sp.set("tab", next);
    setParams(sp, { replace: true });
  };

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Business Development"
      description="Referral partner relationships, outreach activity, community growth, provider relationships, and follow-up accountability."
      actions={[
        { label: "Add referral partner", icon: Plus, variant: "default" },
        { label: "Log outreach", icon: MessageSquare },
        { label: "Schedule follow-up", icon: CalendarPlus },
        { label: "Handoff to Intake", icon: ArrowRightLeft },
      ]}
    >
      <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 h-auto flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
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
        </TabsContent>

        <TabsContent value="partners" className="mt-0">
          <TabPanel
            title="Referral Partner CRM"
            description="Manage every referral partner with owner, status, and last contact. The full CRM lives in Marketing."
            primaryAction={{ label: "Open Referral Partner CRM", onClick: () => navigate("/marketing/referral-crm") }}
          />
        </TabsContent>

        <TabsContent value="outreach" className="mt-0">
          <TabPanel
            title="Outreach Pipeline"
            description="Active outreach with stage, owner, and next step. Connect your outreach log to populate this view with live activity."
            primaryAction={{ label: "Log outreach" }}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <TabPanel
            title="Follow-Up Tasks"
            description="Open follow-ups with due dates and owners. Once outreach activity flows in, follow-ups will appear here automatically."
            primaryAction={{ label: "Schedule follow-up" }}
          />
        </TabsContent>

        <TabsContent value="providers" className="mt-0">
          <TabPanel
            title="Provider Relationships"
            description="Pediatricians, psychologists, and clinical partners that refer to Blossom. Add providers to begin tracking the relationship."
            primaryAction={{ label: "Add provider" }}
          />
        </TabsContent>

        <TabsContent value="community" className="mt-0">
          <TabPanel
            title="Community Relationships"
            description="Schools, support groups, and advocacy organizations Blossom partners with."
            primaryAction={{ label: "Add community partner" }}
          />
        </TabsContent>
      </Tabs>
    </GrowthPageShell>
  );
}

function TabPanel({
  title, description, primaryAction,
}: {
  title: string;
  description: string;
  primaryAction?: { label: string; onClick?: () => void };
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>
      <ReadyForDataNotice
        className="mt-6"
        message="This view is ready for live data. As partner and outreach activity is captured in Blossom OS, it will populate here automatically."
      />
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90 transition"
        >
          {primaryAction.label}
        </button>
      )}
    </div>
  );
}