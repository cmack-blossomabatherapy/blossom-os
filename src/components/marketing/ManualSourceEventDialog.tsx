import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ManualSourceEventDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Source system slug ("leadtrap", "facebook_ads", ...) - required. */
  sourceSystem: string;
  /** Human label for toasts + defaults. */
  sourceLabel: string;
  /** Called after a successful insert. */
  onCreated?: () => void;
}

/**
 * Create a single marketing_source_events row by hand. Used from the
 * "Import Leads" action on every Marketing source page while the automated
 * connector (CTM, LeadTrap, Meta, Google) is being wired up. This is not a
 * placeholder: rows land in the real table and immediately show up in the
 * Lead Source Inbox and on Marketing KPI aggregates.
 */
export function ManualSourceEventDialog({
  open,
  onOpenChange,
  sourceSystem,
  sourceLabel,
  onCreated,
}: ManualSourceEventDialogProps) {
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState("form_submission");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [payload, setPayload] = useState("");
  const [campaignId, setCampaignId] = useState<string | "none">("none");
  const [occurredAt, setOccurredAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("marketing_campaigns")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) setCampaigns((data ?? []) as Array<{ id: string; name: string }>);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const canSave = useMemo(
    () => (name.trim() || phone.trim() || email.trim()) && !saving,
    [name, phone, email, saving],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const insert = {
        source_system: sourceSystem,
        event_type: eventType || "form_submission",
        caller_name: name.trim() || null,
        caller_phone: phone.trim() || null,
        caller_email: email.trim() || null,
        state: state.trim() || null,
        payload_summary: payload.trim() || null,
        campaign_id: campaignId === "none" ? null : campaignId,
        occurred_at: new Date(occurredAt).toISOString(),
        status: "new" as const,
        reviewed_by: userRes?.user?.id ?? null,
      };
      const { error } = await supabase.from("marketing_source_events").insert(insert);
      if (error) throw error;
      toast.success(`${sourceLabel} event captured`, {
        description: "Available in the Lead Source Inbox for review.",
      });
      onOpenChange(false);
      // Reset light fields but keep event type sticky.
      setName("");
      setPhone("");
      setEmail("");
      setState("");
      setPayload("");
      onCreated?.();
    } catch (e: any) {
      toast.error("Could not save event", { description: e?.message ?? "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log {sourceLabel} event</DialogTitle>
          <DialogDescription>
            Manually create a marketing source event. Lands in the Lead Source Inbox and
            flows into Marketing dashboards immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mse-event-type">Event type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="mse-event-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="form_submission">Form submission</SelectItem>
                  <SelectItem value="phone_call">Phone call</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mse-occurred">Occurred at</Label>
              <Input
                id="mse-occurred"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="mse-name">Name</Label>
            <Input id="mse-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mse-phone">Phone</Label>
              <Input id="mse-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <Label htmlFor="mse-email">Email</Label>
              <Input id="mse-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mse-state">State</Label>
              <Input id="mse-state" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="GA" />
            </div>
            <div>
              <Label htmlFor="mse-campaign">Campaign</Label>
              <Select value={campaignId} onValueChange={(v) => setCampaignId(v as any)}>
                <SelectTrigger id="mse-campaign"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="mse-payload">Payload summary</Label>
            <Textarea
              id="mse-payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Short description of what was submitted / said."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving..." : "Save event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}