import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createActivity } from "@/lib/os/referrals/api";
import { ACTIVITY_TYPES, ACTIVITY_OUTCOMES } from "@/lib/os/referrals/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contactId?: string | null;
  companyId?: string | null;
  onLogged?: () => void;
}

export function LogActivityDialog({ open, onOpenChange, contactId, companyId, onLogged }: Props) {
  const [type, setType] = useState<string>("Call");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<string>("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await createActivity({
        contact_id: contactId ?? null,
        company_id: companyId ?? null,
        activity_type: type as never,
        subject: subject || null,
        notes: notes || null,
        outcome: (outcome || null) as never,
        activity_date: new Date().toISOString(),
        next_follow_up_at: next ? new Date(next).toISOString() : null,
        created_by: u.user?.id ?? null,
      });
      toast({ title: "Activity logged" });
      setSubject(""); setNotes(""); setOutcome(""); setNext("");
      onLogged?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Failed to log activity", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{ACTIVITY_OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} /></div>
          <div><Label>Next follow-up</Label><Input type="datetime-local" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Log Activity"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}