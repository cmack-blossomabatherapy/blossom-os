import { useMemo, useState } from "react";
import { LeadNameLink } from "@/contexts/LeadDrawerContext";
import {
  MessageSquare, Phone, Mail, Plus, Copy, Send, FileText, AlertCircle,
  ShieldCheck, List, Megaphone, Radio, Inbox, Sparkles,
} from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice } from "@/components/os/growth/GrowthPageShell";
import {
  IntakeSectionHeader, IntakePulseStrip, INTAKE_TONE, type PulseTileSpec,
} from "@/components/os/intake/IntakeVisuals";
import { cn } from "@/lib/utils";
import { useLeads } from "@/contexts/LeadsContext";
import { useIntakeCommsLive } from "@/hooks/useIntakeCommsLive";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Lead } from "@/data/leads";
import {
  sendLeadEmail, sendLeadSms, sendIntakePacket, sendMissingInfoReminder,
  sendVobUpdate, notifyCommunicationResult,
} from "@/lib/integrations/communications/communicationAdapters";
import { toast } from "sonner";
import {
  isLeadOutOfPipeline, isReadyToStartStage, canonicalFamilyLeadStage,
} from "@/lib/intake/intakeWorkflow";
import { IntakeStateFilterToggle, useIntakeStateFilter } from "@/lib/intake/intakeStateFilter";

type TemplateAction =
  | { kind: "email" } | { kind: "sms" } | { kind: "intake-packet" }
  | { kind: "missing-info" } | { kind: "vob-update" };

const TEMPLATES: { id: string; label: string; body: string; tone: keyof typeof INTAKE_TONE; actions: TemplateAction[] }[] = [
  { id: "first-contact", tone: "sky",     label: "First contact",                    body: "Hi {{parent}}, this is {{coordinator}} from Blossom ABA Therapy. Thanks for reaching out about {{child}} - I'd love to learn a bit more so we can get started. When is a good time for a quick 10-minute call today or tomorrow?", actions: [{ kind: "sms" }, { kind: "email" }] },
  { id: "packet-sent",   tone: "indigo",  label: "Intake packet",                    body: "Hi {{parent}}, sending over the intake packet now. It takes about 10 minutes to complete. Reply here if anything's unclear - happy to walk you through it.", actions: [{ kind: "intake-packet" }, { kind: "sms" }] },
  { id: "missing-info",  tone: "amber",   label: "Missing information reminder",     body: "Hi {{parent}}, quick follow-up: we still need {{missing}} before we can move {{child}}'s file to verification. Want me to send the form again or jump on a quick call?", actions: [{ kind: "missing-info" }, { kind: "email" }] },
  { id: "vob-update",    tone: "violet",  label: "Benefits Verification Update",     body: "Hi {{parent}}, your benefits verification is in progress. We're checking with {{payer}} and expect to hear back within a few business days. I'll reach out the moment we have an answer.", actions: [{ kind: "vob-update" }, { kind: "sms" }] },
  { id: "non-qualified", tone: "rose",    label: "Non-qualified message",            body: "Hi {{parent}}, thanks for trusting us with {{child}}'s care. Unfortunately {{reason}} means we aren't able to start services right now. If anything changes - coverage, location, or otherwise - please reach back out. We're rooting for you.", actions: [{ kind: "email" }] },
  { id: "handoff",       tone: "emerald", label: "Handoff to scheduling / clinical", body: "Hi {{parent}}, great news - {{child}} is approved and ready to begin. I'm handing your file to our scheduling and clinical team. {{nextOwner}} will reach out within 1 business day to schedule the first assessment.", actions: [{ kind: "email" }, { kind: "sms" }] },
];

function leadToContext(lead: Lead) {
  return {
    leadId: lead.id, phone: lead.phone, email: lead.email,
    parentName: lead.parentName, childName: lead.childName,
    state: lead.state, insurance: lead.primaryInsurance ?? lead.insurance ?? null,
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
  leadId: string; leadName: string;
  type: "call" | "sms" | "email" | "note";
  preview: string; timestamp: string; user?: string;
}
const ICONS = { call: Phone, sms: MessageSquare, email: Mail, note: MessageSquare } as const;
const TYPE_TONE: Record<CommRow["type"], keyof typeof INTAKE_TONE> = {
  call: "emerald", sms: "sky", email: "violet", note: "amber",
};

export default function ParentCommunication() {
  const { leads: allLeads, loading } = useLeads();
  const { matches } = useIntakeStateFilter();
  const leads = useMemo(() => allLeads.filter((l) => matches(l.state)), [allLeads, matches]);
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
    () => {
      const buckets = new Map<string, Lead[]>();
      const ordered: string[] = [];
      leads.forEach((l) => {
        if (!l.nextAction) return;
        if (isReadyToStartStage(l.status)) return;
        if (isLeadOutOfPipeline(l.status)) return;
        const bucket = canonicalFamilyLeadStage(l.status);
        if (!buckets.has(bucket)) { buckets.set(bucket, []); ordered.push(bucket); }
        buckets.get(bucket)!.push(l);
      });
      return ordered.flatMap((b) => buckets.get(b) ?? []).slice(0, 30);
    },
    [leads],
  );

  const pulseTiles: PulseTileSpec[] = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last24 = recent.filter((r) => now - new Date(r.timestamp).getTime() < dayMs);
    const calls = last24.filter((r) => r.type === "call").length;
    const sms = last24.filter((r) => r.type === "sms").length;
    const email = last24.filter((r) => r.type === "email").length;
    return [
      { key: "open",     label: "Open Follow-Ups", value: followUps.length, hint: "Leads with next action",  icon: Inbox,      tone: "indigo" },
      { key: "last24",   label: "Sent · 24h",      value: last24.length,    hint: "All channels",            icon: Sparkles,   tone: "primary" },
      { key: "calls",    label: "Calls · 24h",     value: calls,            hint: "Voice outreach",          icon: Phone,      tone: "emerald" },
      { key: "sms",      label: "SMS · 24h",       value: sms,              hint: "Text outreach",           icon: MessageSquare, tone: "sky" },
      { key: "email",    label: "Email · 24h",     value: email,            hint: "Email outreach",          icon: Mail,       tone: "violet" },
      { key: "tpl",      label: "Templates",       value: TEMPLATES.length, hint: "Ready to send",           icon: Megaphone,  tone: "amber" },
    ];
  }, [recent, followUps.length]);

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Intake Communications"
      description="Send calls, SMS, and email to families through Blossom OS - powered by CTM, Jivetel, and Mailchimp adapters."
      headerRight={<IntakeStateFilterToggle />}
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: List, to: "/leads" },
      ]}
    >
      <section>
        <IntakeSectionHeader icon={Radio} tone="violet" title="Comms Pulse" subtitle="Outreach across calls, SMS, and email in the last 24 hours." />
        <IntakePulseStrip tiles={pulseTiles} loading={loading} />
      </section>

      <section>
        <IntakeSectionHeader icon={MessageSquare} tone="sky" title={`Recent communications (${recent.length})`} subtitle="Synced from CTM, Jivetel, and Mailchimp." />
        {recent.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading communications..." : "Calls, SMS, and emails sent from Blossom OS or synced from CTM/Jivetel/Mailchimp will appear here."} />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden">
            {recent.map((r, i) => {
              const Icon = ICONS[r.type] ?? MessageSquare;
              const t = INTAKE_TONE[TYPE_TONE[r.type]];
              return (
                <div key={`${r.leadId}-${i}`} className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors">
                  <div className={cn("grid place-items-center h-7 w-7 rounded-lg shrink-0 mt-0.5", t.icon)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <LeadNameLink leadId={r.leadId} className="font-medium hover:underline truncate">{r.leadName}</LeadNameLink>
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
      </section>

      <section>
        <IntakeSectionHeader
          icon={Megaphone} tone="amber"
          title="Send from template"
          subtitle="Pick a lead, then send through Blossom OS. {{variables}} are personalized server-side."
        />
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
          {TEMPLATES.map((tpl) => {
            const t = INTAKE_TONE[tpl.tone];
            return (
              <article key={tpl.id} className={cn("group rounded-2xl border border-border/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm", t.bg)}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{tpl.label}</h3>
                  <Button
                    size="sm" variant="ghost" className="h-7"
                    onClick={() => { navigator.clipboard.writeText(tpl.body); toast.success("Template copied"); }}
                    title="Copy template text for reference"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-5">{tpl.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.actions.map((a, idx) => {
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
            );
          })}
        </div>
      </section>

      <section>
        <IntakeSectionHeader icon={Inbox} tone="indigo" title={`Required follow-ups (${followUps.length})`} subtitle="Leads with an open next action." />
        {followUps.length === 0 ? (
          <ReadyForDataNotice message="No follow-ups pending." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {followUps.map((l) => {
              const t = INTAKE_TONE.indigo;
              return (
                <div key={l.id} className={cn("rounded-xl border border-border/60 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm", t.bg)}>
                  <div className="flex items-center justify-between gap-2">
                    <LeadNameLink leadId={l.id} className="font-medium text-sm truncate hover:underline">{l.childName}</LeadNameLink>
                    <span className="text-[11px] text-muted-foreground shrink-0">{l.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{l.nextAction}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"
                      onClick={async () => notifyCommunicationResult(await sendLeadSms(leadToContext(l)))}>
                      <MessageSquare className="h-3 w-3 mr-1" /> SMS
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]"
                      onClick={async () => notifyCommunicationResult(await sendLeadEmail(leadToContext(l)))}>
                      <Mail className="h-3 w-3 mr-1" /> Email
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
              );
            })}
          </div>
        )}
      </section>
    </GrowthPageShell>
  );
}
