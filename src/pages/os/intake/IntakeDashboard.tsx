import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, TrendingUp, MessageSquare, AlertCircle, FileText, ShieldCheck, Plus, ArrowRightLeft, Flame, Users, MapPin, Signal, Clock, HeartHandshake, List } from "lucide-react";
import { GrowthPageShell, Section, StatCard, LinkCard, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { Badge } from "@/components/ui/badge";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";
import { buildLeadSourceDefaults } from "@/lib/leads/leadSourceConfig";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import {
  getLeadWorkflowRisk,
  isReadyToStartStage,
  canonicalFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";
import type { LeadStatus } from "@/data/leads";

// Family / Lead Workflow open-pipeline check — every canonical stage except
// the terminal "Ready to Start Services" (active patient ops start there).
const DISQUALIFIED_STATUSES = new Set<string>([
  "Non-Qualified", "Non-qualified Lead",
]);
const isOpenFamilyPipeline = (status: string) =>
  !isReadyToStartStage(status) &&
  !DISQUALIFIED_STATUSES.has(status);
const MISSING_STAGES = new Set(["Missing Information", "Intake Packet Follow Up"]);
const AWAITING_VOB_STAGES = new Set(["Sent to VOB", "Benefits Verification"]);
const LEAD_CAPTURED_STAGES = new Set(["New Lead", "Lead Captured"]);
const AGING_STAGES: LeadStatus[] = [
  "New Lead", "In Contact", "Sent Form", "Missing Information",
  "Form Received", "Sent to VOB", "VOB Completed",
];

export default function IntakeDashboard() {
  const { leads, loading } = useLeads();
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const newReferrals = leads.filter((l) => LEAD_CAPTURED_STAGES.has(l.status)).length;
    const inPipeline = leads.filter((l) => isOpenFamilyPipeline(l.status)).length;
    const missing = leads.filter((l) => MISSING_STAGES.has(l.status)).length;
    const followUps = leads.filter((l) => l.tasks?.some((t) => !t.completed)).length;
    const awaiting = leads.filter((l) => AWAITING_VOB_STAGES.has(l.status)).length;
    const converted = leads.filter((l) => {
      if (!isReadyToStartStage(l.status)) return false;
      const d = new Date(l.updatedAt).getTime();
      return Number.isFinite(d) && now - d <= thirtyDays;
    }).length;
    return { newReferrals, inPipeline, missing, followUps, awaiting, converted };
  }, [leads]);

  const fmt = (n: number) => (loading ? "..." : n.toLocaleString());

  const actionRequired = useMemo(() => {
    return leads
      .map((l) => ({ lead: l, risk: getLeadWorkflowRisk(l) }))
      .filter((r) => r.risk.level === "urgent" || r.risk.level === "risk")
      .sort((a, b) => (a.risk.level === "urgent" ? -1 : 1) - (b.risk.level === "urgent" ? -1 : 1))
      .slice(0, 6);
  }, [leads]);

  // Owner workload - count of in-pipeline leads per owner.
  const ownerWorkload = useMemo(() => {
    const map = new Map<string, { total: number; risk: number }>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.owner || "Unassigned";
      const r = getLeadWorkflowRisk(l).level;
      const cur = map.get(k) ?? { total: 0, risk: 0 };
      cur.total += 1;
      if (r === "risk" || r === "urgent") cur.risk += 1;
      map.set(k, cur);
    });
    return [...map.entries()]
      .map(([owner, v]) => ({ owner, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [leads]);

  const stateBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.state || "-";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (!isOpenFamilyPipeline(l.status)) return;
      const k = l.source || "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [leads]);

  const agingByStage = useMemo(() => {
    return AGING_STAGES.map((stage) => {
      const inStage = leads.filter((l) => l.status === stage);
      const oldest = inStage.reduce((m, l) => Math.max(m, l.daysInStage ?? 0), 0);
      const avg = inStage.length
        ? Math.round(inStage.reduce((s, l) => s + (l.daysInStage ?? 0), 0) / inStage.length)
        : 0;
      return { stage, count: inStage.length, avg, oldest };
    });
  }, [leads]);

  const handoffReady = useMemo(
    () => leads.filter((l) => isReadyToStartStage(l.status)).slice(0, 6),
    [leads],
  );

  const maxOwner = Math.max(1, ...ownerWorkload.map((o) => o.total));
  const maxState = Math.max(1, ...stateBreakdown.map(([, n]) => n));
  const maxSource = Math.max(1, ...sourceBreakdown.map(([, n]) => n));

  return (
    <GrowthPageShell
      eyebrow="Growth & Admissions"
      title="Intake Dashboard"
      description="Manage new referrals, parent communication, missing information, insurance checks, and movement from lead capture to ready to start services."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", onClick: () => setAddOpen(true) },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Lead Captured" value={fmt(counts.newReferrals)} hint="New family leads" status={counts.newReferrals ? "live" : "ready"} icon={ClipboardList} />
        <StatCard label="Open Family Pipeline" value={fmt(counts.inPipeline)} hint="Lead Captured -> Benefits Verification" status={counts.inPipeline ? "live" : "ready"} icon={TrendingUp} />
        <StatCard label="Intake Packet Follow Up" value={fmt(counts.missing)} hint="Blocked / missing info" status={counts.missing ? "live" : "ready"} icon={AlertCircle} />
        <StatCard label="Open follow-ups" value={fmt(counts.followUps)} hint="Tasks open" status={counts.followUps ? "live" : "ready"} icon={MessageSquare} />
        <StatCard label="Benefits Verification" value={fmt(counts.awaiting)} hint="Awaiting VOB" status={counts.awaiting ? "live" : "ready"} icon={ShieldCheck} />
        <StatCard label="Ready to Start (30d)" value={fmt(counts.converted)} hint="Reached handoff for active services" status={counts.converted ? "live" : "ready"} icon={ArrowRightLeft} />
      </div>

      <Section title="Intake workspaces" description="Open any area to manage that part of intake.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <LinkCard title="New Referral Queue" description="Inbound referrals awaiting first contact." to="/intake/referral-queue" status="live" icon={ClipboardList} />
          <LinkCard title="Lead To Active Pipeline" description="Stage-by-stage view from lead through ready to start services." to="/intake/lead-to-active" status="live" icon={TrendingUp} />
          <LinkCard title="Missing Information" description="Leads blocked by missing documents or details." to="/intake/missing-information" status="live" icon={AlertCircle} />
          <LinkCard title="Intake Communications" description="Send calls, SMS, and email to families through Blossom OS adapters." to="/intake/parent-communication" status="live" icon={MessageSquare} />
          <LinkCard title="Intake Tasks" description="Personal task list for the intake team." to="/intake/tasks" status="live" icon={FileText} />
          <LinkCard title="Lead Benefits Cheat Sheets" description="Payer guidance to support eligibility and qualification." to="/intake/benefits-cheat-sheets" status="live" icon={ShieldCheck} />
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Owner workload" description="In-pipeline leads per owner.">
          {ownerWorkload.length === 0 ? (
            <div className="text-xs text-muted-foreground">No active leads in pipeline.</div>
          ) : (
            <div className="space-y-2">
              {ownerWorkload.map((o) => (
                <div key={o.owner} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 truncate"><Users className="h-3.5 w-3.5 text-muted-foreground" /> {o.owner}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {o.total} {o.risk > 0 && <span className="text-amber-600">- {o.risk} at risk</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/70" style={{ width: `${(o.total / maxOwner) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Aging by stage" description="Average and oldest days in each stage.">
          <div className="space-y-1.5">
            {agingByStage.map((s) => (
              <div key={s.stage} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 text-sm">
                <span className="flex items-center gap-2 min-w-0"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> <span className="truncate">{s.stage}</span></span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {s.count} - avg {s.avg}d - oldest {s.oldest}d
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="State breakdown" description="Active in-pipeline leads by state.">
          {stateBreakdown.length === 0 ? (
            <div className="text-xs text-muted-foreground">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {stateBreakdown.map(([state, n]) => (
                <div key={state} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {state}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60" style={{ width: `${(n / maxState) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Lead source breakdown" description="Where active leads are coming from.">
          {sourceBreakdown.length === 0 ? (
            <div className="text-xs text-muted-foreground">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {sourceBreakdown.map(([src, n]) => (
                <div key={src} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><Signal className="h-3.5 w-3.5 text-muted-foreground" /> {src}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary/60" style={{ width: `${(n / maxSource) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title={`Handoff readiness (${handoffReady.length})`} description="Ready to Start Services - active patient operations begin here.">
        {handoffReady.length === 0 ? (
          <div className="text-xs text-muted-foreground">No families currently ready for handoff.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {handoffReady.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/leads/${lead.id}`} className="font-semibold hover:underline truncate">{lead.childName}</Link>
                  <Badge variant="outline" className="text-[10px]"><HeartHandshake className="h-3 w-3 mr-1" /> Ready</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{lead.state || "-"} - {lead.owner || "Unassigned"}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link to="/ops/authorizations" className="text-[11px] text-primary hover:underline">{"-> Authorizations"}</Link>
                  <Link to="/ops/scheduling" className="text-[11px] text-primary hover:underline">{"-> Scheduling"}</Link>
                  <Link to="/qa-team" className="text-[11px] text-primary hover:underline">{"-> Clinical"}</Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <div className="mt-1 text-xs text-muted-foreground">{lead.status} - {lead.owner || "Unassigned"}</div>
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