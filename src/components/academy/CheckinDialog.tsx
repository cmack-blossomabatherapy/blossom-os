import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { logCheckin, upsertProgress } from "@/lib/academy/api";
import { toast } from "sonner";

export function CheckinDialog({
  open, onOpenChange, enrollmentId, moduleId, suggestedWith, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  enrollmentId: string; moduleId?: string;
  suggestedWith?: string;
  onSaved: () => void;
}) {
  const [withName, setWithName] = useState(suggestedWith ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [actions, setActions] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await logCheckin({
      enrollment_id: enrollmentId, module_id: moduleId ?? null,
      with_name: withName || null, meeting_date: date,
      agenda: agenda || null, notes: notes || null, action_items: actions || null,
    });
    if (!error && moduleId) {
      await upsertProgress(enrollmentId, moduleId, { status: "completed", completed_at: new Date().toISOString() });
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Check-in logged"); onSaved(); onOpenChange(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log leadership check-in</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">With</Label><Input value={withName} onChange={(e) => setWithName(e.target.value)} placeholder="e.g. Chad Kaufman" /></div>
          <div><Label className="text-xs text-muted-foreground">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs text-muted-foreground">Agenda</Label><Input value={agenda} onChange={(e) => setAgenda(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs text-muted-foreground">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <div className="col-span-2"><Label className="text-xs text-muted-foreground">Action items</Label><Textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Log check-in"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}