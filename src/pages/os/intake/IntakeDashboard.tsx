import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, TrendingUp, MessageSquare, AlertCircle, FileText, ShieldCheck, Plus, ArrowRightLeft, Flame } from "lucide-react";
import { GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { getLeadWorkflowRisk } from "@/lib/intake/intakeWorkflow";

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

  const actionRequired = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, risk: getLeadWorkflowRisk(l) }))
      .filter((r) => r.risk.level === "urgent" || r.risk.level === "risk")
      .sort((a, b) => (a.risk.level === "urgent" ? -1 : 1) - (b.risk.level === "urgent" ? -1 : 1))
      .slice(0, 6);
  }, [leads]);

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

      {actionRequired.length > 0 && (
        <Section title={`Action required (${actionRequired.length})`} description="Highest-risk leads operating in your queue right now.">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {actionRequired.map(({ lead, risk }) => (
              <div key={lead.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/leads/${lead.id}`} className="font-semibold hover:underline truncate">
                    {lead.childName}
                  </Link>
                  <Badge variant={risk.level === "urgent" ? "destructive" : "secondary"} className="text-[10px]">
                    <Flame className="h-3 w-3 mr-1" /> {risk.level}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{lead.status} · {lead.owner || "Unassigned"}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {risk.reasons.slice(0, 3).map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px] py-0">{r}</Badge>
                  ))}
                </div>
                <div className="mt-3">
                  <LeadActionPanel lead={lead} compact sourcePage="intake-dashboard" />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

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