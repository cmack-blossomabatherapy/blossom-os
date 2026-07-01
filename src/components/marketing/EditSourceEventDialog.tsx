import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import type { LeadSourceEvent } from "@/lib/leads/leadSourceEvents";
import type { useMarketingSourceEvents } from "@/hooks/useMarketingSourceEvents";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: LeadSourceEvent | null;
  updateFields: ReturnType<typeof useMarketingSourceEvents>["updateFields"];
}

/**
 * Edit-details dialog for a marketing_source_events row. Allows Marketing
 * to fix source/campaign attribution + light PII after the fact.
 */
export function EditSourceEventDialog({ open, onOpenChange, event, updateFields }: Props) {
  const { sources } = useMarketingSources();
  const { campaigns } = useMarketingCampaigns();

  const [sourceId, setSourceId] = useState<string>("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [callerName, setCallerName] = useState<string>("");
  const [callerPhone, setCallerPhone] = useState<string>("");
  const [callerEmail, setCallerEmail] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    // best-effort: LeadSourceEvent doesn't expose row IDs, fall back to blank
    const anyEvent = event as unknown as Record<string, unknown>;
    setSourceId((anyEvent.sourceRowId as string) ?? "");
    setCampaignId((anyEvent.campaignId as string) ?? "");
    setState(event.state ?? "");
    setCallerName([event.parentFirstName, event.parentLastName].filter(Boolean).join(" "));
    setCallerPhone(event.phone ?? "");
    setCallerEmail(event.email ?? "");
    setSummary(event.summary ?? "");
  }, [event]);

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await updateFields(event.id, {
        source_id: sourceId || null,
        campaign_id: campaignId || null,
        state: state || null,
        caller_name: callerName || null,
        caller_phone: callerPhone || null,
        caller_email: callerEmail || null,
        payload_summary: summary || null,
      });
      toast.success("Source event updated");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit source details</DialogTitle>
          <DialogDescription>
            Reassign source / campaign attribution or correct contact details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label className="text-xs">Source</Label>
            <Select value={sourceId || "__none__"} onValueChange={(v) => setSourceId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="(unassigned)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(unassigned)</SelectItem>
                {sources.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Label className="text-xs">Campaign</Label>
            <Select value={campaignId || "__none__"} onValueChange={(v) => setCampaignId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="(no campaign)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">(no campaign)</SelectItem>
                {campaigns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Label className="text-xs">State</Label>
            <Input className="h-9" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label className="text-xs">Caller name</Label>
            <Input className="h-9" value={callerName} onChange={(e) => setCallerName(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label className="text-xs">Phone</Label>
            <Input className="h-9" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label className="text-xs">Email</Label>
            <Input className="h-9" value={callerEmail} onChange={(e) => setCallerEmail(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Payload summary</Label>
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          {event && (
            <details className="col-span-2 text-[11px] text-muted-foreground">
              <summary className="cursor-pointer">Raw payload</summary>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/40 p-2">
                {JSON.stringify(event, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}