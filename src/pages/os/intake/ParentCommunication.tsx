import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Phone, Mail, Plus, Copy } from "lucide-react";
import { GrowthPageShell, ReadyForDataNotice, Section } from "@/components/os/growth/GrowthPageShell";
import { useLeads } from "@/contexts/LeadsContext";
import { useIntakeCommsLive } from "@/hooks/useIntakeCommsLive";
import { LeadActionPanel } from "@/components/intake/LeadActionPanel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TEMPLATES: { id: string; label: string; body: string }[] = [
  { id: "first-contact", label: "First contact", body: "Hi {{parent}}, this is {{coordinator}} from Blossom ABA Therapy. Thanks for reaching out about {{child}} — I'd love to learn a bit more so we can get started. When is a good time for a quick 10-minute call today or tomorrow?" },
  { id: "packet-sent", label: "Intake packet sent", body: "Hi {{parent}}, I've just sent the intake packet to {{email}}. It takes about 10 minutes to complete. Reply here if anything's unclear — happy to walk you through it." },
  { id: "missing-info", label: "Missing information reminder", body: "Hi {{parent}}, quick follow-up: we still need {{missing}} before we can move {{child}}'s file to verification. Want me to send the form again or jump on a quick call?" },
  { id: "vob-update", label: "VOB update", body: "Hi {{parent}}, your benefits verification is in progress. We're checking with {{payer}} and expect to hear back within a few business days. I'll reach out the moment we have an answer." },
  { id: "non-qualified", label: "Non-qualified message", body: "Hi {{parent}}, thanks for trusting us with {{child}}'s care. Unfortunately {{reason}} means we aren't able to start services right now. If anything changes — coverage, location, or otherwise — please reach back out. We're rooting for you." },
  { id: "handoff", label: "Handoff to scheduling / clinical", body: "Hi {{parent}}, great news — {{child}} is approved and ready to begin. I'm handing your file to our scheduling and clinical team. {{nextOwner}} will reach out within 1 business day to schedule the first assessment." },
];

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
    () => leads.filter((l) => !!l.nextAction && l.status !== "VOB Completed").slice(0, 30),
    [leads],
  );

  return (
    <GrowthPageShell
      eyebrow="Intake"
      title="Parent Communication"
      description="Recent family communication across phone, SMS, email, and notes — and the leads that need a follow-up."
      actions={[
        { label: "Add Lead", icon: Plus, variant: "default", to: "/leads?new=1" },
        { label: "Open Leads", icon: MessageSquare, to: "/leads" },
      ]}
    >
      <Section title={`Recent communications (${recent.length})`}>
        {recent.length === 0 ? (
          <ReadyForDataNotice message={loading ? "Loading communications…" : "No communications logged yet. Logged calls, SMS, and emails will appear here."} />
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
                    {r.user && <div className="text-[10px] text-muted-foreground mt-0.5">by {r.user}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Templates" description="Copy and personalize. Variables in {{double_braces}}.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <article key={t.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{t.label}</h3>
                <Button
                  size="sm" variant="ghost" className="h-7"
                  onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Template copied"); }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{t.body}</p>
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
                <div className="mt-2">
                  <LeadActionPanel lead={l} compact sourcePage="parent-communication" />
                  <Link to={`/patient-journey?leadId=${l.id}`} className="mt-2 inline-flex text-[11px] text-primary hover:underline">
                    Open Patient Lifetime Journey
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </GrowthPageShell>
  );
}