import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";

const EVENT_TYPES = [
  "sent",
  "open",
  "click",
  "bounce",
  "unsubscribe",
  "reply",
  "manual_note",
] as const;
type EventType = (typeof EVENT_TYPES)[number];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCampaignId?: string | null;
  onLogged?: () => void;
}

/**
 * Manual "log an email event" dialog. Writes directly into
 * `marketing_email_events` — NOT `marketing_source_events`. Used by the
 * Email Marketing surface so users can hand-record activity while the
 * Mailchimp connector is still being provisioned.
 */
export function EmailEventLogDialog({ open, onOpenChange, defaultCampaignId, onLogged }: Props) {
  const { campaigns } = useMarketingCampaigns();
  const emailCampaigns = campaigns.filter(
    (c) => (c.channel ?? "").toLowerCase().includes("email") ||
           (c.channel ?? "").toLowerCase().includes("mailchimp"),
  );

  const [campaignId, setCampaignId] = useState<string>(defaultCampaignId ?? "");
  const [eventType, setEventType] = useState<EventType>("sent");
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [listName, setListName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCampaignId(defaultCampaignId ?? "");
    setEventType("sent");
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setRecipient("");
    setSubject("");
    setListName("");
    setNotes("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const row = {
        campaign_id: campaignId || null,
        event_type: eventType,
        occurred_at: new Date(occurredAt).toISOString(),
        recipient_email: recipient.trim() || null,
        subject: subject.trim() || null,
        list_name: listName.trim() || null,
        source_system: "manual",
        raw_payload: notes.trim() ? { notes: notes.trim() } : null,
      };
      const { error } = await supabase
        .from("marketing_email_events")
        .insert([row as never]);
      if (error) throw error;
      toast.success("Email event logged");
      onLogged?.();
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log email event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Log email event</DialogTitle>
          <DialogDescription>
            Records a single row in <code>marketing_email_events</code>. Useful for
            Mailchimp activity captured outside the connector.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="No campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">(no campaign)</SelectItem>
                {emailCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                {emailCampaigns.length === 0 && campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Event type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Occurred at</Label>
            <Input type="datetime-local" className="h-9" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Recipient email</Label>
            <Input className="h-9" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="parent@example.com" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Subject</Label>
            <Input className="h-9" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">List name</Label>
            <Input className="h-9" value={listName} onChange={(e) => setListName(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes / payload</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional free-form notes stored in raw_payload" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Log event"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}