import { Phone, MessageSquare, Mail, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { communicationsConfigStatus } from "@/lib/integrations/communications/communicationAdapters";
import { toast } from "sonner";

/**
 * Intake Communication setup - exposes the integration-specific fields
 * Admin needs to configure CTM, Jivetel, Mailchimp Email, and Mailchimp
 * SMS for Intake-side parent communication. All fields are placeholders
 * (no live credentials) until backend integration is wired.
 */
export function IntakeCommunicationSetupPanel() {
  const status = {
    ctm: communicationsConfigStatus.ctm(),
    jivetel: communicationsConfigStatus.jivetel(),
    mailchimpEmail: communicationsConfigStatus.mailchimpEmail(),
    mailchimpSms: communicationsConfigStatus.mailchimpSms(),
  };

  const StatusPill = ({ ok }: { ok: boolean }) =>
    ok ? (
      <Badge variant="outline" className="border-success/40 text-success bg-success/5 text-[10px]">Connected</Badge>
    ) : (
      <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-[10px]">Needs configuration</Badge>
    );

  const PlaceholderField = ({ label, placeholder }: { label: string; placeholder: string }) => (
    <div className="space-y-1">
      <Label className="text-[11px]">{label}</Label>
      <Input className="h-8 text-xs" placeholder={placeholder} disabled />
    </div>
  );

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Intake Communication Setup</h3>
          <p className="text-[11px] text-muted-foreground">
            Configure the outbound channels Intake uses to reach parents. Until configured, Intake actions return Needs configuration.
          </p>
        </div>
      </div>

      {/* CTM */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">CallTrackingMetrics (CTM)</h4>
          </div>
          <StatusPill ok={status.ctm} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PlaceholderField label="Account ID" placeholder="CTM account ID" />
          <PlaceholderField label="API key" placeholder="********" />
          <PlaceholderField label="Tracking number / source mapping" placeholder="e.g. (770) 555-0123 -> Intake GA" />
          <PlaceholderField label="Webhook URL" placeholder="https://blossom-os/webhooks/ctm" />
          <PlaceholderField label="Call recording status" placeholder="Enabled / Disabled" />
          <PlaceholderField label="Lead source attribution mapping" placeholder="CTM source -> Blossom lead source" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast("CTM test connection: Needs configuration")}>
            Test connection
          </Button>
        </div>
      </div>

      {/* Jivetel */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Jivetel (Outbound Calling)</h4>
          </div>
          <StatusPill ok={status.jivetel} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PlaceholderField label="API key" placeholder="********" />
          <PlaceholderField label="Outbound caller ID" placeholder="e.g. (770) 555-0123" />
          <PlaceholderField label="User / extension mapping" placeholder="Intake coordinator -> ext 201" />
          <PlaceholderField label="Call disposition mapping" placeholder="Jivetel disposition -> Blossom outcome" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast("Jivetel test outbound call: Needs configuration")}>
            Test outbound call
          </Button>
        </div>
      </div>

      {/* Mailchimp Email */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Mailchimp Email</h4>
          </div>
          <StatusPill ok={status.mailchimpEmail} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PlaceholderField label="API key" placeholder="********" />
          <PlaceholderField label="Audience / list ID" placeholder="Mailchimp list ID" />
          <PlaceholderField label="From name" placeholder="Blossom Intake" />
          <PlaceholderField label="From email" placeholder="intake@blossomaba.com" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Template mapping</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <PlaceholderField label="Intake packet" placeholder="Mailchimp template ID" />
            <PlaceholderField label="Missing information reminder" placeholder="Mailchimp template ID" />
            <PlaceholderField label="VOB update" placeholder="Mailchimp template ID" />
            <PlaceholderField label="General parent follow-up" placeholder="Mailchimp template ID" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast("Mailchimp Email test: Needs configuration")}>
            Send test email
          </Button>
        </div>
      </div>

      {/* Mailchimp SMS */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Mailchimp SMS</h4>
          </div>
          <StatusPill ok={status.mailchimpSms} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PlaceholderField label="API key" placeholder="********" />
          <PlaceholderField label="SMS program / campaign ID" placeholder="Mailchimp SMS program" />
          <PlaceholderField label="Consent / opt-out mapping" placeholder="Opt-out keyword -> Blossom flag" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Template mapping</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <PlaceholderField label="Missing information reminder" placeholder="Mailchimp SMS template ID" />
            <PlaceholderField label="Appointment confirmation" placeholder="Mailchimp SMS template ID" />
            <PlaceholderField label="Intake packet reminder" placeholder="Mailchimp SMS template ID" />
            <PlaceholderField label="General parent follow-up" placeholder="Mailchimp SMS template ID" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast("Mailchimp SMS test: Needs configuration")}>
            Send test SMS
          </Button>
        </div>
      </div>
    </section>
  );
}