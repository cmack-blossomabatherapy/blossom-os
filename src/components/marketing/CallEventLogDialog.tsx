import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CALL_CATEGORIES, CALL_DISPOSITIONS,
  type CallCategory, type CallDisposition, type CallDirection,
  useMarketingCallEvents,
  type MarketingCallEventInsert,
} from "@/hooks/useMarketingCallEvents";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";
import { useMarketingSources } from "@/hooks/useMarketingSources";
import { useLeads } from "@/contexts/LeadsContext";

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogged?: () => void;
}

/**
 * Manual "log a call" dialog. Writes to marketing_call_events via
 * useMarketingCallEvents.createManualCallEvent.
 */
export function CallEventLogDialog({ open, onOpenChange, onLogged }: Props) {
  const { createManualCallEvent } = useMarketingCallEvents({ limit: 1 });
  const { campaigns } = useMarketingCampaigns();
  const { sources } = useMarketingSources();
  const { leads } = useLeads();

  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [sourceSystem, setSourceSystem] = useState<string>("manual");
  const [direction, setDirection] = useState<CallDirection>("inbound");
  const [status, setStatus] = useState<string>("new");
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [state, setState] = useState("");
  const [durationSec, setDurationSec] = useState<string>("");
  const [category, setCategory] = useState<CallCategory>("unknown");
  const [disposition, setDisposition] = useState<CallDisposition | typeof NONE>(NONE);
  const [leadId, setLeadId] = useState<string>(NONE);
  const [sourceId, setSourceId] = useState<string>(NONE);
  const [campaignId, setCampaignId] = useState<string>(NONE);
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setSourceSystem("manual");
    setDirection("inbound");
    setStatus("new");
    setCallerName("");
    setCallerPhone("");
    setState("");
    setDurationSec("");
    setCategory("unknown");
    setDisposition(NONE);
    setLeadId(NONE);
    setSourceId(NONE);
    setCampaignId(NONE);
    setTranscript("");
    setNotes("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const row: MarketingCallEventInsert = {
        source_system: sourceSystem || "manual",
        occurred_at: new Date(occurredAt).toISOString(),
        direction,
        status: status.trim() || null,
        caller_name: callerName.trim() || null,
        caller_phone: callerPhone.trim() || null,
        state: state.trim() ? state.trim().toUpperCase() : null,
        duration_seconds: durationSec ? Number(durationSec) : null,
        call_category: category,
        disposition: disposition === NONE ? null : disposition,
        lead_id: leadId === NONE ? null : leadId,
        source_id: sourceId === NONE ? null : sourceId,
        campaign_id: campaignId === NONE ? null : campaignId,
        transcript_summary: transcript.trim() || null,
        raw_payload: notes.trim() ? { notes: notes.trim() } : null,
      } as MarketingCallEventInsert;
      await createManualCallEvent(row);
      toast.success("Call logged");
      onLogged?.();
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log call");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log call</DialogTitle>
          <DialogDescription>
            Records a single row in <code>marketing_call_events</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Occurred at</Label>
            <Input type="datetime-local" className="h-9" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Source system</Label>
            <Input className="h-9" value={sourceSystem} onChange={(e) => setSourceSystem(e.target.value)} placeholder="manual, ctm, jivetel..." />
          </div>
          <div>
            <Label className="text-xs">Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as CallDirection)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">inbound</SelectItem>
                <SelectItem value="outbound">outbound</SelectItem>
                <SelectItem value="unknown">unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Input className="h-9" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="new, connected, missed..." />
          </div>
          <div>
            <Label className="text-xs">Caller name</Label>
            <Input className="h-9" value={callerName} onChange={(e) => setCallerName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Caller phone</Label>
            <Input className="h-9" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">State</Label>
            <Input className="h-9" value={state} onChange={(e) => setState(e.target.value)} placeholder="GA" maxLength={2} />
          </div>
          <div>
            <Label className="text-xs">Duration (seconds)</Label>
            <Input type="number" className="h-9" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CallCategory)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Disposition</Label>
            <Select value={disposition} onValueChange={(v) => setDisposition(v as CallDisposition | typeof NONE)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="none" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>(none)</SelectItem>
                {CALL_DISPOSITIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Lead (optional)</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="none" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>(none)</SelectItem>
                {leads.slice(0, 100).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.childName} / {l.parentName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Source (optional)</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="none" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>(none)</SelectItem>
                {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Campaign (optional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="none" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>(none)</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Transcript summary</Label>
            <Textarea rows={2} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Notes (stored in raw_payload.notes)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Log call"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}