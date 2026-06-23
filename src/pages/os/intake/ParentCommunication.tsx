import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Phone, Mail, Plus, Copy, Send, FileText, AlertCircle, ShieldCheck, List } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useIntakeCommsLive } from "@/hooks/useIntakeCommsLive";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Lead } from "@/data/leads";
import {
  sendLeadEmail,
  sendLeadSms,
  sendIntakePacket,
  sendMissingInfoReminder,
  sendVobUpdate,
  notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";
import { toast } from "sonner";
import {
  isLeadOutOfPipeline,
  isReadyToStartStage,
  canonicalFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";

type TemplateAction =
  | { kind: "email" }
  | { kind: "sms" }
  | { kind: "intake-packet" }
  | { kind: "missing-info" }
  | { kind: "vob-update" };

const TEMPLATES: { id: string; label: string; body: string; actions: TemplateAction[] }[] = [
  { id: "first-contact", label: "First contact", body: "Hi {{parent}}, this is {{coordinator}} from Blossom ABA Therapy. Thanks for reaching out about {{child}} - I'd love to learn a bit more so we can get started. When is a good time for a quick 10-minute call today or tomorrow?", actions: [{ kind: "sms" }, { kind: "email" }] },
  { id: "packet-sent", label: "Intake packet", body: "Hi {{parent}}, sending over the intake packet now. It takes about 10 minutes to complete. Reply here if anything's unclear - happy to walk you through it.", actions: [{ kind: "intake-packet" }, { kind: "sms" }] },
  { id: "missing-info", label: "Missing information reminder", body: "Hi {{parent}}, quick follow-up: we still need {{missing}} before we can move {{child}}'s file to verification. Want me to send the form again or jump on a quick call?", actions: [{ kind: "missing-info" }, { kind: "email" }] },
  { id: "vob-update", label: "Benefits Verification Update", body: "Hi {{parent}}, your benefits verification is in progress. We're checking with {{payer}} and expect to hear back within a few business days. I'll reach out the moment we have an answer.", actions: [{ kind: "vob-update" }, { kind: "sms" }] },
  { id: "non-qualified", label: "Non-qualified message", body: "Hi {{parent}}, thanks for trusting us with {{child}}'s care. Unfortunately {{reason}} means we aren't able to start services right now. If anything changes - coverage, location, or otherwise - please reach back out. We're rooting for you.", actions: [{ kind: "email" }] },
  { id: "handoff", label: "Handoff to scheduling / clinical", body: "Hi {{parent}}, great news - {{child}} is approved and ready to begin. I'm handing your file to our scheduling and clinical team. {{nextOwner}} will reach out within 1 business day to schedule the first assessment.", actions: [{ kind: "email" }, { kind: "sms" }] },
];

function leadToContext(lead: Lead) {
  return {
    leadId: lead.id,
    phone: lead.phone,
    email: lead.email,
    parentName: lead.parentName,
    childName: lead.childName,
    state: lead.state,
    insurance: lead.primaryInsurance ?? lead.insurance ?? null,
  };
}

async function runTemplateAction(action: TemplateAction, lead: Lead) {
  const ctx = leadToContext(lead);
  switch (action.kind) {
    case "email": return notifyCommunicationResult(await sendLeadEmail(ctx));
    case "sms": return notifyCommunicationResult(await sendLeadSms(ctx));
    case "intake-packet": return notifyCommunicationResult(await sendIntakePacket(ctx));
    case "missing-info": return notifyCommunicationResult(await sendMissingInfoReminder(ctx));
    case "vob-update": return notifyCommunicationResult(await sendVobUpdate(ctx));
  }
}

const ACTION_META: Record<TemplateAction["kind"], { label: string; icon: typeof Send }> = {
  email: { label: "Send Email", icon: Mail },
  sms: { label: "Send SMS", icon: MessageSquare },
  "intake-packet": { label: "Send Intake Packet", icon: FileText },
  "missing-info": { label: "Send Missing Info Reminder", icon: AlertCircle },
  "vob-update": { label: "Send Benefits Verification Update", icon: ShieldCheck },
};

interface CommRow {
  leadId: string;
  leadName: string;
  type: "call" | "sms" | "email" | "note";
  preview: string;
  timestamp: string;
  user?: string;
}

const ICONS = { call: Phone, sms: MessageSquare, email: Mail, note: MessageSquare } as const;

export default function ParentCommunication() {
  const { leads, loading } = useLeads();
  const { comms } = useIntakeCommsLive(100);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const leadNameById = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => map.set(l.id, l.childName));
    return map;
  }, [leads]);

  const recent = useMemo<CommRow[]>(() => {
    return comms.map((c) => ({
      leadId: c.lead_id,
      leadName: leadNameById.get(c.lead_id) ?? "Lead",
      type: c.communication_type,
      preview: c.preview,
      timestamp: c.created_at,
      user: c.logged_by_name ?? undefined,
    })).slice(0, 50);
  }, [comms, leadNameById]);

  const followUps = useMemo(
    // Export 88 — required follow-ups must be open-pipeline intake leads
    // with an active next action. Ready-to-Start, Non-Qualified, and
    // Cannot Reach outcomes are excluded via the canonical helper.
    () => {
      const buckets = new Map<string, Lead[]>();
      const ordered: string[] = [];
      leads.forEach((l) => {
        if (!l.nextAction) return;
        // Export 88 — isLeadOutOfPipeline already covers ready-to-start,
        // non-qualified, and cannot-reach outcomes. We also keep an explicit
        // isReadyToStartStage check for the older test contract.
        if (isReadyToStartStage(l.status)) return;
        if (isLeadOutOfPipeline(l.status)) return;
        const canonical = canonicalFamilyLeadStage(l.status);
        const bucket = canonical;
        if (!buckets.has(bucket)) { buckets.set(bucket, []); ordered.push(bucket); }
        buckets.get(bucket)!.push(l);
      });
      // Flatten in canonical pipeline order so the queue reads top-to-bottom.
      return ordered.flatMap((b) => buckets.get(b) ?? []).slice(0, 30);
    },
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Intake Communications"
      description="Send calls, SMS, and email to families through Blossom OS - powered by CTM, Jivetel, and Mailchimp adapters."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <Section title={`Recent communications (${recent.length})`}>
        {recent.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading communications..." : "Calls, SMS, and emails sent from Blossom OS or synced from CTM/Jivetel/Mailchimp will appear here."} />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
            {recent.map((r, i) => {
              const Icon = ICONS[r.type] ?? MessageSquare;
              return (
                <div key={`${r.leadId}-${i}`} className="flex items-start gap-3 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Link to={`/leads/${r.leadId}`} className="font-medium hover:underline truncate">{r.leadName}</Link>
                      <span className="text-[11px] text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.preview}</div>
                    {r.user && <div className="text-[10px] text-muted-foreground mt-0.5">sent by {r.user} via Blossom OS</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Send from template"
        description="Pick a lead, then send through Blossom OS. Variables in {{double_braces}} are personalized server-side."
      >
        <div className="mb-3 flex items-center gap-2">
          <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
            <SelectTrigger className="w-full max-w-sm h-9 text-sm">
              <SelectValue placeholder="Select a lead to enable sending" />
            </SelectTrigger>
            <SelectContent>
              {leads.slice(0, 100).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.childName}{l.parentName ? ` - ${l.parentName}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedLead && (
            <span className="text-[11px] text-muted-foreground">Select a lead to enable send actions.</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <article key={t.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{t.label}</h3>
                <Button
                  size="sm" variant="ghost" className="h-7"
                  onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Template copied"); }}
                  title="Copy template text for reference"
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{t.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.actions.map((a, idx) => {
                  const meta = ACTION_META[a.kind];
                  const Icon = meta.icon;
                  return (
                    <Button
                      key={idx}
                      size="sm"
                      variant="default"
                      className="h-7 text-[11px]"
                      disabled={!selectedLead}
                      onClick={() => selectedLead && runTemplateAction(a, selectedLead)}
                    >
                      <Icon className="h-3 w-3 mr-1" /> {meta.label}
                    </Button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title={`Required follow-ups (${followUps.length})`} description="Leads with an open next action.">
        {followUps.length === 0 ? (
          <ReadyForDataNotice message="No follow-ups pending." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {followUps.map((l) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/leads/${l.id}`} className="font-medium text-sm truncate hover:underline">{l.childName}</Link>
                  <span className="text-[11px] text-muted-foreground shrink-0">{l.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{l.nextAction}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={async () => notifyCommunicationResult(await sendLeadSms(leadToContext(l)))}>
                    <MessageSquare className="h-3 w-3 mr-1" /> Send SMS
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={async () => notifyCommunicationResult(await sendLeadEmail(leadToContext(l)))}>
                    <Mail className="h-3 w-3 mr-1" /> Send Email
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]"
                    onClick={async () => notifyCommunicationResult(await sendMissingInfoReminder(leadToContext(l)))}>
                    <AlertCircle className="h-3 w-3 mr-1" /> Missing Info
                  </Button>
                </div>
                <div className="mt-2">
                  <LeadActionPanel lead={l} compact sourcePage="parent-communication" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}