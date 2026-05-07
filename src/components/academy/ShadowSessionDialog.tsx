import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { logShadowSession, upsertProgress } from "@/lib/academy/api";
import { toast } from "sonner";

export function ShadowSessionDialog({
  open, onOpenChange, enrollmentId, moduleId, suggestedName, suggestedDept, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  enrollmentId: string; moduleId?: string;
  suggestedName?: string; suggestedDept?: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(suggestedName ?? "");
  const [dept, setDept] = useState(suggestedDept ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("2");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await logShadowSession({
      enrollment_id: enrollmentId, module_id: moduleId ?? null,
      shadowed_name: name || null, department: dept || null,
      session_date: date, hours: parseFloat(hours) || 0, notes: notes || null,
    });
    if (!error && moduleId) {
      await upsertProgress(enrollmentId, moduleId, { status: "in_progress", started_at: new Date().toISOString() });
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Shadow session logged"); onSaved(); onOpenChange(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log shadow session</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs text-muted-foreground">Person shadowed</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gary Frank" /></div>
          <div><Label className="text-xs text-muted-foreground">Department</Label><Input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Operations" /></div>
          <div><Label className="text-xs text-muted-foreground">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Hours</Label><Input type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          <div className="col-span-2"><Label className="text-xs text-muted-foreground">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What did you observe?" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Log session"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}